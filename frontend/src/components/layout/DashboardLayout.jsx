import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../ThemeProvider'; // Required for Dark/Light mode
import { 
  Menu, 
  LogOut, 
  LayoutDashboard, 
  Calendar, 
  CalendarCheck, 
  ClipboardCheck, 
  Award, 
  KeyRound, 
  CalendarPlus, 
  Settings, 
  Users, 
  UserPlus, 
  FileText,
  Sun,
  Moon
} from 'lucide-react';

export default function DashboardLayout({ children, role, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useTheme(); // Extract theme state and toggle function

  // Configured with Tailwind dark mode variants for seamless transitions
  const themes = {
    student: { 
      text: 'text-blue-600 dark:text-blue-400', 
      bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/30', 
      activeBg: 'bg-blue-600 dark:bg-blue-500', 
      appBg: 'bg-gray-50 dark:bg-gray-950' 
    },
    faculty: { 
      text: 'text-orange-600 dark:text-orange-400', 
      bgHover: 'hover:bg-orange-50 dark:hover:bg-orange-900/30', 
      activeBg: 'bg-orange-600 dark:bg-orange-500', 
      appBg: 'bg-gray-50 dark:bg-gray-950' 
    },
    hod: { 
      text: 'text-purple-600 dark:text-purple-400', 
      bgHover: 'hover:bg-purple-50 dark:hover:bg-purple-900/30', 
      activeBg: 'bg-purple-600 dark:bg-purple-500', 
      appBg: 'bg-gray-50 dark:bg-gray-950' 
    }
  };

  const currentTheme = themes[role] || themes.student;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fixed IDs so they match your dashboard components exactly
  const navItems = {
    student: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'events', label: 'View Events', icon: Calendar },
      { id: 'registered-events', label: 'My Registered Events', icon: CalendarCheck },
      { id: 'attendance', label: 'My Attendance', icon: ClipboardCheck },
      { id: 'certificates', label: 'Download Certificates', icon: Award },
    ],
    faculty: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'create-event', label: 'Create Event', icon: CalendarPlus },
      { id: 'manage-events', label: 'Manage Events', icon: Settings },
      { id: 'attendance', label: 'Registrations & Attendance', icon: Users },
    ],
    hod: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'approvals', label: 'Pending Approvals', icon: FileText },
      { id: 'create-user', label: 'Create User', icon: UserPlus }, // FIXED
      { id: 'attendance', label: 'Overall Attendance', icon: Users },
      { id: 'certificates', label: 'Certificates', icon: Award },
    ]
  };

  const activeTab = location.hash.replace('#', '') || 'dashboard';

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${currentTheme.appBg} text-gray-900 dark:text-gray-100`}>
      
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white dark:bg-gray-900 dark:border-r dark:border-gray-800 p-5 flex flex-col shadow-lg transform transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="text-center mb-8">
          <h2 className={`text-2xl font-bold ${currentTheme.text} capitalize`}>{role} Portal</h2>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-2">
            {navItems[role]?.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <a 
                    href={`#${item.id}`}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center p-3 rounded-lg font-medium transition-colors duration-300
                      ${isActive ? `${currentTheme.activeBg} text-white shadow-md` : `text-gray-600 dark:text-gray-400 ${currentTheme.bgHover} hover:text-gray-900 dark:hover:text-white`}`}
                  >
                    <Icon className="w-5 h-5 mr-4 flex-shrink-0" />
                    {item.label}
                  </a>
                </li>
              );
            })}
            
            {/* Common Item: Change Password */}
            <li className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-4">
              <a 
                href="#change-password" 
                onClick={() => setSidebarOpen(false)} 
                className={`flex items-center p-3 rounded-lg font-medium transition-colors duration-300 text-gray-600 dark:text-gray-400 ${currentTheme.bgHover} hover:text-gray-900 dark:hover:text-white`}
              >
                <KeyRound className="w-5 h-5 mr-4 flex-shrink-0" /> Change Password
              </a>
            </li>
          </ul>
        </nav>

        {/* DARK/LIGHT MODE TOGGLE */}
        <button 
          onClick={toggleTheme} 
          className="mt-auto mb-4 flex items-center justify-center p-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 mr-2 text-yellow-500" /> : <Moon className="w-5 h-5 mr-2 text-indigo-500" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>

        {/* LOGOUT BUTTON */}
        <button onClick={handleLogout} className="flex items-center justify-center p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm">
          <LogOut className="w-5 h-5 mr-2 flex-shrink-0" /> Logout
        </button>
      </aside>

      {/* Main App Content Area */}
      <main className="flex-1 p-5 lg:p-8 overflow-y-auto w-full relative">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold capitalize text-gray-900 dark:text-white">
            {title || activeTab.replace('-', ' ')}
          </h1>
          <button className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {children}
      </main>

      {/* Mobile Overlay (Darkens background when mobile sidebar is open) */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}