"use client";

import { useState } from "react";
import { useCart } from "../context/CartContext";
import { Trash2, Plus, Minus, FileText, AlertTriangle, CheckCircle, Cpu, ExternalLink } from "lucide-react";
import BrutalistBlock from "@/components/ui/BrutalistBlock";
import Typography from "@/components/ui/Typography";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import FieldStationLayout from "@/components/ui/FieldStationLayout";

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
      <FieldStationLayout stationId="HL_REQ_CONFIRM">
        <div className="max-w-4xl mx-auto space-y-8">
          <BrutalistBlock className="border-green-600 p-8 text-center" variant="default">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-white" />
              </div>
            </div>
            <Typography variant="h2" className="mb-2">Requisition Submitted</Typography>
            <Typography variant="small" className="opacity-70 mb-4 block">Your request has been logged in the system</Typography>
            
            <div className="bg-background-secondary p-4 mb-6 inline-block">
              <Typography variant="small" className="opacity-60 mb-0 uppercase">Requisition ID</Typography>
              <Typography variant="h3" className="font-mono mb-0">{generateReqId()}</Typography>
            </div>

            <div className="text-left max-w-md mx-auto mb-6 space-y-2">
              <Typography variant="small" className="border-b border-border-primary/30 pb-1 mb-2 block uppercase">Summary</Typography>
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm font-mono uppercase">
                  <span>{item.product.id} x{item.quantity}</span>
                  <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-border-primary/30 pt-2 mt-2">
                <div className="flex justify-between font-bold font-mono">
                  <span>TOTAL</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Typography variant="small" className="opacity-60 mb-6 block">
              You will receive a confirmation email with payment instructions within 24 hours.
            </Typography>

            <div className="flex gap-4 justify-center">
              <Button href="/shop/" variant="outline">
                Return to Shop
              </Button>
              <Button onClick={clearCart} variant="primary" className="bg-green-600 hover:bg-green-700 border-green-600 text-white">
                New Requisition
              </Button>
            </div>
          </BrutalistBlock>
        </div>
      </FieldStationLayout>
    );
  }

  if (items.length === 0) {
    return (
      <FieldStationLayout stationId="HL_REQ_EMPTY">
        <div className="max-w-4xl mx-auto space-y-8">
          <BrutalistBlock className="p-12 text-center" variant="default">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            <Typography variant="h2" className="mb-2 uppercase">No Active Requisitions</Typography>
            <Typography variant="body" className="opacity-60 mb-6">
              Your requisition form is empty. Browse the hardware index to add items.
            </Typography>
            <Button href="/shop/" variant="primary">
              Browse Hardware
            </Button>
          </BrutalistBlock>
        </div>
      </FieldStationLayout>
    );
  }

  return (
    <FieldStationLayout stationId="HL_REQ_ACTIVE">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <BrutalistBlock className="p-6 bg-background-primary/40 border-accent/20" variant="default" refTag="SYS_REQUISITION">
          <div className="flex justify-between items-end">
            <div>
              <Typography variant="h2" className="mb-1 uppercase tracking-tighter flex items-center gap-3">
                <FileText size={24} className="text-accent" />
                Requisition_Form
              </Typography>
              <Typography variant="small" className="opacity-40 font-mono text-[9px] uppercase tracking-widest">
                Hardware Request Documentation System | REV 2.4.1
              </Typography>
            </div>
            <div className="text-[10px] text-foreground-secondary text-right font-mono uppercase">
              <p>REQ_ID: {generateReqId()}</p>
              <Badge variant="status" className="mt-1">PENDING_APPROVAL</Badge>
            </div>
          </div>
        </BrutalistBlock>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Line Items */}
          <div className="lg:col-span-2 space-y-4">
            <BrutalistBlock className="p-6" title={`Line Items (${totalItems})`}>
              <div className="flex justify-end mb-4 border-b border-border-primary/30 pb-2 -mt-10">
                <button
                  onClick={handleClear}
                  className={`text-xs px-3 py-1 font-mono uppercase font-bold transition-colors ${
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
                  className="border border-border-primary/40 p-3 hover:border-border-primary transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Cpu size={14} className="text-[var(--accent)]" />
                        <span className="font-bold text-sm">{item.product.id}</span>
                        <span className="text-[10px] px-1 bg-background-secondary border border-border-primary/30">
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
                        className="w-6 h-6 border border-border-primary flex items-center justify-center hover:bg-[var(--accent)] hover:text-white transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center font-mono text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 border border-border-primary flex items-center justify-center hover:bg-[var(--accent)] hover:text-white transition-colors"
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
          </BrutalistBlock>
        </div>

        {/* Right Column - Summary & Submission */}
        <div className="space-y-4">
          {/* Cost Summary */}
          <BrutalistBlock className="p-4" title="Cost Analysis">
            <div className="space-y-2 text-sm font-mono uppercase">
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
              <div className="border-t border-border-primary/30 pt-2 mt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>ESTIMATED TOTAL</span>
                  <span className="text-accent">${totalPrice.toFixed(2)}+</span>
                </div>
              </div>
            </div>
          </BrutalistBlock>

          {/* Submission Form */}
          <BrutalistBlock className="p-4" title="Requestor Information">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase opacity-70 mb-1">Callsign / Identifier *</label>
                <input
                  type="text"
                  required
                  value={formData.callsign}
                  onChange={(e) => setFormData({...formData, callsign: e.target.value})}
                  className="w-full bg-black/20 border-2 border-border-primary/30 px-3 py-2 text-sm focus:outline-none focus:border-accent font-mono uppercase"
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
                  className="w-full bg-black/20 border-2 border-border-primary/30 px-3 py-2 text-sm focus:outline-none focus:border-accent font-mono"
                  placeholder="operator@example.com"
                />
              </div>

              <div>
                <label className="block text-xs uppercase opacity-70 mb-1">Grid Square (Optional)</label>
                <input
                  type="text"
                  value={formData.gridSquare}
                  onChange={(e) => setFormData({...formData, gridSquare: e.target.value})}
                  className="w-full bg-black/20 border-2 border-border-primary/30 px-3 py-2 text-sm focus:outline-none focus:border-accent font-mono uppercase"
                  placeholder="e.g., FN30"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-xs uppercase opacity-70 mb-1">Special Instructions</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-black/20 border-2 border-border-primary/30 px-3 py-2 text-sm focus:outline-none focus:border-accent h-20 resize-none font-mono uppercase"
                  placeholder="Deployment timeline, shipping constraints..."
                />
              </div>

              <div className="p-3 bg-yellow-500/10 border-l-4 border-yellow-600 text-[10px] flex gap-2 items-start font-mono uppercase">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5 text-yellow-600" />
                <p className="opacity-80 leading-relaxed">
                  By submitting, you confirm hardware compatibility requirements have been reviewed. 
                  Final payment instructions will be sent via email.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                variant="primary"
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    PROCESSING...
                  </span>
                ) : (
                  'SUBMIT REQUISITION'
                )}
              </Button>
            </form>
          </BrutalistBlock>

          {/* Security Notice */}
          <div className="text-[10px] opacity-30 text-center font-mono uppercase tracking-widest">
            <p>All requests encrypted in transit</p>
            <p>Payment processed via secure gateway</p>
          </div>
        </div>
      </div>
      </div>
    </FieldStationLayout>
  );
}
