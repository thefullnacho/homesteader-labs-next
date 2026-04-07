'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, Edit3, ArrowLeft, Package, Search } from 'lucide-react';
import Link from 'next/link';
import FieldStationLayout from '@/components/ui/FieldStationLayout';
import BrutalistBlock from '@/components/ui/BrutalistBlock';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import { getDB } from '@/lib/caloric-security/db';
import { putInventoryItem, deleteInventoryItem } from '@/lib/caloric-security/homesteadStore';
import { getCropById, getAllCrops } from '@/lib/tools/planting-calendar/cropLoader';
import { calculateItemDecay } from '@/lib/caloric-security/decayCalculations';
import type { InventoryItem } from '@/lib/caloric-security/types';

// ============================================================
// Inventory Management Page
//
// Full CRUD for InventoryItem records stored in Dexie.
// Reactive via useLiveQuery — updates reflect immediately
// on the Autonomy Dashboard without a page reload.
// ============================================================

interface FormState {
  cropId:             string;
  plantCount:         number;
  status:             InventoryItem['status'];
  preservationMethod: InventoryItem['preservationMethod'];
  dateHarvested:      string;  // ISO YYYY-MM-DD for <input type="date">
}

const BLANK_FORM: FormState = {
  cropId:             '',
  plantCount:         1,
  status:             'active',
  preservationMethod: 'fresh',
  dateHarvested:      '',
};

const STATUS_LABELS: Record<InventoryItem['status'], string> = {
  planned: 'Planned',
  active:  'Active',
  stored:  'Stored',
};

const PRESERVATION_LABELS: Record<NonNullable<InventoryItem['preservationMethod']>, string> = {
  fresh:          'Fresh',
  canned:         'Canned',
  dehydrated:     'Dehydrated',
  frozen:         'Frozen',
  'cold-storage': 'Cold Storage',
};

