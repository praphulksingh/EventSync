import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/api';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuthStore } from '../../store/authStore';

export default function HODDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    setActiveSection(location.hash.replace('#', '') || 'dashboard');
  }, [location]);

  // --- QUERIES ---
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['hodMetrics'],
    queryFn: async () => (await api.get('/events/hod/metrics')).data.data,
  });
  const { data: approvals } = useQuery({
    queryKey: ['hodApprovals'],
    queryFn: async () => (await api.get('/events/hod/approvals')).data.data,
  });
  const { data: attendance } = useQuery({
    queryKey: ['hodAttendance'],
    queryFn: async () => (await api.get('/events/hod/attendance')).data.data,
  });
  const { data: certList } = useQuery({
    queryKey: ['hodCerts'],
    queryFn: async () => (await api.get('/events/hod/certificates/list')).data.data,
  });

  // --- MUTATIONS ---
  const approvalMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/events/hod/approvals/${id}`, { status }),
    onSuccess: (data) => {
      toast.success(data?.message || 'Event status updated successfully!');
      queryClient.invalidateQueries(['hodApprovals', 'hodMetrics', 'certList']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const certMutation = useMutation({
    mutationFn: (eventId) => api.post(`/events/hod/certificates/${eventId}`),
    onSuccess: (data) => {
      toast.success(data?.message || 'Certificates generated!');
      queryClient.invalidateQueries(['hodCerts']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate certificates'),
  });

  // --- CREATE USER MUTATION ---
  const {
    register: userReg,
    handleSubmit: userSubmit,
    reset: userReset,
    watch,
  } = useForm();
  const roleWatch = watch('role', '');

  const createUserMutation = useMutation({
    mutationFn: (data) => api.post('/hod/signup', data),
    onSuccess: (data) => {
      toast.success(data?.message || 'User created successfully!');
      userReset();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create user'),
  });

  const onSubmitUser = (data) => {
    const payload = {
      userId: data.userId,
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      department: data.role === 'student' ? 'N/A' : data.department,
    };
    createUserMutation.mutate(payload);
  };

  // --- CHANGE PASSWORD MUTATION ---
  const { register: passReg, handleSubmit: passSubmit, reset: passReset } = useForm();
  const changePassMutation = useMutation({
    mutationFn: (data) => api.put('/auth/change-password', data),
    onSuccess: () => {
      toast.success('Password updated! Please login again.');
      logout();
      navigate('/login');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Password change failed'),
  });

  // --- Helper: section entrance animation ---
  const sectionVariants = 'animate-fadeIn';

  return (
    <DashboardLayout role="hod" title={activeSection.replace('-', ' ')}>
      {activeSection === 'dashboard' && (
        <div className={`space-y-8 ${sectionVariants}`}>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon="📋"
              title="Pending Approvals"
              value={metricsLoading ? '...' : metrics?.pendingApprovals ?? '0'}
              gradientFrom="from-purple-600"
              gradientTo="to-indigo-600"
            />
            <StatCard
              icon="📅"
              title="Total Events This Month"
              value={metricsLoading ? '...' : metrics?.totalEventsThisMonth ?? '0'}
              gradientFrom="from-pink-600"
              gradientTo="to-rose-600"
            />
            <StatCard
              icon="📊"
              title="Overall Attendance"
              value={metricsLoading ? '...' : (metrics?.overallAttendance ?? '0%')}
              gradientFrom="from-emerald-600"
              gradientTo="to-teal-600"
            />
          </div>
        </div>
      )}

      {activeSection === 'approvals' && (
        <div className={`${sectionVariants}`}>
          <Card className="overflow-hidden border-0 shadow-xl bg-white/70 backdrop-blur-lg">
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                    <th className="p-5 font-semibold">Event</th>
                    <th className="p-5 font-semibold">Proposed By</th>
                    <th className="p-5 font-semibold">Date</th>
                    <th className="p-5 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/80">
                  {(approvals || []).map((ev) => (
                    <tr
                      key={ev._id}
                      className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent transition-all duration-200"
                    >
                      <td className="p-5 font-medium text-gray-800">{ev?.name || 'Unknown Event'}</td>
                      <td className="p-5">{ev?.proposedBy?.name || 'Unknown Faculty'}</td>
                      <td className="p-5">
                        {ev?.date ? new Date(ev.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-5">
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={() =>
                              window.confirm('Approve this event?') &&
                              approvalMutation.mutate({ id: ev._id, status: 'approved' })
                            }
                            className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() =>
                              window.confirm('Reject this event?') &&
                              approvalMutation.mutate({ id: ev._id, status: 'rejected' })
                            }
                            className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg hover:shadow-red-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!approvals || approvals.length === 0) && (
                    <tr>
                      <td colSpan="4" className="p-12 text-center text-gray-400 text-lg">
                        No pending approvals ✨
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeSection === 'create-user' && (
        <div className={`max-w-2xl mx-auto ${sectionVariants}`}>
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md p-8 rounded-3xl">
            <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              👥 Create New Account
            </h3>
            <form onSubmit={userSubmit(onSubmitUser)} className="space-y-5">
              {/* Role Selector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600">Account Role</label>
                <select
                  {...userReg('role', { required: true })}
                  className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all outline-none text-gray-700 font-medium"
                >
                  <option value="">-- Select Role --</option>
                  <option value="student">🎓 Student</option>
                  <option value="faculty">👩‍🏫 Faculty</option>
                </select>
              </div>

              {/* ID + Name row */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">
                    {roleWatch === 'student' ? 'Roll Number' : 'Employee ID'}
                  </label>
                  <input
                    {...userReg('userId', { required: true })}
                    placeholder="e.g. STU101 or FAC202"
                    className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-600">Full Name</label>
                  <input
                    {...userReg('name', { required: true })}
                    placeholder="Full Name"
                    className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600">Email Address</label>
                <input
                  {...userReg('email', { required: true })}
                  type="email"
                  placeholder="Email Address"
                  className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all outline-none"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600">
                  Temporary Password (min 6 characters)
                </label>
                <input
                  {...userReg('password', { required: true })}
                  type="password"
                  placeholder="••••••"
                  minLength="6"
                  className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all outline-none"
                />
              </div>

              {/* Department (only for faculty) */}
              {roleWatch === 'faculty' && (
                <div className="space-y-2 animate-fadeIn">
                  <label className="text-sm font-semibold text-gray-600">Department</label>
                  <input
                    {...userReg('department', { required: true })}
                    placeholder="e.g. Computer Science"
                    className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all outline-none"
                  />
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={createUserMutation.isLoading}
                className="w-full py-3.5 mt-2 text-white font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-purple-500/25 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {createUserMutation.isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Creating...
                  </span>
                ) : (
                  '🚀 Create Account'
                )}
              </button>
            </form>
          </Card>
        </div>
      )}

      {activeSection === 'attendance' && (
        <div className={`${sectionVariants}`}>
          <Card className="overflow-hidden border-0 shadow-xl bg-white/70 backdrop-blur-lg">
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                    <th className="p-5 font-semibold">Event</th>
                    <th className="p-5 font-semibold">Student</th>
                    <th className="p-5 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/80">
                  {(attendance || []).map((rec, i) => (
                    <tr
                      key={i}
                      className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent transition-all duration-200"
                    >
                      <td className="p-5 font-medium text-gray-800">
                        {rec?.event?.name || 'Unknown Event'}
                      </td>
                      <td className="p-5">{rec?.student?.name || 'Unknown Student'}</td>
                      <td className="p-5 text-center">
                        {rec?.isPresent ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-sm">
                            ✅ Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-800 font-semibold text-sm">
                            ❌ Absent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!attendance || attendance.length === 0) && (
                    <tr>
                      <td colSpan="3" className="p-12 text-center text-gray-400 text-lg">
                        No attendance records found 📭
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeSection === 'certificates' && (
        <div className={`${sectionVariants}`}>
          <Card className="overflow-hidden border-0 shadow-xl bg-white/70 backdrop-blur-lg">
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                    <th className="p-5 font-semibold">Event Name</th>
                    <th className="p-5 font-semibold">Date</th>
                    <th className="p-5 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/80">
                  {(certList || []).map((ev) => (
                    <tr
                      key={ev._id}
                      className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent transition-all duration-200"
                    >
                      <td className="p-5 font-medium text-gray-800">
                        {ev?.name || 'Unknown'}
                      </td>
                      <td className="p-5">
                        {ev?.date ? new Date(ev.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-5 text-center">
                        <button
                          onClick={() =>
                            window.confirm(
                              'Generate certificates for all present attendees?'
                            ) && certMutation.mutate(ev._id)
                          }
                          disabled={ev.certificatesGenerated}
                          className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                            ev.certificatesGenerated
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-95'
                          }`}
                        >
                          {ev.certificatesGenerated ? '🗂️ Already Generated' : '🎓 Generate Certificates'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!certList || certList.length === 0) && (
                    <tr>
                      <td colSpan="3" className="p-12 text-center text-gray-400 text-lg">
                        No approved events ready for certificates 🏷️
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeSection === 'change-password' && (
        <div className={`max-w-md mx-auto ${sectionVariants}`}>
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-md p-8 rounded-3xl">
            <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              🔐 Change Password
            </h3>
            <form
              onSubmit={passSubmit((data) => {
                if (data.newPassword !== data.confirmPassword)
                  return toast.error('Passwords do not match');
                changePassMutation.mutate(data);
              })}
              className="space-y-5"
            >
              <input
                {...passReg('currentPassword', { required: true })}
                type="password"
                placeholder="Current Password"
                required
                className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all outline-none"
              />
              <input
                {...passReg('newPassword', { required: true })}
                type="password"
                placeholder="New Password (min 6 characters)"
                required
                minLength="6"
                className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all outline-none"
              />
              <input
                {...passReg('confirmPassword', { required: true })}
                type="password"
                placeholder="Confirm New Password"
                required
                minLength="6"
                className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 transition-all outline-none"
              />
              <button
                type="submit"
                className="w-full py-3.5 mt-2 text-white font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-purple-500/25 transition-all duration-200 active:scale-[0.98]"
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

// --- New Reusable StatCard Component ---
const StatCard = ({ icon, title, value, gradientFrom, gradientTo }) => (
  <div className="group relative overflow-hidden rounded-2xl bg-white/30 backdrop-blur-md border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
    <div
      className={`absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-20 group-hover:opacity-30 transition-opacity duration-300`}
    />
    <div className="relative p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500 tracking-wide">{title}</p>
          <p className="text-4xl font-extrabold text-gray-800">
            {value}
          </p>
        </div>
        <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
    </div>
  </div>
);