'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2, Edit3, Search, X } from 'lucide-react';
import Link from 'next/link';
import DrawerBand from '@/components/tools/caloric-security/DrawerBand';
import { getDB } from '@/lib/caloric-security/db';
import { putInventoryItem, deleteInventoryItem } from '@/lib/caloric-security/homesteadStore';
import { getCropById, getAllCrops } from '@/lib/tools/planting-calendar/cropLoader';
import { calculateItemDecay } from '@/lib/caloric-security/decayCalculations';
import { useImportFromPlanting } from '@/lib/caloric-security/useImportFromPlanting';
import LogHarvestModal from '@/components/tools/caloric-security/LogHarvestModal';
import type { InventoryItem } from '@/lib/caloric-security/types';

// ============================================================
// Inventory Management Page — the stock book.
//
// Full CRUD for InventoryItem records stored in Dexie.
// Reactive via useLiveQuery — updates reflect immediately
// on the Autonomy Dashboard without a page reload.
// ============================================================

interface FormState {
  cropId:             string;
  plantCount:         number;
  weightLbs:          string;  // empty string = not set; string for input binding
  status:             InventoryItem['status'];
  preservationMethod: InventoryItem['preservationMethod'];
  dateHarvested:      string;  // ISO YYYY-MM-DD for <input type="date">
}

const BLANK_FORM: FormState = {
  cropId:             '',
  plantCount:         1,
  weightLbs:          '',
  status:             'active',
  preservationMethod: 'fresh',
  dateHarvested:      '',
};

const STATUS_LABELS: Record<InventoryItem['status'], string> = {
  planned: 'Planned',
  active:  'In the ground',
  stored:  'On the shelf',
};

const STATUS_TAG: Record<InventoryItem['status'], string> = {
  planned: 'border-slateblue text-slateblue',
  active:  'border-moss text-moss',
  stored:  'border-ink text-ink/80',
};

const PRESERVATION_LABELS: Record<NonNullable<InventoryItem['preservationMethod']>, string> = {
  fresh:          'Fresh',
  canned:         'Canned',
  dehydrated:     'Dehydrated',
  frozen:         'Frozen',
  'cold-storage': 'Cold storage',
};

const FIELD_LABEL = 'block font-mono text-[0.68rem] uppercase tracking-widest text-ink/60 mb-1';
const FIELD_INPUT = 'w-full px-3 py-2.5 bg-paper border-2 border-ink/40 focus:border-marker outline-none font-mono text-sm transition-colors placeholder:text-ink/40';
const BTN_GHOST   = 'px-4 py-2.5 border-2 border-ink bg-paper font-mono text-[0.7rem] font-bold uppercase tracking-wider hover:bg-kraft transition-colors';
const BTN_SOLID   = 'px-4 py-2.5 bg-ink text-paper border-2 border-ink font-mono text-[0.7rem] font-bold uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors disabled:opacity-60';

function phaseColor(phase: string) {
  if (phase === 'spoiled')   return 'text-rust';
  if (phase === 'declining') return 'text-marker';
  return 'text-ink/50';
}

const EMAIL_SESSION_KEY = 'hl_import_email_shown';

