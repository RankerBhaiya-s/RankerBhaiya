import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { getDailyMindset } from "../../data/dailyMindsets";

type PreparationStats = {
  attempted: number;
  correct: number;
  accuracy: number;
};

type WeakTopic = {
  category: string;
  attempted: number;
  correct: number;
  accuracy: number;
};

const DAILY_TARGET = 20;

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getPreviousDate = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() - 1);

  return getLocalDateString(date);
};

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

  const menuRef = useRef<HTMLDivElement | null>(null);

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const dailyMindset = useMemo(() => getDailyMindset(), []);

  /* =====================================================
     USER
  ===================================================== */

  const firstName =
    profile?.full_name?.trim()?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Student";

  /* =====================================================
     STREAK
  ===================================================== */

  const [streakLoading, setStreakLoading] = useState(true);

  const [currentStreak, setCurrentStreak] = useState(0);

  const [activeDates, setActiveDates] = useState<string[]>([]);

  /* =====================================================
     PREPARATION STATS
  ===================================================== */

  const [preparationStats, setPreparationStats] =
    useState<PreparationStats>({
      attempted: 0,
      correct: 0,
      accuracy: 0,
    });

  const [preparationLoading, setPreparationLoading] =
    useState(true);

  /* =====================================================
     WEAK TOPICS
  ===================================================== */

  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);

  const [weakTopicsLoading, setWeakTopicsLoading] = useState(true);

  /* =====================================================
     DAILY PRACTICE
  ===================================================== */

  const [dailyPractice] = useState(0);

  /* =====================================================
     TODAY'S MISSION
  ===================================================== */

  const [missionCompleted, setMissionCompleted] = useState({
    practice: false,
    challenge: false,
    currentAffairs: false,
  });

  const [missionLoading, setMissionLoading] = useState(true);

  /* =====================================================
     DOCUMENT TITLE
  ===================================================== */

  useEffect(() => {
    document.title = "Student Dashboard | Ranker Bhaiya";
  }, []);

  /* =====================================================
     LOGIN REDIRECT
  ===================================================== */

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/student/login", {
        replace: true,
      });
    }
  }, [authLoading, user, navigate]);

  /* =====================================================
     CLOSE PROFILE MENU
  ===================================================== */

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
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

  /* =====================================================
     LOGOUT
  ===================================================== */

  async function handleLogout() {
    setShowProfileMenu(false);

    await signOut();

    navigate("/student/login", {
      replace: true,
    });
  }

  /* =====================================================
     LOAD STREAK
  ===================================================== */

  const loadStudentStreak = async () => {
    if (!user?.id) {
      return;
    }

    setStreakLoading(true);

    const { data, error } = await supabase
      .from("student_daily_activity")
      .select("activity_date")
      .eq("user_id", user.id)
      .order("activity_date", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Failed to load student streak:",
        error,
      );

      setCurrentStreak(0);
      setActiveDates([]);
      setStreakLoading(false);

      return;
    }

    const uniqueDates = Array.from(
      new Set(
        (data ?? [])
          .map((item) => item.activity_date)
          .filter(Boolean),
      ),
    );

    setActiveDates(uniqueDates);

    const today = getLocalDateString(new Date());

    if (!uniqueDates.includes(today)) {
      setCurrentStreak(0);
      setStreakLoading(false);

      return;
    }

    let streak = 1;
    let checkDate = today;

    while (true) {
      const previousDate = getPreviousDate(checkDate);

      if (uniqueDates.includes(previousDate)) {
        streak += 1;
        checkDate = previousDate;
      } else {
        break;
      }
    }

    setCurrentStreak(streak);
    setStreakLoading(false);
  };

  /* =====================================================
     LOAD PREPARATION STATS
  ===================================================== */

  const loadPreparationStats = async () => {
    if (!user?.id) {
      return;
    }

    setPreparationLoading(true);

    const { data, error } = await supabase
      .from("practice_attempts")
      .select("question_id, is_correct")
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "Failed to load preparation stats:",
        error,
      );

      setPreparationStats({
        attempted: 0,
        correct: 0,
        accuracy: 0,
      });

      setPreparationLoading(false);

      return;
    }

    const attempts = data ?? [];

    const attempted = attempts.length;

    const correct = attempts.filter(
      (attempt) => attempt.is_correct === true,
    ).length;

    const accuracy =
      attempted === 0
        ? 0
        : Math.round((correct / attempted) * 100);

    setPreparationStats({
      attempted,
      correct,
      accuracy,
    });

    setPreparationLoading(false);
  };

  /* =====================================================
     LOAD WEAK TOPICS
  ===================================================== */

  const loadWeakTopics = async () => {
    if (!user?.id) {
      return;
    }

    setWeakTopicsLoading(true);

    const { data, error } = await supabase
      .from("practice_attempts")
      .select(
        `
          is_correct,
          practice_questions (
            category
          )
        `,
      )
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "Failed to load weak topics:",
        error,
      );

      setWeakTopics([]);
      setWeakTopicsLoading(false);

      return;
    }

    const topicMap = new Map<
      string,
      {
        attempted: number;
        correct: number;
      }
    >();

    (data ?? []).forEach((attempt) => {
      const question = Array.isArray(
        attempt.practice_questions,
      )
        ? attempt.practice_questions[0]
        : attempt.practice_questions;

      const category = question?.category?.trim();

      if (!category) {
        return;
      }

      const existing = topicMap.get(category) ?? {
        attempted: 0,
        correct: 0,
      };

      existing.attempted += 1;

      if (attempt.is_correct === true) {
        existing.correct += 1;
      }

      topicMap.set(category, existing);
    });

    const topics: WeakTopic[] = Array.from(
      topicMap.entries(),
    )
      .map(([category, stats]) => ({
        category,
        attempted: stats.attempted,
        correct: stats.correct,
        accuracy:
          stats.attempted === 0
            ? 0
            : Math.round(
                (stats.correct / stats.attempted) * 100,
              ),
      }))
      .filter((topic) => topic.attempted >= 2)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    setWeakTopics(topics);
    setWeakTopicsLoading(false);
  };

  /* =====================================================
     LOAD TODAY'S MISSION
  ===================================================== */

  const loadTodayMission = async () => {
    if (!user?.id) {
      return;
    }

    setMissionLoading(true);

    const today = getLocalDateString(new Date());

    const { data, error } = await supabase
      .from("student_daily_activity")
      .select("activity_type")
      .eq("user_id", user.id)
      .eq("activity_date", today);

    if (error) {
      console.error(
        "Failed to load today's mission:",
        error,
      );

      setMissionCompleted({
        practice: false,
        challenge: false,
        currentAffairs: false,
      });

      setMissionLoading(false);

      return;
    }

    const activityTypes = new Set(
      (data ?? []).map((item) => item.activity_type),
    );

    setMissionCompleted({
      practice: activityTypes.has("practice_questions"),
      challenge: activityTypes.has("daily_challenge"),
      currentAffairs: activityTypes.has("current_affairs"),
    });

    setMissionLoading(false);
  };

  /* =====================================================
     LOAD DASHBOARD DATA
  ===================================================== */

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    void loadStudentStreak();
    void loadPreparationStats();
    void loadWeakTopics();
    void loadTodayMission();
  }, [user?.id]);

  /* =====================================================
     MISSION COUNT
  ===================================================== */

  const missionCount =
    Number(missionCompleted.practice) +
    Number(missionCompleted.challenge) +
    Number(missionCompleted.currentAffairs);

  /* =====================================================
     STREAK DAYS
  ===================================================== */

  const streakDays = Array.from(
    { length: 7 },
    (_, index) => {
      const date = new Date();

      date.setDate(date.getDate() - (6 - index));

      const dateString = getLocalDateString(date);

      return {
        date: dateString,
        active: activeDates.includes(dateString),
      };
    },
  );

  /* =====================================================
     DAILY PRACTICE
  ===================================================== */

  const dailyPracticePercent = Math.min(
    100,
    Math.round((dailyPractice / DAILY_TARGET) * 100),
  );

  /* =====================================================
     NAVIGATION HANDLERS
  ===================================================== */

  const handleDailyPractice = () => {
    navigate("/student/practice-questions");
  };

  const handleStudyPlanner = () => {
    navigate("/student/study-planner");
  };

  const handlePracticeQuestions = () => {
    navigate("/student/practice-questions");
  };

  const handleShortVideos = () => {
    navigate("/student/short-videos");
  };

  const handleDailyChallenge = () => {
    navigate("/student/daily-challenge");
  };

  const handleAskVidhya = () => {
    navigate("/student/ask");
  };

  const handleCurrentAffairs = () => {
    navigate("/student/current-affairs");
  };

  const handleDailyNewspaper = () => {
    navigate("/student/daily-newspaper");
  };

  const handleVocabulary = () => {
    navigate("/student/vocabulary");
  };

  const handleExamTips = () => {
    navigate("/student/exam-tips");
  };

  const handleProgress = () => {
    navigate("/student/progress");
  };

  const handleNCERTBooks = () => {
    navigate("/student/ncert-books");
  };

  const handlePreviousYearPapers = () => {
    navigate("/student/previous-year-papers");
  };

  const handleWeakTopic = (topic: WeakTopic) => {
    navigate("/student/practice-questions", {
      state: {
        category: topic.category,
      },
    });
  };

  /* =====================================================
     LOADING
  ===================================================== */

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

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
          isDark
            ? "border-slate-800 bg-slate-950/90"
            : "border-slate-200 bg-white/90"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">
              Ranker Bhaiya
            </p>

            <h1 className="mt-1 text-lg font-black sm:text-xl">
              Hello, {firstName}! 👋
            </h1>
          </div>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() =>
                setShowProfileMenu((value) => !value)
              }
              className={`flex items-center gap-2 rounded-full border px-2 py-2 transition ${
                isDark
                  ? "border-slate-700 bg-slate-900 hover:bg-slate-800"
                  : "border-slate-200 bg-white hover:bg-slate-100"
              }`}
              aria-label="Open profile menu"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-500 text-sm font-black text-white">
                {firstName.charAt(0).toUpperCase()}
              </span>

              <span className="hidden max-w-[120px] truncate text-sm font-bold sm:block">
                {firstName}
              </span>

              <span className="px-1 text-xs opacity-60">
                ⌄
              </span>
            </button>

            {showProfileMenu && (
              <div
                className={`absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border shadow-2xl ${
                  isDark
                    ? "border-slate-700 bg-slate-900"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="border-b border-inherit px-4 py-3">
                  <p className="truncate text-sm font-bold">
                    {profile?.full_name || firstName}
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

                <div className="my-1 border-t border-inherit" />

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/about");
                  }}
                  className="block w-full px-4 py-3 text-left text-sm font-semibold transition hover:bg-black/5 dark:hover:bg-white/5"
                >
                  ℹ️ About Us
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/contact");
                  }}
                  className="block w-full px-4 py-3 text-left text-sm font-semibold transition hover:bg-black/5 dark:hover:bg-white/5"
                >
                  📩 Contact Us
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/privacy-policy");
                  }}
                  className="block w-full px-4 py-3 text-left text-sm font-semibold transition hover:bg-black/5 dark:hover:bg-white/5"
                >
                  🔒 Privacy Policy
                </button>

                <div className="my-1 border-t border-inherit" />

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    void handleLogout();
                  }}
                  className="block w-full px-4 py-3 text-left text-sm font-bold text-red-500 transition hover:bg-red-500/5"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white shadow-2xl shadow-purple-600/20 sm:p-8 lg:p-10">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-pink-400/20 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-100">
              Welcome back
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Hello, {firstName}! 🚀
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-purple-50 sm:text-base">
              Ranker Bhaiya brings learning
              resources, current affairs, and
              AI-powered guidance together in one
              place — helping you learn smarter,
              stay ahead, and prepare with
              confidence.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAskVidhya}
                className="rounded-xl bg-white px-5 py-3 text-sm font-black text-purple-700 shadow-xl transition hover:bg-purple-50 active:scale-95"
              >
                🤖 Ask Vidhya →
              </button>

              <button
                type="button"
                onClick={handlePracticeQuestions}
                className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/20 active:scale-95"
              >
                📝 Practice Now
              </button>
            </div>
          </div>
        </section>

        {/* =================================================
            PROFILE COMPLETION
        ================================================= */}

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
                  Add your class, board and exam
                  details for a better Ranker Bhaiya
                  experience.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/student/profile")
                }
                className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-black text-white transition hover:bg-amber-600"
              >
                Complete Profile
              </button>
            </div>
          </section>
        )}

        {/* =================================================
            DAILY MINDSET
        ================================================= */}

        <section
          className={`mt-6 rounded-3xl border p-5 shadow-sm sm:p-6 ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-2xl dark:bg-purple-950/50">
              🧠
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-purple-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                  Daily Mindset
                </span>

                <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                  ☀️ Today's Thought
                </span>
              </div>

              <p className="mt-3 text-lg font-black leading-7 sm:text-xl">
                {dailyMindset.en}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                {dailyMindset.hi}
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            TOP STATS
        ================================================= */}

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          {/* STREAK */}

          <div
            className={`rounded-3xl border p-5 shadow-sm ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>

                  <h3 className="font-black">
                    7 Day Streak
                  </h3>
                </div>

                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {currentStreak === 0
                    ? "Start your streak today!"
                    : currentStreak >= 7
                      ? "Amazing! Keep the streak alive."
                      : `${7 - currentStreak} more days to reach 7.`}
                </p>
              </div>

              <span className="rounded-xl bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-600 dark:bg-orange-950/30 dark:text-orange-300">
                {streakLoading
                  ? "..."
                  : `${currentStreak} DAYS`}
              </span>
            </div>

            <div className="mt-5 flex justify-between gap-1">
              {streakDays.map((day, index) => (
                <div
                  key={day.date}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                      day.active
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                        : isDark
                          ? "bg-slate-800 text-slate-500"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {day.active ? "✓" : "•"}
                  </div>

                  <span className="text-[10px] font-bold text-slate-400">
                    {index === 6 ? "Today" : `D${index + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* MISSION */}

          <div
            className={`rounded-3xl border p-5 shadow-sm ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>

                <div>
                  <h3 className="font-black">
                    Today's Mission
                  </h3>

                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Complete your daily targets
                  </p>
                </div>
              </div>

              <span className="rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-black text-purple-600 dark:bg-purple-950/30 dark:text-purple-300">
                {missionLoading ? "..." : `${missionCount}/3`}
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {[
                {
                  label: "Complete Practice Questions",
                  done: missionCompleted.practice,
                  onClick: handlePracticeQuestions,
                },
                {
                  label: "Complete Daily Challenge",
                  done: missionCompleted.challenge,
                  onClick: handleDailyChallenge,
                },
                {
                  label: "Read Today's Current Affairs",
                  done: missionCompleted.currentAffairs,
                  onClick: handleCurrentAffairs,
                },
              ].map((mission) => (
                <button
                  key={mission.label}
                  type="button"
                  onClick={mission.onClick}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      mission.done
                        ? "bg-emerald-500 text-white"
                        : isDark
                          ? "border border-slate-700 bg-slate-800 text-slate-500"
                          : "border border-slate-200 bg-slate-50 text-slate-400"
                    }`}
                  >
                    {mission.done ? "✓" : "○"}
                  </span>

                  <span
                    className={`text-xs font-bold ${
                      mission.done
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {mission.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* PREPARATION */}

          <div
            className={`rounded-3xl border p-5 shadow-sm ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>

                  <h3 className="font-black">
                    Your Preparation
                  </h3>
                </div>

                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Based on your practice
                </p>
              </div>

              <button
                type="button"
                onClick={handleProgress}
                className="text-xs font-black text-purple-600 hover:text-purple-700 dark:text-purple-400"
              >
                View →
              </button>
            </div>

            <div className="mt-5 flex items-center gap-5">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="absolute inset-1 rounded-full"
                  style={{
                    background: `conic-gradient(#8b5cf6 ${preparationStats.accuracy}%, ${
                      isDark ? "#1e293b" : "#e2e8f0"
                    } ${preparationStats.accuracy}% 100%)`,
                  }}
                />

                <div
                  className={`relative flex h-20 w-20 items-center justify-center rounded-full text-lg font-black ${
                    isDark ? "bg-slate-900" : "bg-white"
                  }`}
                >
                  {preparationLoading
                    ? "—"
                    : `${preparationStats.accuracy}%`}
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">
                      Questions
                    </span>

                    <span className="font-black text-purple-600 dark:text-purple-400">
                      {preparationLoading
                        ? "—"
                        : preparationStats.attempted}
                    </span>
                  </div>

                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all"
                      style={{
                        width: `${
                          preparationStats.attempted > 0
                            ? Math.min(
                                100,
                                preparationStats.attempted * 2,
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">
                      Accuracy
                    </span>

                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      {preparationLoading
                        ? "—"
                        : `${preparationStats.accuracy}%`}
                    </span>
                  </div>

                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${preparationStats.accuracy}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            PREPARATION TOOLS
        ================================================= */}

        <section className="mt-10">
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              Your Preparation Tools
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Tools designed to keep your preparation
              organized and consistent.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: "📅",
                title: "Study Planner",
                description:
                  "Plan your study sessions and stay consistent.",
                action: handleStudyPlanner,
              },
              {
                icon: "📝",
                title: "Practice Questions",
                description:
                  "Practice exam-style questions and improve accuracy.",
                action: handlePracticeQuestions,
              },
              {
                icon: "🎬",
                title: "Short Videos",
                description:
                  "Learn important topics through short focused videos.",
                action: handleShortVideos,
              },
              {
                icon: "⚡",
                title: "Daily Challenge",
                description:
                  "Challenge yourself with quick daily practice.",
                action: handleDailyChallenge,
              },
            ].map((tool) => (
              <button
                key={tool.title}
                type="button"
                onClick={tool.action}
                className={`group rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                  isDark
                    ? "border-slate-800 bg-slate-900 hover:border-purple-800"
                    : "border-slate-200 bg-white hover:border-purple-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-2xl dark:bg-purple-950/40">
                    {tool.icon}
                  </div>

                  <span className="text-purple-600 transition group-hover:translate-x-1 dark:text-purple-400">
                    →
                  </span>
                </div>

                <h3 className="mt-5 font-black">
                  {tool.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {tool.description}
                </p>

                <p className="mt-4 text-xs font-black text-purple-600 dark:text-purple-400">
                  Open →
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* =================================================
            LEARNING HUB
        ================================================= */}

        <section className="mt-10">
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              Learning Hub
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Learn, revise and stay updated, every day.
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {/* ASK VIDHYA */}

            <button
              type="button"
              onClick={handleAskVidhya}
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-left text-white shadow-xl shadow-purple-600/20 lg:row-span-2"
            >
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur">
                    🤖
                  </div>

                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black tracking-wider">
                    AI ASSISTANT
                  </span>
                </div>

                <div className="mt-8">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-100">
                    Ask Vidhya
                  </p>

                  <h3 className="mt-2 text-3xl font-black">
                    Your personal AI learning assistant.
                  </h3>

                  <p className="mt-4 text-sm leading-6 text-purple-50">
                    Ask questions, understand concepts,
                    create learning support and learn
                    smarter.
                  </p>
                </div>

                <div className="mt-auto pt-8">
                  <span className="inline-flex rounded-xl bg-white px-5 py-3 text-sm font-black text-purple-700 transition group-hover:bg-purple-50">
                    Ask Vidhya →
                  </span>
                </div>
              </div>
            </button>

            {/* CURRENT AFFAIRS */}

            <button
              type="button"
              onClick={handleCurrentAffairs}
              className={`group rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl dark:bg-blue-950/40">
                  📰
                </div>

                <span className="text-blue-600 transition group-hover:translate-x-1 dark:text-blue-400">
                  →
                </span>
              </div>

              <h3 className="mt-5 font-black">
                Daily Current Affairs
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Stay updated with important national
                and international news.
              </p>

              <p className="mt-4 text-xs font-black text-blue-600 dark:text-blue-400">
                Explore →
              </p>
            </button>

            {/* NEWSPAPER */}

            <button
              type="button"
              onClick={handleDailyNewspaper}
              className={`group rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-2xl dark:bg-pink-950/40">
                  🗞️
                </div>

                <span className="text-pink-600 transition group-hover:translate-x-1 dark:text-pink-400">
                  →
                </span>
              </div>

              <h3 className="mt-5 font-black">
                Daily Newspaper
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Read daily newspapers and stay informed.
              </p>

              <p className="mt-4 text-xs font-black text-pink-600 dark:text-pink-400">
                Explore →
              </p>
            </button>

            {/* VOCABULARY */}

            <button
              type="button"
              onClick={handleVocabulary}
              className={`group rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-2xl dark:bg-cyan-950/40">
                  🔤
                </div>

                <span className="text-cyan-600 transition group-hover:translate-x-1 dark:text-cyan-400">
                  →
                </span>
              </div>

              <h3 className="mt-5 font-black">
                English Vocabulary
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Build vocabulary with words, idioms and
                more.
              </p>

              <p className="mt-4 text-xs font-black text-cyan-600 dark:text-cyan-400">
                Explore →
              </p>
            </button>

            {/* EXAM TIPS */}

            <button
              type="button"
              onClick={handleExamTips}
              className={`group rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl dark:bg-emerald-950/40">
                  🎯
                </div>

                <span className="text-emerald-600 transition group-hover:translate-x-1 dark:text-emerald-400">
                  →
                </span>
              </div>

              <h3 className="mt-5 font-black">
                Exam Tips
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Practical strategies for smarter exam
                preparation.
              </p>

              <p className="mt-4 text-xs font-black text-emerald-600 dark:text-emerald-400">
                Explore →
              </p>
            </button>

            {/* NCERT BOOKS */}

            <button
              type="button"
              onClick={handleNCERTBooks}
              className={`group rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl dark:bg-amber-950/40">
                  📚
                </div>

                <span className="text-amber-600 transition group-hover:translate-x-1 dark:text-amber-400">
                  →
                </span>
              </div>

              <h3 className="mt-5 font-black">
                NCERT Books
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Read complete NCERT books in PDF format
                for your preparation.
              </p>

              <p className="mt-4 text-xs font-black text-amber-600 dark:text-amber-400">
                Read Books →
              </p>
            </button>

            {/* PREVIOUS YEAR PAPERS */}

            <button
              type="button"
              onClick={handlePreviousYearPapers}
              className={`group rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl dark:bg-indigo-950/40">
                  📄
                </div>

                <span className="text-indigo-600 transition group-hover:translate-x-1 dark:text-indigo-400">
                  →
                </span>
              </div>

              <h3 className="mt-5 font-black">
                Previous Year Papers
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Practice mixed previous year question
                paper sets.
              </p>

              <p className="mt-4 text-xs font-black text-indigo-600 dark:text-indigo-400">
                Practice Papers →
              </p>
            </button>
          </div>
        </section>

        {/* =================================================
            RECOMMENDATION + WEAK TOPICS
        ================================================= */}

        <section className="mt-10 grid gap-5 lg:grid-cols-5">
          {/* RECOMMENDATION */}

          <div className="relative overflow-hidden rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 p-6 dark:border-purple-900/40 dark:from-purple-950/30 dark:via-fuchsia-950/20 dark:to-pink-950/20 lg:col-span-3">
            <div className="relative z-10 max-w-xl">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-slate-900">
                💡
              </span>

              <h3 className="mt-5 text-xl font-black">
                Bhaiya's Recommendation
              </h3>

              {weakTopicsLoading ? (
                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Analysing your practice performance...
                </p>
              ) : weakTopics.length > 0 ? (
                <>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Today, focus on{" "}
                    <span className="font-black text-purple-700 dark:text-purple-300">
                      {weakTopics[0].category}
                    </span>
                    . Your current accuracy in this
                    topic is{" "}
                    <span className="font-black">
                      {weakTopics[0].accuracy}%
                    </span>
                    . Practice more questions from this
                    topic to improve.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      handleWeakTopic(weakTopics[0])
                    }
                    className="mt-6 rounded-xl bg-purple-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-purple-600/20 transition hover:bg-purple-700"
                  >
                    Start Recommended Session →
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Start solving practice questions and
                    Ranker Bhaiya will identify the topics
                    that need more attention.
                  </p>

                  <button
                    type="button"
                    onClick={handlePracticeQuestions}
                    className="mt-6 rounded-xl bg-purple-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-purple-600/20 transition hover:bg-purple-700"
                  >
                    Start Practicing →
                  </button>
                </>
              )}
            </div>

            <div className="pointer-events-none absolute -bottom-12 -right-8 text-8xl opacity-20">
              🚀
            </div>
          </div>

          {/* WEAK TOPICS */}

          <div
            className={`rounded-3xl border p-6 shadow-sm lg:col-span-2 ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧠</span>

                <h3 className="font-black">
                  Your Weak Topics
                </h3>
              </div>

              <button
                type="button"
                onClick={handleProgress}
                className="text-xs font-black text-purple-600 dark:text-purple-400"
              >
                View All →
              </button>
            </div>

            {weakTopicsLoading ? (
              <div className="mt-6 space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse"
                  >
                    <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />

                    <div className="mt-2 h-2 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                ))}
              </div>
            ) : weakTopics.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-center dark:bg-slate-950">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  Not enough practice data yet.
                </p>

                <button
                  type="button"
                  onClick={handlePracticeQuestions}
                  className="mt-3 text-xs font-black text-purple-600 dark:text-purple-400"
                >
                  Practice Questions →
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {weakTopics.map((topic) => (
                  <button
                    key={topic.category}
                    type="button"
                    onClick={() => handleWeakTopic(topic)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-bold">
                        {topic.category}
                      </span>

                      <span className="shrink-0 text-xs font-black text-red-500">
                        {topic.accuracy}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          topic.accuracy < 50
                            ? "bg-red-500"
                            : topic.accuracy < 70
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${topic.accuracy}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1 text-[10px] font-semibold text-slate-400">
                      {topic.attempted} questions attempted
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            DAILY PRACTICE
        ================================================= */}

        <section className="mt-10 overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-600 p-6 text-white shadow-xl shadow-pink-500/20 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider">
                ⚡ Daily Practice
              </span>

              <h2 className="mt-4 text-2xl font-black sm:text-3xl">
                Challenge Yourself.
                <br />
                Improve Every Day.
              </h2>

              <p className="mt-3 text-sm leading-6 text-pink-50">
                Practice questions, check your accuracy
                and build a consistent study habit.
              </p>

              <div className="mt-5 max-w-md">
                <div className="flex items-center justify-between text-xs font-black">
                  <span>Today's progress</span>

                  <span>
                    {dailyPractice}/{DAILY_TARGET}
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500"
                    style={{
                      width: `${dailyPracticePercent}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDailyPractice}
              className="shrink-0 rounded-2xl bg-white px-6 py-4 text-sm font-black text-pink-600 shadow-xl transition hover:bg-pink-50 active:scale-95"
            >
              Start Practice →
            </button>
          </div>
        </section>

        {/* =================================================
            WEEKLY ACHIEVEMENTS
        ================================================= */}

        <section className="mt-10">
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              Weekly Achievements
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Small wins build big results.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "🔥",
                title: "7 Day Streak",
                unlocked: currentStreak >= 7,
                value:
                  currentStreak >= 7
                    ? "UNLOCKED"
                    : `${Math.min(currentStreak, 7)}/7 DAYS`,
              },
              {
                icon: "📝",
                title: "100 Questions",
                unlocked: preparationStats.attempted >= 100,
                value:
                  preparationStats.attempted >= 100
                    ? "UNLOCKED"
                    : `${Math.min(
                        preparationStats.attempted,
                        100,
                      )}/100`,
              },
              {
                icon: "🎯",
                title: "80% Accuracy",
                unlocked: preparationStats.accuracy >= 80,
                value:
                  preparationStats.attempted === 0
                    ? "START"
                    : preparationStats.accuracy >= 80
                      ? "UNLOCKED"
                      : `${preparationStats.accuracy}%`,
              },
              {
                icon: "🚀",
                title: "Keep Learning",
                unlocked: preparationStats.attempted >= 20,
                value:
                  preparationStats.attempted >= 20
                    ? "UNLOCKED"
                    : `${Math.min(
                        preparationStats.attempted,
                        20,
                      )}/20`,
              },
            ].map((achievement) => (
              <div
                key={achievement.title}
                className={`rounded-3xl border p-5 ${
                  achievement.unlocked
                    ? isDark
                      ? "border-emerald-900/50 bg-emerald-950/20"
                      : "border-emerald-200 bg-emerald-50"
                    : isDark
                      ? "border-slate-800 bg-slate-900"
                      : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl">
                    {achievement.icon}
                  </span>

                  <span
                    className={`rounded-lg px-2 py-1 text-[9px] font-black ${
                      achievement.unlocked
                        ? "bg-emerald-500 text-white"
                        : isDark
                          ? "bg-slate-800 text-slate-500"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {achievement.value}
                  </span>
                </div>

                <h3 className="mt-5 font-black">
                  {achievement.title}
                </h3>

                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {achievement.unlocked
                    ? "Achievement unlocked"
                    : "Keep going"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* =================================================
            ABOUT
        ================================================= */}

        <section
          className={`mt-10 rounded-3xl border p-6 sm:p-8 ${
            isDark
              ? "border-slate-800 bg-slate-900"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-2xl dark:bg-purple-950/40">
              🚀
            </div>

            <div>
              <h2 className="text-xl font-black">
                About Ranker Bhaiya
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 dark:text-slate-300">
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
        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="py-8 text-center">
          <p className="text-xs font-semibold text-slate-400">
            © {new Date().getFullYear()} Ranker Bhaiya ·
            Aapki Mehnat, Hamari Strategy.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default StudentDashboard;
