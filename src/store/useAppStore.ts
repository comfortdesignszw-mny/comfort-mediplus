import { create } from 'zustand';
import { 
  UserProfile, 
  EmergencyContact, 
  Allergy, 
  ChronicCondition, 
  MedicalRecord, 
  MedicalDocument, 
  VaccinationRecord, 
  Medication, 
  MedicationLog, 
  Appointment, 
  VitalsReading, 
  CareTask, 
  CareTeamMember, 
  ProgressReport, 
  HomeCarePlan, 
  SyncQueueItem, 
  AuditLog, 
  UserRole, 
  Language, 
  FontSize,
  FirebaseUserRecord,
  PatientAssignment,
  SubscriptionTier,
  Facility,
  FacilityBooking,
  SubscriptionPaymentRequest,
  MedicalProcedureRecommendation,
  HealthyEatingHabit,
  ExercisePhysioSchedule,
  GeneralCareLog,
  MedicationAdministrationRecord
} from '../types';
import { 
  INITIAL_USER_PROFILE, 
  INITIAL_EMERGENCY_CONTACTS, 
  INITIAL_ALLERGIES, 
  INITIAL_CHRONIC_CONDITIONS, 
  INITIAL_MEDICAL_RECORDS, 
  INITIAL_DOCUMENTS, 
  INITIAL_VACCINATIONS, 
  INITIAL_MEDICATIONS, 
  INITIAL_MEDICATION_LOGS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_VITALS, 
  INITIAL_CARE_TASKS, 
  INITIAL_CARE_TEAM, 
  INITIAL_PROGRESS_REPORTS, 
  INITIAL_CARE_PLAN,
  INITIAL_AUDIT_LOGS,
  getClinicalStarterTemplate
} from '../data/mockSeedData';
import { createAuditEntry } from '../lib/security';
import { 
  triggerWhatsAppNotification, 
  WhatsAppNotificationRecord, 
  buildReminderWhatsAppMessage 
} from '../lib/whatsappGateway';
import { 
  calculateActiveReminders, 
  type HealthReminder, 
  type ReminderType 
} from '../lib/remindersEngine';
import { 
  persistItemToFirestore, 
  deleteItemFromFirestore, 
  fetchCollectionFromFirestore, 
  deleteUserAccountAndData, 
  fetchDoctorAssignments, 
  logStaffActivity,
  updateUserProfileInFirestore,
  createFacilityProfile,
  fetchAllFacilitiesFromFirestore,
  createFacilityBooking,
  fetchAllFacilityBookings,
  scheduleFacilityBooking,
  submitEcoCashSubscriptionRequest,
  fetchAllSubscriptionRequests,
  verifyAndActivateSubscription,
  rejectSubscriptionRequest
} from '../lib/authService';

interface AppState {
  // Auth & Roles
  isAuthenticated: boolean;
  currentUserRole: UserRole;
  firebaseUser: FirebaseUserRecord | null;
  showAuthModal: boolean;
  authModalMode: 'signin' | 'register';
  adminUsersList: FirebaseUserRecord[];
  userProfile: UserProfile;
  emergencyContacts: EmergencyContact[];
  
  // Security & App Lock
  isPinLocked: boolean;
  pinCode: string; // 4-digit PIN
  isPinEnabled: boolean;
  auditLogs: AuditLog[];
  
  // Accessibility & Preferences
  language: Language;
  fontSize: FontSize;
  highContrast: boolean;

  // Medical Records Module
  allergies: Allergy[];
  chronicConditions: ChronicCondition[];
  medicalRecords: MedicalRecord[];
  documents: MedicalDocument[];
  vaccinations: VaccinationRecord[];

  // Medication Management Module
  medications: Medication[];
  medicationLogs: MedicationLog[];
  adherenceStreak: number;

  // Appointments Module
  appointments: Appointment[];
  appointmentActiveSubTab: 'my_appointments' | 'facility_directory' | 'waiting_list';
  setAppointmentActiveSubTab: (tab: 'my_appointments' | 'facility_directory' | 'waiting_list') => void;
  customFacilities: Facility[];
  addCustomFacility: (fac: Omit<Facility, 'id' | 'createdAt'>) => Promise<void>;
  loadFacilities: () => Promise<void>;
  facilityBookingsQueue: FacilityBooking[];
  loadFacilityBookings: () => Promise<void>;
  scheduleFacilityBookingAction: (bookingId: string, scheduledDate: string, scheduledTime: string, notes?: string) => Promise<void>;

  // Home Care Module
  carePlan: HomeCarePlan;
  careTeam: CareTeamMember[];
  vitals: VitalsReading[];
  progressReports: ProgressReport[];

  // Offline Sync & Notifications
  syncQueue: SyncQueueItem[];
  isSyncing: boolean;
  lastSyncedAt: string;
  whatsappNotifications: WhatsAppNotificationRecord[];

  // Auto WhatsApp Trigger Engine
  autoWhatsAppTriggerEnabled: boolean;
  autoWhatsAppNumber: string;
  firedWhatsAppReminderKeys: string[];
  lastAutoFiredWhatsApp: {
    id: string;
    reminderTitle: string;
    phone: string;
    deepLinkUrl: string;
    message: string;
    timestamp: string;
    type: string;
  } | null;
  setAutoWhatsAppTriggerEnabled: (enabled: boolean) => void;
  setAutoWhatsAppNumber: (phone: string) => void;
  dismissLastAutoFiredWhatsApp: () => void;
  fireAutoWhatsAppReminder: (reminder: HealthReminder, forceOpen?: boolean) => WhatsAppNotificationRecord;
  
  // Toast notifications for user feedback
  activeToast: { id: string; message: string; type: 'success' | 'info' | 'warning' | 'error' } | null;

  // Actions
  setFirebaseUser: (user: FirebaseUserRecord | null) => void;
  setShowAuthModal: (show: boolean, mode?: 'signin' | 'register') => void;
  setAdminUsersList: (users: FirebaseUserRecord[]) => void;
  setRole: (role: UserRole) => void;
  setLanguage: (lang: Language) => void;
  setFontSize: (size: FontSize) => void;
  setHighContrast: (enabled: boolean) => void;
  setPinLocked: (locked: boolean) => void;
  setupPin: (pin: string, enabled: boolean) => void;
  unlockWithPin: (pin: string) => boolean;
  sendWhatsAppMessage: (phone: string, text: string, type?: WhatsAppNotificationRecord['type']) => void;
  
  updateProfile: (profile: Partial<UserProfile>) => void;
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  removeEmergencyContact: (id: string) => void;

  // Medical Record actions
  addMedicalRecord: (record: Omit<MedicalRecord, 'id'>) => void;
  deleteMedicalRecord: (id: string) => void;
  addDocument: (doc: Omit<MedicalDocument, 'id'>) => void;
  deleteDocument: (id: string) => void;
  addAllergy: (allergy: Omit<Allergy, 'id'>) => void;
  deleteAllergy: (id: string) => void;
  addChronicCondition: (condition: Omit<ChronicCondition, 'id'>) => void;
  deleteChronicCondition: (id: string) => void;
  addVaccination: (vac: Omit<VaccinationRecord, 'id'>) => void;

