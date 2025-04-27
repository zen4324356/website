import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import AdminLogin from './components/AdminLogin';
import UserLogin from './components/UserLogin';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/user-login" replace />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/user-login" element={<UserLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/user" element={<UserDashboard />} />
          </Routes>
          <Toaster />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
