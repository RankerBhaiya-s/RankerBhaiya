import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

type PracticeQuestion = {
  id: string;
  category: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string | null;
  difficulty: string | null;
  published: boolean;
  created_at: string;
};

type ChallengeAnswer = {
  questionId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
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

function getProgressSubject(category: string): ProgressSubject {
  const normalized = category.trim().toLowerCase();

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

function shuffleArray<T>(items: T[]): T[] {
  const array = [...items];

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

function parseOptions(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item));
      }
    } catch {
      return [];
    }
  }

  return [];
}

async function recordDailyProgress(
  userId: string,
  category: string
): Promise<void> {
  const subject = getProgressSubject(category);
  const defaultTotal = DEFAULT_TOTALS[subject];

  try {
    const { data: existing, error: fetchError } = await supabase
      .from("student_progress")
      .select(
        "id, completed, total, study_minutes, mock_tests, current_streak"
      )
      .eq("user_id", userId)
      .eq("subject", subject)
      .maybeSingle();

    if (fetchError) {
      console.error(
        "Progress fetch error:",
        fetchError.message
      );
      return;
    }

    if (!existing) {
      const { error: insertError } = await supabase
        .from("student_progress")
        .insert({
          user_id: userId,
          subject,
          completed: 1,
          total: defaultTotal,
          study_minutes: 1,
          mock_tests: 0,
          current_streak: 0,
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(
          "Progress insert error:",
          insertError.message
        );
      }

      return;
    }

    const currentCompleted = Number(existing.completed ?? 0);
    const currentStudyMinutes = Number(
      existing.study_minutes ?? 0
    );

    const { error: updateError } = await supabase
      .from("student_progress")
      .update({
        completed: currentCompleted + 1,
        study_minutes: currentStudyMinutes + 1,
        updated_at: new Date().toISOString(),
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
    console.error("recordDailyProgress error:", error);
  }
}

async function recordStudyActivity(
  userId: string
): Promise<void> {
  const today = getTodayIndia();

  try {
    const { data: existing, error: fetchError } = await supabase
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
      const { error: insertError } = await supabase
        .from("study_activity")
        .insert({
          user_id: userId,
          activity_date: today,
          minutes: 1,
        });

      if (insertError) {
        console.error(
          "Study activity insert error:",
          insertError.message
        );
      }

      return;
    }

    const currentMinutes = Number(existing.minutes ?? 0);

    const { error: updateError } = await supabase
      .from("study_activity")
      .update({
        minutes: currentMinutes + 1,
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
    console.error("recordStudyActivity error:", error);
  }
}

export default function DailyChallenge() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();

  const isDark = theme === "dark";

  const [questions, setQuestions] = useState<PracticeQuestion[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const [challengeQuestions, setChallengeQuestions] = useState<
    PracticeQuestion[]
  >([]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [answers, setAnswers] = useState<ChallengeAnswer[]>([]);

  const [finished, setFinished] = useState(false);

  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/student/login");
      return;
    }

    void loadQuestions();
  }, [user, authLoading, navigate]);

  async function loadQuestions() {
    setLoading(true);
    setError("");

    try {
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
            published,
            created_at
          `
        )
        .eq("published", true)
        .order("created_at", {
          ascending: false,
        });

      if (fetchError) {
        console.error(fetchError);

        setError(
          fetchError.message ||
            "Unable to load daily challenge."
        );

        return;
      }

      const formattedQuestions: PracticeQuestion[] =
        (data ?? []).map((item) => ({
          id: item.id,
          category: item.category ?? "General Knowledge",
          question: item.question ?? "",
          options: parseOptions(item.options),
          answer: item.answer ?? "",
          explanation: item.explanation ?? null,
          difficulty: item.difficulty ?? "Medium",
          published: item.published ?? true,
          created_at: item.created_at,
        }));

      setQuestions(formattedQuestions);
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong while loading the challenge."
      );
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        questions
          .map((question) => question.category)
          .filter(Boolean)
      )
    );

    return ["All", ...unique];
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return questions.filter((question) => {
      const matchesCategory =
        category === "All" ||
        question.category === category;

      const matchesSearch =
        !searchTerm ||
        question.question
          .toLowerCase()
          .includes(searchTerm) ||
        question.category
          .toLowerCase()
          .includes(searchTerm);

      return matchesCategory && matchesSearch;
    });
  }, [questions, category, search]);

  function startChallenge() {
    const selectedPool = filteredQuestions;

    if (selectedPool.length === 0) {
      return;
    }

    const shuffled = shuffleArray(selectedPool).slice(0, 10);

    setChallengeQuestions(shuffled);
    setCurrentIndex(0);
    setSelectedAnswer("");
    setSubmitted(false);
    setAnswers([]);
    setFinished(false);
    setError("");
  }

  const currentQuestion =
    challengeQuestions[currentIndex];

  const progressPercent =
    challengeQuestions.length > 0
      ? ((currentIndex + 1) /
          challengeQuestions.length) *
        100
      : 0;

  const score = useMemo(() => {
    return answers.filter(
      (answer) => answer.isCorrect
    ).length;
  }, [answers]);

  const accuracy =
    answers.length > 0
      ? Math.round((score / answers.length) * 100)
      : 0;

  function getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  function isCorrectAnswer(
    question: PracticeQuestion,
    option: string
  ): boolean {
    return (
      normalizeAnswer(option) ===
      normalizeAnswer(question.answer)
    );
  }

  async function submitAnswer() {
    if (!user || !currentQuestion || !selectedAnswer) {
      return;
    }

    if (submitted || saving) {
      return;
    }

    setSaving(true);
    setError("");

    const isCorrect = isCorrectAnswer(
      currentQuestion,
      selectedAnswer
    );

    try {
      /*
       * 1. Save the actual attempt first.
       */
      const { error: attemptError } = await supabase
        .from("practice_attempts")
        .insert({
          user_id: user.id,
          question_id: currentQuestion.id,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
        });

      /*
       * If attempt saving fails, do NOT update progress.
       * This keeps Progress Tracker consistent with actual attempts.
       */
      if (attemptError) {
        console.error(
          "Practice attempt error:",
          attemptError.message
        );

        setError(
          "Answer save nahi ho paya. Please try again."
        );

        return;
      }

      /*
       * 2. Add answer to local challenge history.
       */
      setAnswers((previous) => [
        ...previous,
        {
          questionId: currentQuestion.id,
          selectedAnswer,
          correctAnswer: currentQuestion.answer,
          isCorrect,
        },
      ]);

      /*
       * 3. Update Progress Tracker.
       */
      await recordDailyProgress(
        user.id,
        currentQuestion.category
      );

      /*
       * 4. Update Weekly Study Activity.
       */
      await recordStudyActivity(user.id);

      setSubmitted(true);
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong while submitting your answer."
      );
    } finally {
      setSaving(false);
    }
  }

  function nextQuestion() {
    if (!currentQuestion) return;

    if (currentIndex >= challengeQuestions.length - 1) {
      setFinished(true);
      return;
    }

    setCurrentIndex((previous) => previous + 1);
    setSelectedAnswer("");
    setSubmitted(false);
  }

  function previousQuestion() {
    if (currentIndex <= 0) return;

    setCurrentIndex((previous) => previous - 1);

    const previousQuestionId =
      challengeQuestions[currentIndex - 1]?.id;

    const previousAnswer = answers.find(
      (answer) =>
        answer.questionId === previousQuestionId
    );

    setSelectedAnswer(
      previousAnswer?.selectedAnswer ?? ""
    );

    setSubmitted(Boolean(previousAnswer));
  }

  function retryChallenge() {
    startChallenge();
  }

  function exitChallenge() {
    setChallengeQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer("");
    setSubmitted(false);
    setAnswers([]);
    setFinished(false);
    setError("");
  }

  function getResultMessage() {
    if (accuracy >= 90) {
      return "Excellent performance! 🔥";
    }

    if (accuracy >= 70) {
      return "Great work! Keep going. 💪";
    }

    if (accuracy >= 50) {
      return "Good attempt. More practice will help. 📚";
    }

    return "Keep practicing. Every attempt makes you better. 🚀";
  }

  const challengeStarted =
    challengeQuestions.length > 0 && !finished;

  /*
   * Auth loading
   */
  if (authLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark
            ? "bg-slate-950 text-white"
            : "bg-slate-50 text-slate-900"
        }`}
      >
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">
            🔥
          </div>

          <p className="font-semibold">
            Loading Daily Challenge...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Main page
   */
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark
          ? "bg-slate-950 text-white"
          : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl ${
          isDark
            ? "bg-slate-950/90 border-slate-800"
            : "bg-white/90 border-slate-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/student/dashboard")}
            className={`flex items-center gap-2 font-semibold transition ${
              isDark
                ? "text-slate-200 hover:text-white"
                : "text-slate-700 hover:text-slate-950"
            }`}
          >
            <span className="text-xl">←</span>
            <span className="hidden sm:inline">
              Dashboard
            </span>
          </button>

          <div className="text-center">
            <h1 className="font-black text-lg sm:text-xl">
              🔥 Daily Challenge
            </h1>

            <p
              className={`text-xs ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Test yourself every day
            </p>
          </div>

          <button
            onClick={() => navigate("/student/progress")}
            className="px-3 sm:px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition"
          >
            📊 Progress
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        {!challengeStarted && !finished && (
          <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 mb-8 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white shadow-2xl">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-black/10 rounded-full blur-3xl" />

            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs font-bold mb-4">
                🔥 DAILY PRACTICE
              </div>

              <h2 className="text-3xl sm:text-5xl font-black leading-tight">
                Challenge Yourself.
                <br />
                Improve Every Day.
              </h2>

              <p className="mt-4 text-white/85 max-w-2xl text-sm sm:text-base leading-relaxed">
                Practice random questions, track your accuracy,
                and build a consistent study habit with Daily
                Challenge.
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <div className="px-4 py-2 rounded-xl bg-white/15 border border-white/20">
                  <div className="font-black text-lg">
                    10
                  </div>
                  <div className="text-xs text-white/75">
                    Questions
                  </div>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white/15 border border-white/20">
                  <div className="font-black text-lg">
                    ⚡
                  </div>
                  <div className="text-xs text-white/75">
                    Quick Practice
                  </div>
                </div>

                <div className="px-4 py-2 rounded-xl bg-white/15 border border-white/20">
                  <div className="font-black text-lg">
                    📊
                  </div>
                  <div className="text-xs text-white/75">
                    Progress Tracking
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <div
            className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
              isDark
                ? "bg-red-950/40 border-red-900 text-red-300"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <div className="flex items-start gap-3">
              <span>⚠️</span>

              <div className="flex-1">
                <p className="font-semibold">
                  {error}
                </p>

                <button
                  onClick={() => setError("")}
                  className="mt-1 text-xs underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-20 text-center">
            <div className="text-5xl animate-pulse mb-4">
              🔥
            </div>

            <p className="font-semibold">
              Preparing your challenge...
            </p>

            <p
              className={`text-sm mt-1 ${
                isDark
                  ? "text-slate-400"
                  : "text-slate-500"
              }`}
            >
              Loading questions
            </p>
          </div>
        )}

        {/* Selection Screen */}
        {!loading &&
          !challengeStarted &&
          !finished && (
            <>
              {/* Filters */}
              <section
                className={`rounded-3xl border p-5 sm:p-6 mb-8 ${
                  isDark
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-5">
                  <div className="flex-1">
                    <label
                      className={`block text-sm font-bold mb-2 ${
                        isDark
                          ? "text-slate-200"
                          : "text-slate-700"
                      }`}
                    >
                      Search Questions
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2">
                        🔍
                      </span>

                      <input
                        value={search}
                        onChange={(event) =>
                          setSearch(event.target.value)
                        }
                        placeholder="Search questions..."
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none transition ${
                          isDark
                            ? "bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                            : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <div
                    className={`text-sm font-bold mb-3 ${
                      isDark
                        ? "text-slate-200"
                        : "text-slate-700"
                    }`}
                  >
                    Choose Category
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {categories.map((item) => {
                      const active =
                        category === item;

                      return (
                        <button
                          key={item}
                          onClick={() =>
                            setCategory(item)
                          }
                          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition ${
                            active
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                              : isDark
                              ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Start card */}
              <section
                className={`rounded-3xl border p-8 sm:p-12 text-center ${
                  isDark
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200 shadow-sm"
                }`}
              >
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-4xl shadow-xl">
                  🔥
                </div>

                <h3 className="mt-6 text-2xl sm:text-3xl font-black">
                  Ready for today's challenge?
                </h3>

                <p
                  className={`max-w-xl mx-auto mt-3 text-sm sm:text-base ${
                    isDark
                      ? "text-slate-400"
                      : "text-slate-500"
                  }`}
                >
                  We'll randomly select up to 10 questions
                  from your selected category.
                </p>

                <div className="flex flex-wrap justify-center gap-3 mt-6">
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      isDark
                        ? "bg-slate-800"
                        : "bg-slate-100"
                    }`}
                  >
                    <div className="font-black text-lg">
                      {Math.min(
                        filteredQuestions.length,
                        10
                      )}
                    </div>

                    <div
                      className={`text-xs ${
                        isDark
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      Questions
                    </div>
                  </div>

                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      isDark
                        ? "bg-slate-800"
                        : "bg-slate-100"
                    }`}
                  >
                    <div className="font-black text-lg">
                      {filteredQuestions.length}
                    </div>

                    <div
                      className={`text-xs ${
                        isDark
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      Available
                    </div>
                  </div>
                </div>

                {filteredQuestions.length === 0 ? (
                  <div
                    className={`mt-7 p-4 rounded-2xl text-sm ${
                      isDark
                        ? "bg-yellow-950/30 text-yellow-300"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    No questions found for this filter.
                    Try another category or search.
                  </div>
                ) : (
                  <button
                    onClick={startChallenge}
                    className="mt-8 px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-black text-base shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition"
                  >
                    🚀 Start Challenge
                  </button>
                )}
              </section>
            </>
          )}

        {/* Challenge */}
        {challengeStarted && currentQuestion && (
          <section className="max-w-4xl mx-auto">
            {/* Top controls */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <button
                onClick={exitChallenge}
                className={`text-sm font-semibold ${
                  isDark
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                ← Exit
              </button>

              <div
                className={`text-sm font-bold ${
                  isDark
                    ? "text-slate-300"
                    : "text-slate-600"
                }`}
              >
                Question {currentIndex + 1} of{" "}
                {challengeQuestions.length}
              </div>
            </div>

            {/* Progress */}
            <div
              className={`h-2 rounded-full overflow-hidden mb-6 ${
                isDark
                  ? "bg-slate-800"
                  : "bg-slate-200"
              }`}
            >
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </div>

            {/* Question card */}
            <div
              className={`rounded-3xl border overflow-hidden ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              {/* Question header */}
              <div
                className={`px-5 sm:px-8 py-5 border-b ${
                  isDark
                    ? "border-slate-800"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-black">
                    {currentQuestion.category}
                  </span>

                  {currentQuestion.difficulty && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        currentQuestion.difficulty
                          .toLowerCase()
                          .includes("hard")
                          ? "bg-red-500/10 text-red-500"
                          : currentQuestion.difficulty
                              .toLowerCase()
                              .includes("easy")
                          ? "bg-green-500/10 text-green-500"
                          : "bg-yellow-500/10 text-yellow-600"
                      }`}
                    >
                      {currentQuestion.difficulty}
                    </span>
                  )}
                </div>
              </div>

              {/* Question */}
              <div className="p-5 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-black leading-relaxed">
                  {currentQuestion.question}
                </h2>

                {/* Options */}
                <div className="mt-7 space-y-3">
                  {currentQuestion.options.map(
                    (option, index) => {
                      const isSelected =
                        selectedAnswer === option;

                      const correct =
                        isCorrectAnswer(
                          currentQuestion,
                          option
                        );

                      let optionClass = "";

                      if (submitted) {
                        if (correct) {
                          optionClass =
                            "border-green-500 bg-green-500/10";
                        } else if (isSelected) {
                          optionClass =
                            "border-red-500 bg-red-500/10";
                        } else {
                          optionClass = isDark
                            ? "border-slate-700 opacity-70"
                            : "border-slate-200 opacity-70";
                        }
                      } else if (isSelected) {
                        optionClass =
                          "border-blue-500 bg-blue-500/10";
                      } else {
                        optionClass = isDark
                          ? "border-slate-700 hover:border-blue-500"
                          : "border-slate-200 hover:border-blue-400";
                      }

                      return (
                        <button
                          key={`${currentQuestion.id}-${index}`}
                          onClick={() => {
                            if (!submitted) {
                              setSelectedAnswer(option);
                            }
                          }}
                          disabled={
                            submitted || saving
                          }
                          className={`w-full text-left p-4 rounded-2xl border-2 transition ${optionClass} ${
                            submitted
                              ? "cursor-default"
                              : "cursor-pointer"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <span
                              className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center font-black ${
                                submitted &&
                                correct
                                  ? "bg-green-500 text-white"
                                  : submitted &&
                                    isSelected
                                  ? "bg-red-500 text-white"
                                  : isSelected
                                  ? "bg-blue-600 text-white"
                                  : isDark
                                  ? "bg-slate-800 text-slate-300"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {getOptionLetter(
                                index
                              )}
                            </span>

                            <span className="pt-1 font-semibold text-sm sm:text-base">
                              {option}
                            </span>

                            {submitted &&
                              correct && (
                                <span className="ml-auto text-green-500 font-black">
                                  ✓
                                </span>
                              )}

                            {submitted &&
                              isSelected &&
                              !correct && (
                                <span className="ml-auto text-red-500 font-black">
                                  ✕
                                </span>
                              )}
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>

                {/* Feedback */}
                {submitted && (
                  <div
                    className={`mt-6 rounded-2xl p-5 ${
                      answers[
                        answers.length - 1
                      ]?.isCorrect
                        ? isDark
                          ? "bg-green-950/30 border border-green-900"
                          : "bg-green-50 border border-green-200"
                        : isDark
                        ? "bg-red-950/30 border border-red-900"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black">
                      {answers[
                        answers.length - 1
                      ]?.isCorrect
                        ? "🎉 Correct Answer!"
                        : "❌ Incorrect Answer"}
                    </div>

                    {!answers[
                      answers.length - 1
                    ]?.isCorrect && (
                      <p className="mt-2 text-sm">
                        <span className="font-bold">
                          Correct answer:
                        </span>{" "}
                        {currentQuestion.answer}
                      </p>
                    )}

                    {currentQuestion.explanation && (
                      <div className="mt-3">
                        <p className="text-xs uppercase tracking-wider font-black opacity-60">
                          Explanation
                        </p>

                        <p className="mt-1 text-sm leading-relaxed">
                          {
                            currentQuestion.explanation
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-7">
                  <button
                    onClick={previousQuestion}
                    disabled={
                      currentIndex === 0 || saving
                    }
                    className={`px-5 py-3 rounded-xl font-bold transition ${
                      currentIndex === 0
                        ? "opacity-40 cursor-not-allowed"
                        : isDark
                        ? "bg-slate-800 hover:bg-slate-700"
                        : "bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    ← Previous
                  </button>

                  {!submitted ? (
                    <button
                      onClick={submitAnswer}
                      disabled={
                        !selectedAnswer || saving
                      }
                      className={`flex-1 px-5 py-3 rounded-xl font-black text-white transition ${
                        !selectedAnswer || saving
                          ? "bg-blue-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {saving
                        ? "Saving..."
                        : "Submit Answer"}
                    </button>
                  ) : (
                    <button
                      onClick={nextQuestion}
                      className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-black hover:opacity-95 transition"
                    >
                      {currentIndex ===
                      challengeQuestions.length - 1
                        ? "🏁 Finish Challenge"
                        : "Next Question →"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Live score */}
            <div className="mt-5 flex justify-center">
              <div
                className={`px-5 py-3 rounded-2xl ${
                  isDark
                    ? "bg-slate-900 border border-slate-800"
                    : "bg-white border border-slate-200 shadow-sm"
                }`}
              >
                <span className="text-sm font-bold">
                  Current Score:{" "}
                </span>

                <span className="text-orange-500 font-black">
                  {score}
                </span>

                <span
                  className={
                    isDark
                      ? "text-slate-500"
                      : "text-slate-400"
                  }
                >
                  {" "}
                  / {answers.length}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Result Screen */}
        {finished && (
          <section className="max-w-4xl mx-auto">
            <div
              className={`rounded-3xl border overflow-hidden ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              {/* Result Hero */}
              <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white p-8 sm:p-12 text-center">
                <div className="text-6xl mb-4">
                  {accuracy >= 70
                    ? "🏆"
                    : accuracy >= 50
                    ? "🔥"
                    : "💪"}
                </div>

                <h2 className="text-3xl sm:text-4xl font-black">
                  Challenge Complete!
                </h2>

                <p className="mt-2 text-white/80">
                  {getResultMessage()}
                </p>

                <div className="mt-8">
                  <div className="text-6xl sm:text-7xl font-black">
                    {score}/{challengeQuestions.length}
                  </div>

                  <div className="mt-2 text-white/80 font-bold">
                    {accuracy}% Accuracy
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 sm:p-7">
                <div
                  className={`rounded-2xl p-4 text-center ${
                    isDark
                      ? "bg-slate-800"
                      : "bg-slate-50"
                  }`}
                >
                  <div className="text-2xl font-black text-green-500">
                    {score}
                  </div>

                  <div className="text-xs mt-1 opacity-60">
                    Correct
                  </div>
                </div>

                <div
                  className={`rounded-2xl p-4 text-center ${
                    isDark
                      ? "bg-slate-800"
                      : "bg-slate-50"
                  }`}
                >
                  <div className="text-2xl font-black text-red-500">
                    {answers.length - score}
                  </div>

                  <div className="text-xs mt-1 opacity-60">
                    Incorrect
                  </div>
                </div>

                <div
                  className={`rounded-2xl p-4 text-center ${
                    isDark
                      ? "bg-slate-800"
                      : "bg-slate-50"
                  }`}
                >
                  <div className="text-2xl font-black text-blue-500">
                    {answers.length}
                  </div>

                  <div className="text-xs mt-1 opacity-60">
                    Attempted
                  </div>
                </div>

                <div
                  className={`rounded-2xl p-4 text-center ${
                    isDark
                      ? "bg-slate-800"
                      : "bg-slate-50"
                  }`}
                >
                  <div className="text-2xl font-black text-orange-500">
                    +{answers.length}
                  </div>

                  <div className="text-xs mt-1 opacity-60">
                    Progress
                  </div>
                </div>
              </div>

              {/* Progress message */}
              <div className="px-5 sm:px-7">
                <div
                  className={`rounded-2xl p-4 flex items-start gap-3 ${
                    isDark
                      ? "bg-blue-950/30 border border-blue-900"
                      : "bg-blue-50 border border-blue-200"
                  }`}
                >
                  <span className="text-xl">
                    📊
                  </span>

                  <div>
                    <p className="font-black text-sm">
                      Progress Updated
                    </p>

                    <p
                      className={`text-xs mt-1 ${
                        isDark
                          ? "text-blue-300"
                          : "text-blue-700"
                      }`}
                    >
                      Your Daily Challenge attempts have
                      been added to Progress Tracker and
                      today's study activity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Review */}
              <div className="p-5 sm:p-7">
                <h3 className="text-xl font-black mb-4">
                  📝 Answer Review
                </h3>

                <div className="space-y-3">
                  {challengeQuestions.map(
                    (question, index) => {
                      const answer = answers.find(
                        (item) =>
                          item.questionId ===
                          question.id
                      );

                      if (!answer) return null;

                      return (
                        <div
                          key={question.id}
                          className={`rounded-2xl border p-4 ${
                            answer.isCorrect
                              ? isDark
                                ? "border-green-900 bg-green-950/20"
                                : "border-green-200 bg-green-50"
                              : isDark
                              ? "border-red-900 bg-red-950/20"
                              : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="flex gap-3">
                            <div
                              className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center font-black text-white ${
                                answer.isCorrect
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                            >
                              {index + 1}
                            </div>

                            <div className="flex-1">
                              <p className="font-bold text-sm leading-relaxed">
                                {question.question}
                              </p>

                              <div className="mt-2 text-xs space-y-1">
                                <p>
                                  <span className="font-bold">
                                    Your answer:
                                  </span>{" "}
                                  {answer.selectedAnswer}
                                </p>

                                {!answer.isCorrect && (
                                  <p>
                                    <span className="font-bold">
                                      Correct:
                                    </span>{" "}
                                    {answer.correctAnswer}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="text-lg">
                              {answer.isCorrect
                                ? "✓"
                                : "✕"}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Result actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-7">
                  <button
                    onClick={retryChallenge}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-black hover:opacity-95 transition"
                  >
                    🔄 Try Again
                  </button>

                  <button
                    onClick={() =>
                      navigate("/student/progress")
                    }
                    className={`px-5 py-3 rounded-xl font-black transition ${
                      isDark
                        ? "bg-slate-800 hover:bg-slate-700"
                        : "bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    📊 View Progress
                  </button>

                  <button
                    onClick={() =>
                      navigate("/student/dashboard")
                    }
                    className={`px-5 py-3 rounded-xl font-black transition ${
                      isDark
                        ? "bg-slate-800 hover:bg-slate-700"
                        : "bg-slate-100 hover:bg-slate-200"
                    }`}
                  >
                    🏠 Dashboard
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer
        className={`py-8 text-center text-xs ${
          isDark
            ? "text-slate-600"
            : "text-slate-400"
        }`}
      >
        Ranker Bhaiya • Daily Challenge
      </footer>
    </div>
  );
}
