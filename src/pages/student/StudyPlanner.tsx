import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type Task = {
  id: string;
  subject: string;
  topic: string;
  duration: number;
  completed: boolean;
  task_date: string;
  created_at?: string;
};

const DURATION_OPTIONS = [
  15,
  30,
  45,
  60,
  90,
  120,
];

const SUBJECTS = [
  "Current Affairs",
  "English",
  "Reasoning",
  "General Knowledge",
  "Mathematics",
  "Other",
];

const getToday = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    now.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (date: string) => {
  const value = new Date(`${date}T00:00:00`);

  return value.toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );
};

export default function StudyPlanner() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>(
    [],
  );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showAddTask, setShowAddTask] =
    useState(false);

  const [newSubject, setNewSubject] =
    useState("");

  const [newTopic, setNewTopic] =
    useState("");

  const [newDuration, setNewDuration] =
    useState("30");

  const today = getToday();

  /* =====================================================
     LOAD TODAY'S TASKS
  ===================================================== */

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(
        "Please login to use your Study Planner.",
      );
      setLoading(false);
      return;
    }

    const { data, error: fetchError } =
      await supabase
        .from("study_tasks")
        .select(
          `
            id,
            subject,
            topic,
            duration,
            completed,
            task_date,
            created_at
          `,
        )
        .eq("user_id", user.id)
        .eq("task_date", today)
        .order("created_at", {
          ascending: true,
        });

    if (fetchError) {
      console.error(
        "Failed to load study tasks:",
        fetchError,
      );

      setError(
        "Unable to load your study plan. Please try again.",
      );

      setTasks([]);
      setLoading(false);
      return;
    }

    setTasks(data ?? []);
    setLoading(false);
  };

  /* =====================================================
     ADD TASK
  ===================================================== */

  const addTask = async () => {
    const subject = newSubject.trim();
    const topic = newTopic.trim();
    const duration =
      Number(newDuration) || 30;

    if (!subject) {
      setError("Please select a subject.");
      return;
    }

    if (!topic) {
      setError("Please enter a topic.");
      return;
    }

    if (duration <= 0) {
      setError(
        "Please select a valid duration.",
      );
      return;
    }

    setSaving(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(
        "Your session has expired. Please login again.",
      );
      setSaving(false);
      return;
    }

    const { data, error: insertError } =
      await supabase
        .from("study_tasks")
        .insert({
          user_id: user.id,
          subject,
          topic,
          duration,
          completed: false,
          task_date: today,
        })
        .select(
          `
            id,
            subject,
            topic,
            duration,
            completed,
            task_date,
            created_at
          `,
        )
        .single();

    if (insertError) {
      console.error(
        "Failed to add study task:",
        insertError,
      );

      setError(
        "Unable to add task. Please try again.",
      );

      setSaving(false);
      return;
    }

    if (data) {
      setTasks((current) => [
        ...current,
        data,
      ]);
    }

    setNewSubject("");
    setNewTopic("");
    setNewDuration("30");
    setShowAddTask(false);
    setSaving(false);
  };

  /* =====================================================
     TOGGLE TASK
  ===================================================== */

  const toggleTask = async (
    task: Task,
  ) => {
    setError("");

    const newCompleted =
      !task.completed;

    const { error: updateError } =
      await supabase
        .from("study_tasks")
        .update({
          completed: newCompleted,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", task.id);

    if (updateError) {
      console.error(
        "Failed to update task:",
        updateError,
      );

      setError(
        "Unable to update task. Please try again.",
      );

      return;
    }

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? {
              ...item,
              completed: newCompleted,
            }
          : item,
      ),
    );
  };

  /* =====================================================
     DELETE TASK
  ===================================================== */

  const deleteTask = async (
    id: string,
  ) => {
    setError("");

    const { error: deleteError } =
      await supabase
        .from("study_tasks")
        .delete()
        .eq("id", id);

    if (deleteError) {
      console.error(
        "Failed to delete task:",
        deleteError,
      );

      setError(
        "Unable to delete task. Please try again.",
      );

      return;
    }

    setTasks((current) =>
      current.filter(
        (task) => task.id !== id,
      ),
    );
  };

  /* =====================================================
     STATS
  ===================================================== */

  const totalTasks = tasks.length;

  const completedTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.completed,
      ).length,
    [tasks],
  );

  const totalMinutes = useMemo(
    () =>
      tasks.reduce(
        (total, task) =>
          total + task.duration,
        0,
      ),
    [tasks],
  );

  const completedMinutes = useMemo(
    () =>
      tasks
        .filter(
          (task) => task.completed,
        )
        .reduce(
          (total, task) =>
            total + task.duration,
          0,
        ),
    [tasks],
  );

  const progress =
    totalTasks === 0
      ? 0
      : Math.round(
          (completedTasks /
            totalTasks) *
            100,
        );

  /* =====================================================
     FORMAT STUDY TIME
  ===================================================== */

  const formatMinutes = (
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
     RENDER
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
                Study Planner
              </h1>

              <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Plan your day. Study smarter.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowAddTask(
                (value) => !value,
              )
            }
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
          >
            <span className="mr-1">
              +
            </span>
            <span className="hidden sm:inline">
              Add Task
            </span>
            <span className="sm:hidden">
              Add
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* =================================================
            HERO
        ================================================= */}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-cyan-600 to-sky-500 p-6 text-white shadow-xl shadow-blue-600/20 sm:p-8 lg:p-10">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            <div className="mb-3 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur">
              📅 Smart Study Planner
            </div>

            <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Make every study
              <br />
              session count.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-50 sm:text-base">
              Organise your subjects, set study
              durations, and track what you complete
              every day.
            </p>
          </div>
        </section>

        {/* =================================================
            DATE
        ================================================= */}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Today
            </p>

            <h2 className="mt-1 text-xl font-black sm:text-2xl">
              {formatDate(today)}
            </h2>
          </div>

          <button
            type="button"
            onClick={loadTasks}
            disabled={loading}
            className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ↻ Refresh
          </button>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
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
            ADD TASK FORM
        ================================================= */}

        {showAddTask && (
          <section className="mt-6 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm dark:border-blue-900/40 dark:bg-slate-900 sm:p-6">
            <div className="mb-5">
              <h3 className="text-lg font-black">
                Add a study task
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Add what you want to study today.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* Subject */}

              <div>
                <label
                  htmlFor="study-subject"
                  className="mb-2 block text-sm font-bold"
                >
                  Subject
                </label>

                <select
                  id="study-subject"
                  value={newSubject}
                  onChange={(event) =>
                    setNewSubject(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">
                    Select subject
                  </option>

                  {SUBJECTS.map(
                    (subject) => (
                      <option
                        key={subject}
                        value={subject}
                      >
                        {subject}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* Topic */}

              <div>
                <label
                  htmlFor="study-topic"
                  className="mb-2 block text-sm font-bold"
                >
                  Topic
                </label>

                <input
                  id="study-topic"
                  type="text"
                  value={newTopic}
                  onChange={(event) =>
                    setNewTopic(
                      event.target.value,
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      addTask();
                    }
                  }}
                  placeholder="e.g. Banking Current Affairs"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              {/* Duration */}

              <div>
                <label
                  htmlFor="study-duration"
                  className="mb-2 block text-sm font-bold"
                >
                  Duration
                </label>

                <select
                  id="study-duration"
                  value={newDuration}
                  onChange={(event) =>
                    setNewDuration(
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
                >
                  {DURATION_OPTIONS.map(
                    (duration) => (
                      <option
                        key={duration}
                        value={duration}
                      >
                        {duration} minutes
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddTask(false);
                  setNewSubject("");
                  setNewTopic("");
                  setNewDuration("30");
                  setError("");
                }}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addTask}
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Add Task"}
              </button>
            </div>
          </section>
        )}

        {/* =================================================
            STATS
        ================================================= */}

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-2xl">
              📚
            </div>

            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total Tasks
            </p>

            <p className="mt-1 text-2xl font-black">
              {totalTasks}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-2xl">
              ✅
            </div>

            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Completed
            </p>

            <p className="mt-1 text-2xl font-black">
              {completedTasks}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-2xl">
              ⏱️
            </div>

            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Study Time
            </p>

            <p className="mt-1 text-2xl font-black">
              {formatMinutes(
                totalMinutes,
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-2xl">
              🎯
            </div>

            <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Progress
            </p>

            <p className="mt-1 text-2xl font-black">
              {progress}%
            </p>
          </div>
        </section>

        {/* =================================================
            PROGRESS
        ================================================= */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Daily Progress
              </p>

              <h3 className="mt-1 text-xl font-black">
                {completedTasks} of{" "}
                {totalTasks} tasks completed
              </h3>
            </div>

            <div className="text-right">
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {progress}%
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatMinutes(
                  completedMinutes,
                )}{" "}
                completed
              </p>
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </section>

        {/* =================================================
            TASK LIST
        ================================================= */}

        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black">
                Today's Study Plan
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Complete your tasks one by one.
              </p>
            </div>

            {totalTasks > 0 && (
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                {totalTasks}{" "}
                {totalTasks === 1
                  ? "task"
                  : "tasks"}
              </span>
            )}
          </div>

          {/* Loading */}

          {loading && (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />

              <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Loading your study plan...
              </p>
            </div>
          )}

          {/* Empty */}

          {!loading &&
            tasks.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-14">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl dark:bg-blue-950/40">
                  📅
                </div>

                <h4 className="mt-5 text-xl font-black">
                  Your plan is empty
                </h4>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Add your first study task and
                  start building your productive
                  study day.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setShowAddTask(true)
                  }
                  className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  + Add Your First Task
                </button>
              </div>
            )}

          {/* Tasks */}

          {!loading &&
            tasks.length > 0 && (
              <div className="space-y-3">
                {tasks.map(
                  (task, index) => (
                    <article
                      key={task.id}
                      className={`group rounded-2xl border bg-white p-4 shadow-sm transition dark:bg-slate-900 sm:p-5 ${
                        task.completed
                          ? "border-emerald-200 dark:border-emerald-900/50"
                          : "border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}

                        <button
                          type="button"
                          onClick={() =>
                            toggleTask(task)
                          }
                          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 text-lg transition ${
                            task.completed
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-slate-300 bg-white text-transparent hover:border-blue-500 dark:border-slate-600 dark:bg-slate-950"
                          }`}
                          aria-label={
                            task.completed
                              ? "Mark incomplete"
                              : "Mark complete"
                          }
                        >
                          ✓
                        </button>

                        {/* Task info */}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                              {task.subject}
                            </span>

                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              ⏱️{" "}
                              {task.duration}{" "}
                              min
                            </span>
                          </div>

                          <h4
                            className={`mt-3 text-base font-black transition sm:text-lg ${
                              task.completed
                                ? "text-slate-400 line-through dark:text-slate-500"
                                : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {task.topic}
                          </h4>

                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Task #{index + 1}
                          </p>
                        </div>

                        {/* Delete */}

                        <button
                          type="button"
                          onClick={() =>
                            deleteTask(
                              task.id,
                            )
                          }
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                          aria-label="Delete task"
                        >
                          🗑️
                        </button>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
        </section>

        {/* =================================================
            SMART STUDY TIP
        ================================================= */}

        <section className="mt-6 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-orange-950/20 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl dark:bg-amber-900/40">
              💡
            </div>

            <div>
              <h3 className="text-base font-black text-amber-900 dark:text-amber-200">
                Smart Study Tip
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-800/80 dark:text-amber-200/70">
                Break longer study sessions into
                focused blocks. After completing a
                task, take a short break before
                starting the next one. Consistency
                beats cramming.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            DASHBOARD BUTTON
        ================================================= */}

        <div className="mt-8 flex justify-center pb-6">
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