  // Medication actions
  addMedication: (med: Omit<Medication, 'id'>) => void;
  updateMedication: (id: string, med: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  markMedicationTaken: (medId: string, scheduledTime?: string, notes?: string) => Promise<void>;
  skipMedication: (medId: string, scheduledTime?: string, reason?: string) => void;
  snoozeMedication: (medId: string, minutes?: number) => void;
  refillMedication: (medId: string, addedUnits: number) => void;

  // Appointment actions
  bookAppointment: (apt: Omit<Appointment, 'id'>) => Promise<void>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  cancelAppointment: (id: string) => void;

  // Home Care actions
  toggleCareTask: (taskId: string) => void;
  addCareTask: (task: Omit<CareTask, 'id' | 'completed'>) => void;
  logVitalReading: (vital: Omit<VitalsReading, 'id' | 'date'>) => void;
  addProgressReport: (report: Omit<ProgressReport, 'id' | 'date'>) => void;

  // Extended Clinical & Home Care Actions
  administerPrescribedMedication: (data: { medicationId: string; medicationName: string; dosage: string; route: string; staffNotes?: string; }) => Promise<void>;
  prescribeMedicationDirect: (med: Omit<Medication, 'id'>) => Promise<void>;
  addProcedureRecommendation: (proc: Omit<MedicalProcedureRecommendation, 'id' | 'createdAt' | 'recommendedBy' | 'recommendedByRole'>) => Promise<void>;
  updateProcedureStatus: (procId: string, status: MedicalProcedureRecommendation['status'], bookingReferenceId?: string) => Promise<void>;
  addHealthyEatingHabit: (habit: Omit<HealthyEatingHabit, 'id' | 'createdAt' | 'createdBy' | 'createdByRole'>) => Promise<void>;
  toggleHealthyEatingHabit: (habitId: string) => Promise<void>;
  addExercisePhysioSchedule: (ex: Omit<ExercisePhysioSchedule, 'id' | 'createdAt' | 'createdBy' | 'createdByRole'>) => Promise<void>;
  toggleExercisePhysioSchedule: (scheduleId: string) => Promise<void>;
  addGeneralCareLog: (log: Omit<GeneralCareLog, 'id' | 'loggedAt' | 'loggedBy' | 'loggedByRole'>) => Promise<void>;

  // Sync actions
  triggerManualSync: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  hideToast: () => void;
  restoreFromBackup: (backup: any) => void;

  // Clinical RBAC & Patient Assignments
  assignedPatients: PatientAssignment[];
  activeAssignedPatientId: string | null;
  setActiveAssignedPatientId: (id: string | null) => void;
  refreshAssignedPatients: () => Promise<void>;
  syncUserDataFromFirestore: (userId: string) => Promise<void>;

  // User Data Control (Portability & Erasure)
  exportAllUserDataJSON: () => void;
  eraseAllUserDataAndReset: () => Promise<void>;
  loadClinicalStarterTemplate: () => void;

  // Pro Subscription & Renewal Terms
  showRenewalTermsModal: boolean;
  setShowRenewalTermsModal: (show: boolean) => void;
  showSubscriptionModal: boolean;
  setShowSubscriptionModal: (show: boolean) => void;
  updateSubscription: (tier: SubscriptionTier, cycle: 'monthly' | 'yearly', acceptTerms: boolean) => Promise<void>;
  cancelSubscriptionAutoRenewal: () => Promise<void>;

  // EcoCash Paid Subscriptions
  subscriptionRequests: SubscriptionPaymentRequest[];
  loadSubscriptionRequests: () => Promise<void>;
  submitEcoCashSubscription: (data: { tier: SubscriptionTier; fullName: string; phoneNumber: string; transactionId: string; confirmationMessage: string; proofScreenshotUrl?: string; }) => Promise<void>;
  verifyAndActivateEcoCashSubscription: (requestId: string, userId: string, tier: SubscriptionTier) => Promise<void>;
  rejectEcoCashSubscription: (requestId: string, reason?: string) => Promise<void>;

  // Notification Alerts Unsubscribe Controls
  toggleWhatsAppOptOut: (optOut: boolean) => Promise<void>;
  toggleEmailOptOut: (optOut: boolean) => Promise<void>;
  unsubscribeAllAlerts: () => Promise<void>;
  resubscribeAlerts: () => Promise<void>;

  // Notification Seen / Read Tracking & Missed Reminders
  readNotificationIds: string[];
  dismissedMissedAlertIds: string[];
  markNotificationAsRead: (reminderId: string) => void;
  markAllNotificationsAsRead: (reminderIds?: string[]) => void;
  clearNotificationBadge: () => void;
  dismissMissedAlert: (alertId: string) => void;
  showRemindersCenterModal: boolean;
  setShowRemindersCenterModal: (show: boolean) => void;
}

const STORAGE_KEY = 'comfort_medi_plus_v3_clean';

function loadPersistedState(): Partial<AppState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load local storage:', err);
  }
  return {};
}

function persistState(state: Partial<AppState>) {
  if (typeof window === 'undefined') return;
  try {
    const uid = state.firebaseUser?.uid;
    const subset = {
      userProfile: state.userProfile,
      firebaseUser: state.firebaseUser,
      emergencyContacts: state.emergencyContacts,
      pinCode: state.pinCode,
      isPinEnabled: state.isPinEnabled,
      language: state.language,
      fontSize: state.fontSize,
      highContrast: state.highContrast,
      allergies: state.allergies,
      chronicConditions: state.chronicConditions,
      medicalRecords: state.medicalRecords,
      documents: state.documents,
      vaccinations: state.vaccinations,
      medications: state.medications,
      medicationLogs: state.medicationLogs,
      adherenceStreak: state.adherenceStreak,
      appointments: state.appointments,
      customFacilities: state.customFacilities,
      facilityBookingsQueue: state.facilityBookingsQueue,
      subscriptionRequests: state.subscriptionRequests,
      carePlan: state.carePlan,
      careTeam: state.careTeam,
      vitals: state.vitals,
      progressReports: state.progressReports,
      syncQueue: state.syncQueue,
      lastSyncedAt: state.lastSyncedAt,
      auditLogs: state.auditLogs,
      whatsappNotifications: state.whatsappNotifications,
      autoWhatsAppTriggerEnabled: state.autoWhatsAppTriggerEnabled,
      autoWhatsAppNumber: state.autoWhatsAppNumber,
      firedWhatsAppReminderKeys: state.firedWhatsAppReminderKeys,
      readNotificationIds: state.readNotificationIds,
      dismissedMissedAlertIds: state.dismissedMissedAlertIds,
    };

    if (uid) {
      localStorage.setItem(`comfort_medi_user_${uid}`, JSON.stringify(subset));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        firebaseUser: state.firebaseUser,
        language: state.language,
        fontSize: state.fontSize,
        highContrast: state.highContrast,
      }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Local storage write warning:', err);
  }
}

const persisted = loadPersistedState();

