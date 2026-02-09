import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/protectedRoute/ProtectedRoute';
import Home from './components/home/Home';
import { routes } from './routeConfig'; // ensure this exports an array of { path, element, index? }
import Login from './components/login/Login';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected base route - all app pages live under /home */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      >
        {routes.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={element}
          />
        ))}
      </Route>

      {/* Root redirect: go to /home when authenticated, else to /login */}
      <Route
        path="/"
        element={<Navigate to="/home" replace />}
      />

      {/* Catch-all: if user hits unknown path, redirect to /home (protected) */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default AppRoutes;