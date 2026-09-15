import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type SubjectProgress = {
  id: string;
  subject: string;
  icon: string;
  completed: number;
  total: number;
};

type ProgressRow = {
  id: string;
  subject: string;
  completed: number;
  total: number;
  study_minutes: number;
  mock_tests: number;
  current_streak: number;
};

type DayActivity = {
  day: string;
  minutes: number;
};

const DEFAULT_SUBJECTS = [
  {
    subject: "Current Affairs",
    icon: "📰",
    total: 25,
  },
  {
    subject: "English",
    icon: "📚",
    total: 30,
  },
  {
    subject: "Reasoning",
    icon: "🧠",
    total: 25,
  },
  {
    subject: "General Knowledge",
    icon: "🌍",
    total: 25,
  },
];

const DEFAULT_WEEKLY_ACTIVITY: DayActivity[] =
  [
    { day: "Mon", minutes: 0 },
    { day: "Tue", minutes: 0 },
    { day: "Wed", minutes: 0 },
    { day: "Thu", minutes: 0 },
    { day: "Fri", minutes: 0 },
    { day: "Sat", minutes: 0 },
    { day: "Sun", minutes: 0 },
  ];

const getSubjectIcon = (
  subject: string,
) => {
  switch (subject) {
    case "Current Affairs":
      return "📰";

    case "English":
      return "📚";

    case "Reasoning":
      return "🧠";

    case "General Knowledge":
      return "🌍";

    case "Mathematics":
      return "🔢";

    default:
      return "📖";
  }
};

