import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../lib/translations';
import { UserRole, Language, FontSize } from '../../types';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { logout, ADMIN_EMAIL } from '../../lib/authService';
import { AdminUserManagementModal } from '../auth/AdminUserManagementModal';
import { RemindersCenterModal } from '../reminders/RemindersCenterModal';
import { calculateActiveReminders } from '../../lib/remindersEngine';
import { 
  HeartPulse, 
  Globe, 
  Type, 
  Sun, 
  UserCheck, 
  Briefcase, 
  ChevronDown, 
  X, 
  LogOut, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Sparkles, 
  LogIn,
  Home,
  UserPlus,
  Bell,
  ShieldAlert
} from 'lucide-react';

interface HeaderProps {
  activeTab?: string;
  onNavigateTab?: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onNavigateTab }) => {
  const firebaseUser = useAppStore(s => s.firebaseUser);
  const setFirebaseUser = useAppStore(s => s.setFirebaseUser);
  const setShowAuthModal = useAppStore(s => s.setShowAuthModal);
  const showToast = useAppStore(s => s.showToast);

  const userProfile = useAppStore(s => s.userProfile);
  const medications = useAppStore(s => s.medications);
  const medicationLogs = useAppStore(s => s.medicationLogs);
  const appointments = useAppStore(s => s.appointments);
  const carePlan = useAppStore(s => s.carePlan);
  const language = useAppStore(s => s.language);
  const setLanguage = useAppStore(s => s.setLanguage);
  const fontSize = useAppStore(s => s.fontSize);
  const setFontSize = useAppStore(s => s.setFontSize);
  const highContrast = useAppStore(s => s.highContrast);
  const setHighContrast = useAppStore(s => s.setHighContrast);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const showRemindersCenterModal = useAppStore(s => s.showRemindersCenterModal);
  const setShowRemindersCenterModal = useAppStore(s => s.setShowRemindersCenterModal);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showAccessMenu, setShowAccessMenu] = useState(false);

  const readNotificationIds = useAppStore(s => s.readNotificationIds);

  const allReminders = calculateActiveReminders(
    medications,
    medicationLogs,
    appointments,
    carePlan?.tasks || []
  );
  // Red counter strictly counts active due/missed/overdue reminders that user has NOT marked read or done
  const unreadAlerts = allReminders.filter(
    r => !r.isCompleted && 
         !readNotificationIds.includes(r.id) && 
         (r.dueStatus === 'due_now' || r.dueStatus === 'overdue' || r.dueStatus === 'missed')
  );
  const dueRemindersCount = unreadAlerts.length;

  const t = getTranslation(language);

  // Formatted role display
  const getRoleLabel = (role?: UserRole | string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'doctor':
        return 'Doctor/Clinician';
      case 'pharmacist':
        return 'Pharmacist';
      case 'caregiver':
        return 'Caregiver';
      case 'patient':
      default:
        return 'Patient';
    }
  };

  const currentRole = firebaseUser?.role || 'patient';
  const displayName = firebaseUser?.fullName || userProfile.fullName || 'Guest Patient';
  const roleLabel = getRoleLabel(currentRole);
  const isAdmin = currentRole === 'admin' || (firebaseUser?.email && firebaseUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  const handleSignOut = async () => {
    try {
      await logout();
      setFirebaseUser(null);
      setShowAccountModal(false);
      if (onNavigateTab) {
        onNavigateTab('landing');
      }
      showToast('Signed out of session successfully. All health data secured.', 'info');
    } catch (err: any) {
      console.error('Logout error:', err);
      showToast('Failed to sign out cleanly', 'error');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0a2540] text-white border-b border-teal-900/40 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Logo & Tag */}
        <div 
          onClick={() => onNavigateTab?.(firebaseUser ? 'dashboard' : 'landing')}
          className="flex items-center gap-2.5 sm:gap-3 shrink-0 cursor-pointer group"
          title="Return to Home"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white shrink-0 group-hover:scale-105 transition-transform">
            <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-sm sm:text-lg tracking-tight leading-none text-white">
                COMFORT <span className="text-teal-400">MEDI+</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                ZW OFFLINE
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-300 leading-none mt-1 truncate max-w-[120px] sm:max-w-none">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Action Controls & Top Right User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* PWA Install Button */}
          <PWAInstallButton compact />

          {/* Health Reminders Bell Button with Live Badge */}
          <button
            onClick={() => {
              setShowRemindersModal(true);
              setShowLangMenu(false);
              setShowAccessMenu(false);
              setShowAccountModal(false);
            }}
            className="relative flex items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 transition active:scale-95"
            title={`Health Reminders (${dueRemindersCount} active)`}
          >
            <Bell className={`w-3.5 h-3.5 ${dueRemindersCount > 0 ? 'text-amber-400 animate-bounce' : 'text-teal-400'}`} />
            {dueRemindersCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-md animate-pulse">
                {dueRemindersCount}
              </span>
            )}
          </button>

          {/* Admin RBAC Governance Shortcut */}
          {isAdmin && (
            <button
              onClick={() => {
                setShowAdminModal(true);
                setShowLangMenu(false);
                setShowAccessMenu(false);
                setShowAccountModal(false);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition active:scale-95"
              title="Admin User Management & Staff Governance"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin</span>
            </button>
          )}

          {/* Language Selector (EN, Shona, Ndebele) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLangMenu(!showLangMenu);
                setShowAccountModal(false);
                setShowAccessMenu(false);
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-semibold text-slate-200 transition"
              title="Select Language (English, Shona, Ndebele)"
            >
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <span className="uppercase text-[11px]">{language}</span>
            </button>

            {showLangMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] animate-in fade-in" 
                  onClick={() => setShowLangMenu(false)} 
                />
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-40 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95"
                >
                  <div className="flex items-center justify-between px-3 py-1 border-b border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Language</span>
                    <button 
                      onClick={() => setShowLangMenu(false)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  {[
                    { code: 'en' as Language, label: 'English' },
                    { code: 'sn' as Language, label: 'ChiShona' },
                    { code: 'nd' as Language, label: 'IsiNdebele' },
                  ].map((item) => (
                    <button
                      key={item.code}
                      onClick={() => {
                        setLanguage(item.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium transition ${
                        language === item.code ? 'bg-teal-50 text-teal-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* User Name & Role on Top Right Corner */}
          {firebaseUser ? (
            /* Logged in User Profile Avatar & Role */
            <div className="relative">
              <button
                onClick={() => {
                  setShowAccountModal(!showAccountModal);
                  setShowLangMenu(false);
                  setShowAccessMenu(false);
                }}
                className={`flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-2xl border text-white shadow-sm transition active:scale-95 ${
                  isAdmin 
                    ? 'bg-amber-950/60 hover:bg-amber-900/70 border-amber-500/60' 
                    : 'bg-slate-800/90 hover:bg-slate-700/90 border-teal-500/40'
                }`}
                title="View Authenticated Profile & Account"
              >
                <div className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 shadow-sm ${
                  isAdmin
                    ? 'bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950'
                    : 'bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950'
                }`}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left leading-tight max-w-[85px] xs:max-w-[125px] sm:max-w-[160px]">
                  <div className="text-xs font-bold text-slate-100 truncate">
                    {displayName}
                  </div>
                  <div className={`text-[10px] font-semibold truncate ${isAdmin ? 'text-amber-300' : 'text-teal-300'}`}>
                    {roleLabel}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* Authenticated Account Profile Window */}
              {showAccountModal && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-in fade-in" 
                    onClick={() => setShowAccountModal(false)} 
                  />
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-72 sm:w-80 rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-2xl font-black text-sm flex items-center justify-center text-slate-950 shadow-md ${
                          isAdmin
                            ? 'bg-gradient-to-tr from-amber-400 to-amber-200'
                            : 'bg-gradient-to-tr from-teal-500 to-emerald-400'
                        }`}>
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 truncate">{displayName}</h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider mt-0.5 ${
                            isAdmin 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                              : 'bg-teal-100 text-teal-800 border border-teal-200'
                          }`}>
                            {roleLabel}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAccountModal(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        title="Close window"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Account Details */}
                    <div className="space-y-1.5 text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      {firebaseUser.email && (
                        <div className="flex items-center gap-2 text-slate-600 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{firebaseUser.email}</span>
                        </div>
                      )}
                      {firebaseUser.phoneNumber && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{firebaseUser.phoneNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-500 text-[11px] pt-1 border-t border-slate-200/60">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>Auth: <strong className="capitalize">{firebaseUser.authProvider || 'Firebase'}</strong></span>
                      </div>
                    </div>

                    {/* Admin RBAC Upgrade Button (Only for Admin) */}
                    {isAdmin && (
                      <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>System Administrator</span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-snug">
                          User management, role authorization, and clinical oversight.
                        </p>
                        <button
                          onClick={() => {
                            setShowAccountModal(false);
                            setShowAdminModal(true);
                          }}
                          className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>User Management &amp; Roles</span>
                        </button>
                      </div>
                    )}

                    {/* Sign Out Button */}
                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      <button
                        onClick={handleSignOut}
                        className="flex-1 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-200 transition active:scale-95"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                      <button
                        onClick={() => setShowAccountModal(false)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Not logged in: Prominent Action Buttons */
            <div className="flex items-center gap-1.5 sm:gap-2">
              {activeTab === 'landing' ? (
                <>
                  <button
                    onClick={() => onNavigateTab?.('dashboard')}
                    className="hidden xs:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-teal-950/70 hover:bg-teal-900 border border-teal-500/40 text-teal-200 text-xs font-semibold transition active:scale-95"
                    title="Explore Interactive App as Guest"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Demo Mode</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowAuthModal(true, 'register');
                      setShowLangMenu(false);
                      setShowAccessMenu(false);
                    }}
                    className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition active:scale-95"
                    title="Register New Account"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-teal-300" />
                    <span>Register</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onNavigateTab?.('landing')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition active:scale-95"
                  title="Return to Landing Page & Overview"
                >
                  <Home className="w-3.5 h-3.5 text-teal-300" />
                  <span className="hidden sm:inline">Overview &amp; Features</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowAuthModal(true, 'signin');
                  setShowLangMenu(false);
                  setShowAccessMenu(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-md shadow-teal-500/20 active:scale-95 transition"
                title="Sign in with Google, Email, or Phone"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-950" />
                <span>Sign In</span>
              </button>
            </div>
          )}

          {/* Text Size & Contrast Display Settings */}
          <div className="relative">
            <button
              onClick={() => {
                setShowAccessMenu(!showAccessMenu);
                setShowAccountModal(false);
                setShowLangMenu(false);
              }}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 transition"
              title="Display & Accessibility"
            >
              <Type className="w-4 h-4 text-teal-400" />
            </button>

            {showAccessMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] animate-in fade-in" 
                  onClick={() => setShowAccessMenu(false)} 
                />
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 space-y-3"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800">Display Settings</span>
                    <button 
                      onClick={() => setShowAccessMenu(false)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Text Size
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                      {(['normal', 'large', 'xlarge'] as FontSize[]).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setFontSize(sz)}
                          className={`py-1 rounded-lg text-center font-medium capitalize text-[11px] transition ${
                            fontSize === sz ? 'bg-white text-teal-700 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {sz === 'normal' ? 'Normal' : sz === 'large' ? 'Large' : 'XL'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                      <Sun className="w-3.5 h-3.5 text-slate-500" />
                      <span>High Contrast</span>
                    </div>
                    <button
                      onClick={() => setHighContrast(!highContrast)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        highContrast ? 'bg-teal-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform absolute top-0.5 ${
                          highContrast ? 'left-[18px]' : 'left-[3px]'
                        }`}
                      />
                    </button>
                  </div>

                  <button
                    onClick={() => setShowAccessMenu(false)}
                    className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold transition"
                  >
                    Close Settings
                  </button>
                </div>
              </>
            )}
          </div>

        </div>

      </div>

      {/* Admin User Management Modal */}
      <AdminUserManagementModal 
        isOpen={showAdminModal} 
        onClose={() => setShowAdminModal(false)} 
      />

      {/* Global Health & Clinical Reminders Center */}
      <RemindersCenterModal
        isOpen={showRemindersModal || showRemindersCenterModal}
        onClose={() => {
          setShowRemindersModal(false);
          setShowRemindersCenterModal(false);
        }}
        onNavigateTab={onNavigateTab}
      />
    </header>
  );
};
