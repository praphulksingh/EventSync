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
import { Card } from '../../components/ui/card';
import { useAuthStore } from '../../store/authStore';

// ==================== REUSABLE STAT CARD (Faculty theme) ====================
const StatCard = ({ icon, title, value, gradientFrom = 'from-orange-500', gradientTo = 'to-amber-500' }) => (
  <div className="group relative overflow-hidden rounded-2xl bg-white/30 backdrop-blur-md border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
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

// ==================== CUSTOM ALERT DIALOG (Faculty colors) ====================
const ConfirmDialog = ({ trigger, title, description, onConfirm, confirmText = "Confirm", confirmVariant = "primary", children }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      {trigger}
    </AlertDialogTrigger>
    <AlertDialogContent className="sm:max-w-md border-0 bg-white/90 backdrop-blur-2xl shadow-2xl rounded-3xl p-0 overflow-hidden animate-fadeIn">
      <div className={`h-2 w-full ${confirmVariant === 'destructive' ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-orange-500 to-amber-500'}`} />
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
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
            }`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </div>
    </AlertDialogContent>
  </AlertDialog>
);

export default function FacultyDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedEventId, setSelectedEventId] = useState('');

  useEffect(() => { setActiveSection(location.hash.replace('#', '') || 'dashboard'); }, [location]);

  const { data: userInfo } = useQuery({ queryKey: ['userInfo'], queryFn: async () => (await api.get('/auth/userinfo')).data.user });
  const department = userInfo?.department || 'Unknown Dept';

  const { data: metrics, isLoading: metricsLoading } = useQuery({ queryKey: ['facMetrics'], queryFn: async () => (await api.get('/events/faculty/metrics')).data.data });
  const { data: myEvents } = useQuery({ queryKey: ['facEvents'], queryFn: async () => (await api.get('/events/faculty/events')).data.data });
  const { data: registrations } = useQuery({
    queryKey: ['facRegs', selectedEventId],
    queryFn: async () => (await api.get(`/events/faculty/registrations/${selectedEventId}`)).data.data,
    enabled: !!selectedEventId
  });

  // Event Creation
  const { register: eventReg, handleSubmit: handleEventSubmit, reset: resetEventForm } = useForm();
  const saveEventMutation = useMutation({
    mutationFn: (data) => api.post('/events/faculty/events', data),
    onSuccess: () => {
      toast.success('Event created and sent for HOD approval!');
      resetEventForm();
      queryClient.invalidateQueries(['facEvents', 'facMetrics']);
      window.location.hash = '#manage-events';
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Creation failed')
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id) => api.delete(`/events/faculty/events/${id}`),
    onSuccess: () => {
      toast.success('Event successfully deleted.');
      queryClient.invalidateQueries(['facEvents', 'facMetrics']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete event')
  });

  const updateAttnMutation = useMutation({
    mutationFn: ({ eventId, studentId, isPresent }) => api.put(`/events/faculty/attendance/${eventId}/${studentId}`, { isPresent }),
    onSuccess: () => {
      toast.success('Attendance updated successfully.');
      queryClient.invalidateQueries(['facRegs', selectedEventId])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update attendance')
  });

  // Change Password
  const { register: passReg, handleSubmit: passSubmit } = useForm();
  const changePasswordMutation = useMutation({
    mutationFn: (data) => api.put('/auth/change-password', data),
    onSuccess: () => {
      toast.success('Password updated! Please login again.');
      logout();
      navigate('/login');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Password change failed')
  });

  const sectionVariants = 'animate-fadeIn';

  return (
    <DashboardLayout role="faculty" title={activeSection.replace('-', ' ')}>

      {/* ============ DASHBOARD ============ */}
      {activeSection === 'dashboard' && (
        <div className={`space-y-8 ${sectionVariants}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon="📅"
              title="Events Created"
              value={metricsLoading ? '...' : (metrics?.eventsCreated ?? '0')}
              gradientFrom="from-orange-500"
              gradientTo="to-amber-500"
            />
            <StatCard
              icon="⏳"
              title="Pending Approval"
              value={metricsLoading ? '...' : (metrics?.pendingApproval ?? '0')}
              gradientFrom="from-yellow-500"
              gradientTo="to-orange-400"
            />
            <StatCard
              icon="🚀"
              title="Upcoming Approved"
              value={metricsLoading ? '...' : (metrics?.upcomingApprovedEvents ?? '0')}
              gradientFrom="from-emerald-500"
              gradientTo="to-teal-500"
            />
          </div>
        </div>
      )}

      {/* ============ CREATE EVENT ============ */}
      {activeSection === 'create-event' && (
        <div className={`max-w-2xl mx-auto ${sectionVariants}`}>
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md p-8 rounded-3xl">
            <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
              ✨ Create New Event
            </h3>
            <form onSubmit={handleEventSubmit((data) => saveEventMutation.mutate({ ...data, department }))} className="space-y-5">
              <input 
                {...eventReg('name', { required: true })} 
                placeholder="Event Title" 
                className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 transition-all outline-none" 
              />
              <div className="grid grid-cols-2 gap-5">
                <input 
                  {...eventReg('date', { required: true })} 
                  type="date" 
                  className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 transition-all outline-none" 
                />
                <input 
                  {...eventReg('time', { required: true })} 
                  type="time" 
                  className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 transition-all outline-none" 
                />
              </div>
              <input 
                {...eventReg('venue', { required: true })} 
                placeholder="Venue" 
                className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 transition-all outline-none" 
              />
              <button 
                type="submit" 
                className="w-full py-3.5 mt-2 text-white font-bold rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98]"
              >
                🚀 Submit Event for Approval
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* ============ MANAGE EVENTS ============ */}
      {activeSection === 'manage-events' && (
        <div className={`${sectionVariants}`}>
          <Card className="overflow-hidden border-0 shadow-xl bg-white/70 backdrop-blur-lg rounded-3xl">
            <div className="overflow-x-auto rounded-3xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                    <th className="p-5 font-semibold">Event Name</th>
                    <th className="p-5 font-semibold">Date</th>
                    <th className="p-5 font-semibold">Status</th>
                    <th className="p-5 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/80">
                  {myEvents?.map(ev => (
                    <tr key={ev._id} className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-transparent transition-all duration-200">
                      <td className="p-5 font-medium text-gray-800">{ev.name}</td>
                      <td className="p-5">{new Date(ev.date).toLocaleDateString()}</td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-sm ${
                          ev.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          ev.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {ev.status}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        {ev.status !== 'approved' && (
                          <ConfirmDialog
                            trigger={
                              <button className="px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg hover:shadow-red-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-200">
                                🗑️ Delete
                              </button>
                            }
                            title="Delete Event"
                            description={`Are you absolutely sure you want to delete "${ev.name}"? This action cannot be undone.`}
                            confirmText="Yes, delete event"
                            confirmVariant="destructive"
                            onConfirm={() => deleteEventMutation.mutate(ev._id)}
                          />
                        )}
                        {ev.status === 'approved' && (
                          <span className="text-sm text-gray-400 italic">Cannot delete approved events</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!myEvents || myEvents.length === 0) && (
                    <tr>
                      <td colSpan="4" className="p-12 text-center text-gray-400 text-lg">
                        📭 You have not created any events yet
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
          <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-lg rounded-3xl p-6">
            <div className="mb-6">
              <select 
                value={selectedEventId} 
                onChange={(e) => setSelectedEventId(e.target.value)} 
                className="w-full max-w-md p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 transition-all outline-none font-medium text-gray-700"
              >
                <option value="">-- Select Event to View Registrations --</option>
                {myEvents?.map(ev => (
                  <option key={ev._id} value={ev._id}>{ev.name} ({ev.status})</option>
                ))}
              </select>
            </div>
            
            {selectedEventId && (
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                      <th className="p-5 font-semibold">Student Name</th>
                      <th className="p-5 font-semibold">Roll No</th>
                      <th className="p-5 font-semibold">Status</th>
                      <th className="p-5 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/80 bg-white/60">
                    {registrations?.map(rec => (
                      <tr key={rec.student._id} className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-transparent transition-all duration-200">
                        <td className="p-5 font-medium text-gray-800">{rec.student.name}</td>
                        <td className="p-5">{rec.student.userId}</td>
                        <td className="p-5">
                          {rec.isPresent ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-sm">
                              ✅ Present
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-800 font-semibold text-sm">
                              ❌ Absent
                            </span>
                          )}
                        </td>
                        <td className="p-5 text-center">
                          <button
                            onClick={() => updateAttnMutation.mutate({ 
                              eventId: selectedEventId, 
                              studentId: rec.student._id, 
                              isPresent: !rec.isPresent 
                            })}
                            className={`px-5 py-2.5 text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 ${
                              rec.isPresent 
                                ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:shadow-red-500/30' 
                                : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:shadow-emerald-500/30'
                            }`}
                          >
                            {rec.isPresent ? 'Mark Absent' : 'Mark Present'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!registrations || registrations.length === 0) && (
                      <tr>
                        <td colSpan="4" className="p-12 text-center text-gray-400 text-lg">
                          🧑‍🎓 No student registrations found for this event
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ============ CHANGE PASSWORD ============ */}
      {activeSection === 'change-password' && (
        <div className={`max-w-md mx-auto ${sectionVariants}`}>
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md p-8 rounded-3xl">
            <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
              🔐 Change Password
            </h3>
            <form onSubmit={passSubmit((data) => { 
              if(data.newPassword !== data.confirmPassword) return toast.error('Passwords do not match'); 
              changePasswordMutation.mutate({ currentPassword: data.currentPassword, newPassword: data.newPassword }); 
            })} className="space-y-5">
              <input 
                {...passReg('currentPassword')} 
                type="password" 
                placeholder="Current Password" 
                required 
                className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 transition-all outline-none" 
              />
              <input 
                {...passReg('newPassword')} 
                type="password" 
                placeholder="New Password (min 6 chars)" 
                required 
                minLength={6} 
                className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 transition-all outline-none" 
              />
              <input 
                {...passReg('confirmPassword')} 
                type="password" 
                placeholder="Confirm New Password" 
                required 
                minLength={6} 
                className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-200 transition-all outline-none" 
              />
              <button 
                type="submit" 
                className="w-full py-3.5 mt-2 text-white font-bold rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98]"
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