import React, { useState, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/layout/Header';
import { BottomNav, TabKey } from './components/layout/BottomNav';
import { OfflineIndicator } from './components/layout/OfflineIndicator';
import { PinLockModal } from './components/layout/PinLockModal';
import { NotificationToast } from './components/common/NotificationToast';
import { AuthModal } from './components/auth/AuthModal';
import { AssignedPatientsBanner } from './components/common/AssignedPatientsBanner';
import { LegalModal } from './components/legal/LegalModal';
import { RenewalTermsModal } from './components/subscription/RenewalTermsModal';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { syncUserProfile } from './lib/authService';
import { calculateActiveReminders, playReminderChime, sendBrowserNotification } from './lib/remindersEngine';
import { AutoWhatsAppAlertToast } from './components/reminders/AutoWhatsAppAlertToast';

import { DashboardView } from './components/dashboard/DashboardView';
import { MedicalRecordsView } from './components/records/MedicalRecordsView';
import { MedicationManagementView } from './components/medications/MedicationManagementView';
import { AppointmentBookingView } from './components/appointments/AppointmentBookingView';
import { HomeCareView } from './components/homecare/HomeCareView';
import { AIHealthAssistantView } from './components/ai/AIHealthAssistantView';
import { ProfileSettingsView } from './components/profile/ProfileSettingsView';
import { LandingPageView } from './components/landing/LandingPageView';
import { MissedRemindersAlertModal } from './components/reminders/MissedRemindersAlertModal';

export default function App() {
  const firebaseUser = useAppStore(s => s.firebaseUser);
  const setShowAuthModal = useAppStore(s => s.setShowAuthModal);
  const [activeTab, setActiveTab] = useState<TabKey | 'landing'>(() => {
    const user = useAppStore.getState().firebaseUser;
    return user ? 'dashboard' : 'landing';
  });
  const [openVitalsDirectly, setOpenVitalsDirectly] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | 'rights' | 'dmca'>('privacy');

  const showRenewalTermsModal = useAppStore(s => s.showRenewalTermsModal);
  const setShowRenewalTermsModal = useAppStore(s => s.setShowRenewalTermsModal);
  const setShowRemindersCenterModal = useAppStore(s => s.setShowRemindersCenterModal);
  const fontSize = useAppStore(s => s.fontSize);
  const highContrast = useAppStore(s => s.highContrast);
  const setFirebaseUser = useAppStore(s => s.setFirebaseUser);

  // Auth state subscriber and service worker registration
  useEffect(() => {
    // Listen for Firebase Auth changes (SSO, email, phone)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await syncUserProfile(user);
          setFirebaseUser(profile);
          setActiveTab(prev => (prev === 'landing' ? 'dashboard' : prev));
        } catch (err) {
          console.warn('Firebase user sync note:', err);
        }
      } else {
        // User logged out or session ended: ensure all data is cleared and return to overview/home
        setFirebaseUser(null);
        setActiveTab('landing');
      }
    });

    // Service worker registration check
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('SW register info:', err);
      });
    }

    return () => unsubscribe();
  }, [setFirebaseUser]);

  // Periodic Health Reminder & Auto WhatsApp Trigger Engine (every 15 seconds)
  useEffect(() => {
    const notifiedKeys = new Set<string>();

    const checkAndAutoTriggerReminders = () => {
      const state = useAppStore.getState();
      // Allow detection in authenticated mode or guest/demo mode
      const activeReminders = calculateActiveReminders(
        state.medications,
        state.medicationLogs,
        state.appointments,
        state.carePlan?.tasks || []
      );

      const todayStr = new Date().toISOString().split('T')[0];
      // Detect all reminders that are due now or overdue and not completed
      const dueList = activeReminders.filter(
        r => (r.dueStatus === 'due_now' || r.dueStatus === 'overdue') && !r.isCompleted
      );

      for (const reminder of dueList) {
        const triggerKey = `${reminder.id}_${todayStr}_${reminder.time}`;
        const alreadyFired = state.firedWhatsAppReminderKeys.includes(triggerKey) || notifiedKeys.has(triggerKey);

        if (!alreadyFired) {
          notifiedKeys.add(triggerKey);

          // 1. Play hospital-grade audio chime
          playReminderChime();

          // 2. Dispatch native device push notification if permitted
          sendBrowserNotification(
            `Comfort Medi+ Auto Reminder: ${reminder.title}`,
            `${reminder.subtitle} • Scheduled for ${reminder.targetTimeFormatted}`
          );

          // 3. Auto WhatsApp Direct Messaging Trigger (no user click needed)
          if (state.autoWhatsAppTriggerEnabled) {
            state.fireAutoWhatsAppReminder(reminder, false);
            state.showToast(`🚀 Auto-Fired WhatsApp DM for ${reminder.title}`, 'success');
          } else {
            state.showToast(`🔔 Reminder: ${reminder.title} is due now!`, 'info');
          }

          // Throttle to one auto-trigger per check tick
          break;
        }
      }
    };

    const interval = setInterval(checkAndAutoTriggerReminders, 15000);
    // Initial check after 2 seconds
    const timeout = setTimeout(checkAndAutoTriggerReminders, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const fontSizeClass = {
    normal: 'text-sm',
    large: 'text-base font-normal tracking-wide',
    xlarge: 'text-lg font-medium tracking-wide',
  }[fontSize];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-150 ${
      highContrast 
        ? 'bg-black text-white contrast-150 selection:bg-teal-400 selection:text-black' 
        : 'bg-slate-100/70 text-slate-900 selection:bg-teal-500 selection:text-white'
    } ${fontSizeClass}`}>

      {/* Global PIN Lock Modal */}
      <PinLockModal />

      {/* Firebase Authentication Modal (Google SSO, Email, Phone) */}
      <AuthModal />

      {/* Global Toast Feedback */}
      <NotificationToast />

      {/* Auto-Fired WhatsApp Notification Toast & Direct Launcher */}
      <AutoWhatsAppAlertToast />

      {/* Proactive Missed Reminders & Dosage Recovery Modal (with status bar) */}
      <MissedRemindersAlertModal 
        onOpenRemindersCenter={() => setShowRemindersCenterModal(true)} 
      />

      {/* Top Application Header */}
      <Header 
        activeTab={activeTab}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Body Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 pb-28 sm:pb-32">
        {activeTab === 'landing' || !firebaseUser ? (
          <LandingPageView
            onOpenAuth={(mode) => setShowAuthModal(true, mode)}
            onLaunchApp={() => {
              if (firebaseUser) {
                setActiveTab('dashboard');
              } else {
                setShowAuthModal(true, 'signin');
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenLegal={(tab) => {
              setLegalModalTab(tab);
              setShowLegalModal(true);
            }}
          />
        ) : (
          <>
            {/* Clinical Staff Assigned Patients Banner (for Doctors, Clinicians & Admins) */}
            <AssignedPatientsBanner />

            {activeTab === 'dashboard' && (
              <DashboardView 
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenQuickVitals={() => {
                  setOpenVitalsDirectly(true);
                  setActiveTab('homecare');
                }}
              />
            )}

            {activeTab === 'records' && (
              <MedicalRecordsView />
            )}

            {activeTab === 'medications' && (
              <MedicationManagementView />
            )}

            {activeTab === 'appointments' && (
              <AppointmentBookingView />
            )}

            {activeTab === 'homecare' && (
              <HomeCareView initialOpenVitalsModal={openVitalsDirectly} />
            )}

            {activeTab === 'ai' && (
              <AIHealthAssistantView />
            )}

            {activeTab === 'profile' && (
              <ProfileSettingsView />
            )}

            {/* Floating Background Content & Footer with Legal Compliance Links */}
            <footer className="mt-12 mb-6 pt-6 pb-24 sm:pb-28 border-t border-slate-200/60 text-center space-y-2 text-xs text-slate-500">
              {/* Statutory Compliance & Data Sovereignty Links */}
              <div className="flex items-center justify-center gap-3 text-[11px] font-semibold text-slate-600 flex-wrap">
                <button
                  onClick={() => {
                    setLegalModalTab('privacy');
                    setShowLegalModal(true);
                  }}
                  className="hover:text-teal-700 underline underline-offset-2 transition"
                >
                  Privacy Policy (Data Protection Act)
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => {
                    setLegalModalTab('terms');
                    setShowLegalModal(true);
                  }}
                  className="hover:text-teal-700 underline underline-offset-2 transition"
                >
                  Terms of Use &amp; Clinical Disclaimers
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => {
                    setLegalModalTab('dmca');
                    setShowLegalModal(true);
                  }}
                  className="hover:text-teal-700 underline underline-offset-2 transition font-bold"
                >
                  DMCA Copyright Agent (Non-Liability)
                </button>
                <span className="text-slate-300">•</span>
                <button
                  onClick={() => {
                    setLegalModalTab('rights');
                    setShowLegalModal(true);
                  }}
                  className="hover:text-teal-700 underline underline-offset-2 transition"
                >
                  Patient Data Rights (JSON Export / Erasure)
                </button>
              </div>

              <p className="font-semibold text-slate-600">
                @2026 Comfort Medi+, All Rights Reserved
              </p>
              <p className="text-[11px] text-slate-500">
                Developed with ❤️ by <a href="https://wa.me/263772824132" target="_blank" rel="noopener noreferrer" className="font-bold text-teal-700 hover:text-teal-800 underline">Comfort Designs</a> - <a href="tel:+263772824132" className="text-slate-600 hover:underline">+263772824132</a>
              </p>
            </footer>
          </>
        )}
      </main>

      {/* Non-intrusive Offline & Sync Queue Indicator */}
      <OfflineIndicator />

      {/* Persistent Floating Bottom Navigation with High Glassmorphism & Cyan Interaction (Authenticated Workspace Tabs only) */}
      {activeTab !== 'landing' && !!firebaseUser && (
        <BottomNav 
          activeTab={activeTab as TabKey}
          onSelectTab={(tab) => {
            setOpenVitalsDirectly(false);
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Global Statutory Legal Compliance & Patient Rights Modal */}
      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        defaultTab={legalModalTab}
      />

      {/* Global Pro Subscription Renewal Terms Modal (activeTab !== 'profile') */}
      {activeTab !== 'profile' && (
        <RenewalTermsModal
          isOpen={showRenewalTermsModal}
          onClose={() => setShowRenewalTermsModal(false)}
          selectedTier="pro"
        />
      )}

    </div>
  );
}
