import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Page Imports
import StudentDashboard from './pages/student/StudentDashboard';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import HODDashboard from './pages/hod/HODDashboard';
import Login from './pages/auth/Login';
import { ThemeProvider } from './components/ThemeProvider';

const queryClient = new QueryClient();

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRole }) => {
  const { token, role } = useAuthStore();
  if (!token || role !== allowedRole) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '10px',
          },
          success: { style: { background: '#22c55e' } }, // Green for success
          error: { style: { background: '#ef4444' } },   // Red for error
        }} 
      />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/student-dashboard" element={
            <ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>
          }/>
          
          <Route path="/faculty-dashboard" element={
            <ProtectedRoute allowedRole="faculty"><FacultyDashboard /></ProtectedRoute>
          }/>

          <Route path="/hod-dashboard" element={
            <ProtectedRoute allowedRole="hod"><HODDashboard /></ProtectedRoute>
          }/>
        </Routes>
      </Router>
    </QueryClientProvider>
    </ThemeProvider>
  );
}