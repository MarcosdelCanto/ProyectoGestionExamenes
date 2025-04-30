// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAccessToken } from '../services/authService';

export default function PrivateRoute() {
  return getAccessToken() ? <Outlet /> : <Navigate to="/login" />;
}
