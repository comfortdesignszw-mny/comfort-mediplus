import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  ShieldCheck, 
  RefreshCw, 
  Calendar, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Clock, 
  HelpCircle, 
  FileText,
  Lock
} from 'lucide-react';
import { SubscriptionTier } from '../../types';

interface RenewalTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier?: SubscriptionTier;
  billingCycle?: 'monthly' | 'yearly';
  onAcceptAndSubscribe?: (tier: SubscriptionTier, cycle: 'monthly' | 'yearly') => void;
}

export const RenewalTermsModal: React.FC<RenewalTermsModalProps> = ({
  isOpen,
  onClose,
  selectedTier = 'pro',
  billingCycle = 'monthly',
  onAcceptAndSubscribe,
}) => {
  const [hasAgreed, setHasAgreed] = useState(false);
  const userProfile = useAppStore(s => s.userProfile);
  const updateSubscription = useAppStore(s => s.updateSubscription);
  const cancelSubscriptionAutoRenewal = useAppStore(s => s.cancelSubscriptionAutoRenewal);

  if (!isOpen) return null;

  const planName = selectedTier === 'family_pro' ? 'Family & Clinic Care Pro' : 'Comfort Medi+ Pro Adherence';
  const priceDisplay = selectedTier === 'family_pro'
    ? (billingCycle === 'yearly' ? '$99.00 / year (Save 17%)' : '$9.99 / month')
    : (billingCycle === 'yearly' ? '$49.00 / year (Save 18%)' : '$4.99 / month');

  const renewalDate = new Date();
  renewalDate.setMonth(renewalDate.getMonth() + (billingCycle === 'yearly' ? 12 : 1));
  const nextRenewalFormatted = renewalDate.toLocaleDateString('en-ZW', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handleConfirm = () => {
    if (onAcceptAndSubscribe) {
      onAcceptAndSubscribe(selectedTier, billingCycle);
    } else {
      updateSubscription(selectedTier, billingCycle, true);
    }
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0a2540] via-teal-950 to-teal-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <RefreshCw className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest text-teal-300 uppercase">
                Statutory Consumer Disclosure
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Pro Subscription &amp; Automatic Renewal Terms
              </h2>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-black/30 text-xs">
            <div>
              <span className="text-[10px] text-teal-300 block">Plan Selected</span>
              <strong className="text-white">{planName}</strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-teal-300 block">Recurring Billing</span>
              <strong className="text-teal-300 font-bold">{priceDisplay}</strong>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed flex-1">
          
          <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-teal-950">Transparent Continuous Service Guarantee</h4>
              <p className="text-[11px] text-teal-800 mt-0.5">
                Comfort Medi+ maintains 100% transparent recurring billing terms in accordance with regional consumer protection standards and the Zimbabwe Consumer Protection Act [Chapter 14:14].
              </p>
            </div>
          </div>

          {/* Key Term 1: Automatic Renewal Clause */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>1. Continuous Billing &amp; Auto-Renewal Notice</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Your subscription begins immediately upon activation. It will automatically renew at the end of every <strong>{billingCycle === 'yearly' ? 'annual billing cycle (every 12 months)' : 'monthly billing cycle (every 30 days)'}</strong> at the regular rate of <strong>{priceDisplay}</strong> unless canceled by you at least 24 hours prior to your next renewal date (<strong>{nextRenewalFormatted}</strong>).
            </p>
          </div>

          {/* Key Term 2: Cancellation Policy */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>2. Effortless 1-Click Cancellation Anytime</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              You retain total control. You may disable auto-renewal anytime with zero penalty or cancellation fees directly in:
              <br />
              <strong className="text-slate-800">Profile &amp; Security &gt; Pro Subscriptions &gt; Cancel Auto-Renewal</strong>.
              <br />
              Upon cancellation, your Pro features (automated WhatsApp reminders, unlimited AI health queries, prioritized clinic bookings) remain completely accessible until the conclusion of the paid term.
            </p>
          </div>

          {/* Key Term 3: Refund & Money-Back Policy */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <CreditCard className="w-4 h-4 text-teal-600" />
              <span>3. 7-Day Full Refund Guarantee</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              We offer a no-questions-asked full 7-day money-back guarantee for first-time Pro subscribers. If you are unsatisfied for any reason within 7 days of initial purchase, contact support at <strong>billing@comfortmedi.health</strong> or via WhatsApp at <strong>+263 77 282 4132</strong> for an immediate full reversal.
            </p>
          </div>

          {/* Key Term 4: Supported Payment Channels & Rate Freeze */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Lock className="w-4 h-4 text-teal-600" />
              <span>4. Rate Lock &amp; Domestic Payment Channels</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Supported payment processors: EcoCash, InnBucks, Visa, Mastercard, and ZimSwitch. For direct domestic EcoCash payments, dial <strong>*151*1*1*0772824132*5#</strong> for Pro ($5) or <strong>*151*1*1*0772824132*10#</strong> for Family Clinic Pro ($10). Your initial subscribed price is guaranteed locked and will never increase without mandatory 30-day prior written notice via registered email and WhatsApp.
            </p>
          </div>

          {/* Agreement Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-teal-50/60 border border-teal-200 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4 shrink-0"
              />
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                I have reviewed and agree to the <strong>Automatic Renewal Terms</strong> ({priceDisplay}), 24-hour cancellation rule, and 7-day refund policy.
              </span>
            </label>
          </div>

          {/* Registered Business Address */}
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <strong>Billing Operator &amp; Registered Medical Informatics Entity:</strong>
            <p className="mt-0.5">
              Comfort Medi+ Health Informatics Ltd • Suite 402, Medical Chambers, 128 Herbert Chitepo Ave, Harare, Zimbabwe. Tel: +263 77 282 4132 • Email: billing@comfortmedi.health
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
          >
            Close
          </button>

          <button
            type="button"
            disabled={!hasAgreed}
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 ${
              hasAgreed
                ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/25 active:scale-95'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Acknowledge &amp; Activate {planName}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
