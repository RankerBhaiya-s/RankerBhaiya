import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getDailyMindset } from "../../data/dailyMindsets";

export function StudentDashboard() {
  const navigate = useNavigate();

  const {
    user,
    profile,
    loading: authLoading,
    signOut,
  } = useAuth();

  const { theme } = useTheme();

  const isDark = theme === "dark";

  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef =
    useRef<HTMLDivElement | null>(null);

  const studentName =
    profile?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Student";

  const dailyMindset = getDailyMindset();

  useEffect(() => {
    document.title =
      "Student Dashboard | Ranker Bhaiya";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/student/login", {
        replace: true,
      });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node,
        )
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  async function handleSignOut() {
    await signOut();

    navigate("/student/login", {
      replace: true,
    });
  }

  if (authLoading) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          isDark
            ? "bg-slate-950 text-white"
            : "bg-slate-50 text-slate-900"
        }`}
      >
        <div className="text-center">
          <div className="mb-4 animate-pulse text-5xl">
            📚
          </div>

          <p className="font-semibold">
            Loading Ranker Bhaiya...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const profileIncomplete =
    !profile?.full_name ||
    !profile?.class_name ||
    !profile?.board ||
    !profile?.exam;

  /*
   * =========================================================
   * PREPARATION TOOLS
   *
   * Progress Tracker is intentionally NOT here.
   * It exists only in the top-right header.
   *
   * Daily Challenge is also intentionally NOT here.
   * It exists only in the large Daily Practice section below.
   * =========================================================
   */

  const preparationTools = [
    {
      title: "Study Planner",
      description:
        "Plan your study sessions and stay consistent.",
      icon: "📅",
      color:
        "from-blue-500 to-cyan-500",
      path: "/student/study-planner",
    },

    {
      title: "Practice Questions",
      description:
        "Practice exam-style questions and improve accuracy.",
      icon: "📝",
      color:
        "from-violet-500 to-purple-600",
      path: "/student/practice-questions",
    },
  ];

  /*
   * =========================================================
   * LEARNING HUB
   * =========================================================
   */

  const learningItems = [
    {
      title: "Fast Revision",
      description:
        "Quickly revise important topics and facts.",
      icon: "⚡",
      color:
        "from-yellow-400 to-orange-500",
      path: "/student/quick-revision",
    },

    {
      title: "Daily Current Affairs",
      description:
        "Stay updated with important national and international news.",
      icon: "📰",
      color:
        "from-indigo-500 to-blue-600",
      path: "/student/current-affairs",
    },

    {
      title: "Daily Newspaper",
      description:
        "Read daily newspapers and stay informed.",
      icon: "📖",
      color:
        "from-purple-500 to-fuchsia-600",
      path: "/student/daily-newspaper",
    },

    {
      title: "English Vocabulary",
      description:
        "Build vocabulary with words, idioms and more.",
      icon: "🔤",
      color:
        "from-cyan-500 to-blue-600",
      path: "/student/vocabulary",
    },

    {
      title: "Exam Tips",
      description:
        "Practical strategies for smarter exam preparation.",
      icon: "🎯",
      color:
        "from-green-500 to-emerald-600",
      path: "/student/exam-tips",
    },
  ];

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          isDark
            ? "border-white/10 bg-slate-950/90"
            : "border-slate-200 bg-white/90"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* BRAND */}

          <button
            onClick={() =>
              navigate("/student/dashboard")
            }
            className="text-left"
          >
            <p className="text-lg font-black tracking-tight sm:text-xl">
              Ranker Bhaiya
            </p>

            <p
              className={`text-[10px] sm:text-xs ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Aapki Mehnat, Hamari Strategy
            </p>
          </button>

          {/* RIGHT SIDE */}

          <div className="flex items-center gap-2 sm:gap-3">
            {/* =================================================
                PROGRESS TRACKER
                ONLY ONE PLACE ON DASHBOARD
            ================================================= */}

            <button
              onClick={() =>
                navigate("/student/progress")
              }
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition sm:px-4 sm:text-sm ${
                isDark
                  ? "bg-white/10 text-white hover:bg-white/15"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>📊</span>

              <span className="hidden sm:inline">
                Progress
              </span>
            </button>

            {/* =================================================
                PROFILE MENU
            ================================================= */}

            <div
              ref={menuRef}
              className="relative"
            >
              <button
                onClick={() =>
                  setMenuOpen(
                    (value) => !value,
                  )
                }
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 px-2 py-1.5 text-white shadow-lg sm:gap-2 sm:px-3 sm:py-2"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-xs font-black sm:h-8 sm:w-8">
                  {studentName
                    .charAt(0)
                    .toUpperCase()}
                </span>

                <span className="hidden max-w-32 truncate text-sm font-bold sm:block">
                  {studentName}
                </span>

                <span className="text-[10px]">
                  {menuOpen
                    ? "▲"
                    : "▼"}
                </span>
              </button>

              {menuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border shadow-2xl ${
                    isDark
                      ? "border-white/10 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div
                    className={`border-b px-4 py-3 ${
                      isDark
                        ? "border-white/10"
                        : "border-slate-100"
                    }`}
                  >
                    <p className="truncate text-sm font-black">
                      {studentName}
                    </p>

                    <p
                      className={`mt-1 truncate text-xs ${
                        isDark
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      {user.email}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(
                        "/student/profile",
                      );
                    }}
                    className={`w-full px-4 py-3 text-left text-sm font-semibold ${
                      isDark
                        ? "hover:bg-white/5"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    👤 Profile
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(
                        "/student/progress",
                      );
                    }}
                    className={`w-full px-4 py-3 text-left text-sm font-semibold ${
                      isDark
                        ? "hover:bg-white/5"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    📊 Progress
                  </button>

                  <button
                    onClick={handleSignOut}
                    className={`w-full border-t px-4 py-3 text-left text-sm font-bold text-red-500 ${
                      isDark
                        ? "border-white/10 hover:bg-red-500/10"
                        : "border-slate-100 hover:bg-red-50"
                    }`}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">

        {/* ===================================================
            COMPACT WELCOME HERO
            + DAILY MINDSET INSIDE HERO
        =================================================== */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 px-5 py-6 text-white shadow-2xl sm:px-7 sm:py-7 lg:px-8">
          {/* Decorative blobs */}

          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

          <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-fuchsia-400/20 blur-3xl" />

          <div className="relative z-10">

            {/* Welcome Badge */}

            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-black tracking-wide backdrop-blur sm:text-xs">
              👋 WELCOME BACK
            </span>

            {/* Heading */}

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Hello, {studentName}! 👋
            </h1>

            {/* Description */}

            <p className="mt-2 max-w-2xl text-xs leading-6 text-indigo-100 sm:text-sm sm:leading-6">
              Ranker Bhaiya brings learning resources,
              current affairs, and AI-powered guidance
              together in one place — helping you learn
              smarter, stay ahead, and prepare with
              confidence.
            </p>

            {/* Profile Chips */}

            <div className="mt-4 flex flex-wrap gap-2">
              {profile?.class_name && (
                <span className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-bold backdrop-blur sm:text-xs">
                  🎓 {profile.class_name}
                </span>
              )}

              {profile?.board && (
                <span className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-bold backdrop-blur sm:text-xs">
                  🏫 {profile.board}
                </span>
              )}

              {profile?.exam && (
                <span className="rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-bold backdrop-blur sm:text-xs">
                  🎯 {profile.exam}
                </span>
              )}
            </div>

            {/* =================================================
                DAILY MINDSET
                NOW INSIDE HERO
            ================================================= */}

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 backdrop-blur-md sm:px-4">
              {/* Icon */}

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg shadow-inner sm:h-11 sm:w-11">
                🧠
              </div>

              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[8px] font-black tracking-wide sm:text-[9px]">
                    DAILY MINDSET
                  </span>

                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[8px] font-black tracking-wide sm:text-[9px]">
                    ☀️ TODAY'S THOUGHT
                  </span>
                </div>

                <p className="text-xs font-extrabold leading-5 text-white sm:text-sm">
                  {dailyMindset.en}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            PROFILE COMPLETION
        =================================================== */}

        {profileIncomplete && (
          <section
            className={`mt-5 rounded-2xl border p-5 ${
              isDark
                ? "border-amber-500/20 bg-amber-500/5"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-black">
                  Complete your profile
                </h2>

                <p
                  className={`mt-1 text-sm ${
                    isDark
                      ? "text-slate-400"
                      : "text-slate-600"
                  }`}
                >
                  Add your class, board and exam
                  details for a better Ranker
                  Bhaiya experience.
                </p>
              </div>

              <button
                onClick={() =>
                  navigate(
                    "/student/profile",
                  )
                }
                className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-amber-600"
              >
                Complete Profile
              </button>
            </div>
          </section>
        )}

        {/* ===================================================
            PREPARATION TOOLS
        =================================================== */}

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-black sm:text-2xl">
              Your Preparation Tools
            </h2>

            <p
              className={`mt-1 text-xs sm:text-sm ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Tools designed to keep your
              preparation organized and consistent.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {preparationTools.map(
              (tool) => (
                <button
                  key={tool.title}
                  onClick={() =>
                    navigate(tool.path)
                  }
                  className={`group rounded-3xl border p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    isDark
                      ? "border-white/10 bg-slate-900 hover:border-indigo-500/30"
                      : "border-slate-200 bg-white hover:border-indigo-200"
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.color} text-2xl shadow-lg`}
                  >
                    {tool.icon}
                  </div>

                  <h3 className="mt-4 font-black">
                    {tool.title}
                  </h3>

                  <p
                    className={`mt-2 text-sm leading-6 ${
                      isDark
                        ? "text-slate-400"
                        : "text-slate-500"
                    }`}
                  >
                    {tool.description}
                  </p>

                  <span className="mt-4 inline-flex text-xs font-black text-indigo-500">
                    Open →
                  </span>
                </button>
              ),
            )}
          </div>
        </section>

        {/* ===================================================
            LEARNING HUB
        =================================================== */}

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-black sm:text-2xl">
              Learning Hub
            </h2>

            <p
              className={`mt-1 text-xs sm:text-sm ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Learn, revise and stay updated every day.
            </p>
          </div>

          {/* =================================================
              ASK VIDHYA FEATURED CARD
          ================================================= */}

          <button
            onClick={() =>
              navigate("/student/ask")
            }
            className="group relative mb-4 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-5 text-left text-white shadow-xl shadow-purple-500/20 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/30 sm:p-6"
          >
            {/* Decorative Glow */}

            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/15 blur-3xl" />

            <div className="absolute -bottom-16 right-20 h-32 w-32 rounded-full bg-pink-400/20 blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl shadow-inner backdrop-blur">
                    🤖
                  </div>

                  <div>
                    <span className="inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[9px] font-black tracking-wider backdrop-blur">
                      AI ASSISTANT
                    </span>

                    <h3 className="mt-1 text-xl font-black sm:text-2xl">
                      Ask Vidhya
                    </h3>
                  </div>
                </div>

                <span className="hidden rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black sm:block">
                  SMART LEARNING
                </span>
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
                Your personal AI learning assistant.
                Ask questions, understand concepts
                and learn smarter with AI-powered
                guidance.
              </p>

              <div className="mt-5 inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-xs font-black text-purple-700 shadow-lg transition group-hover:scale-[1.02]">
                Ask Vidhya →
              </div>
            </div>
          </button>

          {/* =================================================
              OTHER LEARNING ITEMS
          ================================================= */}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {learningItems.map(
              (item) => (
                <button
                  key={item.title}
                  onClick={() =>
                    navigate(item.path)
                  }
                  className={`group rounded-3xl border p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    isDark
                      ? "border-white/10 bg-slate-900 hover:border-indigo-500/30"
                      : "border-slate-200 bg-white hover:border-indigo-200"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-xl shadow-lg`}
                    >
                      {item.icon}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-black">
                        {item.title}
                      </h3>

                      <p
                        className={`mt-1.5 text-sm leading-6 ${
                          isDark
                            ? "text-slate-400"
                            : "text-slate-500"
                        }`}
                      >
                        {item.description}
                      </p>

                      <span className="mt-3 inline-block text-xs font-black text-indigo-500">
                        Explore →
                      </span>
                    </div>
                  </div>
                </button>
              ),
            )}
          </div>
        </section>

        {/* ===================================================
            DAILY CHALLENGE
            ONLY ONE PLACE
        =================================================== */}

        <section className="mt-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 p-6 text-white shadow-2xl sm:p-8">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black">
                  🔥 DAILY PRACTICE
                </span>

                <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                  Challenge Yourself. Improve Every Day.
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
                  Practice questions, check your
                  accuracy and build a consistent
                  study habit.
                </p>
              </div>

              <button
                onClick={() =>
                  navigate(
                    "/student/daily-challenge",
                  )
                }
                className="shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-black text-red-600 shadow-xl transition hover:scale-[1.02]"
              >
                Start Challenge →
              </button>
            </div>
          </div>
        </section>

        {/* ===================================================
            ABOUT
        =================================================== */}

        <section className="mt-8 pb-8">
          <div
            className={`rounded-3xl border p-6 sm:p-8 ${
              isDark
                ? "border-white/10 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-2xl">
                🚀
              </div>

              <div>
                <h2 className="text-xl font-black">
                  About Ranker Bhaiya
                </h2>

                <p
                  className={`mt-3 text-sm leading-7 ${
                    isDark
                      ? "text-slate-400"
                      : "text-slate-600"
                  }`}
                >
                  Ranker Bhaiya is a student-focused
                  learning platform built to make exam
                  preparation simpler, smarter, and more
                  effective. From daily current affairs
                  and newspaper reading to fast revision,
                  vocabulary building, and AI-powered
                  learning support, everything is designed
                  to help students stay consistent, learn
                  with clarity, and prepare with confidence.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer
        className={`border-t py-6 ${
          isDark
            ? "border-white/10"
            : "border-slate-200"
        }`}
      >
        <p
          className={`text-center text-xs ${
            isDark
              ? "text-slate-500"
              : "text-slate-400"
          }`}
        >
          © {new Date().getFullYear()} Ranker Bhaiya •
          Aapki Mehnat, Hamari Strategy
        </p>
      </footer>
    </div>
  );
}

export default StudentDashboard;
