import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Task = {
  id: number;
  subject: string;
  topic: string;
  duration: number;
  completed: boolean;
};

const initialTasks: Task[] = [
  {
    id: 1,
    subject: "Current Affairs",
    topic: "Daily Current Affairs",
    duration: 30,
    completed: false,
  },
  {
    id: 2,
    subject: "English",
    topic: "Vocabulary & Idioms",
    duration: 30,
    completed: false,
  },
  {
    id: 3,
    subject: "Revision",
    topic: "Fast Revision",
    duration: 45,
    completed: false,
  },
];

export default function StudyPlanner() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showAddTask, setShowAddTask] = useState(false);

  const [newSubject, setNewSubject] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [newDuration, setNewDuration] = useState("30");

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks],
  );

  const totalMinutes = useMemo(
    () =>
      tasks.reduce((total, task) => total + task.duration, 0),
    [tasks],
  );

  const completedMinutes = useMemo(
    () =>
      tasks
        .filter((task) => task.completed)
        .reduce((total, task) => total + task.duration, 0),
    [tasks],
  );

  const progress =
    tasks.length > 0
      ? Math.round((completedTasks / tasks.length) * 100)
      : 0;

  const toggleTask = (id: number) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
            }
          : task,
      ),
    );
  };

  const deleteTask = (id: number) => {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== id),
    );
  };

  const addTask = () => {
    if (!newSubject.trim() || !newTopic.trim()) {
      return;
    }

    const task: Task = {
      id: Date.now(),
      subject: newSubject.trim(),
      topic: newTopic.trim(),
      duration: Number(newDuration) || 30,
      completed: false,
    };

    setTasks((currentTasks) => [...currentTasks, task]);

    setNewSubject("");
    setNewTopic("");
    setNewDuration("30");
    setShowAddTask(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">

        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          <button
            type="button"
            onClick={() => navigate("/student/dashboard")}
            className="flex items-center gap-3"
          >
            <img
              src={`${import.meta.env.BASE_URL}favicon.png`}
              alt="Ranker Bhaiya"
              className="h-10 w-10 rounded-xl object-cover shadow-lg"
            />

            <div className="hidden text-left sm:block">
              <div className="text-lg font-black tracking-tight">
                Ranker{" "}
                <span className="text-yellow-500">
                  Bhaiya
                </span>
              </div>

              <div className="text-[10px] font-medium text-slate-400">
                Aapki Mehnat · Hamari Strategy
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/student/dashboard")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            ← Dashboard
          </button>

        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 p-6 text-white shadow-xl shadow-blue-200/50 dark:shadow-none sm:p-9">

          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative z-10 max-w-3xl">

            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-black tracking-wide backdrop-blur">
              📅 SMART STUDY PLANNER
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Plan Your Study
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
              Apni daily study ko organize karo, important tasks
              complete karo aur preparation mein consistency maintain karo.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">

              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                🎯 Daily Goals
              </span>

              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                ⏱️ Time Planning
              </span>

              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                🔥 Stay Consistent
              </span>

            </div>

          </div>

        </section>

        {/* =====================================================
            STATS
        ===================================================== */}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">

          <StatCard
            icon="📚"
            label="Total Tasks"
            value={tasks.length.toString()}
            description="Today's planned tasks"
          />

          <StatCard
            icon="✅"
            label="Completed"
            value={completedTasks.toString()}
            description={`${completedMinutes} minutes completed`}
          />

          <StatCard
            icon="⏱️"
            label="Study Time"
            value={`${totalMinutes} min`}
            description={`${progress}% daily progress`}
          />

        </section>

        {/* =====================================================
            PROGRESS
        ===================================================== */}

        <section className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">

          <div className="flex items-center justify-between gap-4">

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400">
                TODAY'S PROGRESS
              </p>

              <h2 className="mt-1 text-xl font-black">
                Keep going! 🚀
              </h2>
            </div>

            <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
              {progress}%
            </div>

          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">

            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {completedTasks === tasks.length && tasks.length > 0
              ? "🎉 Amazing! Today's study plan is complete."
              : `You have completed ${completedTasks} of ${tasks.length} tasks.`}
          </p>

        </section>

        {/* =====================================================
            TASK HEADER
        ===================================================== */}

        <section className="mt-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                TODAY'S PLAN
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight">
                Your Study Tasks
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Complete each task and build your daily streak.
              </p>

            </div>

            <button
              type="button"
              onClick={() => setShowAddTask(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl dark:bg-white dark:text-slate-900"
            >
              <span className="text-lg">+</span>
              Add Study Task
            </button>

          </div>

        </section>

        {/* =====================================================
            ADD TASK
        ===================================================== */}

        {showAddTask && (
          <section className="mt-5 rounded-[1.75rem] border border-cyan-200 bg-cyan-50/70 p-5 dark:border-cyan-900/50 dark:bg-cyan-950/20 sm:p-6">

            <div className="flex items-center justify-between gap-3">

              <div>
                <h3 className="text-lg font-black">
                  Add New Task
                </h3>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Add something you want to complete today.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm hover:text-slate-900 dark:bg-slate-900 dark:hover:text-white"
              >
                ×
              </button>

            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">

              <InputField
                label="Subject"
                value={newSubject}
                onChange={setNewSubject}
                placeholder="e.g. Maths"
              />

              <InputField
                label="Topic"
                value={newTopic}
                onChange={setNewTopic}
                placeholder="e.g. Algebra"
              />

              <div>

                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Duration
                </label>

                <select
                  value={newDuration}
                  onChange={(event) =>
                    setNewDuration(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                  <option value="120">120 minutes</option>
                </select>

              </div>

            </div>

            <button
              type="button"
              onClick={addTask}
              className="mt-5 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-cyan-600/20 transition hover:-translate-y-0.5 hover:bg-cyan-700"
            >
              Add Task
            </button>

          </section>
        )}

        {/* =====================================================
            TASK LIST
        ===================================================== */}

        <section className="mt-5 space-y-4">

          {tasks.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">

              <div className="text-5xl">
                📅
              </div>

              <h3 className="mt-4 text-xl font-black">
                No study tasks yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Add your first study task and start building
                your daily preparation routine.
              </p>

              <button
                type="button"
                onClick={() => setShowAddTask(true)}
                className="mt-5 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-black text-white"
              >
                Add First Task
              </button>

            </div>
          ) : (
            tasks.map((task, index) => (
              <div
                key={task.id}
                className={`group rounded-[1.5rem] border p-5 shadow-sm transition duration-300 hover:shadow-lg sm:p-6 ${
                  task.completed
                    ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                }`}
              >

                <div className="flex items-start gap-4">

                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    aria-label={
                      task.completed
                        ? "Mark incomplete"
                        : "Mark complete"
                    }
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black transition ${
                      task.completed
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-300 bg-white text-transparent hover:border-cyan-500 dark:border-slate-600 dark:bg-slate-900"
                    }`}
                  >
                    ✓
                  </button>

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Task {index + 1}
                      </span>

                      <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-black text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400">
                        {task.subject}
                      </span>

                    </div>

                    <h3
                      className={`mt-3 text-lg font-black ${
                        task.completed
                          ? "text-emerald-700 line-through dark:text-emerald-400"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {task.topic}
                    </h3>

                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <span>⏱️</span>
                      <span>
                        {task.duration} minutes
                      </span>
                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    aria-label="Delete task"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/30"
                  >
                    🗑️
                  </button>

                </div>

              </div>
            ))
          )}

        </section>

        {/* =====================================================
            SMART TIPS
        ===================================================== */}

        <section className="mt-8 rounded-[1.75rem] border border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-6 dark:border-amber-900/50 dark:from-amber-950/20 dark:via-yellow-950/10 dark:to-orange-950/20 sm:p-7">

          <div className="flex gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-slate-900">
              💡
            </div>

            <div>

              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
                SMART STUDY TIP
              </p>

              <h3 className="mt-1 text-lg font-black">
                Consistency beats intensity.
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Roz thoda focused study karna long-term preparation
                mein ek din bahut zyada padhne se zyada effective hota hai.
                Apne daily tasks complete karo aur consistency maintain karo.
              </p>

            </div>

          </div>

        </section>

      </main>
    </div>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: string;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

      <div className="flex items-center justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800">
          {icon}
        </div>

        <span className="text-2xl font-black">
          {value}
        </span>

      </div>

      <p className="mt-4 text-sm font-black">
        {label}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}

/* =====================================================
   INPUT FIELD
===================================================== */

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition placeholder:text-slate-400 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-900"
      />

    </div>
  );
}
