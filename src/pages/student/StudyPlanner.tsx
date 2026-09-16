import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

type StudyTask = {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  duration: number;
  completed: boolean;
  created_at: string;
};

type ProgressSubject =
  | "Current Affairs"
  | "English"
  | "Reasoning"
  | "General Knowledge";

const DEFAULT_TOTALS: Record<ProgressSubject, number> = {
  "Current Affairs": 25,
  English: 30,
  Reasoning: 25,
  "General Knowledge": 25,
};

const DEFAULT_TASKS = [
  {
    subject: "Current Affairs",
    topic: "Daily Current Affairs",
    duration: 30,
  },
  {
    subject: "English",
    topic: "Vocabulary & Idioms",
    duration: 30,
  },
  {
    subject: "Revision",
    topic: "Fast Revision",
    duration: 45,
  },
];

const SUBJECTS = [
  "Current Affairs",
  "English",
  "Reasoning",
  "General Knowledge",
  "Mathematics",
  "Science",
  "Revision",
  "Other",
];

const DURATIONS = [15, 30, 45, 60, 90, 120];

function getProgressSubject(
  subject: string
): ProgressSubject {
  const normalized = subject.trim().toLowerCase();

  if (
    normalized.includes("current") ||
    normalized.includes("affair")
  ) {
    return "Current Affairs";
  }

  if (
    normalized.includes("english") ||
    normalized.includes("vocab") ||
    normalized.includes("idiom")
  ) {
    return "English";
  }

  if (normalized.includes("reason")) {
    return "Reasoning";
  }

  return "General Knowledge";
}

