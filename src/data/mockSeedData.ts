import { 
  UserProfile, 
  EmergencyContact, 
  Allergy, 
  ChronicCondition, 
  MedicalRecord, 
  MedicalDocument, 
  VaccinationRecord, 
  MedicalNote, 
  Medication, 
  MedicationLog, 
  Appointment, 
  VitalsReading, 
  CareTask, 
  CareTeamMember, 
  ProgressReport, 
  HomeCarePlan,
  AuditLog
} from '../types';

/**
 * Clean Production Default User Profile
 * Prepared for real industry users with zero hardcoded dummy pollution.
 */
export const INITIAL_USER_PROFILE: UserProfile = {
  id: '',
  fullName: '',
  dateOfBirth: '',
  gender: 'other',
  nationalId: '',
  phoneNumber: '',
  email: '',
  address: '',
  city: 'Harare',
  province: 'Harare',
  occupation: '',
  maritalStatus: 'single',
  nationality: 'Zimbabwean',
  languagePreference: 'en',
  bloodType: 'Unknown',
  rhesusFactor: 'Unknown',
  heightCm: 170,
  weightKg: 70,
  bmi: 24.2,
  organDonor: false,
  insuranceProvider: 'None / Private Pay',
  insurancePolicyNumber: '',
  primaryHealthcareProvider: '',

  // Age Gate & Legal Status
  ageVerified: false,
  isGuardianManaged: false,
  guardianName: '',
  guardianContact: '',

  // Unsubscribe & Communications
  whatsappAlertsOptOut: false,
  emailAlertsOptOut: false,
  allNotificationsUnsubscribed: false,

  // Subscription & Auto-Renewal
  subscriptionTier: 'free',
  subscriptionBillingCycle: 'monthly',
  subscriptionRenewalTermsAccepted: false,
  autoRenew: false,

  // Security & DMCA
  sessionReplayBlocked: true,
  dmcaDisclaimerAcknowledged: true,
};

export const INITIAL_EMERGENCY_CONTACTS: EmergencyContact[] = [];

export const INITIAL_ALLERGIES: Allergy[] = [];

export const INITIAL_CHRONIC_CONDITIONS: ChronicCondition[] = [];

export const INITIAL_MEDICAL_RECORDS: MedicalRecord[] = [];

export const INITIAL_DOCUMENTS: MedicalDocument[] = [];

export const INITIAL_VACCINATIONS: VaccinationRecord[] = [];

export const INITIAL_MEDICATIONS: Medication[] = [];

export const INITIAL_MEDICATION_LOGS: MedicationLog[] = [];

export const INITIAL_APPOINTMENTS: Appointment[] = [];

export const INITIAL_VITALS: VitalsReading[] = [];

export const INITIAL_CARE_TASKS: CareTask[] = [];

export const INITIAL_CARE_TEAM: CareTeamMember[] = [];

export const INITIAL_PROGRESS_REPORTS: ProgressReport[] = [];

export const INITIAL_CARE_PLAN: HomeCarePlan = {
  id: 'plan-default',
  title: 'Personalized Clinical Care Plan',
  period: 'daily',
  startDate: new Date().toISOString().split('T')[0],
  goals: [
    'Blood pressure stabilization < 130/80 mmHg',
    'Adherence to prescribed medication regimen 100%',
    'Daily hydration minimum 2 Litres and low-sodium diet',
    '30 minutes gentle mobility walking or physiotherapy'
  ],
  tasks: [],
  recommendedProcedures: [],
  healthyEatingHabits: [],
  exercisePhysioSchedules: [],
  generalCareLogs: [],
  medicationAdministrations: [],
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

/**
 * Clinical Starter Template for Onboarding or Demonstration
 */
export function getClinicalStarterTemplate() {
  return {
    medications: [
      {
        id: 'med-01',
        name: 'Amlodipine',
        genericName: 'Amlodipine Besylate',
        brandName: 'Norvasc',
        strength: '5mg',
        dosage: '1 tablet',
        route: 'oral' as const,
        frequency: 'once_daily' as const,
        purpose: 'Cardiovascular Blood Pressure Control',
        instructions: 'Take 1 tablet every morning with water.',
        startDate: new Date().toISOString().split('T')[0],
        prescribingDoctor: 'Dr. T. Sithole',
        scheduledTimes: ['08:00'],
        remainingUnits: 30,
        totalPrescribedUnits: 30,
        refillThreshold: 7,
        active: true,
      }
    ],
    vitals: [
      {
        id: 'vit-01',
        date: new Date().toISOString(),
        systolicBp: 124,
        diastolicBp: 78,
        pulseRate: 72,
        temperature: 36.6,
        respiratoryRate: 16,
        bloodSugar: 5.4,
        weightKg: 70,
        oxygenSaturation: 98,
        painLevel: 0,
        mood: 'great' as const,
        sleepHours: 7.5,
        recordedBy: 'Self',
        notes: 'Optimal baseline reading.',
      }
    ],
    allergies: [
      {
        id: 'alg-01',
        allergen: 'Penicillin',
        category: 'drug' as const,
        severity: 'severe' as const,
        reaction: 'Urticaria and bronchospasm',
      }
    ],
    chronicConditions: [
      {
        id: 'cnd-01',
        conditionName: 'Essential Hypertension (Stage 1)',
        diagnosedDate: '2023-01-15',
        severity: 'controlled' as const,
        treatmentRegimen: 'Amlodipine 5mg once daily',
      }
    ]
  };
}