function phaseColor(phase: string) {
  if (phase === 'spoiled')  return 'text-red-400';
  if (phase === 'declining') return 'text-yellow-400';
  return 'opacity-40';
}

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

  const [formOpen,      setFormOpen]      = useState(false);
  const [editId,        setEditId]        = useState<string | null>(null);
  const [form,          setForm]          = useState<FormState>(BLANK_FORM);
  const [saving,        setSaving]        = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [statusFilter,  setStatusFilter]  = useState<InventoryItem['status'] | 'all'>('all');

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
    <FieldStationLayout stationId="HL_INVENTORY_V1.0">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-border-primary pb-6">
          <div>
            <Link
              href="/tools/caloric-security"
              className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase opacity-40 hover:opacity-80 transition-opacity mb-3"
            >
              <ArrowLeft size={10} /> Dashboard
            </Link>
            <Typography variant="h2" className="mb-1 uppercase tracking-tight font-mono">
              Food Inventory
            </Typography>
            <Typography variant="small" className="opacity-40 font-mono text-[11px] uppercase tracking-widest">
              Crop inventory // {inventory.length} items tracked
            </Typography>
          </div>
          <Button variant="primary" size="sm" onClick={openAdd} className="flex items-center gap-2">
            <Plus size={12} /> Add Item
          </Button>
        </div>

        {/* Search + filter bar */}
        {inventory.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
              <input
                type="text"
                placeholder="Search crops..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/20 border border-border-primary/30 focus:border-accent outline-none pl-8 pr-3 py-2 text-xs font-mono uppercase placeholder:opacity-30 transition-colors"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'planned', 'active', 'stored'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 text-[10px] font-mono uppercase border transition-colors ${
                    statusFilter === s
                      ? 'border-accent text-accent bg-accent/10'
                      : 'border-border-primary/20 opacity-40 hover:opacity-70'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {inventory.length === 0 && (
          <BrutalistBlock refTag="NO_ITEMS">
            <div className="py-12 flex flex-col items-center gap-4 opacity-40">
              <Package size={32} />
              <div className="text-center font-mono uppercase text-[11px]">
                <div>No items in inventory.</div>
                <div>Add crops to start tracking caloric security.</div>
              </div>
            </div>
          </BrutalistBlock>
        )}

        {/* Inventory table */}
        {inventory.length > 0 && (
          <BrutalistBlock refTag="INVENTORY_MANIFEST" className="overflow-x-auto">
            {filteredInventory.length === 0 && (
              <div className="py-8 text-center font-mono text-[10px] uppercase opacity-30">
                No items match &quot;{searchQuery}&quot; {statusFilter !== 'all' && `+ status: ${statusFilter}`}
              </div>
            )}
            {filteredInventory.length > 0 && (
            <table className="w-full text-[10px] font-mono uppercase">
              <thead>
                <tr className="border-b border-border-primary/20">
                  {['Crop', 'Plants', 'Status', 'Preservation', 'Shelf Life', 'Actions'].map(h => (
                    <th key={h} className="text-left py-2 pr-4 opacity-40 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary/10">
                {filteredInventory.map(item => {
                  const crop  = getCropById(item.cropId);
                  const decay = crop ? calculateItemDecay(item, crop) : null;

                  return (
                    <tr key={item.id} className="hover:bg-black/20 transition-colors group">
                      <td className="py-2 pr-4 font-bold">
                        <span className="mr-2">{crop?.icon}</span>
                        {crop?.name ?? item.cropId}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">{item.plantCount}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-1.5 py-0.5 border ${
                          item.status === 'active'  ? 'border-green-500/50 text-green-400'  :
                          item.status === 'stored'  ? 'border-blue-500/50 text-blue-400'    :
                          'border-border-primary/30 opacity-50'
                        }`}>
                          {STATUS_LABELS[item.status]}
                        </span>
                      </td>
                      <td className="py-2 pr-4 opacity-60">
                        {item.preservationMethod ? PRESERVATION_LABELS[item.preservationMethod] : '—'}
                      </td>
                      <td className={`py-2 pr-4 tabular-nums ${decay ? phaseColor(decay.phase) : 'opacity-40'}`}>
                        {decay && item.status === 'stored' ? (
                          <>
                            {Math.round(decay.daysRemaining)}d remaining
                            {' '}({(decay.modifier * 100).toFixed(0)}%)
                          </>
                        ) : '—'}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1 hover:text-accent transition-colors"
                            title="Edit"
                          >
                            <Edit3 size={11} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            )}
          </BrutalistBlock>
        )}

        {/* Unit assumption note */}
        <div className="text-[9px] font-mono uppercase opacity-20 text-center">
          Yield assumptions: bunches ~100g · bulbs ~40g · ears ~90g edible · heads ~300g
        </div>
      </div>

      {/* Add / Edit modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60">
          <BrutalistBlock className="w-full max-w-sm" refTag="ITEM_FORM">
            <div className="flex items-center justify-between mb-6">
              <Typography variant="h3" className="uppercase tracking-tight mb-0 text-base">
                {editId ? 'Edit Item' : 'Add to Inventory'}
              </Typography>
            </div>

            <div className="space-y-4">
              {/* Crop */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest mb-1 opacity-70">
                  Crop
                </label>
                <select
                  value={form.cropId}
                  onChange={e => setForm(f => ({ ...f, cropId: e.target.value }))}
                  className="w-full bg-black/30 border-2 border-border-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono uppercase"
                >
                  {allCrops.map(c => (
                    <option key={c.id} value={c.id} className="bg-background-primary">
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Plant count */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest mb-1 opacity-70">
                  Plant Count
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.plantCount}
                  onChange={e => setForm(f => ({ ...f, plantCount: parseInt(e.target.value) || 1 }))}
                  className="w-full bg-black/30 border-2 border-border-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest mb-1 opacity-70">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as InventoryItem['status'] }))}
                  className="w-full bg-black/30 border-2 border-border-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono uppercase"
                >
                  <option value="planned"  className="bg-background-primary">Planned</option>
                  <option value="active"   className="bg-background-primary">Active (in ground)</option>
                  <option value="stored"   className="bg-background-primary">Stored (harvested)</option>
                </select>
              </div>

              {/* Stored-only fields */}
              {form.status === 'stored' && (
                <>
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest mb-1 opacity-70">
                      Preservation Method
                    </label>
                    <select
                      value={form.preservationMethod}
                      onChange={e => setForm(f => ({ ...f, preservationMethod: e.target.value as InventoryItem['preservationMethod'] }))}
                      className="w-full bg-black/30 border-2 border-border-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono uppercase"
                    >
                      {(Object.keys(PRESERVATION_LABELS) as Array<keyof typeof PRESERVATION_LABELS>).map(k => (
                        <option key={k} value={k} className="bg-background-primary">
                          {PRESERVATION_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-widest mb-1 opacity-70">
                      Date Harvested
                    </label>
                    <input
                      type="date"
                      max={new Date().toISOString().slice(0, 10)}
                      value={form.dateHarvested}
                      onChange={e => setForm(f => ({ ...f, dateHarvested: e.target.value }))}
                      className="w-full bg-black/30 border-2 border-border-primary/40 focus:border-accent outline-none px-3 py-2 text-sm font-mono"
                    />
                    <p className="text-[9px] font-mono opacity-30 uppercase mt-1">
                      Used to calculate decay and shelf life remaining.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-8 pt-5 border-t border-border-primary/20">
              <Button variant="outline" size="sm" onClick={() => setFormOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                className="flex-1"
                disabled={saving || !form.cropId}
              >
                {saving ? 'Saving...' : editId ? 'Update' : 'Add to Inventory'}
              </Button>
            </div>
          </BrutalistBlock>
        </div>
      )}
    </FieldStationLayout>
  );
}
