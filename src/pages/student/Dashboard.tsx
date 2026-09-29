import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getDailyMindset } from "../../data/dailyMindsets";

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const dailyMindset = getDailyMindset();

  /*
   * Demo/local dashboard progress.
   * Later these values can be connected with Supabase activity data.
   */
  const [dailyPractice, setDailyPractice] = useState(12);

  const dailyTarget = 20;

  const practiceProgress = Math.min(
    100,
    Math.round((dailyPractice / dailyTarget) * 100),
  );

  const studentName =
    profile?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Student";

  const firstName = useMemo(() => {
    return studentName.split(" ")[0] || "Student";
  }, [studentName]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/student/login", { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          isDark
            ? "bg-slate-950 text-white"
            : "bg-slate-50 text-slate-900"
        }`}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />

          <p className="text-sm font-medium opacity-70">
            Loading Ranker Bhaiya...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await signOut();
    navigate("/student/login", { replace: true });
  };

  const handleDailyPractice = () => {
    setDailyPractice((current) => Math.min(current + 1, dailyTarget));
    navigate("/student/practice-questions");
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* =========================================================
          HEADER
      ========================================================= */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          isDark
            ? "border-slate-800 bg-slate-950/90"
            : "border-slate-200 bg-white/90"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <button
            type="button"
            onClick={() => navigate("/student/dashboard")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-lg font-black text-white shadow-lg">
              RB
            </div>

            <div className="text-left">
              <div className="text-base font-black tracking-tight">
                Ranker Bhaiya
              </div>

              <div
                className={`text-[10px] font-semibold uppercase tracking-widest ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Aapki Mehnat, Hamari Strategy
              </div>
            </div>
          </button>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            {/* Progress */}
            <button
              type="button"
              onClick={() => navigate("/student/progress")}
              className={`hidden items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition sm:flex ${
                isDark
                  ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>📊</span>
              <span>Progress</span>
            </button>

            {/* Profile Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setShowProfileMenu((current) => !current)
                }
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 transition ${
                  isDark
                    ? "border-slate-700 bg-slate-900 hover:bg-slate-800"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-black text-white">
                  {studentName.charAt(0).toUpperCase()}
                </div>

                <span className="hidden max-w-[120px] truncate text-sm font-bold sm:block">
                  {studentName}
                </span>

                <span className="text-xs opacity-60">⌄</span>
              </button>

              {showProfileMenu && (
                <div
                  className={`absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border shadow-xl ${
                    isDark
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="border-b border-inherit px-4 py-3">
                    <p className="truncate text-sm font-bold">
                      {studentName}
                    </p>

                    <p className="truncate text-xs opacity-60">
                      {user.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate("/student/profile");
                    }}
                    className="block w-full px-4 py-3 text-left text-sm font-semibold transition hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    👤 My Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate("/student/settings");
                    }}
                    className="block w-full px-4 py-3 text-left text-sm font-semibold transition hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    ⚙️ Settings
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full border-t border-inherit px-4 py-3 text-left text-sm font-bold text-red-500 transition hover:bg-red-500/5"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================
          MAIN
      ========================================================= */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* =======================================================
            HERO
        ======================================================= */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-700 to-purple-700 p-5 text-white shadow-xl sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-purple-300/10 blur-3xl" />

          <div className="relative">
            <p className="text-xs font-black tracking-[0.22em] text-blue-100">
              👋 WELCOME BACK
            </p>

            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Hello, {firstName}! 👋
            </h1>

            {/* Daily Mindset */}
            <div className="mt-5 max-w-3xl rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-black tracking-[0.18em] text-blue-100">
                🧠 DAILY MINDSET
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 text-white sm:text-base">
                {dailyMindset.en}
              </p>

              <p className="mt-1 text-sm font-medium leading-6 text-blue-100 sm:text-base">
                {dailyMindset.hi}
              </p>
            </div>
          </div>
        </section>

        {/* =======================================================
            7 DAY STREAK
        ======================================================= */}
        <section className="mt-5">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 p-5 text-white shadow-lg sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-orange-100">
                  Keep Going
                </p>

                <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                  🔥 7 Day Streak
                </h2>

                <p className="mt-1 text-sm text-orange-100">
                  You&apos;ve been consistent for 7 days. Don&apos;t break
                  the streak!
                </p>
              </div>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div
                    key={day}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-black backdrop-blur"
                  >
                    ✓
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =======================================================
            TODAY'S MISSION
        ======================================================= */}
        <section className="mt-6">
          <div
            className={`rounded-3xl border p-5 sm:p-6 ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                  🎯 Today&apos;s Mission
                </p>

                <h2 className="mt-1 text-xl font-black sm:text-2xl">
                  Complete your daily preparation
                </h2>

                <p className="mt-1 text-sm opacity-65">
                  Finish today&apos;s learning activities and keep your
                  preparation moving.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/student/daily-challenge")}
                className="shrink-0 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Start Mission →
              </button>
            </div>
          </div>
        </section>

        {/* =======================================================
            PREPARATION TOOLS
        ======================================================= */}
        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">
              Prepare Smart
            </p>

            <h2 className="mt-1 text-xl font-black sm:text-2xl">
              Preparation Tools
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            {/* Study Planner */}
            <button
              type="button"
              onClick={() => navigate("/student/study-planner")}
              className={`group rounded-3xl border p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900 hover:border-blue-700"
                  : "border-slate-200 bg-white hover:border-blue-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl dark:bg-blue-500/15">
                  📅
                </div>

                <span className="text-lg opacity-40 transition group-hover:translate-x-1">
                  →
                </span>
              </div>

              <h3 className="mt-4 text-lg font-black">
                Study Planner
              </h3>

              <p className="mt-1 text-sm leading-6 opacity-65">
                Plan your study sessions and stay consistent with your
                preparation.
              </p>
            </button>

            {/* Practice Questions */}
            <button
              type="button"
              onClick={() => navigate("/student/practice-questions")}
              className={`group rounded-3xl border p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900 hover:border-purple-700"
                  : "border-slate-200 bg-white hover:border-purple-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-2xl dark:bg-purple-500/15">
                  📝
                </div>

                <span className="text-lg opacity-40 transition group-hover:translate-x-1">
                  →
                </span>
              </div>

              <h3 className="mt-4 text-lg font-black">
                Practice Questions
              </h3>

              <p className="mt-1 text-sm leading-6 opacity-65">
                Practice topic-wise questions and strengthen your concepts.
              </p>
            </button>

            {/* Short Videos */}
            <button
              type="button"
              onClick={() => navigate("/student/short-videos")}
              className={`group rounded-3xl border p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900 hover:border-pink-700"
                  : "border-slate-200 bg-white hover:border-pink-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-2xl dark:bg-pink-500/15">
                  🎬
                </div>

                <span className="text-lg opacity-40 transition group-hover:translate-x-1">
                  →
                </span>
              </div>

              <h3 className="mt-4 text-lg font-black">
                Short Videos
              </h3>

              <p className="mt-1 text-sm leading-6 opacity-65">
                Learn important topics through short, focused video series.
              </p>
            </button>

            {/* Daily Challenge */}
            <button
              type="button"
              onClick={() => navigate("/student/daily-challenge")}
              className={`group rounded-3xl border p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900 hover:border-orange-700"
                  : "border-slate-200 bg-white hover:border-orange-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-2xl dark:bg-orange-500/15">
                  ⚡
                </div>

                <span className="text-lg opacity-40 transition group-hover:translate-x-1">
                  →
                </span>
              </div>

              <h3 className="mt-4 text-lg font-black">
                Daily Challenge
              </h3>

              <p className="mt-1 text-sm leading-6 opacity-65">
                Test yourself every day with quick exam-focused questions.
              </p>
            </button>
          </div>
        </section>

        {/* =======================================================
            LEARNING HUB
        ======================================================= */}
        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-purple-600">
              Learn Every Day
            </p>

            <h2 className="mt-1 text-xl font-black sm:text-2xl">
              Learning Hub
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* ASK VIDHYA FEATURED */}
            <button
              type="button"
              onClick={() => navigate("/student/ask")}
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-left text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:col-span-2 lg:col-span-2"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

              <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-fuchsia-300/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur">
                    🤖
                  </div>

                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider backdrop-blur">
                    AI Learning Assistant
                  </span>
                </div>

                <h3 className="mt-5 text-2xl font-black sm:text-3xl">
                  Ask Vidhya
                </h3>

                <p className="mt-2 max-w-xl text-sm leading-6 text-purple-100 sm:text-base">
                  Doubt ho, concept samajhna ho, revision karna ho ya
                  study guidance chahiye — Vidhya se poochho.
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-purple-700 transition group-hover:bg-purple-50">
                  Ask Vidhya

                  <span className="transition group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </button>

            {/* Fast Revision */}
            <button
              type="button"
              onClick={() => navigate("/student/quick-revision")}
              className={`group rounded-3xl border p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900 hover:border-green-700"
                  : "border-slate-200 bg-white hover:border-green-200"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-2xl dark:bg-green-500/15">
                ⚡
              </div>

              <h3 className="mt-4 font-black">
                Fast Revision
              </h3>

              <p className="mt-1 text-sm leading-6 opacity-65">
                Revise important concepts quickly with smart revision cards
                and MCQs.
              </p>
            </button>

            {/* Current Affairs */}
            <button
              type="button"
              onClick={() => navigate("/student/current-affairs")}
              className={`group rounded-3xl border p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900 hover:border-blue-700"
                  : "border-slate-200 bg-white hover:border-blue-200"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl dark:bg-blue-500/15">
                📰
              </div>

              <h3 className="mt-4 font-black">
                Current Affairs
              </h3>

              <p className="mt-1 text-sm leading-6 opacity-65">
                Stay updated with important national and international
                events.
              </p>
            </button>

            {/* Daily Newspaper */}
            <button
              type="button"
              onClick={() => navigate("/student/daily-newspaper")}
              className={`group rounded-3xl border p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900 hover:border-orange-700"
                  : "border-slate-200 bg-white hover:border-orange-200"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-2xl dark:bg-orange-500/15">
                🗞️
              </div>

              <h3 className="mt-4 font-black">
                Daily Newspaper
              </h3>

              <p className="mt-1 text-sm leading-6 opacity-65">
                Read important newspaper content prepared for exam
                preparation.
              </p>
            </button>

            {/* Vocabulary */}
            <button
              type="button"
              onClick={() => navigate("/student/vocabulary")}
              className={`group rounded-3xl border p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900 hover:border-pink-700"
                  : "border-slate-200 bg-white hover:border-pink-200"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-2xl dark:bg-pink-500/15">
                📚
              </div>

              <h3 className="mt-4 font-black">
                English Vocabulary
              </h3>

              <p className="mt-1 text-sm leading-6 opacity-65">
                Improve vocabulary, idioms, synonyms, antonyms and more.
              </p>
            </button>

            {/* Exam Tips */}
            <button
              type="button"
              onClick={() => navigate("/student/exam-tips")}
              className={`group rounded-3xl border p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900 hover:border-yellow-700"
                  : "border-slate-200 bg-white hover:border-yellow-200"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-100 text-2xl dark:bg-yellow-500/15">
                🎯
              </div>

              <h3 className="mt-4 font-black">
                Exam Tips
              </h3>

              <p className="mt-1 text-sm leading-6 opacity-65">
                Smart strategies for revision, time management and exams.
              </p>
            </button>
          </div>
        </section>

        {/* =======================================================
            YOUR PREPARATION
        ======================================================= */}
        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">
              Your Progress
            </p>

            <h2 className="mt-1 text-xl font-black sm:text-2xl">
              📊 Your Preparation
            </h2>
          </div>

          <div
            className={`rounded-3xl border p-5 sm:p-6 ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {/* Overall */}
              <div className="rounded-2xl bg-blue-500/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold opacity-70">
                    Overall Progress
                  </span>

                  <span className="text-lg">📊</span>
                </div>

                <div className="mt-3 flex items-end justify-between">
                  <span className="text-3xl font-black">
                    68%
                  </span>

                  <span className="text-xs font-bold text-blue-500">
                    Growing
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div className="h-full w-[68%] rounded-full bg-blue-500" />
                </div>
              </div>

              {/* Questions */}
              <div className="rounded-2xl bg-purple-500/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold opacity-70">
                    Questions
                  </span>

                  <span className="text-lg">📝</span>
                </div>

                <p className="mt-3 text-3xl font-black">
                  245
                </p>

                <p className="mt-1 text-xs opacity-60">
                  Questions attempted
                </p>
              </div>

              {/* Accuracy */}
              <div className="rounded-2xl bg-green-500/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold opacity-70">
                    Accuracy
                  </span>

                  <span className="text-lg">🎯</span>
                </div>

                <p className="mt-3 text-3xl font-black">
                  78%
                </p>

                <p className="mt-1 text-xs opacity-60">
                  Overall accuracy
                </p>
              </div>

              {/* Revision */}
              <div className="rounded-2xl bg-orange-500/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold opacity-70">
                    Revision
                  </span>

                  <span className="text-lg">🔄</span>
                </div>

                <p className="mt-3 text-3xl font-black">
                  64%
                </p>

                <p className="mt-1 text-xs opacity-60">
                  Topics revised
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/student/progress")}
              className="mt-5 w-full rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm font-black text-indigo-600 transition hover:bg-indigo-500/15"
            >
              View Full Progress →
            </button>
          </div>
        </section>

        {/* =======================================================
            WEAK TOPICS
        ======================================================= */}
        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-red-500">
              Improve Faster
            </p>

            <h2 className="mt-1 text-xl font-black sm:text-2xl">
              🧠 Weak Topics
            </h2>
          </div>

          <div
            className={`rounded-3xl border p-5 sm:p-6 ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="space-y-4">

              {/* Polity */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black">
                      Polity
                    </p>

                    <p className="text-xs opacity-55">
                      Needs more practice
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-red-500">
                      42%
                    </span>

                    <button
                      type="button"
                      onClick={() => navigate("/student/practice-questions")}
                      className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-black text-red-500 transition hover:bg-red-500/15"
                    >
                      Practice
                    </button>
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div className="h-full w-[42%] rounded-full bg-red-500" />
                </div>
              </div>

              {/* Economy */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black">
                      Economy
                    </p>

                    <p className="text-xs opacity-55">
                      Improve your accuracy
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-orange-500">
                      51%
                    </span>

                    <button
                      type="button"
                      onClick={() => navigate("/student/practice-questions")}
                      className="rounded-lg bg-orange-500/10 px-3 py-1.5 text-xs font-black text-orange-500 transition hover:bg-orange-500/15"
                    >
                      Practice
                    </button>
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div className="h-full w-[51%] rounded-full bg-orange-500" />
                </div>
              </div>

              {/* Geography */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black">
                      Geography
                    </p>

                    <p className="text-xs opacity-55">
                      Almost there
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-yellow-500">
                      58%
                    </span>

                    <button
                      type="button"
                      onClick={() => navigate("/student/practice-questions")}
                      className="rounded-lg bg-yellow-500/10 px-3 py-1.5 text-xs font-black text-yellow-600 transition hover:bg-yellow-500/15"
                    >
                      Practice
                    </button>
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div className="h-full w-[58%] rounded-full bg-yellow-500" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =======================================================
            5 MINUTE CHALLENGE
        ======================================================= */}
        <section className="mt-10">
          <button
            type="button"
            onClick={() => navigate("/student/daily-challenge")}
            className="group relative w-full overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 p-6 text-left text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-7"
          >
            <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-white/10 blur-3xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-blue-100">
                  Quick Learning
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  ⚡ 5-Minute Challenge
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                  Sirf 5 minutes nikalo aur apni preparation ko ek quick
                  boost do.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-black backdrop-blur">
                  5 Minutes
                </span>

                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-black text-blue-700 transition group-hover:translate-x-1">
                  →
                </span>
              </div>
            </div>
          </button>
        </section>

        {/* =======================================================
            DAILY PRACTICE
        ======================================================= */}
        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-orange-500">
              Stay Consistent
            </p>

            <h2 className="mt-1 text-xl font-black sm:text-2xl">
              🔥 Daily Practice
            </h2>
          </div>

          <div
            className={`rounded-3xl border p-5 sm:p-6 ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black">
                  Today&apos;s Question Target
                </p>

                <p className="mt-1 text-xs opacity-60">
                  Complete 20 questions every day.
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-2xl font-black">
                  {dailyPractice}
                  <span className="text-sm opacity-40">
                    /{dailyTarget}
                  </span>
                </p>

                <p className="text-xs font-bold text-orange-500">
                  {practiceProgress}% completed
                </p>
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                style={{ width: `${practiceProgress}%` }}
              />
            </div>

            <button
              type="button"
              onClick={handleDailyPractice}
              className="mt-5 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white transition hover:bg-orange-600"
            >
              Continue Practice →
            </button>
          </div>
        </section>

        {/* =======================================================
            WEEKLY ACHIEVEMENTS
        ======================================================= */}
        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-yellow-600">
              Celebrate Your Progress
            </p>

            <h2 className="mt-1 text-xl font-black sm:text-2xl">
              🏆 Weekly Achievements
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* Streak */}
            <div
              className={`rounded-3xl border p-5 ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-2xl">
                🔥
              </div>

              <h3 className="mt-4 font-black">
                7 Day Streak
              </h3>

              <p className="mt-1 text-xs leading-5 opacity-60">
                You studied consistently for 7 days.
              </p>

              <span className="mt-4 inline-block rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-black text-green-600">
                UNLOCKED
              </span>
            </div>

            {/* Questions */}
            <div
              className={`rounded-3xl border p-5 ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-2xl">
                📝
              </div>

              <h3 className="mt-4 font-black">
                100 Questions
              </h3>

              <p className="mt-1 text-xs leading-5 opacity-60">
                Complete 100 practice questions.
              </p>

              <span className="mt-4 inline-block rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-black text-green-600">
                UNLOCKED
              </span>
            </div>

            {/* Revision */}
            <div
              className={`rounded-3xl border p-5 ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                📚
              </div>

              <h3 className="mt-4 font-black">
                5 Topics Revised
              </h3>

              <p className="mt-1 text-xs leading-5 opacity-60">
                Revise five important topics this week.
              </p>

              <span className="mt-4 inline-block rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-black text-green-600">
                UNLOCKED
              </span>
            </div>

            {/* Accuracy */}
            <div
              className={`rounded-3xl border p-5 ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-2xl">
                🎯
              </div>

              <h3 className="mt-4 font-black">
                80% Accuracy
              </h3>

              <p className="mt-1 text-xs leading-5 opacity-60">
                Reach 80% accuracy in your practice.
              </p>

              <span className="mt-4 inline-block rounded-full bg-yellow-500/10 px-3 py-1 text-[10px] font-black text-yellow-600">
                IN PROGRESS
              </span>
            </div>
          </div>
        </section>

        {/* =======================================================
            ABOUT
        ======================================================= */}
        <section
          className={`mt-10 rounded-3xl border p-6 ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <p className="text-xs font-black uppercase tracking-widest text-blue-600">
            About Ranker Bhaiya
          </p>

          <h2 className="mt-2 text-xl font-black">
            Aapki Mehnat, Hamari Strategy.
          </h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 opacity-70">
            Ranker Bhaiya is a student-focused learning platform built to
            make exam preparation simpler, smarter, and more effective.
            From daily current affairs and newspaper reading to fast
            revision, vocabulary building, short videos and AI-powered
            learning support, everything is designed to help students stay
            consistent, learn with clarity, and prepare with confidence.
          </p>
        </section>
      </main>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer
        className={`mt-12 border-t ${
          isDark ? "border-slate-800" : "border-slate-200"
        }`}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-center text-xs opacity-55 sm:flex-row sm:px-6 lg:px-8 sm:text-left">
          <p>
            © {new Date().getFullYear()} Ranker Bhaiya. All rights reserved.
          </p>

          <p className="font-semibold">
            Aapki Mehnat, Hamari Strategy.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default StudentDashboard;