export default function InventoryPage() {
  const allCrops = getAllCrops();

  const inventory = useLiveQuery(
    async () => {
      const db = getDB();
      return db.inventory.toArray();
    },
    [],
    [] as InventoryItem[],
  );

  const { preview, confirm: confirmImport, dismiss } = useImportFromPlanting();
  const [importing,      setImporting]      = useState(false);
  const [importSuccess,  setImportSuccess]  = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailValue,     setEmailValue]     = useState('');
  const [emailConsent,   setEmailConsent]   = useState(false);
  const [emailSubmitting,setEmailSubmitting]= useState(false);
  const [emailSuccess,   setEmailSuccess]   = useState(false);

  const [showLogHarvest, setShowLogHarvest] = useState(false);
  const [formOpen,      setFormOpen]      = useState(false);
  const [editId,        setEditId]        = useState<string | null>(null);
  const [form,          setForm]          = useState<FormState>(BLANK_FORM);
  const [saving,        setSaving]        = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [statusFilter,  setStatusFilter]  = useState<InventoryItem['status'] | 'all'>('all');

  // Session-gated email modal after successful import
  useEffect(() => {
    if (importSuccess && !sessionStorage.getItem(EMAIL_SESSION_KEY)) {
      const t = setTimeout(() => {
        setShowEmailModal(true);
        sessionStorage.setItem(EMAIL_SESSION_KEY, 'true');
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [importSuccess]);

  async function handleImport() {
    setImporting(true);
    try {
      await confirmImport();
      setImportSuccess(true);
    } finally {
      setImporting(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailConsent) return;
    setEmailSubmitting(true);
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue, type: 'inventory-import' }),
      });
      setEmailSuccess(true);
      setTimeout(() => setShowEmailModal(false), 2500);
    } finally {
      setEmailSubmitting(false);
    }
  }

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const crop = getCropById(item.cropId);
      const name = (crop?.name ?? item.cropId).toLowerCase();
      const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [inventory, searchQuery, statusFilter]);

  function openAdd() {
    const firstCrop = allCrops[0];
    setForm({ ...BLANK_FORM, cropId: firstCrop?.id ?? '' });
    setEditId(null);
    setFormOpen(true);
  }

  function openEdit(item: InventoryItem) {
    setForm({
      cropId:             item.cropId,
      plantCount:         item.plantCount,
      weightLbs:          item.weightLbs != null ? item.weightLbs.toString() : '',
      status:             item.status,
      preservationMethod: item.preservationMethod ?? 'fresh',
      dateHarvested:      item.dateHarvested
        ? new Date(item.dateHarvested).toISOString().slice(0, 10)
        : '',
    });
    setEditId(item.id);
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.cropId) return;
    setSaving(true);
    try {
      const parsedWeight = parseFloat(form.weightLbs);
      const item: InventoryItem = {
        id:                 editId ?? crypto.randomUUID(),
        type:               'crop',
        cropId:             form.cropId,
        plantCount:         Math.max(1, form.plantCount),
        status:             form.status,
        preservationMethod: form.status === 'stored' ? form.preservationMethod : undefined,
        dateHarvested:      form.status === 'stored' && form.dateHarvested
          ? new Date(form.dateHarvested + 'T12:00:00')
          : undefined,
        weightLbs:          form.status === 'stored' && !isNaN(parsedWeight) && parsedWeight > 0
          ? parsedWeight
          : undefined,
        lastUpdated: new Date(),
      };
      await putInventoryItem(item);
      setFormOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this item from inventory?')) return;
    await deleteInventoryItem(id);
  }

  return (
    <>
      <DrawerBand
        drawer="The stock book"
        title="The stock book"
        sub={`Every crop the clocks count, ${inventory.length} line${inventory.length !== 1 ? 's' : ''} on the page.`}
        right={
          <>
            <button onClick={() => setShowLogHarvest(true)} className={BTN_GHOST}>
              Log harvest
            </button>
            <button onClick={openAdd} className={BTN_SOLID}>
              + Add a line
            </button>
          </>
        }
      />

      <section className="max-w-6xl mx-auto px-4 pt-10 pb-16 space-y-6">

        {/* Planting Calendar import banner */}
        {preview && preview.items.length > 0 && !importSuccess && (
          <div className="border-2 border-moss bg-paper px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 text-[0.92rem] leading-snug text-ink/85">
              <strong className="text-moss">
                {preview.items.length} crop{preview.items.length !== 1 ? 's' : ''}
              </strong>{' '}
              carried over from the planting calendar: {preview.cropNames.join(', ')}.
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={dismiss}
                className="font-mono text-[0.64rem] uppercase tracking-wider text-ink/45 hover:text-ink transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className={BTN_SOLID}
              >
                {importing ? 'Writing them in...' : 'Write them in'}
              </button>
            </div>
          </div>
        )}

        {importSuccess && (
          <p className="font-hand font-semibold text-moss text-xl -rotate-1">
            ✓ in the book as planned, the food clock has them now
          </p>
        )}

        {/* Search + filter bar */}
        {inventory.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                placeholder="Find a crop..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-paper border-2 border-ink/40 focus:border-marker outline-none font-mono text-sm transition-colors placeholder:text-ink/40"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'planned', 'active', 'stored'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 border-2 border-ink font-mono text-[0.68rem] uppercase tracking-wider transition-colors ${
                    statusFilter === s ? 'bg-ink text-paper' : 'bg-paper hover:bg-kraft'
                  }`}
                >
                  {s === 'all' ? 'All' : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {inventory.length === 0 && (
          <div className="border-2 border-dashed border-ink/40 p-10 text-center">
            <p className="font-display uppercase text-xl mb-2">A blank page</p>
            <p className="text-ink/70 max-w-md mx-auto">
              Nothing counted yet. Add a line, log a harvest, or carry crops over
              from the{' '}
              <Link href="/tools/planting-calendar/" className="underline underline-offset-4 hover:text-marker">
                planting calendar
              </Link>
              .
            </p>
          </div>
        )}

        {/* Inventory table */}
        {inventory.length > 0 && (
          <div className="card-paper grain overflow-hidden">
            {filteredInventory.length === 0 ? (
              <div className="py-10 text-center font-mono text-[0.72rem] uppercase tracking-wider text-ink/50 relative z-[2]">
                Nothing matches &quot;{searchQuery}&quot;
                {statusFilter !== 'all' && ` under ${STATUS_LABELS[statusFilter]}`}
              </div>
            ) : (
              <div className="ruled px-4 py-2 relative z-[2] overflow-x-auto">
                <table className="w-full font-mono text-[0.76rem] min-w-[560px]">
                  <thead>
                    <tr className="text-left uppercase tracking-widest text-[0.62rem] text-ink/55">
                      <th className="py-1.5 pr-3 font-semibold">Crop</th>
                      <th className="py-1.5 pr-3 font-semibold text-right">Plants</th>
                      <th className="py-1.5 pr-3 font-semibold">Status</th>
                      <th className="py-1.5 pr-3 font-semibold">Put up as</th>
                      <th className="py-1.5 pr-3 font-semibold">Shelf life</th>
                      <th className="py-1.5 font-semibold text-right">&nbsp;</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map(item => {
                      const crop  = getCropById(item.cropId);
                      const decay = crop ? calculateItemDecay(item, crop) : null;

                      return (
                        <tr key={item.id} className="h-[36px] group">
                          <td className="pr-3 font-semibold">
                            <span className="mr-2">{crop?.icon}</span>
                            {crop?.name ?? item.cropId}
                          </td>
                          <td className="pr-3 text-right tabular-nums">{item.plantCount}</td>
                          <td className="pr-3">
                            <span className={`text-[0.62rem] uppercase tracking-wide border px-1.5 py-0.5 whitespace-nowrap ${STATUS_TAG[item.status]}`}>
                              {STATUS_LABELS[item.status]}
                            </span>
                          </td>
                          <td className="pr-3 text-ink/60">
                            {item.preservationMethod ? PRESERVATION_LABELS[item.preservationMethod] : '—'}
                          </td>
                          <td className={`pr-3 tabular-nums whitespace-nowrap ${decay ? phaseColor(decay.phase) : 'text-ink/50'}`}>
                            {decay && item.status === 'stored' ? (
                              decay.phase === 'spoiled'
                                ? 'spoiled, pull it'
                                : `${Math.round(decay.daysRemaining)} d left (${(decay.modifier * 100).toFixed(0)}%)`
                            ) : '—'}
                          </td>
                          <td className="text-right">
                            <span className="inline-flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEdit(item)}
                                className="p-1 hover:text-marker transition-colors"
                                title="Edit"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1 hover:text-rust transition-colors"
                                title="Remove"
                              >
                                <Trash2 size={12} />
                              </button>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Unit assumption note */}
        <p className="font-mono text-[0.64rem] uppercase tracking-widest text-ink/45 text-center">
          Yield assumptions: bunches ~100 g · bulbs ~40 g · ears ~90 g edible · heads ~300 g
        </p>
      </section>

      {/* Log Harvest modal */}
      {showLogHarvest && (
        <LogHarvestModal onClose={() => setShowLogHarvest(false)} />
      )}

      {/* Post-import email modal */}
      {showEmailModal && createPortal(
        <div className="fixed inset-0 bg-ink/70 flex items-center justify-center p-4 z-[100]">
          <div className="card-paper grain w-full max-w-sm">
            <div className="flex justify-between items-center px-5 py-3 border-b-2 border-ink relative z-[2]">
              <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em]">
                Rotation reminders
              </span>
              <button onClick={() => setShowEmailModal(false)} aria-label="Close" className="hover:text-marker">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 relative z-[2]">
              {emailSuccess ? (
                <div className="py-6 text-center">
                  <p className="font-hand font-semibold text-moss text-3xl -rotate-1">✓ on the list</p>
                  <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-wider text-ink/55">
                    We&apos;ll write when it&apos;s time to rotate stock.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[0.95rem] text-ink/80 leading-snug mb-5">
                    A monthly note when your canned and frozen goods get close to
                    their shelf-life limit. Nothing else.
                  </p>
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <input
                      type="email"
                      required
                      placeholder="homesteader@example.com"
                      value={emailValue}
                      onChange={e => setEmailValue(e.target.value)}
                      className={FIELD_INPUT}
                    />
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emailConsent}
                        onChange={e => setEmailConsent(e.target.checked)}
                        className="mt-1 accent-marker"
                        required
                      />
                      <span className="font-mono text-[0.64rem] uppercase tracking-wide text-ink/60 leading-tight">
                        Send me preservation reminders for my inventory. Unsubscribe anytime.
                      </span>
                    </label>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowEmailModal(false)} className={`${BTN_GHOST} flex-1`}>
                        Skip
                      </button>
                      <button
                        type="submit"
                        disabled={!emailConsent || emailSubmitting}
                        className={`${BTN_SOLID} flex-1`}
                      >
                        {emailSubmitting ? 'Signing you up...' : 'Sign me up'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add / Edit modal */}
      {formOpen && createPortal(
        <div className="fixed inset-0 bg-ink/70 flex items-end sm:items-center justify-center p-4 z-[100]">
          <div className="card-paper grain w-full max-w-sm">
            <div className="flex justify-between items-center px-5 py-3 border-b-2 border-ink relative z-[2]">
              <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.18em]">
                {editId ? 'Correct the line' : 'Add a line'}
              </span>
              <button onClick={() => setFormOpen(false)} aria-label="Close" className="hover:text-marker">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 relative z-[2] space-y-4">
              {/* Crop */}
              <div>
                <label className={FIELD_LABEL}>Crop</label>
                <select
                  value={form.cropId}
                  onChange={e => setForm(f => ({ ...f, cropId: e.target.value }))}
                  className={FIELD_INPUT}
                >
                  {allCrops.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Plant count */}
              <div>
                <label className={FIELD_LABEL}>Plant count</label>
                <input
                  type="number"
                  min={1}
                  value={form.plantCount}
                  onChange={e => setForm(f => ({ ...f, plantCount: parseInt(e.target.value) || 1 }))}
                  className={FIELD_INPUT}
                />
              </div>

              {/* Status */}
              <div>
                <label className={FIELD_LABEL}>Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as InventoryItem['status'] }))}
                  className={FIELD_INPUT}
                >
                  <option value="planned">Planned</option>
                  <option value="active">In the ground</option>
                  <option value="stored">On the shelf (harvested)</option>
                </select>
              </div>

              {/* Stored-only fields */}
              {form.status === 'stored' && (
                <>
                  <div>
                    <label className={FIELD_LABEL}>
                      Weight (lbs) <span className="text-ink/45 normal-case">[optional]</span>
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="e.g. 5.5"
                      value={form.weightLbs}
                      onChange={e => setForm(f => ({ ...f, weightLbs: e.target.value }))}
                      className={FIELD_INPUT}
                    />
                    <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-wide text-ink/50">
                      What the scale said beats the plant-count estimate.
                    </p>
                  </div>

                  <div>
                    <label className={FIELD_LABEL}>Preservation method</label>
                    <select
                      value={form.preservationMethod}
                      onChange={e => setForm(f => ({ ...f, preservationMethod: e.target.value as InventoryItem['preservationMethod'] }))}
                      className={FIELD_INPUT}
                    >
                      {(Object.keys(PRESERVATION_LABELS) as Array<keyof typeof PRESERVATION_LABELS>).map(k => (
                        <option key={k} value={k}>
                          {PRESERVATION_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={FIELD_LABEL}>Date harvested</label>
                    <input
                      type="date"
                      max={new Date().toISOString().slice(0, 10)}
                      value={form.dateHarvested}
                      onChange={e => setForm(f => ({ ...f, dateHarvested: e.target.value }))}
                      className={FIELD_INPUT}
                    />
                    <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-wide text-ink/50">
                      Sets the decay clock and shelf life remaining.
                    </p>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-3 border-t-2 border-ink">
                <button onClick={() => setFormOpen(false)} className={`${BTN_GHOST} flex-1`}>
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.cropId}
                  className={`${BTN_SOLID} flex-1`}
                >
                  {saving ? 'Writing it in...' : editId ? 'Save the line' : 'Write it in'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
