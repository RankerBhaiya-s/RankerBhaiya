import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

type Question = {
  id: string;
  category: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty?: string;
};

type AnswerRecord = {
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

const CHALLENGE_SIZE = 10;

const CATEGORY_ORDER = [
  "All",
  "Current Affairs",
  "English",
  "General Knowledge",
  "Reasoning",
];

const DEFAULT_TOTALS: Record<
  ProgressSubject,
  number
> = {
  "Current Affairs": 25,
  English: 30,
  Reasoning: 25,
  "General Knowledge": 25,
};

/* =====================================================
   HELPERS
===================================================== */

function normalizeCategory(
  category: string,
): string {
  return category.trim();
}

function getProgressSubject(
  category: string,
): ProgressSubject {
  const normalized =
    category.trim().toLowerCase();

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
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(new Date());
}

function shuffleArray<T>(
  array: T[],
): T[] {
  const copy = [...array];

  for (
    let i = copy.length - 1;
    i > 0;
    i--
  ) {
    const j = Math.floor(
      Math.random() * (i + 1),
    );

    [
      copy[i],
      copy[j],
    ] = [
      copy[j],
      copy[i],
    ];
  }

  return copy;
}

/* =====================================================
   PROGRESS HELPERS
===================================================== */

async function updateStudentProgress(
  userId: string,
  answers: AnswerRecord[],
  questions: Question[],
) {
  const subjectCounts =
    new Map<ProgressSubject, number>();

  for (const record of answers) {
    const question =
      questions.find(
        (item) =>
          item.id ===
          record.questionId,
      );

    if (!question) continue;

    const subject =
      getProgressSubject(
        question.category,
      );

    subjectCounts.set(
      subject,
      (subjectCounts.get(subject) ?? 0) +
        1,
    );
  }

  for (const [
    subject,
    count,
  ] of subjectCounts.entries()) {
    const { data: existing, error } =
      await supabase
        .from("student_progress")
        .select(
          `
            id,
            completed,
            total,
            study_minutes,
            mock_tests,
            current_streak
          `,
        )
        .eq("user_id", userId)
        .eq("subject", subject)
        .maybeSingle();

    if (error) {
      console.error(
        "Progress fetch error:",
        error,
      );
      continue;
    }

    const studyMinutes =
      Math.max(1, count);

    if (!existing) {
      const { error: insertError } =
        await supabase
          .from("student_progress")
          .insert({
            user_id: userId,
            subject,
            completed: count,
            total:
              DEFAULT_TOTALS[subject],
            study_minutes:
              studyMinutes,
            mock_tests: 0,
            current_streak: 0,
            updated_at:
              new Date().toISOString(),
          });

      if (insertError) {
        console.error(
          "Progress insert error:",
          insertError,
        );
      }

      continue;
    }

    const currentCompleted =
      Number(
        existing.completed ?? 0,
      );

    const currentMinutes =
      Number(
        existing.study_minutes ?? 0,
      );

    const total =
      Number(
        existing.total ??
          DEFAULT_TOTALS[subject],
      );

    const newCompleted =
      Math.min(
        currentCompleted + count,
        total,
      );

    const { error: updateError } =
      await supabase
        .from("student_progress")
        .update({
          completed: newCompleted,
          study_minutes:
            currentMinutes +
            studyMinutes,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", existing.id)
        .eq("user_id", userId);

    if (updateError) {
      console.error(
        "Progress update error:",
        updateError,
      );
    }
  }
}

async function updateStudyActivity(
  userId: string,
  answeredCount: number,
) {
  if (answeredCount <= 0) return;

  const today = getTodayIndia();

  /*
   * Daily Challenge ke liye approximately
   * 1 minute per answered question record
   * kar rahe hain.
   */
  const minutes =
    Math.max(1, answeredCount);

  const {
    data: existing,
    error: fetchError,
  } = await supabase
    .from("study_activity")
    .select("id, minutes")
    .eq("user_id", userId)
    .eq("activity_date", today)
    .maybeSingle();

  if (fetchError) {
    console.error(
      "Study activity fetch error:",
      fetchError,
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
        insertError,
      );
    }

    return;
  }

  const currentMinutes =
    Number(
      existing.minutes ?? 0,
    );

  const { error: updateError } =
    await supabase
      .from("study_activity")
      .update({
        minutes:
          currentMinutes +
          minutes,
      })
      .eq("id", existing.id)
      .eq("user_id", userId);

  if (updateError) {
    console.error(
      "Study activity update error:",
      updateError,
    );
  }
}

/* =====================================================
   MAIN COMPONENT
===================================================== */

export default function DailyChallenge() {
  const navigate = useNavigate();

  const {
    user,
    loading: authLoading,
  } = useAuth();

  const { theme } = useTheme();

  const isDark = theme === "dark";

  /* =====================================================
     STATE
  ===================================================== */

  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [challengeQuestions, setChallengeQuestions] =
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

  const [answers, setAnswers] =
    useState<AnswerRecord[]>([]);

  const [score, setScore] =
    useState(0);

  const [answeredCount, setAnsweredCount] =
    useState(0);

  const [savingAttempt, setSavingAttempt] =
    useState(false);

  const [finished, setFinished] =
    useState(false);

  const [progressRecorded, setProgressRecorded] =
    useState(false);

  const [recordingProgress, setRecordingProgress] =
    useState(false);

  /* =====================================================
     LOAD QUESTIONS
  ===================================================== */

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/student/login");
      return;
    }

    void loadQuestions();
  }, [
    user,
    authLoading,
    navigate,
  ]);

  async function loadQuestions() {
    try {
      setLoading(true);
      setError("");

      const {
        data: authData,
        error: userError,
      } = await supabase.auth.getUser();

      if (
        userError ||
        !authData.user
      ) {
        navigate("/student/login");
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
          "Failed to load Daily Challenge questions:",
          fetchError,
        );

        setError(
          "Daily Challenge questions load nahi ho paaye. Please try again.",
        );

        setQuestions([]);
        setChallengeQuestions([]);
        return;
      }

      const formatted: Question[] =
        (data ?? [])
          .map((item) => {
            let options: string[] =
              [];

            if (
              Array.isArray(
                item.options,
              )
            ) {
              options =
                item.options.filter(
                  (
                    option,
                  ): option is string =>
                    typeof option ===
                    "string",
                );
            }

            return {
              id: item.id,
              category:
                normalizeCategory(
                  item.category ??
                    "General Knowledge",
                ),
              question:
                item.question ?? "",
              options,
              answer:
                item.answer ?? "",
              explanation:
                item.explanation ??
                "",
              difficulty:
                item.difficulty ??
                "Easy",
            };
          })
          .filter(
            (question) =>
              question.question.trim() !==
                "" &&
              question.options.length >
                0 &&
              question.answer.trim() !==
                "",
          );

      setQuestions(formatted);

      createChallenge(
        formatted,
        "All",
        "",
      );
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong while loading Daily Challenge.",
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     FILTER CATEGORIES
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

    const ordered =
      CATEGORY_ORDER.filter(
        (category) =>
          category === "All" ||
          databaseCategories.includes(
            category,
          ),
      );

    const additional =
      databaseCategories.filter(
        (category) =>
          !CATEGORY_ORDER.includes(
            category,
          ),
      );

    return [
      ...ordered,
      ...additional,
    ];
  }, [questions]);

  /* =====================================================
     FILTER AVAILABLE QUESTIONS
  ===================================================== */

  const filteredQuestions = useMemo(() => {
    const query =
      searchQuery
        .trim()
        .toLowerCase();

    return questions.filter(
      (question) => {
        const categoryMatch =
          selectedCategory ===
            "All" ||
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
     CREATE CHALLENGE
  ===================================================== */

  function createChallenge(
    sourceQuestions: Question[],
    category: string,
    query: string,
  ) {
    const normalizedQuery =
      query.trim().toLowerCase();

    const available =
      sourceQuestions.filter(
        (question) => {
          const categoryMatch =
            category === "All" ||
            question.category ===
              category;

          const searchMatch =
            !normalizedQuery ||
            question.question
              .toLowerCase()
              .includes(
                normalizedQuery,
              ) ||
            question.category
              .toLowerCase()
              .includes(
                normalizedQuery,
              ) ||
            question.options.some(
              (option) =>
                option
                  .toLowerCase()
                  .includes(
                    normalizedQuery,
                  ),
            );

          return (
            categoryMatch &&
            searchMatch
          );
        },
      );

    const shuffled =
      shuffleArray(available);

    const selected =
      shuffled.slice(
        0,
        Math.min(
          CHALLENGE_SIZE,
          shuffled.length,
        ),
      );

    setChallengeQuestions(
      selected,
    );

    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setScore(0);
    setAnsweredCount(0);
    setFinished(false);
    setProgressRecorded(false);
    setRecordingProgress(false);
  }

  /* =====================================================
     CURRENT QUESTION
  ===================================================== */

  const currentQuestion =
    challengeQuestions[
      currentIndex
    ];

  /* =====================================================
     ANSWER
  ===================================================== */

  async function handleAnswer(
    option: string,
  ) {
    if (
      selectedAnswer !== null ||
      !currentQuestion ||
      savingAttempt ||
      !user
    ) {
      return;
    }

    const isCorrect =
      option.trim().toLowerCase() ===
      currentQuestion.answer
        .trim()
        .toLowerCase();

    setSelectedAnswer(option);

    setAnsweredCount(
      (value) => value + 1,
    );

    if (isCorrect) {
      setScore(
        (value) => value + 1,
      );
    }

    const answerRecord: AnswerRecord =
      {
        questionId:
          currentQuestion.id,
        selectedAnswer: option,
        correctAnswer:
          currentQuestion.answer,
        isCorrect,
      };

    setAnswers((previous) => [
      ...previous,
      answerRecord,
    ]);

    setSavingAttempt(true);

    try {
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
          "Failed to save Daily Challenge attempt:",
          attemptError,
        );
      }
    } catch (err) {
      console.error(
        "Practice attempt error:",
        err,
      );
    } finally {
      setSavingAttempt(false);
    }
  }

  /* =====================================================
     RECORD PROGRESS
  ===================================================== */

  async function recordChallengeProgress(
    finalAnswers: AnswerRecord[],
  ) {
    if (
      progressRecorded ||
      recordingProgress ||
      !user ||
      finalAnswers.length === 0
    ) {
      return;
    }

    setRecordingProgress(true);

    try {
      /*
       * Progress update only happens AFTER
       * challenge answers have been saved.
       */
      await updateStudentProgress(
        user.id,
        finalAnswers,
        challengeQuestions,
      );

      await updateStudyActivity(
        user.id,
        finalAnswers.length,
      );

      setProgressRecorded(true);
    } catch (err) {
      console.error(
        "Daily Challenge progress error:",
        err,
      );
    } finally {
      setRecordingProgress(false);
    }
  }

  /* =====================================================
     NEXT
  ===================================================== */

  async function handleNext() {
    if (
      !selectedAnswer ||
      savingAttempt
    ) {
      return;
    }

    if (
      currentIndex <
      challengeQuestions.length - 1
    ) {
      setCurrentIndex(
        (value) => value + 1,
      );

      setSelectedAnswer(null);

      return;
    }

    /*
     * Last question.
     *
     * answers state update asynchronous hota hai,
     * isliye current answer manually include kar rahe hain.
     */
    const latestAnswers =
      answers.some(
        (item) =>
          item.questionId ===
          currentQuestion?.id,
      )
        ? answers
        : currentQuestion
        ? [
            ...answers,
            {
              questionId:
                currentQuestion.id,
              selectedAnswer:
                selectedAnswer,
              correctAnswer:
                currentQuestion.answer,
              isCorrect:
                selectedAnswer
                  .trim()
                  .toLowerCase() ===
                currentQuestion.answer
                  .trim()
                  .toLowerCase(),
            },
          ]
        : answers;

    setAnswers(latestAnswers);
    setFinished(true);

    await recordChallengeProgress(
      latestAnswers,
    );
  }

  /* =====================================================
     PREVIOUS
  ===================================================== */

  function handlePrevious() {
    if (currentIndex <= 0) {
      return;
    }

    setCurrentIndex(
      (value) => value - 1,
    );

    /*
     * Previous question par selected answer
     * dobara blank kar rahe hain.
     */
    setSelectedAnswer(null);
  }

  /* =====================================================
     RETRY
  ===================================================== */

  function handleRetry() {
    createChallenge(
      questions,
      selectedCategory,
      searchQuery,
    );
  }

  /* =====================================================
     CATEGORY CHANGE
  ===================================================== */

  function handleCategoryChange(
    category: string,
  ) {
    setSelectedCategory(
      category,
    );
    setSearchQuery("");

    createChallenge(
      questions,
      category,
      "",
    );
  }

  /* =====================================================
     SEARCH
  ===================================================== */

  function handleSearchChange(
    value: string,
  ) {
    setSearchQuery(value);

    createChallenge(
      questions,
      selectedCategory,
      value,
    );
  }

  /* =====================================================
     PROGRESS
  ===================================================== */

  const questionNumber =
    challengeQuestions.length ===
    0
      ? 0
      : currentIndex + 1;

  const questionProgress =
    challengeQuestions.length ===
    0
      ? 0
      : Math.round(
          (questionNumber /
            challengeQuestions.length) *
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
     OPTION STYLE
  ===================================================== */

  function getOptionClass(
    option: string,
  ) {
    if (!selectedAnswer) {
      return isDark
        ? "border-slate-700 bg-slate-900 hover:border-orange-500 hover:bg-orange-950/20"
        : "border-slate-200 bg-white hover:border-orange-400 hover:bg-orange-50";
    }

    const selected =
      option.trim().toLowerCase() ===
      selectedAnswer
        .trim()
        .toLowerCase();

    const correct =
      option.trim().toLowerCase() ===
      currentQuestion?.answer
        .trim()
        .toLowerCase();

    if (correct) {
      return isDark
        ? "border-emerald-500 bg-emerald-950/30 text-emerald-300"
        : "border-emerald-500 bg-emerald-50 text-emerald-800";
    }

    if (selected && !correct) {
      return isDark
        ? "border-red-500 bg-red-950/30 text-red-300"
        : "border-red-500 bg-red-50 text-red-800";
    }

    return isDark
      ? "border-slate-800 bg-slate-950 text-slate-500"
      : "border-slate-200 bg-slate-50 text-slate-400";
  }

  /* =====================================================
     LOADING
  ===================================================== */

  if (
    authLoading ||
    loading
  ) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-100 text-3xl dark:bg-orange-950/30">
              🔥
            </div>

            <div className="mx-auto mt-5 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500 dark:border-slate-700 dark:border-t-orange-400" />

            <p className="mt-5 text-sm font-bold text-slate-500 dark:text-slate-400">
              Loading Daily Challenge...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     ERROR
  ===================================================== */

  if (
    error &&
    questions.length === 0
  ) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl dark:border-red-900/50 dark:bg-slate-900">
            <div className="text-5xl">
              ⚠️
            </div>

            <h1 className="mt-5 text-2xl font-black">
              Daily Challenge unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadQuestions()
              }
              className="mt-6 rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-white hover:bg-orange-600"
            >
              Try Again
            </button>
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
                  Daily Challenge
                </h1>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Challenge complete
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-10">
            {/* RESULT */}
            <div className="text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-orange-100 text-5xl dark:bg-orange-950/30">
                🔥
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">
                Daily Challenge Complete
              </p>

              <h2 className="mt-2 text-3xl font-black sm:text-4xl">
                Great work!
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Aaj ka challenge complete
                ho gaya. Tumhari progress
                automatically update kar di gayi
                hai.
              </p>
            </div>

            {/* STATS */}
            <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-5">
              <div className="rounded-2xl bg-orange-50 p-4 text-center dark:bg-orange-950/20 sm:p-6">
                <p className="text-2xl font-black text-orange-600 dark:text-orange-400 sm:text-3xl">
                  {score}
                </p>

                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  Correct
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-4 text-center dark:bg-slate-800 sm:p-6">
                <p className="text-2xl font-black sm:text-3xl">
                  {answeredCount}
                </p>

                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  Attempted
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4 text-center dark:bg-emerald-950/20 sm:p-6">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 sm:text-3xl">
                  {finalAccuracy}%
                </p>

                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  Accuracy
                </p>
              </div>
            </div>

            {/* PROGRESS STATUS */}
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <div className="flex items-start gap-3">
                <div className="text-xl">
                  📊
                </div>

                <div>
                  <p className="font-black text-blue-800 dark:text-blue-300">
                    Progress Updated
                  </p>

                  <p className="mt-1 text-sm leading-6 text-blue-700/80 dark:text-blue-300/70">
                    Daily Challenge ke attempts
                    aur study activity tumhare
                    Progress Tracker mein add ho
                    gaye hain.
                  </p>
                </div>
              </div>
            </div>

            {/* ANSWER REVIEW */}
            {answers.length > 0 && (
              <section className="mt-8">
                <h3 className="text-xl font-black">
                  Answer Review
                </h3>

                <div className="mt-4 space-y-3">
                  {answers.map(
                    (
                      record,
                      index,
                    ) => {
                      const question =
                        challengeQuestions.find(
                          (item) =>
                            item.id ===
                            record.questionId,
                        );

                      if (!question) {
                        return null;
                      }

                      return (
                        <div
                          key={`${record.questionId}-${index}`}
                          className={`rounded-2xl border p-4 ${
                            record.isCorrect
                              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                              : "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white font-black dark:bg-slate-900">
                              {index +
                                1}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="font-black leading-6">
                                {
                                  question.question
                                }
                              </p>

                              <p className="mt-2 text-sm">
                                Your answer:{" "}
                                <span className="font-bold">
                                  {
                                    record.selectedAnswer
                                  }
                                </span>
                              </p>

                              {!record.isCorrect && (
                                <p className="mt-1 text-sm">
                                  Correct answer:{" "}
                                  <span className="font-black">
                                    {
                                      record.correctAnswer
                                    }
                                  </span>
                                </p>
                              )}

                              {question.explanation && (
                                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                  {
                                    question.explanation
                                  }
                                </p>
                              )}
                            </div>

                            <div className="text-xl">
                              {record.isCorrect
                                ? "✓"
                                : "✕"}
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </section>
            )}

            {/* ACTIONS */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 active:scale-95"
              >
                🔄 Try Again
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/student/progress",
                  )
                }
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95"
              >
                📊 View Progress
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
     NO QUESTIONS
  ===================================================== */

  if (
    challengeQuestions.length === 0
  ) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/student/dashboard",
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg dark:border-slate-700 dark:bg-slate-900"
            >
              ←
            </button>

            <h1 className="font-black">
              🔥 Daily Challenge
            </h1>

            <div className="w-10" />
          </div>
        </header>

        <main className="mx-auto max-w-xl px-4 py-12">
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="text-5xl">
              📝
            </div>

            <h2 className="mt-5 text-2xl font-black">
              No questions found
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Is filter ke according abhi
              Daily Challenge questions
              available nahi hain.
            </p>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory(
                  "All",
                );
                setSearchQuery("");

                createChallenge(
                  questions,
                  "All",
                  "",
                );
              }}
              className="mt-6 rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-white"
            >
              Show All Questions
            </button>
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
      {/* HEADER */}
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
                🔥 Daily Challenge
              </h1>

              <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                One challenge. Every day. Keep improving.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/student/progress",
              )
            }
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            <span className="sm:hidden">
              📊
            </span>

            <span className="hidden sm:inline">
              📊 Progress
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 p-6 text-white shadow-xl shadow-orange-500/20 sm:p-8 lg:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-yellow-300/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-wider backdrop-blur">
              🔥 Daily Challenge
            </div>

            <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Challenge yourself.
              <br />
              Build consistency.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-orange-50 sm:text-base">
              Aaj ke questions solve karo,
              apni accuracy check karo aur
              apni preparation ko daily
              improve karo.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xl font-black">
                  {challengeQuestions.length}
                </p>

                <p className="text-xs text-white/70">
                  Questions
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xl font-black">
                  {score}
                </p>

                <p className="text-xs text-white/70">
                  Correct
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xl font-black">
                  {answeredCount}
                </p>

                <p className="text-xs text-white/70">
                  Attempted
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH */}
        <section className="mt-6">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
              🔎
            </span>

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                handleSearchChange(
                  event.target.value,
                )
              }
              placeholder="Search challenge questions..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </section>

        {/* CATEGORIES */}
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
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {category}
                </button>
              ),
            )}
          </div>
        )}

        {/* QUESTION PROGRESS */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Question{" "}
              {questionNumber} of{" "}
              {challengeQuestions.length}
            </p>

            <div className="mt-2 h-2 w-52 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 sm:w-72">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                style={{
                  width: `${questionProgress}%`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-600 dark:bg-orange-950/30 dark:text-orange-400">
              {currentQuestion.category}
            </span>

            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {currentQuestion.difficulty ??
                "Easy"}
            </span>
          </div>
        </div>

        {/* QUESTION CARD */}
        <section className="mt-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7 lg:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-sm font-black text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                {questionNumber}
              </div>

              <h2 className="pt-1 text-lg font-black leading-7 sm:text-xl sm:leading-8 lg:text-2xl lg:leading-9">
                {currentQuestion.question}
              </h2>
            </div>

            {/* OPTIONS */}
            <div className="mt-7 grid gap-3">
              {currentQuestion.options.map(
                (
                  option,
                  optionIndex,
                ) => {
                  const isCorrect =
                    option
                      .trim()
                      .toLowerCase() ===
                    currentQuestion.answer
                      .trim()
                      .toLowerCase();

                  const isSelected =
                    selectedAnswer
                      ?.trim()
                      .toLowerCase() ===
                    option
                      .trim()
                      .toLowerCase();

                  return (
                    <button
                      key={`${currentQuestion.id}-${optionIndex}`}
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
                      className={`group flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition disabled:cursor-default sm:p-5 ${getOptionClass(
                        option,
                      )}`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${
                          selectedAnswer &&
                          isCorrect
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : selectedAnswer &&
                              isSelected
                            ? "border-red-500 bg-red-500 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                        }`}
                      >
                        {selectedAnswer
                          ? isCorrect
                            ? "✓"
                            : isSelected
                            ? "✕"
                            : String.fromCharCode(
                                65 +
                                  optionIndex,
                              )
                          : String.fromCharCode(
                              65 +
                                optionIndex,
                            )}
                      </span>

                      <span className="flex-1 text-sm font-bold leading-6 sm:text-base">
                        {option}
                      </span>
                    </button>
                  );
                },
              )}
            </div>

            {/* FEEDBACK */}
            {selectedAnswer && (
              <div
                className={`mt-6 rounded-2xl border p-4 ${
                  selectedAnswer
                    .trim()
                    .toLowerCase() ===
                  currentQuestion.answer
                    .trim()
                    .toLowerCase()
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                    : "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {selectedAnswer
                      .trim()
                      .toLowerCase() ===
                    currentQuestion.answer
                      .trim()
                      .toLowerCase()
                      ? "🎉"
                      : "💡"}
                  </div>

                  <div>
                    <h3
                      className={`font-black ${
                        selectedAnswer
                          .trim()
                          .toLowerCase() ===
                        currentQuestion.answer
                          .trim()
                          .toLowerCase()
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-red-700 dark:text-red-300"
                      }`}
                    >
                      {selectedAnswer
                        .trim()
                        .toLowerCase() ===
                      currentQuestion.answer
                        .trim()
                        .toLowerCase()
                        ? "Correct Answer!"
                        : "Incorrect Answer"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Correct answer:{" "}
                      <span className="font-black">
                        {
                          currentQuestion.answer
                        }
                      </span>
                    </p>

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

            {/* NAVIGATION */}
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
                  ? "Answer saved"
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
                className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {currentIndex ===
                challengeQuestions.length -
                  1
                  ? "Finish Challenge ✓"
                  : "Next Question →"}
              </button>
            </div>
          </div>
        </section>

        {/* LIVE STATS */}
        <section className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Score
            </p>

            <p className="mt-1 text-2xl font-black text-orange-500">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Accuracy
            </p>

            <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {answeredCount ===
              0
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

        {/* SMART TIP */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-orange-950/20 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl dark:bg-amber-900/40">
              💡
            </div>

            <div>
              <h3 className="font-black text-amber-900 dark:text-amber-200">
                Daily Challenge Tip
              </h3>

              <p className="mt-2 text-sm leading-6 text-amber-800/80 dark:text-amber-200/70">
                Score se zyada important
                hai consistency. Roz ka
                challenge complete karo,
                explanations padho aur apni
                mistakes ko revise karo.
              </p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
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