function getTodayIndia(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

async function updateProgressAfterStudy(
  userId: string,
  subject: string,
  duration: number
): Promise<void> {
  const progressSubject =
    getProgressSubject(subject);

  const defaultTotal =
    DEFAULT_TOTALS[progressSubject];

  try {
    const { data: existing, error: fetchError } =
      await supabase
        .from("student_progress")
        .select(
          "id, completed, total, study_minutes, mock_tests, current_streak"
        )
        .eq("user_id", userId)
        .eq("subject", progressSubject)
        .maybeSingle();

    if (fetchError) {
      console.error(
        "Progress fetch error:",
        fetchError.message
      );
      return;
    }

    if (!existing) {
      const { error: insertError } =
        await supabase
          .from("student_progress")
          .insert({
            user_id: userId,
            subject: progressSubject,
            completed: 1,
            total: defaultTotal,
            study_minutes: duration,
            mock_tests: 0,
            current_streak: 0,
            updated_at:
              new Date().toISOString(),
          });

      if (insertError) {
        console.error(
          "Progress insert error:",
          insertError.message
        );
      }

      return;
    }

    const currentCompleted = Number(
      existing.completed ?? 0
    );

    const currentMinutes = Number(
      existing.study_minutes ?? 0
    );

    const { error: updateError } =
      await supabase
        .from("student_progress")
        .update({
          completed: currentCompleted + 1,
          study_minutes:
            currentMinutes + duration,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", existing.id)
        .eq("user_id", userId);

    if (updateError) {
      console.error(
        "Progress update error:",
        updateError.message
      );
    }
  } catch (error) {
    console.error(
      "updateProgressAfterStudy error:",
      error
    );
  }
}

async function updateStudyActivity(
  userId: string,
  minutes: number
): Promise<void> {
  const today = getTodayIndia();

  try {
    const { data: existing, error: fetchError } =
      await supabase
        .from("study_activity")
        .select("id, minutes")
        .eq("user_id", userId)
        .eq("activity_date", today)
        .maybeSingle();

    if (fetchError) {
      console.error(
        "Study activity fetch error:",
        fetchError.message
      );
      return;
    }

    if (!existing) {
      const { error: insertError } =
        await supabase
          .from("study_activity")
          .insert({
            user_id: userId,
            activity_date: today,
            minutes,
          });

      if (insertError) {
        console.error(
          "Study activity insert error:",
          insertError.message
        );
      }

      return;
    }

    const currentMinutes = Number(
      existing.minutes ?? 0
    );

    const { error: updateError } =
      await supabase
        .from("study_activity")
        .update({
          minutes: currentMinutes + minutes,
        })
        .eq("id", existing.id)
        .eq("user_id", userId);

    if (updateError) {
      console.error(
        "Study activity update error:",
        updateError.message
      );
    }
  } catch (error) {
    console.error(
      "updateStudyActivity error:",
      error
    );
  }
}

export default function StudyPlanner() {
  const navigate = useNavigate();

  const { user, loading: authLoading } =
    useAuth();

  const { theme } = useTheme();

  const isDark = theme === "dark";

  const [tasks, setTasks] = useState<StudyTask[]>(
    []
  );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showAddTask, setShowAddTask] =
    useState(false);

  const [subject, setSubject] =
    useState("Current Affairs");

  const [topic, setTopic] =
    useState("");

  const [duration, setDuration] =
    useState(30);

  /*
   * --------------------------------------------------
   * AUTH + LOAD
   * --------------------------------------------------
   */

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/student/login");
      return;
    }

    void loadTasks();
  }, [
    user,
    authLoading,
    navigate,
  ]);

  async function loadTasks() {
    if (!user) return;

    try {
      setLoading(true);
      setError("");

      const { data, error: fetchError } =
        await supabase
          .from("study_tasks")
          .select(
            `
              id,
              user_id,
              subject,
              topic,
              duration,
              completed,
              created_at
            `
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: true,
          });

      if (fetchError) {
        console.error(fetchError);

        /*
         * If table doesn't exist yet, show a useful
         * error instead of silently failing.
         */
        setError(
          fetchError.message ||
            "Study Planner load nahi ho paya."
        );

        return;
      }

      setTasks(data ?? []);

      /*
       * First-time user ke liye default tasks.
       */
      if (!data || data.length === 0) {
        await createDefaultTasks();
      }
    } catch (err) {
      console.error(err);

      setError(
        "Study Planner load karte waqt error aa gaya."
      );
    } finally {
      setLoading(false);
    }
  }

  async function createDefaultTasks() {
    if (!user) return;

    try {
      const rows = DEFAULT_TASKS.map(
        (task) => ({
          user_id: user.id,
          subject: task.subject,
          topic: task.topic,
          duration: task.duration,
          completed: false,
        })
      );

      const { data, error: insertError } =
        await supabase
          .from("study_tasks")
          .insert(rows)
          .select(
            `
              id,
              user_id,
              subject,
              topic,
              duration,
              completed,
              created_at
            `
          );

      if (insertError) {
        console.error(
          "Default task insert error:",
          insertError.message
        );
        return;
      }

      setTasks(data ?? []);
    } catch (error) {
      console.error(
        "createDefaultTasks error:",
        error
      );
    }
  }

  /*
   * --------------------------------------------------
   * ADD TASK
   * --------------------------------------------------
   */

  async function handleAddTask() {
    if (!user) return;

    const cleanTopic = topic.trim();

    if (!cleanTopic) {
      setError(
        "Please task ka topic enter karo."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const { data, error: insertError } =
        await supabase
          .from("study_tasks")
          .insert({
            user_id: user.id,
            subject,
            topic: cleanTopic,
            duration,
            completed: false,
          })
          .select(
            `
              id,
              user_id,
              subject,
              topic,
              duration,
              completed,
              created_at
            `
          )
          .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        setTasks((previous) => [
          ...previous,
          data,
        ]);
      }

      setTopic("");
      setSubject("Current Affairs");
      setDuration(30);
      setShowAddTask(false);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Task add nahi ho paya."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * --------------------------------------------------
   * TOGGLE TASK
   * --------------------------------------------------
   */

  async function toggleTask(
    task: StudyTask
  ) {
    if (!user || saving) return;

    const newCompleted =
      !task.completed;

    try {
      setSaving(true);
      setError("");

      /*
       * Update DB first.
       */
      const { error: updateError } =
        await supabase
          .from("study_tasks")
          .update({
            completed: newCompleted,
          })
          .eq("id", task.id)
          .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      /*
       * Update local UI.
       */
      setTasks((previous) =>
        previous.map((item) =>
          item.id === task.id
            ? {
                ...item,
                completed:
                  newCompleted,
              }
            : item
        )
      );

      /*
       * IMPORTANT:
       *
       * Progress sirf task COMPLETE karne par
       * update hoga.
       *
       * Uncomplete karne par progress ko minus
       * nahi kar rahe, because study activity
       * already represent actual study performed.
       */
      if (newCompleted) {
        await updateProgressAfterStudy(
          user.id,
          task.subject,
          task.duration
        );

        await updateStudyActivity(
          user.id,
          task.duration
        );
      }
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Task status update nahi ho paya."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * --------------------------------------------------
   * DELETE TASK
   * --------------------------------------------------
   */

  async function deleteTask(
    task: StudyTask
  ) {
    if (!user || saving) return;

    const confirmed =
      window.confirm(
        `"${task.topic}" task delete karna hai?`
      );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");

      const { error: deleteError } =
        await supabase
          .from("study_tasks")
          .delete()
          .eq("id", task.id)
          .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      setTasks((previous) =>
        previous.filter(
          (item) => item.id !== task.id
        )
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Task delete nahi ho paya."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * --------------------------------------------------
   * STATS
   * --------------------------------------------------
   */

  const totalTasks = tasks.length;

  const completedTasks =
    tasks.filter(
      (task) => task.completed
    ).length;

  const pendingTasks =
    totalTasks - completedTasks;

  const totalStudyMinutes = tasks.reduce(
    (sum, task) =>
      sum +
      (task.completed
        ? task.duration
        : 0),
    0
  );

  const plannedMinutes = tasks.reduce(
    (sum, task) =>
      sum + task.duration,
    0
  );

  const progressPercent =
    totalTasks > 0
      ? Math.round(
          (completedTasks /
            totalTasks) *
            100
        )
      : 0;

  const groupedTasks = useMemo(() => {
    const groups: Record<
      string,
      StudyTask[]
    > = {};

    for (const task of tasks) {
      if (!groups[task.subject]) {
        groups[task.subject] = [];
      }

      groups[task.subject].push(task);
    }

    return groups;
  }, [tasks]);

  /*
   * --------------------------------------------------
   * LOADING
   * --------------------------------------------------
   */

  if (authLoading || loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark
            ? "bg-slate-950 text-white"
            : "bg-slate-50 text-slate-900"
        }`}
      >
        <div className="text-center">
          <div className="text-5xl animate-pulse mb-4">
            📅
          </div>

          <p className="font-black text-lg">
            Loading Study Planner...
          </p>

          <p
            className={`text-sm mt-1 ${
              isDark
                ? "text-slate-400"
                : "text-slate-500"
            }`}
          >
            Preparing your study plan
          </p>
        </div>
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * MAIN UI
   * --------------------------------------------------
   */

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* HEADER */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
          isDark
            ? "bg-slate-950/90 border-slate-800"
            : "bg-white/90 border-slate-200"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/student/dashboard"
              )
            }
            className={`flex items-center gap-2 font-bold ${
              isDark
                ? "text-slate-300 hover:text-white"
                : "text-slate-700 hover:text-slate-950"
            }`}
          >
            <span className="text-xl">
              ←
            </span>

            <span className="hidden sm:inline">
              Dashboard
            </span>
          </button>

          <div className="text-center">
            <h1 className="text-lg sm:text-xl font-black">
              📅 Study Planner
            </h1>

            <p
              className={`text-xs ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Plan. Study. Track. Improve.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/student/progress"
              )
            }
            className="rounded-xl bg-blue-600 px-3 sm:px-4 py-2 text-sm font-black text-white hover:bg-blue-700 transition"
          >
            📊 Progress
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-7">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-cyan-600 to-indigo-700 p-6 sm:p-9 text-white shadow-2xl mb-7">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative z-10 max-w-4xl">
            <span className="inline-flex rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-xs font-black tracking-wide backdrop-blur">
              📅 SMART STUDY PLANNER
            </span>

            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
              Make a plan.
              <br />
              Make progress.
            </h2>

            <p className="mt-3 max-w-2xl text-sm sm:text-base leading-7 text-white/85">
              Apne daily study tasks plan karo,
              complete karo aur tumhari study
              activity automatically Progress
              Tracker mein update hogi.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-xl font-black">
                  {totalTasks}
                </div>

                <div className="text-xs text-white/70">
                  Total Tasks
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-xl font-black">
                  {completedTasks}
                </div>

                <div className="text-xs text-white/70">
                  Completed
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-xl font-black">
                  {totalStudyMinutes}
                </div>

                <div className="text-xs text-white/70">
                  Minutes Studied
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3 ${
              isDark
                ? "border-red-900 bg-red-950/30 text-red-300"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <div className="flex items-start gap-3">
              <span>⚠️</span>

              <div>
                <p className="font-bold text-sm">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setError("")
                  }
                  className="mt-1 text-xs underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STATS */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <div
            className={`rounded-2xl border p-5 ${
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <div className="text-2xl">
              📚
            </div>

            <div className="mt-2 text-2xl font-black">
              {totalTasks}
            </div>

            <div
              className={`text-xs mt-1 ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Total Tasks
            </div>
          </div>

          <div
            className={`rounded-2xl border p-5 ${
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <div className="text-2xl">
              ✅
            </div>

            <div className="mt-2 text-2xl font-black text-green-500">
              {completedTasks}
            </div>

            <div
              className={`text-xs mt-1 ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Completed
            </div>
          </div>

          <div
            className={`rounded-2xl border p-5 ${
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <div className="text-2xl">
              ⏱️
            </div>

            <div className="mt-2 text-2xl font-black text-blue-500">
              {totalStudyMinutes}
            </div>

            <div
              className={`text-xs mt-1 ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Minutes Studied
            </div>
          </div>

          <div
            className={`rounded-2xl border p-5 ${
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <div className="text-2xl">
              ⏳
            </div>

            <div className="mt-2 text-2xl font-black text-orange-500">
              {pendingTasks}
            </div>

            <div
              className={`text-xs mt-1 ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Pending Tasks
            </div>
          </div>
        </section>

        {/* PROGRESS BAR */}
        <section
          className={`rounded-3xl border p-5 sm:p-6 mb-7 ${
            isDark
              ? "bg-slate-900 border-slate-800"
              : "bg-white border-slate-200 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <h3 className="font-black">
                Today's Plan
              </h3>

              <p
                className={`text-xs mt-1 ${
                  isDark
                    ? "text-slate-400"
                    : "text-slate-500"
                }`}
              >
                {completedTasks} of{" "}
                {totalTasks} tasks completed
              </p>
            </div>

            <div className="text-xl font-black text-blue-500">
              {progressPercent}%
            </div>
          </div>

          <div
            className={`h-3 overflow-hidden rounded-full ${
              isDark
                ? "bg-slate-800"
                : "bg-slate-100"
            }`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <span
              className={
                isDark
                  ? "text-slate-500"
                  : "text-slate-400"
              }
            >
              Planned:{" "}
              <span className="font-bold">
                {plannedMinutes} min
              </span>
            </span>

            <span
              className={
                isDark
                  ? "text-slate-500"
                  : "text-slate-400"
              }
            >
              Completed:{" "}
              <span className="font-bold">
                {totalStudyMinutes} min
              </span>
            </span>
          </div>
        </section>

        {/* ADD TASK BUTTON */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-black">
              Your Study Tasks
            </h2>

            <p
              className={`text-sm mt-1 ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Complete a task to automatically
              update your progress.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowAddTask(
                (previous) => !previous
              )
            }
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700 transition"
          >
            {showAddTask
              ? "✕ Close"
              : "＋ Add Task"}
          </button>
        </div>

        {/* ADD TASK FORM */}
        {showAddTask && (
          <section
            className={`rounded-3xl border p-5 sm:p-6 mb-7 ${
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <h3 className="text-lg font-black mb-5">
              ➕ Add New Study Task
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* SUBJECT */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  Subject
                </label>

                <select
                  value={subject}
                  onChange={(event) =>
                    setSubject(
                      event.target.value
                    )
                  }
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${
                    isDark
                      ? "bg-slate-950 border-slate-700 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                >
                  {SUBJECTS.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* TOPIC */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  Topic
                </label>

                <input
                  type="text"
                  value={topic}
                  onChange={(event) =>
                    setTopic(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Parliament, Vocabulary..."
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${
                    isDark
                      ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
                      : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                  }`}
                />
              </div>

              {/* DURATION */}
              <div>
                <label className="block text-sm font-bold mb-2">
                  Duration
                </label>

                <select
                  value={duration}
                  onChange={(event) =>
                    setDuration(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${
                    isDark
                      ? "bg-slate-950 border-slate-700 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-900"
                  }`}
                >
                  {DURATIONS.map(
                    (minutes) => (
                      <option
                        key={minutes}
                        value={minutes}
                      >
                        {minutes} minutes
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-5">
              <button
                type="button"
                onClick={handleAddTask}
                disabled={saving}
                className={`rounded-xl px-6 py-3 font-black text-white ${
                  saving
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {saving
                  ? "Saving..."
                  : "Add Task"}
              </button>
            </div>
          </section>
        )}

        {/* EMPTY STATE */}
        {tasks.length === 0 && (
          <section
            className={`rounded-3xl border p-10 text-center ${
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <div className="text-5xl mb-4">
              📚
            </div>

            <h3 className="text-xl font-black">
              No study tasks yet
            </h3>

            <p
              className={`mt-2 text-sm ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Add your first task and start
              building your study routine.
            </p>

            <button
              type="button"
              onClick={() =>
                setShowAddTask(true)
              }
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
            >
              ＋ Add First Task
            </button>
          </section>
        )}

        {/* TASK GROUPS */}
        <div className="space-y-6">
          {Object.entries(
            groupedTasks
          ).map(
            ([
              groupSubject,
              groupTasks,
            ]) => (
              <section
                key={groupSubject}
                className={`rounded-3xl border overflow-hidden ${
                  isDark
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div
                  className={`px-5 sm:px-6 py-4 border-b flex items-center justify-between ${
                    isDark
                      ? "border-slate-800"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl">
                      {groupSubject ===
                      "Current Affairs"
                        ? "📰"
                        : groupSubject ===
                          "English"
                        ? "📖"
                        : groupSubject ===
                          "Reasoning"
                        ? "🧠"
                        : groupSubject ===
                          "Mathematics"
                        ? "➗"
                        : groupSubject ===
                          "Science"
                        ? "🔬"
                        : groupSubject ===
                          "Revision"
                        ? "🔄"
                        : "📚"}
                    </div>

                    <div>
                      <h3 className="font-black">
                        {groupSubject}
                      </h3>

                      <p
                        className={`text-xs ${
                          isDark
                            ? "text-slate-500"
                            : "text-slate-400"
                        }`}
                      >
                        {
                          groupTasks.filter(
                            (task) =>
                              task.completed
                          ).length
                        }{" "}
                        /{" "}
                        {groupTasks.length}{" "}
                        completed
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  {groupTasks.map(
                    (task, index) => (
                      <div
                        key={task.id}
                        className={`p-4 sm:p-5 flex items-center gap-4 ${
                          index !==
                          groupTasks.length - 1
                            ? isDark
                              ? "border-b border-slate-800"
                              : "border-b border-slate-100"
                            : ""
                        }`}
                      >
                        {/* CHECK */}
                        <button
                          type="button"
                          onClick={() =>
                            toggleTask(task)
                          }
                          disabled={saving}
                          aria-label={
                            task.completed
                              ? "Mark task incomplete"
                              : "Mark task complete"
                          }
                          className={`w-10 h-10 shrink-0 rounded-xl border-2 flex items-center justify-center transition ${
                            task.completed
                              ? "bg-green-500 border-green-500 text-white"
                              : isDark
                              ? "border-slate-700 hover:border-blue-500"
                              : "border-slate-300 hover:border-blue-500"
                          }`}
                        >
                          {task.completed
                            ? "✓"
                            : ""}
                        </button>

                        {/* CONTENT */}
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`font-black text-sm sm:text-base ${
                              task.completed
                                ? "line-through opacity-50"
                                : ""
                            }`}
                          >
                            {task.topic}
                          </h4>

                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span
                              className={`text-xs ${
                                isDark
                                  ? "text-slate-500"
                                  : "text-slate-400"
                              }`}
                            >
                              ⏱️{" "}
                              {
                                task.duration
                              }{" "}
                              min
                            </span>

                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                task.completed
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-orange-500/10 text-orange-500"
                              }`}
                            >
                              {task.completed
                                ? "Completed"
                                : "Pending"}
                            </span>
                          </div>
                        </div>

                        {/* DELETE */}
                        <button
                          type="button"
                          onClick={() =>
                            deleteTask(task)
                          }
                          disabled={saving}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                            isDark
                              ? "text-slate-500 hover:text-red-400 hover:bg-red-950/30"
                              : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                          }`}
                          aria-label="Delete task"
                        >
                          🗑️
                        </button>
                      </div>
                    )
                  )}
                </div>
              </section>
            )
          )}
        </div>

        {/* SMART TIP */}
        <section
          className={`mt-7 rounded-3xl border p-5 sm:p-6 ${
            isDark
              ? "bg-indigo-950/30 border-indigo-900"
              : "bg-indigo-50 border-indigo-100"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">
              💡
            </div>

            <div>
              <h3 className="font-black">
                Smart Study Tip
              </h3>

              <p
                className={`mt-1 text-sm leading-6 ${
                  isDark
                    ? "text-indigo-300"
                    : "text-indigo-700"
                }`}
              >
                Chhote, focused study sessions
                complete karna consistency build
                karne mein help karta hai. Har task
                complete karne par tumhari study
                activity aur Progress Tracker
                automatically update ho jayega.
              </p>
            </div>
          </div>
        </section>

        {/* VIEW PROGRESS */}
        <section className="mt-7 text-center">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/student/progress"
              )
            }
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-4 text-white font-black shadow-xl shadow-blue-500/20 hover:scale-[1.01] transition"
          >
            📊 View My Progress
          </button>
        </section>
      </main>

      {/* FOOTER */}
      <footer
        className={`py-8 text-center text-xs ${
          isDark
            ? "text-slate-600"
            : "text-slate-400"
        }`}
      >
        Ranker Bhaiya • Smart Study Planner
      </footer>
    </div>
  );
}
