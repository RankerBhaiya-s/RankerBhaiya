import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { supabase } from "../../lib/supabase";
import { getMindsetText } from "../../data/dailyMindsets";
import { registerPushNotifications } from "../../lib/pushNotifications";

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

type NavItem = {
  icon: string;
  title: string;
  path: string;
};

const todayKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getStreak(activities: ActivityRow[]) {
  const dates = new Set(activities.map((item) => item.activity_date));
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
  return attempt.practice_questions?.category || "General Practice";
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
      className={`rounded-[26px] border transition-colors ${
        dark
          ? "border-white/[0.08] bg-[#0C1630]/90 shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
          : "border-slate-200/80 bg-white shadow-[0_12px_35px_rgba(30,64,175,0.05)]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
  dark,
  action,
}: {
  title: string;
  subtitle?: string;
  dark: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-black tracking-tight sm:text-xl">
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
      {action}
    </div>
  );
}

function SidebarGroup({
  title,
  items,
  dark,
  currentPath,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  dark: boolean;
  currentPath: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="mb-6">
      <p className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
        {title}
      </p>

      <div className="space-y-1">
        {items.map((item) => {
          const active =
            currentPath === item.path ||
            (item.path !== "/student/dashboard" &&
              currentPath.startsWith(`${item.path}/`));

          return (
            <button
              type="button"
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${
                active
                  ? "bg-gradient-to-r from-indigo-600/25 to-violet-600/20 text-indigo-400 ring-1 ring-indigo-500/20"
                  : dark
                    ? "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-indigo-700"
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-base">
                {item.icon}
              </span>
              <span className="flex-1">{item.title}</span>
              {active && (
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  dark,
  icon,
  label,
  value,
  accent,
}: {
  dark: boolean;
  icon: string;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <Card
      dark={dark}
      className="group relative overflow-hidden p-4 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/30 sm:p-5"
    >
      <div
        className={`pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full blur-2xl ${accent}`}
      />
      <div className="relative flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.05] text-xl">
          {icon}
        </span>
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500 sm:text-[10px]">
          {label}
        </span>
      </div>
      <p className="relative mt-4 text-2xl font-black tracking-tight sm:text-3xl">
        {value}
      </p>
    </Card>
  );
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [enablingReminders, setEnablingReminders] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");

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
        const [profileResponse, activityResponse, attemptsResponse] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("full_name,class_name,board,exam")
              .eq("id", user.id)
              .maybeSingle(),

            supabase
              .from("student_daily_activity")
              .select("activity_date,activity_type")
              .eq("user_id", user.id)
              .order("activity_date", { ascending: false }),

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
              .order("created_at", { ascending: false }),
          ]);

        if (profileResponse.error) {
          console.error("Profile fetch error:", profileResponse.error);
        } else {
          setProfile(profileResponse.data);
        }

        if (activityResponse.error) {
          console.error("Activity fetch error:", activityResponse.error);
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

          const normalized: PracticeAttempt[] = rows.map((row) => {
            const relation = row.practice_questions;
            const question = Array.isArray(relation) ? relation[0] : relation;

            return {
              id: String(row.id),
              user_id: String(row.user_id),
              question_id: String(row.question_id),
              is_correct: Boolean(row.is_correct),
              created_at: String(row.created_at),
              practice_questions: question
                ? { category: question.category ?? null }
                : null,
            };
          });

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

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const language = i18n.language?.toLowerCase() || "en";

  const dailyMindset = useMemo(() => {
    if (language.startsWith("hinglish")) return getMindsetText("hinglish");

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

  const firstName = userName.trim().split(/\s+/)[0] || "Student";

  const streak = useMemo(() => getStreak(activities), [activities]);

  const preparationStats = useMemo(() => {
    const total = attempts.length;
    const correct = attempts.filter((item) => item.is_correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { total, correct, wrong: total - correct, accuracy };
  }, [attempts]);

  const weeklyActiveDays = useMemo(() => {
    const activeDates = new Set(activities.map((item) => item.activity_date));
    let count = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - i);

      if (activeDates.has(dateKey(date))) count++;
    }

    return count;
  }, [activities]);

  const todayActivities = useMemo(
    () => activities.filter((item) => item.activity_date === todayKey()),
    [activities],
  );

  const weakTopics = useMemo<WeakTopic[]>(() => {
    const map = new Map<string, { total: number; wrong: number }>();

    attempts.forEach((attempt) => {
      const category = getAttemptCategory(attempt);
      const current = map.get(category) || { total: 0, wrong: 0 };

      current.total += 1;
      if (!attempt.is_correct) current.wrong += 1;

      map.set(category, current);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        total: value.total,
        wrong: value.wrong,
        accuracy: Math.round(
          ((value.total - value.wrong) / value.total) * 100,
        ),
      }))
      .filter((topic) => topic.total >= 2)
      .sort((a, b) => {
        if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
        return b.wrong - a.wrong;
      })
      .slice(0, 3);
  }, [attempts]);

  const smartSuggestions = useMemo(() => {
    if (preparationStats.total === 0) {
      return {
        title: "Start with a quick practice session",
        description:
          "Attempt a few questions to help us understand your preparation level and identify topics to focus on.",
        action: "Start Practice",
        path: "/student/practice-questions",
        reason: "Getting started",
        icon: "🎯",
      };
    }

    if (weakTopics.length > 0 && weakTopics[0].accuracy < 60) {
      return {
        title: `Give ${weakTopics[0].name} some attention`,
        description: `Your current accuracy in this topic is ${weakTopics[0].accuracy}%. A focused practice session can help you strengthen the basics.`,
        action: "Practice This Topic",
        path: "/student/practice-questions",
        reason: "Based on your practice accuracy",
        icon: "🧠",
      };
    }

    if (weeklyActiveDays < 3) {
      return {
        title: "Build a stronger study routine",
        description:
          "You have been active on fewer than three days this week. Try completing one short learning activity today.",
        action: "Start Today's Mission",
        path: "/student/daily-challenge",
        reason: "Based on your weekly activity",
        icon: "📅",
      };
    }

    if (preparationStats.accuracy < 75) {
      return {
        title: "Improve your overall accuracy",
        description:
          "Review the questions you got wrong, revisit the concepts and try another practice session.",
        action: "Continue Practice",
        path: "/student/practice-questions",
        reason: "Based on your practice performance",
        icon: "📈",
      };
    }

    return {
      title: "You're building good momentum",
      description:
        "Your practice is progressing well. Keep revising important concepts and maintain your weekly consistency.",
      action: "Open Quick Revision",
      path: "/student/fast-revision",
      reason: "Based on your preparation progress",
      icon: "⚡",
    };
  }, [preparationStats, weakTopics, weeklyActiveDays]);

  const achievements = useMemo(() => {
    return [
      {
        icon: "🔥",
        title: "Consistency Starter",
        description: "Complete a 3-day study streak",
        unlocked: streak >= 3,
      },
      {
        icon: "🎯",
        title: "Practice Explorer",
        description: "Attempt 25 practice questions",
        unlocked: preparationStats.total >= 25,
      },
      {
        icon: "🏆",
        title: "Accuracy Champion",
        description: "Reach 80% practice accuracy",
        unlocked:
          preparationStats.total >= 10 && preparationStats.accuracy >= 80,
      },
      {
        icon: "📅",
        title: "Weekly Regular",
        description: "Study on 5 days in a week",
        unlocked: weeklyActiveDays >= 5,
      },
    ];
  }, [streak, preparationStats, weeklyActiveDays]);

  const unlockedAchievements = achievements.filter(
    (item) => item.unlocked,
  ).length;

  const go = (path: string) => {
    setMobileMoreOpen(false);
    setProfileMenuOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    setMobileMoreOpen(false);

    try {
      await signOut();
      navigate("/student/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleEnableReminders = async () => {
    if (!user?.id || enablingReminders) return;

    setEnablingReminders(true);
    setReminderMessage("");

    try {
      await registerPushNotifications(user.id);
      setReminderMessage("Study reminders enabled on this browser.");
    } catch (error) {
      setReminderMessage(
        error instanceof Error
          ? error.message
          : "Could not enable study reminders. Please try again.",
      );
    } finally {
      setEnablingReminders(false);
    }
  };
    const overviewItems: NavItem[] = [
    { icon: "⌂", title: "Dashboard", path: "/student/dashboard" },
    { icon: "📊", title: "My Progress", path: "/student/progress" },
  ];

  const preparationItems: NavItem[] = [
    { icon: "📅", title: "Study Planner", path: "/student/study-planner" },
    {
      icon: "🎯",
      title: "Practice Questions",
      path: "/student/practice-questions",
    },
    { icon: "⚡", title: "Daily Challenge", path: "/student/daily-challenge" },
    { icon: "🧮", title: "Math Games", path: "/student/math-games" },
  ];

  const learningItems: NavItem[] = [
    { icon: "📰", title: "Current Affairs", path: "/student/current-affairs" },
    { icon: "📡", title: "Daily News", path: "/student/daily-news" },
    { icon: "🌐", title: "Trending News", path: "/student/rss-news" },
    { icon: "🔤", title: "Vocabulary", path: "/student/vocabulary" },
    { icon: "💡", title: "Exam Tips", path: "/student/exam-tips" },
    { icon: "⚡", title: "Quick Revision", path: "/student/fast-revision" },
    {
      icon: "✍️",
      title: "Handwritten Notes",
      path: "/student/handwritten-notes",
    },
  ];

  const materialItems: NavItem[] = [
    { icon: "📖", title: "NCERT Books", path: "/student/ncert-books" },
    {
      icon: "📝",
      title: "Previous Year Papers",
      path: "/student/previous-year-papers",
    },
    { icon: "🎬", title: "Short Videos", path: "/student/short-videos" },
    { icon: "📚", title: "Syllabus", path: "/student/syllabus" },
  ];

  const moreItems: NavItem[] = [
    { icon: "📰", title: "Current Affairs", path: "/student/current-affairs" },
    { icon: "📡", title: "Daily News", path: "/student/daily-news" },
    { icon: "🌐", title: "Trending News", path: "/student/rss-news" },
    { icon: "🔤", title: "Vocabulary", path: "/student/vocabulary" },
    { icon: "💡", title: "Exam Tips", path: "/student/exam-tips" },
    { icon: "⚡", title: "Quick Revision", path: "/student/fast-revision" },
    {
      icon: "✍️",
      title: "Handwritten Notes",
      path: "/student/handwritten-notes",
    },
    { icon: "📖", title: "NCERT Books", path: "/student/ncert-books" },
    {
      icon: "📝",
      title: "Previous Year Papers",
      path: "/student/previous-year-papers",
    },
    { icon: "🎬", title: "Short Videos", path: "/student/short-videos" },
    { icon: "📚", title: "Syllabus", path: "/student/syllabus" },
    { icon: "👤", title: "My Profile", path: "/student/profile" },
    { icon: "⚙️", title: "Settings", path: "/student/settings" },
    { icon: "ℹ️", title: "About Ranker Bhaiya", path: "/about" },
    { icon: "📩", title: "Contact", path: "/contact" },
    { icon: "🔒", title: "Privacy Policy", path: "/privacy-policy" },
  ];

  const preparationTools = [
    {
      icon: "📅",
      title: "Study Planner",
      text: "Organise your preparation",
      path: "/student/study-planner",
    },
    {
      icon: "🎯",
      title: "Practice Questions",
      text: "Test your understanding",
      path: "/student/practice-questions",
    },
    {
      icon: "⚡",
      title: "Daily Challenge",
      text: "Keep your momentum",
      path: "/student/daily-challenge",
    },
    {
      icon: "🧮",
      title: "Math Games",
      text: "Explore maths interactively",
      path: "/student/math-games",
    },
  ];

  // News Hub has its own dedicated cards.
  // Learning Hub contains only learning resources.
  const learningTools = [
    {
      icon: "🔤",
      title: "Vocabulary",
      text: "Build better English",
      path: "/student/vocabulary",
    },
    {
      icon: "💡",
      title: "Exam Tips",
      text: "Prepare with strategy",
      path: "/student/exam-tips",
    },
    {
      icon: "⚡",
      title: "Quick Revision",
      text: "Revise important concepts",
      path: "/student/fast-revision",
    },
    {
      icon: "✍️",
      title: "Handwritten Notes",
      text: "Visual learning notes",
      path: "/student/handwritten-notes",
    },
  ];

  const resources = [
    {
      icon: "📖",
      title: "NCERT Books",
      text: "Explore study textbooks",
      path: "/student/ncert-books",
    },
    {
      icon: "📝",
      title: "Previous Year Papers",
      text: "Explore previous papers",
      path: "/student/previous-year-papers",
    },
    {
      icon: "🎬",
      title: "Short Videos",
      text: "Learn through videos",
      path: "/student/short-videos",
    },
  ];

  const mobileNavItems = [
    { icon: "⌂", title: "Home", path: "/student/dashboard" },
    { icon: "📚", title: "Learn", path: "/student/current-affairs" },
    { icon: "✨", title: "AI", path: "/student/ask" },
    { icon: "📊", title: "Progress", path: "/student/progress" },
  ];

  if (loading) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          dark ? "bg-[#050A18] text-white" : "bg-[#F4F7FF] text-slate-900"
        }`}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-bold">Preparing your dashboard...</p>
          <p className="mt-1 text-xs text-slate-500">
            Getting your preparation space ready
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        dark ? "bg-[#050A18] text-slate-100" : "bg-[#F4F7FF] text-slate-900"
      }`}
    >
      {/* DESKTOP SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r transition-all duration-300 lg:flex lg:flex-col ${
          sidebarCollapsed ? "w-[82px]" : "w-[260px]"
        } ${
          dark
            ? "border-white/[0.07] bg-[#080F22]"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-white/[0.07] px-4">
          <button
            type="button"
            onClick={() => go("/student/dashboard")}
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 text-sm font-black text-white shadow-lg shadow-indigo-600/20">
              RB
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-black">Ranker Bhaiya</p>
                <p className="mt-0.5 text-[9px] font-semibold text-slate-500">
                  Aapki Mehnat, Hamari Strategy.
                </p>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSidebarCollapsed((value) => !value)}
            className={`rounded-lg p-2 text-slate-500 transition ${
              dark ? "hover:bg-white/[0.06]" : "hover:bg-slate-100"
            }`}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        {!sidebarCollapsed ? (
          <div className="flex-1 overflow-y-auto px-3 py-5">
            <SidebarGroup
              title="Overview"
              items={overviewItems}
              dark={dark}
              currentPath={location.pathname}
              onNavigate={go}
            />

            <div className="mb-6">
              <p className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                AI Assistant
              </p>
              <button
                type="button"
                onClick={() => go("/student/ask")}
                className="flex w-full items-center gap-3 rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-600/15 to-violet-600/10 px-3 py-3 text-left text-xs font-bold text-indigo-400 transition hover:border-indigo-400/40"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-lg">
                  ✨
                </span>
                Ask Vidhya
                <span className="ml-auto text-[9px]">AI</span>
              </button>
            </div>

            <SidebarGroup
              title="Preparation"
              items={preparationItems}
              dark={dark}
              currentPath={location.pathname}
              onNavigate={go}
            />

            <SidebarGroup
              title="Learning Hub"
              items={learningItems}
              dark={dark}
              currentPath={location.pathname}
              onNavigate={go}
            />

            <SidebarGroup
              title="Study Material"
              items={materialItems}
              dark={dark}
              currentPath={location.pathname}
              onNavigate={go}
            />
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
            {[
              ...overviewItems,
              ...preparationItems,
              ...learningItems,
              ...materialItems,
            ].map((item) => (
              <button
                type="button"
                key={item.path}
                title={item.title}
                onClick={() => go(item.path)}
                className={`flex h-10 w-full items-center justify-center rounded-xl text-lg ${
                  location.pathname === item.path
                    ? "bg-indigo-500/20 text-indigo-400"
                    : dark
                      ? "text-slate-400 hover:bg-white/[0.06]"
                      : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.icon}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-white/[0.07] p-3">
          <button
            type="button"
            onClick={() => go("/student/profile")}
            className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${
              dark ? "hover:bg-white/[0.05]" : "hover:bg-slate-100"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-black text-white">
              {getInitials(userName)}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black">{firstName}</p>
                <p className="truncate text-[9px] text-slate-500">
                  Student Account
                </p>
              </div>
            )}
            {!sidebarCollapsed && (
              <span className="text-xs text-slate-500">↗</span>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? "lg:pl-[82px]" : "lg:pl-[260px]"
        }`}
      >
        {/* TOP HEADER */}
        <header
          className={`sticky top-0 z-30 border-b backdrop-blur-xl ${
            dark
              ? "border-white/[0.07] bg-[#050A18]/90"
              : "border-slate-200 bg-white/90"
          }`}
        >
          <div className="flex h-[68px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-[10px] font-black text-white lg:hidden">
                RB
              </div>
              <div>
                <p className="text-sm font-black sm:text-base">
                  Student Dashboard
                </p>
                <p className="hidden text-[10px] text-slate-500 sm:block">
                  Your personal preparation space
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEnableReminders}
                disabled={enablingReminders}
                className="rounded-xl bg-indigo-600 px-3 py-2 text-[10px] font-black text-white transition hover:bg-indigo-700 disabled:opacity-60 sm:px-4 sm:text-xs"
                title="Enable study reminders"
              >
                {enablingReminders ? "Enabling..." : "🔔 Reminders"}
              </button>

              <button
                type="button"
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className={`rounded-xl p-2.5 transition ${
                  dark
                    ? "bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                title="Refresh dashboard"
              >
                <span className={refreshing ? "inline-block animate-spin" : ""}>
                  ↻
                </span>
              </button>

              <div className="relative" data-profile-menu>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((value) => !value)}
                  className={`flex items-center gap-2 rounded-xl border p-1.5 ${
                    dark
                      ? "border-white/[0.08] hover:bg-white/[0.05]"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-black text-white">
                    {getInitials(userName)}
                  </div>
                  <span className="hidden max-w-24 truncate text-xs font-bold sm:block">
                    {firstName}
                  </span>
                  <span className="px-1 text-[10px] text-slate-500">▾</span>
                </button>

                {profileMenuOpen && (
                  <div
                    className={`absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border shadow-2xl ${
                      dark
                        ? "border-white/10 bg-[#101A32]"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="border-b border-white/[0.08] px-4 py-4">
                      <p className="truncate text-sm font-black">{userName}</p>
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
                        onClick={() => go(path)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-xs font-semibold ${
                          dark ? "hover:bg-white/[0.05]" : "hover:bg-slate-50"
                        }`}
                      >
                        <span>{icon}</span>
                        {title}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 border-t border-white/[0.08] px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-500/5"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {reminderMessage && (
          <div
            role="status"
            className={`mx-4 mt-3 rounded-xl px-4 py-2 text-xs font-semibold sm:mx-6 lg:mx-8 ${
              reminderMessage.includes("enabled")
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-rose-500/10 text-rose-500"
            }`}
          >
            {reminderMessage}
          </div>
        )}
                <main className="mx-auto max-w-[1500px] px-4 py-5 pb-28 sm:px-6 sm:py-7 sm:pb-28 lg:px-8 lg:pb-10">
          {/* HERO */}
          <section className="relative isolate overflow-hidden rounded-[30px] border border-indigo-300/10 bg-[radial-gradient(ellipse_at_top_right,rgba(129,140,248,0.32),transparent_35%),radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.20),transparent_40%),linear-gradient(135deg,#07142F_0%,#172554_48%,#312E81_100%)] p-6 text-white shadow-[0_24px_80px_rgba(30,64,175,0.22)] sm:rounded-[34px] sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-violet-400/20 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-sky-400/15 blur-[80px]" />

            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-blue-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Your learning space
                </div>

                <p className="mb-2 text-xs font-bold text-blue-200">
                  {profile?.class_name || profile?.exam
                    ? `${profile?.class_name || ""}${
                        profile?.class_name && profile?.exam ? " • " : ""
                      }${profile?.exam || ""}`
                    : "Your preparation journey"}
                </p>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-[42px]">
                  {getGreeting()}, {firstName}!
                  <span className="ml-2">👋</span>
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                  Learn smarter, stay consistent and keep moving closer to your
                  goal. Your next step starts here.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => go("/student/practice-questions")}
                    className="rounded-xl bg-white px-5 py-3 text-xs font-black text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    Start Practice →
                  </button>

                  <button
                    type="button"
                    onClick={() => go("/student/ask")}
                    className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-black text-white backdrop-blur transition hover:bg-white/15"
                  >
                    ✨ Ask Vidhya
                  </button>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/15 bg-white/[0.08] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200">
                      Daily Mindset
                    </p>
                    <p className="mt-1 text-xs font-bold text-white/70">
                      A thought for today
                    </p>
                  </div>
                  <span className="text-2xl">💭</span>
                </div>
                <p className="text-sm font-bold leading-6 text-white">
                  {dailyMindset}
                </p>
                <div className="mt-5 h-px bg-white/10" />
                <p className="mt-3 text-[10px] font-semibold text-blue-200">
                  Aapki Mehnat, Hamari Strategy.
                </p>
              </div>
            </div>
          </section>

          {/* DAILY STATS */}
          <section className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-4 sm:gap-4">
            <StatCard
              dark={dark}
              icon="🔥"
              label="Study Streak"
              value={`${streak} days`}
              accent="bg-orange-500/15"
            />
            <StatCard
              dark={dark}
              icon="🎯"
              label="Questions"
              value={preparationStats.total}
              accent="bg-blue-500/15"
            />
            <StatCard
              dark={dark}
              icon="✓"
              label="Accuracy"
              value={`${preparationStats.accuracy}%`}
              accent="bg-emerald-500/15"
            />
            <StatCard
              dark={dark}
              icon="📅"
              label="Active Days"
              value={`${weeklyActiveDays}/7`}
              accent="bg-violet-500/15"
            />
          </section>

          {/* SMART STUDY PLAN */}
          <section className="mt-8 sm:mt-10">
            <SectionTitle
              dark={dark}
              title="Your Smart Study Plan"
              subtitle="Suggestions based on your activity and practice performance."
            />

            <div className="relative overflow-hidden rounded-[28px] border border-indigo-500/20 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.18),transparent_40%),linear-gradient(120deg,#101A38_0%,#171D46_55%,#241C54_100%)] p-5 text-white shadow-[0_18px_55px_rgba(30,41,100,0.18)] sm:p-7">
              <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-indigo-500/15 blur-3xl" />

              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-300/20 bg-indigo-400/15 text-2xl">
                    {smartSuggestions.icon}
                  </div>

                  <div className="max-w-2xl">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-indigo-400/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-indigo-200">
                        Smart recommendation
                      </span>
                      <span className="text-[9px] font-semibold text-blue-200/70">
                        {smartSuggestions.reason}
                      </span>
                    </div>

                    <h3 className="text-lg font-black sm:text-xl">
                      {smartSuggestions.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-xs leading-6 text-blue-100/80 sm:text-sm">
                      {smartSuggestions.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => go(smartSuggestions.path)}
                  className="shrink-0 rounded-xl bg-white px-5 py-3 text-xs font-black text-indigo-700 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {smartSuggestions.action} →
                </button>
              </div>
            </div>
          </section>

          {/* TODAY'S MISSION */}
          <section className="mt-8 sm:mt-10">
            <Card dark={dark} className="overflow-hidden">
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-2xl">
                    {todayActivities.length ? "✅" : "🚀"}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-500">
                      Today's Mission
                    </p>
                    <h2 className="mt-1 text-base font-black sm:text-lg">
                      {todayActivities.length
                        ? "Great work! Keep the momentum going."
                        : "Complete one focused learning activity."}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Small progress every day creates big results.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    go(
                      todayActivities.length
                        ? "/student/progress"
                        : "/student/daily-challenge",
                    )
                  }
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-xs font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5"
                >
                  {todayActivities.length ? "View Progress" : "Start Mission →"}
                </button>
              </div>
            </Card>
          </section>

          {/* ASK VIDHYA FEATURE */}
          <section className="mt-8 sm:mt-10">
            <button
              type="button"
              onClick={() => go("/student/ask")}
              className="group relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.20),transparent_35%),linear-gradient(120deg,#4338CA_0%,#5B21B6_48%,#1D4ED8_100%)] p-6 text-left text-white shadow-[0_20px_60px_rgba(67,56,202,0.22)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(67,56,202,0.3)] sm:p-8"
            >
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-sky-300/10 blur-3xl" />

              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em]">
                    <span>✨</span>
                    AI Learning Assistant
                  </div>
                  <h2 className="text-2xl font-black sm:text-3xl">
                    Meet Ask Vidhya
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
                    Stuck on a concept? Ask questions, understand difficult
                    topics and make your learning journey easier.
                  </p>
                </div>

                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-white/20 bg-white/10 text-3xl shadow-xl backdrop-blur">
                  ✨
                </div>
              </div>

              <div className="relative mt-6 flex items-center justify-between border-t border-white/15 pt-4">
                <span className="text-xs font-bold text-blue-100">
                  Your learning companion
                </span>
                <span className="text-xs font-black">
                  Explore Ask Vidhya →
                </span>
              </div>
            </button>
          </section>

          {/* PREPARATION TOOLS */}
          <section className="mt-8 sm:mt-10">
            <SectionTitle
              dark={dark}
              title="Preparation Tools"
              subtitle="Everything you need for focused preparation."
            />

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {preparationTools.map((item) => (
                <button
                  type="button"
                  key={item.title}
                  onClick={() => go(item.path)}
                  className={`group rounded-[24px] border p-4 text-left transition duration-300 hover:-translate-y-1 sm:p-5 ${
                    dark
                      ? "border-white/[0.07] bg-[#0C1630] hover:border-indigo-500/40 hover:bg-[#111E3D]"
                      : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5"
                  }`}
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-xl transition group-hover:scale-110">
                    {item.icon}
                  </div>
                  <h3 className="text-xs font-black sm:text-sm">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[10px] text-slate-500 sm:text-[11px]">
                    {item.text}
                  </p>
                  <div className="mt-4 text-[10px] font-black text-indigo-400">
                    Open tool →
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* PREMIUM NEWS HUB */}
          <section className="mt-8 sm:mt-10">
            <SectionTitle
              dark={dark}
              title="News Hub"
              subtitle="Stay informed with dedicated news and exam-preparation resources."
            />

            <div className="grid gap-4 lg:grid-cols-2">
              {/* CURRENT AFFAIRS */}
              <button
                type="button"
                onClick={() => go("/student/current-affairs")}
                className={`group relative overflow-hidden rounded-[26px] border p-5 text-left transition duration-300 hover:-translate-y-1 sm:p-6 ${
                  dark
                    ? "border-blue-500/20 bg-gradient-to-br from-[#10264A] via-[#101D3A] to-[#0C1630] hover:border-blue-400/50"
                    : "border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:border-blue-300 hover:shadow-xl"
                }`}
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-500/15 blur-3xl" />

                <div className="relative flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-2xl">
                    📰
                  </span>
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[9px] font-black tracking-wider text-blue-400">
                    EXAM FOCUS
                  </span>
                </div>

                <h3 className="relative mt-5 text-lg font-black">
                  Current Affairs
                </h3>
                <p className="relative mt-2 text-xs leading-6 text-slate-500">
                  Important national and international events with key facts
                  and exam-oriented information.
                </p>

                <div className="relative mt-5 flex items-center justify-between">
                  <span className="text-xs font-black text-blue-500">
                    Explore Current Affairs
                  </span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </button>

              {/* TRENDING NEWS */}
              <button
                type="button"
                onClick={() => go("/student/rss-news")}
                className={`group relative overflow-hidden rounded-[26px] border p-5 text-left transition duration-300 hover:-translate-y-1 sm:p-6 ${
                  dark
                    ? "border-violet-500/20 bg-gradient-to-br from-[#24204A] via-[#171D3D] to-[#0C1630] hover:border-violet-400/50"
                    : "border-violet-200 bg-gradient-to-br from-violet-50 to-white hover:border-violet-300 hover:shadow-xl"
                }`}
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-violet-500/15 blur-3xl" />

                <div className="relative flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-2xl">
                    🌐
                  </span>
                  <span className="rounded-full bg-violet-500/10 px-3 py-1 text-[9px] font-black tracking-wider text-violet-400">
                    LATEST UPDATES
                  </span>
                </div>

                <h3 className="relative mt-5 text-lg font-black">
                  Trending News
                </h3>
                <p className="relative mt-2 text-xs leading-6 text-slate-500">
                  Latest news, important updates और exam-relevant घटनाओं की
                  जानकारी एक ही जगह।
                </p>

                <div className="relative mt-5 flex items-center justify-between">
                  <span className="text-xs font-black text-violet-500">
                    Explore Trending News
                  </span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </button>
            </div>
          </section>

          {/* LEARNING HUB */}
          <section className="mt-8 sm:mt-10">
            <SectionTitle
              dark={dark}
              title="Learning Hub"
              subtitle="Build knowledge with focused learning resources."
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {learningTools.map((item) => (
                <button
                  type="button"
                  key={item.title}
                  onClick={() => go(item.path)}
                  className={`rounded-[22px] border p-4 text-left transition hover:-translate-y-1 ${
                    dark
                      ? "border-white/[0.07] bg-[#0C1630] hover:border-violet-500/40"
                      : "border-slate-200 bg-white hover:border-violet-300 hover:shadow-lg"
                  }`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-xl">
                    {item.icon}
                  </span>
                  <h3 className="mt-4 text-xs font-black sm:text-sm">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[10px] text-slate-500">
                    {item.text}
                  </p>
                </button>
              ))}
            </div>
          </section>

          {/* STUDY MATERIAL */}
          <section className="mt-8 sm:mt-10">
            <SectionTitle
              dark={dark}
              title="Study Material"
              subtitle="Reliable resources for your preparation."
            />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {resources.map((item) => (
                <button
                  type="button"
                  key={item.title}
                  onClick={() => go(item.path)}
                  className={`flex items-center gap-4 rounded-[23px] border p-4 text-left transition hover:-translate-y-1 sm:p-5 ${
                    dark
                      ? "border-white/[0.07] bg-[#0C1630] hover:border-emerald-500/40"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-lg"
                  }`}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xs font-black sm:text-sm">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">
                      {item.text}
                    </p>
                  </div>
                  <span className="ml-auto text-slate-400">→</span>
                </button>
              ))}
            </div>
          </section>
                            {/* PERFORMANCE ANALYTICS */}
          <section className="mt-8 sm:mt-10">
            <SectionTitle
              dark={dark}
              title="Your Preparation"
              subtitle="A quick look at your current performance."
              action={
                <button
                  type="button"
                  onClick={() => go("/student/progress")}
                  className="rounded-xl bg-blue-500/10 px-3 py-2 text-[10px] font-black text-blue-500"
                >
                  Full Report →
                </button>
              }
            />

            <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
              <Card dark={dark} className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-blue-500">
                      Practice Performance
                    </p>
                    <h3 className="mt-1 text-2xl font-black">
                      {preparationStats.accuracy}%{" "}
                      <span className="text-sm text-slate-500">accuracy</span>
                    </h3>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-xl">
                    📈
                  </span>
                </div>

                <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-500/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-700"
                    style={{
                      width: `${Math.min(preparationStats.accuracy, 100)}%`,
                    }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xl font-black">
                      {preparationStats.total}
                    </p>
                    <p className="text-[10px] text-slate-500">Attempted</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-emerald-500">
                      {preparationStats.correct}
                    </p>
                    <p className="text-[10px] text-slate-500">Correct</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-orange-500">
                      {preparationStats.wrong}
                    </p>
                    <p className="text-[10px] text-slate-500">To Improve</p>
                  </div>
                </div>
              </Card>

              <Card dark={dark} className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-orange-500">
                      Weekly Consistency
                    </p>
                    <h3 className="mt-1 text-2xl font-black">
                      {weeklyActiveDays}/7{" "}
                      <span className="text-sm text-slate-500">days</span>
                    </h3>
                  </div>
                  <span className="text-2xl">📅</span>
                </div>

                <div className="mt-6 flex items-end justify-between gap-2">
                  {Array.from({ length: 7 }).map((_, index) => {
                    const date = new Date();
                    date.setHours(12, 0, 0, 0);
                    date.setDate(date.getDate() - (6 - index));

                    const active = activities.some(
                      (item) => item.activity_date === dateKey(date),
                    );

                    return (
                      <div
                        key={index}
                        className="flex flex-1 flex-col items-center gap-2"
                      >
                        <div
                          className={`w-full rounded-lg transition-all ${
                            active
                              ? "h-10 bg-gradient-to-t from-blue-600 to-violet-500"
                              : "h-5 bg-slate-500/10"
                          }`}
                        />
                        <span className="text-[9px] font-bold text-slate-500">
                          {date.toLocaleDateString("en-US", {
                            weekday: "narrow",
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </section>

          {/* FOCUS AREAS */}
          <section className="mt-8 sm:mt-10">
            <SectionTitle
              dark={dark}
              title="Focus Areas"
              subtitle="Topics that deserve a little more attention."
            />

            {weakTopics.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {weakTopics.map((topic) => (
                  <Card dark={dark} key={topic.name} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-black">{topic.name}</h3>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {topic.total} practice attempts
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
                          width: `${Math.max(topic.accuracy, 5)}%`,
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => go("/student/practice-questions")}
                      className="mt-4 text-xs font-black text-blue-500"
                    >
                      Practice more →
                    </button>
                  </Card>
                ))}
              </div>
            ) : (
              <Card dark={dark} className="p-6 text-center">
                <div className="text-3xl">🎯</div>
                <h3 className="mt-3 text-sm font-black">
                  Your focus areas will appear here
                </h3>
                <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
                  Start practicing and we will identify topics that may need
                  more attention.
                </p>
              </Card>
            )}
          </section>

          {/* WEEKLY ACHIEVEMENTS */}
          <section className="mt-8 sm:mt-10">
            <SectionTitle
              dark={dark}
              title="Weekly Achievements"
              subtitle="Milestones from your preparation journey."
              action={
                <span className="rounded-full bg-violet-500/10 px-3 py-1.5 text-[10px] font-black text-violet-500">
                  {unlockedAchievements}/{achievements.length} Unlocked
                </span>
              }
            />

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {achievements.map((achievement) => (
                <Card
                  dark={dark}
                  key={achievement.title}
                  className={`p-4 sm:p-5 ${
                    achievement.unlocked
                      ? "border-emerald-500/25"
                      : "opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl">
                      {achievement.icon}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-[8px] font-black ${
                        achievement.unlocked
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-slate-500/10 text-slate-500"
                      }`}
                    >
                      {achievement.unlocked ? "UNLOCKED" : "IN PROGRESS"}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xs font-black sm:text-sm">
                    {achievement.title}
                  </h3>
                  <p className="mt-1 text-[10px] leading-5 text-slate-500">
                    {achievement.description}
                  </p>
                </Card>
              ))}
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="mt-8 overflow-hidden rounded-[30px] border border-indigo-400/15 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.20),transparent_38%),linear-gradient(120deg,#07142F_0%,#111C3D_55%,#24205A_100%)] p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.22)] sm:mt-10 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">
                  Keep Going
                </p>
                <h2 className="mt-2 text-xl font-black sm:text-2xl">
                  Aaj ka effort, kal ka rank. 🚀
                </h2>
                <p className="mt-2 text-xs text-slate-400">
                  Stay consistent. Let Ranker Bhaiya support your strategy.
                </p>
              </div>
              <button
                type="button"
                onClick={() => go("/student/practice-questions")}
                className="rounded-xl bg-white px-5 py-3 text-xs font-black text-slate-900 transition hover:-translate-y-0.5"
              >
                Continue Preparation →
              </button>
            </div>
          </section>

          <footer className="py-8 text-center">
            <p className="text-[10px] font-semibold text-slate-500">
              © Ranker Bhaiya • Aapki Mehnat, Hamari Strategy.
            </p>
          </footer>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav
        className={`fixed inset-x-0 bottom-0 z-40 border-t px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl lg:hidden ${
          dark
            ? "border-white/[0.08] bg-[#080F22]/95"
            : "border-slate-200 bg-white/95"
        }`}
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {mobileNavItems.map((item) => {
            const active =
              location.pathname === item.path ||
              (item.path === "/student/current-affairs" &&
                location.pathname.startsWith("/student/current-affairs"));

            return (
              <button
                type="button"
                key={item.path}
                onClick={() => go(item.path)}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 transition ${
                  active
                    ? "text-indigo-500"
                    : dark
                      ? "text-slate-500"
                      : "text-slate-500"
                }`}
              >
                <span
                  className={`flex h-7 w-9 items-center justify-center rounded-xl text-lg ${
                    active ? "bg-indigo-500/15" : ""
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-[9px] font-black">{item.title}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setMobileMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 ${
              mobileMoreOpen
                ? "text-indigo-500"
                : dark
                  ? "text-slate-500"
                  : "text-slate-500"
            }`}
          >
            <span
              className={`flex h-7 w-9 items-center justify-center rounded-xl text-lg ${
                mobileMoreOpen ? "bg-indigo-500/15" : ""
              }`}
            >
              ☰
            </span>
            <span className="text-[9px] font-black">More</span>
          </button>
        </div>
      </nav>

      {/* MOBILE MORE MENU */}
      {mobileMoreOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMoreOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div
            className={`absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-[28px] border-t p-5 pb-[max(env(safe-area-inset-bottom),24px)] shadow-2xl ${
              dark
                ? "border-white/10 bg-[#0B1530]"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-slate-500/30" />

            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">Explore Ranker Bhaiya</h2>
                <p className="mt-1 text-[10px] text-slate-500">
                  All your learning tools in one place
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                className="rounded-xl bg-slate-500/10 px-3 py-2 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2">
              {[
                {
                  icon: "📅",
                  title: "Study Planner",
                  path: "/student/study-planner",
                },
                {
                  icon: "🎯",
                  title: "Practice",
                  path: "/student/practice-questions",
                },
                {
                  icon: "⚡",
                  title: "Challenge",
                  path: "/student/daily-challenge",
                },
              ].map((item) => (
                <button
                  type="button"
                  key={item.path}
                  onClick={() => go(item.path)}
                  className={`rounded-2xl border p-3 text-center ${
                    dark
                      ? "border-white/[0.07] bg-white/[0.03]"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <p className="mt-2 text-[10px] font-black">{item.title}</p>
                </button>
              ))}
            </div>

            <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
              More learning resources
            </p>

            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => (
                <button
                  type="button"
                  key={item.path}
                  onClick={() => go(item.path)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left text-[10px] font-bold ${
                    dark
                      ? "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.07]"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.title}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-xs font-black text-red-500"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
