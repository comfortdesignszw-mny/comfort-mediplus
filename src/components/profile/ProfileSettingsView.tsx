import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { exportHealthDataJSON, triggerBiometricAuthentication } from '../../lib/security';
import { generateWhatsAppLink } from '../../lib/whatsappGateway';
import { LegalModal } from '../legal/LegalModal';
import { RenewalTermsModal } from '../subscription/RenewalTermsModal';
import { SubscriptionTier } from '../../types';
import { 
  User, 
  ShieldCheck, 
  Lock, 
  Phone, 
  Download, 
  Upload, 
  FileText, 
  Fingerprint, 
  Check, 
  AlertCircle, 
  X, 
  MessageSquare, 
  KeyRound, 
  Scale, 
  Trash2, 
  Database, 
  ShieldAlert, 
  Sparkles, 
  RefreshCw, 
  Loader2,
  CreditCard,
  BellOff,
  EyeOff,
  Globe,
  MapPin,
  CheckCircle2,
  Copyright,
  CalendarCheck
} from 'lucide-react';

export const ProfileSettingsView: React.FC = () => {
  const userProfile = useAppStore(s => s.userProfile);
  const chronicConditions = useAppStore(s => s.chronicConditions);
  const allergies = useAppStore(s => s.allergies);
  const updateProfile = useAppStore(s => s.updateProfile);
  const emergencyContacts = useAppStore(s => s.emergencyContacts);
  const addEmergencyContact = useAppStore(s => s.addEmergencyContact);
  const removeEmergencyContact = useAppStore(s => s.removeEmergencyContact);
  const isPinEnabled = useAppStore(s => s.isPinEnabled);
  const setupPin = useAppStore(s => s.setupPin);
  const setPinLocked = useAppStore(s => s.setPinLocked);
  const auditLogs = useAppStore(s => s.auditLogs);
  const whatsappNotifications = useAppStore(s => s.whatsappNotifications);
  const restoreFromBackup = useAppStore(s => s.restoreFromBackup);
  const showToast = useAppStore(s => s.showToast);
  const exportAllUserDataJSON = useAppStore(s => s.exportAllUserDataJSON);
  const eraseAllUserDataAndReset = useAppStore(s => s.eraseAllUserDataAndReset);
  const loadClinicalStarterTemplate = useAppStore(s => s.loadClinicalStarterTemplate);
  const fullStoreState = useAppStore.getState();

  // Subscription and Communication Preferences Hooks
  const showRenewalTermsModal = useAppStore(s => s.showRenewalTermsModal);
  const setShowRenewalTermsModal = useAppStore(s => s.setShowRenewalTermsModal);
  const toggleWhatsAppOptOut = useAppStore(s => s.toggleWhatsAppOptOut);
  const toggleEmailOptOut = useAppStore(s => s.toggleEmailOptOut);
  const unsubscribeAllAlerts = useAppStore(s => s.unsubscribeAllAlerts);
  const resubscribeAlerts = useAppStore(s => s.resubscribeAlerts);
  const updateSubscription = useAppStore(s => s.updateSubscription);
  const cancelSubscriptionAutoRenewal = useAppStore(s => s.cancelSubscriptionAutoRenewal);
  const submitEcoCashSubscription = useAppStore(s => s.submitEcoCashSubscription);
  const subscriptionRequests = useAppStore(s => s.subscriptionRequests);

  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'communications' | 'emergency' | 'security' | 'audit_whatsapp'>('profile');
  const [selectedTierForRenewalModal, setSelectedTierForRenewalModal] = useState<SubscriptionTier>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(userProfile);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | 'rights' | 'dmca'>('privacy');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // EcoCash Paid Subscription Form State
  const [ecoTier, setEcoTier] = useState<'medi_pro' | 'family_clinic_pro'>('medi_pro');
  const [ecoName, setEcoName] = useState(userProfile.fullName || '');
  const [ecoPhone, setEcoPhone] = useState(userProfile.phoneNumber || '');
  const [ecoTxId, setEcoTxId] = useState('');
  const [ecoConfirmationMsg, setEcoConfirmationMsg] = useState('');
  const [ecoProofScreenshot, setEcoProofScreenshot] = useState<string | null>(null);
  const [isSubmittingEco, setIsSubmittingEco] = useState(false);

  const handleEcoScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image file size must be less than 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setEcoProofScreenshot(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEcoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ecoTxId.trim() || !ecoConfirmationMsg.trim()) {
      showToast('Please enter both your EcoCash Transaction ID and the Confirmation SMS Message', 'error');
      return;
    }
    if (!ecoName.trim() || !ecoPhone.trim()) {
      showToast('Please provide your full legal name and phone number', 'error');
      return;
    }

    setIsSubmittingEco(true);
    try {
      await submitEcoCashSubscription({
        tier: ecoTier,
        fullName: ecoName.trim(),
        phoneNumber: ecoPhone.trim(),
        transactionId: ecoTxId.trim(),
        confirmationMessage: ecoConfirmationMsg.trim(),
        proofScreenshotUrl: ecoProofScreenshot || undefined,
      });
      setEcoTxId('');
      setEcoConfirmationMsg('');
      setEcoProofScreenshot(null);
    } finally {
      setIsSubmittingEco(false);
    }
  };

  // New Emergency Contact Form
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    relationship: 'Family Member',
    phoneNumber: '+263 77 ',
    alternativePhone: '',
    address: 'Harare',
    priorityLevel: 1 as 1 | 2 | 3,
    emergencyNotes: '',
  });

  // PIN Setup Form
  const [pinInput, setPinInput] = useState('1234');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileForm);
    setIsEditingProfile(false);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          restoreFromBackup(parsed);
        } catch {
          showToast('Invalid backup JSON format', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Profile &amp; Security Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personal identity • Emergency contacts • AES local vault • Audit logs
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-slate-200/60 p-1 rounded-2xl text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'profile' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Patient Info</span>
        </button>
        <button
          onClick={() => setActiveTab('subscription')}
          className={`flex-1 py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'subscription' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 text-teal-600" />
          <span>Pro Plans &amp; Renewal</span>
        </button>
        <button
          onClick={() => setActiveTab('communications')}
          className={`flex-1 py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'communications' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BellOff className="w-3.5 h-3.5 text-amber-600" />
          <span>Unsubscribe &amp; Address</span>
        </button>
        <button
          onClick={() => setActiveTab('emergency')}
          className={`flex-1 py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'emergency' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Contacts ({emergencyContacts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'security' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Security &amp; Policy</span>
        </button>
        <button
          onClick={() => setActiveTab('audit_whatsapp')}
          className={`flex-1 py-2 px-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'audit_whatsapp' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
          <span>WhatsApp Outbox</span>
        </button>
      </div>

      {/* TAB 1: PATIENT PROFILE INFO */}
      {activeTab === 'profile' && (
        <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                {userProfile.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{userProfile.fullName}</h3>
                <p className="text-xs text-slate-500">ID: {userProfile.nationalId} • {userProfile.city}</p>
              </div>
            </div>

            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-3.5 py-1.5 rounded-xl border border-teal-500 text-teal-700 hover:bg-teal-50 text-xs font-bold transition"
            >
              {isEditingProfile ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number (Zimbabwe)</label>
                  <input
                    type="text"
                    value={profileForm.phoneNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={profileForm.dateOfBirth}
                    onChange={(e) => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">National ID</label>
                  <input
                    type="text"
                    value={profileForm.nationalId}
                    onChange={(e) => setProfileForm({ ...profileForm, nationalId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Passport Number</label>
                  <input
                    type="text"
                    value={profileForm.passportNumber || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, passportNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Blood Type</label>
                  <select
                    value={profileForm.bloodType}
                    onChange={(e) => setProfileForm({ ...profileForm, bloodType: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={profileForm.heightCm}
                    onChange={(e) => setProfileForm({ ...profileForm, heightCm: parseInt(e.target.value, 10) || 168 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={profileForm.weightKg}
                    onChange={(e) => setProfileForm({ ...profileForm, weightKg: parseFloat(e.target.value) || 69 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Medical Aid / Insurance</label>
                  <input
                    type="text"
                    value={profileForm.insuranceProvider}
                    onChange={(e) => setProfileForm({ ...profileForm, insuranceProvider: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Policy Number</label>
                  <input
                    type="text"
                    value={profileForm.insurancePolicyNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, insurancePolicyNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition shadow-sm"
              >
                Save Profile Changes
              </button>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Personal</span>
                <p className="font-bold text-slate-900 mt-1">{userProfile.gender.toUpperCase()} • DOB: {userProfile.dateOfBirth}</p>
                <p className="text-slate-500 mt-0.5">{userProfile.occupation}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact</span>
                <p className="font-bold text-slate-900 mt-1">{userProfile.phoneNumber}</p>
                <p className="text-slate-500 mt-0.5">{userProfile.address}, {userProfile.city}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Clinical Overview</span>
                <p className="font-bold text-teal-800 mt-1">Blood: {userProfile.bloodType} (Rh {userProfile.rhesusFactor})</p>
                <p className="text-slate-500 mt-0.5">BMI: {userProfile.bmi} • Organ Donor: {userProfile.organDonor ? 'Yes' : 'No'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Medical Aid &amp; Provider</span>
                <p className="font-bold text-slate-900 mt-1">{userProfile.insuranceProvider} ({userProfile.insurancePolicyNumber})</p>
                <p className="text-slate-500 mt-0.5">Primary Doctor: {userProfile.primaryHealthcareProvider}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Language</span>
                <p className="font-bold text-slate-900 mt-1 uppercase">{userProfile.languagePreference}</p>
                <p className="text-slate-500 mt-0.5">Zimbabwean Resident</p>
              </div>
            </div>
          )}

          {/* Legal Age Gate & Guardian Supervision Status */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200 text-teal-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-700 tracking-wider block">
                  Statutory Age Gate &amp; Legal Guardian Status
                </span>
                <h4 className="font-bold text-sm text-teal-900 mt-0.5">
                  {userProfile.isGuardianManaged
                    ? `Juvenile Dependent (Supervised by ${userProfile.guardianName || 'Parent / Legal Guardian'})`
                    : `Verified Adult Account (> 16 Years of Age)`}
                </h4>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  {userProfile.dateOfBirth ? `Date of Birth: ${userProfile.dateOfBirth}` : 'Age eligibility verified'}
                  {userProfile.guardianContact ? ` • Guardian Contact: ${userProfile.guardianContact}` : ''}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 self-start sm:self-auto ${
                userProfile.isGuardianManaged
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-600 text-white'
              }`}>
                {userProfile.isGuardianManaged ? 'Guardian Administered' : 'Age Verified (>16)'}
              </span>
            </div>
          </div>

          {/* Chronic Conditions & Known Allergies section in Profile */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Chronic Diagnoses &amp; Clinical Conditions
              </span>
              <div className="flex flex-wrap gap-2">
                {chronicConditions.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-500" />
                    <div>
                      <strong className="block font-bold">{c.conditionName}</strong>
                      <span className="text-[10px] text-teal-700">{c.treatmentRegimen}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Documented Allergies &amp; Severe Reactions
              </span>
              <div className="flex flex-wrap gap-2">
                {allergies.map((a) => (
                  <div key={a.id} className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <div>
                      <strong className="block font-bold">Allergy: {a.allergen}</strong>
                      <span className="text-[10px] text-rose-700">{a.reaction} ({a.severity})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PRO SUBSCRIPTION & RENEWAL TERMS */}
      {activeTab === 'subscription' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Current Plan Overview Card */}
          <div className="rounded-3xl bg-gradient-to-r from-[#0a2540] via-teal-950 to-teal-900 text-white p-5 sm:p-6 shadow-md border border-teal-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest block">
                  Active Subscription Tier
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  {userProfile.subscriptionTier === 'family_pro'
                    ? 'Family & Clinic Care Pro Tier'
                    : userProfile.subscriptionTier === 'pro'
                    ? 'Comfort Medi+ Pro Adherence Tier'
                    : 'Standard Free Care Tier'}
                </h3>
                <p className="text-xs text-teal-200/90 mt-1">
                  {userProfile.autoRenew 
                    ? `Continuous billing active • Next renewal: ${userProfile.subscriptionRenewalDate || 'End of month'}`
                    : 'Auto-renewal is currently turned off'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTierForRenewalModal(userProfile.subscriptionTier || 'pro');
                    setShowRenewalTermsModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-teal-500/25 transition active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-950" />
                  <span>Renewal Terms</span>
                </button>
                {userProfile.autoRenew && (
                  <button
                    type="button"
                    onClick={cancelSubscriptionAutoRenewal}
                    className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                  >
                    Cancel Auto-Renewal
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Billing Cycle Selector */}
          <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl max-w-xs mx-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 py-1.5 rounded-xl transition ${billingCycle === 'monthly' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600'}`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`flex-1 py-1.5 rounded-xl transition ${billingCycle === 'yearly' ? 'bg-white text-teal-900 shadow-sm' : 'text-slate-600'}`}
            >
              Annual Billing <span className="text-[10px] text-emerald-700 font-extrabold">(Save 18%)</span>
            </button>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Pro Adherence */}
            <div className={`p-5 rounded-3xl border bg-white shadow-sm flex flex-col justify-between space-y-4 ${
              userProfile.subscriptionTier === 'pro' ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    Individual Care
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900">
                      {billingCycle === 'yearly' ? '$49' : '$4.99'}
                    </span>
                    <span className="text-slate-500 text-xs">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                  </div>
                </div>

                <h4 className="text-base font-black text-slate-900">Comfort Medi+ Pro Adherence</h4>
                <p className="text-xs text-slate-600">
                  Comprehensive automated WhatsApp direct messaging, clinical doctor synchronization, and smart medication refill prediction.
                </p>

                <ul className="text-xs space-y-2 text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Auto-Fired WhatsApp Reminders (zero manual clicks)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Multi-turn AI Health Consultation Assistant</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Attending Physician Hospital Care Plan Integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Unlimited Encrypted Medical Records Vault</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateSubscription('pro', billingCycle, true)}
                    className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition active:scale-95"
                  >
                    {userProfile.subscriptionTier === 'pro' ? 'Current Active Plan' : 'Select Pro Adherence'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTierForRenewalModal('pro');
                      setShowRenewalTermsModal(true);
                    }}
                    className="px-3 py-2.5 rounded-xl border border-slate-300 hover:border-teal-500 text-slate-700 hover:text-teal-700 text-xs font-bold transition flex items-center gap-1"
                    title="View explicit renewal terms"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                    <span>Renewal Terms</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Family & Clinic Care Pro */}
            <div className={`p-5 rounded-3xl border bg-white shadow-sm flex flex-col justify-between space-y-4 ${
              userProfile.subscriptionTier === 'family_pro' ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200'
            }`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Family &amp; Clinic
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900">
                      {billingCycle === 'yearly' ? '$99' : '$9.99'}
                    </span>
                    <span className="text-slate-500 text-xs">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                  </div>
                </div>

                <h4 className="text-base font-black text-slate-900">Family &amp; Clinic Care Pro</h4>
                <p className="text-xs text-slate-600">
                  Full supervision for up to 5 family members, juvenile/minor guardian administration, and priority clinical tele-consultations.
                </p>

                <ul className="text-xs space-y-2 text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Includes everything in Pro Adherence</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Parent/Guardian administration for up to 5 dependents</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Juvenile minor care oversight &amp; pediatric dosage tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>Priority hospital appointment booking queue</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateSubscription('family_pro', billingCycle, true)}
                    className="flex-1 py-2.5 rounded-xl bg-teal-900 hover:bg-slate-950 text-white text-xs font-bold shadow-md transition active:scale-95"
                  >
                    {userProfile.subscriptionTier === 'family_pro' ? 'Current Active Plan' : 'Select Family Care Pro'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTierForRenewalModal('family_pro');
                      setShowRenewalTermsModal(true);
                    }}
                    className="px-3 py-2.5 rounded-xl border border-slate-300 hover:border-teal-500 text-slate-700 hover:text-teal-700 text-xs font-bold transition flex items-center gap-1"
                    title="View explicit renewal terms"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                    <span>Renewal Terms</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ECOCASH PAID SUBSCRIPTION AREA (Medi+ Pro & Family and Clinic Pro) */}
          <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    EcoCash Paid Subscription &amp; Verification Area
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pay via EcoCash Zimbabwe • Submit payment proof &amp; transaction ID for 30-Day Pro activation
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedTierForRenewalModal(ecoTier === 'family_clinic_pro' ? 'family_pro' : 'pro');
                  setShowRenewalTermsModal(true);
                }}
                className="px-3.5 py-2 rounded-xl border border-teal-600 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5 text-teal-700" />
                <span>Renewal Terms by Button</span>
              </button>
            </div>

            {/* Active 30-Day Status or Pending Banner */}
            {userProfile.subscriptionStatus === 'active' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-emerald-900">
                      🌟 30-Day Pro Subscription Active ({userProfile.subscriptionTier === 'family_pro' ? 'Family & Clinic Pro' : 'Medi+ Pro'})
                    </h4>
                    <p className="text-emerald-800 mt-0.5">
                      Activated on: <strong>{userProfile.subscriptionActivatedAt ? new Date(userProfile.subscriptionActivatedAt).toLocaleDateString() : 'Active'}</strong> • Next renewal date: <strong>{userProfile.subscriptionRenewalDate || userProfile.subscriptionExpiresAt?.split('T')[0] || 'In 30 days'}</strong>
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      Your account is verified across all devices. When the 30-day term concludes, your subscription will reset to prompt renewal.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 shrink-0">
                  ACTIVE
                </span>
              </div>
            )}

            {userProfile.subscriptionStatus === 'pending' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="font-bold text-sm text-amber-900">
                    ⏳ EcoCash Payment Proof Submitted (Pending Admin Verification)
                  </h4>
                  <p className="text-amber-800 mt-0.5">
                    Your EcoCash payment details (Tx ID: <strong>{userProfile.pendingSubscriptionRequest?.ecocashTransactionId || 'Logged'}</strong>) are currently being verified by the Super Admin in the EcoCash Subscriptions Queue. Once approved, your account will immediately unlock for 30 days.
                  </p>
                </div>
              </div>
            )}

            {/* EcoCash Step-by-Step Payment Instructions */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 block">
                  EcoCash USSD Payment Instructions (Zimbabwe)
                </span>
                <span className="text-[10px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Dial Directly from Phone
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pro Subscription USSD */}
                <div className={`p-3.5 rounded-2xl border transition ${
                  ecoTier === 'medi_pro' 
                    ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20' 
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-teal-800">
                      Comfort Medi+ Pro ($5)
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">$5.00 / 30 Days</span>
                  </div>
                  <div className="mt-1.5 p-2 rounded-xl bg-slate-900 text-teal-400 font-mono font-bold text-sm tracking-wide flex items-center justify-between">
                    <span>*151*1*1*0772824132*5#</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText('*151*1*1*0772824132*5#');
                        showToast('Copied USSD: *151*1*1*0772824132*5#', 'success');
                      }}
                      className="text-[10px] bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 px-2 py-0.5 rounded transition"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    Dial this USSD code on your EcoCash registered mobile to send $5 directly to Comfort Medi+.
                  </p>
                </div>

                {/* Family Clinic Pro USSD */}
                <div className={`p-3.5 rounded-2xl border transition ${
                  ecoTier === 'family_clinic_pro' 
                    ? 'bg-purple-50/70 border-purple-500 ring-2 ring-purple-500/20' 
                    : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-purple-800">
                      Family Clinic Pro ($10)
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">$10.00 / 30 Days</span>
                  </div>
                  <div className="mt-1.5 p-2 rounded-xl bg-slate-900 text-purple-300 font-mono font-bold text-sm tracking-wide flex items-center justify-between">
                    <span>*151*1*1*0772824132*10#</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText('*151*1*1*0772824132*10#');
                        showToast('Copied USSD: *151*1*1*0772824132*10#', 'success');
                      }}
                      className="text-[10px] bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded transition"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    Dial this USSD code on your EcoCash registered mobile to send $10 directly to Comfort Medi+.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800">EcoCash Recipient:</span>
                  <span className="font-mono font-bold text-slate-900">0772824132</span>
                  <span className="text-slate-500">(Comfort Medi+ Services)</span>
                </div>
                <span className="text-[10px] text-slate-400">After dialling, take a screenshot of confirmation SMS to upload below</span>
              </div>
            </div>

            {/* EcoCash Proof Submission Form */}
            <form onSubmit={handleEcoSubmit} className="space-y-3.5 text-xs pt-1">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Select Subscription Package *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label
                    onClick={() => setEcoTier('medi_pro')}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition ${
                      ecoTier === 'medi_pro' ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-black text-slate-900 block text-xs">Comfort Medi+ Pro</span>
                      <span className="text-[11px] text-slate-500">Individual automated WhatsApp reminders &amp; AI</span>
                    </div>
                    <span className="font-black text-sm text-teal-800">$4.99 / 30 Days</span>
                  </label>

                  <label
                    onClick={() => setEcoTier('family_clinic_pro')}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition ${
                      ecoTier === 'family_clinic_pro' ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-black text-slate-900 block text-xs">Family &amp; Clinic Pro</span>
                      <span className="text-[11px] text-slate-500">Up to 5 family members, juvenile &amp; clinic care</span>
                    </div>
                    <span className="font-black text-sm text-purple-800">$9.99 / 30 Days</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Your Full Legal Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="Enter your full name"
                    value={ecoName}
                    onChange={(e) => setEcoName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Phone Number Used to Pay *</label>
                  <input
                    required
                    type="tel"
                    placeholder="+263 77 123 4567"
                    value={ecoPhone}
                    onChange={(e) => setEcoPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  EcoCash Transaction ID / Approval Code *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. MP261030.1234.G56789"
                  value={ecoTxId}
                  onChange={(e) => setEcoTxId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Confirmation Message (Paste the full EcoCash SMS text) *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. EcoCash: Transfer of $4.99 to Comfort Medi+ Services 282413 was successful. Approval Code: MP261030.1234.G56789..."
                  value={ecoConfirmationMsg}
                  onChange={(e) => setEcoConfirmationMsg(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Screenshot Image Upload Area */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Upload Screenshot of EcoCash Payment Proof (Optional but Recommended)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEcoScreenshotUpload}
                    className="text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-600 file:text-white hover:file:bg-teal-700 cursor-pointer"
                  />
                  {ecoProofScreenshot && (
                    <div className="flex items-center gap-2">
                      <img
                        src={ecoProofScreenshot}
                        alt="Screenshot Preview"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setEcoProofScreenshot(null)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingEco}
                  className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmittingEco ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Payment Proof...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Submit EcoCash Proof for Admin Verification</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB: NOTIFICATION ALERTS UNSUBSCRIBE & REGISTERED ADDRESS */}
      {activeTab === 'communications' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="rounded-3xl bg-white p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center justify-center">
                  <BellOff className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Notification Preferences &amp; Unsubscribe Controls
                  </h3>
                  <p className="text-xs text-slate-500">
                    Granular authority to silence or opt out of automated device alerts
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                userProfile.allNotificationsUnsubscribed
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {userProfile.allNotificationsUnsubscribed ? 'Alerts Unsubscribed' : 'Active Delivery'}
              </span>
            </div>

            <p className="text-slate-600 leading-relaxed">
              We respect your peace of mind and personal device boundaries. In accordance with regional consumer protection and anti-spam regulations (CAN-SPAM, GDPR, and Zimbabwe Data Protection Act [Cap 11:12]), you can selectively silence specific channels or completely opt out with a single click.
            </p>

            <div className="space-y-3 pt-2">
              {/* Channel 1: WhatsApp Reminders */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Automated WhatsApp Reminders</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Direct messages sent to your WhatsApp number ({userProfile.phoneNumber || 'Not configured'}) for medications, appointments, and care tasks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleWhatsAppOptOut(!userProfile.whatsappAlertsOptOut)}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs transition shrink-0 ${
                    userProfile.whatsappAlertsOptOut
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {userProfile.whatsappAlertsOptOut ? 'Opted Out (Muted)' : 'Active (Enabled)'}
                </button>
              </div>

              {/* Channel 2: Email Alerts */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Email Health &amp; Adherence Digests</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Periodic adherence summaries, appointment booking confirmations, and lab report availability notifications.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleEmailOptOut(!userProfile.emailAlertsOptOut)}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs transition shrink-0 ${
                    userProfile.emailAlertsOptOut
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {userProfile.emailAlertsOptOut ? 'Opted Out (Muted)' : 'Active (Enabled)'}
                </button>
              </div>

              {/* Master 1-Click Unsubscribe Button */}
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-rose-950 text-sm">Master Communication Opt-Out</h4>
                    <p className="text-rose-800 text-[11px] mt-0.5">
                      Unsubscribe from ALL automated WhatsApp direct messages and email alerts instantly across all devices.
                    </p>
                  </div>
                  {userProfile.allNotificationsUnsubscribed ? (
                    <button
                      type="button"
                      onClick={resubscribeAlerts}
                      className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 shadow-sm transition shrink-0"
                    >
                      Resubscribe All Alerts
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={unsubscribeAllAlerts}
                      className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-sm shadow-rose-600/20 transition active:scale-95 flex items-center gap-1.5 shrink-0"
                    >
                      <BellOff className="w-3.5 h-3.5" />
                      <span>Unsubscribe All Alerts</span>
                    </button>
                  )}
                </div>

                {userProfile.unsubscribeTimestamp && (
                  <p className="text-[10px] text-rose-700">
                    Last unsubscribed: {new Date(userProfile.unsubscribeTimestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Statutory Registered Postal & Contact Address */}
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <MapPin className="w-4 h-4 text-teal-700" />
                <span>Statutory Physical Operations &amp; Communications Address:</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block font-bold">
                  Comfort Medi+ Health Informatics Ltd
                </strong>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Registered Medical Chambers, Suite 402, 128 Herbert Chitepo Avenue, Harare, Zimbabwe
                  <br />
                  Postal: P.O. Box CY 1420, Causeway, Harare
                  <br />
                  Healthcare Compliance Hotline: <strong>+263 77 282 4132</strong>
                  <br />
                  Official Unsubscribe &amp; Compliance Email:{' '}
                  <a href="mailto:compliance@comfortmedi.health" className="text-teal-700 font-bold underline">
                    compliance@comfortmedi.health
                  </a>{' '}
                  / <a href="mailto:comfort.designszw@gmail.com" className="text-teal-700 font-bold underline">
                    comfort.designszw@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMERGENCY CONTACTS */}
      {activeTab === 'emergency' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Emergency Contact List (One-Tap Calling)</h3>
            <button
              onClick={() => setShowAddContactModal(true)}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Add Contact</span>
            </button>
          </div>

          <div className="space-y-3">
            {emergencyContacts.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold">
                      {c.relationship}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                      Priority {c.priorityLevel}
                    </span>
                  </div>
                  <p className="text-slate-600 font-mono mt-1">{c.phoneNumber}</p>
                  {c.emergencyNotes && (
                    <p className="text-slate-500 text-[11px] mt-0.5">{c.emergencyNotes}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={generateWhatsAppLink(
                      c.phoneNumber,
                      `Hello ${c.name}, this is ${userProfile.fullName} sharing an update via Comfort Medi+.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 text-xs shadow-sm transition active:scale-95"
                    title="Send WhatsApp message"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">WhatsApp</span>
                  </a>
                  <a
                    href={`tel:${c.phoneNumber.replace(/\s+/g, '')}`}
                    className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center gap-1 text-xs shadow-sm transition active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                  <button
                    onClick={() => removeEmergencyContact(c.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & COMPLIANCE */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          {/* Zero Session Replay Architecture Card */}
          <div className="rounded-3xl bg-slate-900 text-white p-5 border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
                  <EyeOff className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Zero Session Replay Architecture</h3>
                  <p className="text-[11px] text-teal-200/80">Strictly blocked &amp; off • Zero screen recording</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                Session Replay: Blocked
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Comfort Medi+ strictly disallows and blocks all session replay tools (such as LogRocket, Hotjar, FullStory, or Clarity). Your sensitive health dashboard, medication dosages, and medical reports are <strong>never screen-recorded or keystroke-monitored</strong>.
            </p>
          </div>

          {/* Self-Hosted Local Fonts / Zero IP Leaks Card */}
          <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-800 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">Self-Hosted Typography (Zero IP Address Leaks)</h3>
                  <p className="text-[11px] text-emerald-800">100% native system font stacks • No external font CDN</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                Zero IP Leaks
              </span>
            </div>
            <p className="text-xs text-emerald-900/90 leading-relaxed">
              Unlike typical web apps that download fonts from Google servers (exposing patient IP addresses and browsing timestamps to remote analytics), Comfort Medi+ renders typefaces exclusively through local system font stacks. Zero third-party font calls are made.
            </p>
          </div>

          {/* DMCA Copyright Agent Card */}
          <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Copyright className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">DMCA Copyright Agent &amp; Upload Non-Liability</h3>
                  <p className="text-[11px] text-slate-500">Designated Agent filed • Statutory Safe Harbor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLegalModalTab('dmca');
                  setShowLegalModal(true);
                }}
                className="px-3 py-1.5 rounded-xl border border-teal-500 text-teal-700 hover:bg-teal-50 text-xs font-bold transition"
              >
                View Filing Info
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Registered DMCA Agent: <strong>Copyright Compliance Officer, Suite 402, Medical Chambers, 128 Herbert Chitepo Ave, Harare</strong>. The app developers and host systems are not liable for files uploaded by users that violate copyright laws.
            </p>
          </div>

          {/* AES Encryption Status */}
          <div className="rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-teal-700">
              <ShieldCheck className="w-6 h-6" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Local Data Encryption (Web Crypto AES-256)</h3>
                <p className="text-[11px] text-slate-500">Zero plain-text transmission • Offline encrypted vault</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              All personal medical histories, medication schedules, lab results, and vitals readings are encrypted locally on this device using 256-bit AES-GCM cryptography. Your records remain private and accessible without requiring external cloud handshake checks.
            </p>
          </div>

          {/* PIN Lock Settings */}
          <div className="rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-teal-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Application PIN Protection</h4>
                  <p className="text-[11px] text-slate-500">Require 4-digit PIN when opening app</p>
                </div>
              </div>
              <button
                onClick={() => setupPin(pinInput, !isPinEnabled)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  isPinEnabled ? 'bg-rose-100 text-rose-700' : 'bg-teal-600 text-white'
                }`}
              >
                {isPinEnabled ? 'Disable PIN' : 'Enable PIN'}
              </button>
            </div>

            {isPinEnabled && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <label className="font-bold text-slate-700 shrink-0">Current PIN:</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-24 p-2 text-center text-sm font-mono tracking-widest rounded-xl border border-slate-200 bg-white"
                  />
                  <button
                    onClick={() => setupPin(pinInput, true)}
                    className="px-3 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
                  >
                    Update PIN
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-200 flex gap-2">
                  <button
                    onClick={() => setPinLocked(true)}
                    className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock App Now</span>
                  </button>
                  <button
                    onClick={async () => {
                      await triggerBiometricAuthentication();
                      showToast('Biometric sensor test passed', 'success');
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Fingerprint className="w-3.5 h-3.5 text-teal-600" />
                    <span>Test Biometrics</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Data Control, Portability & Privacy Rights */}
          <div className="rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm space-y-4 text-xs">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-teal-600" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">User Data Control &amp; Privacy Rights</h4>
                <p className="text-[11px] text-slate-500">You have complete ownership of your health and medical records</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              In healthcare, your personal medical records are confidential and legally protected. Under data protection regulations, you can export your complete clinical data history as a JSON file, or permanently erase your data across all cloud servers.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Export Full JSON Backup */}
              <button
                onClick={exportAllUserDataJSON}
                className="p-3 rounded-2xl bg-teal-50 border border-teal-200 hover:bg-teal-100/70 text-teal-900 font-bold flex items-center gap-2.5 transition active:scale-98 text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-teal-950">Export Backup (JSON)</span>
                  <span className="text-[10px] text-teal-700">Download complete health history</span>
                </div>
              </button>

              {/* Restore from JSON */}
              <label className="cursor-pointer p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold flex items-center gap-2.5 transition active:scale-98 text-left">
                <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900">Restore from JSON</span>
                  <span className="text-[10px] text-slate-500">Import valid medical backup file</span>
                </div>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>

              {/* View Terms of Use & Privacy Policy */}
              <button
                onClick={() => setShowLegalModal(true)}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold flex items-center gap-2.5 transition active:scale-98 text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-[#0a2540] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Scale className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900">Terms of Use &amp; Privacy Policy</span>
                  <span className="text-[10px] text-slate-500">Read statutory compliance &amp; rights</span>
                </div>
              </button>

              {/* Reset & Delete All User Data (Right to be Forgotten) */}
              <button
                onClick={() => setShowDeleteConfirmModal(true)}
                className="p-3 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100/70 text-rose-900 font-bold flex items-center gap-2.5 transition active:scale-98 text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-rose-950">Reset &amp; Erase All Data</span>
                  <span className="text-[10px] text-rose-700">Right to be forgotten (Permanent)</span>
                </div>
              </button>
            </div>

            {/* Optional Clinical Template Loader */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Need starter clinical data for testing?</span>
              <button
                onClick={loadClinicalStarterTemplate}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-semibold flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Load Clinical Starter Template</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS & WHATSAPP DISPATCH */}
      {activeTab === 'audit_whatsapp' && (
        <div className="space-y-4">
          {/* WhatsApp Dispatch History */}
          <div className="rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-900">WhatsApp Deep Link Notifications ({whatsappNotifications.length})</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Zimbabwe Deep Links Active
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {whatsappNotifications.map((wa) => (
                <div key={wa.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-bold text-slate-800">{wa.recipient}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                        {wa.type}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {new Date(wa.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 italic text-xs">"{wa.message}"</p>
                  </div>
                  <a
                    href={wa.deepLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 self-start sm:self-center px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] inline-flex items-center gap-1.5 shadow-sm transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open in WhatsApp</span>
                  </a>
                </div>
              ))}
              {whatsappNotifications.length === 0 && (
                <p className="text-slate-400 py-6 text-center italic">
                  No WhatsApp notifications recorded yet. Medications and appointments will generate one-tap deep links here.
                </p>
              )}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm space-y-3 text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <h4 className="font-bold text-slate-900">Local Security Audit Trail ({auditLogs.length})</h4>
            </div>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                        {log.category}
                      </span>
                      <span className="font-semibold text-slate-800">{log.action}</span>
                    </div>
                    {log.details && <p className="text-[11px] text-slate-500 mt-0.5">{log.details}</p>}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD EMERGENCY CONTACT */}
      {showAddContactModal && (
        <div 
          onClick={() => setShowAddContactModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Emergency Contact</h3>
              <button onClick={() => setShowAddContactModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addEmergencyContact(newContact);
                setShowAddContactModal(false);
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Contact Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Tendai Moyo"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Relationship</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Spouse, Brother"
                    value={newContact.relationship}
                    onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newContact.priorityLevel}
                    onChange={(e) => setNewContact({ ...newContact, priorityLevel: parseInt(e.target.value, 10) as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value={1}>1 (First Call)</option>
                    <option value={2}>2 (Second Call)</option>
                    <option value={3}>3 (Backup)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number (+263)</label>
                <input
                  required
                  type="text"
                  placeholder="+263 77 123 4567"
                  value={newContact.phoneNumber}
                  onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Emergency Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Lives 5 mins away, has car"
                  value={newContact.emergencyNotes}
                  onChange={(e) => setNewContact({ ...newContact, emergencyNotes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET & ERASE ALL DATA CONFIRMATION */}
      {showDeleteConfirmModal && (
        <div 
          onClick={() => !isDeleting && setShowDeleteConfirmModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-rose-200 space-y-4"
          >
            <div className="flex items-start justify-between pb-3 border-b border-rose-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-rose-950">Reset &amp; Erase All Data?</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600">
                    Right to be Forgotten (Permanent)
                  </span>
                </div>
              </div>
              <button 
                onClick={() => !isDeleting && setShowDeleteConfirmModal(false)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                disabled={isDeleting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-rose-950">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Warning: This action cannot be reversed.</span>
                </p>
                <p className="text-[11px] text-rose-800">
                  All clinical vitals, medication logs, appointments, medical records, home care tasks, and local device keys will be permanently erased from this browser and cloud databases.
                </p>
              </div>

              <p>
                Under the <strong>Zimbabwe Data Protection Act [Chapter 11:12]</strong>, you have absolute ownership and sovereignty over your healthcare data.
              </p>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-[11px]">Recommended: Save a copy first</div>
                  <div className="text-[10px] text-slate-500">Download your records before resetting</div>
                </div>
                <button
                  type="button"
                  onClick={exportAllUserDataJSON}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-bold flex items-center gap-1 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition text-xs"
              >
                Cancel &amp; Keep Data
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await eraseAllUserDataAndReset();
                    setShowDeleteConfirmModal(false);
                    showToast('All your user and health data has been permanently wiped.', 'info');
                  } catch (err) {
                    console.error('Delete error:', err);
                    showToast('Failed to completely erase data', 'error');
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center justify-center gap-1.5 text-xs shadow-md shadow-rose-600/20 active:scale-95"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Erasing Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Permanent Erasure</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRO SUBSCRIPTION RENEWAL TERMS */}
      <RenewalTermsModal
        isOpen={showRenewalTermsModal}
        onClose={() => setShowRenewalTermsModal(false)}
        selectedTier={selectedTierForRenewalModal}
        billingCycle={billingCycle}
      />

      {/* MODAL: LEGAL, DMCA & DATA PRIVACY POLICY */}
      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        defaultTab={legalModalTab}
      />

    </div>
  );
};
