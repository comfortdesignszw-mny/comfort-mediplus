import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getTranslation } from '../../lib/translations';
import { TabKey } from '../layout/BottomNav';
import { generateWhatsAppLink } from '../../lib/whatsappGateway';
import { RemindersDashboardBanner } from '../reminders/RemindersDashboardBanner';
import { RemindersCenterModal } from '../reminders/RemindersCenterModal';
import { 
  Heart, 
  Pill, 
  Calendar, 
  Activity, 
  PhoneCall, 
  Check, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Flame, 
  ShieldAlert, 
  Bot, 
  PlusCircle,
  MessageSquare,
  X,
  CalendarCheck, 
  CheckCircle2, 
  ListTodo, 
  Bell,
  Building2,
  Stethoscope
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: TabKey) => void;
  onOpenQuickVitals: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab, onOpenQuickVitals }) => {
  const language = useAppStore(s => s.language);
  const userProfile = useAppStore(s => s.userProfile);
  const currentUserRole = useAppStore(s => s.currentUserRole);
  const setAppointmentActiveSubTab = useAppStore(s => s.setAppointmentActiveSubTab);
  const medications = useAppStore(s => s.medications);
  const adherenceStreak = useAppStore(s => s.adherenceStreak);
  const markMedicationTaken = useAppStore(s => s.markMedicationTaken);
  const snoozeMedication = useAppStore(s => s.snoozeMedication);
  const skipMedication = useAppStore(s => s.skipMedication);
  const appointments = useAppStore(s => s.appointments);
  const carePlan = useAppStore(s => s.carePlan);
  const vitals = useAppStore(s => s.vitals);
  const emergencyContacts = useAppStore(s => s.emergencyContacts);
  const allergies = useAppStore(s => s.allergies);
  const chronicConditions = useAppStore(s => s.chronicConditions);

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);

  const t = getTranslation(language);

  const handleOpenFacilityBooking = () => {
    setAppointmentActiveSubTab('facility_directory');
    onNavigateTab('appointments');
  };

  // Latest vitals
  const latestVital = vitals[0];

  // Next upcoming medication
  const activeMeds = medications.filter(m => m.active);
  const lowSupplyMeds = medications.filter(m => m.remainingUnits <= m.refillThreshold);

  // Next appointment
  const nextAppointment = appointments.find(a => a.status === 'confirmed' || a.status === 'booked');

  // Auto-detected Appointment and Task counts
  const scheduledAppointmentsCount = appointments.filter(a => a.status === 'confirmed' || a.status === 'booked').length;
  const successfulAppointmentsCount = appointments.filter(a => a.status === 'completed').length;
  const totalTasksCount = carePlan?.tasks?.length || 0;
  const completedTasksCount = carePlan?.tasks?.filter(t => t.completed)?.length || 0;
  const pendingTasksCount = totalTasksCount - completedTasksCount;

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-150">
      
      {/* Role Banner if not plain patient */}
      {currentUserRole !== 'patient' && (
        <div className="rounded-2xl bg-gradient-to-r from-teal-900 to-slate-900 text-white p-3.5 flex items-center justify-between text-xs border border-teal-500/30 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            <span className="font-bold uppercase tracking-wider text-teal-300">
              {currentUserRole === 'caregiver' ? 'Caregiver Mode' : currentUserRole === 'doctor' ? 'Clinical Doctor View' : currentUserRole === 'pharmacist' ? 'Clinical Pharmacist View' : 'Facility Admin View'}
            </span>
          </div>
          <span className="text-[11px] text-slate-300">Viewing Patient: {userProfile.fullName}</span>
        </div>
      )}

      {/* Patient Header Card - Clean Hero Section */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0a2540] via-[#0f3458] to-[#0d9488] text-white p-6 shadow-xl relative overflow-hidden">
        {/* Abstract medical graphic lines */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Heart className="w-48 h-48 -mr-10 -mb-10 text-white" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-teal-200 uppercase tracking-wider block">
              Personal Health and Vitals Overview
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Clinical Health Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
            {/* Medical Facility Booking Button */}
            <button
              onClick={handleOpenFacilityBooking}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition"
              title="Book Medical Facility Appointment"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Medical Facility Booking</span>
            </button>

            {/* Health Reminders Quick Trigger */}
            <button
              onClick={() => setShowRemindersModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-200 text-xs font-bold active:scale-95 transition"
              title="Open Reminders Center"
            >
              <Bell className="w-3.5 h-3.5 text-teal-300" />
              <span>Reminders</span>
            </button>

            {/* Emergency SOS Trigger */}
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg shadow-rose-600/30 active:scale-95 transition"
              title="Open Emergency Contacts"
            >
              <PhoneCall className="w-4 h-4 animate-pulse" />
              <span>SOS Emergency</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Reminders Banner (Medication Administer, Exercise, Care Tasks & Appointments) */}
      <RemindersDashboardBanner 
        onOpenRemindersModal={() => setShowRemindersModal(true)}
        onNavigateTab={onNavigateTab}
      />

      {/* Key Healthcare Metrics: Scheduled Appointments, Successful Appointments & HomeCare Tasks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Metric 1: Scheduled Appointments */}
        <div 
          onClick={() => onNavigateTab('appointments')}
          className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5 hover:border-teal-500/50 hover:shadow-md cursor-pointer transition active:scale-98"
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-6 h-6 text-teal-600" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {scheduledAppointmentsCount}
            </p>
            <p className="text-xs font-bold text-slate-700 truncate">Appointments Scheduled</p>
            <p className="text-[10px] text-slate-400">Auto-detected from Appointments</p>
          </div>
        </div>

        {/* Metric 2: Successful Appointments */}
        <div 
          onClick={() => onNavigateTab('appointments')}
          className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5 hover:border-emerald-500/50 hover:shadow-md cursor-pointer transition active:scale-98"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-black text-emerald-700 leading-tight">
              {successfulAppointmentsCount}
            </p>
            <p className="text-xs font-bold text-slate-700 truncate">Successful Appointments</p>
            <p className="text-[10px] text-slate-400">Completed consultations</p>
          </div>
        </div>

        {/* Metric 3: HomeCare Tasks */}
        <div 
          onClick={() => onNavigateTab('homecare')}
          className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5 hover:border-cyan-500/50 hover:shadow-md cursor-pointer transition active:scale-98"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center shrink-0">
            <ListTodo className="w-6 h-6 text-cyan-600" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-black text-slate-900 leading-tight">
              {totalTasksCount} <span className="text-xs font-bold text-slate-500">Tasks</span>
            </p>
            <p className="text-xs font-bold text-slate-700 truncate">HomeCare Section</p>
            <p className="text-[10px] text-slate-400">{completedTasksCount} done • {pendingTasksCount} remaining</p>
          </div>
        </div>
      </div>

      {/* Adherence & Streak Counter Banner */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <p className="text-xl font-black text-slate-900 leading-tight">
              {adherenceStreak} <span className="text-xs font-bold text-slate-500">Days</span>
            </p>
            <p className="text-xs font-medium text-slate-500">{t.streak}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0 font-black text-sm">
            96%
          </div>
          <div>
            <p className="text-xl font-black text-teal-800 leading-tight">
              96%
            </p>
            <p className="text-xs font-medium text-slate-500">{t.adherenceRate}</p>
          </div>
        </div>
      </div>

      {/* Low Medication Supply Alert if applicable */}
      {lowSupplyMeds.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                {t.lowStockAlert}
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {lowSupplyMeds.map(m => `${m.name} (${m.remainingUnits} doses left)`).join(', ')}. WhatsApp alert scheduled for refill.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('medications')}
              className="text-xs font-bold text-amber-800 underline shrink-0 hover:text-amber-950"
            >
              Refill
            </button>
          </div>
        </div>
      )}

      {/* Today's Medications Checklist */}
      <div className="rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t.todayMedications}</h3>
              <p className="text-[11px] text-slate-500">Scheduled for today</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('medications')}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-0.5"
          >
            <span>Manage All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {activeMeds.slice(0, 3).map((med) => {
            const timeStr = med.scheduledTimes[0] || '08:00';
            return (
              <div
                key={med.id}
                className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-600/10 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{med.name} {med.strength}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-200/70 text-slate-700">
                        {timeStr}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{med.instructions}</p>
                    <p className="text-[11px] text-teal-700 font-medium mt-1">
                      {med.remainingUnits} {t.pillsRemaining}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => snoozeMedication(med.id, 15)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-200/60 text-[11px] font-semibold text-slate-700 transition"
                  >
                    {t.snooze15}
                  </button>
                  <button
                    onClick={() => skipMedication(med.id, timeStr)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-200/60 text-[11px] font-semibold text-slate-700 transition"
                  >
                    {t.skipped}
                  </button>
                  <button
                    onClick={() => markMedicationTaken(med.id, timeStr)}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.takeNow}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Vitals & Appointments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Latest Vitals Card */}
        <div className="rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.quickVitals}</h3>
                  <p className="text-[11px] text-slate-500">Home monitoring records</p>
                </div>
              </div>
              <button
                onClick={onOpenQuickVitals}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t.logVitals}</span>
              </button>
            </div>

            {latestVital ? (
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/60 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">BP (mmHg)</span>
                  <p className="text-base font-black text-slate-900 mt-0.5">
                    {latestVital.systolicBp}/{latestVital.diastolicBp}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold">Normal</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Glucose</span>
                  <p className="text-base font-black text-slate-900 mt-0.5">
                    {latestVital.bloodSugar || '--'} <span className="text-[10px] font-normal">mmol/L</span>
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold">Fasting</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Pulse</span>
                  <p className="text-base font-black text-slate-900 mt-0.5">
                    {latestVital.pulseRate || '--'} <span className="text-[10px] font-normal">bpm</span>
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium">Resting</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No vitals logged yet today.</p>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('homecare')}
            className="mt-3 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-between pt-2 border-t border-slate-100"
          >
            <span>View Home Care & Vitals Trends</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Upcoming Appointment Card */}
        <div className="rounded-3xl bg-white p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Next Clinic Visit</h3>
                  <p className="text-[11px] text-slate-500">Zimbabwe healthcare booking</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('appointments')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800"
              >
                {t.bookAppointment}
              </button>
            </div>

            {nextAppointment ? (
              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200/60">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{nextAppointment.facilityName}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">{nextAppointment.providerName}</p>
                    <p className="text-[11px] text-slate-500 italic mt-1">"{nextAppointment.reason}"</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase">
                    {nextAppointment.status}
                  </span>
                </div>
                <div className="mt-2.5 pt-2 border-t border-blue-200/40 flex items-center gap-3 text-xs font-semibold text-blue-900">
                  <span>📅 {nextAppointment.date}</span>
                  <span>⏰ {nextAppointment.time}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
                No upcoming visits scheduled.
              </div>
            )}
          </div>

          <button
            onClick={handleOpenFacilityBooking}
            className="mt-3 text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center justify-between pt-2 border-t border-slate-100"
          >
            <span>Medical Facilities Directory & Booking (Hospitals, Clinics, Surgeries, Labs)</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* AI Assistant Quick Banner */}
      <div 
        onClick={() => onNavigateTab('ai')}
        className="cursor-pointer rounded-3xl bg-gradient-to-r from-teal-800 via-slate-900 to-[#0a2540] text-white p-5 shadow-lg hover:shadow-xl transition active:scale-[0.99] border border-teal-500/30 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Comfort Medi+ AI Health Assistant</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-teal-400 text-teal-950 uppercase">24/7 Offline Ready</span>
            </h3>
            <p className="text-xs text-slate-200 mt-0.5">
              Ask about medication schedules, blood pressure, first aid, or local clinic advice in English, ChiShona, or IsiNdebele.
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-teal-300 shrink-0" />
      </div>

      {/* EMERGENCY CONTACTS MODAL */}
      {showEmergencyModal && (
        <div 
          onClick={() => setShowEmergencyModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600">
                <PhoneCall className="w-5 h-5" />
                <h3 className="text-base font-black text-slate-900">One-Tap Emergency Contacts</h3>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Tap any number below to immediately trigger an emergency cellular call:
            </p>

            <div className="mt-4 space-y-3">
              {/* National Emergency Numbers */}
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200">
                <span className="text-[10px] font-bold uppercase text-rose-800 tracking-wider">Zimbabwe National Emergencies</span>
                <div className="mt-2 flex gap-2">
                  <a
                    href="tel:999"
                    className="flex-1 py-2 text-center bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                  >
                    Call 999 (General)
                  </a>
                  <a
                    href="tel:112"
                    className="flex-1 py-2 text-center bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                  >
                    Call 112 (Cellular)
                  </a>
                </div>
              </div>

              {/* Personal Emergency Contacts */}
              {emergencyContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{contact.name}</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                        {contact.relationship}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">{contact.phoneNumber}</p>
                    {contact.emergencyNotes && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{contact.emergencyNotes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={generateWhatsAppLink(
                        contact.phoneNumber,
                        `EMERGENCY ALERT: I need urgent medical assistance. Name: ${userProfile.fullName}. Blood Type: ${userProfile.bloodType}. Location: ${userProfile.city}, Zimbabwe. Please contact me immediately.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition"
                      title="Send WhatsApp Emergency Alert"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={`tel:${contact.phoneNumber.replace(/\s+/g, '')}`}
                      className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowEmergencyModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
            >
              Cancel / Close
            </button>
          </div>
        </div>
      )}

      {/* Health & Clinical Reminders Center Modal */}
      <RemindersCenterModal
        isOpen={showRemindersModal}
        onClose={() => setShowRemindersModal(false)}
        onNavigateTab={onNavigateTab}
      />

    </div>
  );
};
