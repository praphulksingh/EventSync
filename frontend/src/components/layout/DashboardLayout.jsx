import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
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
  FileText 
} from 'lucide-react';

export default function DashboardLayout({ children, role, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  // CRITICAL FIX: Properly declare the themes object first so it doesn't crash React
  const themes = {
    student: { text: 'text-blue-600', bgHover: 'hover:bg-blue-50', activeBg: 'bg-blue-600', appBg: 'bg-gray-50' },
    faculty: { text: 'text-orange-600', bgHover: 'hover:bg-orange-50', activeBg: 'bg-orange-600', appBg: 'bg-gray-50' },
    hod: { text: 'text-purple-600', bgHover: 'hover:bg-purple-50', activeBg: 'bg-purple-600', appBg: 'bg-gray-50' }
  };

  // Then assign the current theme safely
  const currentTheme = themes[role] || themes.student;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
      { id: 'create-user', label: 'Create User', icon: UserPlus }, 
      { id: 'attendance', label: 'Overall Attendance', icon: Users },
      { id: 'certificates', label: 'Certificates', icon: Award },
    ]
  };

  // Safely get the active tab
  const activeTab = location.hash.replace('#', '') || 'dashboard';

  return (
    <div className={`flex h-screen overflow-hidden text-[#24292e] font-sans ${currentTheme.appBg}`}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white p-5 flex flex-col shadow-lg transform transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="text-center mb-8">
          <h2 className={`text-2xl font-bold ${currentTheme.text} capitalize`}>{role} Portal</h2>
        </div>

        <nav className="flex-1">
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
                      ${isActive ? `${currentTheme.activeBg} text-white` : `text-[#6a737d] ${currentTheme.bgHover} hover:text-gray-900`}`}
                  >
                    <Icon className="w-5 h-5 mr-4" />
                    {item.label}
                  </a>
                </li>
              );
            })}
            
            {/* Change Password is common for all roles */}
            <li className="mt-8 border-t pt-4">
              <a 
                href="#change-password" 
                onClick={() => setSidebarOpen(false)} 
                className={`flex items-center p-3 rounded-lg font-medium transition-colors duration-300 text-[#6a737d] ${currentTheme.bgHover} hover:text-gray-900`}
              >
                <KeyRound className="w-5 h-5 mr-4" /> Change Password
              </a>
            </li>
          </ul>
        </nav>

        <button onClick={handleLogout} className="mt-auto flex items-center justify-center p-3 bg-[#fde2e4] text-[#dc3545] rounded-lg font-semibold hover:bg-[#f7d1d3] transition-colors">
          <LogOut className="w-5 h-5 mr-2" /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5 lg:p-8 overflow-y-auto w-full">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold capitalize">{title || activeTab.replace('-', ' ')}</h1>
          <button className="lg:hidden p-2" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {children}
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}