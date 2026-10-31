import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { calculateActiveReminders, playReminderChime } from '../../lib/remindersEngine';
import { 
  AlertOctagon, 
  Pill, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Check, 
  X, 
  BellRing, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface MissedRemindersAlertModalProps {
  onOpenRemindersCenter?: () => void;
}

export const MissedRemindersAlertModal: React.FC<MissedRemindersAlertModalProps> = ({
  onOpenRemindersCenter
}) => {
  const firebaseUser = useAppStore(s => s.firebaseUser);
  const medications = useAppStore(s => s.medications);
  const medicationLogs = useAppStore(s => s.medicationLogs);
  const appointments = useAppStore(s => s.appointments);
  const carePlan = useAppStore(s => s.carePlan);
  const markMedicationTaken = useAppStore(s => s.markMedicationTaken);
  const toggleCareTask = useAppStore(s => s.toggleCareTask);
  const showToast = useAppStore(s => s.showToast);

  const dismissedMissedAlertIds = useAppStore(s => s.dismissedMissedAlertIds || []);
  const dailyHandledReminderKeys = useAppStore(s => s.dailyHandledReminderKeys || []);
  const lastMissedAlertDismissedDate = useAppStore(s => s.lastMissedAlertDismissedDate);
  const handleDailyReminderClick = useAppStore(s => s.handleDailyReminderClick);
  const dismissMissedAlert = useAppStore(s => s.dismissMissedAlert);
  const markNotificationAsRead = useAppStore(s => s.markNotificationAsRead);
  const markAllNotificationsAsRead = useAppStore(s => s.markAllNotificationsAsRead);

  const todayStr = new Date().toISOString().split('T')[0];

  // If the user already dismissed or cleared missed alerts today, do not repeatedly show on app open
  if (!firebaseUser || lastMissedAlertDismissedDate === todayStr) return null;

  // Compute active reminders using current device time and daily handled items
  const allReminders = calculateActiveReminders(
    medications,
    medicationLogs,
    appointments,
    carePlan?.tasks || [],
    dailyHandledReminderKeys
  );

  // Find missed reminders not yet dismissed or handled for today
  const missedList = allReminders.filter(
    r => r.isMissed && !r.isCompleted && !dismissedMissedAlertIds.includes(r.id)
  );

  // Only show when authenticated and there are unrecorded missed tasks
  if (missedList.length === 0) return null;

  const handleMarkDone = (reminder: any) => {
    if (reminder.type === 'medication' && reminder.metadata?.medicationId) {
      markMedicationTaken(reminder.metadata.medicationId, reminder.time);
    } else if (reminder.type === 'task' && reminder.metadata?.taskId) {
      toggleCareTask(reminder.metadata.taskId);
    } else if (reminder.type === 'exercise' && reminder.metadata?.taskId) {
      toggleCareTask(reminder.metadata.taskId);
    } else {
      showToast(`Acknowledged missed reminder: ${reminder.title}`, 'info');
    }

    // Reset reminder for today and wait 24h for next cycle
    handleDailyReminderClick(reminder.id);
    markNotificationAsRead(reminder.id);
    dismissMissedAlert(reminder.id);
    playReminderChime();
    showToast(`Marked "${reminder.title}" as completed. Reset for 24 hrs!`, 'success');
  };

  const handleMarkAllDone = () => {
    missedList.forEach(r => {
      if (r.type === 'medication' && r.metadata?.medicationId) {
        markMedicationTaken(r.metadata.medicationId, r.time);
      } else if (r.metadata?.taskId) {
        toggleCareTask(r.metadata.taskId);
      }
      handleDailyReminderClick(r.id);
      dismissMissedAlert(r.id);
    });

    useAppStore.setState({ lastMissedAlertDismissedDate: todayStr });
    markAllNotificationsAsRead();
    playReminderChime();
    showToast(`All ${missedList.length} missed reminders marked as done! Reset for today.`, 'success');
  };

  const handleDismissAll = () => {
    missedList.forEach(r => {
      handleDailyReminderClick(r.id);
      dismissMissedAlert(r.id);
    });
    useAppStore.setState({ lastMissedAlertDismissedDate: todayStr });
    showToast('Missed reminders dismissed for today. Waiting 24h for next cycle.', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-rose-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Device Status Bar Header */}
        <div className="bg-rose-600 text-white px-4 py-1.5 flex items-center justify-between text-[11px] font-black tracking-wider uppercase shadow-inner">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span className="font-mono">STATUS BAR: MISSED TASK &amp; DOSAGE ALERT</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] opacity-90">
            <span>DEVICE TIME: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Modal Banner */}
        <div className="p-5 sm:p-6 bg-gradient-to-br from-rose-50 via-white to-amber-50/40 border-b border-rose-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 shrink-0">
                <BellRing className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                    Adherence Recovery Alert
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {missedList.length} Missed {missedList.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  You Have Missed Scheduled Reminders
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  The system detected reminders whose scheduled device time has passed without being recorded. Mark them as done below to update your adherence record and clear the notification red badge.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismissAll}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
              title="Close Missed Alert"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List of Missed Reminders with Status Bars */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/60">
          {missedList.map(reminder => {
            const minutesLate = reminder.missedMinutesAgo || 30;

            return (
              <div
                key={reminder.id}
                className="rounded-2xl border border-rose-300 bg-white shadow-sm overflow-hidden transition hover:shadow-md"
              >
                {/* Visual Status Bar on each Notification */}
                <div className="bg-rose-100 text-rose-900 px-3 py-1 flex items-center justify-between text-[10px] font-black tracking-wide border-b border-rose-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    <span>STATUS BAR: MISSED • OVERDUE BY ~{minutesLate} MINS</span>
                  </div>
                  <span className="font-mono text-rose-700">Scheduled: {reminder.time}</span>
                </div>

                <div className="p-3.5 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                      {reminder.type === 'medication' && <Pill className="w-5 h-5" />}
                      {reminder.type === 'exercise' && <Activity className="w-5 h-5" />}
                      {reminder.type === 'task' && <CheckCircle2 className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {reminder.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                        {reminder.subtitle}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span>Target: {reminder.targetTimeFormatted}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleMarkDone(reminder)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark as Done</span>
                    </button>
                    <button
                      onClick={() => dismissMissedAlert(reminder.id)}
                      className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-medium text-xs transition"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Marking tasks resets the red badge and updates adherence score</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {missedList.length > 1 && (
              <button
                onClick={handleMarkAllDone}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition"
              >
                Mark All ({missedList.length}) as Done
              </button>
            )}
            {onOpenRemindersCenter && (
              <button
                onClick={() => {
                  handleDismissAll();
                  onOpenRemindersCenter();
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 transition"
              >
                <span>Notification Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
