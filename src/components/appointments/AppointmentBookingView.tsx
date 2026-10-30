import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { PRELOADED_FACILITIES, ZIMBABWE_PROVINCES } from '../../data/zimbabweFacilities';
import { Appointment, Facility, FacilityType, AppointmentReasonCategory, FacilityBooking } from '../../types';
import { generateWhatsAppLink, triggerWhatsAppNotification } from '../../lib/whatsappGateway';
import { createFacilityBooking } from '../../lib/authService';
import { 
  CalendarCheck, 
  MapPin, 
  Phone, 
  Clock, 
  Search, 
  Plus, 
  ShieldAlert, 
  CheckCircle, 
  X, 
  AlertCircle, 
  Building2, 
  ListFilter,
  Users,
  MessageSquare,
  Mail,
  Send,
  Calendar,
  UserCheck,
  Stethoscope,
  CheckCircle2,
  Hourglass
} from 'lucide-react';

export const APPOINTMENT_REASONS: AppointmentReasonCategory[] = [
  'General Medical Advice',
  'Consultation',
  'Routine checkups',
  'Acute Illness',
  'Vaccinations',
  'Advanced Diagnostics testing',
  'Surgical Consultations',
  'Prenatal and Obstetric Care',
  'Impatient Admissions',
  'Imaging and Radiology',
  'Therapy Services',
  'Administrative and Legal Reasons',
  'Other'
];

