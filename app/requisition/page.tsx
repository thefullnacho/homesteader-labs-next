"use client";

import { useState } from "react";
import { useCart } from "../context/CartContext";
import { Trash2, Plus, Minus, FileText, AlertTriangle, CheckCircle, Cpu, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function RequisitionPage() {
  const { 
    items, 
    totalItems, 
    totalPrice, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    isRequisitionSubmitted,
    setIsRequisitionSubmitted
  } = useCart();

  const [formData, setFormData] = useState({
    callsign: "",
    email: "",
    gridSquare: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
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

  const generateReqId = () => {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `REQ-${date}-${random}`;
  };

  if (isRequisitionSubmitted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="brutalist-block border-green-600 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold uppercase mb-2">Requisition Submitted</h1>
          <p className="text-sm opacity-70 mb-4">Your request has been logged in the system</p>
          
          <div className="bg-theme-sub p-4 mb-6 inline-block">
            <p className="text-xs uppercase opacity-60">Requisition ID</p>
            <p className="text-xl font-mono font-bold">{generateReqId()}</p>
          </div>

          <div className="text-left max-w-md mx-auto mb-6 space-y-2">
            <p className="text-xs uppercase border-b border-theme-main/30 pb-1">Summary</p>
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span>{item.product.id} x{item.quantity}</span>
                <span>${(item.product.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-theme-main/30 pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span>TOTAL</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <p className="text-xs opacity-60 mb-6">
            You will receive a confirmation email with payment instructions within 24 hours.
          </p>

          <div className="flex gap-4 justify-center">
            <Link 
              href="/shop/"
              className="border border-theme-main px-6 py-2 text-sm hover:bg-[var(--accent)] hover:text-white transition-colors"
            >
              Return to Shop
            </Link>
            <button 
              onClick={clearCart}
              className="border border-green-600 text-green-600 px-6 py-2 text-sm hover:bg-green-600 hover:text-white transition-colors"
            >
              New Requisition
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 border-b-2 border-theme-main pb-2 bg-theme-sub/50 p-4">
          <h1 className="text-2xl font-bold uppercase">Requisition_Form</h1>
          <p className="text-xs text-theme-secondary mt-1">
            Hardware Request Documentation System
          </p>
        </div>

        <div className="brutalist-block p-12 text-center">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-bold uppercase mb-2">No Active Requisitions</h2>
          <p className="text-sm opacity-60 mb-6">
            Your requisition form is empty. Browse the hardware index to add items.
          </p>
          <Link 
            href="/shop/"
            className="inline-block border border-theme-main px-6 py-2 text-sm hover:bg-[var(--accent)] hover:text-white transition-colors"
          >
            Browse Hardware
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 border-b-2 border-theme-main pb-2 bg-theme-sub/50 p-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold uppercase flex items-center gap-2">
              <FileText size={24} className="text-[var(--accent)]" />
              Requisition_Form
            </h1>
            <p className="text-xs text-theme-secondary mt-1">
              Hardware Request Documentation System | REV 2.4.1
            </p>
          </div>
          <div className="text-[10px] text-theme-secondary text-right">
            <p>REQ_ID: {generateReqId()}</p>
            <p>STATUS: PENDING_APPROVAL</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Line Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="brutalist-block p-4">
            <div className="flex justify-between items-center mb-4 border-b border-theme-main/30 pb-2">
              <h2 className="text-sm font-bold uppercase">Line Items ({totalItems})</h2>
              <button
                onClick={handleClear}
                className={`text-xs px-3 py-1 transition-colors ${
                  showConfirmClear 
                    ? 'bg-red-600 text-white' 
                    : 'border border-red-600 text-red-600 hover:bg-red-600 hover:text-white'
                }`}
              >
                {showConfirmClear ? 'CONFIRM CLEAR' : 'CLEAR ALL'}
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div 
                  key={item.product.id} 
                  className="border border-theme-main/40 p-3 hover:border-theme-main transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Cpu size={14} className="text-[var(--accent)]" />
                        <span className="font-bold text-sm">{item.product.id}</span>
                        <span className="text-[10px] px-1 bg-theme-sub border border-theme-main/30">
                          {item.product.category}
                        </span>
                      </div>
                      <p className="text-xs opacity-70">{item.product.name}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 border border-theme-main flex items-center justify-center hover:bg-[var(--accent)] hover:text-white transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center font-mono text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 border border-theme-main flex items-center justify-center hover:bg-[var(--accent)] hover:text-white transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${(item.product.price * item.quantity).toFixed(2)}</p>
                      <p className="text-[10px] opacity-60">${item.product.price.toFixed(2)} each</p>
                    </div>
                  </div>

                  {item.product.affiliate && (
                    <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-600/30 text-[10px] flex items-center gap-1">
                      <ExternalLink size={10} />
                      External fulfillment - affiliate link available
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Summary & Submission */}
        <div className="space-y-4">
          {/* Cost Summary */}
          <div className="brutalist-block p-4">
            <h2 className="text-sm font-bold uppercase mb-4">Cost Analysis</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="opacity-70">Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Processing</span>
                <span>TBD</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Shipping</span>
                <span>Calculated at fulfillment</span>
              </div>
              <div className="border-t border-theme-main/30 pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>ESTIMATED TOTAL</span>
                  <span>${totalPrice.toFixed(2)}+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Form */}
          <div className="brutalist-block p-4">
            <h2 className="text-sm font-bold uppercase mb-4">Requestor Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase opacity-70 mb-1">Callsign / Identifier *</label>
                <input
                  type="text"
                  required
                  value={formData.callsign}
                  onChange={(e) => setFormData({...formData, callsign: e.target.value})}
                  className="w-full bg-theme-sub border border-theme-main px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                  placeholder="e.g., KD2ABC or Grid Handle"
                />
              </div>

              <div>
                <label className="block text-xs uppercase opacity-70 mb-1">Contact Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-theme-sub border border-theme-main px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                  placeholder="operator@example.com"
                />
              </div>

              <div>
                <label className="block text-xs uppercase opacity-70 mb-1">Grid Square (Optional)</label>
                <input
                  type="text"
                  value={formData.gridSquare}
                  onChange={(e) => setFormData({...formData, gridSquare: e.target.value})}
                  className="w-full bg-theme-sub border border-theme-main px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                  placeholder="e.g., FN30"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-xs uppercase opacity-70 mb-1">Special Instructions</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-theme-sub border border-theme-main px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] h-20 resize-none"
                  placeholder="Deployment timeline, shipping constraints..."
                />
              </div>

              <div className="p-3 bg-yellow-500/10 border border-yellow-600/30 text-[10px] flex gap-2 items-start">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <p>
                  By submitting, you confirm hardware compatibility requirements have been reviewed. 
                  Final payment instructions will be sent via email.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[var(--accent)] text-white py-3 font-bold uppercase text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    PROCESSING...
                  </span>
                ) : (
                  'SUBMIT REQUISITION'
                )}
              </button>
            </form>
          </div>

          {/* Security Notice */}
          <div className="text-[10px] opacity-50 text-center">
            <p>All requests encrypted in transit</p>
            <p>Payment processed via secure gateway</p>
          </div>
        </div>
      </div>
    </div>
  );
}
