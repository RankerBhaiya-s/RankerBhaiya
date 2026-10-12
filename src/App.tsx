import { HashRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RootLayout } from "./layouts/RootLayout";

// Public Pages
import { Home } from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { NotFound } from "./pages/NotFound";

// Student Pages
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

// Admin Pages
import { AdminLogin } from "./pages/admin/Login";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminCurrentAffairs } from "./pages/admin/AdminCurrentAffairs";
import AdminNewspaper from "./pages/admin/AdminNewspaper";
import AdminNCERT from "./pages/admin/AdminNCERT";
import AdminPreviousYearPapers from "./pages/admin/AdminPreviousYearPapers";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <HashRouter>
            <Routes>
              <Route element={<RootLayout />}>
                {/* Public */}
                <Route index element={<Home />} />
                <Route path="about" element={<AboutUs />} />
                <Route path="contact" element={<ContactUs />} />
                <Route
                  path="privacy-policy"
                  element={<PrivacyPolicy />}
                />

                {/* Student Login */}
                <Route
                  path="student/login"
                  element={<StudentLogin />}
                />

                {/* Protected Student Routes */}
                <Route element={<ProtectedRoute allowedRole="student" />}>
                  <Route
                    path="student/dashboard"
                    element={<StudentDashboard />}
                  />
                  <Route
                    path="student/profile"
                    element={<StudentProfile />}
                  />
                  <Route
                    path="student/settings"
                    element={<Settings />}
                  />
                  <Route
                    path="student/syllabus"
                    element={<StudentSyllabus />}
                  />
                  <Route
                    path="student/ask"
                    element={<AskVidhya />}
                  />
                  <Route
                    path="student/handwritten-notes"
                    element={<HandwrittenNotes />}
                  />

                  {/* Current Affairs */}
                  <Route
                    path="student/current-affairs"
                    element={<WeeklyCurrentAffairs />}
                  />
                  <Route
                    path="student/current-affairs/:id"
                    element={<CurrentAffairDetail />}
                  />

                  {/* Newspaper */}
                  <Route
                    path="student/daily-newspaper"
                    element={<DailyNewspaper />}
                  />

                  {/* Revision */}
                  <Route
                    path="student/fast-revision"
                    element={<FastRevision />}
                  />

                  {/* Learning Tools */}
                  <Route
                    path="student/vocabulary"
                    element={<Vocabulary />}
                  />
                  <Route
                    path="student/exam-tips"
                    element={<ExamTips />}
                  />
                  <Route
                    path="student/study-planner"
                    element={<StudyPlanner />}
                  />
                  <Route
                    path="student/practice-questions"
                    element={<PracticeQuestions />}
                  />
                  <Route
                    path="student/progress"
                    element={<ProgressTracker />}
                  />
                  <Route
                    path="student/daily-challenge"
                    element={<DailyChallenge />}
                  />
                  <Route
                    path="student/short-videos"
                    element={<ShortVideos />}
                  />

                  {/* Exam Resources */}
                  <Route
                    path="student/ncert-books"
                    element={<NCERTBooks />}
                  />
                  <Route
                    path="student/previous-year-papers"
                    element={<PreviousYearPapers />}
                  />
                </Route>

                {/* Admin Login */}
                <Route
                  path="admin/login"
                  element={<AdminLogin />}
                />

                {/* Protected Admin Routes */}
                <Route element={<ProtectedRoute allowedRole="admin" />}>
                  <Route
                    path="admin/dashboard"
                    element={<AdminDashboard />}
                  />
                  <Route
                    path="admin/current-affairs"
                    element={<AdminCurrentAffairs />}
                  />
                  <Route
                    path="admin/newspaper"
                    element={<AdminNewspaper />}
                  />
                  <Route
                    path="admin/ncert"
                    element={<AdminNCERT />}
                  />
                  <Route
                    path="admin/previous-year-papers"
                    element={<AdminPreviousYearPapers />}
                  />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </HashRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
