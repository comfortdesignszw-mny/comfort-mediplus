import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { 
  FirebaseUserRecord, 
  UserRole, 
  PatientAssignment, 
  AuditLog, 
  Facility, 
  FacilityBooking,
  Appointment, 
  SubscriptionPaymentRequest, 
  SubscriptionTier 
} from '../types';

export const ADMIN_EMAIL = 'comfort.designszw@gmail.com';

/**
 * Transforms a Zimbabwean or international phone number into a synthetic email for Firebase Auth.
 * Normalizes leading zeros, country codes (+263, 00263, 07...), and spaces.
 */
export function normalizePhoneNumber(phone: string): { normalizedDigits: string; displayPhone: string } {
  let cleaned = (phone || '').replace(/[^0-9]/g, '');
  
  // Remove international dialing prefix 00
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // Handle Zimbabwe numbers: country code 263
  // 1. Starts with 2630... (e.g. 2630772824132) -> strip the local 0
  if (cleaned.startsWith('2630') && cleaned.length >= 13) {
    cleaned = '263' + cleaned.substring(4);
  }
  // 2. Starts with 0 (e.g. 0772824132 or 071... or 073... or 078...) -> replace leading 0 with 263
  else if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '263' + cleaned.substring(1);
  }
  // 3. Local 9 digits starting with 7, 1, or 3 -> prefix 263
  else if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1') || cleaned.startsWith('3'))) {
    cleaned = '263' + cleaned;
  }

  if (!cleaned || cleaned.length < 5) {
    throw new Error('Please enter a valid phone number (at least 6 digits).');
  }

  const displayPhone = cleaned.startsWith('263') && cleaned.length === 12
    ? `+263 ${cleaned.substring(3, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`
    : `+${cleaned}`;

  return { normalizedDigits: cleaned, displayPhone };
}

export function formatPhoneToEmail(phone: string): string {
  const { normalizedDigits } = normalizePhoneNumber(phone);
  return `phone_${normalizedDigits}@comfortmedi.app`;
}