export default function ProgressTracker() {
  const navigate = useNavigate();

  /* =====================================================
     STATE
  ===================================================== */

  const [subjects, setSubjects] =
    useState<SubjectProgress[]>([]);

  const [studyMinutes, setStudyMinutes] =
    useState(0);

  const [mockTests, setMockTests] =
    useState(0);

  const [streak, setStreak] =
    useState(0);

  const [weeklyActivity, setWeeklyActivity] =
    useState<DayActivity[]>(
      DEFAULT_WEEKLY_ACTIVITY,
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =====================================================
     LOAD PROGRESS
  ===================================================== */

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(
        "Please login to view your progress.",
      );

      setLoading(false);
      return;
    }

    /*
     * Load student's progress rows.
     */

    const {
      data,
      error: fetchError,
    } = await supabase
      .from("student_progress")
      .select(
        `
          id,
          subject,
          completed,
          total,
          study_minutes,
          mock_tests,
          current_streak
        `,
      )
      .eq("user_id", user.id)
      .order("subject", {
        ascending: true,
      });

    if (fetchError) {
      console.error(
        "Failed to load student progress:",
        fetchError,
      );

      setError(
        "Unable to load your progress. Please try again.",
      );

      setLoading(false);
      return;
    }

    /*
     * If the student has no progress yet,
     * create default subject rows.
     */

    if (!data || data.length === 0) {
      const defaultRows =
        DEFAULT_SUBJECTS.map(
          (item) => ({
            user_id: user.id,
            subject: item.subject,
            completed: 0,
            total: item.total,
            study_minutes: 0,
            mock_tests: 0,
            current_streak: 0,
          }),
        );

      const {
        data: insertedRows,
        error: insertError,
      } = await supabase
        .from("student_progress")
        .insert(defaultRows)
        .select(
          `
            id,
            subject,
            completed,
            total,
            study_minutes,
            mock_tests,
            current_streak
          `,
        );

      if (insertError) {
        console.error(
          "Failed to create default progress:",
          insertError,
        );

        setError(
          "Unable to create your progress profile.",
        );

        setLoading(false);
        return;
      }

      applyProgressData(
        insertedRows ?? [],
      );
    } else {
      applyProgressData(data);
    }

    setLoading(false);
  };

  /* =====================================================
     APPLY PROGRESS DATA
  ===================================================== */

  const applyProgressData = (
    rows: ProgressRow[],
  ) => {
    const formattedSubjects =
      rows.map((row) => ({
        id: row.id,
        subject: row.subject,
        icon: getSubjectIcon(
          row.subject,
        ),
        completed: row.completed,
        total: row.total,
      }));

    setSubjects(formattedSubjects);

    const totalStudyMinutes =
      rows.reduce(
        (sum, row) =>
          sum + Number(row.study_minutes || 0),
        0,
      );

    const totalMockTests =
      rows.reduce(
        (sum, row) =>
          sum + Number(row.mock_tests || 0),
        0,
      );

    const maximumStreak =
      rows.length > 0
        ? Math.max(
            ...rows.map(
              (row) =>
                Number(
                  row.current_streak || 0,
                ),
            ),
          )
        : 0;

    setStudyMinutes(
      totalStudyMinutes,
    );

    setMockTests(totalMockTests);

    setStreak(maximumStreak);
  };

  /* =====================================================
     UPDATE SUBJECT PROGRESS
  ===================================================== */

  const updateSubjectProgress = async (
    subjectName: string,
    change: number,
  ) => {
    if (saving) {
      return;
    }

    const subject = subjects.find(
      (item) =>
        item.subject === subjectName,
    );

    if (!subject) {
      return;
    }

    const newCompleted = Math.min(
      subject.total,
      Math.max(
        0,
        subject.completed + change,
      ),
    );

    if (
      newCompleted === subject.completed
    ) {
      return;
    }

    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(
        "Your session has expired. Please login again.",
      );

      setSaving(false);
      return;
    }

    const { error: updateError } =
      await supabase
        .from("student_progress")
        .update({
          completed: newCompleted,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", subject.id)
        .eq("user_id", user.id);

    if (updateError) {
      console.error(
        "Failed to update subject progress:",
        updateError,
      );

      setError(
        "Unable to update progress. Please try again.",
      );

      setSaving(false);
      return;
    }

    setSubjects((current) =>
      current.map((item) =>
        item.id === subject.id
          ? {
              ...item,
              completed:
                newCompleted,
            }
          : item,
      ),
    );

    setSaving(false);
  };

  /* =====================================================
     UPDATE GLOBAL PROGRESS VALUE
  ===================================================== */

  const updateGlobalProgress = async (
    field:
      | "study_minutes"
      | "mock_tests"
      | "current_streak",
    amount: number,
  ) => {
    if (amount <= 0 || saving) {
      return;
    }

    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(
        "Your session has expired. Please login again.",
      );

      setSaving(false);
      return;
    }

    /*
     * Get current rows from Supabase.
     */

    const {
      data: rows,
      error: fetchError,
    } = await supabase
      .from("student_progress")
      .select(
        `
          id,
          subject,
          completed,
          total,
          study_minutes,
          mock_tests,
          current_streak
        `,
      )
      .eq("user_id", user.id);

    if (fetchError) {
      console.error(
        "Failed to fetch progress rows:",
        fetchError,
      );

      setError(
        "Unable to update progress.",
      );

      setSaving(false);
      return;
    }

    if (!rows || rows.length === 0) {
      setError(
        "Progress profile not found.",
      );

      setSaving(false);
      return;
    }

    /*
     * Store global values in the first
     * progress row. This keeps the existing
     * table structure simple.
     */

    const firstRow = rows[0];

    const updateData: Record<
      string,
      number | string
    > = {
      updated_at:
        new Date().toISOString(),
    };

    if (field === "study_minutes") {
      updateData.study_minutes =
        Number(
          firstRow.study_minutes || 0,
        ) + amount;
    }

    if (field === "mock_tests") {
      updateData.mock_tests =
        Number(
          firstRow.mock_tests || 0,
        ) + amount;
    }

    if (field === "current_streak") {
      updateData.current_streak =
        Number(
          firstRow.current_streak || 0,
        ) + amount;
    }

    const { error: updateError } =
      await supabase
        .from("student_progress")
        .update(updateData)
        .eq("id", firstRow.id)
        .eq("user_id", user.id);

    if (updateError) {
      console.error(
        "Failed to update global progress:",
        updateError,
      );

      setError(
        "Unable to save progress. Please try again.",
      );

      setSaving(false);
      return;
    }

    if (field === "study_minutes") {
      setStudyMinutes(
        (value) => value + amount,
      );
    }

    if (field === "mock_tests") {
      setMockTests(
        (value) => value + amount,
      );
    }

    if (field === "current_streak") {
      setStreak(
        (value) => value + amount,
      );
    }

    setSaving(false);
  };

  /* =====================================================
     RESET DEMO / PROGRESS
  ===================================================== */

  const resetProgress = async () => {
    if (saving) {
      return;
    }

    const confirmed =
      window.confirm(
        "Reset all your progress?",
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError(
        "Please login again.",
      );

      setSaving(false);
      return;
    }

    const { error: resetError } =
      await supabase
        .from("student_progress")
        .update({
          completed: 0,
          study_minutes: 0,
          mock_tests: 0,
          current_streak: 0,
          updated_at:
            new Date().toISOString(),
        })
        .eq("user_id", user.id);

    if (resetError) {
      console.error(
        "Failed to reset progress:",
        resetError,
      );

      setError(
        "Unable to reset progress.",
      );

      setSaving(false);
      return;
    }

    setSubjects((current) =>
      current.map((subject) => ({
        ...subject,
        completed: 0,
      })),
    );

    setStudyMinutes(0);
    setMockTests(0);
    setStreak(0);

    setWeeklyActivity(
      DEFAULT_WEEKLY_ACTIVITY,
    );

    setSaving(false);
  };

  /* =====================================================
     CALCULATIONS
  ===================================================== */

  const overallProgress = useMemo(() => {
    const totalCompleted =
      subjects.reduce(
        (sum, subject) =>
          sum + subject.completed,
        0,
      );

    const totalQuestions =
      subjects.reduce(
        (sum, subject) =>
          sum + subject.total,
        0,
      );

    if (totalQuestions === 0) {
      return 0;
    }

    return Math.round(
      (totalCompleted /
        totalQuestions) *
        100,
    );
  }, [subjects]);

  const totalCompleted = useMemo(
    () =>
      subjects.reduce(
        (sum, subject) =>
          sum + subject.completed,
        0,
      ),
    [subjects],
  );

  const totalTargets = useMemo(
    () =>
      subjects.reduce(
        (sum, subject) =>
          sum + subject.total,
        0,
      ),
    [subjects],
  );

  const maxWeeklyMinutes = Math.max(
    ...weeklyActivity.map(
      (item) => item.minutes,
    ),
    60,
  );

  /* =====================================================
     FORMAT STUDY TIME
  ===================================================== */

  const formatStudyTime = (
    minutes: number,
  ) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(
      minutes / 60,
    );

    const remaining =
      minutes % 60;

    if (remaining === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remaining} min`;
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 dark:border-slate-700 dark:border-t-emerald-400" />

            <p className="mt-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Loading your progress...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     MAIN UI
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-white">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/student/dashboard",
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              aria-label="Back to dashboard"
            >
              ←
            </button>

            <div>
              <h1 className="text-lg font-black tracking-tight sm:text-xl">
                Progress Tracker
              </h1>

              <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Track your preparation journey.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadProgress}
            disabled={saving}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ↻
            <span className="ml-1 hidden sm:inline">
              Refresh
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-xl shadow-emerald-600/20 sm:p-8 lg:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider backdrop-blur">
              📊 Your Progress
            </div>

            <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              See how far
              <br />
              you've come.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-base">
              Track your subjects, study time,
              mock tests and consistency — all in
              one place.
            </p>
          </div>
        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <span className="text-lg">
              ⚠️
            </span>

            <div className="flex-1">
              <p className="font-bold">
                Something went wrong
              </p>

              <p className="mt-1">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="text-lg opacity-70 hover:opacity-100"
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        )}

        {/* =================================================
            OVERALL PROGRESS
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Overall Preparation
              </p>

              <h3 className="mt-1 text-2xl font-black sm:text-3xl">
                {overallProgress}% Complete
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {totalCompleted} of{" "}
                {totalTargets} targets completed
              </p>
            </div>

            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-8 border-emerald-100 bg-white dark:border-emerald-950/50 dark:bg-slate-900">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {overallProgress}%
              </span>
            </div>
          </div>

          <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-cyan-500 transition-all duration-700"
              style={{
                width: `${overallProgress}%`,
              }}
            />
          </div>
        </section>

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-2xl">
              ⏱️
            </div>

            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Study Time
            </p>

            <p className="mt-1 text-2xl font-black">
              {formatStudyTime(
                studyMinutes,
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-2xl">
              📝
            </div>

            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Mock Tests
            </p>

            <p className="mt-1 text-2xl font-black">
              {mockTests}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-2xl">
              🔥
            </div>

            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Streak
            </p>

            <p className="mt-1 text-2xl font-black">
              {streak} days
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-2xl">
              🎯
            </div>

            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Completed
            </p>

            <p className="mt-1 text-2xl font-black">
              {totalCompleted}
            </p>
          </div>
        </section>

        {/* =================================================
            SUBJECT PROGRESS
        ================================================= */}

        <section className="mt-6">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Subject-wise
            </p>

            <h3 className="mt-1 text-xl font-black sm:text-2xl">
              Your Subject Progress
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {subjects.map(
              (subject) => {
                const percentage =
                  subject.total === 0
                    ? 0
                    : Math.round(
                        (subject.completed /
                          subject.total) *
                          100,
                      );

                return (
                  <article
                    key={subject.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">
                        {subject.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-black">
                              {subject.subject}
                            </h4>

                            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {
                                subject.completed
                              }{" "}
                              of{" "}
                              {
                                subject.total
                              }{" "}
                              completed
                            </p>
                          </div>

                          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                            {percentage}%
                          </span>
                        </div>

                        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              updateSubjectProgress(
                                subject.subject,
                                -1,
                              )
                            }
                            disabled={
                              saving ||
                              subject.completed <=
                                0
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-black text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                            aria-label={`Decrease ${subject.subject} progress`}
                          >
                            −
                          </button>

                          <span className="text-xs font-bold text-slate-400">
                            Update progress
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateSubjectProgress(
                                subject.subject,
                                1,
                              )
                            }
                            disabled={
                              saving ||
                              subject.completed >=
                                subject.total
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-lg font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label={`Increase ${subject.subject} progress`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        </section>

        {/* =================================================
            WEEKLY ACTIVITY
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Weekly Activity
            </p>

            <h3 className="mt-1 text-xl font-black">
              Study consistency
            </h3>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your study minutes across the week.
            </p>
          </div>

          <div className="mt-8 flex h-52 items-end justify-between gap-2 sm:gap-4">
            {weeklyActivity.map(
              (item) => {
                const height =
                  item.minutes === 0
                    ? 4
                    : Math.max(
                        8,
                        Math.round(
                          (item.minutes /
                            maxWeeklyMinutes) *
                            100,
                        ),
                      );

                return (
                  <div
                    key={item.day}
                    className="flex h-full flex-1 flex-col items-center justify-end"
                  >
                    <div className="mb-2 text-[10px] font-bold text-slate-400 sm:text-xs">
                      {item.minutes}m
                    </div>

                    <div
                      className="w-full max-w-12 rounded-t-xl bg-gradient-to-t from-emerald-600 to-cyan-400 transition-all duration-500"
                      style={{
                        height: `${height}%`,
                      }}
                    />

                    <div className="mt-3 text-xs font-black text-slate-500 dark:text-slate-400">
                      {item.day}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </section>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="mt-6">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quick Updates
            </p>

            <h3 className="mt-1 text-xl font-black">
              Keep your progress updated
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                updateGlobalProgress(
                  "study_minutes",
                  30,
                )
              }
              className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800"
            >
              <span className="text-2xl">
                ⏱️
              </span>

              <p className="mt-3 font-black">
                +30 Study Minutes
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Add a completed study session.
              </p>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                updateGlobalProgress(
                  "mock_tests",
                  1,
                )
              }
              className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-800"
            >
              <span className="text-2xl">
                📝
              </span>

              <p className="mt-3 font-black">
                +1 Mock Test
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Record a completed mock test.
              </p>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                updateGlobalProgress(
                  "current_streak",
                  1,
                )
              }
              className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-800"
            >
              <span className="text-2xl">
                🔥
              </span>

              <p className="mt-3 font-black">
                +1 Streak Day
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Record another consistent day.
              </p>
            </button>
          </div>
        </section>

        {/* =================================================
            MOTIVATION
        ================================================= */}

        <section className="mt-6 overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-5 dark:border-blue-900/40 dark:from-blue-950/20 dark:to-cyan-950/20 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-2xl dark:bg-blue-900/40">
              🚀
            </div>

            <div>
              <h3 className="font-black text-blue-900 dark:text-blue-200">
                Keep Going!
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-800/80 dark:text-blue-200/70">
                Every completed topic is one step
                closer to your goal. Focus on
                consistency rather than perfection.
                Small progress every day creates big
                results.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            RESET
        ================================================= */}

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            disabled={saving}
            onClick={resetProgress}
            className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/20"
          >
            Reset My Progress
          </button>
        </div>

        {/* =================================================
            DASHBOARD
        ================================================= */}

        <div className="mt-6 flex justify-center pb-6">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/student/dashboard",
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
