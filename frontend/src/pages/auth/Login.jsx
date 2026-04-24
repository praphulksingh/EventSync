import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

const loginSchema = z.object({
  userId: z.string().min(1, { message: "ID is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const roleColors = {
  student: {
    borderFocus: 'focus:border-blue-500 focus:ring-blue-200',
    gradientBtn: 'from-blue-600 to-cyan-600',
    hoverBtn: 'hover:shadow-blue-500/25',
  },
  faculty: {
    borderFocus: 'focus:border-orange-500 focus:ring-orange-200',
    gradientBtn: 'from-orange-600 to-amber-600',
    hoverBtn: 'hover:shadow-orange-500/25',
  },
  hod: {
    borderFocus: 'focus:border-purple-500 focus:ring-purple-200',
    gradientBtn: 'from-purple-600 to-indigo-600',
    hoverBtn: 'hover:shadow-purple-500/25',
  },
};

export default function Login() {
  const [activeRole, setActiveRole] = useState('student');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({ resolver: zodResolver(loginSchema) });

  const loginMutation = useMutation({
    mutationFn: async (data) => (await api.post('/auth/login', data)).data,
    onSuccess: (data) => {
      const dbRole = data.user.role;
      if (dbRole !== activeRole) {
        toast.error(`Access Denied: You are registered as a ${dbRole.toUpperCase()}, but you are using the ${activeRole.toUpperCase()} tab.`);
        return;
      }
      setAuth(data.token, dbRole);
      navigate(`/${dbRole}-dashboard`);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Login failed. Check your credentials.'),
  });

  const onSubmit = (data) => loginMutation.mutate(data);
  const handleRoleSwitch = (role) => { setActiveRole(role); reset(); };

  const currentColors = roleColors[activeRole];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 -left-10 w-72 h-72 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-0 -right-10 w-72 h-72 bg-gradient-to-r from-amber-300 to-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />

      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
          {/* Gradient top accent */}
          <div className={`h-2 w-full bg-gradient-to-r ${currentColors.gradientBtn}`} />

          <CardHeader className="text-center pt-8 pb-4 space-y-2">
            <div className="text-5xl mb-2">🎉</div>
            <CardTitle className="text-3xl font-extrabold">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600">
                SPAV SmartEvent
              </span>
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium">
              Select your role to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            {/* Role Tabs */}
            <div className="flex gap-2 mb-6 bg-gray-100/80 p-1.5 rounded-2xl">
              {['student', 'faculty', 'hod'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSwitch(role)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                    activeRole === role
                      ? 'text-white shadow-lg scale-[1.02]'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200/60'
                  } ${
                    activeRole === role
                      ? role === 'student'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600'
                        : role === 'faculty'
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                      : ''
                  }`}
                >
                  {role === 'student' ? '🎓 Student' : role === 'faculty' ? '👩‍🏫 Faculty' : '📊 HOD'}
                </button>
              ))}
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600">
                  {activeRole === 'student' ? 'Roll Number' : activeRole === 'faculty' ? 'Employee ID' : 'HOD ID'}
                </label>
                <input
                  {...register('userId')}
                  type="text"
                  className={`w-full p-3 bg-white border-2 border-gray-200 rounded-xl transition-all outline-none ${currentColors.borderFocus} focus:ring-4 placeholder:text-gray-400`}
                  placeholder={`Enter your ID`}
                />
                {errors.userId && <p className="text-red-500 text-xs mt-1">{errors.userId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  className={`w-full p-3 bg-white border-2 border-gray-200 rounded-xl transition-all outline-none ${currentColors.borderFocus} focus:ring-4 placeholder:text-gray-400`}
                  placeholder="Enter password"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loginMutation.isLoading}
                className={`w-full py-3.5 mt-2 text-white font-bold rounded-xl bg-gradient-to-r ${currentColors.gradientBtn} shadow-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-xl ${currentColors.hoverBtn}`}
              >
                {loginMutation.isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  '🚀 Login'
                )}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}