export function calculateAge(dobString?: string): number {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

export function isStrictlyAboveAge(dobString?: string, minAgeLimit: number = 16): boolean {
  const age = calculateAge(dobString);
  return age > minAgeLimit; // strictly above 16 (i.e. 17+)
}

/**
 * Checks if a given email is the system super administrator.
 */
export function isSuperAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Syncs user record with Firestore and assigns RBAC role.
 * comfort.designszw@gmail.com is always made Admin.
 * All other newly registered users default to Patient.
 * Detects every new user registration and records an audit log for the Admin Dashboard.
 */
export async function syncUserProfile(
  user: User, 
  metadata?: { 
    fullName?: string; 
    phoneNumber?: string; 
    authProvider?: 'google' | 'password' | 'phone';
    dateOfBirth?: string;
    ageVerified?: boolean;
    isGuardianManaged?: boolean;
    guardianName?: string;
    guardianContact?: string;
    whatsappAlertsOptOut?: boolean;
    emailAlertsOptOut?: boolean;
    subscriptionTier?: 'free' | 'pro' | 'family_pro';
    dmcaDisclaimerAcknowledged?: boolean;
  }
): Promise<FirebaseUserRecord> {
  const userRef = doc(db, 'users', user.uid);
  const pathForDoc = `users/${user.uid}`;
  const isEmailAdmin = isSuperAdmin(user.email);

  let formattedPhone = metadata?.phoneNumber || user.phoneNumber || '';
  if (formattedPhone) {
    try {
      formattedPhone = normalizePhoneNumber(formattedPhone).displayPhone;
    } catch {
      // keep raw if parse fails
    }
  }

  const computedAge = metadata?.dateOfBirth ? calculateAge(metadata.dateOfBirth) : undefined;

  const fallbackRecord: FirebaseUserRecord = {
    uid: user.uid,
    email: user.email || (metadata?.phoneNumber ? formatPhoneToEmail(metadata.phoneNumber) : ''),
    phoneNumber: formattedPhone,
    fullName: metadata?.fullName || user.displayName || (isEmailAdmin ? 'Comfort Designs Admin' : 'Patient User'),
    role: isEmailAdmin ? 'admin' : 'patient',
    authProvider: metadata?.authProvider || (user.providerData[0]?.providerId === 'google.com' ? 'google' : 'password'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    // Age gate & Juvenile Governance
    dateOfBirth: metadata?.dateOfBirth,
    age: computedAge,
    ageVerified: metadata?.ageVerified ?? (isEmailAdmin || (computedAge !== undefined && computedAge > 16)),
    isGuardianManaged: metadata?.isGuardianManaged ?? false,
    guardianName: metadata?.guardianName,
    guardianContact: metadata?.guardianContact,

    // Opt-out & Preferences
    whatsappAlertsOptOut: metadata?.whatsappAlertsOptOut ?? false,
    emailAlertsOptOut: metadata?.emailAlertsOptOut ?? false,
    allNotificationsUnsubscribed: false,

    // Subscriptions
    subscriptionTier: metadata?.subscriptionTier ?? 'free',
    subscriptionBillingCycle: 'monthly',
    subscriptionRenewalTermsAccepted: false,
    autoRenew: false,

    // Security & DMCA
    sessionReplayBlocked: true, // Strictly blocked by design
    dmcaDisclaimerAcknowledged: metadata?.dmcaDisclaimerAcknowledged ?? true,
  };
  
  try {
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data() as FirebaseUserRecord;
      // If user's email is comfort.designszw@gmail.com, enforce admin role
      if (isEmailAdmin && data.role !== 'admin') {
        await updateDoc(userRef, { role: 'admin', updatedAt: new Date().toISOString() }).catch(() => null);
        data.role = 'admin';
        // Also register in admins collection
        await setDoc(doc(db, 'admins', user.uid), {
          uid: user.uid,
          email: user.email,
          assignedAt: new Date().toISOString()
        }, { merge: true }).catch(() => null);
      }
      return data;
    }

    // New User Profile Creation in Firestore
    await setDoc(userRef, fallbackRecord);

    if (isEmailAdmin) {
      await setDoc(doc(db, 'admins', user.uid), {
        uid: user.uid,
        email: user.email,
        assignedAt: new Date().toISOString()
      }, { merge: true }).catch(() => null);
    }

    // Log registration for Admin Dashboard notification
    try {
      await logStaffActivity(
        `New Registration: ${fallbackRecord.fullName} (${fallbackRecord.phoneNumber || fallbackRecord.email}) registered as ${fallbackRecord.role.toUpperCase()}${fallbackRecord.isGuardianManaged ? ' [Guardian Supervised]' : ''}`,
        'AUTH',
        `Platform signup via ${fallbackRecord.authProvider} on ${new Date().toLocaleDateString()}. Age Verified: ${fallbackRecord.ageVerified ? 'Yes (>16)' : 'Guardian Managed'}. UID: ${fallbackRecord.uid}`
      );
    } catch (auditErr) {
      console.warn('Admin registration log notice:', auditErr);
    }

    return fallbackRecord;
  } catch (error) {
    console.warn('Firestore user sync note (using memory record):', error);
    return fallbackRecord;
  }
}

/**
 * Login Method 1: Google One-Click SSO
 */
export async function loginWithGoogle(): Promise<FirebaseUserRecord> {
  const cred = await signInWithPopup(auth, googleProvider);
  return await syncUserProfile(cred.user, {
    fullName: cred.user.displayName || undefined,
    authProvider: 'google',
    ageVerified: true,
  });
}

/**
 * Login Method 2: Email & Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<FirebaseUserRecord> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return await syncUserProfile(cred.user);
}

export async function registerWithEmail(
  email: string, 
  pass: string, 
  fullName: string, 
  phone?: string,
  dateOfBirth?: string,
  guardianInfo?: { isGuardianManaged: boolean; guardianName?: string; guardianContact?: string }
): Promise<FirebaseUserRecord> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  return await syncUserProfile(cred.user, {
    fullName: fullName.trim(),
    phoneNumber: phone?.trim(),
    authProvider: 'password',
    dateOfBirth,
    ageVerified: guardianInfo?.isGuardianManaged ? true : isStrictlyAboveAge(dateOfBirth),
    isGuardianManaged: guardianInfo?.isGuardianManaged ?? false,
    guardianName: guardianInfo?.guardianName,
    guardianContact: guardianInfo?.guardianContact,
  });
}

/**
 * Login Method 3: Phone & Password
 * Uses normalized phone as email ID under the hood with a clean phone UI.
 */
export async function loginWithPhone(phoneNumber: string, pass: string): Promise<FirebaseUserRecord> {
  const { normalizedDigits, displayPhone } = normalizePhoneNumber(phoneNumber);
  const syntheticEmail = `phone_${normalizedDigits}@comfortmedi.app`;
  const cred = await signInWithEmailAndPassword(auth, syntheticEmail, pass);
  return await syncUserProfile(cred.user, {
    phoneNumber: displayPhone,
    authProvider: 'phone'
  });
}

export async function registerWithPhone(
  phoneNumber: string, 
  pass: string, 
  fullName: string,
  dateOfBirth?: string,
  guardianInfo?: { isGuardianManaged: boolean; guardianName?: string; guardianContact?: string }
): Promise<FirebaseUserRecord> {
  const { normalizedDigits, displayPhone } = normalizePhoneNumber(phoneNumber);
  const syntheticEmail = `phone_${normalizedDigits}@comfortmedi.app`;
  const cred = await createUserWithEmailAndPassword(auth, syntheticEmail, pass);
  return await syncUserProfile(cred.user, {
    fullName: fullName.trim(),
    phoneNumber: displayPhone,
    authProvider: 'phone',
    dateOfBirth,
    ageVerified: guardianInfo?.isGuardianManaged ? true : isStrictlyAboveAge(dateOfBirth),
    isGuardianManaged: guardianInfo?.isGuardianManaged ?? false,
    guardianName: guardianInfo?.guardianName,
    guardianContact: guardianInfo?.guardianContact,
  });
}

/**
 * Sign out
 */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * Admin Action: Fetch all users for RBAC management
 */
export async function fetchAllUsers(): Promise<FirebaseUserRecord[]> {
  const pathForList = 'users';
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => d.data() as FirebaseUserRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, pathForList);
  }
}

