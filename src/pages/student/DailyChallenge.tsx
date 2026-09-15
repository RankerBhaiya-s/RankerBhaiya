import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Challenge = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

const challenges: Challenge[] = [
  {
    question: "Which is the largest planet in our Solar System?",
    options: ["Earth", "Mars", "Jupiter", "Saturn"],
    answer: "Jupiter",
    explanation:
      "Jupiter is the largest planet in our Solar System.",
  },
  {
    question: "Choose the synonym of 'Rapid'.",
    options: ["Slow", "Fast", "Weak", "Late"],
    answer: "Fast",
    explanation:
      "Rapid means happening very quickly, so Fast is its synonym.",
  },
  {
    question: "What is 15% of 200?",
    options: ["20", "25", "30", "35"],
    answer: "30",
    explanation:
      "15% of 200 = 15/100 × 200 = 30.",
  },
  {
    question: "Which gas is most abundant in Earth's atmosphere?",
    options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
    answer: "Nitrogen",
    explanation:
      "Nitrogen makes up about 78% of Earth's atmosphere.",
  },
  {
    question: "Choose the antonym of 'Expand'.",
    options: ["Increase", "Extend", "Contract", "Grow"],
    answer: "Contract",
    explanation:
      "Contract means to become smaller, making it the antonym of Expand.",
  },
];

export default function DailyChallenge() {
  const navigate = useNavigate();

  const [challengeIndex, setChallengeIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const challenge = challenges[challengeIndex];

  const handleAnswer = (option: string) => {
    if (selectedAnswer) return;

    setSelectedAnswer(option);

    if (option === challenge.answer) {
      setScore((value) => value + 1);
    }
  };

  const nextChallenge = () => {
    if (challengeIndex < challenges.length - 1) {
      setChallengeIndex((value) => value + 1);
      setSelectedAnswer(null);
    } else {
      setCompleted(true);
    }
  };

  const restartChallenge = () => {
    setChallengeIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setCompleted(false);
  };

  if (completed) {
    const percentage = Math.round(
      (score / challenges.length) * 100,
    );

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
              onClick={() =>
                navigate("/student/dashboard")
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              ← Dashboard
            </button>
          </div>
        </header>

        <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-3xl items-center px-4 py-8 sm:px-6">
          <section className="w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 p-8 text-center text-white sm:p-10">
              <div className="text-6xl">
                {percentage >= 80
                  ? "🏆"
                  : percentage >= 50
                    ? "🔥"
                    : "💪"}
              </div>

              <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-white/75">
                DAILY CHALLENGE COMPLETE
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                Challenge Complete!
              </h1>

              <p className="mt-2 text-sm text-white/80">
                Aaj ka challenge successfully attempt kiya.
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <ResultCard
                  icon="🎯"
                  label="Score"
                  value={`${score}/${challenges.length}`}
                />

                <ResultCard
                  icon="📈"
                  label="Accuracy"
                  value={`${percentage}%`}
                />

                <ResultCard
                  icon="🔥"
                  label="Challenge"
                  value="Done"
                />
              </div>

              <div className="mt-7 rounded-2xl bg-slate-50 p-5 text-center dark:bg-slate-800/60">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {percentage >= 80
                    ? "Excellent! Aaj tumne challenge crush kar diya! 🚀"
                    : percentage >= 50
                      ? "Good job! Kal aur better score target karo. 💪"
                      : "Keep practicing! Kal ka challenge miss mat karna. 📚"}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={restartChallenge}
                  className="flex-1 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl dark:bg-white dark:text-slate-900"
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
      {/* HEADER */}
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
            onClick={() =>
              navigate("/student/dashboard")
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 p-6 text-white shadow-xl shadow-orange-200/50 dark:shadow-none sm:p-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-yellow-300/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-black tracking-wide backdrop-blur">
              🔥 DAILY CHALLENGE
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Today's Challenge
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
              Roz ek short challenge complete karo aur apni
              preparation ko consistent rakho.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                🎯 5 Questions
              </span>

              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                ⚡ Quick Practice
              </span>

              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                🔥 Build Your Streak
              </span>
            </div>
          </div>
        </section>

        {/* PROGRESS */}
        <section className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-center justify-between text-xs font-black">
            <span className="text-slate-400">
              Challenge {challengeIndex + 1} of{" "}
              {challenges.length}
            </span>

            <span className="text-orange-600 dark:text-orange-400">
              {Math.round(
                ((challengeIndex +
                  (selectedAnswer ? 1 : 0)) /
                  challenges.length) *
                  100,
              )}
              %
            </span>
          </div>

          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 transition-all duration-500"
              style={{
                width: `${Math.max(
                  8,
                  Math.round(
                    ((challengeIndex +
                      (selectedAnswer ? 1 : 0)) /
                      challenges.length) *
                      100,
                  ),
                )}%`,
              }}
            />
          </div>
        </section>

        {/* QUESTION */}
        <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                ⚡ Quick Question
              </span>

              <span className="text-sm font-black text-slate-400">
                Score: {score}
              </span>
            </div>

            <h2 className="mt-6 text-xl font-black leading-8 tracking-tight sm:text-2xl">
              {challenge.question}
            </h2>

            <div className="mt-7 space-y-3">
              {challenge.options.map(
                (option, index) => {
                  const isSelected =
                    selectedAnswer === option;

                  const isCorrect =
                    option === challenge.answer;

                  let optionClass =
                    "border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-orange-800 dark:hover:bg-orange-950/20";

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
                      disabled={Boolean(selectedAnswer)}
                      onClick={() =>
                        handleAnswer(option)
                      }
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

            {/* EXPLANATION */}
            {selectedAnswer && (
              <div
                className={`mt-6 rounded-2xl border p-5 ${
                  selectedAnswer === challenge.answer
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                    : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"
                }`}
              >
                <div className="flex gap-3">
                  <span className="text-2xl">
                    {selectedAnswer === challenge.answer
                      ? "🎉"
                      : "💡"}
                  </span>

                  <div>
                    <h3
                      className={`font-black ${
                        selectedAnswer ===
                        challenge.answer
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {selectedAnswer === challenge.answer
                        ? "Correct!"
                        : "Keep Learning!"}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Correct answer:{" "}
                      {challenge.answer}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {challenge.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* NEXT */}
            {selectedAnswer && (
              <button
                type="button"
                onClick={nextChallenge}
                className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl dark:bg-white dark:text-slate-900"
              >
                {challengeIndex ===
                challenges.length - 1
                  ? "Complete Challenge 🏆"
                  : "Next Question →"}
              </button>
            )}
          </div>
        </section>

        {/* TIP */}
        <section className="mt-6 rounded-[1.5rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-900/50 dark:from-amber-950/20 dark:to-orange-950/20">
          <div className="flex gap-3">
            <span className="text-2xl">💡</span>

            <div>
              <h3 className="font-black">
                Daily Challenge Tip
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Challenge ka goal sirf score banana nahi hai.
                Har wrong answer ki explanation padho aur usse
                apni preparation mein use karo.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

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
      <div className="text-2xl">{icon}</div>

      <div className="mt-2 text-2xl font-black">
        {value}
      </div>

      <div className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>
    </div>
  );
}
