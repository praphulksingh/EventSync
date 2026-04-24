import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuthStore } from '../../store/authStore';

// ==================== REUSABLE STAT CARD (Student theme) ====================
const StatCard = ({ icon, title, value, gradientFrom = 'from-blue-600', gradientTo = 'to-cyan-600' }) => (
  <div className="group relative overflow-hidden rounded-2xl bg-white/30 backdrop-blur-md border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
    {/* Glowing blob */}
    <div className={`absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />
    <div className="relative p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 tracking-wide">{title}</p>
          <p className="text-4xl font-extrabold text-gray-800">{value}</p>
        </div>
        <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
    </div>
  </div>
);

// ==================== CUSTOM ALERT DIALOGS (Beautiful popups) ====================
const ConfirmDialog = ({ trigger, title, description, onConfirm, confirmText = "Confirm", confirmVariant = "primary", children }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      {trigger}
    </AlertDialogTrigger>
    <AlertDialogContent className="sm:max-w-md border-0 bg-white/90 backdrop-blur-2xl shadow-2xl rounded-3xl p-0 overflow-hidden animate-fadeIn">
      {/* Gradient top bar */}
      <div className={`h-2 w-full ${confirmVariant === 'destructive' ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`} />
      <div className="p-8">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-gray-800">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-500 mt-2 leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter className="mt-6 gap-3">
          <AlertDialogCancel className="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 ${
              confirmVariant === 'destructive'
                ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
            }`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </div>
    </AlertDialogContent>
  </AlertDialog>
);

// ==================== MAIN DASHBOARD COMPONENT ====================
export default function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState('dashboard');
  
  useEffect(() => { setActiveSection(location.hash.replace('#', '') || 'dashboard'); }, [location]);

  // --- QUERIES ---
  const { data: metrics, isLoading: metricsLoading } = useQuery({ queryKey: ['studentMetrics'], queryFn: async () => (await api.get('/events/student/metrics')).data.data });
  const { data: availableEvents } = useQuery({ queryKey: ['availableEvents'], queryFn: async () => (await api.get('/events/student/all')).data.data });
  const { data: registeredEvents } = useQuery({ queryKey: ['registeredEvents'], queryFn: async () => (await api.get('/events/student/registered')).data.data });
  const { data: attendance } = useQuery({ queryKey: ['studentAttendance'], queryFn: async () => (await api.get('/events/student/attendance')).data.data });
  const { data: certificates } = useQuery({ queryKey: ['studentCertificates'], queryFn: async () => (await api.get('/events/student/certificates')).data.data });

  // --- MUTATIONS ---
  const registerMutation = useMutation({
    mutationFn: (eventId) => api.post(`/events/student/register/${eventId}`),
    onSuccess: (data) => {
      toast.success(data.message || 'Registration successful!');
      queryClient.invalidateQueries(['availableEvents', 'registeredEvents', 'studentMetrics']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Registration failed')
  });

  const cancelMutation = useMutation({
    mutationFn: (attendanceId) => api.delete(`/events/student/registered/${attendanceId}`),
    onSuccess: (data) => {
      toast.success(data.message || 'Registration cancelled.');
      queryClient.invalidateQueries(['availableEvents', 'registeredEvents', 'studentMetrics']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cancellation failed')
  });

  const { register: passReg, handleSubmit: passSubmit, reset: passReset } = useForm();
  const changePasswordMutation = useMutation({
    mutationFn: (data) => api.put('/auth/change-password', data),
    onSuccess: () => {
      toast.success('Password successfully updated. Please log in with your new password.');
      logout();
      navigate('/login');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Password change failed')
  });

  const onChangePassword = (data) => {
    if (data.newPassword !== data.confirmPassword) return toast.error('Passwords do not match');
    changePasswordMutation.mutate({ currentPassword: data.currentPassword, newPassword: data.newPassword });
  };

  // Section entrance animation class
  const sectionVariants = 'animate-fadeIn';

  return (
    <DashboardLayout role="student" title={activeSection.replace('-', ' ')}>
      
      {/* ============ DASHBOARD ============ */}
      {activeSection === 'dashboard' && (
        <div className={`space-y-8 ${sectionVariants}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon="📚"
              title="Registered Events"
              value={metricsLoading ? '...' : (metrics?.registeredEvents ?? '0')}
              gradientFrom="from-blue-600"
              gradientTo="to-cyan-600"
            />
            <StatCard
              icon="📈"
              title="Attendance Rate"
              value={metricsLoading ? '...' : (metrics?.attendanceRate ?? '0%')}
              gradientFrom="from-emerald-600"
              gradientTo="to-teal-600"
            />
            <StatCard
              icon="🏆"
              title="Certificates Earned"
              value={metricsLoading ? '...' : (metrics?.certificatesEarned ?? '0')}
              gradientFrom="from-purple-600"
              gradientTo="to-indigo-600"
            />
          </div>
        </div>
      )}

      {/* ============ EVENTS ============ */}
      {activeSection === 'events' && (
        <div className={`${sectionVariants}`}>
          <Card className="overflow-hidden border-0 shadow-xl bg-white/70 backdrop-blur-lg rounded-3xl">
            <div className="overflow-x-auto rounded-3xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    <th className="p-5 font-semibold">Event Name</th>
                    <th className="p-5 font-semibold">Date</th>
                    <th className="p-5 font-semibold">Department</th>
                    <th className="p-5 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/80">
                  {availableEvents?.map(ev => (
                    <tr key={ev._id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200">
                      <td className="p-5 font-medium text-gray-800">{ev.name}</td>
                      <td className="p-5">{new Date(ev.date).toLocaleDateString()}</td>
                      <td className="p-5">{ev.department}</td>
                      <td className="p-5 text-center">
                        {/* Beautiful registration dialog instead of window.confirm */}
                        <ConfirmDialog
                          trigger={
                            <button className="px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-200">
                              ✨ Register
                            </button>
                          }
                          title="Register for Event"
                          description={`Are you sure you want to register for "${ev.name}"? This will reserve your seat.`}
                          confirmText="Yes, register me!"
                          confirmVariant="primary"
                          onConfirm={() => registerMutation.mutate(ev._id)}
                        />
                      </td>
                    </tr>
                  ))}
                  {(!availableEvents || availableEvents.length === 0) && (
                    <tr>
                      <td colSpan="4" className="p-12 text-center text-gray-400 text-lg">
                        🗓️ No events available right now
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ============ REGISTERED EVENTS ============ */}
      {activeSection === 'registered-events' && (
        <div className={`${sectionVariants}`}>
          <Card className="overflow-hidden border-0 shadow-xl bg-white/70 backdrop-blur-lg rounded-3xl">
            <div className="overflow-x-auto rounded-3xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    <th className="p-5 font-semibold">Event Name</th>
                    <th className="p-5 font-semibold">Date</th>
                    <th className="p-5 font-semibold">Status</th>
                    <th className="p-5 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/80">
                  {registeredEvents?.map(ev => (
                    <tr key={ev.attendanceId} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200">
                      <td className="p-5 font-medium text-gray-800">{ev.name}</td>
                      <td className="p-5">{new Date(ev.date).toLocaleDateString()}</td>
                      <td className="p-5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-sm">
                          ✅ Registered
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        {/* Beautiful cancellation dialog */}
                        <ConfirmDialog
                          trigger={
                            <button className="px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg hover:shadow-red-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-200">
                              🗑️ Cancel
                            </button>
                          }
                          title="Cancel Registration"
                          description={`Are you sure you want to withdraw from "${ev.name}"? This will free up your seat for another student.`}
                          confirmText="Yes, cancel registration"
                          confirmVariant="destructive"
                          onConfirm={() => cancelMutation.mutate(ev.attendanceId)}
                        />
                      </td>
                    </tr>
                  ))}
                  {(!registeredEvents || registeredEvents.length === 0) && (
                    <tr>
                      <td colSpan="4" className="p-12 text-center text-gray-400 text-lg">
                        📭 You have no active registrations
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ============ ATTENDANCE ============ */}
      {activeSection === 'attendance' && (
        <div className={`${sectionVariants}`}>
          <Card className="overflow-hidden border-0 shadow-xl bg-white/70 backdrop-blur-lg rounded-3xl">
            <div className="overflow-x-auto rounded-3xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    <th className="p-5 font-semibold">Event Name</th>
                    <th className="p-5 font-semibold">Date</th>
                    <th className="p-5 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/80">
                  {attendance?.map((rec, i) => (
                    <tr key={i} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200">
                      <td className="p-5 font-medium text-gray-800">{rec.event.name}</td>
                      <td className="p-5">{new Date(rec.event.date).toLocaleDateString()}</td>
                      <td className="p-5 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-sm">
                          ✅ Present
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!attendance || attendance.length === 0) && (
                    <tr>
                      <td colSpan="3" className="p-12 text-center text-gray-400 text-lg">
                        🕒 No attendance records yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ============ CERTIFICATES ============ */}
      {activeSection === 'certificates' && (
        <div className={`${sectionVariants}`}>
          <Card className="overflow-hidden border-0 shadow-xl bg-white/70 backdrop-blur-lg rounded-3xl">
            <div className="overflow-x-auto rounded-3xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    <th className="p-5 font-semibold">Event Name</th>
                    <th className="p-5 font-semibold">Date</th>
                    <th className="p-5 font-semibold text-center">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/80">
                  {certificates?.map(cert => (
                    <tr key={cert._id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200">
                      <td className="p-5 font-medium text-gray-800">{cert.name}</td>
                      <td className="p-5">{new Date(cert.date).toLocaleDateString()}</td>
                      <td className="p-5 text-center">
                        <button
                          onClick={() => window.open(`http://localhost:5000/api/events/student/download/certificate/${cert._id}?token=${token}`)}
                          className="px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                        >
                          ⬇️ Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!certificates || certificates.length === 0) && (
                    <tr>
                      <td colSpan="3" className="p-12 text-center text-gray-400 text-lg">
                        🎓 No certificates available yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ============ CHANGE PASSWORD ============ */}
      {activeSection === 'change-password' && (
        <div className={`max-w-md mx-auto ${sectionVariants}`}>
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md p-8 rounded-3xl">
            <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
              🔐 Change Password
            </h3>
            <form onSubmit={passSubmit(onChangePassword)} className="space-y-5">
              <input
                {...passReg('currentPassword')}
                type="password"
                placeholder="Current Password"
                required
                className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none"
              />
              <input
                {...passReg('newPassword')}
                type="password"
                placeholder="New Password (min 6 chars)"
                required
                minLength={6}
                className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none"
              />
              <input
                {...passReg('confirmPassword')}
                type="password"
                placeholder="Confirm New Password"
                required
                minLength={6}
                className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none"
              />
              <button
                type="submit"
                className="w-full py-3.5 mt-2 text-white font-bold rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-blue-500/25 transition-all duration-200 active:scale-[0.98]"
              >
                🔄 Update Password
              </button>
            </form>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}