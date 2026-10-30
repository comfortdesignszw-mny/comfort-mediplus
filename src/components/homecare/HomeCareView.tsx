import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  VitalsReading, 
  CareTask, 
  ProgressReport, 
  Medication, 
  MedicalProcedureRecommendation, 
  HealthyEatingHabit, 
  ExercisePhysioSchedule, 
  GeneralCareLog,
  MedicationAdministrationRecord 
} from '../../types';
import { 
  HeartHandshake, 
  Activity, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Users, 
  FileText, 
  Calendar, 
  Smile, 
  Meh, 
  Frown, 
  AlertCircle, 
  Phone, 
  X,
  TrendingUp,
  Pill,
  Utensils,
  Dumbbell,
  Stethoscope,
  Clock,
  ShieldCheck,
  CheckSquare,
  Bed,
  Bath,
  ChefHat,
  ChevronRight,
  ClipboardList,
  Sparkles,
  HeartPulse
} from 'lucide-react';

export const HomeCareView: React.FC<{ initialOpenVitalsModal?: boolean }> = ({ initialOpenVitalsModal = false }) => {
  const carePlan = useAppStore(s => s.carePlan);
  const careTeam = useAppStore(s => s.careTeam);
  const vitals = useAppStore(s => s.vitals);
  const medications = useAppStore(s => s.medications);
  const progressReports = useAppStore(s => s.progressReports);
  const userProfile = useAppStore(s => s.userProfile);
  const currentUserRole = useAppStore(s => s.currentUserRole);
  const firebaseUser = useAppStore(s => s.firebaseUser);

  const toggleCareTask = useAppStore(s => s.toggleCareTask);
  const addCareTask = useAppStore(s => s.addCareTask);
  const logVitalReading = useAppStore(s => s.logVitalReading);
  const addProgressReport = useAppStore(s => s.addProgressReport);
  const setAppointmentActiveSubTab = useAppStore(s => s.setAppointmentActiveSubTab);

  // Homecare actions from store
  const administerPrescribedMedication = useAppStore(s => s.administerPrescribedMedication);
  const prescribeMedicationDirect = useAppStore(s => s.prescribeMedicationDirect);
  const addProcedureRecommendation = useAppStore(s => s.addProcedureRecommendation);
  const updateProcedureStatus = useAppStore(s => s.updateProcedureStatus);
  const addHealthyEatingHabit = useAppStore(s => s.addHealthyEatingHabit);
  const toggleHealthyEatingHabit = useAppStore(s => s.toggleHealthyEatingHabit);
  const addExercisePhysioSchedule = useAppStore(s => s.addExercisePhysioSchedule);
  const toggleExercisePhysioSchedule = useAppStore(s => s.toggleExercisePhysioSchedule);
  const addGeneralCareLog = useAppStore(s => s.addGeneralCareLog);
  const showToast = useAppStore(s => s.showToast);

  const [activeTab, setActiveTab] = useState<
    'tasks' | 'vitals' | 'administer_meds' | 'nutrition_exercise' | 'general_care' | 'procedures' | 'team' | 'reports'
  >('tasks');

  // Modals
  const [showLogVitalModal, setShowLogVitalModal] = useState(initialOpenVitalsModal);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);
  const [showAdministerModal, setShowAdministerModal] = useState<Medication | null>(null);
  const [showAddProcedureModal, setShowAddProcedureModal] = useState(false);
  const [showAddNutritionModal, setShowAddNutritionModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [showGeneralCareModal, setShowGeneralCareModal] = useState(false);

  const staffDisplayName = userProfile.fullName || firebaseUser?.fullName || 'Attending Healthcare Worker';

  // New Vital Reading Form
  const [vitalForm, setVitalForm] = useState<Omit<VitalsReading, 'id' | 'date'>>({
    systolicBp: 120,
    diastolicBp: 80,
    pulseRate: 72,
    temperature: 36.6,
    respiratoryRate: 16,
    bloodSugar: 5.4,
    weightKg: 68.0,
    oxygenSaturation: 98,
    painLevel: 0,
    mood: 'great',
    sleepHours: 7.5,
    recordedBy: `${staffDisplayName} (${currentUserRole.toUpperCase()})`,
    notes: '',
  });

  // New Care Task Form
  const [taskForm, setTaskForm] = useState<Omit<CareTask, 'id' | 'completed'>>({
    title: '',
    category: 'vitals',
    timeOfDay: '08:00',
    assignedTo: `${staffDisplayName} (${currentUserRole})`,
    notes: '',
  });

  // Doctor Direct Prescription Form
  const [prescribeForm, setPrescribeForm] = useState<Omit<Medication, 'id'>>({
    name: '',
    genericName: '',
    brandName: '',
    strength: '500mg',
    dosage: '1 tablet',
    route: 'oral',
    frequency: 'twice_daily',
    purpose: '',
    instructions: 'Take after meal with drinking water',
    startDate: new Date().toISOString().split('T')[0],
    prescribingDoctor: staffDisplayName,
    scheduledTimes: ['08:00', '20:00'],
    remainingUnits: 60,
    totalPrescribedUnits: 60,
    refillThreshold: 10,
    active: true,
  });

  // Administer Medication Form
  const [administerNotes, setAdministerNotes] = useState('');

  // Procedure Recommendation Form
  const [procedureForm, setProcedureForm] = useState<Omit<MedicalProcedureRecommendation, 'id' | 'createdAt' | 'recommendedBy' | 'recommendedByRole'>>({
    procedureName: '',
    category: 'diagnostic',
    clinicalJustification: '',
    urgency: 'priority',
    recommendedFacility: 'Parirenyatwa Group of Hospitals',
    recommendedSpecialist: '',
    dateRecommended: new Date().toISOString().split('T')[0],
    status: 'recommended',
    notes: '',
  });

  // Nutrition Habit Form
  const [nutritionForm, setNutritionForm] = useState<Omit<HealthyEatingHabit, 'id' | 'createdAt' | 'createdBy' | 'createdByRole'>>({
    title: '',
    mealType: 'lunch',
    targetTime: '12:30',
    dietaryRegimen: 'Low Sodium, High Fiber, Diabetic Friendly',
    foodItems: 'Steamed vegetables, grilled chicken/fish, whole grain sadza/brown rice',
    caloricOrPortionGoal: 'Medium portion (approx 500 kcal)',
    hydrationTargetMl: 500,
    specialInstructions: 'Ensure drinking water 30 mins before meal',
    isActive: true,
  });

  // Exercise & Physiotherapy Form
  const [exerciseForm, setExerciseForm] = useState<Omit<ExercisePhysioSchedule, 'id' | 'createdAt' | 'createdBy' | 'createdByRole'>>({
    title: '',
    type: 'physiotherapy',
    frequency: 'Daily in the morning',
    durationMinutes: 20,
    repsOrSets: '3 sets of 10 repetitions',
    targetTime: '09:00',
    precautions: 'Monitor pulse rate. Stop immediately if feeling dizzy.',
    assistanceRequired: true,
    scheduledBy: staffDisplayName,
    isActive: true,
  });

  // General Care Log Form
  const [generalCareForm, setGeneralCareForm] = useState<{
    category: GeneralCareLog['category'];
    title: string;
    patientComfortNotes: string;
  }>({
    category: 'feeding',
    title: 'Assisted with lunch meal feeding',
    patientComfortNotes: 'Patient ate full portion comfortably, tolerated fluids well',
  });

  // New Progress Report Form
  const [reportForm, setReportForm] = useState<Omit<ProgressReport, 'id' | 'date'>>({
    authorName: staffDisplayName,
    authorRole: currentUserRole === 'doctor' ? 'Clinical Doctor' : currentUserRole === 'pharmacist' ? 'Clinical Pharmacist' : 'Caregiver / Nurse',
    summary: '',
    observations: '',
    incidents: '',
  });

  const tasksList = carePlan.tasks || [];
  const completedTasksCount = tasksList.filter(t => t.completed).length;
  const completionPercentage = tasksList.length > 0 
    ? Math.round((completedTasksCount / tasksList.length) * 100) 
    : 100;

  const proceduresList = carePlan.recommendedProcedures || [];
  const eatingHabitsList = carePlan.healthyEatingHabits || [];
  const exerciseList = carePlan.exercisePhysioSchedules || [];
  const generalCareLogs = carePlan.generalCareLogs || [];
  const medicationAdministrations = carePlan.medicationAdministrations || [];

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-teal-600" />
            <span>Comprehensive Home-Based Care</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Doctor prescriptions • Medication Administration (MAR) • Healthy eating • Physiotherapy • Vitals &amp; Procedure referrals
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Doctor Prescription Button */}
          {(currentUserRole === 'doctor' || currentUserRole === 'admin' || firebaseUser?.email === 'comfort.designszw@gmail.com') && (
            <button
              onClick={() => setShowPrescribeModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Pill className="w-4 h-4" />
              <span>+ Prescribe Med</span>
            </button>
          )}

          <button
            onClick={() => setShowLogVitalModal(true)}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
          >
            <Activity className="w-4 h-4" />
            <span>Record Vitals</span>
          </button>
        </div>
      </div>

      {/* Care Plan Progress Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-[#0a2540] text-white p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300">
                Active Clinical {carePlan.period} Care Plan
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                {carePlan.title}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl font-black text-teal-300">{completionPercentage}%</span>
              <span className="text-[10px] block text-slate-300">Tasks Completed</span>
            </div>
          </div>

          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10 text-xs text-slate-200">
            {carePlan.goals.map((goal, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-300" />
                {goal}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Subtabs Menu */}
      <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-semibold gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'tasks' ? 'border-teal-600 text-teal-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Care Tasks ({tasksList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('administer_meds')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'administer_meds' ? 'border-teal-600 text-teal-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4 text-purple-600" />
          <span>Med Administer (MAR)</span>
        </button>

        <button
          onClick={() => setActiveTab('procedures')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'procedures' ? 'border-teal-600 text-teal-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4 text-rose-600" />
          <span>Recommend Procedures ({proceduresList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('nutrition_exercise')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'nutrition_exercise' ? 'border-teal-600 text-teal-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Utensils className="w-4 h-4 text-emerald-600" />
          <span>Eating &amp; Physio</span>
        </button>

        <button
          onClick={() => setActiveTab('general_care')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'general_care' ? 'border-teal-600 text-teal-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>General Care Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('vitals')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'vitals' ? 'border-teal-600 text-teal-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Vitals ({vitals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'team' ? 'border-teal-600 text-teal-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Care Team ({careTeam.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
            activeTab === 'reports' ? 'border-teal-600 text-teal-700 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Reports ({progressReports.length})</span>
        </button>
      </div>

      {/* TAB 1: CARE TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Patient Care Plan Tasks</h3>
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="px-3 py-1.5 rounded-xl border border-teal-600 text-teal-700 hover:bg-teal-50 text-xs font-bold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Care Task</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {tasksList.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleCareTask(task.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                  task.completed 
                    ? 'bg-slate-50 border-slate-200 text-slate-400' 
                    : 'bg-white border-slate-200 shadow-sm hover:border-teal-500/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    task.completed ? 'bg-emerald-500 text-white' : 'border-2 border-slate-300'
                  }`}>
                    {task.completed && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${task.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {task.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                        ⏰ {task.timeOfDay}
                      </span>
                      <span>Assigned: {task.assignedTo}</span>
                      <span className="uppercase text-[10px] px-1.5 py-0.5 bg-slate-100 rounded font-bold">
                        {task.category}
                      </span>
                    </div>
                  </div>
                </div>

                <span className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                  task.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {task.completed ? 'Completed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MEDICATION ADMINISTRATION (MAR) & PRESCRIBE */}
      {activeTab === 'administer_meds' && (
        <div className="space-y-5">
          <div className="p-4 rounded-3xl bg-purple-50 border border-purple-200/80 text-purple-950 text-xs flex items-start gap-3">
            <Pill className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Clinical Medication Administration Record (MAR)</h4>
              <p className="mt-0.5 text-purple-800">
                Appointed doctors, nurses, homecare assistants, and community healthcare workers administer prescribed medication, sign their clinical staff credential, and the remaining dose inventory is automatically updated in real-time.
              </p>
            </div>
          </div>

          {/* Active Medications Ready to Administer */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Active Prescriptions Awaiting Administration</h3>
              {(currentUserRole === 'doctor' || currentUserRole === 'admin') && (
                <button
                  onClick={() => setShowPrescribeModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Prescribe New Medication</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {medications.filter(m => m.active).map((med) => (
                <div
                  key={med.id}
                  className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 hover:border-purple-300 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-base font-black text-slate-900">{med.name} {med.strength}</h4>
                        <p className="text-xs text-slate-500">{med.dosage} • {med.frequency.replace('_', ' ')} • Route: {med.route}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        {med.remainingUnits} units left
                      </span>
                    </div>

                    <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 text-xs text-slate-600 space-y-1">
                      <p><span className="font-semibold text-slate-800">Purpose:</span> {med.purpose}</p>
                      <p><span className="font-semibold text-slate-800">Prescribing Clinician:</span> {med.prescribingDoctor}</p>
                      <p><span className="font-semibold text-slate-800">Instructions:</span> {med.instructions}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowAdministerModal(med);
                      setAdministerNotes(`Dose administered by ${staffDisplayName} (${currentUserRole.toUpperCase()})`);
                    }}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Administer Prescribed Dose Now</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Administration History (MAR Logs) */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Signed Administration Log (MAR History)</h3>
            
            <div className="space-y-2.5">
              {medicationAdministrations.map((mar) => (
                <div
                  key={mar.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{mar.medicationName}</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px]">
                        {mar.dosageGiven} via {mar.route}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-0.5">
                      Administered by: <span className="font-semibold text-slate-700">{mar.administeredBy}</span> • Prescribed by: {mar.prescribedByDoctor}
                    </p>
                    {mar.patientResponseNotes && (
                      <p className="text-slate-600 italic text-[11px] mt-0.5">"{mar.patientResponseNotes}"</p>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(mar.administeredAt).toLocaleString()}
                  </span>
                </div>
              ))}

              {medicationAdministrations.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
                  No medication doses administered yet. Select any prescribed medication above to record administration.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECOMMEND ANY MEDICAL PROCEDURE */}
      {activeTab === 'procedures' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200/80 text-rose-950 text-xs flex items-start gap-3">
            <Stethoscope className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Medical Procedure Recommendation Area</h4>
              <p className="mt-0.5 text-rose-800">
                Doctors, clinical specialists, and homecare teams can recommend surgical, diagnostic, laboratory, therapeutic, or rehabilitation procedures. Patients can book the recommended procedure with one click at the chosen healthcare facility.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recommended Medical Procedures</h3>
            <button
              onClick={() => setShowAddProcedureModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Recommend Procedure</span>
            </button>
          </div>

          <div className="space-y-3">
            {proceduresList.map((proc) => (
              <div
                key={proc.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-rose-300 transition"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-black text-slate-900">{proc.procedureName}</h4>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {proc.category}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      proc.urgency === 'emergency' ? 'bg-red-600 text-white animate-pulse' :
                      proc.urgency === 'urgent' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                      proc.urgency === 'priority' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {proc.urgency} Urgency
                    </span>
                  </div>

                  <p className="text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">Clinical Justification:</span> {proc.clinicalJustification}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>🏥 Recommended Facility: <strong className="text-slate-700">{proc.recommendedFacility || 'Parirenyatwa Hospital'}</strong></span>
                    <span>👨‍⚕️ Clinician: <strong className="text-slate-700">{proc.recommendedBy} ({proc.recommendedByRole})</strong></span>
                    <span>📅 Recommended: {proc.dateRecommended}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
                  <button
                    onClick={() => {
                      setAppointmentActiveSubTab('facility_directory');
                      showToast(`Proceed to book "${proc.procedureName}" at the recommended facility`, 'info');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition active:scale-95"
                  >
                    <span>Book at Facility</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <select
                    value={proc.status}
                    onChange={(e) => updateProcedureStatus(proc.id, e.target.value as any)}
                    className="p-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold"
                  >
                    <option value="recommended">Status: Recommended</option>
                    <option value="scheduled">Status: Scheduled</option>
                    <option value="in_progress">Status: In Progress</option>
                    <option value="completed">Status: Completed</option>
                    <option value="deferred">Status: Deferred</option>
                  </select>
                </div>
              </div>
            ))}

            {proceduresList.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
                No medical procedures recommended yet. Doctors and healthcare workers can click "Recommend Procedure" above to record clinically justified referrals.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: HEALTHY EATING HABITS & PHYSIOTHERAPY */}
      {activeTab === 'nutrition_exercise' && (
        <div className="space-y-6">
          
          {/* Subsection A: Healthy Eating Habits */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <span>Scheduled Healthy Eating Habits &amp; Nutrition</span>
                </h3>
                <p className="text-xs text-slate-500">Dietary regimens, hydration goals, and meal schedule designed by clinicians.</p>
              </div>
              <button
                onClick={() => setShowAddNutritionModal(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Schedule Meal Habit</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {eatingHabitsList.map((habit) => (
                <div
                  key={habit.id}
                  className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 hover:border-emerald-300 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800">
                        {habit.mealType} • {habit.targetTime}
                      </span>
                      <button
                        onClick={() => toggleHealthyEatingHabit(habit.id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          habit.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {habit.isActive ? 'ACTIVE' : 'PAUSED'}
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{habit.title}</h4>
                    <p className="text-xs text-slate-600"><strong className="text-slate-800">Regimen:</strong> {habit.dietaryRegimen}</p>
                    <p className="text-xs text-slate-500"><strong className="text-slate-700">Recommended items:</strong> {habit.foodItems}</p>
                    {habit.hydrationTargetMl && (
                      <p className="text-[11px] text-teal-700 font-semibold">💧 Hydration Target: {habit.hydrationTargetMl} ml</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Prescribed by {habit.prescribedBy || 'Clinical Team'}</span>
                    <button
                      onClick={() => addGeneralCareLog({
                        category: 'feeding',
                        title: `Served: ${habit.title}`,
                        patientComfortNotes: `Patient enjoyed meal according to ${habit.dietaryRegimen} regimen.`,
                      })}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                    >
                      Log Meal Served
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subsection B: Physical Exercise & Physiotherapy */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-cyan-600" />
                  <span>Physical Exercise &amp; Physiotherapy Regimens</span>
                </h3>
                <p className="text-xs text-slate-500">Mobility routines, stretching, respiratory exercises &amp; guided therapy.</p>
              </div>
              <button
                onClick={() => setShowAddExerciseModal(true)}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Schedule Exercise</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {exerciseList.map((ex) => (
                <div
                  key={ex.id}
                  className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 hover:border-cyan-300 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800">
                        {ex.type} • {ex.targetTime}
                      </span>
                      <button
                        onClick={() => toggleExercisePhysioSchedule(ex.id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ex.isActive ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {ex.isActive ? 'ACTIVE' : 'PAUSED'}
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{ex.title}</h4>
                    <p className="text-xs text-slate-600">
                      <strong>Duration:</strong> {ex.durationMinutes} mins • {ex.repsOrSets || 'Continuous gentle pace'}
                    </p>
                    <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-xl">
                      <strong>Precautions:</strong> {ex.precautions}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Scheduled by {ex.scheduledBy}</span>
                    <button
                      onClick={() => addGeneralCareLog({
                        category: 'other',
                        title: `Completed Physio: ${ex.title}`,
                        patientComfortNotes: `Patient completed ${ex.durationMinutes} minutes session with good mobility response.`,
                      })}
                      className="text-xs font-bold text-cyan-700 hover:text-cyan-900 underline"
                    >
                      Log Exercise Done
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GENERAL CARE LOGGING (Feed, Cook, Wash, Beds, Tasks) */}
      {activeTab === 'general_care' && (
        <div className="space-y-5">
          <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200/80 text-amber-950 text-xs flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">General Care Logging Dashboard</h4>
              <p className="mt-0.5 text-amber-800">
                Homecare assistants and family caregivers offer and log essential daily support: feeding, cooking healthy meals, washing/bathing, changing beds, hygiene, and patient task checks.
              </p>
            </div>
          </div>

          {/* Quick Action One-Tap Log Buttons */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quick Care Actions</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => addGeneralCareLog({
                  category: 'feeding',
                  title: 'Patient Meal Feeding Assistance',
                  patientComfortNotes: 'Fed nutritious meal; patient finished whole meal with adequate fluid intake.',
                })}
                className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 shadow-sm flex flex-col items-center text-center gap-1.5 transition active:scale-95"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Feed Patient</span>
                <span className="text-[10px] text-slate-500">1-Tap Log</span>
              </button>

              <button
                onClick={() => addGeneralCareLog({
                  category: 'cooking',
                  title: 'Cooked Warm Prescribed Meal',
                  patientComfortNotes: 'Cooked fresh meal following dietary instructions with low salt & healthy fiber.',
                })}
                className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-orange-400 shadow-sm flex flex-col items-center text-center gap-1.5 transition active:scale-95"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
                  <ChefHat className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Cook Meal</span>
                <span className="text-[10px] text-slate-500">1-Tap Log</span>
              </button>

              <button
                onClick={() => addGeneralCareLog({
                  category: 'washing_bathing',
                  title: 'Full Sponge Bath & Hygiene Assistance',
                  patientComfortNotes: 'Helped patient bathe, cleansed skin, dressed in clean clothing. Patient felt comfortable.',
                })}
                className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 shadow-sm flex flex-col items-center text-center gap-1.5 transition active:scale-95"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Bath className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Wash &amp; Bath</span>
                <span className="text-[10px] text-slate-500">1-Tap Log</span>
              </button>

              <button
                onClick={() => addGeneralCareLog({
                  category: 'bed_making',
                  title: 'Bed Linen Changed & Disinfected',
                  patientComfortNotes: 'Replaced sheets with clean sanitized linen, fluffed pillows, adjusted bed incline.',
                })}
                className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 shadow-sm flex flex-col items-center text-center gap-1.5 transition active:scale-95"
              >
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Bed className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Make Bed</span>
                <span className="text-[10px] text-slate-500">1-Tap Log</span>
              </button>
            </div>
          </div>

          {/* Detailed Custom Log Button */}
          <div className="flex items-center justify-between pt-2">
            <h3 className="text-sm font-bold text-slate-900">Recorded General Care Logs</h3>
            <button
              onClick={() => setShowGeneralCareModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Custom Care Entry</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {generalCareLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{log.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                      {log.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-600">Logged by: <span className="font-semibold text-slate-800">{log.loggedBy}</span></p>
                  {log.patientComfortNotes && (
                    <p className="text-slate-500 italic mt-0.5">"{log.patientComfortNotes}"</p>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {new Date(log.loggedAt || log.performedAt || Date.now()).toLocaleString()}
                </span>
              </div>
            ))}

            {generalCareLogs.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
                No general care activities logged yet. Tap any of the quick action buttons above to record meals, cooking, washing, or bed care.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: VITALS TRENDS */}
      {activeTab === 'vitals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recorded Clinical Vitals</h3>
            <button
              onClick={() => setShowLogVitalModal(true)}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Vitals</span>
            </button>
          </div>

          <div className="space-y-3">
            {vitals.map((v) => (
              <div
                key={v.id}
                className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    📅 {new Date(v.date).toLocaleString()}
                  </span>
                  <span className="text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-md">
                    Logged by: {v.recordedBy}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Blood Pressure</span>
                    <span className="text-base font-black text-slate-800">
                      {v.systolicBp}/{v.diastolicBp}
                    </span>
                    <span className="text-[10px] text-slate-400 block">mmHg</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Pulse Rate</span>
                    <span className="text-base font-black text-teal-700">
                      {v.pulseRate || '--'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">bpm</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Blood Sugar</span>
                    <span className="text-base font-black text-slate-800">
                      {v.bloodSugar || '--'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">mmol/L</span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Oxygen (SpO2)</span>
                    <span className="text-base font-black text-blue-700">
                      {v.oxygenSaturation || '--'}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">Saturation</span>
                  </div>
                </div>

                {v.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl italic">
                    "{v.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: CARE TEAM */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {careTeam.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{member.name}</h4>
                    <p className="text-xs text-teal-700 font-semibold">{member.role}</p>
                    <p className="text-[11px] text-slate-400">{member.phone}</p>
                  </div>
                </div>

                <a
                  href={`tel:${member.phone}`}
                  className="p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 transition"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: PROGRESS REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Clinical Progress Reports</h3>
            <button
              onClick={() => setShowAddReportModal(true)}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write Report</span>
            </button>
          </div>

          <div className="space-y-3">
            {progressReports.map((report) => (
              <div
                key={report.id}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{report.summary}</span>
                  <span className="text-[11px] text-slate-400">📅 {report.date}</span>
                </div>
                <p className="text-slate-600"><strong className="text-slate-700">Author:</strong> {report.authorName} ({report.authorRole})</p>
                <p className="text-slate-700"><strong className="text-slate-800">Observations:</strong> {report.observations}</p>
                {report.incidents && (
                  <p className="text-amber-800 bg-amber-50 p-2 rounded-xl">
                    <strong>Incidents:</strong> {report.incidents}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADMINISTER MEDICATION */}
      {showAdministerModal && (
        <div
          onClick={() => setShowAdministerModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-black text-slate-900">Administer Medication</h3>
              </div>
              <button onClick={() => setShowAdministerModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 p-3 bg-purple-50 rounded-2xl text-xs space-y-1">
              <p><span className="font-semibold text-slate-900">Medication:</span> {showAdministerModal.name} {showAdministerModal.strength}</p>
              <p><span className="font-semibold text-slate-900">Dose &amp; Route:</span> {showAdministerModal.dosage} via {showAdministerModal.route}</p>
              <p><span className="font-semibold text-slate-900">Prescribing Doctor:</span> {showAdministerModal.prescribingDoctor}</p>
              <p><span className="font-semibold text-slate-900">Current Stock:</span> {showAdministerModal.remainingUnits} units</p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await administerPrescribedMedication({
                  medicationId: showAdministerModal.id,
                  medicationName: showAdministerModal.name,
                  dosage: showAdministerModal.dosage,
                  route: showAdministerModal.route,
                  staffNotes: administerNotes,
                });
                setShowAdministerModal(null);
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-800 block mb-1">Attending Clinician / Staff Signature</label>
                <input
                  disabled
                  type="text"
                  value={`${staffDisplayName} (${currentUserRole.toUpperCase()})`}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Patient Response / Notes</label>
                <input
                  type="text"
                  value={administerNotes}
                  onChange={(e) => setAdministerNotes(e.target.value)}
                  placeholder="e.g. Swallowed easily with water, vitals stable"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdministerModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-sm"
                >
                  Sign &amp; Record Administration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOCTOR DIRECT PRESCRIPTION */}
      {showPrescribeModal && (
        <div
          onClick={() => setShowPrescribeModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Doctor Medication Prescription</h3>
              </div>
              <button onClick={() => setShowPrescribeModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await prescribeMedicationDirect(prescribeForm);
                setShowPrescribeModal(false);
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-800 block mb-1">Medication Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Amlodipine Besylate"
                  value={prescribeForm.name}
                  onChange={(e) => setPrescribeForm({ ...prescribeForm, name: e.target.value, genericName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Strength (e.g. 5mg, 500mg) *</label>
                  <input
                    required
                    type="text"
                    value={prescribeForm.strength}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, strength: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Dosage (e.g. 1 tab, 2 puffs) *</label>
                  <input
                    required
                    type="text"
                    value={prescribeForm.dosage}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, dosage: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Route of Administration *</label>
                  <select
                    value={prescribeForm.route}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, route: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="oral">Oral (By Mouth)</option>
                    <option value="injection">Subcutaneous / Intramuscular Injection</option>
                    <option value="inhaler">Inhaler</option>
                    <option value="topical">Topical Ointment</option>
                    <option value="eye_ear_drops">Eye / Ear Drops</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Frequency *</label>
                  <select
                    value={prescribeForm.frequency}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, frequency: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="once_daily">Once Daily</option>
                    <option value="twice_daily">Twice Daily</option>
                    <option value="thrice_daily">Three Times Daily</option>
                    <option value="four_times_daily">Four Times Daily</option>
                    <option value="as_needed">As Needed (PRN)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Clinical Indication / Purpose *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Stage 2 Essential Hypertension"
                  value={prescribeForm.purpose}
                  onChange={(e) => setPrescribeForm({ ...prescribeForm, purpose: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Total Prescribed Units *</label>
                  <input
                    required
                    type="number"
                    value={prescribeForm.totalPrescribedUnits}
                    onChange={(e) => setPrescribeForm({ 
                      ...prescribeForm, 
                      totalPrescribedUnits: Number(e.target.value), 
                      remainingUnits: Number(e.target.value) 
                    })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Prescribing Doctor Signature</label>
                  <input
                    type="text"
                    value={prescribeForm.prescribingDoctor}
                    onChange={(e) => setPrescribeForm({ ...prescribeForm, prescribingDoctor: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrescribeModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
                >
                  Prescribe &amp; Synchronize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECOMMEND ANY MEDICAL PROCEDURE */}
      {showAddProcedureModal && (
        <div
          onClick={() => setShowAddProcedureModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-black text-slate-900">Recommend Medical Procedure</h3>
              </div>
              <button onClick={() => setShowAddProcedureModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await addProcedureRecommendation(procedureForm);
                setShowAddProcedureModal(false);
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-800 block mb-1">Procedure Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Abdominal &amp; Pelvic Ultrasound Scan"
                  value={procedureForm.procedureName}
                  onChange={(e) => setProcedureForm({ ...procedureForm, procedureName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Category *</label>
                  <select
                    value={procedureForm.category}
                    onChange={(e) => setProcedureForm({ ...procedureForm, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="diagnostic">Diagnostic Imaging / Lab</option>
                    <option value="surgical">Surgical Procedure</option>
                    <option value="therapeutic">Therapeutic</option>
                    <option value="rehabilitation">Physiotherapy / Rehab</option>
                    <option value="preventative">Preventative / Screening</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Urgency Level *</label>
                  <select
                    value={procedureForm.urgency}
                    onChange={(e) => setProcedureForm({ ...procedureForm, urgency: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="routine">Routine</option>
                    <option value="priority">Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Clinical Justification (Reason for procedure) *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explain why this procedure is clinically indicated for the patient..."
                  value={procedureForm.clinicalJustification}
                  onChange={(e) => setProcedureForm({ ...procedureForm, clinicalJustification: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Recommended Facility or Practice</label>
                <input
                  type="text"
                  placeholder="e.g. Parirenyatwa Specialist Radiology"
                  value={procedureForm.recommendedFacility}
                  onChange={(e) => setProcedureForm({ ...procedureForm, recommendedFacility: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProcedureModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm"
                >
                  Save Recommendation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HEALTHY EATING HABIT */}
      {showAddNutritionModal && (
        <div
          onClick={() => setShowAddNutritionModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Schedule Healthy Eating Habit</h3>
              </div>
              <button onClick={() => setShowAddNutritionModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await addHealthyEatingHabit(nutritionForm);
                setShowAddNutritionModal(false);
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-800 block mb-1">Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. High Protein Lunch with Leafy Greens"
                  value={nutritionForm.title}
                  onChange={(e) => setNutritionForm({ ...nutritionForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Meal Type</label>
                  <select
                    value={nutritionForm.mealType}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, mealType: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Healthy Snack</option>
                    <option value="hydration">Hydration</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Target Time</label>
                  <input
                    type="time"
                    value={nutritionForm.targetTime}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, targetTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Dietary Regimen</label>
                <input
                  type="text"
                  placeholder="e.g. Low Sodium, Diabetic Friendly"
                  value={nutritionForm.dietaryRegimen}
                  onChange={(e) => setNutritionForm({ ...nutritionForm, dietaryRegimen: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Recommended Food Items</label>
                <input
                  type="text"
                  placeholder="e.g. Steamed rape, grilled chicken, rapoko porridge"
                  value={nutritionForm.foodItems}
                  onChange={(e) => setNutritionForm({ ...nutritionForm, foodItems: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddNutritionModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXERCISE & PHYSIO SCHEDULE */}
      {showAddExerciseModal && (
        <div
          onClick={() => setShowAddExerciseModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-black text-slate-900">Schedule Exercise / Physio</h3>
              </div>
              <button onClick={() => setShowAddExerciseModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await addExercisePhysioSchedule(exerciseForm);
                setShowAddExerciseModal(false);
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-800 block mb-1">Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Guided Knee &amp; Hip Mobility Therapy"
                  value={exerciseForm.title}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Type</label>
                  <select
                    value={exerciseForm.type}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="physiotherapy">Physiotherapy</option>
                    <option value="mobility">Gentle Mobility</option>
                    <option value="walking">Assisted Walking</option>
                    <option value="stretching">Stretching</option>
                    <option value="respiratory">Deep Breathing &amp; Lung</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={exerciseForm.durationMinutes}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, durationMinutes: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Clinical Precautions</label>
                <input
                  type="text"
                  placeholder="e.g. Ensure patient is seated; stop if dizzy"
                  value={exerciseForm.precautions}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, precautions: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExerciseModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-sm"
                >
                  Save Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GENERAL CARE CUSTOM LOG */}
      {showGeneralCareModal && (
        <div
          onClick={() => setShowGeneralCareModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">Custom General Care Log</h3>
              </div>
              <button onClick={() => setShowGeneralCareModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await addGeneralCareLog(generalCareForm);
                setShowGeneralCareModal(false);
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-800 block mb-1">Category</label>
                <select
                  value={generalCareForm.category}
                  onChange={(e) => setGeneralCareForm({ ...generalCareForm, category: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="feeding">Feeding Patient</option>
                  <option value="cooking">Cooking Meal</option>
                  <option value="washing_bathing">Washing / Bathing</option>
                  <option value="bed_making">Bed Making / Linen</option>
                  <option value="task_check">Patient Task Check</option>
                  <option value="other">Other Care Support</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Activity Title *</label>
                <input
                  required
                  type="text"
                  value={generalCareForm.title}
                  onChange={(e) => setGeneralCareForm({ ...generalCareForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Patient Comfort Notes</label>
                <textarea
                  rows={2}
                  value={generalCareForm.patientComfortNotes}
                  onChange={(e) => setGeneralCareForm({ ...generalCareForm, patientComfortNotes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGeneralCareModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm"
                >
                  Save Care Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD VITALS */}
      {showLogVitalModal && (
        <div
          onClick={() => setShowLogVitalModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-black text-slate-900">Record Clinical Vitals</h3>
              </div>
              <button onClick={() => setShowLogVitalModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                logVitalReading(vitalForm);
                setShowLogVitalModal(false);
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={vitalForm.systolicBp || ''}
                    onChange={(e) => setVitalForm({ ...vitalForm, systolicBp: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={vitalForm.diastolicBp || ''}
                    onChange={(e) => setVitalForm({ ...vitalForm, diastolicBp: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Pulse Rate (bpm)</label>
                  <input
                    type="number"
                    value={vitalForm.pulseRate || ''}
                    onChange={(e) => setVitalForm({ ...vitalForm, pulseRate: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Oxygen Saturation (%)</label>
                  <input
                    type="number"
                    value={vitalForm.oxygenSaturation || ''}
                    onChange={(e) => setVitalForm({ ...vitalForm, oxygenSaturation: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Blood Sugar (mmol/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalForm.bloodSugar || ''}
                    onChange={(e) => setVitalForm({ ...vitalForm, bloodSugar: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalForm.temperature || ''}
                    onChange={(e) => setVitalForm({ ...vitalForm, temperature: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Clinician / Observer Signature</label>
                <input
                  type="text"
                  value={vitalForm.recordedBy}
                  onChange={(e) => setVitalForm({ ...vitalForm, recordedBy: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Clinical Observation Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Resting BP measured after 5 minutes sitting"
                  value={vitalForm.notes || ''}
                  onChange={(e) => setVitalForm({ ...vitalForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogVitalModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm"
                >
                  Save Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CARE TASK */}
      {showAddTaskModal && (
        <div
          onClick={() => setShowAddTaskModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Add Care Task</h3>
              <button onClick={() => setShowAddTaskModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addCareTask(taskForm);
                setShowAddTaskModal(false);
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-800 block mb-1">Task Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Measure morning fasting blood sugar"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Category</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="vitals">Vitals Check</option>
                    <option value="medication">Medication Assist</option>
                    <option value="meal">Meal &amp; Nutrition</option>
                    <option value="exercise">Exercise / Mobility</option>
                    <option value="hygiene">Hygiene / Bath</option>
                    <option value="custom">General Care</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Time of Day</label>
                  <input
                    type="time"
                    value={taskForm.timeOfDay}
                    onChange={(e) => setTaskForm({ ...taskForm, timeOfDay: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Assigned Worker</label>
                <input
                  type="text"
                  value={taskForm.assignedTo}
                  onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: WRITE PROGRESS REPORT */}
      {showAddReportModal && (
        <div
          onClick={() => setShowAddReportModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Clinical Progress Report</h3>
              <button onClick={() => setShowAddReportModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addProgressReport(reportForm);
                setShowAddReportModal(false);
              }}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-800 block mb-1">Summary Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Stable vitals, improved mobility during morning walk"
                  value={reportForm.summary}
                  onChange={(e) => setReportForm({ ...reportForm, summary: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Observations *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Clinical observations on patient condition..."
                  value={reportForm.observations}
                  onChange={(e) => setReportForm({ ...reportForm, observations: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddReportModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
