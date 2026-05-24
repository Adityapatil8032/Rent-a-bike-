/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import type { Role } from './types';

const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const MapView = lazy(() => import('./pages/MapView'));
const BikeList = lazy(() => import('./pages/BikeList'));
const BikeDetails = lazy(() => import('./pages/BikeDetails'));
const ScanQR = lazy(() => import('./pages/ScanQR'));
const ActiveRide = lazy(() => import('./pages/ActiveRide'));
const Bookings = lazy(() => import('./pages/History'));
const ChatAssistant = lazy(() => import('./pages/ChatAssistant'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Profile = lazy(() => import('./pages/Account'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

export default function App() {
  const {
    state: { session, profile },
  } = useAppContext();

  const isLoggedIn = session.isAuthenticated;
  const isLoading = session.isLoading;
  const canAccessAdmin = profile.role === 'admin' || profile.role === 'manager';

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={isLoggedIn ? <Navigate to={canAccessAdmin ? '/admin' : '/home'} replace /> : <Login />} />
          <Route path="/home" element={<RouteGate isAllowed={isLoggedIn}><Home /></RouteGate>} />
          <Route path="/map" element={<RouteGate isAllowed={isLoggedIn}><MapView /></RouteGate>} />
          <Route path="/bikes" element={<RouteGate isAllowed={isLoggedIn}><BikeList /></RouteGate>} />
          <Route path="/bikes/:bikeId" element={<RouteGate isAllowed={isLoggedIn}><BikeDetails /></RouteGate>} />
          <Route path="/scan" element={<RouteGate isAllowed={isLoggedIn}><ScanQR /></RouteGate>} />
          <Route path="/ride" element={<RouteGate isAllowed={isLoggedIn}><ActiveRide /></RouteGate>} />
          <Route path="/bookings" element={<RouteGate isAllowed={isLoggedIn}><Bookings /></RouteGate>} />
          <Route path="/history" element={<Navigate to="/bookings" replace />} />
          <Route path="/chat" element={<RouteGate isAllowed={isLoggedIn}><ChatAssistant /></RouteGate>} />
          <Route path="/favorites" element={<RouteGate isAllowed={isLoggedIn}><Favorites /></RouteGate>} />
          <Route path="/profile" element={<RouteGate isAllowed={isLoggedIn}><Profile /></RouteGate>} />
          <Route path="/account" element={<Navigate to="/profile" replace />} />
          <Route path="/admin" element={<RouteGate isAllowed={canAccessAdmin} fallbackRole={profile.role}><AdminDashboard /></RouteGate>} />
        </Routes>
      </Suspense>
    </Router>
  );
}

function RouteGate({
  isAllowed,
  children,
  fallbackRole,
}: {
  isAllowed: boolean;
  children: ReactNode;
  fallbackRole?: Role;
}) {
  if (!isAllowed) {
    return <Login blockedRole={fallbackRole} />;
  }
  return <>{children}</>;
}

function PageLoader() {
  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center">
      <div className="premium-card px-8 py-7 text-center">
        <div className="mx-auto h-11 w-11 rounded-full border-[3px] border-[#1FA34A]/20 border-t-[#1FA34A] animate-spin"></div>
        <p className="mt-4 text-sm font-semibold text-slate-500">Loading your ride experience...</p>
      </div>
    </div>
  );
}
