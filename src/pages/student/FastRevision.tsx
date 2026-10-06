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

  const [subject, setSubject] =
    useState("General Knowledge");

  const [topic, setTopic] =
    useState("");

  const [difficulty, setDifficulty] =
    useState("Medium");

  const [cardCount, setCardCount] =
    useState(10);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState<RevisionResult | null>(null);

  const [activeCard, setActiveCard] =
    useState(0);

  const [quizAnswers, setQuizAnswers] =
    useState<QuizAnswer[]>([]);

  const [quizSubmitted, setQuizSubmitted] =
    useState(false);

  const [score, setScore] =
    useState(0);

  /* ===================================================
     GENERATE
  =================================================== */

  async function generateRevision() {
    const cleanTopic = topic.trim();

    setLoading(true);
    setError("");
    setResult(null);
    setActiveCard(0);
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setScore(0);

    try {
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

      if (functionError) {
        throw new Error(
          functionError.message ||
            "Unable to generate revision.",
        );
      }

      if (data?.error) {
        throw new Error(data.error);
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
    } catch (err) {
      console.error(
        "Fast Revision Error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate revision.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    void generateRevision();
  }

  /* ===================================================
     QUIZ
  =================================================== */

  function selectAnswer(
    questionId: string,
    selected: string,
  ) {
    if (quizSubmitted) return;

    setQuizAnswers((previous) => {
      const existing =
        previous.findIndex(
          (item) =>
            item.questionId ===
            questionId,
        );

      if (existing === -1) {
        return [
          ...previous,
          {
            questionId,
            selected,
          },
        ];
      }

      const updated = [...previous];

      updated[existing] = {
        questionId,
        selected,
      };

      return updated;
    });
  }

  function getSelectedAnswer(
    questionId: string,
  ) {
    return (
      quizAnswers.find(
        (item) =>
          item.questionId ===
          questionId,
      )?.selected || ""
    );
  }

  function submitQuiz() {
    if (!result) return;

    let total = 0;

    result.quiz.forEach((question) => {
      const selected =
        getSelectedAnswer(
          question.id,
        );

      if (
        selected &&
        selected === question.answer
      ) {
        total += 1;
      }
    });

    setScore(total);
    setQuizSubmitted(true);
  }

  function retakeQuiz() {
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setScore(0);
  }

  /* ===================================================
     RESET
  =================================================== */

  function startAgain() {
    setResult(null);
    setError("");
    setActiveCard(0);
    setQuizAnswers([]);
    setQuizSubmitted(false);
    setScore(0);
  }

  /* ===================================================
     CARD NAVIGATION
  =================================================== */

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

  /* ===================================================
     PAGE
  =================================================== */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">

      {/* HEADER */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/student/dashboard",
              )
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
              navigate(
                "/student/dashboard",
              )
            }
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            ← Dashboard
          </button>

        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">

        {/* HERO */}

        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 text-white shadow-lg sm:p-8">
          <div className="flex items-center justify-between gap-5">

            <div className="max-w-3xl">
              <div className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                ⚡ SMART LEARNING
              </div>

              <h2 className="text-3xl font-black sm:text-4xl">
                Fast Revision 🚀
              </h2>

              <p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">
                Subject choose karo aur important
                concepts ko quickly revise karo.
                Topic optional hai — Vidhya khud
                important topics select kar sakti hai.
              </p>
            </div>

            <div className="hidden text-7xl md:block">
              🧠
            </div>

          </div>
        </section>

        {/* FORM */}

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
                Topic nahi doge to Vidhya subject ke
                important topics automatically choose karegi.
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
                    setSubject(
                      event.target.value,
                    )
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

              {/* TOPIC OPTIONAL */}

              <div>
                <label
                  htmlFor="revision-topic"
                  className="mb-2 flex items-center gap-2 text-sm font-bold"
                >
                  Topic
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    Optional
                  </span>
                </label>

                <input
                  id="revision-topic"
                  type="text"
                  value={topic}
                  onChange={(event) =>
                    setTopic(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Fundamental Rights — or leave blank"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Blank chhodoge to selected subject ke
                  important exam topics automatically choose honge.
                </p>
              </div>

              {/* OPTIONS */}

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
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    {DIFFICULTIES.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      ),
                    )}
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    {CARD_COUNTS.map(
                      (count) => (
                        <option
                          key={count}
                          value={count}
                        >
                          {count} cards
                        </option>
                      ),
                    )}
                  </select>
                </div>

              </div>

              {/* ERROR */}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                  <div className="flex gap-3">
                    <span>⚠️</span>

                    <div>
                      <p className="font-bold text-red-700 dark:text-red-300">
                        Unable to generate revision
                      </p>

                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
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

        {/* RESULT */}

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
                    {topic.trim() ||
                      `${subject} — Important Topics`}
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
                        {result.cards.length} Cards
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
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  ← New Revision
                </button>

              </div>
            </section>

            {/* CARDS */}

            {result.cards.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                      Quick Notes
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      Revision Cards
                    </h2>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold dark:bg-slate-800">
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

                    {result.cards[
                      activeCard
                    ].keyPoint && (
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
                    disabled={
                      activeCard === 0
                    }
                    onClick={
                      previousCard
                    }
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    ← Previous
                  </button>

                  <div className="flex gap-1.5 overflow-hidden px-2">
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
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            index ===
                            activeCard
                              ? "bg-blue-600"
                              : "bg-slate-300 dark:bg-slate-700"
                          }`}
                          aria-label={`Revision card ${index + 1}`}
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
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-40"
                  >
                    Next →
                  </button>

                </div>
              </section>
            )}

            {/* QUIZ */}

            {result.quiz.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
                  Test Yourself
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Practice MCQs 📝
                </h2>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Revision ke baad apni understanding test karo.
                </p>

                <div className="mt-6 space-y-6">

                  {result.quiz.map(
                    (question, index) => {
                      const selected =
                        getSelectedAnswer(
                          question.id,
                        );

                      return (
                        <div
                          key={
                            question.id
                          }
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

                                let classes =
                                  "border-slate-200 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700 dark:hover:border-violet-700";

                                if (
                                  quizSubmitted &&
                                  isCorrect
                                ) {
                                  classes =
                                    "border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300";
                                } else if (
                                  quizSubmitted &&
                                  isSelected
                                ) {
                                  classes =
                                    "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300";
                                } else if (
                                  isSelected
                                ) {
                                  classes =
                                    "border-violet-500 bg-violet-50 text-violet-800 dark:border-violet-500 dark:bg-violet-950/30";
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
                                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm font-semibold transition ${classes}`}
                                  >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black dark:bg-slate-800">
                                      {String.fromCharCode(
                                        65 +
                                          optionIndex,
                                      )}
                                    </span>

                                    <span className="flex-1">
                                      {option}
                                    </span>

                                    {quizSubmitted &&
                                      isCorrect &&
                                      "✓"}

                                    {quizSubmitted &&
                                      isSelected &&
                                      !isCorrect &&
                                      "✕"}
                                  </button>
                                );
                              },
                            )}

                          </div>

                          {quizSubmitted && (
                            <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
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

                {quizSubmitted ? (
                  <>
                    <div className="mt-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-center text-white">
                      <p className="text-sm text-blue-100">
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

                    <button
                      type="button"
                      onClick={
                        retakeQuiz
                      }
                      className="mt-6 w-full rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      Retake Quiz
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={
                      submitQuiz
                    }
                    className="mt-6 w-full rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-violet-700"
                  >
                    Submit Quiz →
                  </button>
                )}

              </section>
            )}

            {/* TIP */}

            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/50 dark:bg-blue-950/30">
              <h3 className="font-bold text-blue-900 dark:text-blue-200">
                🎯 Revision Tip
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-800 dark:text-blue-300">
                Important facts ko baar-baar revise karo.
                Pehle concepts samjho, phir MCQs solve karo
                aur galat answers ki explanation zaroor padho.
              </p>
            </section>

            <div className="flex justify-center pb-4">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/student/dashboard",
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
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
   NORMALIZE RESPONSE
