import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  Stethoscope, 
  Users, 
  UserCheck, 
  ChevronRight, 
  ShieldAlert, 
  Activity, 
  FileText, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { AdminUserManagementModal } from '../auth/AdminUserManagementModal';
import { isSuperAdmin } from '../../lib/authService';

export const AssignedPatientsBanner: React.FC = () => {
  const firebaseUser = useAppStore(s => s.firebaseUser);
  const currentUserRole = useAppStore(s => s.currentUserRole);
  const assignedPatients = useAppStore(s => s.assignedPatients);
  const activeAssignedPatientId = useAppStore(s => s.activeAssignedPatientId);
  const setActiveAssignedPatientId = useAppStore(s => s.setActiveAssignedPatientId);
  const refreshAssignedPatients = useAppStore(s => s.refreshAssignedPatients);

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Only show for clinical staff or admin
  const isStaff = currentUserRole === 'doctor' || currentUserRole === 'caregiver' || currentUserRole === 'pharmacist';
  const isAdmin = currentUserRole === 'admin' || isSuperAdmin(firebaseUser?.email);

  if (!firebaseUser || (!isStaff && !isAdmin)) {
    return null;
  }

  const currentPatient = assignedPatients.find(p => p.patientId === activeAssignedPatientId);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAssignedPatients();
    setIsRefreshing(false);
  };

  return (
    <>
      <aside 
        aria-label="Clinical Staff Patient Oversight Bar"
        className="mb-4 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-[#0a2540] text-white p-3 sm:p-4 shadow-lg border border-teal-500/30"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Staff Info & Role Badge */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0 text-teal-300 shadow-inner">
              <Stethoscope className="w-5 h-5 text-teal-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-300 border border-teal-400/30">
                  {currentUserRole === 'admin' ? 'Super Administrator Oversight' : 'Clinical Practitioner Portal'}
                </span>
                {activeAssignedPatientId && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5" />
                    <span>Active Patient Mode</span>
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                {activeAssignedPatientId 
                  ? `Overseeing: ${currentPatient?.patientName || 'Assigned Patient'}` 
                  : (isStaff ? 'Your Clinical Patient Queue' : 'Healthcare Governance & Patient Roster')}
              </h3>
            </div>
          </div>

          {/* Action Controls & Patient Selection */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Patient Selector */}
            {assignedPatients.length > 0 ? (
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                <label htmlFor="assigned-patient-select" className="text-[11px] font-medium text-teal-200 px-1 hidden sm:inline">
                  Patient:
                </label>
                <select
                  id="assigned-patient-select"
                  aria-label="Select Assigned Patient"
                  value={activeAssignedPatientId || ''}
                  onChange={(e) => setActiveAssignedPatientId(e.target.value || null)}
                  className="bg-transparent text-white font-semibold text-xs py-1 px-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-white">
                    -- Personal Health File --
                  </option>
                  {assignedPatients.map((p) => (
                    <option key={p.id} value={p.patientId} className="bg-slate-900 text-white">
                      {p.patientName} {p.clinicalNotes ? `(${p.clinicalNotes})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : isStaff ? (
              <div className="text-[11px] text-teal-200/80 bg-teal-950/60 px-2.5 py-1 rounded-xl border border-teal-800/60 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>No patients assigned yet by Admin</span>
              </div>
            ) : null}

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh assigned patients"
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-teal-200 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Admin Management Button */}
            {isAdmin && (
              <button
                onClick={() => setShowAdminModal(true)}
                className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>RBAC &amp; Staff Governance</span>
              </button>
            )}
          </div>
        </div>

        {/* Clinical notes notice if inspecting a specific patient */}
        {currentPatient && currentPatient.clinicalNotes && (
          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-start gap-2 text-[11px] text-teal-100/90">
            <FileText className="w-3.5 h-3.5 text-teal-300 shrink-0 mt-0.5" />
            <span>
              <strong>Admin Clinical Note:</strong> {currentPatient.clinicalNotes} (Authorized oversight by Dr. {currentPatient.doctorName})
            </span>
          </div>
        )}
      </aside>

      {/* Admin RBAC Modal */}
      <AdminUserManagementModal 
        isOpen={showAdminModal} 
        onClose={() => setShowAdminModal(false)} 
      />
    </>
  );
};
