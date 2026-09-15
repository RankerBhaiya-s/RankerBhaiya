import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Question = {
  id: number;
  category: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

const questions: Question[] = [
  {
    id: 1,
    category: "Current Affairs",
    question:
      "Which institution is responsible for formulating monetary policy in India?",
    options: [
      "SEBI",
      "RBI",
      "NITI Aayog",
      "Finance Commission",
    ],
    answer: "RBI",
    explanation:
      "The Reserve Bank of India (RBI) is responsible for India's monetary policy.",
  },
  {
    id: 2,
    category: "English",
    question:
      "Choose the synonym of the word 'Abundant'.",
    options: [
      "Scarce",
      "Plentiful",
      "Weak",
      "Limited",
    ],
    answer: "Plentiful",
    explanation:
      "Abundant means available in large quantities. Plentiful has the same meaning.",
  },
  {
    id: 3,
    category: "General Knowledge",
    question:
      "What is the capital of India?",
    options: [
      "Mumbai",
      "Kolkata",
      "New Delhi",
      "Chennai",
    ],
    answer: "New Delhi",
    explanation:
      "New Delhi is the capital city of India.",
  },
  {
    id: 4,
    category: "Reasoning",
    question:
      "If 2 + 3 = 10 and 3 + 4 = 21, then 4 + 5 = ?",
    options: [
      "36",
      "40",
      "45",
      "50",
    ],
    answer: "36",
    explanation:
      "The pattern is a × (a + b). Therefore 4 × (4 + 5) = 36.",
  },
  {
    id: 5,
    category: "English",
    question:
      "Choose the antonym of 'Ancient'.",
    options: [
      "Old",
      "Historic",
      "Modern",
      "Traditional",
    ],
    answer: "Modern",
    explanation:
      "Ancient means very old, while modern means relating to the present or recent times.",
  },
  {
    id: 6,
    category: "General Knowledge",
    question:
      "Which planet is known as the Red Planet?",
    options: [
      "Venus",
      "Mars",
      "Jupiter",
      "Saturn",
    ],
    answer: "Mars",
    explanation:
      "Mars is called the Red Planet because of the iron oxide present on its surface.",
  },
  {
    id: 7,
    category: "Current Affairs",
    question:
      "What does GDP stand for?",
    options: [
      "Gross Domestic Product",
      "General Development Plan",
      "Gross Development Process",
      "Government Domestic Policy",
    ],
    answer: "Gross Domestic Product",
    explanation:
      "GDP stands for Gross Domestic Product, the monetary value of goods and services produced within a country.",
  },
  {
    id: 8,
    category: "Reasoning",
    question:
      "Find the next number: 2, 4, 8, 16, ?",
    options: [
      "20",
      "24",
      "30",
      "32",
    ],
    answer: "32",
    explanation:
      "Each number is multiplied by 2. Therefore, 16 × 2 = 32.",
  },
];

const categories = [
  "All",
  "Current Affairs",
  "English",
  "General Knowledge",
  "Reasoning",
];

export default function PracticeQuestions() {
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null);

  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [quizFinished, setQuizFinished] =
    useState(false);

  const filteredQuestions = useMemo(() => {
    if (selectedCategory === "All") {
      return questions;
    }

    return questions.filter(
      (question) =>
        question.category === selectedCategory,
    );
  }, [selectedCategory]);

  const currentQuestion =
    filteredQuestions[currentIndex];

  const progress =
    filteredQuestions.length > 0
      ? Math.round(
          ((currentIndex +
            (selectedAnswer ? 1 : 0)) /
            filteredQuestions.length) *
            100,
        )
      : 0;

  const handleAnswer = (option: string) => {
    if (selectedAnswer) {
      return;
    }

    setSelectedAnswer(option);
    setAnswered((value) => value + 1);

    if (option === currentQuestion.answer) {
      setScore((value) => value + 1);
    }
  };

  const handleNext = () => {
    if (
      currentIndex <
      filteredQuestions.length - 1
    ) {
      setCurrentIndex((value) => value + 1);
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
    }
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnswered(0);
    setQuizFinished(false);
  };

  const changeCategory = (category: string) => {
    setSelectedCategory(category);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnswered(0);
    setQuizFinished(false);
  };

  if (quizFinished) {
    const percentage =
      filteredQuestions.length > 0
        ? Math.round(
            (score / filteredQuestions.length) * 100,
          )
        : 0;

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">

        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
          <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

            <button
              type="button"
              onClick={() =>
                navigate("/student/dashboard")
              }
              className="flex items-center gap-3"
            >
              <img
                src={`${import.meta.env.BASE_URL}favicon.png`}
                alt="Ranker Bhaiya"
                className="h-10 w-10 rounded-xl object-cover shadow-lg"
              />

              <div className="hidden text-left sm:block">
                <div className="text-lg font-black">
                  Ranker{" "}
                  <span className="text-yellow-500">
                    Bhaiya
                  </span>
                </div>

                <div className="text-[10px] text-slate-400">
                  Aapki Mehnat · Hamari Strategy
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/student/dashboard")
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              ← Dashboard
            </button>

          </div>
        </header>

        <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-4xl items-center px-4 py-8 sm:px-6">

          <section className="w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">

            <div className="bg-gradient-to-br from-rose-600 via-pink-600 to-orange-600 p-7 text-center text-white sm:p-10">

              <div className="text-5xl">
                {percentage >= 80
                  ? "🏆"
                  : percentage >= 50
                    ? "🔥"
                    : "💪"}
              </div>

              <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-white/75">
                QUIZ COMPLETE
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                Great Work!
              </h1>

              <p className="mt-2 text-sm text-white/80">
                You completed all the questions.
              </p>

            </div>

            <div className="p-6 sm:p-10">

              <div className="grid gap-4 sm:grid-cols-3">

                <ResultCard
                  icon="🎯"
                  label="Score"
                  value={`${score}/${filteredQuestions.length}`}
                />

                <ResultCard
                  icon="📈"
                  label="Accuracy"
                  value={`${percentage}%`}
                />

                <ResultCard
                  icon="📝"
                  label="Attempted"
                  value={answered.toString()}
                />

              </div>

              <div className="mt-8 rounded-2xl bg-slate-50 p-5 text-center dark:bg-slate-800/60">

                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {percentage >= 80
                    ? "Excellent! Keep up the momentum. 🚀"
                    : percentage >= 50
                      ? "Good attempt! A little more practice will make you stronger. 💪"
                      : "Keep practicing. Every question makes you better. 📚"}
                </p>

              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"
                  onClick={restartQuiz}
                  className="flex-1 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-900"
                >
                  🔄 Try Again
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/student/dashboard")
                  }
                  className="flex-1 rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  ← Back to Dashboard
                </button>

              </div>

            </div>

          </section>

        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">

        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          <button
            type="button"
            onClick={() =>
              navigate("/student/dashboard")
            }
            className="flex items-center gap-3"
          >
            <img
              src={`${import.meta.env.BASE_URL}favicon.png`}
              alt="Ranker Bhaiya"
              className="h-10 w-10 rounded-xl object-cover shadow-lg"
            />

            <div className="hidden text-left sm:block">
              <div className="text-lg font-black">
                Ranker{" "}
                <span className="text-yellow-500">
                  Bhaiya
                </span>
              </div>

              <div className="text-[10px] text-slate-400">
                Aapki Mehnat · Hamari Strategy
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/student/dashboard")
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
          >
            ← Dashboard
          </button>

        </div>

      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* HERO */}

        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-600 via-pink-600 to-orange-600 p-6 text-white shadow-xl shadow-rose-200/50 dark:shadow-none sm:p-9">

          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-yellow-300/10 blur-3xl" />

          <div className="relative z-10 max-w-3xl">

            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-black tracking-wide backdrop-blur">
              📝 PRACTICE MODE
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Practice Questions
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/85 sm:text-base">
              Topic-wise questions solve karo, apni accuracy
              improve karo aur exam ke liye confidence build karo.
            </p>

          </div>

        </section>

        {/* CATEGORY */}

        <section className="mt-6">

          <div className="flex gap-2 overflow-x-auto pb-2">

            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() =>
                  changeCategory(category)
                }
                className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-black transition ${
                  selectedCategory === category
                    ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900"
                    : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                }`}
              >
                {category}
              </button>
            ))}

          </div>

        </section>

        {/* QUESTION */}

        {currentQuestion ? (
          <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

            {/* PROGRESS */}

            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-7">

              <div className="flex items-center justify-between text-xs font-bold">

                <span className="text-slate-400">
                  Question {currentIndex + 1} of{" "}
                  {filteredQuestions.length}
                </span>

                <span className="text-rose-600 dark:text-rose-400">
                  {progress}%
                </span>

              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">

                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 transition-all duration-500"
                  style={{
                    width: `${Math.max(progress, 8)}%`,
                  }}
                />

              </div>

            </div>

            <div className="p-6 sm:p-8">

              {/* CATEGORY */}

              <div className="flex flex-wrap items-center gap-2">

                <span className="rounded-full bg-rose-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                  {currentQuestion.category}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  MCQ
                </span>

              </div>

              {/* QUESTION TEXT */}

              <h2 className="mt-6 text-xl font-black leading-8 tracking-tight sm:text-2xl">
                {currentQuestion.question}
              </h2>

              {/* OPTIONS */}

              <div className="mt-7 space-y-3">

                {currentQuestion.options.map(
                  (option, index) => {

                    const isSelected =
                      selectedAnswer === option;

                    const isCorrect =
                      option ===
                      currentQuestion.answer;

                    let optionClass =
                      "border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-rose-800 dark:hover:bg-rose-950/20";

                    if (selectedAnswer) {
                      if (isCorrect) {
                        optionClass =
                          "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30";
                      } else if (isSelected) {
                        optionClass =
                          "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/30";
                      } else {
                        optionClass =
                          "border-slate-200 bg-slate-50 opacity-70 dark:border-slate-700 dark:bg-slate-800";
                      }
                    }

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          handleAnswer(option)
                        }
                        disabled={Boolean(selectedAnswer)}
                        className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition duration-200 ${optionClass}`}
                      >

                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                            selectedAnswer &&
                            isCorrect
                              ? "bg-emerald-500 text-white"
                              : selectedAnswer &&
                                  isSelected
                                ? "bg-red-500 text-white"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {String.fromCharCode(
                            65 + index,
                          )}
                        </span>

                        <span className="flex-1 text-sm font-bold">
                          {option}
                        </span>

                        {selectedAnswer &&
                          isCorrect && (
                            <span className="text-lg">
                              ✓
                            </span>
                          )}

                        {selectedAnswer &&
                          isSelected &&
                          !isCorrect && (
                            <span className="text-lg">
                              ✕
                            </span>
                          )}

                      </button>
                    );
                  },
                )}

              </div>

              {/* RESULT */}

              {selectedAnswer && (
                <div
                  className={`mt-6 rounded-2xl border p-5 ${
                    selectedAnswer ===
                    currentQuestion.answer
                      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                      : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"
                  }`}
                >

                  <div className="flex items-start gap-3">

                    <span className="text-2xl">
                      {selectedAnswer ===
                      currentQuestion.answer
                        ? "🎉"
                        : "💡"}
                    </span>

                    <div>

                      <h3
                        className={`font-black ${
                          selectedAnswer ===
                          currentQuestion.answer
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-red-700 dark:text-red-400"
                        }`}
                      >
                        {selectedAnswer ===
                        currentQuestion.answer
                          ? "Correct Answer!"
                          : "Not Quite!"}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Correct answer:{" "}
                        {currentQuestion.answer}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        {currentQuestion.explanation}
                      </p>

                    </div>

                  </div>

                </div>
              )}

              {/* NEXT */}

              {selectedAnswer && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl dark:bg-white dark:text-slate-900"
                >
                  {currentIndex ===
                  filteredQuestions.length - 1
                    ? "Finish Quiz 🎯"
                    : "Next Question →"}
                </button>
              )}

            </div>

          </section>
        ) : (
          <section className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">

            <div className="text-5xl">
              📝
            </div>

            <h2 className="mt-4 text-xl font-black">
              No questions found
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Try selecting another category.
            </p>

          </section>
        )}

        {/* TIP */}

        <section className="mt-6 rounded-[1.5rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-900/50 dark:from-amber-950/20 dark:to-orange-950/20">

          <div className="flex gap-3">

            <span className="text-2xl">
              💡
            </span>

            <div>

              <h3 className="font-black">
                Practice Tip
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Pehle question ko carefully read karo,
                options eliminate karo aur phir answer select karo.
                Accuracy ko speed se pehle priority do.
              </p>

            </div>

          </div>

        </section>

      </main>
    </div>
  );
}

/* =====================================================
   RESULT CARD
===================================================== */

function ResultCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center dark:border-slate-700 dark:bg-slate-800/60">

      <div className="text-2xl">
        {icon}
      </div>

      <div className="mt-2 text-2xl font-black">
        {value}
      </div>

      <div className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>

    </div>
  );
}
