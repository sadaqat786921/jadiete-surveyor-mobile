import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Device, isSignedIn } from './ui/kit';
import { Splash, Login, Code, Locked, Forgot, Welcome } from './pages/Auth';
import Today from './pages/Today';
import Visits, { Search, Notifications, Missed } from './pages/Visits';
import { SurveyVisit, SurveyFlow, Done, Report, History } from './pages/Survey';
import Inspection from './pages/Inspection';
import Calendar from './pages/Calendar';
import Messages, { Thread } from './pages/Messages';
import Profile, { Details, Work, NotificationsSettings, Connections, Security, Help } from './pages/Profile';

// Jadeite Surveyor — the surveyor's phone app (375 × 812). Same records as the Office Admin, Sales and Surveyor portals.
const OPEN = ['/splash', '/login', '/code', '/locked', '/forgot'];
function Guard({ children }: { children: React.ReactElement }) {
  const loc = useLocation();
  if (!isSignedIn() && !OPEN.includes(loc.pathname)) return <Navigate to="/splash" replace />;
  return children;
}

export default function App() {
  return (
    <Device>
      <Guard>
        <Routes>
          <Route path="/splash" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/code" element={<Code />} />
          <Route path="/locked" element={<Locked />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/welcome/:step" element={<Welcome />} />
          <Route path="/" element={<Today />} />
          <Route path="/visits" element={<Visits />} />
          <Route path="/search" element={<Search />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/visit/:id" element={<SurveyVisit />} />
          <Route path="/survey/:id/:step" element={<SurveyFlow />} />
          <Route path="/report/:id" element={<Report />} />
          <Route path="/done/:kind/:id" element={<Done />} />
          <Route path="/history/:id" element={<History />} />
          <Route path="/missed/:id" element={<Missed />} />
          <Route path="/inspection/:id" element={<Inspection />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Thread />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/details" element={<Details />} />
          <Route path="/profile/work" element={<Work />} />
          <Route path="/profile/notifications" element={<NotificationsSettings />} />
          <Route path="/profile/connections" element={<Connections />} />
          <Route path="/profile/security" element={<Security />} />
          <Route path="/profile/help" element={<Help />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Guard>
    </Device>
  );
}