===================================================== */

function normalizeRevisionResponse(
  value: unknown,
): RevisionResult {
  let data: any = value;

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
    data?.data &&
    typeof data.data === "object"
  ) {
    data = data.data;
  } else if (
    data?.result &&
    typeof data.result === "object"
  ) {
    data = data.result;
  } else if (
    data?.revision &&
    typeof data.revision === "object"
  ) {
    data = data.revision;
  }

  if (
    !data ||
    typeof data !== "object"
  ) {
    return {
      cards: [],
      quiz: [],
    };
  }

  return {
    cards: normalizeCards(
      data.cards ||
        data.flashcards ||
        data.revision_cards ||
        data.revisionCards,
    ),
    quiz: normalizeQuiz(
      data.quiz ||
        data.mcqs ||
        data.questions ||
        data.quiz_questions ||
        data.quizQuestions,
    ),
  };
}

/* =====================================================
   CARDS
===================================================== */

function normalizeCards(
  value: unknown,
): RevisionCard[] {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item: any, index) => {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return null;
      }

      const title =
        String(
          item.title ||
            item.heading ||
            item.question_en ||
            item.question ||
            `Revision Point ${index + 1}`,
        ).trim();

      const content =
        String(
          item.content ||
            item.description ||
            item.explanation_en ||
            item.explanation ||
            item.answer_en ||
            item.answer ||
            "",
        ).trim();

      const keyPoint =
        String(
          item.keyPoint ||
            item.key_point ||
            item.key_facts ||
            "",
        ).trim();

      if (!content) {
        return null;
      }

      return {
        id:
          String(
            item.id ||
              `revision-card-${index + 1}`,
          ),
        title,
        content,
        keyPoint:
          keyPoint || undefined,
      };
    })
    .filter(
      (
        item,
      ): item is RevisionCard =>
        Boolean(item),
    );
}

