import {
  useCallback,
  useEffect,
  useMemo,
  useState,
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

type PracticeQuestionRelation =
  | {
      category: string | null;
    }
  | {
      category: string | null;
    }[]
  | null;

type PracticeAttemptRow = {
  id: string;
  user_id: string;
  question_id: string;
  is_correct: boolean;
  created_at: string;
  practice_questions?: PracticeQuestionRelation;
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
  fullName?: string | null;
  full_name?: string | null;
  className?: string | null;
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

const ACTIVITY_LABELS: Record<string, string> = {
  practice_questions: "Practice Questions",
  daily_challenge: "Daily Challenge",
  current_affairs: "Current Affairs",
  daily_newspaper: "Daily Newspaper",
  fast_revision: "Quick Revision",
  short_videos: "Short Videos",
  ask_vidhya: "Ask Vidhya",
  vocabulary: "Vocabulary",
  five_minute_challenge: "5-Minute Challenge",
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getLastSevenDates() {
  const dates: string[] = [];

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();

    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - i);

    dates.push(formatDate(date));
  }

  return dates;
}

function calculateStreak(activity: ActivityRow[]) {
  const activityDates = new Set(
    activity.map((item) => item.activity_date),
  );

  let streak = 0;

  const today = new Date();

  for (let i = 0; i < 365; i += 1) {
    const date = new Date(today);

    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - i);

    const dateString = formatDate(date);

    if (activityDates.has(dateString)) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";

  return "Good Night";
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "RB";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function normalizePracticeAttempts(
  rows: PracticeAttemptRow[],
): PracticeAttempt[] {
  return rows.map((row) => {
    const relation = row.practice_questions;

    const practiceQuestion = Array.isArray(relation)
      ? relation[0]
      : relation;

    return {
      id: String(row.id),
      user_id: String(row.user_id),
      question_id: String(row.question_id),
      is_correct: Boolean(row.is_correct),
      created_at: String(row.created_at),
      practice_questions: practiceQuestion
        ? {
            category: practiceQuestion.category ?? null,
          }
        : null,
    };
  });
}

export function StudentDashboard() {
  const navigate = useNavigate();

  const { i18n } = useTranslation();

  const { user, signOut } = useAuth();

  const { theme } = useTheme();

  const isDark = theme === "dark";

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [activities, setActivities] =
    useState<ActivityRow[]>([]);

  const [attempts, setAttempts] =
    useState<PracticeAttempt[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);

  const [missionCompleted, setMissionCompleted] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  /*
   * =========================================================
   * DAILY MINDSET
   * =========================================================
   */

  const dailyMindset = useMemo(() => {
    const language =
      i18n.language?.toLowerCase() || "en";

    if (
      language === "hi" ||
      language.startsWith("hi-") ||
      language.startsWith("hindi")
    ) {
      return getMindsetText("hi");
    }

    if (
      language === "hinglish" ||
      language.startsWith("hinglish")
    ) {
      return getMindsetText("hinglish");
    }

    return getMindsetText("en");
  }, [i18n.language]);

  /*
   * =========================================================
   * USER
   * =========================================================
   */

  const userName = useMemo(() => {
    return (
      profile?.fullName ||
      profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "Student"
    );
  }, [profile, user]);

  const displayName =
    userName.trim().split(/\s+/)[0] || "Student";

  const fullDisplayName =
    userName.trim() || "Student";

  const userInitials =
    getInitials(fullDisplayName);

  const className =
    profile?.className ||
    profile?.class_name ||
    "";

  const examName =
    profile?.exam || "";

  const today =
    formatDate(new Date());

  const lastSevenDates =
    useMemo(
      () => getLastSevenDates(),
      [],
    );

  /*
   * =========================================================
   * STREAK
   * =========================================================
   */

  const streak =
    useMemo(
      () =>
        calculateStreak(
          activities,
        ),
      [activities],
    );

  /*
   * =========================================================
   * PREPARATION STATS
   * =========================================================
   */

  const preparationStats =
    useMemo(() => {
      const total =
        attempts.length;

      const correct =
        attempts.filter(
          (attempt) =>
            attempt.is_correct,
        ).length;

      const accuracy =
        total > 0
          ? Math.round(
              (correct / total) *
                100,
            )
          : 0;

      return {
        total,
        correct,
        accuracy,
      };
    }, [attempts]);

  /*
   * =========================================================
   * WEAK TOPICS
   * =========================================================
   */

  const weakTopics =
    useMemo<WeakTopic[]>(() => {
      const topicMap =
        new Map<
          string,
          {
            total: number;
            wrong: number;
          }
        >();

      attempts.forEach(
        (attempt) => {
          const category =
            attempt
              .practice_questions
              ?.category ||
            "General Practice";

          const current =
            topicMap.get(
              category,
            ) || {
              total: 0,
              wrong: 0,
            };

          current.total += 1;

          if (
            !attempt.is_correct
          ) {
            current.wrong += 1;
          }

          topicMap.set(
            category,
            current,
          );
        },
      );

      return Array.from(
        topicMap.entries(),
      )
        .map(
          ([name, values]) => ({
            name,
            total:
              values.total,
            wrong:
              values.wrong,
            accuracy:
              values.total > 0
                ? Math.round(
                    ((values.total -
                      values.wrong) /
                      values.total) *
                      100,
                  )
                : 0,
          }),
        )
        .filter(
          (topic) =>
            topic.total >= 2,
        )
        .sort((a, b) => {
          if (
            b.wrong !==
            a.wrong
          ) {
            return (
              b.wrong -
              a.wrong
            );
          }

          return (
            a.accuracy -
            b.accuracy
          );
        })
        .slice(0, 3);
    }, [attempts]);

  /*
   * =========================================================
   * TODAY ACTIVITY
   * =========================================================
   */

  const todayActivities =
    useMemo(
      () =>
        activities.filter(
          (activity) =>
            activity.activity_date ===
            today,
        ),
      [activities, today],
    );

  /*
   * =========================================================
   * WEEKLY ACTIVE DAYS
   * =========================================================
   */

  const weeklyActiveDays =
    useMemo(() => {
      const dates =
        new Set(
          activities.map(
            (item) =>
              item.activity_date,
          ),
        );

      return lastSevenDates.filter(
        (date) =>
          dates.has(date),
      ).length;
    }, [
      activities,
      lastSevenDates,
    ]);

  /*
   * =========================================================
   * MISSION
   * =========================================================
   */

  const missionText =
    missionCompleted
      ? "Today's mission completed!"
      : "Complete one focused learning activity today.";

  /*
   * =========================================================
   * FETCH DASHBOARD DATA
   * =========================================================
   */

  const fetchDashboardData =
    useCallback(
      async (
        showRefresh = false,
      ) => {
        if (!user?.id) {
          setLoading(false);
          return;
        }

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        try {
          const [
            profileResponse,
            activityResponse,
            attemptsResponse,
          ] =
            await Promise.all([
              supabase
                .from("profiles")
                .select(
                  `
                    full_name,
                    class_name,
                    board,
                    exam
                  `,
                )
                .eq(
                  "id",
                  user.id,
                )
                .maybeSingle(),

              supabase
                .from(
                  "student_daily_activity",
                )
                .select(
                  `
                    activity_date,
                    activity_type
                  `,
                )
                .eq(
                  "user_id",
                  user.id,
                )
                .order(
                  "activity_date",
                  {
                    ascending:
                      false,
                  },
                ),

              supabase
                .from(
                  "practice_attempts",
                )
                .select(
                  `
                    id,
                    user_id,
                    question_id,
                    is_correct,
                    created_at,
                    practice_questions (
                      category
                    )
                  `,
                )
                .eq(
                  "user_id",
                  user.id,
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  },
                ),
            ]);

          /*
           * PROFILE
           */

          if (
            profileResponse.error
          ) {
            console.error(
              "Profile fetch error:",
              profileResponse.error,
            );
          } else if (
            profileResponse.data
          ) {
            setProfile(
              profileResponse.data as Profile,
            );
          }

          /*
           * ACTIVITY
           */

          if (
            activityResponse.error
          ) {
            console.error(
              "Activity fetch error:",
              activityResponse.error,
            );

            setActivities([]);
          } else {
            setActivities(
              (activityResponse.data ||
                []) as ActivityRow[],
            );
          }

          /*
           * PRACTICE ATTEMPTS
           *
           * Normalize Supabase nested relation
           * before storing in state.
           */

          if (
            attemptsResponse.error
          ) {
            console.error(
              "Practice attempts fetch error:",
              attemptsResponse.error,
            );

            setAttempts([]);
          } else {
            const normalized =
              normalizePracticeAttempts(
                (attemptsResponse.data ||
                  []) as PracticeAttemptRow[],
              );

            setAttempts(
              normalized,
            );
          }

          /*
           * TODAY'S MISSION
           */

          const hasTodayMission =
            activityResponse.data?.some(
              (activity) =>
                activity.activity_date ===
                today,
            ) ?? false;

          setMissionCompleted(
            hasTodayMission,
          );
        } catch (error) {
          console.error(
            "Dashboard data error:",
            error,
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [today, user?.id],
    );

  /*
   * =========================================================
   * INITIAL LOAD
   * =========================================================
   */

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /*
   * =========================================================
   * PROFILE MENU OUTSIDE CLICK
   * =========================================================
   */

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent,
    ) {
      const target =
        event.target as HTMLElement;

      if (
        !target.closest(
          "[data-profile-menu]",
        )
      ) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  /*
   * =========================================================
   * NAVIGATION
   * =========================================================
   */

  async function handleLogout() {
    setProfileMenuOpen(false);

    try {
      await signOut();
      navigate(
        "/student/login",
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error,
      );
    }
  }

  function handleActivity(
    path: string,
  ) {
    navigate(path);
  }

  function handleNCERTBooks() {
    navigate(
      "/student/ncert-books",
    );
  }

  function handlePreviousYearPapers() {
    navigate(
      "/student/previous-year-papers",
    );
  }

  function handleAskVidhya() {
    navigate(
      "/student/ask",
    );
  }

  function handlePracticeQuestions() {
    navigate(
      "/student/practice-questions",
    );
  }

  function handleStudyPlanner() {
    navigate(
      "/student/study-planner",
    );
  }

  function handleDailyChallenge() {
    navigate(
      "/student/daily-challenge",
    );
  }

  function handleShortVideos() {
    navigate(
      "/student/short-videos",
    );
  }

  function handleCurrentAffairs() {
    navigate(
      "/student/current-affairs",
    );
  }

  function handleDailyNewspaper() {
    navigate(
      "/student/daily-newspaper",
    );
  }

  function handleVocabulary() {
    navigate(
      "/student/vocabulary",
    );
  }

  function handleExamTips() {
    navigate(
      "/student/exam-tips",
    );
  }

  function handleQuickRevision() {
    navigate(
      "/student/quick-revision",
    );
  }

  function handleHandwrittenNotes() {
    navigate(
      "/student/handwritten-notes",
    );
  }

  function handleProgress() {
    navigate(
      "/student/progress",
    );
  }

  function handleProfile() {
    setProfileMenuOpen(false);
    navigate(
      "/student/profile",
    );
  }

  function handleSettings() {
    setProfileMenuOpen(false);
    navigate(
      "/student/settings",
    );
  }

  function handleAbout() {
    setProfileMenuOpen(false);
    navigate("/about");
  }

  function handleContact() {
    setProfileMenuOpen(false);
    navigate("/contact");
  }

  function handlePrivacy() {
    setProfileMenuOpen(false);
    navigate(
      "/privacy-policy",
    );
  }

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
          isDark
            ? "border-slate-800 bg-slate-950/85"
            : "border-slate-200 bg-white/85"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* LOGO */}

          <button
            type="button"
            onClick={() =>
              navigate(
                "/student/dashboard",
              )
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-sm font-black text-white shadow-lg shadow-blue-600/20">
              RB
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-black tracking-tight">
                Ranker Bhaiya
              </p>

              <p
                className={`text-[11px] font-semibold ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Aapki Mehnat, Hamari Strategy.
              </p>
            </div>
          </button>

          {/* RIGHT */}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                fetchDashboardData(
                  true,
                )
              }
              disabled={refreshing}
              className={`rounded-xl p-2.5 transition ${
                isDark
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

            {/* PROFILE */}

            <div
              className="relative"
              data-profile-menu
            >
              <button
                type="button"
                onClick={() =>
                  setProfileMenuOpen(
                    (value) =>
                      !value,
                  )
                }
                className={`flex items-center gap-2 rounded-2xl border px-2 py-1.5 transition ${
                  isDark
                    ? "border-slate-800 hover:bg-slate-900"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-black text-white">
                  {userInitials}
                </div>

                <div className="hidden text-left sm:block">
                  <p className="max-w-28 truncate text-xs font-black">
                    {displayName}
                  </p>

                  <p
                    className={`text-[10px] ${
                      isDark
                        ? "text-slate-500"
                        : "text-slate-500"
                    }`}
                  >
                    Student
                  </p>
                </div>

                <span className="hidden text-xs sm:block">
                  ▾
                </span>
              </button>

              {profileMenuOpen && (
                <div
                  className={`absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border shadow-2xl ${
                    isDark
                      ? "border-slate-800 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div
                    className={`border-b px-4 py-4 ${
                      isDark
                        ? "border-slate-800"
                        : "border-slate-100"
                    }`}
                  >
                    <p className="truncate text-sm font-black">
                      {fullDisplayName}
                    </p>

                    <p
                      className={`mt-1 truncate text-xs ${
                        isDark
                          ? "text-slate-500"
                          : "text-slate-500"
                      }`}
                    >
                      {user?.email}
                    </p>
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      onClick={
                        handleProfile
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      👤
                      <span>
                        Profile
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleSettings
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      ⚙️
                      <span>
                        Settings
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAbout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      ℹ️
                      <span>
                        About Ranker Bhaiya
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleContact
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      ✉️
                      <span>
                        Contact Us
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={
                        handlePrivacy
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      🔒
                      <span>
                        Privacy Policy
                      </span>
                    </button>

                    <div
                      className={`my-2 border-t ${
                        isDark
                          ? "border-slate-800"
                          : "border-slate-100"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={
                        handleLogout
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      🚪
                      <span>
                        Logout
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-700 p-6 shadow-2xl shadow-indigo-700/20 sm:p-8 lg:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-blue-50 backdrop-blur">
                <span>🎓</span>
                <span>
                  Ranker Bhaiya Student Zone
                </span>
              </div>

              <p className="text-sm font-semibold text-blue-100">
                {getGreeting()}, {displayName}!
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Ready to learn smarter?
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
                Ranker Bhaiya brings learning resources,
                current affairs, and AI-powered guidance
                together in one place — helping you learn
                smarter, stay ahead, and prepare with
                confidence.
              </p>

              {(className ||
                examName) && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {className && (
                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                      Class {className}
                    </span>
                  )}

                  {examName && (
                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                      🎯 {examName}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={
                    handleAskVidhya
                  }
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  🤖 Ask Vidhya
                </button>

                <button
                  type="button"
                  onClick={
                    handlePracticeQuestions
                  }
                  className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
                >
                  Practice Now →
                </button>
              </div>
            </div>

            {/* ASK VIDHYA */}

            <button
              type="button"
              onClick={
                handleAskVidhya
              }
              className="group relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-5 text-left backdrop-blur transition hover:bg-white/15 lg:w-72"
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-300/20 blur-xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">
                    🤖
                  </div>

                  <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-100">
                    AI Assistant
                  </span>
                </div>

                <h2 className="mt-5 text-xl font-black text-white">
                  Ask Vidhya
                </h2>

                <p className="mt-2 text-sm leading-6 text-blue-100">
                  Doubt hai? Concepts samjho, questions solve
                  karo aur AI-powered learning support lo.
                </p>

                <div className="mt-5 text-sm font-black text-white">
                  Start Learning →
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* =====================================================
            DAILY MINDSET
        ===================================================== */}

        <section className="mt-6">
          <div
            className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl dark:bg-amber-950/40">
                🧠
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                  Daily Mindset
                </p>

                <h2 className="mt-1 text-lg font-black">
                  {dailyMindset}
                </h2>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            TOP STATS
        ===================================================== */}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">

          {/* STREAK */}

          <div
            className={`rounded-3xl border p-5 ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-xl dark:bg-orange-950/40">
                🔥
              </div>

              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                {weeklyActiveDays}/7 days
              </span>
            </div>

            <p className="mt-5 text-3xl font-black">
              {loading
                ? "—"
                : streak}
            </p>

            <p
              className={`mt-1 text-sm font-semibold ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Day Streak
            </p>
          </div>

          {/* MISSION */}

          <div
            className={`rounded-3xl border p-5 ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-xl dark:bg-emerald-950/40">
                🎯
              </div>

              <span
                className={`text-xs font-bold ${
                  missionCompleted
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {missionCompleted
                  ? "Completed"
                  : "Pending"}
              </span>
            </div>

            <p className="mt-5 text-xl font-black">
              Today's Mission
            </p>

            <p
              className={`mt-1 line-clamp-2 text-sm ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              {missionText}
            </p>
          </div>

          {/* PREPARATION */}

          <div
            className={`rounded-3xl border p-5 ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-xl dark:bg-blue-950/40">
                📊
              </div>

              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {preparationStats.accuracy}% accuracy
              </span>
            </div>

            <p className="mt-5 text-3xl font-black">
              {loading
                ? "—"
                : preparationStats.total}
            </p>

            <p
              className={`mt-1 text-sm font-semibold ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Questions Practiced
            </p>
          </div>
        </section>

        {/* =====================================================
            PREPARATION TOOLS
        ===================================================== */}

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
              Prepare Better
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Preparation Tools
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* STUDY PLANNER */}

            <button
              type="button"
              onClick={
                handleStudyPlanner
              }
              className={`group rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900 hover:border-blue-800"
                  : "border-slate-200 bg-white hover:border-blue-200"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-2xl dark:bg-indigo-950/40">
                📅
              </div>

              <h3 className="mt-5 text-lg font-black">
                Study Planner
              </h3>

              <p
                className={`mt-2 text-sm leading-6 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Apni daily aur weekly study planning ko
                organized rakho.
              </p>

              <span className="mt-4 inline-block text-sm font-black text-indigo-600 dark:text-indigo-400">
                Open Planner →
              </span>
            </button>

            {/* PRACTICE */}

            <button
              type="button"
              onClick={
                handlePracticeQuestions
              }
              className={`group rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900 hover:border-emerald-800"
                  : "border-slate-200 bg-white hover:border-emerald-200"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl dark:bg-emerald-950/40">
                📝
              </div>

              <h3 className="mt-5 text-lg font-black">
                Practice Questions
              </h3>

              <p
                className={`mt-2 text-sm leading-6 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Concepts ko questions ke through test karo.
              </p>

              <span className="mt-4 inline-block text-sm font-black text-emerald-600 dark:text-emerald-400">
                Start Practice →
              </span>
            </button>

            {/* SHORT VIDEOS */}

            <button
              type="button"
              onClick={
                handleShortVideos
              }
              className={`group rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900 hover:border-rose-800"
                  : "border-slate-200 bg-white hover:border-rose-200"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-2xl dark:bg-rose-950/40">
                🎬
              </div>

              <h3 className="mt-5 text-lg font-black">
                Short Videos
              </h3>

              <p
                className={`mt-2 text-sm leading-6 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Quick learning ke liye short educational
                videos dekho.
              </p>

              <span className="mt-4 inline-block text-sm font-black text-rose-600 dark:text-rose-400">
                Watch Videos →
              </span>
            </button>

            {/* DAILY CHALLENGE */}

            <button
              type="button"
              onClick={
                handleDailyChallenge
              }
              className={`group rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900 hover:border-amber-800"
                  : "border-slate-200 bg-white hover:border-amber-200"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl dark:bg-amber-950/40">
                ⚡
              </div>

              <h3 className="mt-5 text-lg font-black">
                Daily Challenge
              </h3>

              <p
                className={`mt-2 text-sm leading-6 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Har din ek focused challenge complete karo.
              </p>

              <span className="mt-4 inline-block text-sm font-black text-amber-600 dark:text-amber-400">
                Take Challenge →
              </span>
            </button>
          </div>
        </section>

        {/* =====================================================
            EXAM RESOURCES
        ===================================================== */}

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
              Exam Resources
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Study Material
            </h2>

            <p
              className={`mt-2 max-w-2xl text-sm ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              NCERT books aur Previous Year Papers ko ek
              hi jagah access karo.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">

            {/* NCERT */}

            <button
              type="button"
              onClick={
                handleNCERTBooks
              }
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 text-left shadow-lg shadow-emerald-600/10 transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur">
                    📚
                  </div>

                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white backdrop-blur">
                    Complete Books
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-black text-white">
                  NCERT Books
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-emerald-50">
                  Class-wise aur subject-wise complete NCERT
                  books ko PDF format mein access karo.
                </p>

                <div className="mt-6 inline-flex items-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-700 transition group-hover:bg-emerald-50">
                  Open NCERT Books →
                </div>
              </div>
            </button>

            {/* PYQ */}

            <button
              type="button"
              onClick={
                handlePreviousYearPapers
              }
              className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-rose-600 to-pink-600 p-6 text-left shadow-lg shadow-rose-600/10 transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="absolute -bottom-20 -right-10 h-48 w-48 rounded-full bg-white/10" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur">
                    📄
                  </div>

                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white backdrop-blur">
                    Practice Sets
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-black text-white">
                  Previous Year Papers
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-rose-50">
                  Previous year question paper sets ko solve
                  karo aur exam pattern ko better samjho.
                </p>

                <div className="mt-6 inline-flex items-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-rose-700 transition group-hover:bg-rose-50">
                  Open Question Papers →
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* =====================================================
            LEARNING HUB
        ===================================================== */}

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
              Learning Hub
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Learn Every Day
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

            {/* ASK VIDHYA */}

            <button
              type="button"
              onClick={
                handleAskVidhya
              }
              className={`group rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl lg:col-span-2 ${
                isDark
                  ? "border-violet-900/60 bg-gradient-to-br from-violet-950/70 to-slate-900"
                  : "border-violet-100 bg-gradient-to-br from-violet-50 to-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-2xl text-white">
                  🤖
                </div>

                <span className="rounded-full bg-violet-600/10 px-3 py-1 text-[10px] font-black uppercase text-violet-600 dark:text-violet-300">
                  Featured
                </span>
              </div>

              <h3 className="mt-5 text-xl font-black">
                Ask Vidhya
              </h3>

              <p
                className={`mt-2 text-sm leading-6 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-600"
                }`}
              >
                AI-powered learning assistant for doubts,
                concepts and study support.
              </p>

              <span className="mt-4 inline-block text-sm font-black text-violet-600 dark:text-violet-400">
                Ask Now →
              </span>
            </button>

            {/* CURRENT AFFAIRS */}

            <button
              type="button"
              onClick={
                handleCurrentAffairs
              }
              className={`rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-xl dark:bg-red-950/40">
                📰
              </div>

              <h3 className="mt-5 font-black">
                Current Affairs
              </h3>

              <p
                className={`mt-2 text-sm leading-6 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Daily exam-focused current affairs.
              </p>

              <span className="mt-4 inline-block text-xs font-black text-red-600 dark:text-red-400">
                Read →
              </span>
            </button>

            {/* NEWSPAPER */}

            <button
              type="button"
              onClick={
                handleDailyNewspaper
              }
              className={`rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-xl dark:bg-blue-950/40">
                🗞️
              </div>

              <h3 className="mt-5 font-black">
                Daily Newspaper
              </h3>

              <p
                className={`mt-2 text-sm leading-6 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Daily newspaper reading in one place.
              </p>

              <span className="mt-4 inline-block text-xs font-black text-blue-600 dark:text-blue-400">
                Read →
              </span>
            </button>

            {/* VOCABULARY */}

            <button
              type="button"
              onClick={
                handleVocabulary
              }
              className={`rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fuchsia-100 text-xl dark:bg-fuchsia-950/40">
                🔤
              </div>

              <h3 className="mt-5 font-black">
                Vocabulary
              </h3>

              <p
                className={`mt-2 text-sm leading-6 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Build your English vocabulary every day.
              </p>

              <span className="mt-4 inline-block text-xs font-black text-fuchsia-600 dark:text-fuchsia-400">
                Learn →
              </span>
            </button>

            {/* EXAM TIPS */}

            <button
              type="button"
              onClick={
                handleExamTips
              }
              className={`rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-xl dark:bg-amber-950/40">
                💡
              </div>

              <h3 className="mt-5 font-black">
                Exam Tips
              </h3>

              <p
                className={`mt-2 text-sm leading-6 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Strategy, revision and exam preparation tips.
              </p>

              <span className="mt-4 inline-block text-xs font-black text-amber-600 dark:text-amber-400">
                Explore →
              </span>
            </button>
          </div>
        </section>

        {/* =====================================================
            RECOMMENDATION
        ===================================================== */}

        <section className="mt-10">
          <div
            className={`overflow-hidden rounded-3xl border ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="grid lg:grid-cols-[1fr_auto]">
              <div className="p-6 sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                  Recommended For You
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {weakTopics.length >
                  0
                    ? `Work on ${weakTopics[0].name}`
                    : "Build Your Preparation"}
                </h2>

                <p
                  className={`mt-3 max-w-2xl text-sm leading-7 ${
                    isDark
                      ? "text-slate-400"
                      : "text-slate-500"
                  }`}
                >
                  {weakTopics.length >
                  0
                    ? `You have attempted ${weakTopics[0].total} questions in this area and ${weakTopics[0].wrong} were incorrect. Focused practice can improve your accuracy.`
                    : "Start with practice questions, current affairs and daily revision. Your dashboard will become more personalized as you practice."}
                </p>

                <button
                  type="button"
                  onClick={
                    handlePracticeQuestions
                  }
                  className="mt-6 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  Practice Now →
                </button>
              </div>

              <div className="flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 p-8 lg:w-64">
                <div className="text-center">
                  <div className="text-5xl">
                    🚀
                  </div>

                  <p className="mt-3 text-sm font-black text-white">
                    Keep Going!
                  </p>

                  <p className="mt-1 text-xs text-emerald-50">
                    Small progress every day.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            WEAK TOPICS
        ===================================================== */}

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-600 dark:text-rose-400">
                Smart Analysis
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Weak Topics
              </h2>
            </div>

            <button
              type="button"
              onClick={
                handleProgress
              }
              className="text-sm font-black text-blue-600 dark:text-blue-400"
            >
              View Progress →
            </button>
          </div>

          {weakTopics.length ===
          0 ? (
            <div
              className={`rounded-3xl border border-dashed p-8 text-center ${
                isDark
                  ? "border-slate-700 bg-slate-900"
                  : "border-slate-300 bg-white"
              }`}
            >
              <div className="text-4xl">
                🧠
              </div>

              <h3 className="mt-4 text-lg font-black">
                Weak topics will appear here
              </h3>

              <p
                className={`mx-auto mt-2 max-w-lg text-sm leading-6 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Practice more questions to let Ranker
                Bhaiya identify the topics where you need
                extra revision.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {weakTopics.map(
                (topic) => (
                  <div
                    key={
                      topic.name
                    }
                    className={`rounded-3xl border p-5 ${
                      isDark
                        ? "border-slate-800 bg-slate-900"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">
                          {topic.name}
                        </h3>

                        <p
                          className={`mt-1 text-xs ${
                            isDark
                              ? "text-slate-500"
                              : "text-slate-500"
                          }`}
                        >
                          {
                            topic.total
                          }{" "}
                          questions attempted
                        </p>
                      </div>

                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                        {
                          topic.accuracy
                        }
                        %
                      </span>
                    </div>

                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-500"
                        style={{
                          width: `${Math.max(
                            5,
                            topic.accuracy,
                          )}%`,
                        }}
                      />
                    </div>

                    <p className="mt-3 text-xs font-semibold text-rose-600 dark:text-rose-400">
                      {
                        topic.wrong
                      }{" "}
                      incorrect answers
                    </p>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        {/* =====================================================
            5-MINUTE CHALLENGE
        ===================================================== */}

        <section className="mt-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 p-6 sm:p-8">
            <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-white/10" />

            <div className="absolute -bottom-24 left-20 h-56 w-56 rounded-full bg-white/10" />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black text-white">
                  ⚡ 5-Minute Challenge
                </div>

                <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
                  Can you improve in 5 minutes?
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-rose-50">
                  Ek short focused challenge complete karo
                  aur apni preparation ko daily momentum do.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleActivity(
                    "/student/daily-challenge",
                  )
                }
                className="shrink-0 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-rose-600 shadow-lg transition hover:bg-rose-50"
              >
                Start Challenge →
              </button>
            </div>
          </div>
        </section>

        {/* =====================================================
            DAILY PRACTICE
        ===================================================== */}

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400">
              Daily Practice
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Keep Your Momentum
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">

            {/* QUICK REVISION */}

            <button
              type="button"
              onClick={
                handleQuickRevision
              }
              className={`rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl dark:bg-blue-950/40">
                ⚡
              </div>

              <h3 className="mt-5 text-lg font-black">
                Quick Revision
              </h3>

              <p
                className={`mt-2 text-sm leading-6 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Important concepts ko quickly revise karo.
              </p>

              <span className="mt-4 inline-block text-sm font-black text-blue-600 dark:text-blue-400">
                Revise →
              </span>
            </button>

            {/* HANDWRITTEN NOTES */}

            <button
              type="button"
              onClick={
                handleHandwrittenNotes
              }
              className={`rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-2xl dark:bg-purple-950/40">
                ✍️
              </div>

              <h3 className="mt-5 text-lg font-black">
                Handwritten Notes
              </h3>

              <p
                className={`mt-2 text-sm leading-6 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Quick revision ke liye visual handwritten
                notes dekho.
              </p>

              <span className="mt-4 inline-block text-sm font-black text-purple-600 dark:text-purple-400">
                Open Notes →
              </span>
            </button>

            {/* DAILY PRACTICE */}

            <button
              type="button"
              onClick={
                handlePracticeQuestions
              }
              className={`rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-xl ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl dark:bg-emerald-950/40">
                🔥
              </div>

              <h3 className="mt-5 text-lg font-black">
                Daily Practice
              </h3>

              <p
                className={`mt-2 text-sm leading-6 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Daily questions solve karke preparation
                consistent rakho.
              </p>

              <span className="mt-4 inline-block text-sm font-black text-emerald-600 dark:text-emerald-400">
                Practice →
              </span>
            </button>
          </div>
        </section>

        {/* =====================================================
            WEEKLY ACHIEVEMENTS
        ===================================================== */}

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-600 dark:text-yellow-400">
              Your Progress
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Weekly Achievements
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* ACTIVE DAYS */}

            <div
              className={`rounded-3xl border p-5 ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="text-2xl">
                📅
              </div>

              <p className="mt-4 text-2xl font-black">
                {
                  weeklyActiveDays
                }
                /7
              </p>

              <p
                className={`mt-1 text-sm font-semibold ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Active Days
              </p>
            </div>

            {/* QUESTIONS */}

            <div
              className={`rounded-3xl border p-5 ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="text-2xl">
                📝
              </div>

              <p className="mt-4 text-2xl font-black">
                {
                  preparationStats.total
                }
              </p>

              <p
                className={`mt-1 text-sm font-semibold ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Questions Practiced
              </p>
            </div>

            {/* CORRECT */}

            <div
              className={`rounded-3xl border p-5 ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="text-2xl">
                🎯
              </div>

              <p className="mt-4 text-2xl font-black">
                {
                  preparationStats.correct
                }
              </p>

              <p
                className={`mt-1 text-sm font-semibold ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Correct Answers
              </p>
            </div>

            {/* ACCURACY */}

            <div
              className={`rounded-3xl border p-5 ${
                isDark
                  ? "border-slate-800 bg-slate-900"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="text-2xl">
                🏆
              </div>

              <p className="mt-4 text-2xl font-black">
                {
                  preparationStats.accuracy
                }
                %
              </p>

              <p
                className={`mt-1 text-sm font-semibold ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                Overall Accuracy
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            WEEKLY ACTIVITY
        ===================================================== */}

        <section className="mt-10">
          <div
            className={`rounded-3xl border p-6 ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                  Consistency
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Last 7 Days
                </h2>
              </div>

              <div className="text-2xl">
                📈
              </div>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-2 sm:gap-3">
              {lastSevenDates.map(
                (date) => {
                  const active =
                    activities.some(
                      (activity) =>
                        activity.activity_date ===
                        date,
                    );

                  const day =
                    new Date(
                      `${date}T12:00:00`,
                    ).toLocaleDateString(
                      "en-US",
                      {
                        weekday:
                          "short",
                      },
                    );

                  return (
                    <div
                      key={date}
                      className="text-center"
                    >
                      <div
                        className={`mx-auto flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black transition sm:h-12 sm:w-12 ${
                          active
                            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20"
                            : isDark
                              ? "bg-slate-800 text-slate-500"
                              : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {active
                          ? "✓"
                          : "·"}
                      </div>

                      <p
                        className={`mt-2 text-[10px] font-bold sm:text-xs ${
                          isDark
                            ? "text-slate-500"
                            : "text-slate-500"
                        }`}
                      >
                        {day}
                      </p>
                    </div>
                  );
                },
              )}
            </div>

            {todayActivities.length >
              0 && (
              <div className="mt-6 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/20">
                <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                  🎉 Today's activity
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {Array.from(
                    new Set(
                      todayActivities.map(
                        (
                          activity,
                        ) =>
                          ACTIVITY_LABELS[
                            activity
                              .activity_type
                          ] ||
                          activity.activity_type,
                      ),
                    ),
                  ).map(
                    (label) => (
                      <span
                        key={
                          label
                        }
                        className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-slate-900 dark:text-emerald-300"
                      >
                        {label}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            ABOUT
        ===================================================== */}

        <section className="mt-10">
          <div
            className={`rounded-3xl border p-6 sm:p-8 ${
              isDark
                ? "border-slate-800 bg-slate-900"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                About Ranker Bhaiya
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Your preparation, all in one place.
              </h2>

              <p
                className={`mt-4 text-sm leading-7 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-600"
                }`}
              >
                Ranker Bhaiya is a student-focused learning
                platform built to make exam preparation
                simpler, smarter, and more effective. From
                daily current affairs and newspaper reading
                to fast revision, vocabulary building, and
                AI-powered learning support, everything is
                designed to help students stay consistent,
                learn with clarity, and prepare with
                confidence.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer className="py-10 text-center">
          <p
            className={`text-xs font-semibold ${
              isDark
                ? "text-slate-600"
                : "text-slate-400"
            }`}
          >
            ©{" "}
            {new Date().getFullYear()}{" "}
            Ranker Bhaiya
          </p>

          <p
            className={`mt-1 text-[11px] ${
              isDark
                ? "text-slate-700"
                : "text-slate-400"
            }`}
          >
            Aapki Mehnat, Hamari Strategy.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default StudentDashboard;
