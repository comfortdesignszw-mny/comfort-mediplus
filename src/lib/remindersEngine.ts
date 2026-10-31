import { Medication, MedicationLog, Appointment, CareTask } from '../types';

export type ReminderType = 'medication' | 'exercise' | 'appointment' | 'task';

export type DueStatus = 'due_now' | 'upcoming' | 'overdue' | 'missed' | 'completed';

export interface HealthReminder {
  id: string;
  type: ReminderType;
  title: string;
  subtitle: string;
  time: string; // e.g. "08:00" or "Today 10:30"
  targetTimeFormatted: string;
  dueStatus: DueStatus;
  isMissed?: boolean;
  missedMinutesAgo?: number;
  urgency: 'high' | 'medium' | 'low';
  metadata: {
    medicationId?: string;
    dosage?: string;
    instructions?: string;
    remainingUnits?: number;
    appointmentId?: string;
    facilityName?: string;
    doctorName?: string;
    taskId?: string;
    category?: string;
    durationMinutes?: number;
    guidance?: string;
  };
  actionLabel: string;
  isCompleted: boolean;
}

/**
 * 100% Offline Audio Chime Synthesizer using Web Audio API.
 * Emits a calming, medical-grade double chime.
 */
export function playReminderChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // First note (E5 - 659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.18, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Second harmonious note (A5 - 880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.22, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (e) {
    // Audio autoplay might be suspended until interaction
  }
}

/**
 * Browser Web Notification Requester
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

/**
 * Sends a native device push notification with status bar icon, vibration and wakeup
 */
export async function sendBrowserNotification(
  title: string, 
  body: string,
  options?: {
    tag?: string;
    isMissed?: boolean;
    data?: any;
  }
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      // 1. Try Service Worker showNotification for persistent status bar drawer icon
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png', // Device system status bar icon
            tag: options?.tag || (options?.isMissed ? 'comfortmedi-missed' : 'comfortmedi-reminder'),
            renotify: true, // Wakes up device screen / triggers vibration
            requireInteraction: true, // Keeps in system status bar drawer until acted upon
            vibrate: [200, 100, 200, 100, 200], // Wake-up haptic vibration
            data: options?.data || { url: window.location.href },
          } as any);
          return;
        }
      }

      // 2. Fallback to standard web notification constructor
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: options?.tag || (options?.isMissed ? 'comfortmedi-missed' : 'comfortmedi-reminder'),
        requireInteraction: true,
      } as any);
    } catch {
      // Ignore background notification restrictions
    }
  }
}

/**
 * Core Reminder Computation Engine
 * Aggregates medication schedules, care tasks, exercise routines, and clinical appointments
 */
