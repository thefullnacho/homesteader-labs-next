"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { Stamp } from "@/components/field/kit";

function generateReqId() {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REQ-${date}-${random}`;
}

export default function RequisitionPage() {
  const {
    items,
    totalItems,
    totalPrice,
    removeFromCart,
    updateQuantity,
    clearCart,
    isRequisitionSubmitted,
    setIsRequisitionSubmitted,
  } = useCart();

  // Generated after mount: Math.random() during SSR would mismatch hydration
  const [reqId, setReqId] = useState("");
  useEffect(() => setReqId(generateReqId()), []);
  const [formData, setFormData] = useState({
    callsign: "",
    email: "",
    gridSquare: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsRequisitionSubmitted(true);
    setIsSubmitting(false);
  };

  const handleClear = () => {
    if (showConfirmClear) {
      clearCart();
      setShowConfirmClear(false);
    } else {
      setShowConfirmClear(true);
      setTimeout(() => setShowConfirmClear(false), 3000);
    }
  };

  const status = isRequisitionSubmitted
    ? { stamp: "Filed", color: "text-moss" }
    : items.length === 0
      ? { stamp: "Blank", color: "text-slateblue" }
      : { stamp: "Draft", color: "text-rust" };

  return (
    <>
      {/* Header band */}
      <section className="bg-kraft grain border-b-2 border-ink relative">
        <div className="max-w-5xl mx-auto px-4 pt-10 pb-10 relative z-[2]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] uppercase tracking-[0.18em] text-ink/60 mb-5">
            <Link href="/shop/" className="hover:text-marker transition-colors">
              The Catalog
            </Link>
            <span>/</span>
            <span>Requisition Form</span>
            <span className="ml-auto">Form no: {reqId || "—"}</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            <Stamp color={status.color}>{status.stamp}</Stamp>
          </div>
          <h1 className="font-display uppercase text-3xl sm:text-5xl leading-[0.98] text-balance">
            The requisition
          </h1>
          <p className="mt-4 text-lg md:text-xl leading-relaxed max-w-2xl text-ink/85 italic">
            A mail-order form, the old way. File it, and payment instructions
            arrive by email within a day.
          </p>
        </div>
      </section>

      {isRequisitionSubmitted ? (
        /* Filed receipt */
        <div className="max-w-3xl mx-auto px-4 pt-12 pb-12">
          <div className="card-paper grain p-6 md:p-8">
            <div className="relative z-[2]">
              <div className="flex items-start justify-between gap-4 border-b-2 border-ink pb-4 mb-4">
                <div>
                  <h2 className="font-display uppercase text-2xl leading-tight">
                    Requisition filed
                  </h2>
                  <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink/60 mt-2">
                    Form no: {reqId}
                  </p>
                </div>
                <Stamp color="text-moss" rotate="3deg" className="text-sm shrink-0">
                  Filed
                </Stamp>
              </div>

              <dl className="mb-4">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between gap-3 py-2 border-b border-dotted border-ink/40 font-mono text-sm"
                  >
                    <dt>
                      {item.product.name}{" "}
                      <span className="text-ink/50">× {item.quantity}</span>
                    </dt>
                    <dd>${(item.product.price * item.quantity).toFixed(2)}</dd>
                  </div>
                ))}
                <div className="flex justify-between items-baseline pt-3 font-mono uppercase text-[0.72rem] tracking-wider">
                  <dt>Total</dt>
                  <dd className="font-display normal-case text-2xl tracking-normal">
                    ${totalPrice.toFixed(2)}
                  </dd>
                </div>
              </dl>

              <p className="text-[0.98rem] text-ink/85 leading-snug mb-2">
                Payment instructions go out by email within 24 hours.
              </p>
              <p className="font-hand font-semibold text-marker text-xl rotate-[-1deg] mb-6">
                keep the form number.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={clearCart}
                  className="bg-ink text-paper px-5 py-3 border-2 border-ink font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors"
                >
                  Start a new form
                </button>
                <Link
                  href="/shop/"
                  className="px-5 py-3 border-2 border-ink bg-paper font-mono text-[0.78rem] uppercase tracking-wider hover:bg-kraft transition-colors"
                >
                  Back to the catalog
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : items.length === 0 ? (
        /* Blank form */
        <div className="max-w-3xl mx-auto px-4 pt-12 pb-12">
          <div className="card-paper grain p-8 md:p-10 text-center">
            <div className="relative z-[2]">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-ink/60 mb-2">
                Nothing on the form
              </p>
              <h2 className="font-display uppercase text-2xl leading-tight mb-3">
                The form is blank
              </h2>
              <p className="text-[0.98rem] text-ink/80 leading-snug max-w-md mx-auto mb-6">
                Browse the catalog and add equipment. It shows up here as line
                items, ready to file.
              </p>
              <Link
                href="/shop/"
                className="inline-block bg-ink text-paper px-5 py-3 border-2 border-ink font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors"
              >
                Open the catalog →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Active form */
        <div className="max-w-5xl mx-auto px-4 pt-12 pb-12">
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 items-start mb-10">
            {/* Line items ledger */}
            <div className="card-paper grain">
              <div className="relative z-[2]">
                <div className="border-b-2 border-ink px-4 py-2 flex items-center justify-between gap-3">
                  <span className="font-mono text-[0.68rem] font-bold tracking-[0.18em] uppercase">
                    Line items ({totalItems})
                  </span>
                  <button
                    onClick={handleClear}
                    className={`font-mono text-[0.66rem] uppercase tracking-wider transition-colors ${
                      showConfirmClear
                        ? "bg-rust text-paper px-2 py-1"
                        : "text-rust underline decoration-rust decoration-2 underline-offset-4 hover:text-ink"
                    }`}
                  >
                    {showConfirmClear ? "Click again to clear" : "Clear the form"}
                  </button>
                </div>

                <ul className="px-4">
                  {items.map((item) => (
                    <li
                      key={item.product.id}
                      className="py-4 border-b border-dotted border-ink/40 last:border-b-0"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="font-bold leading-tight">{item.product.name}</p>
                          <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-ink/55 mt-1">
                            {item.product.id} · {item.product.category} · $
                            {item.product.price.toFixed(2)} each
                          </p>
                          {item.product.affiliate && (
                            <p className="font-mono text-[0.66rem] uppercase tracking-wide text-ink/60 bg-kraft border border-ink/40 px-1.5 py-0.5 mt-2 inline-block">
                              External fulfillment · affiliate link
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="font-mono text-rust hover:text-ink transition-colors px-1 leading-none text-lg"
                          aria-label={`Remove ${item.product.name} from the form`}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-7 h-7 border-2 border-ink font-mono leading-none hover:bg-ink hover:text-paper transition-colors"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-mono text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-7 h-7 border-2 border-ink font-mono leading-none hover:bg-ink hover:text-paper transition-colors"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-mono font-bold">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Totals + requestor */}
            <div className="space-y-6">
              <aside className="card-paper grain">
                <div className="relative z-[2]">
                  <div className="border-b-2 border-ink px-4 py-2">
                    <span className="font-mono text-[0.68rem] font-bold tracking-[0.18em] uppercase">
                      Cost analysis
                    </span>
                  </div>
                  <dl className="px-4 py-1 font-mono text-[0.78rem] uppercase tracking-wide">
                    <div className="flex justify-between py-2 border-b border-dotted border-ink/40">
                      <dt className="text-ink/60">Subtotal</dt>
                      <dd>${totalPrice.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b border-dotted border-ink/40">
                      <dt className="text-ink/60">Processing</dt>
                      <dd>TBD</dd>
                    </div>
                    <div className="flex justify-between py-2">
                      <dt className="text-ink/60">Shipping</dt>
                      <dd>At fulfillment</dd>
                    </div>
                  </dl>
                  <div className="border-t-2 border-ink px-4 py-3 flex justify-between items-baseline">
                    <span className="font-mono text-[0.7rem] font-bold uppercase tracking-wider">
                      Estimated total
                    </span>
                    <span className="font-display text-2xl">
                      ${totalPrice.toFixed(2)}+
                    </span>
                  </div>
                </div>
              </aside>

              <form onSubmit={handleSubmit} className="card-paper grain">
                <div className="relative z-[2]">
                  <div className="border-b-2 border-ink px-4 py-2">
                    <span className="font-mono text-[0.68rem] font-bold tracking-[0.18em] uppercase">
                      Requestor information
                    </span>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label
                        htmlFor="req-callsign"
                        className="block font-mono text-[0.66rem] uppercase tracking-widest text-ink/60 mb-1"
                      >
                        Callsign / identifier *
                      </label>
                      <input
                        id="req-callsign"
                        type="text"
                        required
                        value={formData.callsign}
                        onChange={(e) => setFormData({ ...formData, callsign: e.target.value })}
                        className="w-full bg-paper border-2 border-ink px-3 py-2 font-mono text-sm placeholder:text-ink/40 focus:outline-none focus:border-marker"
                        placeholder="e.g., KD2ABC or grid handle"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="req-email"
                        className="block font-mono text-[0.66rem] uppercase tracking-widest text-ink/60 mb-1"
                      >
                        Contact email *
                      </label>
                      <input
                        id="req-email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-paper border-2 border-ink px-3 py-2 font-mono text-sm placeholder:text-ink/40 focus:outline-none focus:border-marker"
                        placeholder="operator@example.com"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="req-grid"
                        className="block font-mono text-[0.66rem] uppercase tracking-widest text-ink/60 mb-1"
                      >
                        Grid square (optional)
                      </label>
                      <input
                        id="req-grid"
                        type="text"
                        value={formData.gridSquare}
                        onChange={(e) => setFormData({ ...formData, gridSquare: e.target.value })}
                        className="w-full bg-paper border-2 border-ink px-3 py-2 font-mono text-sm placeholder:text-ink/40 focus:outline-none focus:border-marker"
                        placeholder="e.g., FN30"
                        maxLength={6}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="req-notes"
                        className="block font-mono text-[0.66rem] uppercase tracking-widest text-ink/60 mb-1"
                      >
                        Special instructions
                      </label>
                      <textarea
                        id="req-notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full bg-paper border-2 border-ink px-3 py-2 font-mono text-sm placeholder:text-ink/40 focus:outline-none focus:border-marker h-20 resize-none"
                        placeholder="Deployment timeline, shipping constraints..."
                      />
                    </div>

                    <p className="border-l-4 border-marker bg-marker/10 p-3 font-mono text-[0.68rem] uppercase tracking-wide leading-relaxed text-ink/80">
                      By filing, you confirm hardware compatibility requirements
                      have been reviewed. Final payment instructions will be
                      sent by email.
                    </p>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-ink text-paper px-5 py-3 border-2 border-ink font-mono text-[0.78rem] uppercase tracking-wider hover:bg-marker hover:border-marker transition-colors disabled:opacity-60"
                    >
                      {isSubmitting ? "Filing..." : "File the requisition →"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Station footer */}
          <p className="text-center font-mono text-[0.64rem] uppercase tracking-[0.3em] text-ink/40 border-t border-ink/20 pt-6">
            Encrypted in transit · Payment via secure gateway · No account required
          </p>
        </div>
      )}
    </>
  );
}
