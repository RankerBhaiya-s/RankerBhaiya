import { HashRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RootLayout } from "./layouts/RootLayout";

// ─────────────────────────────────────────────
// Public Pages
// ─────────────────────────────────────────────
import { Home } from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";

// ─────────────────────────────────────────────
// Student Pages
// ─────────────────────────────────────────────
import { StudentLogin } from "./pages/student/Login";
import { StudentDashboard } from "./pages/student/Dashboard";
import { StudentProfile } from "./pages/student/Profile";
import Settings from "./pages/student/Settings";
import { StudentSyllabus } from "./pages/student/Syllabus";
import { AskVidhya } from "./pages/student/AskVidhya";
import DailyNewspaper from "./pages/student/DailyNewspaper";
import WeeklyCurrentAffairs from "./pages/student/WeeklyCurrentAffairs";
import { CurrentAffairDetail } from "./pages/student/CurrentAffairDetail";
import { FastRevision } from "./pages/student/FastRevision";
import Vocabulary from "./pages/student/Vocabulary";
import ExamTips from "./pages/student/ExamTips";
import StudyPlanner from "./pages/student/StudyPlanner";
import PracticeQuestions from "./pages/student/PracticeQuestions";
import ProgressTracker from "./pages/student/ProgressTracker";
import DailyChallenge from "./pages/student/DailyChallenge";
import HandwrittenNotes from "./pages/student/HandwrittenNotes";
import ShortVideos from "./pages/student/ShortVideos";
import NCERTBooks from "./pages/student/NCERTBooks";
import PreviousYearPapers from "./pages/student/PreviousYearPapers";

// ─────────────────────────────────────────────
// Admin Pages
// ─────────────────────────────────────────────
import { AdminLogin } from "./pages/admin/Login";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminCurrentAffairs } from "./pages/admin/AdminCurrentAffairs";
import AdminNewspaper from "./pages/admin/AdminNewspaper";
import AdminNCERT from "./pages/admin/AdminNCERT";
import AdminPreviousYearPapers from "./pages/admin/AdminPreviousYearPapers";

// ─────────────────────────────────────────────
// 404
// ─────────────────────────────────────────────
import { NotFound } from "./pages/NotFound";

// ─────────────────────────────────────────────
// React Query
// ─────────────────────────────────────────────
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <HashRouter>
            <Routes>
              {/* ═══════════════════════════════════════
                  ROOT LAYOUT
              ═══════════════════════════════════════ */}
              <Route element={<RootLayout />}>

                {/* ─────────────────────────────────
                    PUBLIC ROUTES
                ───────────────────────────────── */}
                <Route index element={<Home />} />

                <Route
                  path="about"
                  element={<AboutUs />}
                />

                <Route
                  path="contact"
                  element={<ContactUs />}
                />

                <Route
                  path="privacy-policy"
                  element={<PrivacyPolicy />}
                />

                {/* ─────────────────────────────────
                    STUDENT LOGIN
                ───────────────────────────────── */}
                <Route
                  path="student/login"
                  element={<StudentLogin />}
                />

                {/* ═══════════════════════════════════════
                    PROTECTED STUDENT ROUTES
                ═══════════════════════════════════════ */}
                <Route
                  element={
                    <ProtectedRoute allowedRole="student" />
                  }
                >
                  {/* Dashboard */}
                  <Route
                    path="student/dashboard"
                    element={<StudentDashboard />}
                  />

                  {/* Profile */}
                  <Route
                    path="student/profile"
                    element={<StudentProfile />}
                  />

                  {/* Settings */}
                  <Route
                    path="student/settings"
                    element={<Settings />}
                  />

                  {/* Syllabus */}
                  <Route
                    path="student/syllabus"
                    element={<StudentSyllabus />}
                  />

                  {/* Ask Vidhya */}
                  <Route
                    path="student/ask"
                    element={<AskVidhya />}
                  />

                  {/* Handwritten Notes */}
                  <Route
                    path="student/handwritten-notes"
                    element={<HandwrittenNotes />}
                  />

                  {/* Daily Newspaper */}
                  <Route
                    path="student/daily-newspaper"
                    element={<DailyNewspaper />}
                  />

                  {/* Current Affairs */}
                  <Route
                    path="student/current-affairs"
                    element={<WeeklyCurrentAffairs />}
                  />

                  {/* Current Affair Detail */}
                  <Route
                    path="student/current-affairs/:id"
                    element={<CurrentAffairDetail />}
                  />

                  {/* Fast Revision */}
                  <Route
                    path="student/quick-revision"
                    element={<FastRevision />}
                  />

                  {/* Vocabulary */}
                  <Route
                    path="student/vocabulary"
                    element={<Vocabulary />}
                  />

                  {/* Exam Tips */}
                  <Route
                    path="student/exam-tips"
                    element={<ExamTips />}
                  />

                  {/* Study Planner */}
                  <Route
                    path="student/study-planner"
                    element={<StudyPlanner />}
                  />

                  {/* Practice Questions */}
                  <Route
                    path="student/practice-questions"
                    element={<PracticeQuestions />}
                  />

                  {/* Progress Tracker */}
                  <Route
                    path="student/progress"
                    element={<ProgressTracker />}
                  />

                  {/* Daily Challenge */}
                  <Route
                    path="student/daily-challenge"
                    element={<DailyChallenge />}
                  />

                  {/* Short Videos */}
                  <Route
                    path="student/short-videos"
                    element={<ShortVideos />}
                  />

                  {/* NCERT Books */}
                  <Route
                    path="student/ncert-books"
                    element={<NCERTBooks />}
                  />

                  {/* Previous Year Papers */}
                  <Route
                    path="student/previous-year-papers"
                    element={<PreviousYearPapers />}
                  />
                </Route>

                {/* ─────────────────────────────────
                    ADMIN LOGIN
                ───────────────────────────────── */}
                <Route
                  path="admin/login"
                  element={<AdminLogin />}
                />

                {/* ═══════════════════════════════════════
                    PROTECTED ADMIN ROUTES
                ═══════════════════════════════════════ */}
                <Route
                  element={
                    <ProtectedRoute allowedRole="admin" />
                  }
                >
                  {/* Admin Dashboard */}
                  <Route
                    path="admin/dashboard"
                    element={<AdminDashboard />}
                  />

                  {/* Admin Current Affairs */}
                  <Route
                    path="admin/current-affairs"
                    element={<AdminCurrentAffairs />}
                  />

                  {/* Admin Newspaper */}
                  <Route
                    path="admin/newspaper"
                    element={<AdminNewspaper />}
                  />

                  {/* Admin NCERT */}
                  <Route
                    path="admin/ncert"
                    element={<AdminNCERT />}
                  />

                  {/* Admin Previous Year Papers */}
                  <Route
                    path="admin/previous-year-papers"
                    element={<AdminPreviousYearPapers />}
                  />
                </Route>

                {/* ─────────────────────────────────
                    404
                ───────────────────────────────── */}
                <Route
                  path="*"
                  element={<NotFound />}
                />

              </Route>
            </Routes>
          </HashRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