/**
 * Admin Action: Upgrade or modify user role (Patient, Caregiver, Doctor, Admin)
 */
export async function updateUserRole(targetUid: string, newRole: UserRole): Promise<void> {
  const pathForUpdate = `users/${targetUid}`;
  try {
    const userRef = doc(db, 'users', targetUid);
    await updateDoc(userRef, { 
      role: newRole,
      updatedAt: new Date().toISOString()
    });

    if (newRole === 'admin') {
      await setDoc(doc(db, 'admins', targetUid), {
        uid: targetUid,
        assignedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, pathForUpdate);
  }
}

/**
 * Patient Assignment Management (Admin assigns patients to doctors/clinicians)
 */
export async function assignPatientToDoctor(
  doctorId: string, 
  doctorName: string, 
  patientId: string, 
  patientName: string, 
  notes?: string
): Promise<PatientAssignment> {
  const assignmentId = `${doctorId}_${patientId}`;
  const path = `assignments/${assignmentId}`;
  try {
    const assignment: PatientAssignment = {
      id: assignmentId,
      doctorId,
      doctorName,
      patientId,
      patientName,
      assignedBy: auth.currentUser?.email || ADMIN_EMAIL,
      assignedAt: new Date().toISOString(),
      status: 'active',
      clinicalNotes: notes || ''
    };
    await setDoc(doc(db, 'assignments', assignmentId), assignment);
    
    // Log admin assignment action
    await logStaffActivity(
      `Assigned Patient ${patientName} to Dr. ${doctorName}`,
      'CLINICAL',
      notes || 'Clinical management authorization assigned by Admin'
    );
    
    return assignment;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function revokePatientAssignment(assignmentId: string): Promise<void> {
  const path = `assignments/${assignmentId}`;
  try {
    await updateDoc(doc(db, 'assignments', assignmentId), {
      status: 'revoked',
      revokedAt: new Date().toISOString()
    });
    await logStaffActivity(
      `Revoked Patient Assignment (${assignmentId})`,
      'CLINICAL',
      'Clinical oversight authorization revoked by Admin'
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchAllAssignments(): Promise<PatientAssignment[]> {
  const path = 'assignments';
  try {
    const snap = await getDocs(collection(db, 'assignments'));
    return snap.docs.map(d => d.data() as PatientAssignment);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchDoctorAssignments(doctorId: string): Promise<PatientAssignment[]> {
  const path = 'assignments';
  try {
    const q = query(
      collection(db, 'assignments'), 
      where('doctorId', '==', doctorId),
      where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as PatientAssignment);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Medical Staff Monitoring Audit Logs (Admin monitors clinical actions)
 */
export async function logStaffActivity(
  action: string, 
  category: 'AUTH' | 'CLINICAL' | 'MEDICATION' | 'RECORD' | 'APPOINTMENT' | 'SECURITY',
  details?: string
): Promise<void> {
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `auditLogs/${logId}`;
  try {
    const log: AuditLog = {
      id: logId,
      action,
      category,
      timestamp: new Date().toISOString(),
      details: details || '',
      actorId: auth.currentUser?.uid || 'system',
      actorName: auth.currentUser?.displayName || auth.currentUser?.email || 'Authenticated User'
    };
    await setDoc(doc(db, 'auditLogs', logId), log);
  } catch (error) {
    // Audit log write failure is non-blocking to app UI
    console.warn('Audit log write notice:', error);
  }
}

export async function fetchStaffAuditLogs(): Promise<AuditLog[]> {
  const path = 'auditLogs';
  try {
    const snap = await getDocs(collection(db, 'auditLogs'));
    const logs = snap.docs.map(d => d.data() as AuditLog);
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Scalable Firestore Clinical Data Persistence per Patient
 */
export async function persistItemToFirestore(
  userId: string, 
  subcollection: string, 
  itemId: string, 
  data: any
): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}/${subcollection}/${itemId}`;
  try {
    await setDoc(doc(db, 'users', userId, subcollection, itemId), data, { merge: true });
  } catch (error) {
    console.warn(`Firestore write warning for ${path}:`, error);
  }
}

export async function deleteItemFromFirestore(
  userId: string, 
  subcollection: string, 
  itemId: string
): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}/${subcollection}/${itemId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, subcollection, itemId));
  } catch (error) {
    console.warn(`Firestore delete warning for ${path}:`, error);
  }
}

export async function updateUserProfileInFirestore(
  userId: string,
  data: Partial<FirebaseUserRecord>
): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.warn(`Firestore profile update warning for ${path}:`, error);
  }
}

export async function fetchCollectionFromFirestore<T>(
  userId: string, 
  subcollection: string
): Promise<T[]> {
  if (!userId) return [];
  const path = `users/${userId}/${subcollection}`;
  try {
    const snap = await getDocs(collection(db, 'users', userId, subcollection));
    return snap.docs.map(d => d.data() as T);
  } catch (error) {
    console.warn(`Firestore collection read notice for ${path}:`, error);
    return [];
  }
}

/**
 * User Data Control: Permanently Erase All User Data (Right to be Forgotten)
 */
export async function deleteUserAccountAndData(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    // Delete subcollections documents if any
    const subcollections = ['vitals', 'medications', 'appointments', 'records', 'tasks', 'medicationLogs'];
    for (const sub of subcollections) {
      try {
        const snap = await getDocs(collection(db, 'users', userId, sub));
        for (const docSnap of snap.docs) {
          await deleteDoc(docSnap.ref);
        }
      } catch (e) {
        console.warn(`Could not delete subcollection ${sub}:`, e);
      }
    }
    // Delete main user profile
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Facility Directory Profile Creation (Admin, Doctor, Pharmacist)
 */
export async function createFacilityProfile(facilityData: Omit<Facility, 'id'>): Promise<Facility> {
  const facilityId = 'fac-zw-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
  const facility: Facility = {
    ...facilityData,
    id: facilityId,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'facilities', facilityId), facility);
    await logStaffActivity(
      `Created Facility Profile: ${facility.name} (${facility.type.toUpperCase()}) in ${facility.city}`,
      'CLINICAL',
      `Facility established by ${facility.createdByRole?.toUpperCase() || 'STAFF'}. WhatsApp: ${facility.whatsappNumber || facility.phone}`
    );
  } catch (error) {
    console.warn('Facility profile Firestore write note:', error);
  }

  return facility;
}

export async function fetchAllFacilitiesFromFirestore(): Promise<Facility[]> {
  try {
    const snap = await getDocs(collection(db, 'facilities'));
    return snap.docs.map(d => d.data() as Facility);
  } catch (error) {
    console.warn('Could not read facilities from Firestore:', error);
    return [];
  }
}

/**
 * Facility Booking & Appointment Creation
 */
export async function createFacilityBooking(bookingData: any): Promise<any> {
  const bookingId = bookingData.id || ('apt-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6));
  const booking = {
    ...bookingData,
    id: bookingId,
  };

  const patientId = booking.patientId || auth.currentUser?.uid;

  // 1. Persist to patient's personal appointment collection
  if (patientId) {
    try {
      await setDoc(doc(db, 'users', patientId, 'appointments', bookingId), booking);
    } catch (e) {
      console.warn('Patient appointment write note:', e);
    }
  }

  // 2. Persist to central facility bookings queue for Facility Managers / Doctors / Admins
  try {
    await setDoc(doc(db, 'facilityBookings', bookingId), booking);
    await logStaffActivity(
      `New Facility Booking: ${booking.patientName || 'Patient'} booked at ${booking.facilityName || 'Medical Facility'}`,
      'APPOINTMENT',
      `Reason: ${booking.reasonCategory || booking.reason || 'Consultation'} for ${booking.bookingDate || booking.date} at ${booking.bookingTime || booking.time}`
    );
  } catch (e) {
    console.warn('Facility central booking write note:', e);
  }

  return booking;
}

export async function fetchAllFacilityBookings(): Promise<FacilityBooking[]> {
  try {
    const snap = await getDocs(collection(db, 'facilityBookings'));
    const list = snap.docs.map(d => d.data() as FacilityBooking);
    return list.sort((a, b) => new Date(b.bookingDate || b.createdAt || 0).getTime() - new Date(a.bookingDate || a.createdAt || 0).getTime());
  } catch (error) {
    console.warn('Could not fetch facility bookings queue:', error);
    return [];
  }
}

/**
 * Facility Manager or Doctor schedules an appointment date for a booking/waitlist
 */
export async function scheduleFacilityBooking(
  bookingId: string,
  scheduledDate: string,
  scheduledTime: string,
  doctorName: string,
  notes?: string,
  patientId?: string
): Promise<void> {
  const updates = {
    date: scheduledDate,
    time: scheduledTime,
    scheduledDate,
    scheduledTime,
    providerName: doctorName,
    doctorName,
    status: 'scheduled' as const,
    isWaitingList: false,
    scheduledBy: doctorName,
    scheduledAt: new Date().toISOString(),
    notes: notes || '',
  };

  // 1. Update central booking
  try {
    await updateDoc(doc(db, 'facilityBookings', bookingId), updates);
  } catch (e) {
    console.warn('Central booking schedule note:', e);
  }

  // 2. Update patient appointment
  if (patientId) {
    try {
      await updateDoc(doc(db, 'users', patientId, 'appointments', bookingId), updates);
    } catch (e) {
      console.warn('Patient appointment schedule note:', e);
    }
  }

  await logStaffActivity(
    `Appointment Scheduled: ${doctorName} confirmed visit for ${scheduledDate} at ${scheduledTime}`,
    'APPOINTMENT',
    `Booking ID: ${bookingId}`
  );
}

/**
 * EcoCash Paid Subscription Management
 */
export async function submitEcoCashSubscriptionRequest(
  data: Omit<SubscriptionPaymentRequest, 'id' | 'submittedAt' | 'status'>
): Promise<SubscriptionPaymentRequest> {
  const requestId = 'sub_req_' + Date.now();
  const request: SubscriptionPaymentRequest = {
    ...data,
    id: requestId,
    submittedAt: new Date().toISOString(),
    status: 'pending',
  };

  // 1. Save to central subscriptionRequests collection for Admin
  try {
    await setDoc(doc(db, 'subscriptionRequests', requestId), request);
  } catch (e) {
    console.warn('Subscription request central write note:', e);
  }

  // 2. Update user profile with pending request
  try {
    await setDoc(doc(db, 'users', data.userId), {
      pendingSubscriptionRequest: request,
      subscriptionStatus: 'pending',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (e) {
    console.warn('User subscription pending update note:', e);
  }

  await logStaffActivity(
    `EcoCash Payment Submitted: ${data.userName} for ${data.tier === 'family_pro' ? 'Family & Clinic Pro' : 'Medi+ Pro'} (EcoCash TX: ${data.ecocashTransactionId})`,
    'AUTH',
    `Amount: $${data.amountUsd} • Phone: ${data.userPhone}`
  );

  return request;
}

export async function fetchAllSubscriptionRequests(): Promise<SubscriptionPaymentRequest[]> {
  try {
    const snap = await getDocs(collection(db, 'subscriptionRequests'));
    const list = snap.docs.map(d => d.data() as SubscriptionPaymentRequest);
    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  } catch (error) {
    console.warn('Could not fetch subscription requests:', error);
    return [];
  }
}

/**
 * Admin Verification & Activation of EcoCash Pro Subscription (persisted for 30 days)
 */
export async function verifyAndActivateSubscription(
  requestId: string,
  targetUid: string,
  tier: SubscriptionTier,
  adminName: string = 'Super Admin',
  durationDays: number = 30
): Promise<{ activatedAt: string; expiresAt: string }> {
  const now = new Date();
  const expires = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const activatedAt = now.toISOString();
  const expiresAt = expires.toISOString();

  // 1. Update subscription request
  try {
    await updateDoc(doc(db, 'subscriptionRequests', requestId), {
      status: 'verified',
      verifiedAt: activatedAt,
      verifiedBy: adminName,
      validUntil: expiresAt,
    });
  } catch (e) {
    console.warn('Subscription request verification update note:', e);
  }

  // 2. Update target user account in Firestore
  try {
    await setDoc(doc(db, 'users', targetUid), {
      subscriptionTier: tier,
      subscriptionStatus: 'active',
      subscriptionActivatedAt: activatedAt,
      subscriptionExpiresAt: expiresAt,
      subscriptionRenewalDate: expires.toLocaleDateString('en-ZW', { day: 'numeric', month: 'long', year: 'numeric' }),
      subscriptionPaymentMethod: 'ecocash',
      autoRenew: false,
      updatedAt: activatedAt,
    }, { merge: true });
  } catch (e) {
    console.warn('Target user subscription activation update note:', e);
  }

  await logStaffActivity(
    `Admin Verified EcoCash Subscription: Activated ${tier.toUpperCase()} for 30 days for user UID ${targetUid}`,
    'SECURITY',
    `Active until: ${expiresAt} • Verified by ${adminName}`
  );

  return { activatedAt, expiresAt };
}

export async function rejectSubscriptionRequest(
  requestId: string,
  adminName: string = 'Super Admin',
  reason: string = 'Payment could not be verified on EcoCash statement'
): Promise<void> {
  try {
    await updateDoc(doc(db, 'subscriptionRequests', requestId), {
      status: 'rejected',
      rejectionReason: reason,
      verifiedAt: new Date().toISOString(),
      verifiedBy: adminName,
    });
  } catch (e) {
    console.warn('Subscription rejection update note:', e);
  }

  await logStaffActivity(
    `Admin Rejected EcoCash Subscription Request: ID ${requestId}`,
    'SECURITY',
    `Reason: ${reason} • Rejected by ${adminName}`
  );
}

