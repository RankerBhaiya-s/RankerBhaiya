import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type ChallengeQuestion = {
  id: string;
  category: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string | null;
  difficulty: string | null;
  created_at: string;
};

type AttemptResult = {
  questionId: string;
  selectedAnswer: string;
  correct: boolean;
};

const CATEGORY_OPTIONS = [
  "All",
  "Current Affairs",
  "English",
  "General Knowledge",
  "Reasoning",
];

function normalizeOptions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeQuestion(row: any): ChallengeQuestion {
  return {
    id: String(row.id),
    category: String(row.category ?? "General Knowledge"),
    question: String(row.question ?? ""),
    options: normalizeOptions(row.options),
    answer: String(row.answer ?? ""),
    explanation:
      row.explanation !== null && row.explanation !== undefined
        ? String(row.explanation)
        : null,
    difficulty:
      row.difficulty !== null && row.difficulty !== undefined
        ? String(row.difficulty)
        : null,
    created_at: String(row.created_at ?? ""),
  };
}

export default function DailyChallenge() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [savingAttempt, setSavingAttempt] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  // ------------------------------------------------------------
  // LOAD USER
  // ------------------------------------------------------------

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    setUserId(user.id);
    await loadQuestions();
  }

  // ------------------------------------------------------------
  // LOAD DAILY QUESTIONS
  // ------------------------------------------------------------

  async function loadQuestions() {
    try {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("practice_questions")
        .select(
          `
            id,
            category,
            question,
            options,
            answer,
            explanation,
            difficulty,
            created_at
          `,
        )
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const normalized = (data ?? [])
        .map(normalizeQuestion)
        .filter(
          (item) =>
            item.question.trim() &&
            item.options.length >= 2 &&
            item.answer.trim(),
        );

      /*
       * Daily Challenge:
       * Latest published questions are used as the daily pool.
       * The first 10 questions are shown.
       */
      setQuestions(normalized.slice(0, 10));
    } catch (err: any) {
      console.error("Daily Challenge load error:", err);

      setError(
        err?.message ||
          "Daily Challenge load nahi ho saka. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------------------------------
  // FILTER QUESTIONS
  // ------------------------------------------------------------

  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return questions.filter((item) => {
      const categoryMatch =
        category === "All" ||
        item.category.toLowerCase() === category.toLowerCase();

      const searchMatch =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.options.some((option) =>
          option.toLowerCase().includes(query),
        );

      return categoryMatch && searchMatch;
    });
  }, [questions, category, search]);

  // ------------------------------------------------------------
  // CURRENT QUESTION
  // ------------------------------------------------------------

  const currentQuestion = filteredQuestions[currentIndex];

  const answeredCount = attempts.length;

  const correctCount = attempts.filter(
    (attempt) => attempt.correct,
  ).length;

  const progress =
    filteredQuestions.length > 0
      ? Math.round(
          ((currentIndex + (selectedAnswer ? 1 : 0)) /
            filteredQuestions.length) *
            100,
        )
      : 0;

  // ------------------------------------------------------------
  // SELECT ANSWER
  // ------------------------------------------------------------

  async function handleAnswer(option: string) {
    if (!currentQuestion || selectedAnswer || savingAttempt) {
      return;
    }

    setSelectedAnswer(option);
    setSavingAttempt(true);

    const correct =
      option.trim().toLowerCase() ===
      currentQuestion.answer.trim().toLowerCase();

    const result: AttemptResult = {
      questionId: currentQuestion.id,
      selectedAnswer: option,
      correct,
    };

    setAttempts((prev) => [...prev, result]);

    // Save attempt to Supabase
    if (userId) {
      const { error: insertError } = await supabase
        .from("practice_attempts")
        .insert({
          user_id: userId,
          question_id: currentQuestion.id,
          selected_answer: option,
          is_correct: correct,
        });

      if (insertError) {
        console.error(
          "Daily Challenge attempt save error:",
          insertError,
        );
      }
    }

    setSavingAttempt(false);
  }

  // ------------------------------------------------------------
  // NEXT QUESTION
  // ------------------------------------------------------------

  function handleNext() {
    if (!selectedAnswer) return;

    if (currentIndex >= filteredQuestions.length - 1) {
      setFinished(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer(null);
  }

  // ------------------------------------------------------------
  // PREVIOUS QUESTION
  // ------------------------------------------------------------

  function handlePrevious() {
    if (currentIndex === 0) return;

    const previousQuestion = filteredQuestions[currentIndex - 1];

    const previousAttempt = attempts.find(
      (attempt) => attempt.questionId === previousQuestion.id,
    );

    setCurrentIndex((prev) => prev - 1);
    setSelectedAnswer(previousAttempt?.selectedAnswer ?? null);
  }

  // ------------------------------------------------------------
  // RETRY
  // ------------------------------------------------------------

  function handleRetry() {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAttempts([]);
    setFinished(false);
  }

  // ------------------------------------------------------------
  // RESET FILTER
  // ------------------------------------------------------------

  function handleCategoryChange(value: string) {
    setCategory(value);
    setCurrentIndex(0);
    setSelectedAnswer(null);
  }

  // ------------------------------------------------------------
  // FINISH SCREEN
  // ------------------------------------------------------------

  if (finished) {
    const total = filteredQuestions.length;
    const score = correctCount;
    const accuracy =
      total > 0 ? Math.round((score / total) * 100) : 0;

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => navigate("/student/dashboard")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              ← Dashboard
            </button>

            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Daily Challenge
            </div>
          </div>

          {/* Result */}
          <div className="overflow-hidden rounded-3xl border border-orange-200 bg-white shadow-xl dark:border-orange-900/40 dark:bg-slate-900">
            <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 px-6 py-12 text-center text-white sm:px-10">
              <div className="mb-4 text-6xl">🔥</div>

              <h1 className="text-3xl font-black sm:text-4xl">
                Challenge Complete!
              </h1>

              <p className="mt-3 text-orange-50">
                Aaj ka challenge successfully complete ho gaya.
              </p>
            </div>

            <div className="p-6 sm:p-10">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-orange-50 p-6 text-center dark:bg-orange-950/20">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Score
                  </p>

                  <p className="mt-2 text-4xl font-black text-orange-600 dark:text-orange-400">
                    {score}/{total}
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-6 text-center dark:bg-emerald-950/20">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Accuracy
                  </p>

                  <p className="mt-2 text-4xl font-black text-emerald-600 dark:text-emerald-400">
                    {accuracy}%
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-6 text-center dark:bg-blue-950/20">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Questions
                  </p>

                  <p className="mt-2 text-4xl font-black text-blue-600 dark:text-blue-400">
                    {total}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="font-bold">💡 Keep going!</p>

                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Daily practice se speed, accuracy aur confidence
                  continuously improve hota hai.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleRetry}
                  className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 font-bold text-white shadow-lg transition hover:scale-[1.01]"
                >
                  🔄 Retry Challenge
                </button>

                <button
                  onClick={() =>
                    navigate("/student/progress")
                  }
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  📊 View Progress
                </button>

                <button
                  onClick={() =>
                    navigate("/student/dashboard")
                  }
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  🏠 Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // LOADING
  // ------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
        <div className="mx-auto max-w-5xl">
          <div className="animate-pulse">
            <div className="h-12 w-40 rounded-xl bg-slate-200 dark:bg-slate-800" />

            <div className="mt-6 h-48 rounded-3xl bg-slate-200 dark:bg-slate-800" />

            <div className="mt-6 h-96 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // ERROR
  // ------------------------------------------------------------

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-lg dark:border-red-900/40 dark:bg-slate-900">
            <div className="text-5xl">⚠️</div>

            <h1 className="mt-4 text-2xl font-black">
              Something went wrong
            </h1>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              {error}
            </p>

            <button
              onClick={loadQuestions}
              className="mt-6 rounded-xl bg-orange-500 px-6 py-3 font-bold text-white"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // EMPTY
  // ------------------------------------------------------------

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="text-6xl">🔥</div>

            <h1 className="mt-5 text-2xl font-black">
              Today's Challenge is not ready yet
            </h1>

            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Admin panel se published practice questions add
              karne ke baad Daily Challenge yahan show hoga.
            </p>

            <button
              onClick={() =>
                navigate("/student/dashboard")
              }
              className="mt-6 rounded-xl bg-orange-500 px-6 py-3 font-bold text-white"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // NO FILTER RESULTS
  // ------------------------------------------------------------

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() =>
                navigate("/student/dashboard")
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold dark:border-slate-800 dark:bg-slate-900"
            >
              ← Dashboard
            </button>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="text-5xl">🔎</div>

            <h2 className="mt-4 text-2xl font-black">
              No questions found
            </h2>

            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Search ya category filter change karke try karo.
            </p>

            <button
              onClick={() => {
                setSearch("");
                setCategory("All");
                setCurrentIndex(0);
              }}
              className="mt-5 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCorrect =
    selectedAnswer !== null &&
    selectedAnswer.trim().toLowerCase() ===
      currentQuestion.answer.trim().toLowerCase();

  // ------------------------------------------------------------
  // MAIN UI
  // ------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        {/* TOP BAR */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() =>
              navigate("/student/dashboard")
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Dashboard
          </button>

          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Daily Challenge
            </p>

            <p className="font-black">
              Question {currentIndex + 1} /{" "}
              {filteredQuestions.length}
            </p>
          </div>
        </div>

        {/* HERO */}
        <section className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
                🔥 DAILY PRACTICE
              </div>

              <h1 className="text-3xl font-black sm:text-4xl">
                Daily Challenge
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-orange-50 sm:text-base">
                Roz ke questions solve karo, apni accuracy improve
                karo aur preparation ko next level par le jao.
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 p-5 text-center backdrop-blur">
              <div className="text-3xl font-black">
                {correctCount}
              </div>

              <div className="text-xs font-semibold text-orange-50">
                Correct
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH + CATEGORY */}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                🔎
              </span>

              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentIndex(0);
                  setSelectedAnswer(null);
                }}
                placeholder="Search questions..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-orange-950"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORY_OPTIONS.map((item) => (
                <button
                  key={item}
                  onClick={() =>
                    handleCategoryChange(item)
                  }
                  className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition ${
                    category === item
                      ? "bg-orange-500 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* PROGRESS */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>
              Progress: {currentIndex + 1}/
              {filteredQuestions.length}
            </span>

            <span>{Math.min(progress, 100)}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
              style={{
                width: `${Math.min(progress, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* QUESTION CARD */}
        <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {/* Question Header */}
          <div className="border-b border-slate-100 p-5 dark:border-slate-800 sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                {currentQuestion.category}
              </span>

              {currentQuestion.difficulty && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {currentQuestion.difficulty}
                </span>
              )}
            </div>

            <h2 className="mt-5 text-xl font-black leading-8 sm:text-2xl">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <div className="p-5 sm:p-7">
            <div className="grid gap-3">
              {currentQuestion.options.map(
                (option, index) => {
                  const selected =
                    selectedAnswer === option;

                  const correct =
                    option.trim().toLowerCase() ===
                    currentQuestion.answer
                      .trim()
                      .toLowerCase();

                  let optionClass =
                    "border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-orange-700 dark:hover:bg-orange-950/20";

                  if (selected && isCorrect) {
                    optionClass =
                      "border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/30";
                  } else if (selected && !isCorrect) {
                    optionClass =
                      "border-red-500 bg-red-50 dark:border-red-600 dark:bg-red-950/30";
                  } else if (
                    selectedAnswer &&
                    correct
                  ) {
                    optionClass =
                      "border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/30";
                  }

                  return (
                    <button
                      key={`${currentQuestion.id}-${index}`}
                      onClick={() =>
                        handleAnswer(option)
                      }
                      disabled={Boolean(selectedAnswer)}
                      className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${optionClass} ${
                        selectedAnswer
                          ? "cursor-default"
                          : "cursor-pointer"
                      }`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {String.fromCharCode(65 + index)}
                      </span>

                      <span className="flex-1 font-semibold leading-6">
                        {option}
                      </span>

                      {selectedAnswer && correct && (
                        <span className="text-xl">
                          ✓
                        </span>
                      )}

                      {selected &&
                        !correct && (
                          <span className="text-xl">
                            ✕
                          </span>
                        )}
                    </button>
                  );
                },
              )}
            </div>

            {/* FEEDBACK */}
            {selectedAnswer && (
              <div
                className={`mt-5 rounded-2xl border p-5 ${
                  isCorrect
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                    : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {isCorrect ? "🎉" : "❌"}
                  </span>

                  <h3
                    className={`font-black ${
                      isCorrect
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-red-700 dark:text-red-400"
                    }`}
                  >
                    {isCorrect
                      ? "Correct Answer!"
                      : "Wrong Answer"}
                  </h3>
                </div>

                {!isCorrect && (
                  <p className="mt-3 text-sm font-semibold">
                    Correct Answer:{" "}
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      {currentQuestion.answer}
                    </span>
                  </p>
                )}

                {currentQuestion.explanation && (
                  <div className="mt-4 rounded-xl bg-white/70 p-4 dark:bg-slate-900/50">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Explanation
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* NAVIGATION */}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                ← Previous
              </button>

              <button
                onClick={handleNext}
                disabled={!selectedAnswer}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 font-black text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {currentIndex ===
                filteredQuestions.length - 1
                  ? "Finish Challenge 🔥"
                  : "Next Question →"}
              </button>
            </div>
          </div>
        </section>

        {/* STATS */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Answered
            </p>

            <p className="mt-2 text-2xl font-black">
              {answeredCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Correct
            </p>

            <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {correctCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Accuracy
            </p>

            <p className="mt-2 text-2xl font-black text-orange-600 dark:text-orange-400">
              {answeredCount > 0
                ? Math.round(
                    (correctCount / answeredCount) * 100,
                  )
                : 0}
              %
            </p>
          </div>
        </div>

        {/* TIP */}
        <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-900/40 dark:bg-orange-950/20">
          <div className="flex gap-3">
            <div className="text-2xl">💡</div>

            <div>
              <p className="font-black text-orange-800 dark:text-orange-300">
                Daily Tip
              </p>

              <p className="mt-1 text-sm leading-6 text-orange-700 dark:text-orange-400">
                Guess karne se pehle options ko eliminate karo.
                Exam mein elimination technique speed aur
                accuracy dono improve kar sakti hai.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