/* =====================================================
   QUIZ
===================================================== */

function normalizeQuiz(
  value: unknown,
): QuizQuestion[] {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(value)) {
    return [];
  }

  const result: QuizQuestion[] = [];

  value.forEach(
    (item: any, index) => {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return;
      }

      const question =
        String(
          item.question ||
            item.question_en ||
            "",
        ).trim();

      if (!question) return;

      const options: string[] = [];

      if (Array.isArray(item.options)) {
        item.options.forEach(
          (option: any) => {
            if (
              typeof option ===
              "string"
            ) {
              const text =
                option.trim();

              if (text) {
                options.push(text);
              }
            } else if (
              option &&
              typeof option ===
                "object"
            ) {
              const text =
                String(
                  option.en ||
                    option.text ||
                    option.label ||
                    option.hi ||
                    "",
                ).trim();

              if (text) {
                options.push(text);
              }
            }
          },
        );
      }

      if (options.length !== 4) {
        return;
      }

      let answer = "";

      if (
        typeof item.correctAnswer ===
        "number"
      ) {
        answer =
          options[
            item.correctAnswer
          ] || "";
      } else {
        answer =
          String(
            item.answer ||
              item.correct_answer ||
              "",
          ).trim();

        const upper =
          answer.toUpperCase();

        if (
          ["A", "B", "C", "D"].includes(
            upper,
          )
        ) {
          answer =
            options[
              upper.charCodeAt(0) -
                65
            ] || "";
        }
      }

      if (!answer) return;

      if (
        !options.includes(answer)
      ) {
        return;
      }

      result.push({
        id:
          String(
            item.id ||
              `quiz-${index + 1}`,
          ),

        question,

        options,

        answer,

        explanation:
          String(
            item.explanation ||
              item.explanation_en ||
              "Answer ko revise karo aur concept ko dobara samjho.",
          ).trim(),
      });
    },
  );

  return result;
}

/* =====================================================
   SCORE MESSAGE
===================================================== */

function getScoreMessage(
  score: number,
  total: number,
) {
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
