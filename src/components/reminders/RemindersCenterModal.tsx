import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  calculateActiveReminders, 
  HealthReminder, 
  ReminderType, 
  playReminderChime, 
  requestNotificationPermission, 
  sendBrowserNotification 
} from '../../lib/remindersEngine';
import { generateWhatsAppLink, formatZimbabweWhatsAppNumber } from '../../lib/whatsappGateway';
import { 
  Bell, 
  Pill, 
  Activity, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  X, 
  Share2, 
  Check, 
  Sparkles, 
  MessageSquare, 
  ExternalLink,
  ChevronRight,
  Flame,
  ShieldAlert,
  Smartphone,
  Send,
  Zap,
  CheckCircle
} from 'lucide-react';

interface RemindersCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const RemindersCenterModal: React.FC<RemindersCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const medications = useAppStore(s => s.medications);
  const medicationLogs = useAppStore(s => s.medicationLogs);
  const appointments = useAppStore(s => s.appointments);
  const carePlan = useAppStore(s => s.carePlan);
  const userProfile = useAppStore(s => s.userProfile);
  const markMedicationTaken = useAppStore(s => s.markMedicationTaken);
  const toggleCareTask = useAppStore(s => s.toggleCareTask);
  const showToast = useAppStore(s => s.showToast);
  const toggleWhatsAppOptOut = useAppStore(s => s.toggleWhatsAppOptOut);
  const unsubscribeAllAlerts = useAppStore(s => s.unsubscribeAllAlerts);

  // Auto WhatsApp Trigger Store Bindings
  const autoWhatsAppTriggerEnabled = useAppStore(s => s.autoWhatsAppTriggerEnabled);
  const autoWhatsAppNumber = useAppStore(s => s.autoWhatsAppNumber);
  const setAutoWhatsAppTriggerEnabled = useAppStore(s => s.setAutoWhatsAppTriggerEnabled);
  const setAutoWhatsAppNumber = useAppStore(s => s.setAutoWhatsAppNumber);
  const fireAutoWhatsAppReminder = useAppStore(s => s.fireAutoWhatsAppReminder);
  const whatsappNotifications = useAppStore(s => s.whatsappNotifications);

  // Read status tracking & red counter clearing
  const readNotificationIds = useAppStore(s => s.readNotificationIds || []);
  const markNotificationAsRead = useAppStore(s => s.markNotificationAsRead);
  const markAllNotificationsAsRead = useAppStore(s => s.markAllNotificationsAsRead);
  const clearNotificationBadge = useAppStore(s => s.clearNotificationBadge);

  const [activeTab, setActiveTab] = useState<'all' | ReminderType | 'whatsapp_auto'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const [phoneInput, setPhoneInput] = useState(autoWhatsAppNumber || userProfile.phoneNumber || '+263772824132');

  if (!isOpen) return null;

  const allReminders = calculateActiveReminders(
    medications,
    medicationLogs,
    appointments,
    carePlan?.tasks || []
  );

  const filteredReminders = activeTab === 'all'
    ? allReminders
    : activeTab === 'whatsapp_auto'
    ? []
    : allReminders.filter(r => r.type === activeTab);

  const dueNowCount = allReminders.filter(r => r.dueStatus === 'due_now' || r.dueStatus === 'overdue').length;

  const handleAdministerMedication = (medId: string, scheduledTime: string, medName: string) => {
    markMedicationTaken(medId, scheduledTime);
    if (soundEnabled) playReminderChime();
    showToast(`Dose recorded for ${medName}. Great job!`, 'success');
  };

  const handleCompleteTask = (taskId: string, title: string) => {
    toggleCareTask(taskId);
    if (soundEnabled) playReminderChime();
    showToast(`Marked "${title}" as completed`, 'success');
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
    if (granted) {
      sendBrowserNotification('Comfort Medi+ Notifications Active', 'You will receive reminders for scheduled medications and tasks.');
      showToast('Browser notifications enabled successfully!', 'success');
    } else {
      showToast('Notification permission was not granted by browser settings', 'warning');
    }
  };

  const handleSendWhatsAppReminder = (r: HealthReminder) => {
    fireAutoWhatsAppReminder(r, true);
    if (soundEnabled) playReminderChime();
    showToast(`Dispatched WhatsApp DM reminder for ${r.title}`, 'success');
  };

  const handleSavePhone = () => {
    const clean = phoneInput.trim();
    if (!clean) {
      showToast('Please enter a valid phone number', 'warning');
      return;
    }
    setAutoWhatsAppNumber(clean);
  };

  const handleTestAutoFire = (type: ReminderType) => {
    let mockReminder: HealthReminder;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (type === 'medication') {
      const firstMed = medications[0];
      mockReminder = {
        id: `test-med-${Date.now()}`,
        type: 'medication',
        title: firstMed ? `Administer ${firstMed.name} (${firstMed.strength})` : 'Administer Amoxicillin (500mg)',
        subtitle: firstMed ? `${firstMed.dosage} • ${firstMed.instructions}` : '1 capsule • Take with water after breakfast',
        time: nowStr,
        targetTimeFormatted: `Today at ${nowStr}`,
        dueStatus: 'due_now',
        urgency: 'high',
        metadata: {
          dosage: firstMed?.dosage || '1 Capsule',
          instructions: firstMed?.instructions || 'Take with water after breakfast',
          remainingUnits: firstMed?.remainingUnits ?? 28
        },
        actionLabel: 'Take Dose',
        isCompleted: false
      };
    } else if (type === 'exercise') {
      mockReminder = {
        id: `test-ex-${Date.now()}`,
        type: 'exercise',
        title: 'Morning Cardiovascular & Joint Mobility Routine',
        subtitle: '15-minute gentle mobility walk and stretching session',
        time: nowStr,
        targetTimeFormatted: `Today at ${nowStr}`,
        dueStatus: 'due_now',
        urgency: 'medium',
        metadata: {
          durationMinutes: 15,
          guidance: 'Maintain steady rhythmic breathing and drink plenty of water.'
        },
        actionLabel: 'Mark Exercise Done',
        isCompleted: false
      };
    } else if (type === 'appointment') {
      const firstApt = appointments[0];
      mockReminder = {
        id: `test-apt-${Date.now()}`,
        type: 'appointment',
        title: firstApt ? `Consultation at ${firstApt.facilityName}` : 'Cardiology Consultation at Parirenyatwa Hospital',
        subtitle: firstApt ? `With ${firstApt.providerName} • ${firstApt.reason}` : 'With Dr. Munyaradzi Moyo • Routine Blood Pressure Checkup',
        time: nowStr,
        targetTimeFormatted: `Today at ${nowStr}`,
        dueStatus: 'due_now',
        urgency: 'high',
        metadata: {
          facilityName: firstApt?.facilityName || 'Parirenyatwa General Hospital',
          doctorName: firstApt?.providerName || 'Dr. Munyaradzi Moyo'
        },
        actionLabel: 'View Details',
        isCompleted: false
      };
    } else {
      mockReminder = {
        id: `test-task-${Date.now()}`,
        type: 'task',
        title: 'Blood Pressure & Hydration Check',
        subtitle: 'Measure resting blood pressure and drink 500ml water',
        time: nowStr,
        targetTimeFormatted: `Today at ${nowStr}`,
        dueStatus: 'due_now',
        urgency: 'high',
        metadata: {
          category: 'Vitals & Hydration'
        },
        actionLabel: 'Mark Task Complete',
        isCompleted: false
      };
    }

    fireAutoWhatsAppReminder(mockReminder, true);
    if (soundEnabled) playReminderChime();
    showToast(`🚀 Auto-Fired WhatsApp DM for ${mockReminder.title}!`, 'success');
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Device & Clinical Status Bar */}
        <div className="bg-[#051320] text-teal-300 px-4 py-1.5 flex items-center justify-between text-[11px] font-black tracking-wider uppercase border-b border-teal-500/20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="font-mono">STATUS BAR: NOTIFICATION &amp; ADHERENCE CENTER</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-teal-400/80">
            <span>DEVICE TIME: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Modal Header */}
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
              <Bell className="w-5 h-5 text-teal-400 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest text-teal-300 uppercase">
                  Health &amp; Clinical Reminders
                </span>
                {dueNowCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {dueNowCount} Due Now
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Task, Medication, Exercise &amp; Appointment Alerts
              </h2>
            </div>
          </div>

          {/* Quick Audio, Notification Controls & Clear Badge Action */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10 text-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  if (!soundEnabled) playReminderChime();
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition ${
                  soundEnabled ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'bg-white/5 text-slate-400'
                }`}
                title="Toggle Sound Chime"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{soundEnabled ? 'Audio Chime On' : 'Muted'}</span>
              </button>

              <button
                onClick={playReminderChime}
                className="text-[11px] text-teal-300/80 hover:text-teal-200 underline"
              >
                Test Sound
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  markAllNotificationsAsRead();
                  showToast('All notifications marked as read. Red counter cleared!', 'success');
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/30 font-bold transition text-[11px]"
                title="Mark all notifications as read and reset notification counter"
              >
                <Check className="w-3.5 h-3.5 text-teal-300" />
                <span>Clear Red Badge (Mark Read)</span>
              </button>

              {!notificationEnabled && (
                <button
                  onClick={handleEnableNotifications}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold hover:bg-amber-500/30 transition text-[11px]"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Enable Push Alerts</span>
                </button>
              )}
            </div>
          </div>

          {/* Type Tabs */}
          <div className="mt-4 flex rounded-xl bg-black/30 p-1 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                activeTab === 'all' ? 'bg-white text-[#0a2540] shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              All Alerts ({allReminders.length})
            </button>
            <button
              onClick={() => setActiveTab('medication')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === 'medication' ? 'bg-white text-[#0a2540] shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Pill className="w-3.5 h-3.5 text-teal-500" />
              <span>Medications ({allReminders.filter(r => r.type === 'medication').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('exercise')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === 'exercise' ? 'bg-white text-[#0a2540] shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>Exercise ({allReminders.filter(r => r.type === 'exercise').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('appointment')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === 'appointment' ? 'bg-white text-[#0a2540] shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Appointments ({allReminders.filter(r => r.type === 'appointment').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('task')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === 'task' ? 'bg-white text-[#0a2540] shadow' : 'text-slate-300 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Care Tasks ({allReminders.filter(r => r.type === 'task').length})</span>
            </button>

            <button
              onClick={() => setActiveTab('whatsapp_auto')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === 'whatsapp_auto' 
                  ? 'bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-400/20' 
                  : 'text-emerald-300 hover:text-white bg-emerald-500/10 border border-emerald-500/30'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span>Auto WhatsApp DM ({whatsappNotifications.length})</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block ml-0.5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Reminders List or Auto WhatsApp Settings */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
          {activeTab === 'whatsapp_auto' ? (
            <div className="space-y-5">
              {/* Engine Status Banner */}
              <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[#0a2540] via-teal-950 to-emerald-950 text-white border border-emerald-500/30 shadow-sm relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black shrink-0 shadow-lg shadow-emerald-500/30">
                      <Zap className="w-6 h-6 text-slate-950 fill-slate-950" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                          Automated Delivery Engine
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          autoWhatsAppTriggerEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {autoWhatsAppTriggerEnabled ? '● Engine Running & Detecting' : 'Paused'}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white">
                        Auto WhatsApp Direct Messaging (DM) Trigger
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 max-w-xl">
                        The Comfort Medi+ scheduler detects all medication timelines, exercise intervals, appointments, and care tasks, and auto-fires formatted reminder messages directly to the user's WhatsApp DM without manual user clicking.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => setAutoWhatsAppTriggerEnabled(!autoWhatsAppTriggerEnabled)}
                      className={`px-4 py-2 rounded-xl font-black text-xs transition shadow-sm ${
                        autoWhatsAppTriggerEnabled
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {autoWhatsAppTriggerEnabled ? 'Auto-Trigger Active' : 'Enable Auto-Trigger'}
                    </button>
                  </div>
                </div>

                {/* Recipient Phone Configuration */}
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-1">
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300 font-medium">WhatsApp Recipient Number:</span>
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+263 77 282 4132"
                      className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/20 text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-400 flex-1 max-w-xs"
                    />
                    <button
                      onClick={handleSavePhone}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition"
                    >
                      Save Target
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Formatted: {formatZimbabweWhatsAppNumber(phoneInput)}
                  </span>
                </div>
              </div>

              {/* Instant Test Buttons */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-teal-600" />
                      Instant Auto-Fire Test Triggers
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Test automated WhatsApp DM message dispatch for each category:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                  <button
                    onClick={() => handleTestAutoFire('medication')}
                    className="p-3 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100/80 text-left transition flex flex-col justify-between group"
                  >
                    <div className="flex items-center gap-2 text-teal-800 font-bold text-xs mb-1">
                      <Pill className="w-4 h-4 text-teal-600" />
                      <span>Medication Dose</span>
                    </div>
                    <span className="text-[10px] text-teal-600">Auto-fire dose reminder with dosage &amp; water prompt</span>
                    <span className="mt-2 text-[10px] font-bold text-teal-700 underline group-hover:text-teal-900">Fire WhatsApp DM →</span>
                  </button>

                  <button
                    onClick={() => handleTestAutoFire('exercise')}
                    className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 text-left transition flex flex-col justify-between group"
                  >
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <span>Exercise Routine</span>
                    </div>
                    <span className="text-[10px] text-emerald-600">Auto-fire mobility &amp; physical therapy reminder</span>
                    <span className="mt-2 text-[10px] font-bold text-emerald-700 underline group-hover:text-emerald-900">Fire WhatsApp DM →</span>
                  </button>

                  <button
                    onClick={() => handleTestAutoFire('appointment')}
                    className="p-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100/80 text-left transition flex flex-col justify-between group"
                  >
                    <div className="flex items-center gap-2 text-blue-800 font-bold text-xs mb-1">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Hospital Appointment</span>
                    </div>
                    <span className="text-[10px] text-blue-600">Auto-fire consultation, facility &amp; doctor alert</span>
                    <span className="mt-2 text-[10px] font-bold text-blue-700 underline group-hover:text-blue-900">Fire WhatsApp DM →</span>
                  </button>

                  <button
                    onClick={() => handleTestAutoFire('task')}
                    className="p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100/80 text-left transition flex flex-col justify-between group"
                  >
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-1">
                      <CheckCircle2 className="w-4 h-4 text-amber-600" />
                      <span>Care Plan Task</span>
                    </div>
                    <span className="text-[10px] text-amber-600">Auto-fire hydration, vitals or dressing task</span>
                    <span className="mt-2 text-[10px] font-bold text-amber-700 underline group-hover:text-amber-900">Fire WhatsApp DM →</span>
                  </button>
                </div>
              </div>

              {/* Dispatched WhatsApp Notification History */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      Auto-Dispatched WhatsApp Reminders Log ({whatsappNotifications.length})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Live audit stream of all notifications sent directly to WhatsApp
                    </p>
                  </div>
                </div>

                {whatsappNotifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No WhatsApp reminders have been dispatched yet in this session. The engine checks continuously and triggers when scheduled items arrive!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto space-y-2">
                    {whatsappNotifications.map((notif) => (
                      <div key={notif.id} className="pt-2 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              notif.type === 'MEDICATION' ? 'bg-teal-100 text-teal-800' :
                              notif.type === 'EXERCISE' ? 'bg-emerald-100 text-emerald-800' :
                              notif.type === 'APPOINTMENT' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {notif.type.replace('_', ' ')}
                            </span>
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {notif.reminderTitle || 'Auto Health Reminder'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              To: {notif.recipient}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Auto-Dispatched
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                            {notif.message.split('\n')[0]}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            Sent at: {new Date(notif.sentAt).toLocaleTimeString()} ({new Date(notif.sentAt).toLocaleDateString()})
                          </span>
                        </div>

                        <a
                          href={notif.deepLinkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 shrink-0 border border-emerald-200 transition"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>Open Chat</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800">All Reminders Up to Date!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No pending medications, appointments, or care tasks for this category right now. You are maintaining excellent adherence!
              </p>
            </div>
          ) : (
            filteredReminders.map((reminder) => {
              const isMissed = reminder.isMissed;
              const isDueNow = reminder.dueStatus === 'due_now';
              const isOverdue = reminder.dueStatus === 'overdue';
              const isCompleted = reminder.dueStatus === 'completed';
              const isUnread = !readNotificationIds.includes(reminder.id);

              return (
                <div
                  key={reminder.id}
                  onClick={() => {
                    if (isUnread) markNotificationAsRead(reminder.id);
                  }}
                  className={`rounded-2xl border transition shadow-sm overflow-hidden cursor-pointer ${
                    isMissed
                      ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-400/20'
                      : isDueNow
                      ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30'
                      : isOverdue
                      ? 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-400/20'
                      : isCompleted
                      ? 'bg-slate-100/60 border-slate-200 opacity-75'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Status Bar for every notification */}
                  <div className={`px-3 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wider border-b ${
                    isMissed
                      ? 'bg-rose-600 text-white border-rose-700'
                      : isDueNow
                      ? 'bg-amber-500 text-amber-950 border-amber-600'
                      : isOverdue
                      ? 'bg-rose-500 text-white border-rose-600'
                      : isCompleted
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-teal-700 text-teal-100 border-teal-800'
                  }`}>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className={`w-2 h-2 rounded-full ${
                        isMissed || isDueNow ? 'bg-white animate-ping' : 'bg-white/80'
                      }`} />
                      <span>
                        {isMissed 
                          ? `STATUS BAR: MISSED • OVERDUE BY ~${reminder.missedMinutesAgo || 30}M` 
                          : isDueNow 
                          ? 'STATUS BAR: DUE NOW • ACTION REQUIRED' 
                          : isOverdue 
                          ? 'STATUS BAR: OVERDUE • PAST SCHEDULED TIME' 
                          : isCompleted 
                          ? 'STATUS BAR: COMPLETED & LOGGED' 
                          : 'STATUS BAR: UPCOMING SCHEDULED'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isUnread && (
                        <span className="bg-white text-slate-900 px-1.5 py-0.2 rounded-full text-[9px] font-black tracking-normal">
                          ● UNREAD
                        </span>
                      )}
                      <span className="font-mono text-[9px] opacity-90">
                        {reminder.targetTimeFormatted}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex items-start justify-between gap-3">
                    {/* Left Icon & Details */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        reminder.type === 'medication'
                          ? 'bg-teal-600 text-white'
                          : reminder.type === 'exercise'
                          ? 'bg-emerald-600 text-white'
                          : reminder.type === 'appointment'
                          ? 'bg-blue-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}>
                        {reminder.type === 'medication' && <Pill className="w-5 h-5" />}
                        {reminder.type === 'exercise' && <Activity className="w-5 h-5" />}
                        {reminder.type === 'appointment' && <Calendar className="w-5 h-5" />}
                        {reminder.type === 'task' && <CheckCircle2 className="w-5 h-5" />}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-sm font-black ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {reminder.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isMissed
                              ? 'bg-rose-200 text-rose-900 font-bold'
                              : isDueNow
                              ? 'bg-amber-200 text-amber-900 font-bold animate-pulse'
                              : isOverdue
                              ? 'bg-rose-200 text-rose-900'
                              : isCompleted
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-teal-100 text-teal-800'
                          }`}>
                            {isMissed ? 'Missed' : isDueNow ? 'Due Now' : isOverdue ? 'Overdue' : isCompleted ? 'Completed' : 'Upcoming'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-snug">
                          {reminder.subtitle}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-teal-600" />
                            <span>{reminder.targetTimeFormatted}</span>
                          </span>

                          {reminder.metadata.guidance && (
                            <span className="text-[10px] text-slate-400 italic truncate max-w-xs">
                              💡 {reminder.metadata.guidance}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      {reminder.type === 'medication' && (
                        <button
                          disabled={isCompleted}
                          onClick={() => {
                            handleAdministerMedication(
                              reminder.metadata.medicationId!,
                              reminder.time,
                              reminder.title
                            );
                            markNotificationAsRead(reminder.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm ${
                            isCompleted
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-teal-600 hover:bg-teal-700 text-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isCompleted ? 'Administered' : 'Take Dose'}</span>
                        </button>
                      )}

                      {reminder.type === 'exercise' && (
                        <button
                          disabled={isCompleted}
                          onClick={() => {
                            if (reminder.metadata.taskId) {
                              handleCompleteTask(reminder.metadata.taskId, reminder.title);
                            } else {
                              if (soundEnabled) playReminderChime();
                              showToast('Logged daily physical activity session!', 'success');
                            }
                            markNotificationAsRead(reminder.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm ${
                            isCompleted
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isCompleted ? 'Done' : 'Mark Done'}</span>
                        </button>
                      )}

                      {reminder.type === 'task' && (
                        <button
                          disabled={isCompleted}
                          onClick={() => {
                            handleCompleteTask(reminder.metadata.taskId!, reminder.title);
                            markNotificationAsRead(reminder.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm ${
                            isCompleted
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-amber-600 hover:bg-amber-700 text-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isCompleted ? 'Completed' : 'Done'}</span>
                        </button>
                      )}

                      {reminder.type === 'appointment' && (
                        <button
                          onClick={() => {
                            markNotificationAsRead(reminder.id);
                            onClose();
                            onNavigateTab?.('appointments');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition active:scale-95 shadow-sm"
                        >
                          <span>View Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* WhatsApp Dispatch Button */}
                      <button
                        onClick={() => {
                          handleSendWhatsAppReminder(reminder);
                          markNotificationAsRead(reminder.id);
                        }}
                        className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 pt-0.5"
                        title="Send prefilled WhatsApp reminder"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        <span>WhatsApp Alert</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>Reminders check continuously every 30s</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
