import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { theme } = useTheme();

  const isDark = theme === "dark";

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const studentName =
    profile?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Student";

  useEffect(() => {
    document.title = "Student Dashboard | Ranker Bhaiya";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/student/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate("/student/login", { replace: true });
  }

  if (authLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark
            ? "bg-slate-950 text-white"
            : "bg-slate-50 text-slate-900"
        }`}
      >
        <div className="text-center">
          <div className="mb-4 text-5xl animate-pulse">
            📚
          </div>

          <p className="font-semibold">
            Loading Ranker Bhaiya...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const profileIncomplete =
    !profile?.full_name ||
    !profile?.class_name ||
    !profile?.board ||
    !profile?.exam;

  const tools = [
    {
      title: "Study Planner",
      description:
        "Plan your study sessions and stay consistent.",
      icon: "📅",
      color: "from-blue-500 to-cyan-500",
      path: "/student/study-planner",
    },
    {
      title: "Practice Questions",
      description:
        "Practice exam-style questions and improve accuracy.",
      icon: "📝",
      color: "from-violet-500 to-purple-600",
      path: "/student/practice-questions",
    },
    {
      title: "Progress Tracker",
      description:
        "Track your preparation and learning progress.",
      icon: "📊",
      color: "from-emerald-500 to-teal-500",
      path: "/student/progress",
    },
    {
      title: "Daily Challenge",
      description:
        "Take a quick daily quiz and test yourself.",
      icon: "🔥",
      color: "from-orange-500 to-red-500",
      path: "/student/daily-challenge",
    },
  ];

  const learningItems = [
    {
      title: "Fast Revision",
      description:
        "Quickly revise important topics and facts.",
      icon: "⚡",
      color: "from-yellow-400 to-orange-500",
      path: "/student/quick-revision",
    },
    {
      title: "Daily Current Affairs",
      description:
        "Stay updated with important national and international news.",
      icon: "📰",
      color: "from-indigo-500 to-blue-600",
      path: "/student/current-affairs",
    },
    {
      title: "Daily Newspaper",
      description:
        "Read daily newspapers and stay informed.",
      icon: "📖",
      color: "from-purple-500 to-fuchsia-600",
      path: "/student/daily-newspaper",
    },
    {
      title: "Ask Vidhya",
      description:
        "Get AI-powered learning assistance.",
      icon: "🤖",
      color: "from-pink-500 to-rose-600",
      path: "/student/ask",
    },
    {
      title: "English Vocabulary",
      description:
        "Build vocabulary with words, idioms and more.",
      icon: "🔤",
      color: "from-cyan-500 to-blue-600",
      path: "/student/vocabulary",
    },
    {
      title: "Exam Tips",
      description:
        "Practical strategies for smarter exam preparation.",
      icon: "🎯",
      color: "from-green-500 to-emerald-600",
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
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          isDark
            ? "border-white/10 bg-slate-950/90"
            : "border-slate-200 bg-white/90"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate("/student/dashboard")}
            className="text-left"
          >
            <p className="text-xl font-black tracking-tight">
              Ranker Bhaiya
            </p>

            <p
              className={`text-xs ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Aapki Mehnat, Hamari Strategy
            </p>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/student/progress")}
              className={`hidden rounded-xl px-4 py-2 text-sm font-bold transition sm:block ${
                isDark
                  ? "bg-white/10 text-white hover:bg-white/15"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              📊 Progress
            </button>

            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((value) => !value)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 px-3 py-2 text-white shadow-lg"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 font-black">
                  {studentName.charAt(0).toUpperCase()}
                </span>

                <span className="hidden max-w-32 truncate text-sm font-bold sm:block">
                  {studentName}
                </span>

                <span className="text-xs">
                  {menuOpen ? "▲" : "▼"}
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
                      navigate("/student/profile");
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
                      navigate("/student/progress");
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

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Welcome Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 p-6 text-white shadow-2xl sm:p-8 lg:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />

          <div className="relative z-10">
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-black backdrop-blur">
              👋 WELCOME BACK
            </span>

            <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Hello, {studentName}! 👋
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-indigo-100 sm:text-base">
              Ranker Bhaiya brings learning resources,
              current affairs, and AI-powered guidance
              together in one place — helping you learn
              smarter, stay ahead, and prepare with
              confidence.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {profile?.class_name && (
                <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold backdrop-blur">
                  🎓 {profile.class_name}
                </span>
              )}

              {profile?.board && (
                <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold backdrop-blur">
                  🏫 {profile.board}
                </span>
              )}

              {profile?.exam && (
                <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold backdrop-blur">
                  🎯 {profile.exam}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Profile Completion */}
        {profileIncomplete && (
          <section
            className={`mt-6 rounded-2xl border p-5 ${
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
                  Add your class, board and exam details for
                  a better Ranker Bhaiya experience.
                </p>
              </div>

              <button
                onClick={() => navigate("/student/profile")}
                className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-amber-600"
              >
                Complete Profile
              </button>
            </div>
          </section>
        )}

        {/* Preparation Tools */}
        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-black">
              Your Preparation Tools
            </h2>

            <p
              className={`mt-1 text-sm ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Tools designed to keep your preparation
              organized and consistent.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool) => (
              <button
                key={tool.title}
                onClick={() => navigate(tool.path)}
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

                <h3 className="mt-5 font-black">
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
            ))}
          </div>
        </section>

        {/* Learning Hub */}
        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-black">
              Learning Hub
            </h2>

            <p
              className={`mt-1 text-sm ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Learn, revise and stay updated every day.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {learningItems.map((item) => (
              <button
                key={item.title}
                onClick={() => navigate(item.path)}
                className={`group rounded-3xl border p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  isDark
                    ? "border-white/10 bg-slate-900 hover:border-indigo-500/30"
                    : "border-slate-200 bg-white hover:border-indigo-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-2xl shadow-lg`}
                  >
                    {item.icon}
                  </div>

                  <div>
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
            ))}
          </div>
        </section>

        {/* Daily Challenge Feature */}
        <section className="mt-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 p-6 text-white shadow-2xl sm:p-8">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1.5 text-xs font-black">
                  🔥 DAILY PRACTICE
                </span>

                <h2 className="mt-4 text-2xl font-black sm:text-3xl">
                  Challenge Yourself. Improve Every Day.
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                  Practice questions, check your accuracy
                  and build a consistent study habit.
                </p>
              </div>

              <button
                onClick={() =>
                  navigate("/student/daily-challenge")
                }
                className="shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-black text-red-600 shadow-xl transition hover:scale-[1.02]"
              >
                Start Challenge →
              </button>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="mt-10 pb-8">
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
                  effective. From daily current affairs and
                  newspaper reading to fast revision,
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
