import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { recordStudentActivity } from "../../lib/studentActivity";

type Question = {
  id: string;
  category: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty?: string;
};

const BATCH_SIZE = 25;

const CATEGORY_ORDER = [
  "All",
  "Current Affairs",
  "English",
  "General Knowledge",
  "Reasoning",
];

const normalizeCategory = (category: string) => {
  return category.trim();
};

/* =====================================================
   RANDOM SHUFFLE
===================================================== */

function shuffleQuestions(
  items: Question[],
): Question[] {
  const shuffled = [...items];

  for (
    let index = shuffled.length - 1;
    index > 0;
    index--
  ) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1),
    );

    [
      shuffled[index],
      shuffled[randomIndex],
    ] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export default function PracticeQuestions() {
  const navigate = useNavigate();

  /* =====================================================
     STATE
  ===================================================== */

  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null);

  const [score, setScore] =
    useState(0);

  const [answeredCount, setAnsweredCount] =
    useState(0);

  const [savingAttempt, setSavingAttempt] =
    useState(false);

  const [finished, setFinished] =
    useState(false);

  /*
    Changes whenever a new practice session
    should receive a fresh random batch.
  */
  const [sessionRound, setSessionRound] =
    useState(0);

  /* =====================================================
     LOAD QUESTIONS
  ===================================================== */

  useEffect(() => {
    void loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(
        "Please login to practice questions.",
      );

      setLoading(false);
      return;
    }

    const {
      data,
      error: fetchError,
    } = await supabase
      .from("practice_questions")
      .select(
        `
          id,
          category,
          question,
          options,
          answer,
          explanation,
          difficulty
        `,
      )
      .eq("published", true)
      .order("created_at", {
        ascending: true,
      });

    if (fetchError) {
      console.error(
        "Failed to load practice questions:",
        fetchError,
      );

      setError(
        "Unable to load practice questions. Please try again.",
      );

      setQuestions([]);
      setLoading(false);
      return;
    }

    const formattedQuestions: Question[] =
      (data ?? [])
        .map((item) => {
          let options: string[] = [];

          if (Array.isArray(item.options)) {
            options = item.options.filter(
              (
                option,
              ): option is string =>
                typeof option === "string",
            );
          }

          return {
            id: item.id,
            category: normalizeCategory(
              item.category,
            ),
            question: item.question,
            options,
            answer: item.answer,
            explanation:
              item.explanation ?? "",
            difficulty:
              item.difficulty ?? "Easy",
          };
        })
        .filter(
          (question) =>
            question.question.trim() !== "" &&
            question.options.length > 0 &&
            question.answer.trim() !== "",
        );

    /*
      Randomize the complete question pool
      immediately after loading.
    */
    const randomizedQuestions =
      shuffleQuestions(
        formattedQuestions,
      );

    setQuestions(randomizedQuestions);

    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnsweredCount(0);
    setFinished(false);

    /*
      New load = fresh random session.
    */
    setSessionRound(
      (value) => value + 1,
    );

    setLoading(false);
  };

  /* =====================================================
     CATEGORIES
  ===================================================== */

  const categories = useMemo(() => {
    const databaseCategories =
      Array.from(
        new Set(
          questions
            .map(
              (question) =>
                question.category,
            )
            .filter(Boolean),
        ),
      );

    const orderedCategories =
      CATEGORY_ORDER.filter(
        (category) =>
          category === "All" ||
          databaseCategories.includes(
            category,
          ),
      );

    const additionalCategories =
      databaseCategories.filter(
        (category) =>
          !CATEGORY_ORDER.includes(
            category,
          ),
      );

    return [
      ...orderedCategories,
      ...additionalCategories,
    ];
  }, [questions]);

  /* =====================================================
     FILTER QUESTIONS
  ===================================================== */

  const filteredQuestions = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    return questions.filter(
      (question) => {
        const categoryMatch =
          selectedCategory === "All" ||
          question.category ===
            selectedCategory;

        const searchMatch =
          !query ||
          question.question
            .toLowerCase()
            .includes(query) ||
          question.category
            .toLowerCase()
            .includes(query) ||
          question.options.some(
            (option) =>
              option
                .toLowerCase()
                .includes(query),
          );

        return (
          categoryMatch &&
          searchMatch
        );
      },
    );
  }, [
    questions,
    selectedCategory,
    searchQuery,
  ]);

  /* =====================================================
     RANDOM 25 QUESTION BATCH
  ===================================================== */

  const batchQuestions = useMemo(() => {
    if (
      filteredQuestions.length === 0
    ) {
      return [];
    }

    /*
      Every new session:
      1. Filter questions
      2. Randomly shuffle them
      3. Take maximum 25
    */
    return shuffleQuestions(
      filteredQuestions,
    ).slice(0, BATCH_SIZE);
  }, [
    filteredQuestions,
    sessionRound,
  ]);

  /* =====================================================
     CURRENT QUESTION
  ===================================================== */

  const currentQuestion =
    batchQuestions[currentIndex];

  /* =====================================================
     RESET WHEN FILTER CHANGES
  ===================================================== */

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnsweredCount(0);
    setFinished(false);

    /*
      Changing category/search starts
      a completely new random 25-question batch.
    */
    setSessionRound(
      (value) => value + 1,
    );
  }, [
    selectedCategory,
    searchQuery,
  ]);

  /* =====================================================
     ANSWER
  ===================================================== */

  const handleAnswer = async (
    option: string,
  ) => {
    if (
      selectedAnswer !== null ||
      !currentQuestion ||
      savingAttempt
    ) {
      return;
    }

    setSelectedAnswer(option);

    setAnsweredCount(
      (value) => value + 1,
    );

    const isCorrect =
      option ===
      currentQuestion.answer;

    if (isCorrect) {
      setScore(
        (value) => value + 1,
      );
    }

    setSavingAttempt(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const {
        error: attemptError,
      } = await supabase
        .from("practice_attempts")
        .insert({
          user_id: user.id,
          question_id:
            currentQuestion.id,
          selected_answer: option,
          is_correct: isCorrect,
        });

      if (attemptError) {
        console.error(
          "Failed to save practice attempt:",
          attemptError,
        );
      }
    }

    setSavingAttempt(false);
  };

  /* =====================================================
     NEXT QUESTION
  ===================================================== */

  const handleNext = async () => {
    if (!selectedAnswer) {
      return;
    }

    /*
      25th question / last question
      of the current batch.
    */
    if (
      currentIndex >=
      batchQuestions.length - 1
    ) {
      setFinished(true);

      const activityResult =
        await recordStudentActivity({
          activityType:
            "practice_questions",
        });

      if (!activityResult.success) {
        console.error(
          "Failed to record practice activity:",
          activityResult.error,
        );
      }

      return;
    }

    setCurrentIndex(
      (value) => value + 1,
    );

    setSelectedAnswer(null);
  };

  /* =====================================================
     PREVIOUS QUESTION
  ===================================================== */

  const handlePrevious = () => {
    if (currentIndex <= 0) {
      return;
    }

    setCurrentIndex(
      (value) => value - 1,
    );

    setSelectedAnswer(null);
  };

  /* =====================================================
     RETRY
  ===================================================== */

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnsweredCount(0);
    setFinished(false);

    /*
      Fresh random 25-question batch.
    */
    setSessionRound(
      (value) => value + 1,
    );
  };

  /* =====================================================
     CATEGORY CHANGE
  ===================================================== */

  const handleCategoryChange = (
    category: string,
  ) => {
    setSelectedCategory(category);
    setSearchQuery("");
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnsweredCount(0);
    setFinished(false);

    /*
      Fresh random batch for the
      selected category.
    */
    setSessionRound(
      (value) => value + 1,
    );
  };

  /* =====================================================
     PROGRESS
  ===================================================== */

  const questionNumber =
    batchQuestions.length === 0
      ? 0
      : currentIndex + 1;

  const questionProgress =
    batchQuestions.length === 0
      ? 0
      : Math.round(
          (questionNumber /
            batchQuestions.length) *
            100,
        );

  const finalAccuracy =
    answeredCount === 0
      ? 0
      : Math.round(
          (score /
            answeredCount) *
            100,
        );

  /* =====================================================
     OPTION STATUS
  ===================================================== */

  const getOptionClass = (
    option: string,
  ) => {
    if (!selectedAnswer) {
      return "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-blue-950/30";
    }

    if (
      option ===
      currentQuestion?.answer
    ) {
      return "border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-300";
    }

    if (
      option === selectedAnswer &&
      option !==
        currentQuestion?.answer
    ) {
      return "border-red-500 bg-red-50 text-red-800 dark:border-red-500 dark:bg-red-950/30 dark:text-red-300";
    }

    return "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500";
  };

  /* =====================================================
     OPTION ICON
  ===================================================== */

  const getOptionIcon = (
    option: string,
  ) => {
    if (!selectedAnswer) {
      return "";
    }

    if (
      option ===
      currentQuestion?.answer
    ) {
      return "✓";
    }

    if (option === selectedAnswer) {
      return "✕";
    }

    return "";
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />

            <p className="mt-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Loading practice questions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     FINISHED SCREEN
  ===================================================== */

  if (finished) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/student/dashboard",
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                ←
              </button>

              <div>
                <h1 className="text-lg font-black">
                  Practice Questions
                </h1>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  25-question batch complete
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-4xl items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-4xl dark:bg-blue-950/40">
              🎯
            </div>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
              Batch Complete
            </p>

            <h2 className="mt-2 text-3xl font-black sm:text-4xl">
              Great job!
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
              You completed this random
              batch of{" "}
              <span className="font-black text-slate-700 dark:text-slate-200">
                {batchQuestions.length}
              </span>{" "}
              practice questions.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30">
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {score}
                </p>

                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  Correct
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
                <p className="text-2xl font-black">
                  {answeredCount}
                </p>

                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  Attempted
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {finalAccuracy}%
                </p>

                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  Accuracy
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
              >
                ↻ New Random 25
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/student/dashboard",
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* =====================================================
     MAIN PAGE
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Header */}
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
                Practice Questions
              </h1>

              <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Random batch of 25 questions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadQuestions()
            }
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ↻
            <span className="ml-1 hidden sm:inline">
              New Batch
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-purple-600/20 sm:p-8 lg:p-10">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />

          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider backdrop-blur">
              📝 Smart Practice
            </div>

            <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Practice more.
              <br />
              Improve faster.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-purple-50 sm:text-base">
              Every session gives you a
              fresh random batch of 25
              exam-focused questions.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-black backdrop-blur">
              🎯 {batchQuestions.length} Questions This Batch
            </div>
          </div>
        </section>

        {/* Error */}
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
              onClick={() => setError("")}
              className="text-lg opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
        )}

        {/* Search */}
        <section className="mt-6">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
              🔎
            </span>

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value,
                )
              }
              placeholder="Search questions..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </section>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {categories.map(
              (category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    handleCategoryChange(
                      category,
                    )
                  }
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-black transition sm:text-sm ${
                    selectedCategory ===
                    category
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {category}
                </button>
              ),
            )}
          </div>
        )}

        {/* Empty State */}
        {batchQuestions.length === 0 && (
          <section className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900 sm:p-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-3xl dark:bg-purple-950/40">
              📝
            </div>

            <h3 className="mt-5 text-xl font-black">
              No questions found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Try another category or
              change your search.
            </p>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory(
                  "All",
                );
                setSearchQuery("");
                setSessionRound(
                  (value) => value + 1,
                );
              }}
              className="mt-6 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-purple-700"
            >
              Show All Questions
            </button>
          </section>
        )}

        {/* Question Area */}
        {currentQuestion &&
          batchQuestions.length > 0 && (
            <section className="mt-6">
              {/* Progress */}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Question{" "}
                    {questionNumber} of{" "}
                    {batchQuestions.length}
                  </p>

                  <div className="mt-2 h-2 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 sm:w-64">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 transition-all duration-500"
                      style={{
                        width: `${questionProgress}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-black text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
                    {currentQuestion.category}
                  </span>

                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {currentQuestion.difficulty ??
                      "Easy"}
                  </span>
                </div>
              </div>

              {/* Question Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7 lg:p-8">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-sm font-black text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                    {questionNumber}
                  </div>

                  <h2 className="pt-1 text-lg font-black leading-7 sm:text-xl sm:leading-8 lg:text-2xl lg:leading-9">
                    {currentQuestion.question}
                  </h2>
                </div>

                {/* Options */}
                <div className="mt-7 grid gap-3">
                  {currentQuestion.options.map(
                    (
                      option,
                      optionIndex,
                    ) => (
                      <button
                        key={`${currentQuestion.id}-${option}`}
                        type="button"
                        disabled={
                          selectedAnswer !==
                            null ||
                          savingAttempt
                        }
                        onClick={() =>
                          void handleAnswer(
                            option,
                          )
                        }
                        className={`group flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition active:scale-[0.99] disabled:cursor-default sm:p-5 ${getOptionClass(
                          option,
                        )}`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${
                            selectedAnswer &&
                            option ===
                              currentQuestion.answer
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : selectedAnswer &&
                                  option ===
                                    selectedAnswer
                                ? "border-red-500 bg-red-500 text-white"
                                : "border-slate-200 bg-slate-50 text-slate-600 group-hover:border-purple-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                          }`}
                        >
                          {getOptionIcon(
                            option,
                          ) ||
                            String.fromCharCode(
                              65 +
                                optionIndex,
                            )}
                        </span>

                        <span className="flex-1 text-sm font-bold leading-6 sm:text-base">
                          {option}
                        </span>
                      </button>
                    ),
                  )}
                </div>

                {/* Feedback */}
                {selectedAnswer && (
                  <div
                    className={`mt-6 rounded-2xl border p-4 ${
                      selectedAnswer ===
                      currentQuestion.answer
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                        : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {selectedAnswer ===
                        currentQuestion.answer
                          ? "🎉"
                          : "💡"}
                      </div>

                      <div>
                        <h3
                          className={`font-black ${
                            selectedAnswer ===
                            currentQuestion.answer
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-red-700 dark:text-red-300"
                          }`}
                        >
                          {selectedAnswer ===
                          currentQuestion.answer
                            ? "Correct answer!"
                            : "Not quite right"}
                        </h3>

                        {selectedAnswer !==
                          currentQuestion.answer && (
                          <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                            Correct answer:{" "}
                            <span className="font-black">
                              {
                                currentQuestion.answer
                              }
                            </span>
                          </p>
                        )}

                        {currentQuestion.explanation && (
                          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {
                              currentQuestion.explanation
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={
                      handlePrevious
                    }
                    disabled={
                      currentIndex === 0
                    }
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    ← Previous
                  </button>

                  <p className="order-first text-center text-xs font-semibold text-slate-400 sm:order-none">
                    {savingAttempt
                      ? "Saving your answer..."
                      : selectedAnswer
                        ? "Review the explanation"
                        : "Choose an answer"}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      void handleNext()
                    }
                    disabled={
                      !selectedAnswer ||
                      savingAttempt
                    }
                    className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-purple-600/20 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {currentIndex ===
                    batchQuestions.length -
                      1
                      ? "Finish Practice ✓"
                      : "Next Question →"}
                  </button>
                </div>
              </div>
            </section>
          )}

        {/* Score */}
        {batchQuestions.length > 0 && (
          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Score
              </p>

              <p className="mt-1 text-2xl font-black text-purple-600 dark:text-purple-400">
                {score}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Attempted
              </p>

              <p className="mt-1 text-2xl font-black">
                {answeredCount}
              </p>
            </div>

            <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:col-span-1">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Accuracy
              </p>

              <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {answeredCount === 0
                  ? 0
                  : Math.round(
                      (score /
                        answeredCount) *
                        100,
                    )}
                %
              </p>
            </div>
          </section>
        )}

        {/* Tip */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-orange-950/20 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl dark:bg-amber-900/40">
              💡
            </div>

            <div>
              <h3 className="font-black text-amber-900 dark:text-amber-200">
                Smart Practice Tip
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-800/80 dark:text-amber-200/70">
                Don't just focus on your
                score. Read the explanation
                after every question and
                understand why an answer is
                correct. That's where real
                improvement happens.
              </p>
            </div>
          </div>
        </section>

        {/* Footer Button */}
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
