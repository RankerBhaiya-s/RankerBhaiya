import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";
import { getMindsetText } from "../../data/dailyMindsets";

type ActivityRow = {
  activity_date: string;
  activity_type: string;
};

type PracticeAttempt = {
  id: string;
  user_id: string;
  question_id: string;
  is_correct: boolean;
  created_at: string;
  practice_questions?: {
    category: string | null;
  } | null;
};

type Profile = {
  full_name?: string | null;
  class_name?: string | null;
  board?: string | null;
  exam?: string | null;
};

type WeakTopic = {
  name: string;
  total: number;
  wrong: number;
  accuracy: number;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";

  return "Good Night";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "RB";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getStreak(activities: ActivityRow[]) {
  const dates = new Set(
    activities.map((item) => item.activity_date),
  );

  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const date = new Date();

    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - i);

    if (dates.has(dateKey(date))) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function getAttemptCategory(attempt: PracticeAttempt) {
  return (
    attempt.practice_questions?.category ||
    "General Practice"
  );
}

function Card({
  dark,
  children,
  className = "",
}: {
  dark: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[26px] border ${
        dark
          ? "border-slate-800 bg-slate-900/80"
          : "border-slate-200 bg-white"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  dark,
  title,
  subtitle,
}: {
  dark: boolean;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-black tracking-tight">
        {title}
      </h2>

      {subtitle && (
        <p
          className={`mt-1 text-xs ${
            dark ? "text-slate-500" : "text-slate-500"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { theme } = useTheme();

  const dark = theme === "dark";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const fetchDashboardData = useCallback(
    async (refresh = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [
          profileResponse,
          activityResponse,
          attemptsResponse,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name,class_name,board,exam")
            .eq("id", user.id)
            .maybeSingle(),

          supabase
            .from("student_daily_activity")
            .select("activity_date,activity_type")
            .eq("user_id", user.id)
            .order("activity_date", {
              ascending: false,
            }),

          supabase
            .from("practice_attempts")
            .select(`
              id,
              user_id,
              question_id,
              is_correct,
              created_at,
              practice_questions(category)
            `)
            .eq("user_id", user.id)
            .order("created_at", {
              ascending: false,
            }),
        ]);

        if (profileResponse.error) {
          console.error(
            "Profile fetch error:",
            profileResponse.error,
          );
        } else {
          setProfile(profileResponse.data);
        }

        if (activityResponse.error) {
          console.error(
            "Activity fetch error:",
            activityResponse.error,
          );
          setActivities([]);
        } else {
          setActivities(activityResponse.data || []);
        }

        if (attemptsResponse.error) {
          console.error(
            "Practice attempts fetch error:",
            attemptsResponse.error,
          );
          setAttempts([]);
        } else {
          const rows = attemptsResponse.data || [];

          const normalized: PracticeAttempt[] = rows.map(
            (row) => {
              const relation = row.practice_questions;

              const question = Array.isArray(relation)
                ? relation[0]
                : relation;

              return {
                id: String(row.id),
                user_id: String(row.user_id),
                question_id: String(row.question_id),
                is_correct: Boolean(row.is_correct),
                created_at: String(row.created_at),
                practice_questions: question
                  ? {
                      category:
                        question.category ?? null,
                    }
                  : null,
              };
            },
          );

          setAttempts(normalized);
        }
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id],
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest("[data-profile-menu]")) {
        setProfileMenuOpen(false);
      }
    };

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

  const language =
    i18n.language?.toLowerCase() || "en";

  const dailyMindset = useMemo(() => {
    if (language.startsWith("hinglish")) {
      return getMindsetText("hinglish");
    }

    if (
      language === "hi" ||
      language.startsWith("hindi") ||
      language.startsWith("hi-")
    ) {
      return getMindsetText("hi");
    }

    return getMindsetText("en");
  }, [language]);

  const userName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Student";

  const firstName =
    userName.trim().split(/\s+/)[0] || "Student";

  const streak = useMemo(
    () => getStreak(activities),
    [activities],
  );

  const preparationStats = useMemo(() => {
    const total = attempts.length;

    const correct = attempts.filter(
      (item) => item.is_correct,
    ).length;

    const accuracy =
      total > 0
        ? Math.round((correct / total) * 100)
        : 0;

    return {
      total,
      correct,
      wrong: total - correct,
      accuracy,
    };
  }, [attempts]);

  const weeklyActiveDays = useMemo(() => {
    const activeDates = new Set(
      activities.map((item) => item.activity_date),
    );

    let count = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date();

      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - i);

      if (activeDates.has(dateKey(date))) {
        count++;
      }
    }

    return count;
  }, [activities]);

  const todayActivities = useMemo(
    () =>
      activities.filter(
        (item) =>
          item.activity_date === todayKey(),
      ),
    [activities],
  );

  const weakTopics = useMemo<WeakTopic[]>(() => {
    const map = new Map<
      string,
      {
        total: number;
        wrong: number;
      }
    >();

    attempts.forEach((attempt) => {
      const category = getAttemptCategory(attempt);

      const current = map.get(category) || {
        total: 0,
        wrong: 0,
      };

      current.total += 1;

      if (!attempt.is_correct) {
        current.wrong += 1;
      }

      map.set(category, current);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        total: value.total,
        wrong: value.wrong,
        accuracy: Math.round(
          ((value.total - value.wrong) /
            value.total) *
            100,
        ),
      }))
      .filter((topic) => topic.total >= 2)
      .sort((a, b) => {
        if (b.wrong !== a.wrong) {
          return b.wrong - a.wrong;
        }

        return a.accuracy - b.accuracy;
      })
      .slice(0, 3);
  }, [attempts]);

  const go = (path: string) => {
    navigate(path);
  };

  const handleLogout = async () => {
    setProfileMenuOpen(false);

    try {
      await signOut();
      navigate("/student/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const preparationTools = [
    {
      icon: "📚",
      title: "Study Planner",
      text: "Plan your preparation",
      path: "/student/study-planner",
    },
    {
      icon: "🎯",
      title: "Practice Questions",
      text: "Test your concepts",
      path: "/student/practice-questions",
    },
    {
      icon: "⚡",
      title: "Daily Challenge",
      text: "Build your streak",
      path: "/student/daily-challenge",
    },
    {
      icon: "🎬",
      title: "Short Videos",
      text: "Learn in less time",
      path: "/student/short-videos",
    },
  ];

  const learningTools = [
    {
      icon: "📰",
      title: "Current Affairs",
      text: "Stay exam ready",
      path: "/student/current-affairs",
    },
    {
      icon: "🗞️",
      title: "Daily Newspaper",
      text: "Read smarter",
      path: "/student/daily-newspaper",
    },
    {
      icon: "🔤",
      title: "Vocabulary",
      text: "Build better English",
      path: "/student/vocabulary",
    },
    {
      icon: "💡",
      title: "Exam Tips",
      text: "Study smarter",
      path: "/student/exam-tips",
    },
    {
      icon: "⚡",
      title: "Quick Revision",
      text: "Revise faster",
      path: "/student/quick-revision",
    },
    {
      icon: "✍️",
      title: "Handwritten Notes",
      text: "Visual revision",
      path: "/student/handwritten-notes",
    },
  ];

  const resources = [
    {
      icon: "📖",
      title: "NCERT Books",
      text: "Complete textbooks",
      path: "/student/ncert-books",
    },
    {
      icon: "📝",
      title: "Previous Year Papers",
      text: "Practice paper sets",
      path: "/student/previous-year-papers",
    },
  ];

  if (loading) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          dark
            ? "bg-slate-950 text-white"
            : "bg-slate-50 text-slate-900"
        }`}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />

          <p className="text-sm font-bold">
            Preparing your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        dark
          ? "bg-[#070b16] text-white"
          : "bg-[#f6f8fc] text-slate-900"
      }`}
    >
      {/* HEADER */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
          dark
            ? "border-slate-800 bg-[#070b16]/90"
            : "border-slate-200 bg-white/90"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() =>
              go("/student/dashboard")
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-xs font-black text-white shadow-lg">
              RB
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-sm font-black">
                Ranker Bhaiya
              </p>

              <p className="text-[10px] font-semibold text-slate-500">
                Aapki Mehnat, Hamari Strategy.
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                fetchDashboardData(true)
              }
              disabled={refreshing}
              className={`rounded-xl p-2.5 transition ${
                dark
                  ? "hover:bg-slate-800"
                  : "hover:bg-slate-100"
              }`}
              title="Refresh"
            >
              <span
                className={
                  refreshing
                    ? "inline-block animate-spin"
                    : ""
                }
              >
                ↻
              </span>
            </button>

            <div
              className="relative"
              data-profile-menu
            >
              <button
                type="button"
                onClick={() =>
                  setProfileMenuOpen(
                    (value) => !value,
                  )
                }
                className={`flex items-center gap-2 rounded-2xl border px-2 py-1.5 ${
                  dark
                    ? "border-slate-800 hover:bg-slate-900"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-black text-white">
                  {getInitials(userName)}
                </div>

                <span className="hidden max-w-24 truncate text-xs font-black sm:block">
                  {firstName}
                </span>

                <span className="hidden text-xs sm:block">
                  ▾
                </span>
              </button>

              {profileMenuOpen && (
                <div
                  className={`absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border shadow-2xl ${
                    dark
                      ? "border-slate-800 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="border-b border-slate-200/10 px-4 py-4">
                    <p className="truncate text-sm font-black">
                      {userName}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {user?.email}
                    </p>
                  </div>

                  {[
                    ["👤", "Profile", "/student/profile"],
                    ["⚙️", "Settings", "/student/settings"],
                    ["ℹ️", "About", "/about"],
                    ["📩", "Contact", "/contact"],
                    ["🔒", "Privacy", "/privacy-policy"],
                  ].map(([icon, title, path]) => (
                    <button
                      type="button"
                      key={path}
                      onClick={() => {
                        setProfileMenuOpen(false);
                        go(path);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold ${
                        dark
                          ? "hover:bg-slate-800"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <span>{icon}</span>
                      {title}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 border-t border-slate-200/10 px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-500/5"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 p-6 text-white shadow-2xl shadow-indigo-900/20 sm:p-8">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="mb-2 text-sm font-bold text-blue-100">
                {profile?.class_name ||
                profile?.exam
                  ? `${profile?.class_name || ""}${
                      profile?.class_name &&
                      profile?.exam
                        ? " • "
                        : ""
                    }${profile?.exam || ""}`
                  : "Your preparation space"}
              </p>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {getGreeting()}, {firstName} 👋
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                Learn smarter, stay consistent and keep
                moving closer to your goal.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    go("/student/practice-questions")
                  }
                  className="rounded-xl bg-white px-4 py-2.5 text-xs font-black text-indigo-700 shadow-lg transition hover:scale-[1.02]"
                >
                  Start Practice →
                </button>

                <button
                  type="button"
                  onClick={() => go("/student/ask")}
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-black text-white backdrop-blur transition hover:bg-white/15"
                >
                  Ask Vidhya ✨
                </button>
              </div>
            </div>

            {/* DAILY MINDSET */}
            <div className="max-w-sm rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                  Daily Mindset
                </span>

                <span className="text-xl">💭</span>
              </div>

              <p className="text-sm font-bold leading-6 text-white">
                {dailyMindset}
              </p>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["🔥", "Streak", `${streak} days`],
            [
              "🎯",
              "Questions",
              preparationStats.total,
            ],
            [
              "✓",
              "Accuracy",
              `${preparationStats.accuracy}%`,
            ],
            [
              "📅",
              "Active Days",
              `${weeklyActiveDays}/7`,
            ],
          ].map(([icon, title, value]) => (
            <Card
              dark={dark}
              key={title}
              className="p-4 sm:p-5"
            >
              <div className="flex items-start justify-between">
                <span className="text-xl">
                  {icon}
                </span>

                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  {title}
                </span>
              </div>

              <p className="mt-4 text-xl font-black">
                {value}
              </p>
            </Card>
          ))}
        </section>

        {/* TODAY'S MISSION */}
        <section className="mt-8">
          <Card
            dark={dark}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl">
                  {todayActivities.length
                    ? "✅"
                    : "🚀"}
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-amber-500">
                    Today&apos;s Mission
                  </p>

                  <h2 className="mt-1 text-lg font-black">
                    {todayActivities.length
                      ? "Great work! Keep the momentum going."
                      : "Complete one focused learning activity."}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Small progress every day creates big
                    results.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  go(
                    todayActivities.length
                      ? "/student/progress"
                      : "/student/practice-questions",
                  )
                }
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-xs font-black text-white shadow-lg shadow-orange-500/20"
              >
                {todayActivities.length
                  ? "View Progress"
                  : "Start Mission →"}
              </button>
            </div>
          </Card>
        </section>

        {/* PREPARATION TOOLS */}
        <section className="mt-8">
          <SectionTitle
            dark={dark}
            title="Preparation Tools"
            subtitle="Everything you need for focused preparation."
          />

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {preparationTools.map((item) => (
              <button
                type="button"
                key={item.title}
                onClick={() => go(item.path)}
                className={`group rounded-[24px] border p-5 text-left transition hover:-translate-y-1 ${
                  dark
                    ? "border-slate-800 bg-slate-900 hover:border-indigo-500/40"
                    : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5"
                }`}
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl transition group-hover:scale-110">
                  {item.icon}
                </div>

                <h3 className="text-sm font-black">
                  {item.title}
                </h3>

                <p className="mt-1 text-[11px] text-slate-500">
                  {item.text}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* LEARNING HUB */}
        <section className="mt-8">
          <SectionTitle
            dark={dark}
            title="Learning Hub"
            subtitle="Learn something useful every day."
          />

          <div className="grid gap-3 lg:grid-cols-12">
            {/* ASK VIDHYA */}
            <button
              type="button"
              onClick={() => go("/student/ask")}
              className="group relative overflow-hidden rounded-[28px] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 p-6 text-left text-white shadow-xl shadow-indigo-900/20 lg:col-span-5"
            >
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">
                    ✨
                  </span>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black">
                    AI LEARNING
                  </span>
                </div>

                <h3 className="mt-7 text-2xl font-black">
                  Ask Vidhya
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-blue-100">
                  Stuck on a concept? Ask, understand and move
                  ahead without wasting time.
                </p>

                <div className="mt-6 text-xs font-black">
                  Ask anything →
                </div>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3 lg:col-span-7">
              {learningTools.map((item) => (
                <button
                  type="button"
                  key={item.title}
                  onClick={() => go(item.path)}
                  className={`rounded-[24px] border p-5 text-left transition hover:-translate-y-1 ${
                    dark
                      ? "border-slate-800 bg-slate-900 hover:border-blue-500/40"
                      : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg"
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
                    {item.icon}
                  </span>

                  <h3 className="mt-4 text-sm font-black">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-[11px] text-slate-500">
                    {item.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* STUDY MATERIAL */}
        <section className="mt-8">
          <SectionTitle
            dark={dark}
            title="Study Material"
            subtitle="Reliable resources for your preparation."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {resources.map((item) => (
              <button
                type="button"
                key={item.title}
                onClick={() => go(item.path)}
                className={`flex items-center gap-4 rounded-[24px] border p-5 text-left transition hover:-translate-y-1 ${
                  dark
                    ? "border-slate-800 bg-slate-900 hover:border-emerald-500/40"
                    : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-lg"
                }`}
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">
                  {item.icon}
                </span>

                <div className="min-w-0">
                  <h3 className="text-sm font-black">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {item.text}
                  </p>
                </div>

                <span className="ml-auto text-slate-400">
                  →
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* YOUR PREPARATION */}
        <section className="mt-8">
          <SectionTitle
            dark={dark}
            title="Your Preparation"
            subtitle="A quick look at your current performance."
          />

          <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <Card
              dark={dark}
              className="p-5 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-blue-500">
                    Practice Performance
                  </p>

                  <h3 className="mt-1 text-xl font-black">
                    {preparationStats.accuracy}%
                    accuracy
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    go("/student/progress")
                  }
                  className="rounded-xl bg-blue-500/10 px-3 py-2 text-xs font-black text-blue-500"
                >
                  View →
                </button>
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-500/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
                  style={{
                    width: `${Math.min(
                      preparationStats.accuracy,
                      100,
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-lg font-black">
                    {preparationStats.total}
                  </p>

                  <p className="text-[10px] text-slate-500">
                    Attempted
                  </p>
                </div>

                <div>
                  <p className="text-lg font-black text-emerald-500">
                    {preparationStats.correct}
                  </p>

                  <p className="text-[10px] text-slate-500">
                    Correct
                  </p>
                </div>

                <div>
                  <p className="text-lg font-black text-orange-500">
                    {preparationStats.wrong}
                  </p>

                  <p className="text-[10px] text-slate-500">
                    Improve
                  </p>
                </div>
              </div>
            </Card>

            <Card
              dark={dark}
              className="p-5 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-orange-500">
                    Weekly Consistency
                  </p>

                  <h3 className="mt-1 text-xl font-black">
                    {weeklyActiveDays}/7 days
                  </h3>
                </div>

                <span className="text-2xl">
                  📈
                </span>
              </div>

              <div className="mt-6 flex items-end justify-between gap-2">
                {Array.from({ length: 7 }).map(
                  (_, index) => {
                    const date = new Date();

                    date.setHours(12, 0, 0, 0);
                    date.setDate(
                      date.getDate() -
                        (6 - index),
                    );

                    const active =
                      activities.some(
                        (item) =>
                          item.activity_date ===
                          dateKey(date),
                      );

                    return (
                      <div
                        key={index}
                        className="flex flex-1 flex-col items-center gap-2"
                      >
                        <div
                          className={`w-full rounded-lg ${
                            active
                              ? "h-10 bg-gradient-to-t from-blue-600 to-violet-500"
                              : "h-5 bg-slate-500/10"
                          }`}
                        />

                        <span className="text-[9px] font-bold text-slate-500">
                          {date.toLocaleDateString(
                            "en-US",
                            {
                              weekday: "narrow",
                            },
                          )}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* FOCUS AREAS */}
        <section className="mt-8">
          <SectionTitle
            dark={dark}
            title="Focus Areas"
            subtitle="Topics that deserve a little more attention."
          />

          {weakTopics.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {weakTopics.map((topic) => (
                <Card
                  dark={dark}
                  key={topic.name}
                  className="p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black">
                        {topic.name}
                      </h3>

                      <p className="mt-1 text-[11px] text-slate-500">
                        {topic.total} attempts
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                        topic.accuracy < 50
                          ? "bg-red-500/10 text-red-500"
                          : "bg-orange-500/10 text-orange-500"
                      }`}
                    >
                      {topic.accuracy}%
                    </span>
                  </div>

                  <div className="mt-5 h-2 rounded-full bg-slate-500/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                      style={{
                        width: `${Math.max(
                          topic.accuracy,
                          5,
                        )}%`,
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      go(
                        "/student/practice-questions",
                      )
                    }
                    className="mt-4 text-xs font-black text-blue-500"
                  >
                    Practice more →
                  </button>
                </Card>
              ))}
            </div>
          ) : (
            <Card
              dark={dark}
              className="p-6 text-center"
            >
              <div className="text-3xl">
                🎯
              </div>

              <h3 className="mt-3 text-sm font-black">
                Your focus areas will appear here
              </h3>

              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                Start practicing and we&apos;ll identify topics
                that need more attention.
              </p>
            </Card>
          )}
        </section>

        {/* FINAL CTA */}
        <section className="mt-8 overflow-hidden rounded-[28px] bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">
                Keep Going
              </p>

              <h2 className="mt-2 text-xl font-black">
                Aaj ka effort, kal ka rank. 🚀
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Stay consistent. Let Ranker Bhaiya handle
                the strategy.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                go("/student/practice-questions")
              }
              className="rounded-xl bg-white px-5 py-3 text-xs font-black text-slate-900"
            >
              Continue Preparation →
            </button>
          </div>
        </section>

        <footer className="py-8 text-center">
          <p className="text-[11px] font-semibold text-slate-500">
            © Ranker Bhaiya • Aapki Mehnat, Hamari Strategy.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default StudentDashboard;