export const AppointmentBookingView: React.FC = () => {
  const appointments = useAppStore(s => s.appointments);
  const userProfile = useAppStore(s => s.userProfile);
  const currentUserRole = useAppStore(s => s.currentUserRole);
  const firebaseUser = useAppStore(s => s.firebaseUser);
  const customFacilities = useAppStore(s => s.customFacilities);
  const facilityBookingsQueue = useAppStore(s => s.facilityBookingsQueue);
  const appointmentActiveSubTab = useAppStore(s => s.appointmentActiveSubTab);
  const setAppointmentActiveSubTab = useAppStore(s => s.setAppointmentActiveSubTab);
  const addCustomFacility = useAppStore(s => s.addCustomFacility);
  const bookAppointment = useAppStore(s => s.bookAppointment);
  const updateAppointmentStatus = useAppStore(s => s.updateAppointmentStatus);
  const cancelAppointment = useAppStore(s => s.cancelAppointment);
  const scheduleFacilityBookingAction = useAppStore(s => s.scheduleFacilityBookingAction);
  const loadFacilities = useAppStore(s => s.loadFacilities);
  const loadFacilityBookings = useAppStore(s => s.loadFacilityBookings);
  const showToast = useAppStore(s => s.showToast);

  // Filters
  const [selectedProvince, setSelectedProvince] = useState<string>('All Provinces');
  const [searchQuery, setSearchQuery] = useState('');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState<string>('all');
  
  // Booking modal
  const [bookingModalFacility, setBookingModalFacility] = useState<Facility | null>(null);
  const [isWaitingListBooking, setIsWaitingListBooking] = useState(false);

  // Facility Profile Registration Modal
  const [showCreateFacilityModal, setShowCreateFacilityModal] = useState(false);
  const [facilityForm, setFacilityForm] = useState({
    name: '',
    type: 'clinic' as FacilityType,
    province: 'Harare',
    city: 'Harare',
    address: '',
    phone: '',
    whatsappNumber: '+263',
    email: '',
    operatingHours: 'Mon - Fri 08:00 - 17:00, Sat 08:00 - 13:00',
    hasEmergency24_7: false,
    servicesStr: 'Outpatient Consultations, Pharmacy, Vitals Screening',
    specialtiesStr: 'General Medicine, Family Health',
  });

  // Scheduling Modal for Staff (Admins, Doctors, Pharmacists)
  const [schedulingBooking, setSchedulingBooking] = useState<FacilityBooking | null>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('10:00 AM');
  const [scheduleNotes, setScheduleNotes] = useState('Please arrive 15 minutes before your consultation with medical ID');

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    patientName: userProfile.fullName || '',
    patientPhone: userProfile.phoneNumber || '',
    patientEmail: userProfile.email || '',
    patientDob: userProfile.dateOfBirth || '',
    patientAge: userProfile.dateOfBirth ? Math.max(0, new Date().getFullYear() - new Date(userProfile.dateOfBirth).getFullYear()) : 28,
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    time: '09:00 AM',
    reasonCategory: 'Consultation' as AppointmentReasonCategory,
    otherReasonSpecify: '',
    notes: '',
  });

  useEffect(() => {
    loadFacilities();
    loadFacilityBookings();
  }, []);

  // Update booking form whenever userProfile changes
  useEffect(() => {
    setBookingForm(prev => ({
      ...prev,
      patientName: userProfile.fullName || prev.patientName,
      patientPhone: userProfile.phoneNumber || prev.patientPhone,
      patientEmail: userProfile.email || prev.patientEmail,
      patientDob: userProfile.dateOfBirth || prev.patientDob,
    }));
  }, [userProfile]);

  // Combined facilities
  const allFacilities: Facility[] = [...customFacilities, ...PRELOADED_FACILITIES];

  // Filter facilities
  const filteredFacilities = allFacilities.filter(f => {
    const matchesProvince = selectedProvince === 'All Provinces' || f.province === selectedProvince;
    const matchesType = facilityTypeFilter === 'all' || f.type === facilityTypeFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      f.name.toLowerCase().includes(q) ||
      f.city.toLowerCase().includes(q) ||
      (f.specialties && f.specialties.some(s => s.toLowerCase().includes(q))) ||
      (f.services && f.services.some(s => s.toLowerCase().includes(q)));

    return matchesProvince && matchesType && matchesSearch;
  });

  const canManageFacilities = 
    currentUserRole === 'admin' || 
    currentUserRole === 'doctor' || 
    currentUserRole === 'pharmacist' ||
    firebaseUser?.email === 'comfort.designszw@gmail.com';

  const handleOpenBooking = (facility: Facility, asWaitingList = false) => {
    setBookingModalFacility(facility);
    setIsWaitingListBooking(asWaitingList);
    setBookingForm({
      patientName: userProfile.fullName || '',
      patientPhone: userProfile.phoneNumber || '',
      patientEmail: userProfile.email || '',
      patientDob: userProfile.dateOfBirth || '',
      patientAge: userProfile.dateOfBirth ? Math.max(0, new Date().getFullYear() - new Date(userProfile.dateOfBirth).getFullYear()) : 28,
      date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      time: '09:30 AM',
      reasonCategory: 'Consultation',
      otherReasonSpecify: '',
      notes: '',
    });
  };

  const handleCreateFacilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityForm.name.trim() || !facilityForm.address.trim()) {
      showToast('Please provide facility name and address', 'error');
      return;
    }
    if (!facilityForm.whatsappNumber.trim() && !facilityForm.email.trim()) {
      showToast('Each facility must have either a WhatsApp number or email address', 'error');
      return;
    }

    const services = facilityForm.servicesStr.split(',').map(s => s.trim()).filter(Boolean);
    const specialties = facilityForm.specialtiesStr.split(',').map(s => s.trim()).filter(Boolean);

    await addCustomFacility({
      name: facilityForm.name.trim(),
      type: facilityForm.type,
      province: facilityForm.province,
      city: facilityForm.city,
      address: facilityForm.address.trim(),
      phone: facilityForm.phone.trim() || facilityForm.whatsappNumber.trim(),
      whatsappNumber: facilityForm.whatsappNumber.trim() || undefined,
      email: facilityForm.email.trim() || undefined,
      operatingHours: facilityForm.operatingHours,
      hasEmergency24_7: facilityForm.hasEmergency24_7,
      services,
      specialties,
    });

    setShowCreateFacilityModal(false);
    setFacilityForm({
      name: '',
      type: 'clinic',
      province: 'Harare',
      city: 'Harare',
      address: '',
      phone: '',
      whatsappNumber: '+263',
      email: '',
      operatingHours: 'Mon - Fri 08:00 - 17:00, Sat 08:00 - 13:00',
      hasEmergency24_7: false,
      servicesStr: 'Outpatient Consultations, Pharmacy, Vitals Screening',
      specialtiesStr: 'General Medicine, Family Health',
    });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalFacility) return;

    const bookingId = 'bk-' + Date.now();
    const facilityContact = bookingModalFacility.whatsappNumber || bookingModalFacility.phone;

    // 1. Create FacilityBooking record for Firestore
    const reasonDisplay = bookingForm.reasonCategory === 'Other'
      ? `Other (${bookingForm.otherReasonSpecify || 'Specified by Patient'})`
      : bookingForm.reasonCategory;

    const bookingRecord: FacilityBooking = {
      id: bookingId,
      facilityId: bookingModalFacility.id,
      facilityName: bookingModalFacility.name,
      facilityWhatsApp: bookingModalFacility.whatsappNumber,
      facilityEmail: bookingModalFacility.email,
      patientId: firebaseUser?.uid || 'guest-' + Date.now(),
      patientName: bookingForm.patientName,
      patientPhone: bookingForm.patientPhone,
      patientEmail: bookingForm.patientEmail,
      patientDob: bookingForm.patientDob,
      patientAge: Number(bookingForm.patientAge) || undefined,
      bookingDate: bookingForm.date,
      bookingTime: bookingForm.time,
      reasonCategory: bookingForm.reasonCategory,
      otherReasonSpecify: bookingForm.reasonCategory === 'Other' ? bookingForm.otherReasonSpecify : undefined,
      notes: bookingForm.notes,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      await createFacilityBooking(bookingRecord);
    } catch (err) {
      console.warn('Facility booking cloud sync notice:', err);
    }

    // 2. Add to user's appointments state
    const newAppointment: Omit<Appointment, 'id'> = {
      facilityId: bookingModalFacility.id,
      facilityName: bookingModalFacility.name,
      appointmentType: 'general_consultation',
      date: bookingForm.date,
      time: bookingForm.time,
      providerName: `Attending Specialist • ${bookingModalFacility.name}`,
      reasonCategory: bookingForm.reasonCategory,
      otherReasonSpecify: bookingForm.reasonCategory === 'Other' ? bookingForm.otherReasonSpecify : undefined,
      reason: bookingForm.reasonCategory === 'Other'
        ? `Other: ${bookingForm.otherReasonSpecify || 'Custom'} - ${bookingForm.notes || 'Custom Reason Booking'}`
        : `${bookingForm.reasonCategory}: ${bookingForm.notes || 'Facility Consultation Booking'}`,
      notes: bookingForm.notes,
      status: 'pending',
      isWaitingList: true,
      patientId: firebaseUser?.uid,
      patientName: bookingForm.patientName,
      patientPhone: bookingForm.patientPhone,
      patientEmail: bookingForm.patientEmail,
      patientDob: bookingForm.patientDob,
      patientAge: Number(bookingForm.patientAge),
      facilityWhatsApp: bookingModalFacility.whatsappNumber,
      facilityEmail: bookingModalFacility.email,
    };

    await bookAppointment(newAppointment);

    showToast(
      `Appointment booking submitted to ${bookingModalFacility.name}! Listed in your Waiting List.`,
      'success'
    );

    // 3. Option to trigger WhatsApp notification to the facility's WhatsApp number
    if (bookingModalFacility.whatsappNumber) {
      const waText = `*NEW FACILITY APPOINTMENT BOOKING* 🏥\nFacility: *${bookingModalFacility.name}*\nPatient Name: *${bookingForm.patientName}*\nPhone: ${bookingForm.patientPhone}\nEmail: ${bookingForm.patientEmail || 'N/A'}\nPreferred Date: *${bookingForm.date}* at *${bookingForm.time}*\nReason: *${reasonDisplay}*\nClinical Notes & Reasons: ${bookingForm.notes || 'None'}\n\nPlease confirm and schedule my appointment. Thank you!`;
      
      const waUrl = generateWhatsAppLink(bookingModalFacility.whatsappNumber, waText);
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }

    setBookingModalFacility(null);
  };

  const handleConfirmScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingBooking) return;

    await scheduleFacilityBookingAction(
      schedulingBooking.id,
      scheduleDate,
      scheduleTime,
      scheduleNotes
    );

    setSchedulingBooking(null);
  };

  const waitingListAppointments = appointments.filter(a => a.isWaitingList || a.status === 'pending');

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-600" />
            <span>Medical Facilities Directory &amp; Bookings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Book hospitals, clinics, surgeries, labs, specialist practices, pharmacies &amp; home care providers across Zimbabwe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManageFacilities && (
            <button
              onClick={() => setShowCreateFacilityModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Facility Directory</span>
            </button>
          )}

          <button
            onClick={() => setAppointmentActiveSubTab('facility_directory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              appointmentActiveSubTab === 'facility_directory'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Facilities Directory</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-semibold gap-1 sm:gap-2">
        <button
          onClick={() => setAppointmentActiveSubTab('facility_directory')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            appointmentActiveSubTab === 'facility_directory'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Facilities Directory ({allFacilities.length})</span>
        </button>

        <button
          onClick={() => setAppointmentActiveSubTab('waiting_list')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            appointmentActiveSubTab === 'waiting_list'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Hourglass className="w-4 h-4 text-amber-600" />
          <span>Waiting List &amp; Doctor Scheduling ({waitingListAppointments.length})</span>
        </button>

        <button
          onClick={() => setAppointmentActiveSubTab('my_appointments')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            appointmentActiveSubTab === 'my_appointments'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Confirmed Appointments ({appointments.filter(a => a.status === 'confirmed').length})</span>
        </button>
      </div>

      {/* TAB 1: FACILITY DIRECTORY */}
      {appointmentActiveSubTab === 'facility_directory' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search facility name, surgery, pharmacy, lab..."
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-sm"
              />
            </div>

            <div>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-sm"
              >
                {ZIMBABWE_PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={facilityTypeFilter}
                onChange={(e) => setFacilityTypeFilter(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none shadow-sm"
              >
                <option value="all">All Facility Types (Hospitals, Surgeries, Labs...)</option>
                <option value="hospital">Hospitals</option>
                <option value="clinic">Clinics</option>
                <option value="pharmacy">Pharmacies</option>
                <option value="laboratory">Laboratories</option>
                <option value="specialist">Specialist Practices</option>
                <option value="surgery">Surgeries</option>
                <option value="home_care">Home Care Providers</option>
              </select>
            </div>
          </div>

          {/* Facilities Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFacilities.map((facility) => (
              <div
                key={facility.id}
                className="rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:border-teal-500/50 hover:shadow-md transition"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                          {facility.type.replace('_', ' ')}
                        </span>
                        {facility.hasEmergency24_7 && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                            24/7 Casualty
                          </span>
                        )}
                        {facility.whatsappNumber && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp Ready</span>
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-900 mt-1.5">
                        {facility.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{facility.address} • {facility.city}, {facility.province}</span>
                  </p>

                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{facility.operatingHours}</span>
                  </p>

                  {/* WhatsApp and Email info */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 pt-1">
                    {facility.whatsappNumber && (
                      <span className="flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50/70 px-2 py-0.5 rounded-lg">
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        <span>WA: {facility.whatsappNumber}</span>
                      </span>
                    )}
                    {facility.email && (
                      <span className="flex items-center gap-1 text-blue-800 font-semibold bg-blue-50/70 px-2 py-0.5 rounded-lg">
                        <Mail className="w-3 h-3 text-blue-600" />
                        <span>{facility.email}</span>
                      </span>
                    )}
                  </div>

                  {/* Specialties Pills */}
                  {facility.specialties && facility.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {facility.specialties.map(spec => (
                        <span key={spec} className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 text-[10px] font-semibold">
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${facility.phone.replace(/\s+/g, '')}`}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Phone className="w-3.5 h-3.5 text-teal-600" />
                      <span>Call</span>
                    </a>

                    {facility.whatsappNumber && (
                      <a
                        href={generateWhatsAppLink(
                          facility.whatsappNumber,
                          `Hello ${facility.name}, I would like to inquire about booking an appointment through Comfort Medi+.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOpenBooking(facility, true)}
                      className="px-2.5 py-1.5 rounded-xl border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-semibold transition"
                      title="Join Waiting List if fully booked"
                    >
                      Waitlist
                    </button>
                    <button
                      onClick={() => handleOpenBooking(facility, false)}
                      className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book Appointment</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredFacilities.length === 0 && (
              <div className="col-span-full text-center py-12 text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
                No facilities matching your filter. Try changing the province or facility type.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WAITING LIST & DOCTOR SCHEDULING */}
      {appointmentActiveSubTab === 'waiting_list' && (
        <div className="space-y-4">
          
          <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-3">
            <Hourglass className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-950 text-sm">Waitlist &amp; Doctor Scheduling Subsection</h4>
              <p className="mt-0.5 text-amber-800">
                When you book an appointment at any facility, it enters the facility's queue. Once a doctor or facility manager schedules your confirmed consultation date and time, it automatically synchronizes to your account on any device you log into.
              </p>
            </div>
          </div>

          {/* User's Waiting List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Your Active Facility Bookings &amp; Waitlist</h3>
            
            {waitingListAppointments.map((apt) => (
              <div
                key={apt.id}
                className="rounded-3xl bg-white p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-base text-slate-900">{apt.facilityName}</span>
                    {apt.scheduledDate ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>SCHEDULED BY DOCTOR</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        WAITLIST AWAITING DOCTOR CONFIRMATION
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">Reason Category:</span> {apt.reasonCategory || apt.reason}
                  </p>
                  
                  {apt.notes && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-xl">
                      "{apt.notes}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-1">
                    <span className="text-slate-600">
                      📅 Requested: {apt.date} at {apt.time}
                    </span>
                    {apt.scheduledDate && (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                        ✨ Confirmed Date: {apt.scheduledDate} at {apt.scheduledTime} (by {apt.scheduledBy || 'Facility Clinician'})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
                  {apt.facilityWhatsApp && (
                    <a
                      href={generateWhatsAppLink(
                        apt.facilityWhatsApp,
                        `Hello ${apt.facilityName}, I am following up on my appointment booking (${apt.reasonCategory || 'Consultation'}) on Comfort Medi+.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Facility</span>
                    </a>
                  )}

                  {canManageFacilities && (
                    <button
                      onClick={() => {
                        setSchedulingBooking({
                          id: apt.id,
                          facilityId: apt.facilityId,
                          facilityName: apt.facilityName,
                          patientId: apt.patientId || '',
                          patientName: apt.patientName || apt.providerName,
                          patientPhone: apt.patientPhone || '',
                          bookingDate: apt.date,
                          bookingTime: apt.time,
                          reasonCategory: apt.reasonCategory || 'Consultation',
                          otherReasonSpecify: apt.otherReasonSpecify,
                          notes: apt.notes,
                          status: 'pending',
                          createdAt: new Date().toISOString(),
                        });
                        setScheduleDate(apt.date || new Date().toISOString().split('T')[0]);
                        setScheduleTime(apt.time || '10:00 AM');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Doctor Schedule</span>
                    </button>
                  )}

                  <button
                    onClick={() => cancelAppointment(apt.id)}
                    className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            ))}

            {waitingListAppointments.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
                No active waitlist appointments. Browse the Facilities Directory to book your consultation.
              </div>
            )}
          </div>

          {/* Incoming Bookings Queue for Facility Managers & Clinicians */}
          {canManageFacilities && facilityBookingsQueue.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    <span>Facility Managers &amp; Clinicians Incoming Bookings Queue</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review incoming patient bookings and assign confirmed consultation dates.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {facilityBookingsQueue.length} Bookings
                </span>
              </div>

              <div className="space-y-3">
                {facilityBookingsQueue.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{b.patientName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {b.patientPhone}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'scheduled' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">
                        <span className="font-semibold text-slate-800">Facility:</span> {b.facilityName} • <span className="font-semibold text-slate-800">Reason:</span> {b.reasonCategory}
                      </p>
                      {b.notes && <p className="text-slate-500 italic mt-0.5">"{b.notes}"</p>}
                      <p className="text-slate-400 text-[11px] mt-1">
                        Requested: {b.bookingDate} at {b.bookingTime} {b.scheduledDate ? `• Scheduled for ${b.scheduledDate} at ${b.scheduledTime}` : ''}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSchedulingBooking(b);
                        setScheduleDate(b.bookingDate);
                        setScheduleTime(b.bookingTime);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold self-start md:self-center transition"
                    >
                      {b.status === 'scheduled' ? 'Reschedule' : 'Schedule Appointment Date'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONFIRMED APPOINTMENTS */}
      {appointmentActiveSubTab === 'my_appointments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.filter(a => a.status !== 'cancelled').map((apt) => (
              <div
                key={apt.id}
                className="rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4 hover:border-teal-500/40 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-800">
                        {apt.appointmentType.replace('_', ' ')}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {apt.facilityName}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">
                        {apt.providerName}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      apt.status === 'checked_in' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      apt.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {apt.status}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl space-y-1 text-xs">
                    <p className="text-slate-700">
                      <span className="font-semibold text-slate-900">Reason:</span> {apt.reason}
                    </p>
                    {apt.notes && (
                      <p className="text-slate-500 italic">
                        <span className="font-semibold text-slate-700">Notes:</span> {apt.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold text-slate-700 pt-1">
                    <span>📅 {apt.scheduledDate || apt.date}</span>
                    <span>⏰ {apt.scheduledTime || apt.time}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {apt.facilityWhatsApp && (
                    <a
                      href={generateWhatsAppLink(
                        apt.facilityWhatsApp,
                        `Hello ${apt.facilityName}, confirming my scheduled appointment on ${apt.date}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  <div className="flex items-center gap-1.5 ml-auto">
                    {apt.status === 'confirmed' && (
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, 'checked_in')}
                        className="px-2.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold transition"
                      >
                        Check-In
                      </button>
                    )}
                    {apt.status === 'checked_in' && (
                      <button
                        onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                        className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition"
                      >
                        Complete
                      </button>
                    )}
                    {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                      <button
                        onClick={() => cancelAppointment(apt.id)}
                        className="px-2.5 py-1 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {appointments.filter(a => a.status !== 'cancelled').length === 0 && (
              <div className="col-span-full text-center py-12 text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
                No active appointments. Browse the Facilities Directory to book a consultation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE FACILITY PROFILE MODAL (Admins, Doctors, Pharmacists) */}
      {showCreateFacilityModal && (
        <div 
          onClick={() => setShowCreateFacilityModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-black text-slate-900">
                  Register Medical Facility Profile
                </h3>
              </div>
              <button 
                onClick={() => setShowCreateFacilityModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Allowed Roles: Admins, Doctors &amp; Pharmacists. Registered facilities appear immediately in the public directory with one-tap booking buttons.
            </p>

            <form onSubmit={handleCreateFacilitySubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Facility Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Parirenyatwa Specialist Eye Clinic &amp; Surgery"
                  value={facilityForm.name}
                  onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Facility Type *</label>
                  <select
                    value={facilityForm.type}
                    onChange={(e) => setFacilityForm({ ...facilityForm, type: e.target.value as FacilityType })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="hospital">Hospital</option>
                    <option value="clinic">Clinic</option>
                    <option value="pharmacy">Pharmacy</option>
                    <option value="laboratory">Laboratory</option>
                    <option value="specialist">Specialist Practice</option>
                    <option value="surgery">Surgery</option>
                    <option value="home_care">Home Care Provider</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Province *</label>
                  <select
                    value={facilityForm.province}
                    onChange={(e) => setFacilityForm({ ...facilityForm, province: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {ZIMBABWE_PROVINCES.filter(p => p !== 'All Provinces').map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City / Town *</label>
                  <input
                    required
                    type="text"
                    value={facilityForm.city}
                    onChange={(e) => setFacilityForm({ ...facilityForm, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Street Address *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Mazowe St, Belgravia"
                    value={facilityForm.address}
                    onChange={(e) => setFacilityForm({ ...facilityForm, address: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* WhatsApp Number & Email Address (Required for bookings) */}
              <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200 space-y-2.5">
                <span className="text-[11px] font-black uppercase text-teal-900 tracking-wider block">
                  Facility Booking Direct Contact
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Facility WhatsApp No. *</span>
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="+263 77 123 4567"
                      value={facilityForm.whatsappNumber}
                      onChange={(e) => setFacilityForm({ ...facilityForm, whatsappNumber: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span>Facility Booking Email</span>
                    </label>
                    <input
                      type="email"
                      placeholder="bookings@facility.co.zw"
                      value={facilityForm.email}
                      onChange={(e) => setFacilityForm({ ...facilityForm, email: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={facilityForm.operatingHours}
                    onChange={(e) => setFacilityForm({ ...facilityForm, operatingHours: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Voice Phone</label>
                  <input
                    type="text"
                    placeholder="+263 242 700000"
                    value={facilityForm.phone}
                    onChange={(e) => setFacilityForm({ ...facilityForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Clinical Specialties (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Cardiology, Paediatrics, Ultrasound, Dental Surgery"
                  value={facilityForm.specialtiesStr}
                  onChange={(e) => setFacilityForm({ ...facilityForm, specialtiesStr: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={facilityForm.hasEmergency24_7}
                  onChange={(e) => setFacilityForm({ ...facilityForm, hasEmergency24_7: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <span className="font-bold text-slate-800 text-xs">24/7 Emergency Casualty Unit Available</span>
              </label>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateFacilityModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm"
                >
                  Create &amp; Publish Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPOINTMENT BOOKING FORM MODAL */}
      {bookingModalFacility && (
        <div 
          onClick={() => setBookingModalFacility(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                  {bookingModalFacility.type.replace('_', ' ')}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Book Appointment at {bookingModalFacility.name}
                </h3>
              </div>
              <button 
                onClick={() => setBookingModalFacility(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="mt-4 space-y-3.5 text-xs">
              
              {/* Section 1: Patient Personal Details */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 block">
                  Patient Personal Details
                </span>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-0.5">Full Legal Name *</label>
                    <input
                      required
                      type="text"
                      value={bookingForm.patientName}
                      onChange={(e) => setBookingForm({ ...bookingForm, patientName: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-0.5">Phone Number *</label>
                    <input
                      required
                      type="tel"
                      value={bookingForm.patientPhone}
                      onChange={(e) => setBookingForm({ ...bookingForm, patientPhone: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-0.5">Email Address</label>
                    <input
                      type="email"
                      value={bookingForm.patientEmail}
                      onChange={(e) => setBookingForm({ ...bookingForm, patientEmail: e.target.value })}
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-0.5">Patient Age</label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={bookingForm.patientAge}
                      onChange={(e) => setBookingForm({ ...bookingForm, patientAge: Number(e.target.value) })}
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Booking Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Preferred Booking Date *</label>
                  <input
                    required
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Preferred Time Slot *</label>
                  <select
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="08:00 AM">08:00 AM (Early Morning)</option>
                    <option value="09:30 AM">09:30 AM (Morning)</option>
                    <option value="11:00 AM">11:00 AM (Late Morning)</option>
                    <option value="01:30 PM">01:30 PM (Early Afternoon)</option>
                    <option value="03:00 PM">03:00 PM (Afternoon)</option>
                    <option value="04:30 PM">04:30 PM (Late Afternoon)</option>
                  </select>
                </div>
              </div>

              {/* Section 3: Reason for Booking (The 12 options + Other) */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Reason for the Booking *
                </label>
                <select
                  value={bookingForm.reasonCategory}
                  onChange={(e) => setBookingForm({ ...bookingForm, reasonCategory: e.target.value as AppointmentReasonCategory })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium focus:ring-2 focus:ring-teal-500"
                >
                  {APPOINTMENT_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Conditional Specify Field when 'Other' is selected */}
              {bookingForm.reasonCategory === 'Other' && (
                <div className="p-3 bg-amber-50/80 border border-amber-300/80 rounded-2xl space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Specify Custom Booking Reason</span>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 text-[11px]">
                      Specify and State Your Reason Category *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Dental check, Dermatology consultation, Ophthalmology exam..."
                      value={bookingForm.otherReasonSpecify}
                      onChange={(e) => setBookingForm({ ...bookingForm, otherReasonSpecify: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-xs focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-amber-800">
                    Specify the specific medical department or custom reason for booking above, then provide full symptom details in the text area below.
                  </p>
                </div>
              )}

              {/* Section 4: Notes Area where patient writes reasons for bookings */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  {bookingForm.reasonCategory === 'Other'
                    ? 'Custom Reason for Booking & Clinical Details (Text Area) *'
                    : 'Notes Area (Write your reasons & clinical symptoms for your booking) *'}
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={
                    bookingForm.reasonCategory === 'Other'
                      ? "Enter your custom reason for booking in full detail: describe your medical concerns, symptoms, duration, and any specific doctor or clinical assistance you need..."
                      : "Describe your current symptoms, medical history, or reason for this consultation..."
                  }
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Facility Contact Notice */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Automated Facility Dispatch &amp; WhatsApp</p>
                  <p className="text-emerald-800 mt-0.5">
                    Upon submission, your booking will be logged in your Waitlist. A prefilled WhatsApp message will open to dispatch directly to {bookingModalFacility.name}'s contact ({bookingModalFacility.whatsappNumber || bookingModalFacility.phone}).
                  </p>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setBookingModalFacility(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm active:scale-95 transition"
                >
                  Submit Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCTOR / FACILITY MANAGER SCHEDULING MODAL */}
      {schedulingBooking && (
        <div 
          onClick={() => setSchedulingBooking(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-black text-slate-900">Schedule Patient Booking</h3>
              </div>
              <button 
                onClick={() => setSchedulingBooking(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
              <p><span className="font-semibold text-slate-900">Patient:</span> {schedulingBooking.patientName} ({schedulingBooking.patientPhone})</p>
              <p><span className="font-semibold text-slate-900">Facility:</span> {schedulingBooking.facilityName}</p>
              <p><span className="font-semibold text-slate-900">Reason:</span> {schedulingBooking.reasonCategory} {schedulingBooking.otherReasonSpecify ? `(${schedulingBooking.otherReasonSpecify})` : ''}</p>
              {schedulingBooking.notes && <p className="text-slate-500 italic">"{schedulingBooking.notes}"</p>}
            </div>

            <form onSubmit={handleConfirmScheduleSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Confirmed Scheduled Date *</label>
                <input
                  required
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Confirmed Scheduled Time *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. 10:30 AM"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Doctor / Facility Scheduling Notes</label>
                <input
                  type="text"
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="p-3 bg-teal-50 rounded-2xl text-[11px] text-teal-800">
                This will update the appointment status to Confirmed. The user will see this scheduled date in their account on any device they log into.
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSchedulingBooking(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm"
                >
                  Confirm &amp; Dispatch Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
