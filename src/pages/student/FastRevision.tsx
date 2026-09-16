import {
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

/* =====================================================
   TYPES
===================================================== */

interface RevisionCard {
  id: string;
  title: string;
  content: string;
  keyPoint?: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface RevisionResult {
  cards: RevisionCard[];
  quiz: QuizQuestion[];
}

interface QuizAnswer {
  questionId: string;
  selected: string;
}

/* =====================================================
   CONSTANTS
===================================================== */

const SUBJECTS = [
  "General Knowledge",
  "Current Affairs",
  "History",
  "Geography",
  "Polity",
  "Economy",
  "Science",
  "Environment",
  "Defence",
  "Sports",
];

const DIFFICULTIES = [
  "Easy",
  "Medium",
  "Hard",
];

const CARD_COUNTS = [5, 10, 15];

/* =====================================================
   COMPONENT
===================================================== */

export function FastRevision() {
  const navigate = useNavigate();

  const [subject, setSubject] = useState("General Knowledge");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [cardCount, setCardCount] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] =
    useState<RevisionResult | null>(null);

  const [activeCard, setActiveCard] = useState(0);

  const [quizAnswers, setQuizAnswers] =
    useState<QuizAnswer[]>([]);

  const [quizSubmitted, setQuizSubmitted] =
    useState(false);

  const [score, setScore] = useState(0);

  /* =====================================================
     GENERATE REVISION
  ===================================================== */

  async function generateRevision() {
    const cleanTopic = topic.trim();

    if (!cleanTopic) {
      setError("Please enter a topic for revision.");
      return;
    }

    setLoading(true);
    setError("");

    setResult(null);
    setActiveCard(0);
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setScore(0);

    try {
      console.log("========================================");
      console.log("⚡ FAST REVISION START");
      console.log("========================================");

      const { data, error: functionError } =
        await supabase.functions.invoke(
          "generate-revision",
          {
            body: {
              subject,
              topic: cleanTopic,
              difficulty,
              cardCount,
            },
          },
        );

      console.log(
        "📦 Fast Revision Response:",
        data,
      );

      if (functionError) {
        console.error(
          "❌ Fast Revision Function Error:",
          functionError,
        );

        throw new Error(
          functionError.message ||
            "Unable to generate revision.",
        );
      }

      const normalized =
        normalizeRevisionResponse(data);

      if (
        normalized.cards.length === 0 &&
        normalized.quiz.length === 0
      ) {
        throw new Error(
          "AI ne revision content return nahi kiya. Please try again.",
        );
      }

      setResult(normalized);

      console.log(
        "✅ Fast Revision generated successfully.",
        normalized,
      );
    } catch (err) {
      console.error(
        "========================================",
      );
      console.error(
        "❌ FAST REVISION ERROR",
      );
      console.error(err);
      console.error(
        "========================================",
      );

      if (err instanceof Error) {
        setError(
          err.message ||
            "Unable to generate revision.",
        );
      } else {
        setError(
          "Unable to generate revision.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     FORM SUBMIT
  ===================================================== */

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    void generateRevision();
  }

  /* =====================================================
     QUIZ ANSWER
  ===================================================== */

  function selectAnswer(
    questionId: string,
    selected: string,
  ) {
    if (quizSubmitted) return;

    setQuizAnswers((previous) => {
      const existingIndex =
        previous.findIndex(
          (item) =>
            item.questionId === questionId,
        );

      if (existingIndex === -1) {
        return [
          ...previous,
          {
            questionId,
            selected,
          },
        ];
      }

      const updated = [...previous];

      updated[existingIndex] = {
        questionId,
        selected,
      };

      return updated;
    });
  }

  /* =====================================================
     GET SELECTED ANSWER
  ===================================================== */

  function getSelectedAnswer(
    questionId: string,
  ): string {
    const answer = quizAnswers.find(
      (item) =>
        item.questionId === questionId,
    );

    return answer?.selected || "";
  }

  /* =====================================================
     SUBMIT QUIZ
  ===================================================== */

  function submitQuiz() {
    if (!result) return;
    if (result.quiz.length === 0) return;

    let calculatedScore = 0;

    for (const question of result.quiz) {
      const selected =
        getSelectedAnswer(question.id);

      if (
        selected &&
        selected === question.answer
      ) {
        calculatedScore += 1;
      }
    }

    setScore(calculatedScore);
    setQuizSubmitted(true);
  }

  /* =====================================================
     START AGAIN
  ===================================================== */

  function startAgain() {
    setResult(null);
    setError("");
    setActiveCard(0);
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setScore(0);
  }

  /* =====================================================
     CARD NAVIGATION
  ===================================================== */

  function previousCard() {
    setActiveCard((current) =>
      Math.max(0, current - 1),
    );
  }

  function nextCard() {
    if (!result) return;

    setActiveCard((current) =>
      Math.min(
        result.cards.length - 1,
        current + 1,
      ),
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <button
            type="button"
            onClick={() =>
              navigate("/student/dashboard")
            }
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-black text-white shadow-sm">
              R
            </div>

            <div className="text-left">
              <h1 className="text-lg font-black tracking-tight">
                RANKER BHAIYA
              </h1>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fast Revision
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/student/dashboard")
            }
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {/* =================================================
            HERO
        ================================================= */}

        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                ⚡ SMART LEARNING
              </div>

              <h2 className="text-3xl font-black sm:text-4xl">
                Fast Revision 🚀
              </h2>

              <p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">
                Kisi bhi topic ko quickly revise
                karo, important points dekho aur
                MCQs ke through apni preparation
                test karo.
              </p>
            </div>

            <div className="hidden select-none text-7xl md:block">
              🧠
            </div>
          </div>
        </section>

        {/* =================================================
            GENERATOR
        ================================================= */}

        {!result && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                Create Revision
              </p>

              <h2 className="mt-1 text-2xl font-black">
                What do you want to revise?
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Topic enter karo aur Vidhya
                tumhare liye quick revision
                material prepare karegi.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* SUBJECT */}

              <div>
                <label
                  htmlFor="revision-subject"
                  className="mb-2 block text-sm font-bold"
                >
                  Subject
                </label>

                <select
                  id="revision-subject"
                  value={subject}
                  onChange={(event) =>
                    setSubject(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {SUBJECTS.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* TOPIC */}

              <div>
                <label
                  htmlFor="revision-topic"
                  className="mb-2 block text-sm font-bold"
                >
                  Topic
                </label>

                <input
                  id="revision-topic"
                  type="text"
                  value={topic}
                  onChange={(event) =>
                    setTopic(event.target.value)
                  }
                  placeholder="e.g. Fundamental Rights"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Example: Indian Constitution,
                  RBI, Mughal Empire,
                  Photosynthesis, Climate Change
                </p>
              </div>

              {/* DIFFICULTY + COUNT */}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="revision-difficulty"
                    className="mb-2 block text-sm font-bold"
                  >
                    Difficulty
                  </label>

                  <select
                    id="revision-difficulty"
                    value={difficulty}
                    onChange={(event) =>
                      setDifficulty(
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    {DIFFICULTIES.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="revision-count"
                    className="mb-2 block text-sm font-bold"
                  >
                    Revision Cards
                  </label>

                  <select
                    id="revision-count"
                    value={cardCount}
                    onChange={(event) =>
                      setCardCount(
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    {CARD_COUNTS.map((count) => (
                      <option
                        key={count}
                        value={count}
                      >
                        {count} cards
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ERROR */}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">
                      ⚠️
                    </span>

                    <div>
                      <p className="font-bold text-red-700 dark:text-red-300">
                        Unable to generate revision
                      </p>

                      <p className="mt-1 text-sm leading-6 text-red-600 dark:text-red-400">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* GENERATE */}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Generating Revision...
                  </>
                ) : (
                  <>
                    ⚡ Generate Fast Revision
                  </>
                )}
              </button>
            </form>
          </section>
        )}

        {/* =================================================
            RESULT
        ================================================= */}

        {result && (
          <div className="mt-6 space-y-6">
            {/* RESULT HEADER */}

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                    Revision Ready
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    {topic}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      {subject}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {difficulty}
                    </span>

                    {result.cards.length > 0 && (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-950/40 dark:text-green-300">
                        {result.cards.length}{" "}
                        Revision Cards
                      </span>
                    )}

                    {result.quiz.length > 0 && (
                      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                        {result.quiz.length} MCQs
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startAgain}
                  className="shrink-0 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  ← New Revision
                </button>
              </div>
            </section>

            {/* =================================================
                REVISION CARDS
            ================================================= */}

            {result.cards.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                      Quick Notes
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      Revision Cards
                    </h2>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {activeCard + 1} /{" "}
                    {result.cards.length}
                  </span>
                </div>

                {result.cards[activeCard] && (
                  <div className="mt-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-5 dark:from-blue-950/30 dark:to-indigo-950/30 sm:p-7">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">
                      {activeCard + 1}
                    </div>

                    <h3 className="mt-5 text-xl font-black leading-8">
                      {
                        result.cards[
                          activeCard
                        ].title
                      }
                    </h3>

                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">
                      {
                        result.cards[
                          activeCard
                        ].content
                      }
                    </p>

                    {result.cards[activeCard]
                      .keyPoint && (
                      <div className="mt-5 rounded-xl border border-blue-200 bg-white/70 p-4 dark:border-blue-900 dark:bg-slate-950/40">
                        <p className="text-[11px] font-black uppercase tracking-wide text-blue-600 dark:text-blue-400">
                          🎯 Key Point
                        </p>

                        <p className="mt-1 text-sm font-semibold leading-6 text-blue-900 dark:text-blue-200">
                          {
                            result.cards[
                              activeCard
                            ].keyPoint
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={activeCard === 0}
                    onClick={previousCard}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    ← Previous
                  </button>

                  <div className="flex gap-1.5 overflow-x-auto px-2">
                    {result.cards.map(
                      (_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() =>
                            setActiveCard(
                              index,
                            )
                          }
                          className={`h-2.5 w-2.5 shrink-0 rounded-full transition ${
                            index ===
                            activeCard
                              ? "bg-blue-600"
                              : "bg-slate-300 dark:bg-slate-700"
                          }`}
                          aria-label={`Go to revision card ${
                            index + 1
                          }`}
                        />
                      ),
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={
                      activeCard ===
                      result.cards.length - 1
                    }
                    onClick={nextCard}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </section>
            )}

            {/* =================================================
                QUIZ
            ================================================= */}

            {result.quiz.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
                    Test Yourself
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    Practice MCQs 📝
                  </h2>

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Revision ke baad apni
                    understanding test karo.
                  </p>
                </div>

                <div className="mt-6 space-y-6">
                  {result.quiz.map(
                    (question, index) => {
                      const selected =
                        getSelectedAnswer(
                          question.id,
                        );

                      return (
                        <div
                          key={question.id}
                          className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"
                        >
                          <div className="flex gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-sm font-black text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                              {index + 1}
                            </span>

                            <h3 className="text-base font-bold leading-6">
                              {
                                question.question
                              }
                            </h3>
                          </div>

                          <div className="mt-4 grid gap-3">
                            {question.options.map(
                              (
                                option,
                                optionIndex,
                              ) => {
                                const isSelected =
                                  selected ===
                                  option;

                                const isCorrect =
                                  option ===
                                  question.answer;

                                let optionClass =
                                  "border-slate-200 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700 dark:hover:border-violet-700 dark:hover:bg-violet-950/20";

                                if (
                                  quizSubmitted &&
                                  isCorrect
                                ) {
                                  optionClass =
                                    "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300";
                                } else if (
                                  quizSubmitted &&
                                  isSelected &&
                                  !isCorrect
                                ) {
                                  optionClass =
                                    "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300";
                                } else if (
                                  isSelected
                                ) {
                                  optionClass =
                                    "border-violet-500 bg-violet-50 text-violet-800 dark:border-violet-500 dark:bg-violet-950/30 dark:text-violet-200";
                                }

                                return (
                                  <button
                                    key={`${question.id}-${optionIndex}`}
                                    type="button"
                                    disabled={
                                      quizSubmitted
                                    }
                                    onClick={() =>
                                      selectAnswer(
                                        question.id,
                                        option,
                                      )
                                    }
                                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm font-semibold transition ${optionClass}`}
                                  >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                      {String.fromCharCode(
                                        65 +
                                          optionIndex,
                                      )}
                                    </span>

                                    <span className="flex-1">
                                      {option}
                                    </span>

                                    {quizSubmitted &&
                                      isCorrect && (
                                        <span>
                                          ✓
                                        </span>
                                      )}

                                    {quizSubmitted &&
                                      isSelected &&
                                      !isCorrect && (
                                        <span>
                                          ✕
                                        </span>
                                      )}
                                  </button>
                                );
                              },
                            )}
                          </div>

                          {quizSubmitted && (
                            <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                              <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Explanation
                              </p>

                              <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
                                {
                                  question.explanation
                                }
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>

                {/* SCORE */}

                {quizSubmitted && (
                  <div className="mt-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-center text-white">
                    <p className="text-sm font-semibold text-blue-100">
                      Your Score
                    </p>

                    <p className="mt-1 text-4xl font-black">
                      {score} /{" "}
                      {result.quiz.length}
                    </p>

                    <p className="mt-2 text-sm text-blue-100">
                      {getScoreMessage(
                        score,
                        result.quiz.length,
                      )}
                    </p>
                  </div>
                )}

                {/* SUBMIT */}

                {!quizSubmitted && (
                  <button
                    type="button"
                    onClick={submitQuiz}
                    className="mt-6 w-full rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-violet-700"
                  >
                    Submit Quiz →
                  </button>
                )}

                {/* RETAKE */}

                {quizSubmitted && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuizAnswers([]);
                      setQuizSubmitted(false);
                      setScore(0);
                    }}
                    className="mt-6 w-full rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Retake Quiz
                  </button>
                )}
              </section>
            )}

            {/* =================================================
                TIP
            ================================================= */}

            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/50 dark:bg-blue-950/30">
              <h3 className="font-bold text-blue-900 dark:text-blue-200">
                🎯 Revision Tip
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-800 dark:text-blue-300">
                Important facts ko baar-baar
                revise karo. Pehle concepts samjho,
                phir MCQs solve karo aur galat
                answers ki explanation zaroor padho.
              </p>
            </section>

            {/* BACK */}

            <div className="flex justify-center pb-4">
              <button
                type="button"
                onClick={() =>
                  navigate("/student/dashboard")
                }
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* =====================================================
   NORMALIZE REVISION RESPONSE
===================================================== */

function normalizeRevisionResponse(
  value: unknown,
): RevisionResult {
  let data: unknown = value;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return {
        cards: [],
        quiz: [],
      };
    }
  }

  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data)
  ) {
    const objectData =
      data as Record<string, unknown>;

    if (
      objectData.data &&
      typeof objectData.data === "object"
    ) {
      data = objectData.data;
    } else if (
      objectData.result &&
      typeof objectData.result === "object"
    ) {
      data = objectData.result;
    } else if (
      objectData.revision &&
      typeof objectData.revision === "object"
    ) {
      data = objectData.revision;
    }
  }

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return {
      cards: [],
      quiz: [],
    };
  }

  const root =
    data as Record<string, unknown>;

  const cards = normalizeCards(
    root.cards ??
      root.flashcards ??
      root.revision_cards ??
      root.revisionCards,
  );

  const quiz = normalizeQuiz(
    root.quiz ??
      root.mcqs ??
      root.questions ??
      root.quiz_questions ??
      root.quizQuestions,
  );

  return {
    cards,
    quiz,
  };
}

/* =====================================================
   NORMALIZE REVISION CARDS
===================================================== */

function normalizeCards(
  value: unknown,
): RevisionCard[] {
  let parsed: unknown = value;

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  const result: RevisionCard[] = [];

  for (
    let index = 0;
    index < parsed.length;
    index += 1
  ) {
    const item = parsed[index];

    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      continue;
    }

    const row =
      item as Record<string, unknown>;

    const title =
      typeof row.title === "string"
        ? row.title.trim()
        : typeof row.heading === "string"
          ? row.heading.trim()
          : typeof row.question === "string"
            ? row.question.trim()
            : "";

    const content =
      typeof row.content === "string"
        ? row.content.trim()
        : typeof row.description === "string"
          ? row.description.trim()
          : typeof row.explanation === "string"
            ? row.explanation.trim()
            : typeof row.answer === "string"
              ? row.answer.trim()
              : "";

    const keyPoint =
      typeof row.keyPoint === "string"
        ? row.keyPoint.trim()
        : typeof row.key_point === "string"
          ? row.key_point.trim()
          : typeof row.key_facts === "string"
            ? row.key_facts.trim()
            : "";

    if (!title && !content) {
      continue;
    }

    result.push({
      id:
        typeof row.id === "string" &&
        row.id.trim()
          ? row.id.trim()
          : `revision-card-${index + 1}`,

      title:
        title ||
        `Revision Point ${index + 1}`,

      content:
        content ||
        "Important revision point.",

      keyPoint:
        keyPoint || undefined,
    });
  }

  return result;
}

/* =====================================================
   NORMALIZE QUIZ
===================================================== */

function normalizeQuiz(
  value: unknown,
): QuizQuestion[] {
  let parsed: unknown = value;

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  const result: QuizQuestion[] = [];

  for (
    let index = 0;
    index < parsed.length;
    index += 1
  ) {
    const item = parsed[index];

    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item)
    ) {
      continue;
    }

    const row =
      item as Record<string, unknown>;

    const question =
      typeof row.question === "string"
        ? row.question.trim()
        : "";

    if (!question) {
      continue;
    }

    const options: string[] = [];

    if (Array.isArray(row.options)) {
      for (const option of row.options) {
        if (typeof option !== "string") {
          continue;
        }

        const cleaned = option.trim();

        if (cleaned) {
          options.push(cleaned);
        }
      }
    }

    if (options.length !== 4) {
      continue;
    }

    const answer =
      typeof row.answer === "string"
        ? row.answer.trim()
        : "";

    if (!answer) {
      continue;
    }

    let normalizedAnswer = answer;

    const answerUpper =
      answer.toUpperCase();

    if (
      answerUpper === "A" ||
      answerUpper === "B" ||
      answerUpper === "C" ||
      answerUpper === "D"
    ) {
      const answerIndex =
        answerUpper.charCodeAt(0) - 65;

      normalizedAnswer =
        options[answerIndex] ||
        answer;
    }

    if (
      !options.includes(normalizedAnswer)
    ) {
      continue;
    }

    const explanation =
      typeof row.explanation === "string"
        ? row.explanation.trim()
        : "";

    const id =
      typeof row.id === "string" &&
      row.id.trim()
        ? row.id.trim()
        : `quiz-question-${index + 1}`;

    result.push({
      id,
      question,
      options,
      answer: normalizedAnswer,
      explanation:
        explanation ||
        "Answer ko revise karo aur concept ko dobara samjho.",
    });
  }

  return result;
}

/* =====================================================
   SCORE MESSAGE
===================================================== */

function getScoreMessage(
  score: number,
  total: number,
): string {
  if (total <= 0) {
    return "Keep learning!";
  }

  const percentage =
    (score / total) * 100;

  if (percentage === 100) {
    return "Excellent! Perfect score 🔥";
  }

  if (percentage >= 80) {
    return "Great job! Your preparation is strong 💪";
  }

  if (percentage >= 60) {
    return "Good attempt! Thoda aur revision karo 👍";
  }

  if (percentage >= 40) {
    return "Keep practicing. Revision ko repeat karo 📚";
  }

  return "Don't worry. Concepts ko dobara revise karo 💡";
}

export default FastRevision;