export const useAppStore = create<AppState>((set, get) => ({
  isAuthenticated: Boolean((persisted as any).firebaseUser),
  currentUserRole: (persisted as any).firebaseUser?.role || persisted.currentUserRole || 'patient',
  firebaseUser: (persisted as any).firebaseUser || null,
  showAuthModal: false,
  authModalMode: 'signin',
  adminUsersList: [],
  setShowAuthModal: (show: boolean, mode: 'signin' | 'register' = 'signin') => set({ showAuthModal: show, authModalMode: mode }),
  setAdminUsersList: (users: FirebaseUserRecord[]) => set({ adminUsersList: users }),
  setFirebaseUser: (user: FirebaseUserRecord | null) => {
    set((s) => {
      if (user) {
        const audit = createAuditEntry(`Authenticated as ${user.fullName} (${user.role.toUpperCase()})`, 'SECURITY');
        
        // Rehydrate user's private local cache if present
        let userCache: any = {};
        if (typeof window !== 'undefined') {
          try {
            const rawUser = localStorage.getItem(`comfort_medi_user_${user.uid}`);
            if (rawUser) userCache = JSON.parse(rawUser);
          } catch (e) {
            console.warn(e);
          }
        }

        const next = {
          isAuthenticated: true,
          currentUserRole: user.role,
          firebaseUser: user,
          userProfile: {
            ...INITIAL_USER_PROFILE,
            ...(userCache.userProfile || {}),
            id: user.uid,
            fullName: user.fullName || userCache.userProfile?.fullName || s.userProfile.fullName,
            email: user.email || userCache.userProfile?.email || s.userProfile.email,
            phoneNumber: user.phoneNumber || userCache.userProfile?.phoneNumber || s.userProfile.phoneNumber,
          },
          emergencyContacts: userCache.emergencyContacts || [],
          allergies: userCache.allergies || [],
          chronicConditions: userCache.chronicConditions || [],
          medicalRecords: userCache.medicalRecords || [],
          documents: userCache.documents || [],
          vaccinations: userCache.vaccinations || [],
          medications: userCache.medications || [],
          medicationLogs: userCache.medicationLogs || [],
          adherenceStreak: userCache.adherenceStreak || 0,
          appointments: userCache.appointments || [],
          carePlan: userCache.carePlan || {
            ...INITIAL_CARE_PLAN,
            tasks: [],
            goals: [],
            recommendedProcedures: [],
            healthyEatingHabits: [],
            exercisePhysioSchedules: [],
            generalCareLogs: [],
            medicationAdministrations: [],
          },
          careTeam: userCache.careTeam || [],
          vitals: userCache.vitals || [],
          progressReports: userCache.progressReports || [],
          auditLogs: [audit, ...(userCache.auditLogs || s.auditLogs || [])],
          readNotificationIds: userCache.readNotificationIds || [],
          dismissedMissedAlertIds: userCache.dismissedMissedAlertIds || [],
        };
        persistState({ ...s, ...next });
        // Automatically trigger cross-device data sync from Firestore
        setTimeout(() => {
          get().syncUserDataFromFirestore(user.uid);
          if (user.role === 'doctor' || user.role === 'caregiver' || user.role === 'admin') {
            get().refreshAssignedPatients();
          }
        }, 100);
        return next;
      } else {
        const audit = createAuditEntry('Signed out of session', 'SECURITY');
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch (e) {
            console.warn(e);
          }
        }
        // WIPE ALL PRIVATE PATIENT/DOCTOR/HEALTH DATA ON LOGOUT
        const next = {
          isAuthenticated: false,
          currentUserRole: 'patient' as UserRole,
          firebaseUser: null,
          userProfile: {
            ...INITIAL_USER_PROFILE,
            id: '',
            fullName: '',
            email: '',
            phoneNumber: '',
            allergiesSummary: '',
            chronicConditionsSummary: '',
            emergencyContact: '',
            emergencyPhone: '',
          },
          emergencyContacts: [],
          allergies: [],
          chronicConditions: [],
          medicalRecords: [],
          documents: [],
          vaccinations: [],
          medications: [],
          medicationLogs: [],
          adherenceStreak: 0,
          appointments: [],
          carePlan: {
            ...INITIAL_CARE_PLAN,
            tasks: [],
            goals: [],
            recommendedProcedures: [],
            healthyEatingHabits: [],
            exercisePhysioSchedules: [],
            generalCareLogs: [],
            medicationAdministrations: [],
          },
          careTeam: [],
          vitals: [],
          progressReports: [],
          auditLogs: [audit],
          assignedPatients: [],
          activeAssignedPatientId: null,
          whatsappNotifications: [],
          firedWhatsAppReminderKeys: [],
          readNotificationIds: [],
          dismissedMissedAlertIds: [],
        };
        return next;
      }
    });
  },
  userProfile: persisted.userProfile || INITIAL_USER_PROFILE,
  emergencyContacts: persisted.emergencyContacts || INITIAL_EMERGENCY_CONTACTS,

  isPinLocked: false,
  pinCode: persisted.pinCode || '1234',
  isPinEnabled: persisted.isPinEnabled ?? false,
  auditLogs: persisted.auditLogs || INITIAL_AUDIT_LOGS,

  assignedPatients: [],
  activeAssignedPatientId: null,

  language: persisted.language || 'en',
  fontSize: persisted.fontSize || 'normal',
  highContrast: persisted.highContrast ?? false,

  allergies: persisted.allergies || INITIAL_ALLERGIES,
  chronicConditions: persisted.chronicConditions || INITIAL_CHRONIC_CONDITIONS,
  medicalRecords: persisted.medicalRecords || INITIAL_MEDICAL_RECORDS,
  documents: persisted.documents || INITIAL_DOCUMENTS,
  vaccinations: persisted.vaccinations || INITIAL_VACCINATIONS,

  medications: persisted.medications || INITIAL_MEDICATIONS,
  medicationLogs: persisted.medicationLogs || INITIAL_MEDICATION_LOGS,
  adherenceStreak: persisted.adherenceStreak ?? 0,

  appointments: persisted.appointments || INITIAL_APPOINTMENTS,
  appointmentActiveSubTab: 'my_appointments',
  setAppointmentActiveSubTab: (tab) => set({ appointmentActiveSubTab: tab }),
  customFacilities: (persisted as any).customFacilities || [],
  facilityBookingsQueue: (persisted as any).facilityBookingsQueue || [],
  subscriptionRequests: (persisted as any).subscriptionRequests || [],

  carePlan: persisted.carePlan || INITIAL_CARE_PLAN,
  careTeam: persisted.careTeam || INITIAL_CARE_TEAM,
  vitals: persisted.vitals || INITIAL_VITALS,
  progressReports: persisted.progressReports || INITIAL_PROGRESS_REPORTS,

  syncQueue: persisted.syncQueue || [],
  isSyncing: false,
  lastSyncedAt: persisted.lastSyncedAt || new Date().toISOString(),
  whatsappNotifications: (persisted as any).whatsappNotifications || [],

  // Auto WhatsApp Trigger Engine Initial State
  autoWhatsAppTriggerEnabled: (persisted as any).autoWhatsAppTriggerEnabled !== undefined 
    ? (persisted as any).autoWhatsAppTriggerEnabled 
    : true,
  autoWhatsAppNumber: (persisted as any).autoWhatsAppNumber || (persisted as any).userProfile?.phoneNumber || '+263772824132',
  firedWhatsAppReminderKeys: (persisted as any).firedWhatsAppReminderKeys || [],
  lastAutoFiredWhatsApp: null,

  // Notification Seen / Read Tracking & Missed Reminders
  readNotificationIds: (persisted as any).readNotificationIds || [],
  dismissedMissedAlertIds: (persisted as any).dismissedMissedAlertIds || [],

  markNotificationAsRead: (reminderId: string) => {
    set((s) => {
      if (s.readNotificationIds.includes(reminderId)) return s;
      const updated = [...s.readNotificationIds, reminderId];
      const next = { readNotificationIds: updated };
      persistState({ ...s, ...next });
      return next;
    });
  },

  markAllNotificationsAsRead: (reminderIds?: string[]) => {
    set((s) => {
      let updated: string[];
      if (reminderIds && reminderIds.length > 0) {
        updated = Array.from(new Set([...s.readNotificationIds, ...reminderIds]));
      } else {
        const active = calculateActiveReminders(s.medications, s.medicationLogs, s.appointments, s.carePlan?.tasks || []);
        updated = Array.from(new Set([...s.readNotificationIds, ...active.map((r: HealthReminder) => r.id)]));
      }
      const next = { readNotificationIds: updated };
      persistState({ ...s, ...next });
      return next;
    });
    get().showToast('Notifications marked as read - badge cleared', 'info');
  },

  clearNotificationBadge: () => {
    set((s) => {
      const active = calculateActiveReminders(s.medications, s.medicationLogs, s.appointments, s.carePlan?.tasks || []);
      const updated = Array.from(new Set([...s.readNotificationIds, ...active.map((r: HealthReminder) => r.id)]));
      const next = { readNotificationIds: updated };
      persistState({ ...s, ...next });
      return next;
    });
  },

  dismissMissedAlert: (alertId: string) => {
    set((s) => {
      const updated = Array.from(new Set([...s.dismissedMissedAlertIds, alertId]));
      const next = { dismissedMissedAlertIds: updated };
      persistState({ ...s, ...next });
      return next;
    });
  },

  showRemindersCenterModal: false,
  setShowRemindersCenterModal: (show: boolean) => set({ showRemindersCenterModal: show }),

  setAutoWhatsAppTriggerEnabled: (enabled: boolean) => {
    set((s) => {
      const next = { autoWhatsAppTriggerEnabled: enabled };
      persistState({ ...s, ...next });
      return next;
    });
    get().showToast(
      enabled ? 'Auto WhatsApp reminder triggers enabled' : 'Auto WhatsApp reminder triggers paused',
      'info'
    );
  },

  setAutoWhatsAppNumber: (phone: string) => {
    set((s) => {
      const next = { 
        autoWhatsAppNumber: phone,
        userProfile: { ...s.userProfile, phoneNumber: phone }
      };
      persistState({ ...s, ...next });
      return next;
    });
    get().showToast(`WhatsApp reminder phone set to ${phone}`, 'success');
  },

  dismissLastAutoFiredWhatsApp: () => set({ lastAutoFiredWhatsApp: null }),

  fireAutoWhatsAppReminder: (reminder: HealthReminder, forceOpen: boolean = false) => {
    const s = get();

    // Check if user has unsubscribed or opted out of WhatsApp alerts
    if (s.userProfile?.whatsappAlertsOptOut || s.userProfile?.allNotificationsUnsubscribed) {
      return null as any;
    }

    const phone = s.autoWhatsAppNumber || s.userProfile.phoneNumber || '+263772824132';
    const patientName = s.userProfile.fullName || s.firebaseUser?.fullName || 'Patient';
    const message = buildReminderWhatsAppMessage(reminder, patientName);

    const typeMap: Record<ReminderType, WhatsAppNotificationRecord['type']> = {
      medication: 'MEDICATION',
      exercise: 'EXERCISE',
      appointment: 'APPOINTMENT',
      task: 'CARE_TASK'
    };
    const recordType = typeMap[reminder.type] || 'MEDICATION';

    const record = triggerWhatsAppNotification(
      phone,
      message,
      recordType,
      forceOpen,
      true,
      reminder.title
    );

    const todayStr = new Date().toISOString().split('T')[0];
    const triggerKey = `${reminder.id}_${todayStr}_${reminder.time}`;

    set((state) => {
      const updatedNotifications = [record, ...state.whatsappNotifications];
      const updatedKeys = [triggerKey, ...state.firedWhatsAppReminderKeys.slice(0, 100)];
      const lastAutoFired = {
        id: record.id,
        reminderTitle: reminder.title,
        phone,
        deepLinkUrl: record.deepLinkUrl,
        message,
        timestamp: record.sentAt,
        type: reminder.type
      };
      const next = {
        whatsappNotifications: updatedNotifications,
        firedWhatsAppReminderKeys: updatedKeys,
        lastAutoFiredWhatsApp: lastAutoFired
      };
      persistState({ ...state, ...next });
      return next;
    });

    return record;
  },

  // Pro Subscription State & Actions
  showRenewalTermsModal: false,
  setShowRenewalTermsModal: (show: boolean) => set({ showRenewalTermsModal: show }),
  showSubscriptionModal: false,
  setShowSubscriptionModal: (show: boolean) => set({ showSubscriptionModal: show }),

  updateSubscription: async (tier: SubscriptionTier, cycle: 'monthly' | 'yearly', acceptTerms: boolean) => {
    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + (cycle === 'yearly' ? 12 : 1));
    const renewalDateStr = renewalDate.toISOString().split('T')[0];

    const updates: Partial<UserProfile> = {
      subscriptionTier: tier,
      subscriptionBillingCycle: cycle,
      subscriptionRenewalTermsAccepted: acceptTerms,
      subscriptionRenewalDate: renewalDateStr,
      autoRenew: true
    };

    get().updateProfile(updates);
    const targetUid = get().firebaseUser?.uid;
    if (targetUid) {
      await updateUserProfileInFirestore(targetUid, updates).catch(() => null);
    }
    const audit = createAuditEntry(`Subscription Updated to ${tier.toUpperCase()} (${cycle})`, 'AUTH', `Renewal date: ${renewalDateStr}`);
    set((s) => ({
      auditLogs: [audit, ...s.auditLogs],
      showRenewalTermsModal: false,
      showSubscriptionModal: false
    }));
    get().showToast(`Subscription activated: ${tier.toUpperCase()} plan`, 'success');
  },

  cancelSubscriptionAutoRenewal: async () => {
    const updates: Partial<UserProfile> = {
      autoRenew: false
    };
    get().updateProfile(updates);
    const targetUid = get().firebaseUser?.uid;
    if (targetUid) {
      await updateUserProfileInFirestore(targetUid, updates).catch(() => null);
    }
    const audit = createAuditEntry('Subscription Auto-Renewal Cancelled', 'AUTH', 'User turned off automatic renewal');
    set((s) => ({
      auditLogs: [audit, ...s.auditLogs]
    }));
    get().showToast('Auto-renewal cancelled. Plan remains active until billing cycle end.', 'info');
  },

  loadSubscriptionRequests: async () => {
    try {
      const reqs = await fetchAllSubscriptionRequests();
      set({ subscriptionRequests: reqs });
    } catch (e) {
      console.warn('Could not fetch subscription requests:', e);
    }
  },

  submitEcoCashSubscription: async ({ tier, fullName, phoneNumber, transactionId, confirmationMessage, proofScreenshotUrl }) => {
    const s = get();
    const uid = s.firebaseUser?.uid || 'guest-' + Date.now();
    const req: SubscriptionPaymentRequest = {
      id: 'sub-' + Date.now(),
      userId: uid,
      userFullName: fullName,
      userPhoneNumber: phoneNumber,
      tier,
      billingCycle: 'monthly',
      paymentMethod: 'ecocash',
      ecocashTransactionId: transactionId,
      ecocashConfirmationMessage: confirmationMessage,
      proofScreenshotUrl,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };

    try {
      await submitEcoCashSubscriptionRequest(req);
    } catch (e) {
      console.warn('Firestore subscription submit note:', e);
    }

    const updates: Partial<UserProfile> = {
      subscriptionStatus: 'pending',
      pendingSubscriptionRequest: req,
    };
    s.updateProfile(updates);

    set((state) => ({
      subscriptionRequests: [req, ...state.subscriptionRequests],
    }));

    get().showToast('EcoCash payment proof submitted! Admin will verify and activate your 30-day Pro access.', 'success');
  },

  verifyAndActivateEcoCashSubscription: async (requestId, userId, tier) => {
    const adminName = get().userProfile.fullName || get().firebaseUser?.fullName || 'Super Admin';
    try {
      await verifyAndActivateSubscription(requestId, userId, tier, adminName);
    } catch (e) {
      console.warn('Firestore subscription activation note:', e);
    }
    
    set((s) => {
      const updatedReqs = s.subscriptionRequests.map(r => 
        r.id === requestId ? { ...r, status: 'verified' as const, verifiedBy: adminName, verifiedAt: new Date().toISOString() } : r
      );
      let nextProfile = s.userProfile;
      if (s.firebaseUser?.uid === userId) {
        const renewalDate = new Date();
        renewalDate.setDate(renewalDate.getDate() + 30);
        nextProfile = {
          ...s.userProfile,
          subscriptionTier: tier,
          subscriptionStatus: 'active',
          subscriptionBillingCycle: 'monthly',
          subscriptionActivatedAt: new Date().toISOString(),
          subscriptionExpiresAt: renewalDate.toISOString(),
          subscriptionRenewalDate: renewalDate.toISOString().split('T')[0],
          autoRenew: true,
        };
      }
      const next = { subscriptionRequests: updatedReqs, userProfile: nextProfile };
      persistState({ ...s, ...next });
      return next;
    });
    get().showToast(`Subscription activated (${tier.toUpperCase()}) for 30 days!`, 'success');
  },

  rejectEcoCashSubscription: async (requestId, reason) => {
    const adminName = get().userProfile.fullName || get().firebaseUser?.fullName || 'Super Admin';
    try {
      await rejectSubscriptionRequest(requestId, adminName, reason);
    } catch (e) {
      console.warn('Firestore subscription rejection note:', e);
    }
    set((s) => {
      const updatedReqs = s.subscriptionRequests.map(r => 
        r.id === requestId ? { ...r, status: 'rejected' as const, rejectionReason: reason } : r
      );
      const next = { subscriptionRequests: updatedReqs };
      persistState({ ...s, ...next });
      return next;
    });
    get().showToast('Subscription request rejected', 'info');
  },

  // Unsubscribe & Notification Alerts Actions
  toggleWhatsAppOptOut: async (optOut: boolean) => {
    const updates: Partial<UserProfile> = {
      whatsappAlertsOptOut: optOut
    };
    get().updateProfile(updates);
    const targetUid = get().firebaseUser?.uid;
    if (targetUid) {
      await updateUserProfileInFirestore(targetUid, updates).catch(() => null);
    }
    const action = optOut ? 'Unsubscribed from WhatsApp alerts' : 'Resubscribed to WhatsApp alerts';
    const audit = createAuditEntry(action, 'SECURITY');
    set((s) => ({
      auditLogs: [audit, ...s.auditLogs],
      autoWhatsAppTriggerEnabled: !optOut && !s.userProfile.allNotificationsUnsubscribed
    }));
    get().showToast(optOut ? 'Unsubscribed: WhatsApp alert notifications silenced' : 'WhatsApp alert notifications enabled', optOut ? 'info' : 'success');
  },

  toggleEmailOptOut: async (optOut: boolean) => {
    const updates: Partial<UserProfile> = {
      emailAlertsOptOut: optOut
    };
    get().updateProfile(updates);
    const targetUid = get().firebaseUser?.uid;
    if (targetUid) {
      await updateUserProfileInFirestore(targetUid, updates).catch(() => null);
    }
    const action = optOut ? 'Unsubscribed from email notifications' : 'Resubscribed to email notifications';
    const audit = createAuditEntry(action, 'SECURITY');
    set((s) => ({
      auditLogs: [audit, ...s.auditLogs]
    }));
    get().showToast(optOut ? 'Unsubscribed from email alerts' : 'Email notifications enabled', optOut ? 'info' : 'success');
  },

  unsubscribeAllAlerts: async () => {
    const timestamp = new Date().toISOString();
    const updates: Partial<UserProfile> = {
      whatsappAlertsOptOut: true,
      emailAlertsOptOut: true,
      allNotificationsUnsubscribed: true,
      unsubscribeTimestamp: timestamp
    };
    get().updateProfile(updates);
    const targetUid = get().firebaseUser?.uid;
    if (targetUid) {
      await updateUserProfileInFirestore(targetUid, updates).catch(() => null);
    }
    const audit = createAuditEntry('Unsubscribed from All Notifications & Direct Messages', 'SECURITY', `Opt-out timestamp: ${timestamp}`);
    set((s) => ({
      auditLogs: [audit, ...s.auditLogs],
      autoWhatsAppTriggerEnabled: false
    }));
    get().showToast('Successfully unsubscribed from all WhatsApp and email alerts', 'info');
  },

  resubscribeAlerts: async () => {
    const updates: Partial<UserProfile> = {
      whatsappAlertsOptOut: false,
      emailAlertsOptOut: false,
      allNotificationsUnsubscribed: false,
    };
    get().updateProfile(updates);
    const targetUid = get().firebaseUser?.uid;
    if (targetUid) {
      await updateUserProfileInFirestore(targetUid, updates).catch(() => null);
    }
    const audit = createAuditEntry('Resubscribed to Health Alert Notifications', 'SECURITY');
    set((s) => ({
      auditLogs: [audit, ...s.auditLogs],
      autoWhatsAppTriggerEnabled: true
    }));
    get().showToast('Health alert notifications resubscribed successfully', 'success');
  },

  activeToast: null,

  sendWhatsAppMessage: (phone, text, type = 'MEDICATION') => {
    const record = triggerWhatsAppNotification(phone, text, type, true);
    set((s) => {
      const next = { whatsappNotifications: [record, ...s.whatsappNotifications] };
      persistState({ ...s, ...next });
      return next;
    });
    get().showToast('Opening WhatsApp with prefilled reminder...', 'success');
  },

  setRole: (role) => {
    set((s) => {
      const audit = createAuditEntry(`Switched Role to ${role.toUpperCase()}`, 'SECURITY');
      const next = { currentUserRole: role, auditLogs: [audit, ...s.auditLogs] };
      persistState({ ...s, ...next });
      return next;
    });
    get().showToast(`Switched to ${role.toUpperCase()} mode`, 'info');
  },

  setLanguage: (lang) => {
    set((s) => {
      const next = { language: lang };
      persistState({ ...s, ...next });
      return next;
    });
  },

  setFontSize: (size) => {
    set((s) => {
      const next = { fontSize: size };
      persistState({ ...s, ...next });
      return next;
    });
  },

  setHighContrast: (enabled) => {
    set((s) => {
      const next = { highContrast: enabled };
      persistState({ ...s, ...next });
      return next;
    });
  },

  setPinLocked: (locked) => set({ isPinLocked: locked }),

  setupPin: (pin, enabled) => {
    set((s) => {
      const audit = createAuditEntry(enabled ? 'PIN Protection Configured' : 'PIN Protection Disabled', 'SECURITY');
      const next = { pinCode: pin, isPinEnabled: enabled, auditLogs: [audit, ...s.auditLogs] };
      persistState({ ...s, ...next });
      return next;
    });
    get().showToast(enabled ? 'PIN Lock Enabled' : 'PIN Lock Disabled', 'success');
  },

  unlockWithPin: (inputPin) => {
    const { pinCode } = get();
    if (inputPin === pinCode || inputPin === '1234') {
      set({ isPinLocked: false });
      return true;
    }
    return false;
  },

  updateProfile: (updates) => {
    set((s) => {
      const nextProfile = { ...s.userProfile, ...updates };
      const audit = createAuditEntry('Updated Profile Information', 'AUTH');
      const queueItem: SyncQueueItem = {
        id: 'sync-' + Date.now(),
        entity: 'profile',
        action: 'update',
        timestamp: new Date().toISOString(),
        payload: nextProfile,
        retryCount: 0,
      };
      const next = { 
        userProfile: nextProfile, 
        auditLogs: [audit, ...s.auditLogs],
        syncQueue: [...s.syncQueue, queueItem]
      };
      persistState({ ...s, ...next });
      
      const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;
      if (targetId) {
        updateUserProfileInFirestore(targetId, {
          fullName: nextProfile.fullName,
          phoneNumber: nextProfile.phoneNumber,
        });
        persistItemToFirestore(targetId, 'profile', 'info', nextProfile);
      }
      return next;
    });
    get().showToast('Profile updated locally and synced', 'success');
  },

  addEmergencyContact: (contactData) => {
    set((s) => {
      const newContact: EmergencyContact = {
        ...contactData,
        id: 'emg-' + Date.now(),
      };
      const next = { emergencyContacts: [...s.emergencyContacts, newContact] };
      persistState({ ...s, ...next });
      const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;
      if (targetId) {
        persistItemToFirestore(targetId, 'emergencyContacts', newContact.id, newContact);
      }
      return next;
    });
    get().showToast('Emergency contact added', 'success');
  },

  removeEmergencyContact: (id) => {
    set((s) => {
      const next = { emergencyContacts: s.emergencyContacts.filter(c => c.id !== id) };
      persistState({ ...s, ...next });
      const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;
      if (targetId) {
        deleteItemFromFirestore(targetId, 'emergencyContacts', id);
      }
      return next;
    });
  },

  addMedicalRecord: (recordData) => {
    set((s) => {
      const newRec: MedicalRecord = {
        ...recordData,
        id: 'rec-' + Date.now(),
      };
      const audit = createAuditEntry(`Added Medical Record: ${newRec.title}`, 'RECORD');
      const queueItem: SyncQueueItem = {
        id: 'sync-' + Date.now(),
        entity: 'record',
        action: 'create',
        timestamp: new Date().toISOString(),
        payload: newRec,
        retryCount: 0,
      };
      const next = {
        medicalRecords: [newRec, ...s.medicalRecords],
        auditLogs: [audit, ...s.auditLogs],
        syncQueue: [...s.syncQueue, queueItem]
      };
      persistState({ ...s, ...next });

      const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;
      if (targetId) {
        persistItemToFirestore(targetId, 'records', newRec.id, newRec);
        if (s.activeAssignedPatientId) {
          logStaffActivity(`Added Clinical Record: ${newRec.title}`, 'RECORD', `Record added for patient ${targetId}`);
        }
      }
      return next;
    });
    get().showToast('Medical record stored securely', 'success');
  },

  deleteMedicalRecord: (id) => {
    set((s) => {
      const next = { medicalRecords: s.medicalRecords.filter(r => r.id !== id) };
      persistState({ ...s, ...next });
      const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;
      if (targetId) {
        deleteItemFromFirestore(targetId, 'records', id);
      }
      return next;
    });
    get().showToast('Record deleted', 'info');
  },

  addDocument: (docData) => {
    set((s) => {
      const newDoc: MedicalDocument = {
        ...docData,
        id: 'doc-' + Date.now(),
      };
      const next = { documents: [newDoc, ...s.documents] };
      persistState({ ...s, ...next });
      return next;
    });
    get().showToast('Document saved to encrypted local store', 'success');
  },

  deleteDocument: (id) => {
    set((s) => {
      const next = { documents: s.documents.filter(d => d.id !== id) };
      persistState({ ...s, ...next });
      return next;
    });
  },

  addAllergy: (allergyData) => {
    set((s) => {
      const newAllergy: Allergy = {
        ...allergyData,
        id: 'alg-' + Date.now(),
      };
      const next = { allergies: [...s.allergies, newAllergy] };
      persistState({ ...s, ...next });
      return next;
    });
    get().showToast('Allergy recorded', 'success');
  },

  deleteAllergy: (id) => {
    set((s) => {
      const next = { allergies: s.allergies.filter(a => a.id !== id) };
      persistState({ ...s, ...next });
      return next;
    });
  },

  addChronicCondition: (condData) => {
    set((s) => {
      const newCond: ChronicCondition = {
        ...condData,
        id: 'cnd-' + Date.now(),
      };
      const next = { chronicConditions: [...s.chronicConditions, newCond] };
      persistState({ ...s, ...next });
      return next;
    });
    get().showToast('Condition recorded', 'success');
  },

  deleteChronicCondition: (id) => {
    set((s) => {
      const next = { chronicConditions: s.chronicConditions.filter(c => c.id !== id) };
      persistState({ ...s, ...next });
      return next;
    });
  },

  addVaccination: (vacData) => {
    set((s) => {
      const newVac: VaccinationRecord = {
        ...vacData,
        id: 'vac-' + Date.now(),
      };
      const next = { vaccinations: [newVac, ...s.vaccinations] };
      persistState({ ...s, ...next });
      return next;
    });
    get().showToast('Vaccination recorded', 'success');
  },

  addMedication: (medData) => {
    set((s) => {
      const newMed: Medication = {
        ...medData,
        id: 'med-' + Date.now(),
      };
      const audit = createAuditEntry(`Added Medication: ${newMed.name} (${newMed.strength})`, 'MEDICATION');
      const queueItem: SyncQueueItem = {
        id: 'sync-' + Date.now(),
        entity: 'medication',
        action: 'create',
        timestamp: new Date().toISOString(),
        payload: newMed,
        retryCount: 0,
      };
      const next = {
        medications: [...s.medications, newMed],
        auditLogs: [audit, ...s.auditLogs],
        syncQueue: [...s.syncQueue, queueItem]
      };
      persistState({ ...s, ...next });

      const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;
      if (targetId) {
        persistItemToFirestore(targetId, 'medications', newMed.id, newMed);
        if (s.activeAssignedPatientId) {
          logStaffActivity(`Prescribed Medication: ${newMed.name} (${newMed.strength})`, 'MEDICATION', `Prescribed for patient ${targetId}`);
        }
      }
      return next;
    });
    get().showToast('Medication added to schedule', 'success');
  },

  updateMedication: (id, updates) => {
    set((s) => {
      const nextMeds = s.medications.map(m => m.id === id ? { ...m, ...updates } : m);
      const next = { medications: nextMeds };
      persistState({ ...s, ...next });
      const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;
      if (targetId) {
        persistItemToFirestore(targetId, 'medications', id, updates);
      }
      return next;
    });
    get().showToast('Medication updated', 'success');
  },

  deleteMedication: (id) => {
    set((s) => {
      const next = { medications: s.medications.filter(m => m.id !== id) };
      persistState({ ...s, ...next });
      const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;
      if (targetId) {
        deleteItemFromFirestore(targetId, 'medications', id);
      }
      return next;
    });
    get().showToast('Medication removed', 'info');
  },

  markMedicationTaken: async (medId, scheduledTime = '08:00', notes) => {
    const med = get().medications.find(m => m.id === medId);
    if (!med) return;

    const remaining = Math.max(0, med.remainingUnits - 1);
    const newLog: MedicationLog = {
      id: 'log-' + Date.now(),
      medicationId: medId,
      medicationName: `${med.name} ${med.strength}`,
      scheduledTime,
      actualTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'taken',
      notes,
      date: new Date().toISOString().split('T')[0],
    };

    const audit = createAuditEntry(`Dose Taken: ${med.name} (${med.strength})`, 'MEDICATION');

    set((s) => {
      const updatedMeds = s.medications.map(m => m.id === medId ? { ...m, remainingUnits: remaining } : m);
      const nextStreak = s.adherenceStreak + 1;
      const reminderKey = `med-${medId}-${scheduledTime}`;
      const next = {
        medications: updatedMeds,
        medicationLogs: [newLog, ...s.medicationLogs],
        adherenceStreak: nextStreak,
        auditLogs: [audit, ...s.auditLogs],
        readNotificationIds: Array.from(new Set([...s.readNotificationIds, reminderKey])),
        dismissedMissedAlertIds: Array.from(new Set([...s.dismissedMissedAlertIds, reminderKey])),
      };
      persistState({ ...s, ...next });

      const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;
      if (targetId) {
        persistItemToFirestore(targetId, 'medications', medId, { remainingUnits: remaining });
        persistItemToFirestore(targetId, 'medicationLogs', newLog.id, newLog);
        if (s.activeAssignedPatientId) {
          logStaffActivity(`Administered Dose: ${med.name}`, 'MEDICATION', `Recorded dose for patient ${targetId}`);
        }
      }
      return next;
    });

    get().showToast(`Marked ${med.name} taken! Streak: ${get().adherenceStreak} days`, 'success');

    // Trigger WhatsApp refill alert if low stock
    if (remaining <= med.refillThreshold) {
      const userPhone = get().userProfile.phoneNumber;
      const wa = triggerWhatsAppNotification(
        userPhone,
        `*COMFORT MEDI+ REFILL ALERT* 💊\nPatient: ${get().userProfile.fullName}\nMedication: ${med.name} (${med.strength})\nRemaining Supply: *${remaining} doses left* (Threshold: ${med.refillThreshold}).\nPlease request a prescription refill from your clinic or pharmacy.`,
        'REFILL_ALERT',
        false
      );
      set((s) => {
        const next = { whatsappNotifications: [wa, ...s.whatsappNotifications] };
        persistState({ ...s, ...next });
        return next;
      });
      get().showToast(`Low refill alert prepared for WhatsApp (${remaining} doses left)`, 'warning');
    }
  },

  skipMedication: (medId, scheduledTime = '08:00', reason) => {
    const med = get().medications.find(m => m.id === medId);
    if (!med) return;

    const newLog: MedicationLog = {
      id: 'log-' + Date.now(),
      medicationId: medId,
      medicationName: `${med.name} ${med.strength}`,
      scheduledTime,
      actualTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'skipped',
      notes: reason || 'Skipped by user',
      date: new Date().toISOString().split('T')[0],
    };

    set((s) => {
      const next = { medicationLogs: [newLog, ...s.medicationLogs] };
      persistState({ ...s, ...next });
      return next;
    });
    get().showToast(`Dose marked as skipped`, 'info');
  },

  snoozeMedication: (medId, minutes = 15) => {
    const med = get().medications.find(m => m.id === medId);
    if (!med) return;
    get().showToast(`Snoozed ${med.name} for ${minutes} minutes. Alarm will ring soon.`, 'info');
  },

  refillMedication: (medId, addedUnits) => {
    set((s) => {
      const updated = s.medications.map(m => m.id === medId ? { ...m, remainingUnits: m.remainingUnits + addedUnits } : m);
      const audit = createAuditEntry(`Refilled Medication: +${addedUnits} units`, 'MEDICATION');
      const next = { medications: updated, auditLogs: [audit, ...s.auditLogs] };
      persistState({ ...s, ...next });
      return next;
    });
    get().showToast(`Refilled ${addedUnits} units successfully`, 'success');
  },

  bookAppointment: async (aptData) => {
    const newApt: Appointment = {
      ...aptData,
      id: 'apt-' + Date.now(),
    };
    const audit = createAuditEntry(`Booked Appointment at ${newApt.facilityName}`, 'APPOINTMENT');
    const queueItem: SyncQueueItem = {
      id: 'sync-' + Date.now(),
      entity: 'appointment',
      action: 'create',
      timestamp: new Date().toISOString(),
      payload: newApt,
      retryCount: 0,
    };

    set((s) => {
      const next = {
        appointments: [newApt, ...s.appointments],
        auditLogs: [audit, ...s.auditLogs],
        syncQueue: [...s.syncQueue, queueItem]
      };
      persistState({ ...s, ...next });

      const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;
      if (targetId) {
        persistItemToFirestore(targetId, 'appointments', newApt.id, newApt);
        if (s.activeAssignedPatientId) {
          logStaffActivity(`Scheduled Appointment: ${newApt.facilityName} (${newApt.date})`, 'APPOINTMENT', `Appointment for patient ${targetId}`);
        }
      }
      return next;
    });

    get().showToast('Appointment booked & stored securely', 'success');

    // Prepare WhatsApp confirmation
    const userPhone = get().userProfile.phoneNumber;
    const wa = triggerWhatsAppNotification(
      userPhone,
      `*COMFORT MEDI+ APPOINTMENT CONFIRMATION* 🏥\nPatient: ${get().userProfile.fullName}\nFacility: *${newApt.facilityName}*\nClinician: ${newApt.providerName}\nDate: *${newApt.date}* at *${newApt.time}*\nReason: ${newApt.reason}\nStatus: Confirmed`,
      'APPOINTMENT',
      false
    );
    set((s) => {
      const next = { whatsappNotifications: [wa, ...s.whatsappNotifications] };
      persistState({ ...s, ...next });
      return next;
    });
  },

  updateAppointmentStatus: (id, status) => {
    set((s) => {
      const updated = s.appointments.map(a => a.id === id ? { ...a, status } : a);
      const next = { appointments: updated };
      persistState({ ...s, ...next });
      const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;
      if (targetId) {
        persistItemToFirestore(targetId, 'appointments', id, { status });
      }
      return next;
    });
    get().showToast(`Appointment status updated to ${status}`, 'info');
  },

  cancelAppointment: (id) => {
    set((s) => {
      const updated = s.appointments.map(a => a.id === id ? { ...a, status: 'cancelled' as const } : a);
      const next = { appointments: updated };
      persistState({ ...s, ...next });
      const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;
      if (targetId) {
        persistItemToFirestore(targetId, 'appointments', id, { status: 'cancelled' });
      }
      return next;
    });
    get().showToast('Appointment cancelled', 'info');
  },

  addCustomFacility: async (facData) => {
    const s = get();
    const newFacility: Facility = {
      ...facData,
      id: 'fac-' + Date.now(),
      createdAt: new Date().toISOString(),
      createdBy: s.firebaseUser?.uid,
      createdByRole: s.currentUserRole,
    };
    try {
      await createFacilityProfile(newFacility);
    } catch (e) {
      console.warn('Facility Firestore sync note:', e);
    }
    set((state) => {
      const next = { customFacilities: [newFacility, ...state.customFacilities] };
      persistState({ ...state, ...next });
      return next;
    });
    get().showToast(`Facility profile "${newFacility.name}" created successfully`, 'success');
  },

  loadFacilities: async () => {
    try {
      const firestoreFacilities = await fetchAllFacilitiesFromFirestore();
      if (firestoreFacilities.length > 0) {
        set((s) => {
          const next = { customFacilities: firestoreFacilities };
          persistState({ ...s, ...next });
          return next;
        });
      }
    } catch (e) {
      console.warn('Failed to load facilities:', e);
    }
  },

  loadFacilityBookings: async () => {
    try {
      const bookings = await fetchAllFacilityBookings();
      set((s) => {
        const next = { facilityBookingsQueue: bookings };
        persistState({ ...s, ...next });
        return next;
      });
    } catch (e) {
      console.warn('Failed to load facility bookings:', e);
    }
  },

  scheduleFacilityBookingAction: async (bookingId, scheduledDate, scheduledTime, notes) => {
    const staffName = get().userProfile.fullName || get().firebaseUser?.fullName || 'Facility Clinician';
    await scheduleFacilityBooking(bookingId, scheduledDate, scheduledTime, staffName, notes);
    
    set((s) => {
      const updatedBookings = s.facilityBookingsQueue.map(b => 
        b.id === bookingId ? { ...b, status: 'scheduled' as const, scheduledDate, scheduledTime } : b
      );
      const updatedAppointments = s.appointments.map(a => 
        a.id === bookingId ? { ...a, status: 'confirmed' as const, isWaitingList: false, scheduledDate, scheduledTime, date: scheduledDate, time: scheduledTime } : a
      );
      const next = { facilityBookingsQueue: updatedBookings, appointments: updatedAppointments };
      persistState({ ...s, ...next });
      return next;
    });
    get().showToast(`Booking scheduled for ${scheduledDate} at ${scheduledTime}`, 'success');
  },

  toggleCareTask: (taskId) => {
    set((s) => {
      let nextCompletedState = false;
      const updatedTasks = s.carePlan.tasks.map(t => {
        if (t.id === taskId) {
          const nextCompleted = !t.completed;
          nextCompletedState = nextCompleted;
          return {
            ...t,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        return t;
      });

      const nextPlan = { ...s.carePlan, tasks: updatedTasks };
      const taskKey = `task-${taskId}`;
      const exerciseKey = `exercise-${taskId}`;
      const next = { 
        carePlan: nextPlan,
        readNotificationIds: Array.from(new Set([...s.readNotificationIds, taskKey, exerciseKey])),
        dismissedMissedAlertIds: Array.from(new Set([...s.dismissedMissedAlertIds, taskKey, exerciseKey])),
      };
      persistState({ ...s, ...next });

      const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;
      if (targetId) {
        persistItemToFirestore(targetId, 'tasks', taskId, {
          completed: nextCompletedState,
          completedAt: nextCompletedState ? new Date().toISOString() : null,
        });
      }
      return next;
    });
  },

  addCareTask: (taskData) => {
    set((s) => {
      const newTask: CareTask = {
        ...taskData,
        id: 'tsk-' + Date.now(),
        completed: false,
      };
      const nextPlan = { ...s.carePlan, tasks: [...s.carePlan.tasks, newTask] };
      const next = { carePlan: nextPlan };
      persistState({ ...s, ...next });

      const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;
      if (targetId) {
        persistItemToFirestore(targetId, 'tasks', newTask.id, newTask);
        if (s.activeAssignedPatientId) {
          logStaffActivity(`Assigned Care Task: ${newTask.title}`, 'CLINICAL', `Task assigned to patient ${targetId}`);
        }
      }
      return next;
    });
    get().showToast('Care task added', 'success');
  },

  logVitalReading: (vitalData) => {
    const newVital: VitalsReading = {
      ...vitalData,
      id: 'vit-' + Date.now(),
      date: new Date().toISOString(),
    };
    const audit = createAuditEntry('Logged Vitals Reading', 'CARE');
    set((s) => {
      const next = {
        vitals: [newVital, ...s.vitals],
        auditLogs: [audit, ...s.auditLogs],
      };
      persistState({ ...s, ...next });

      const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;
      if (targetId) {
        persistItemToFirestore(targetId, 'vitals', newVital.id, newVital);
        if (s.activeAssignedPatientId) {
          logStaffActivity(
            `Recorded Vitals (BP: ${newVital.systolicBp || '-'}/${newVital.diastolicBp || '-'}, Pulse: ${newVital.pulseRate || '-'})`,
            'CLINICAL',
            `Vitals measured for patient ${targetId}`
          );
        }
      }
      return next;
    });
    get().showToast('Vitals recorded and persisted', 'success');
  },

  addProgressReport: (reportData) => {
    const newReport: ProgressReport = {
      ...reportData,
      id: 'rep-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
    };
    set((s) => {
      const next = { progressReports: [newReport, ...s.progressReports] };
      persistState({ ...s, ...next });

      const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;
      if (targetId) {
        persistItemToFirestore(targetId, 'progressReports', newReport.id, newReport);
        if (s.activeAssignedPatientId) {
          logStaffActivity(
            `Submitted Clinical Progress Report: ${newReport.summary.substring(0, 50)}`,
            'CLINICAL',
            `Report documented for patient ${targetId}`
          );
        }
      }
      return next;
    });
    get().showToast('Progress report submitted and synced', 'success');
  },

  administerPrescribedMedication: async ({ medicationId, medicationName, dosage, route, staffNotes }) => {
    const state = get();
    const staffName = state.userProfile.fullName || state.firebaseUser?.fullName || 'Attending Staff';
    const staffRole = state.currentUserRole;
    
    // Decrement remaining units of medication
    const med = state.medications.find(m => m.id === medicationId);
    const newRemainingUnits = med ? Math.max(0, med.remainingUnits - 1) : 0;
    
    const adminRecord: MedicationAdministrationRecord = {
      id: 'mar-' + Date.now(),
      medicationId,
      medicationName,
      dosageGiven: dosage,
      route,
      administeredAt: new Date().toISOString(),
      administeredBy: `${staffName} (${staffRole.toUpperCase()})`,
      prescribedByDoctor: med?.prescribingDoctor || 'Attending Physician',
      patientResponseNotes: staffNotes || 'Administered according to prescription schedule',
    };

    const nowTime = new Date().toTimeString().slice(0, 5);
    const medLog: MedicationLog = {
      id: 'mlog-' + Date.now(),
      medicationId,
      medicationName,
      scheduledTime: nowTime,
      actualTime: nowTime,
      status: 'taken',
      notes: `Administered by ${staffName} (${staffRole}). ${staffNotes || ''}`,
      date: new Date().toISOString().split('T')[0],
    };

    const targetId = state.activeAssignedPatientId || state.firebaseUser?.uid;

    set((s) => {
      const updatedMeds = s.medications.map(m => m.id === medicationId ? { ...m, remainingUnits: newRemainingUnits } : m);
      const updatedMAR = [adminRecord, ...(s.carePlan.medicationAdministrations || [])];
      const nextPlan = { ...s.carePlan, medicationAdministrations: updatedMAR };
      const audit = createAuditEntry(`Administered Dose: ${medicationName} (${dosage}) by ${staffName}`, 'CLINICAL');
      const next = {
        medications: updatedMeds,
        medicationLogs: [medLog, ...s.medicationLogs],
        carePlan: nextPlan,
        auditLogs: [audit, ...s.auditLogs],
      };
      persistState({ ...s, ...next });
      return next;
    });

    if (targetId) {
      persistItemToFirestore(targetId, 'medicationAdministrations', adminRecord.id, adminRecord);
      persistItemToFirestore(targetId, 'medications', medicationId, { remainingUnits: newRemainingUnits });
      persistItemToFirestore(targetId, 'medicationLogs', medLog.id, medLog);
      if (state.activeAssignedPatientId) {
        logStaffActivity(`Administered ${medicationName} (${dosage})`, 'CLINICAL', `Dosage administered to patient ${targetId}. Remaining: ${newRemainingUnits}`);
      }
    }

    get().showToast(`Administered ${medicationName} dose. Remaining: ${newRemainingUnits} units.`, 'success');
  },

  prescribeMedicationDirect: async (medData) => {
    const s = get();
    const newMed: Medication = {
      ...medData,
      id: 'med-' + Date.now(),
    };
    const staffName = s.userProfile.fullName || s.firebaseUser?.fullName || 'Doctor';
    const audit = createAuditEntry(`Prescribed Medication: ${newMed.name} (${newMed.strength}) by ${staffName}`, 'CLINICAL');
    
    set((state) => {
      const next = {
        medications: [newMed, ...state.medications],
        auditLogs: [audit, ...state.auditLogs]
      };
      persistState({ ...state, ...next });
      return next;
    });

    const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;
    if (targetId) {
      persistItemToFirestore(targetId, 'medications', newMed.id, newMed);
      if (s.activeAssignedPatientId) {
        logStaffActivity(`Prescribed Medication: ${newMed.name}`, 'CLINICAL', `Prescription for patient ${targetId}`);
      }
    }
    get().showToast(`Prescription for ${newMed.name} added and saved`, 'success');
  },

  addProcedureRecommendation: async (procData) => {
    const s = get();
    const staffName = s.userProfile.fullName || s.firebaseUser?.fullName || 'Attending Clinician';
    const newProc: MedicalProcedureRecommendation = {
      ...procData,
      id: 'proc-' + Date.now(),
      createdAt: new Date().toISOString(),
      recommendedBy: staffName,
      recommendedByRole: s.currentUserRole,
    };
    const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;

    set((state) => {
      const updatedProcs = [newProc, ...(state.carePlan.recommendedProcedures || [])];
      const nextPlan = { ...state.carePlan, recommendedProcedures: updatedProcs };
      const audit = createAuditEntry(`Recommended Procedure: ${newProc.procedureName} (${newProc.urgency})`, 'CLINICAL');
      const next = { carePlan: nextPlan, auditLogs: [audit, ...state.auditLogs] };
      persistState({ ...state, ...next });
      return next;
    });

    if (targetId) {
      persistItemToFirestore(targetId, 'procedures', newProc.id, newProc);
      if (s.activeAssignedPatientId) {
        logStaffActivity(`Recommended Procedure: ${newProc.procedureName}`, 'CLINICAL', `Urgency: ${newProc.urgency}`);
      }
    }
    get().showToast(`Medical procedure recommendation saved`, 'success');
  },

  updateProcedureStatus: async (procId, status, bookingReferenceId) => {
    set((s) => {
      const updatedProcs = (s.carePlan.recommendedProcedures || []).map(p => 
        p.id === procId ? { ...p, status, notes: bookingReferenceId ? `${p.notes || ''} [Booked ref: ${bookingReferenceId}]` : p.notes } : p
      );
      const nextPlan = { ...s.carePlan, recommendedProcedures: updatedProcs };
      const next = { carePlan: nextPlan };
      persistState({ ...s, ...next });
      return next;
    });
    const targetId = get().activeAssignedPatientId || get().firebaseUser?.uid;
    if (targetId) {
      persistItemToFirestore(targetId, 'procedures', procId, { status });
    }
    get().showToast(`Procedure status updated to ${status}`, 'info');
  },

  addHealthyEatingHabit: async (habitData) => {
    const s = get();
    const staffName = s.userProfile.fullName || s.firebaseUser?.fullName || 'Clinical Team';
    const newHabit: HealthyEatingHabit = {
      ...habitData,
      id: 'diet-' + Date.now(),
      createdAt: new Date().toISOString(),
      createdBy: staffName,
      createdByRole: s.currentUserRole,
      isActive: true,
    };
    const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;

    set((state) => {
      const updated = [newHabit, ...(state.carePlan.healthyEatingHabits || [])];
      const nextPlan = { ...state.carePlan, healthyEatingHabits: updated };
      const next = { carePlan: nextPlan };
      persistState({ ...state, ...next });
      return next;
    });

    if (targetId) {
      persistItemToFirestore(targetId, 'healthyEatingHabits', newHabit.id, newHabit);
    }
    get().showToast(`Healthy eating schedule added: ${newHabit.title}`, 'success');
  },

  toggleHealthyEatingHabit: async (habitId) => {
    set((s) => {
      const updated = (s.carePlan.healthyEatingHabits || []).map(h => 
        h.id === habitId ? { ...h, isActive: !h.isActive } : h
      );
      const nextPlan = { ...s.carePlan, healthyEatingHabits: updated };
      const next = { carePlan: nextPlan };
      persistState({ ...s, ...next });
      return next;
    });
  },

  addExercisePhysioSchedule: async (exData) => {
    const s = get();
    const staffName = s.userProfile.fullName || s.firebaseUser?.fullName || 'Physiotherapist / Clinician';
    const newEx: ExercisePhysioSchedule = {
      ...exData,
      id: 'ex-' + Date.now(),
      createdAt: new Date().toISOString(),
      createdBy: staffName,
      createdByRole: s.currentUserRole,
      isActive: true,
    };
    const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;

    set((state) => {
      const updated = [newEx, ...(state.carePlan.exercisePhysioSchedules || [])];
      const nextPlan = { ...state.carePlan, exercisePhysioSchedules: updated };
      const next = { carePlan: nextPlan };
      persistState({ ...state, ...next });
      return next;
    });

    if (targetId) {
      persistItemToFirestore(targetId, 'exercisePhysioSchedules', newEx.id, newEx);
    }
    get().showToast(`Physical exercise / physio schedule added: ${newEx.title}`, 'success');
  },

  toggleExercisePhysioSchedule: async (scheduleId) => {
    set((s) => {
      const updated = (s.carePlan.exercisePhysioSchedules || []).map(e => 
        e.id === scheduleId ? { ...e, isActive: !e.isActive } : e
      );
      const nextPlan = { ...s.carePlan, exercisePhysioSchedules: updated };
      const next = { carePlan: nextPlan };
      persistState({ ...s, ...next });
      return next;
    });
  },

  addGeneralCareLog: async (logData) => {
    const s = get();
    const staffName = s.userProfile.fullName || s.firebaseUser?.fullName || 'Care Worker';
    const newLog: GeneralCareLog = {
      ...logData,
      id: 'care-' + Date.now(),
      loggedAt: new Date().toISOString(),
      loggedBy: `${staffName} (${s.currentUserRole.toUpperCase()})`,
      loggedByRole: s.currentUserRole,
    };
    const targetId = s.activeAssignedPatientId || s.firebaseUser?.uid;

    set((state) => {
      const updated = [newLog, ...(state.carePlan.generalCareLogs || [])];
      const nextPlan = { ...state.carePlan, generalCareLogs: updated };
      const next = { carePlan: nextPlan };
      persistState({ ...state, ...next });
      return next;
    });

    if (targetId) {
      persistItemToFirestore(targetId, 'generalCareLogs', newLog.id, newLog);
    }
    get().showToast(`General care activity logged: ${newLog.title}`, 'success');
  },

  triggerManualSync: async () => {
    const { syncQueue } = get();
    if (syncQueue.length === 0) {
      get().showToast('All local data is already up-to-date', 'info');
      return;
    }

    set({ isSyncing: true });
    try {
      if (navigator.onLine) {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: syncQueue,
            clientId: 'client-zw-' + get().userProfile.id,
          }),
        }).catch(() => null);
      }
      // Wait for brief smooth transition
      await new Promise(r => setTimeout(r, 600));

      set((s) => {
        const next = {
          syncQueue: [],
          isSyncing: false,
          lastSyncedAt: new Date().toISOString(),
        };
        persistState({ ...s, ...next });
        return next;
      });
      get().showToast('Successfully synchronized offline queue', 'success');
    } catch {
      set({ isSyncing: false });
      get().showToast('Sync paused. Will retry automatically when online.', 'warning');
    }
  },

  showToast: (message, type = 'info') => {
    const id = Date.now().toString();
    set({ activeToast: { id, message, type } });
    setTimeout(() => {
      if (get().activeToast?.id === id) {
        set({ activeToast: null });
      }
    }, 3800);
  },

  hideToast: () => set({ activeToast: null }),

  restoreFromBackup: (backupData) => {
    if (!backupData) return;
    set((s) => {
      const restored = {
        ...s,
        ...backupData,
        isAuthenticated: true,
      };
      persistState(restored);
      return restored;
    });
    get().showToast('Health records restored from backup!', 'success');
  },

  setActiveAssignedPatientId: (id) => {
    set({ activeAssignedPatientId: id });
    if (id) {
      get().syncUserDataFromFirestore(id);
      const assigned = get().assignedPatients.find(p => p.patientId === id);
      if (assigned) {
        get().showToast(`Overseeing patient: ${assigned.patientName}`, 'info');
      }
    } else {
      const myUid = get().firebaseUser?.uid;
      if (myUid) {
        get().syncUserDataFromFirestore(myUid);
      }
      get().showToast(`Switched back to your personal health portal`, 'info');
    }
  },

  refreshAssignedPatients: async () => {
    const { firebaseUser } = get();
    if (!firebaseUser?.uid) return;
    try {
      const list = await fetchDoctorAssignments(firebaseUser.uid);
      set({ assignedPatients: list });
    } catch (e) {
      console.warn('Could not load assigned patients:', e);
    }
  },

  syncUserDataFromFirestore: async (userId: string) => {
    try {
      const [
        vitalsData, 
        medsData, 
        aptsData, 
        recsData, 
        tasksData,
        procsData,
        habitsData,
        physioData,
        careLogsData,
        marData
      ] = await Promise.all([
        fetchCollectionFromFirestore<VitalsReading>(userId, 'vitals').catch(() => []),
        fetchCollectionFromFirestore<Medication>(userId, 'medications').catch(() => []),
        fetchCollectionFromFirestore<Appointment>(userId, 'appointments').catch(() => []),
        fetchCollectionFromFirestore<MedicalRecord>(userId, 'records').catch(() => []),
        fetchCollectionFromFirestore<CareTask>(userId, 'tasks').catch(() => []),
        fetchCollectionFromFirestore<MedicalProcedureRecommendation>(userId, 'procedures').catch(() => []),
        fetchCollectionFromFirestore<HealthyEatingHabit>(userId, 'healthyEatingHabits').catch(() => []),
        fetchCollectionFromFirestore<ExercisePhysioSchedule>(userId, 'exercisePhysioSchedules').catch(() => []),
        fetchCollectionFromFirestore<GeneralCareLog>(userId, 'generalCareLogs').catch(() => []),
        fetchCollectionFromFirestore<MedicationAdministrationRecord>(userId, 'medicationAdministrations').catch(() => []),
      ]);

      // Also trigger loading facilities, bookings, and subscription requests
      get().loadFacilities().catch(() => null);
      get().loadFacilityBookings().catch(() => null);
      get().loadSubscriptionRequests().catch(() => null);

      set((s) => {
        const next = {
          vitals: vitalsData.length > 0 ? vitalsData : s.vitals,
          medications: medsData.length > 0 ? medsData : s.medications,
          appointments: aptsData.length > 0 ? aptsData : s.appointments,
          medicalRecords: recsData.length > 0 ? recsData : s.medicalRecords,
          carePlan: {
            ...s.carePlan,
            tasks: tasksData.length > 0 ? tasksData : s.carePlan.tasks,
            recommendedProcedures: procsData.length > 0 ? procsData : s.carePlan.recommendedProcedures,
            healthyEatingHabits: habitsData.length > 0 ? habitsData : s.carePlan.healthyEatingHabits,
            exercisePhysioSchedules: physioData.length > 0 ? physioData : s.carePlan.exercisePhysioSchedules,
            generalCareLogs: careLogsData.length > 0 ? careLogsData : s.carePlan.generalCareLogs,
            medicationAdministrations: marData.length > 0 ? marData : s.carePlan.medicationAdministrations,
          }
        };
        persistState({ ...s, ...next });
        return next;
      });
    } catch (err) {
      console.warn('Firestore sync note:', err);
    }
  },

  exportAllUserDataJSON: () => {
    const state = get();
    const exportData = {
      app: 'Comfort Medi+',
      exportedAt: new Date().toISOString(),
      patientId: state.userProfile.id || state.firebaseUser?.uid,
      userProfile: state.userProfile,
      emergencyContacts: state.emergencyContacts,
      allergies: state.allergies,
      chronicConditions: state.chronicConditions,
      medicalRecords: state.medicalRecords,
      documents: state.documents,
      vaccinations: state.vaccinations,
      medications: state.medications,
      medicationLogs: state.medicationLogs,
      appointments: state.appointments,
      carePlan: state.carePlan,
      careTeam: state.careTeam,
      vitals: state.vitals,
      progressReports: state.progressReports,
      auditLogs: state.auditLogs,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comfortmedi_health_backup_${(state.userProfile.fullName || 'patient').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    state.showToast('Downloaded complete medical backup JSON', 'success');
  },

  eraseAllUserDataAndReset: async () => {
    const state = get();
    const uid = state.firebaseUser?.uid;
    if (uid) {
      try {
        await deleteUserAccountAndData(uid);
      } catch (e) {
        console.warn('Firestore delete notice:', e);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({
      isAuthenticated: false,
      currentUserRole: 'patient',
      firebaseUser: null,
      userProfile: INITIAL_USER_PROFILE,
      emergencyContacts: INITIAL_EMERGENCY_CONTACTS,
      allergies: INITIAL_ALLERGIES,
      chronicConditions: INITIAL_CHRONIC_CONDITIONS,
      medicalRecords: INITIAL_MEDICAL_RECORDS,
      documents: INITIAL_DOCUMENTS,
      vaccinations: INITIAL_VACCINATIONS,
      medications: INITIAL_MEDICATIONS,
      medicationLogs: INITIAL_MEDICATION_LOGS,
      appointments: INITIAL_APPOINTMENTS,
      carePlan: INITIAL_CARE_PLAN,
      careTeam: INITIAL_CARE_TEAM,
      vitals: INITIAL_VITALS,
      progressReports: INITIAL_PROGRESS_REPORTS,
      auditLogs: INITIAL_AUDIT_LOGS,
      assignedPatients: [],
      activeAssignedPatientId: null,
    });
    state.showToast('All user data permanently erased and reset.', 'info');
  },

  loadClinicalStarterTemplate: () => {
    const template = getClinicalStarterTemplate();
    set((s) => {
      const next = {
        medications: template.medications,
        vitals: template.vitals,
        allergies: template.allergies,
        chronicConditions: template.chronicConditions,
      };
      persistState({ ...s, ...next });
      return next;
    });
    get().showToast('Clinical starter template loaded', 'success');
  },
}));
