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

      {/* Protected base route mounted at "/" so children become "/orders", "/reservations", ... */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      >
        {/* default when visiting "/" send to /orders */}
        <Route index element={<Navigate to="orders" replace />} />
        {routes.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={element}
          />
        ))}
      </Route>

      {/* Root (catch) redirect to /orders */}
      <Route
        path="/"
        element={<Navigate to="/orders" replace />}
      />

      {/* Catch-all: redirect to /orders */}
      <Route path="*" element={<Navigate to="/orders" replace />} />
    </Routes>
  );
};

export default AppRoutes;