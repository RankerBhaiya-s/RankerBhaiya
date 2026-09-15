import { HashRouter, Routes, Route } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { RootLayout } from "./layouts/RootLayout";

/* =====================================================
   HOME
===================================================== */

import { Home } from "./pages/Home";

/* =====================================================
   STUDENT
===================================================== */

import { StudentLogin } from "./pages/student/Login";
import { StudentDashboard } from "./pages/student/Dashboard";
import { StudentProfile } from "./pages/student/Profile";
import { StudentSyllabus } from "./pages/student/Syllabus";
import { AskVidhya } from "./pages/student/AskVidhya";
import { DailyNewspaper } from "./pages/student/DailyNewspaper";
import WeeklyCurrentAffairs from "./pages/student/WeeklyCurrentAffairs";
import { CurrentAffairDetail } from "./pages/student/CurrentAffairDetail";
import { FastRevision } from "./pages/student/FastRevision";
import Vocabulary from "./pages/student/Vocabulary";
import ExamTips from "./pages/student/ExamTips";
import StudyPlanner from "./pages/student/StudyPlanner";
import PracticeQuestions from "./pages/student/PracticeQuestions";
import ProgressTracker from "./pages/student/ProgressTracker";
import DailyChallenge from "./pages/student/DailyChallenge";

/* =====================================================
   ADMIN
===================================================== */

import { AdminLogin } from "./pages/admin/Login";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminCurrentAffairs } from "./pages/admin/AdminCurrentAffairs";
import AdminNewspaper from "./pages/admin/AdminNewspaper";

/* =====================================================
   OTHER
===================================================== */

import { NotFound } from "./pages/NotFound";

/* =====================================================
   QUERY CLIENT
===================================================== */

const queryClient = new QueryClient();

/* =====================================================
   APP
===================================================== */

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <HashRouter>
            <Routes>

              {/* =================================================
                  ROOT LAYOUT
              ================================================= */}

              <Route element={<RootLayout />}>

                {/* =================================================
                    HOME
                ================================================= */}

                <Route
                  index
                  element={<Home />}
                />

                {/* =================================================
                    STUDENT LOGIN
                ================================================= */}

                <Route
                  path="student/login"
                  element={<StudentLogin />}
                />

                {/* =================================================
                    STUDENT PROTECTED ROUTES
                ================================================= */}

                <Route
                  element={
                    <ProtectedRoute allowedRole="student" />
                  }
                >

                  {/* =================================================
                      DASHBOARD
                  ================================================= */}

                  <Route
                    path="student/dashboard"
                    element={<StudentDashboard />}
                  />

                  {/* =================================================
                      PROFILE
                  ================================================= */}

                  <Route
                    path="student/profile"
                    element={<StudentProfile />}
                  />

                  {/* =================================================
                      SYLLABUS
                  ================================================= */}

                  <Route
                    path="student/syllabus"
                    element={<StudentSyllabus />}
                  />

                  {/* =================================================
                      ASK VIDHYA
                  ================================================= */}

                  <Route
                    path="student/ask"
                    element={<AskVidhya />}
                  />

                  {/* =================================================
                      DAILY NEWSPAPER
                  ================================================= */}

                  <Route
                    path="student/daily-newspaper"
                    element={<DailyNewspaper />}
                  />

                  {/* =================================================
                      CURRENT AFFAIRS
                  ================================================= */}

                  <Route
                    path="student/current-affairs"
                    element={<WeeklyCurrentAffairs />}
                  />

                  {/* =================================================
                      CURRENT AFFAIR DETAIL
                  ================================================= */}

                  <Route
                    path="student/current-affairs/:id"
                    element={<CurrentAffairDetail />}
                  />

                  {/* =================================================
                      FAST REVISION
                  ================================================= */}

                  <Route
                    path="student/quick-revision"
                    element={<FastRevision />}
                  />

                  {/* =================================================
                      VOCABULARY
                  ================================================= */}

                  <Route
                    path="student/vocabulary"
                    element={<Vocabulary />}
                  />

                  {/* =================================================
                      EXAM TIPS
                  ================================================= */}

                  <Route
                    path="student/exam-tips"
                    element={<ExamTips />}
                  />

                  {/* =================================================
                      STUDY PLANNER
                  ================================================= */}

                  <Route
                    path="student/study-planner"
                    element={<StudyPlanner />}
                  />

                  {/* =================================================
                      PRACTICE QUESTIONS
                  ================================================= */}

                  <Route
                    path="student/practice-questions"
                    element={<PracticeQuestions />}
                  />

                  {/* =================================================
                      PROGRESS TRACKER
                  ================================================= */}

                  <Route
                    path="student/progress"
                    element={<ProgressTracker />}
                  />

                  {/* =================================================
                      DAILY CHALLENGE
                  ================================================= */}

                  <Route
                    path="student/daily-challenge"
                    element={<DailyChallenge />}
                  />

                </Route>

                {/* =================================================
                    ADMIN LOGIN
                ================================================= */}

                <Route
                  path="admin/login"
                  element={<AdminLogin />}
                />

                {/* =================================================
                    ADMIN PROTECTED ROUTES
                ================================================= */}

                <Route
                  element={
                    <ProtectedRoute allowedRole="admin" />
                  }
                >

                  {/* =================================================
                      ADMIN DASHBOARD
                  ================================================= */}

                  <Route
                    path="admin/dashboard"
                    element={<AdminDashboard />}
                  />

                  {/* =================================================
                      ADMIN CURRENT AFFAIRS
                  ================================================= */}

                  <Route
                    path="admin/current-affairs"
                    element={<AdminCurrentAffairs />}
                  />

                  {/* =================================================
                      ADMIN NEWSPAPER
                  ================================================= */}

                  <Route
                    path="admin/newspaper"
                    element={<AdminNewspaper />}
                  />

                </Route>

                {/* =================================================
                    404
                ================================================= */}

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