export function calculateActiveReminders(
  medications: Medication[] = [],
  medicationLogs: MedicationLog[] = [],
  appointments: Appointment[] = [],
  careTasks: CareTask[] = [],
  dailyHandledReminderKeys: string[] = []
): HealthReminder[] {
  const reminders: HealthReminder[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Helper to parse HH:MM into total minutes from midnight
  const parseTimeToMinutes = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    return parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10);
  };

  // Helper to check if a reminder was clicked, marked, or acknowledged today
  const isHandledToday = (id: string): boolean => {
    return dailyHandledReminderKeys.includes(id) ||
           dailyHandledReminderKeys.includes(`${id}_${todayStr}`);
  };

  // 1. MEDICATION ADMINISTER REMINDERS
  medications.filter(m => m.active).forEach(med => {
    (med.scheduledTimes || []).forEach(scheduledTime => {
      const scheduledMinutes = parseTimeToMinutes(scheduledTime);
      const diffMinutes = currentMinutes - scheduledMinutes;
      const reminderId = `med-${med.id}-${scheduledTime}`;

      // Check if already taken today for this scheduled time
      const wasTaken = medicationLogs.some(
        log => log.medicationId === med.id &&
               log.date === todayStr &&
               log.scheduledTime === scheduledTime &&
               log.status === 'taken'
      );

      const handled = wasTaken || isHandledToday(reminderId);

      let dueStatus: DueStatus = 'upcoming';
      let urgency: 'high' | 'medium' | 'low' = 'medium';
      let isMissed = false;
      let missedMinutesAgo = 0;

      if (handled) {
        dueStatus = 'completed';
        urgency = 'low';
        isMissed = false;
      } else if (diffMinutes > 30) {
        // Scheduled time has passed by more than 30 mins and was not taken -> Missed!
        dueStatus = 'missed';
        urgency = 'high';
        isMissed = true;
        missedMinutesAgo = diffMinutes;
      } else if (diffMinutes >= -45 && diffMinutes <= 30) {
        dueStatus = 'due_now';
        urgency = 'high';
      } else {
        dueStatus = 'upcoming';
        urgency = 'medium';
      }

      reminders.push({
        id: reminderId,
        type: 'medication',
        title: isMissed ? `Missed Dose: ${med.name} (${med.strength})` : `Administer ${med.name} (${med.strength})`,
        subtitle: handled
          ? `${med.dosage} • Done for today (Next reminder in 24 hrs)`
          : isMissed 
          ? `⚠️ Missed by ${Math.floor(missedMinutesAgo / 60) > 0 ? `${Math.floor(missedMinutesAgo / 60)}h ` : ''}${missedMinutesAgo % 60}m • ${med.dosage} was due at ${scheduledTime}`
          : `${med.dosage} • ${med.instructions || 'Take as prescribed'}`,
        time: scheduledTime,
        targetTimeFormatted: `Today at ${scheduledTime}`,
        dueStatus,
        isMissed,
        missedMinutesAgo,
        urgency,
        metadata: {
          medicationId: med.id,
          dosage: med.dosage,
          instructions: med.instructions,
          remainingUnits: med.remainingUnits,
        },
        actionLabel: handled ? 'Administered' : isMissed ? 'Take Missed Dose' : 'Mark Administered',
        isCompleted: handled
      });
    });
  });

  // 2. EXERCISE & MOBILITY REMINDERS
  // Filter exercise tasks from careTasks
  const exerciseTasks = careTasks.filter(
    t => t.category === 'exercise' || t.category === 'mobility'
  );

  // If the user has specific exercise tasks
  exerciseTasks.forEach(task => {
    const taskMinutes = parseTimeToMinutes(task.timeOfDay || '10:00');
    const diffMinutes = currentMinutes - taskMinutes;
    const reminderId = `exercise-${task.id}`;
    const handled = task.completed || isHandledToday(reminderId);

    let dueStatus: DueStatus = handled ? 'completed' : 'upcoming';
    let urgency: 'high' | 'medium' | 'low' = 'medium';

    if (!handled) {
      if (diffMinutes > 45) {
        dueStatus = 'overdue';
        urgency = 'medium';
      } else if (diffMinutes >= -30 && diffMinutes <= 45) {
        dueStatus = 'due_now';
        urgency = 'high';
      }
    }

    reminders.push({
      id: reminderId,
      type: 'exercise',
      title: task.title,
      subtitle: handled 
        ? `Target: ${task.timeOfDay || 'Today'} • Completed for today (Next reminder in 24 hrs)` 
        : `Target: ${task.timeOfDay || 'Today'} • Recommended for cardiovascular & joint mobility`,
      time: task.timeOfDay || '10:00',
      targetTimeFormatted: `Today at ${task.timeOfDay || '10:00'}`,
      dueStatus,
      urgency: handled ? 'low' : urgency,
      metadata: {
        taskId: task.id,
        category: task.category,
        durationMinutes: 15,
        guidance: 'Maintain steady breathing, drink water, and stop if you experience pain.'
      },
      actionLabel: handled ? 'Completed' : 'Mark Exercise Done',
      isCompleted: handled
    });
  });

  // Built-in daily wellness mobility reminder if none configured
  if (exerciseTasks.length === 0) {
    const defaultExerciseTime = '09:30';
    const exerciseMinutes = parseTimeToMinutes(defaultExerciseTime);
    const diff = currentMinutes - exerciseMinutes;
    const handled = isHandledToday('default-daily-exercise');
    const dueStatus: DueStatus = handled 
      ? 'completed' 
      : (diff >= -45 && diff <= 120 ? 'due_now' : (diff > 120 ? 'overdue' : 'upcoming'));

    reminders.push({
      id: 'default-daily-exercise',
      type: 'exercise',
      title: 'Daily Mobility & Physical Activity',
      subtitle: handled
        ? 'Completed for today • Next reminder after 24 hrs'
        : '15-minute gentle walk, stretching or prescribed rehabilitation',
      time: defaultExerciseTime,
      targetTimeFormatted: `Today at ${defaultExerciseTime}`,
      dueStatus,
      urgency: handled ? 'low' : 'medium',
      metadata: {
        durationMinutes: 15,
        guidance: 'Light stretching or walking helps regulate blood pressure, insulin, and circulation.'
      },
      actionLabel: handled ? 'Completed' : 'Mark Exercise Done',
      isCompleted: handled
    });
  }

  // 3. CLINICAL APPOINTMENT REMINDERS
  appointments
    .filter(a => a.status === 'booked' || a.status === 'confirmed' || a.status === 'rescheduled')
    .forEach(apt => {
      const aptDate = apt.date; // YYYY-MM-DD
      const aptTime = apt.time || '09:00';
      const isToday = aptDate === todayStr;
      const reminderId = `apt-${apt.id}`;
      const handled = isHandledToday(reminderId);

      // Calculate days difference
      const aptDateTime = new Date(`${aptDate}T${aptTime}:00`);
      const nowTime = new Date();
      const diffMs = aptDateTime.getTime() - nowTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      let dueStatus: DueStatus = handled ? 'completed' : 'upcoming';
      let urgency: 'high' | 'medium' | 'low' = 'medium';

      if (!handled) {
        if (diffHours < 0 && isToday) {
          dueStatus = 'due_now';
          urgency = 'high';
        } else if (diffHours >= 0 && diffHours <= 3) {
          dueStatus = 'due_now';
          urgency = 'high';
        } else if (diffHours > 3 && diffHours <= 48) {
          dueStatus = 'upcoming';
          urgency = 'high';
        }
      }

      reminders.push({
        id: reminderId,
        type: 'appointment',
        title: `Consultation at ${apt.facilityName}`,
        subtitle: handled
          ? `With ${apt.providerName || 'Healthcare Provider'} • Acknowledged for today (Next in 24 hrs)`
          : `With ${apt.providerName || 'Healthcare Provider'} • ${apt.reason || 'Medical Consultation'}`,
        time: aptTime,
        targetTimeFormatted: isToday ? `Today at ${aptTime}` : `${aptDate} at ${aptTime}`,
        dueStatus,
        urgency: handled ? 'low' : urgency,
        metadata: {
          appointmentId: apt.id,
          facilityName: apt.facilityName,
          doctorName: apt.providerName
        },
        actionLabel: handled ? 'Acknowledged' : 'View Appointment',
        isCompleted: handled
      });
    });

  // 4. GENERAL CARE TASK REMINDERS
  const generalTasks = careTasks.filter(
    t => t.category !== 'exercise' && t.category !== 'mobility' && t.category !== 'medication'
  );

  generalTasks.forEach(task => {
    const taskMinutes = parseTimeToMinutes(task.timeOfDay || '12:00');
    const diffMinutes = currentMinutes - taskMinutes;
    const reminderId = `task-${task.id}`;
    const handled = task.completed || isHandledToday(reminderId);

    let dueStatus: DueStatus = handled ? 'completed' : 'upcoming';
    let urgency: 'high' | 'medium' | 'low' = 'medium';
    let isMissed = false;
    let missedMinutesAgo = 0;

    if (!handled) {
      if (diffMinutes > 60) {
        dueStatus = 'missed';
        urgency = 'high';
        isMissed = true;
        missedMinutesAgo = diffMinutes;
      } else if (diffMinutes >= -45 && diffMinutes <= 60) {
        dueStatus = 'due_now';
        urgency = 'high';
      }
    }

    reminders.push({
      id: reminderId,
      type: 'task',
      title: isMissed ? `Missed Task: ${task.title}` : task.title,
      subtitle: handled
        ? `Scheduled: ${task.timeOfDay || 'Today'} • Completed for today (Next reminder in 24 hrs)`
        : isMissed 
        ? `⚠️ Missed by ${Math.floor(missedMinutesAgo / 60) > 0 ? `${Math.floor(missedMinutesAgo / 60)}h ` : ''}${missedMinutesAgo % 60}m • Scheduled for ${task.timeOfDay || 'Today'}`
        : `Scheduled: ${task.timeOfDay || 'Today'} • ${task.category.toUpperCase()}`,
      time: task.timeOfDay || '12:00',
      targetTimeFormatted: `Today at ${task.timeOfDay || '12:00'}`,
      dueStatus,
      isMissed,
      missedMinutesAgo,
      urgency: handled ? 'low' : urgency,
      metadata: {
        taskId: task.id,
        category: task.category
      },
      actionLabel: handled ? 'Completed' : isMissed ? 'Mark Missed Done' : 'Complete Task',
      isCompleted: handled
    });
  });

  // Sort reminders: due_now & missed first, then overdue, upcoming, completed last
  const statusPriority: Record<DueStatus, number> = {
    due_now: 1,
    missed: 2,
    overdue: 3,
    upcoming: 4,
    completed: 5
  };

  return reminders.sort((a, b) => {
    if (statusPriority[a.dueStatus] !== statusPriority[b.dueStatus]) {
      return statusPriority[a.dueStatus] - statusPriority[b.dueStatus];
    }
    return a.time.localeCompare(b.time);
  });
}
