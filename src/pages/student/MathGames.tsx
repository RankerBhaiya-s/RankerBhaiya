
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import "./MathGames.css";

type GameId = "flashcards" | "tables" | "arithmetic" | "calculator" | "quiz";
type Level = "easy" | "medium" | "hard";

type Question = {
  prompt: string;
  options: number[];
  answer: number;
  hint: string;
};

type Stats = {
  played: number;
  correct: number;
  best: Record<GameId, number>;
  recent: { game: string; score: number; date: string }[];
};

const STORAGE_KEY = "ranker-bhaiya-math-games-v1";
const QUESTIONS_PER_ROUND = 10;

const LEVEL_SECONDS: Record<Level, number> = {
  easy: 5,
  medium: 10,
  hard: 15,
};

const LEVEL_LABELS: Record<Level, { en: string; hi: string }> = {
  easy: { en: "Easy · 5 sec", hi: "आसान · 5 सेकंड" },
  medium: { en: "Medium · 10 sec", hi: "मध्यम · 10 सेकंड" },
  hard: { en: "Hard · 15 sec", hi: "कठिन · 15 सेकंड" },
};

const GAME_IDS: GameId[] = [
  "flashcards",
  "tables",
  "arithmetic",
  "calculator",
  "quiz",
];

const initialStats: Stats = {
  played: 0,
  correct: 0,
  best: {
    flashcards: 0,
    tables: 0,
    arithmetic: 0,
    calculator: 0,
    quiz: 0,
  },
  recent: [],
};

const copy = {
  en: {
    eyebrow: "LEARN • PLAY • IMPROVE",
    title: "Math Games",
    subtitle: "Sharpen your maths skills, one fun round at a time.",
    back: "← Dashboard",
    games: "Choose your game",
    gamesSub: "Pick a challenge and start playing.",
    score: "Total correct",
    played: "Rounds played",
    best: "Best score",
    leaderboard: "Your leaderboard",
    leaderboardSub: "Your recent scores on this device",
    noScores: "No games played yet. Your scores will appear here.",
    start: "Play now →",
    restart: "Play again",
    home: "All games",
    question: "Question",
    of: "of",
    time: "Time left",
    points: "Score",
    choose: "Choose an answer",
    correct: "Great job! That's correct.",
    wrong: "Not quite. Correct answer:",
    timeUp: "Time's up!",
    completed: "Round complete!",
    accuracy: "Accuracy",
    hint: "Hint",
    language: "हिन्दी",
    min: "sec",
    tablePrompt: "Complete the multiplication",
    flashPrompt: "Solve this number card",
    arithmeticPrompt: "Solve the calculation",
    calculatorPrompt: "Calculator challenge",
    quizPrompt: "Math quiz",
    flashTitle: "Number Flashcards",
    flashDesc: "Quick mental maths challenges.",
    tableTitle: "Table Practice",
    tableDesc: "Practise multiplication tables.",
    arithmeticTitle: "Addition & Subtraction",
    arithmeticDesc: "Build speed with calculations.",
    calculatorTitle: "Calculator Practice",
    calculatorDesc: "Solve mixed-operation challenges.",
    quizTitle: "Math Quiz",
    quizDesc: "Test your overall maths skills.",
    recent: "Recent rounds",
    pointsLabel: "points",
    saved: "Scores save on this device.",
    level: "Choose difficulty",
    next: "Next question →",
    startLevel: "Start round →",
  },
  hi: {
    eyebrow: "सीखें • खेलें • बेहतर बनें",
    title: "मैथ गेम्स",
    subtitle: "मज़ेदार राउंड खेलकर गणित की प्रैक्टिस बेहतर बनाएं।",
    back: "← डैशबोर्ड",
    games: "अपना गेम चुनें",
    gamesSub: "चुनौती चुनें और खेलना शुरू करें।",
    score: "सही जवाब",
    played: "खेले गए राउंड",
    best: "सबसे अच्छा स्कोर",
    leaderboard: "आपका लीडरबोर्ड",
    leaderboardSub: "इस डिवाइस पर आपके हाल के स्कोर",
    noScores: "अभी कोई गेम नहीं खेला। आपके स्कोर यहाँ दिखेंगे।",
    start: "अभी खेलें →",
    restart: "फिर से खेलें",
    home: "सभी गेम",
    question: "प्रश्न",
    of: "में से",
    time: "बाकी समय",
    points: "स्कोर",
    choose: "एक जवाब चुनें",
    correct: "बहुत बढ़िया! जवाब सही है।",
    wrong: "सही उत्तर है:",
    timeUp: "समय पूरा!",
    completed: "राउंड पूरा हुआ!",
    accuracy: "सटीकता",
    hint: "संकेत",
    language: "English",
    min: "सेकंड",
    tablePrompt: "गुणा पूरा करें",
    flashPrompt: "इस संख्या का हल निकालें",
    arithmeticPrompt: "गणना हल करें",
    calculatorPrompt: "कैलकुलेटर चुनौती",
    quizPrompt: "गणित क्विज़",
    flashTitle: "नंबर फ्लैशकार्ड",
    flashDesc: "तेज़ मानसिक गणित की चुनौती।",
    tableTitle: "पहाड़े की प्रैक्टिस",
    tableDesc: "गुणा के पहाड़ों का अभ्यास करें।",
    arithmeticTitle: "जोड़ और घटाव",
    arithmeticDesc: "गणना की गति बढ़ाएँ।",
    calculatorTitle: "कैलकुलेटर प्रैक्टिस",
    calculatorDesc: "मिश्रित गणनाएँ हल करें।",
    quizTitle: "मैथ क्विज़",
    quizDesc: "अपने गणित ज्ञान को परखें।",
    recent: "हाल के राउंड",
    pointsLabel: "अंक",
    saved: "स्कोर इसी डिवाइस पर सेव होते हैं।",
    level: "कठिनाई चुनें",
    next: "अगला प्रश्न →",
    startLevel: "राउंड शुरू करें →",
  },
};

const gameInfo: {
  id: GameId;
  icon: string;
  color: string;
  titleKey: keyof typeof copy.en;
  descKey: keyof typeof copy.en;
}[] = [
  { id: "flashcards", icon: "🃏", color: "violet", titleKey: "flashTitle", descKey: "flashDesc" },
  { id: "tables", icon: "✖️", color: "blue", titleKey: "tableTitle", descKey: "tableDesc" },
  { id: "arithmetic", icon: "➕", color: "orange", titleKey: "arithmeticTitle", descKey: "arithmeticDesc" },
  { id: "calculator", icon: "🧮", color: "teal", titleKey: "calculatorTitle", descKey: "calculatorDesc" },
  { id: "quiz", icon: "🎯", color: "pink", titleKey: "quizTitle", descKey: "quizDesc" },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function makeQuestion(game: GameId, level: Level): Question {
  let answer = 0;
  let prompt = "";
  let hint = "";

  const a = level === "easy"
    ? randomInt(2, 12)
    : level === "medium"
      ? randomInt(12, 60)
      : randomInt(25, 150);

  const b = level === "easy"
    ? randomInt(2, 10)
    : level === "medium"
      ? randomInt(5, 25)
      : randomInt(12, 60);

  if (level === "hard" && game !== "tables") {
    const kind = randomInt(1, 6);

    if (kind === 1) {
      const x = randomInt(12, 45);
      const y = randomInt(12, 35);
      const z = randomInt(10, 80);
      answer = x * y - z;
      prompt = `${x} × ${y} − ${z} = ?`;
      hint = "Multiply first, then subtract.";
    } else if (kind === 2) {
      const percent = [15, 20, 25, 35, 40, 60, 75][randomInt(0, 6)];
      const base = randomInt(4, 40) * 20;
      answer = (base * percent) / 100;
      prompt = `${percent}% of ${base} = ?`;
      hint = "Convert the percentage into a fraction.";
    } else if (kind === 3) {
      const x = randomInt(12, 30);
      const y = randomInt(12, 30);
      const z = randomInt(2, 12);
      answer = x * x + y - z;
      prompt = `${x}² + ${y} − ${z} = ?`;
      hint = "Square the first number before adding.";
    } else if (kind === 4) {
      const denominator = [3, 4, 5, 8, 10][randomInt(0, 4)];
      const whole = denominator * randomInt(40, 150);
      const subtract = randomInt(15, 100);
      answer = (whole / denominator) * (denominator - 1) - subtract;
      prompt = `${denominator - 1}/${denominator} of ${whole} − ${subtract} = ?`;
      hint = "Find the fraction first, then subtract.";
    } else if (kind === 5) {
      const x = randomInt(15, 60);
      const y = randomInt(12, 40);
      const z = randomInt(2, 9);
      answer = x * y + z * z;
      prompt = `${x} × ${y} + ${z}² = ?`;
      hint = "Calculate the power before adding.";
    } else {
      const x = randomInt(20, 90);
      const divisor = randomInt(2, 12);
      const divisible = x - (x % divisor);
      const extra = randomInt(10, 50);
      answer = divisible / divisor + extra * 3;
      prompt = `${divisible} ÷ ${divisor} + ${extra} × 3 = ?`;
      hint = "Follow BODMAS: division and multiplication first.";
    }
  } else if (game === "tables") {
    const x = level === "easy" ? randomInt(2, 12) : level === "medium" ? randomInt(8, 25) : randomInt(15, 40);
    const y = level === "easy" ? randomInt(2, 10) : level === "medium" ? randomInt(8, 20) : randomInt(12, 30);
    answer = x * y;
    prompt = `${x} × ${y} = ?`;
    hint = `${x} groups of ${y}`;
  } else if (game === "arithmetic") {
    const subtract = Math.random() > 0.5;
    const x = Math.max(a, b);
    const y = Math.min(a, b);
    answer = subtract ? x - y : x + y;
    prompt = `${x} ${subtract ? "−" : "+"} ${y} = ?`;
    hint = subtract ? "Find the difference." : "Combine both numbers.";
  } else if (game === "calculator") {
    const operation = randomInt(1, 3);
    const x = level === "easy" ? randomInt(2, 20) : randomInt(20, 100);
    const y = level === "easy" ? randomInt(2, 12) : randomInt(10, 50);

    if (operation === 1) {
      answer = x + y;
      prompt = `${x} + ${y} = ?`;
      hint = "Add both numbers.";
    } else if (operation === 2) {
      answer = Math.max(x, y) - Math.min(x, y);
      prompt = `${Math.max(x, y)} − ${Math.min(x, y)} = ?`;
      hint = "Subtract the smaller number.";
    } else {
      answer = x * y;
      prompt = `${x} × ${y} = ?`;
      hint = "Use multiplication.";
    }
  } else {
    const operation = randomInt(1, 4);
    if (operation === 1) {
      answer = a + b;
      prompt = `What is ${a} + ${b}?`;
      hint = "Combine both numbers.";
    } else if (operation === 2) {
      answer = Math.max(a, b) - Math.min(a, b);
      prompt = `What is ${Math.max(a, b)} − ${Math.min(a, b)}?`;
      hint = "Find the difference.";
    } else if (operation === 3) {
      answer = a * b;
      prompt = `What is ${a} × ${b}?`;
      hint = "Use multiplication.";
    } else {
      const divisor = randomInt(2, 12);
      const quotient = randomInt(2, 20);
      answer = quotient;
      prompt = `${divisor * quotient} ÷ ${divisor} = ?`;
      hint = "Think of the related multiplication fact.";
    }
  }

  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const offset = randomInt(1, Math.max(10, Math.ceil(Math.abs(answer) * 0.15))) *
      (Math.random() > 0.5 ? 1 : -1);
    const candidate = answer + offset;
    if (candidate !== answer && candidate >= 0) wrong.add(candidate);
  }

  return { prompt, options: shuffle([answer, ...wrong]), answer, hint };
}

function readStats(): Stats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialStats;

    const parsed = JSON.parse(raw) as Partial<Stats>;
    return {
      played: Number(parsed.played) || 0,
      correct: Number(parsed.correct) || 0,
      best: { ...initialStats.best, ...(parsed.best || {}) },
      recent: Array.isArray(parsed.recent) ? parsed.recent : [],
    };
  } catch {
    return initialStats;
  }
}

export default function MathGames() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [hindi, setHindi] = useState(false);
  const t = hindi ? copy.hi : copy.en;

  const [stats, setStats] = useState<Stats>(readStats);
  const [selectedGame, setSelectedGame] = useState<GameId | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level>("easy");
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [seconds, setSeconds] = useState(5);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [roundDone, setRoundDone] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const isPlaying = selectedGame !== null && !roundDone && answered === null;

  const gameTitle = useMemo(
    () => gameInfo.find((game) => game.id === selectedGame),
    [selectedGame],
  );

  function finishRound(finalScore = score, finalCorrect = roundCorrect) {
    if (!selectedGame || roundDone) return;

    setRoundDone(true);
    const nextStats: Stats = {
      ...stats,
      played: stats.played + 1,
      correct: stats.correct + finalCorrect,
      best: {
        ...stats.best,
        [selectedGame]: Math.max(stats.best[selectedGame], finalScore),
      },
      recent: [
        {
          game: gameTitle?.titleKey || selectedGame,
          score: finalScore,
          date: new Date().toLocaleDateString(),
        },
        ...stats.recent,
      ].slice(0, 10),
    };

    setStats(nextStats);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStats));
    } catch {
      // The round still works if storage is unavailable.
    }
  }

  function nextQuestion() {
    if (questionNumber >= QUESTIONS_PER_ROUND) {
      finishRound();
      return;
    }

    if (selectedGame) {
      setQuestion(makeQuestion(selectedGame, selectedLevel));
    }

    setQuestionNumber((value) => value + 1);
    setSeconds(LEVEL_SECONDS[selectedLevel]);
    setAnswered(null);
    setShowHint(false);
  }

  function answerQuestion(value: number) {
    if (answered !== null || roundDone || !question) return;

    setAnswered(value);

    if (value === question.answer) {
      setScore((current) => current + 10);
      setRoundCorrect((current) => current + 1);
    }
  }

  function startGame(game: GameId) {
    setSelectedGame(game);
    setQuestion(makeQuestion(game, selectedLevel));
    setQuestionNumber(1);
    setSeconds(LEVEL_SECONDS[selectedLevel]);
    setScore(0);
    setRoundCorrect(0);
    setAnswered(null);
    setRoundDone(false);
    setShowHint(false);
  }

  function handleTimeout() {
    if (answered !== null || roundDone) return;

    setAnswered(-1);
  }

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) return 0;
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isPlaying, questionNumber, selectedGame]);

  useEffect(() => {
    if (seconds === 0 && isPlaying) {
      handleTimeout();
    }
    // Timer expiry is handled once per unanswered question.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, isPlaying]);

  return (
    <div className={`math-games-page ${dark ? "mg-dark" : ""}`}>
      <div className="mg-shell">
        <header className="mg-topbar">
          <button
            className="mg-brand"
            onClick={() => navigate("/student/dashboard")}
            type="button"
          >
            <span className="mg-logo">RB</span>
            <span>
              <strong>Ranker Bhaiya</strong>
              <small>Aapki Mehnat, Hamari Strategy.</small>
            </span>
          </button>

          <div className="mg-top-actions">
            <button
              className="mg-ghost"
              onClick={() => setHindi((value) => !value)}
              type="button"
            >
              🌐 {t.language}
            </button>
            <button
              className="mg-ghost"
              onClick={() => navigate("/student/dashboard")}
              type="button"
            >
              {t.back}
            </button>
          </div>
        </header>

        {!selectedGame && (
          <>
            <section className="mg-hero">
              <div className="mg-hero-copy">
                <span className="mg-eyebrow">{t.eyebrow}</span>
                <h1>{t.title}<span>.</span></h1>
                <p>{t.subtitle}</p>
              </div>
              <div className="mg-hero-art" aria-hidden="true">
                <span className="mg-art-circle">∑</span>
                <span className="mg-art-chip chip-one">×</span>
                <span className="mg-art-chip chip-two">÷</span>
                <span className="mg-art-chip chip-three">+</span>
              </div>
            </section>

            <section className="mg-stat-grid">
              <div className="mg-stat">
                <span>🏆</span><small>{t.played}</small><strong>{stats.played}</strong>
              </div>
              <div className="mg-stat">
                <span>✅</span><small>{t.score}</small><strong>{stats.correct}</strong>
              </div>
              <div className="mg-stat">
                <span>⭐</span><small>{t.best}</small>
                <strong>{Math.max(...GAME_IDS.map((id) => stats.best[id]))}</strong>
              </div>
            </section>

            <section className="mg-section">
              <div className="mg-section-heading">
                <div><h2>{t.games}</h2><p>{t.gamesSub}</p></div>
              </div>

              <div className="mg-game-grid">
                {gameInfo.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    className={`mg-game-card ${game.color}`}
                    onClick={() => setSelectedGame(game.id)}
                  >
                    <span className="mg-game-icon">{game.icon}</span>
                    <span className="mg-game-copy">
                      <strong>{t[game.titleKey]}</strong>
                      <small>{t[game.descKey]}</small>
                    </span>
                    <span className="mg-game-arrow">↗</span>
                    <span className="mg-best-line">
                      {t.best}: {stats.best[game.id]}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="mg-section">
              <div className="mg-section-heading">
                <div><h2>{t.leaderboard}</h2><p>{t.leaderboardSub}</p></div>
              </div>

              {stats.recent.length ? (
                <div className="mg-score-list">
                  {stats.recent.map((entry, index) => (
                    <div className="mg-score-row" key={`${entry.date}-${index}`}>
                      <span className="mg-rank">{index + 1}</span>
                      <span className="mg-score-name">
                        {t[entry.game as keyof typeof t] || entry.game}
                      </span>
                      <span className="mg-score-date">{entry.date}</span>
                      <strong>{entry.score} {t.pointsLabel}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mg-empty">🏁<p>{t.noScores}</p></div>
              )}
              <p className="mg-storage-note">ℹ️ {t.saved}</p>
            </section>
          </>
        )}

        {selectedGame && !question && !roundDone && (
          <section className="mg-play-card">
            <div className="mg-play-header">
              <button
                type="button"
                className="mg-ghost"
                onClick={() => setSelectedGame(null)}
              >
                ← {t.home}
              </button>
            </div>

            <div className="mg-question-area">
              <span className="mg-question-icon">{gameTitle?.icon}</span>
              <h2>{t.level}</h2>

              <div className="mg-options">
                {(["easy", "medium", "hard"] as Level[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`mg-option ${selectedLevel === level ? "is-correct" : ""}`}
                    onClick={() => setSelectedLevel(level)}
                  >
                    {LEVEL_LABELS[level][hindi ? "hi" : "en"]}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="mg-primary"
                onClick={() => startGame(selectedGame)}
              >
                {t.startLevel}
              </button>
            </div>
          </section>
        )}

        {selectedGame && question && !roundDone && (
          <section className="mg-play-card">
            <div className="mg-play-header">
              <button
                type="button"
                className="mg-ghost"
                onClick={() => {
                  setSelectedGame(null);
                  setQuestion(null);
                }}
              >
                ← {t.home}
              </button>
              <span className={`mg-timer ${seconds <= 3 ? "urgent" : ""}`}>
                ⏱ {t.time}: {seconds} {t.min}
              </span>
            </div>

            <div className="mg-progress-label">
              <span>{t.question} {questionNumber} {t.of} {QUESTIONS_PER_ROUND}</span>
              <span>⭐ {t.points}: {score}</span>
            </div>

            <div className="mg-progress">
              <span style={{ width: `${questionNumber * 10}%` }} />
            </div>

            <div className="mg-question-area">
              <span className="mg-question-icon">{gameTitle?.icon}</span>
              <p className="mg-question-kicker">
                {selectedGame === "tables"
                  ? t.tablePrompt
                  : selectedGame === "flashcards"
                    ? t.flashPrompt
                    : selectedGame === "arithmetic"
                      ? t.arithmeticPrompt
                      : selectedGame === "calculator"
                        ? t.calculatorPrompt
                        : t.quizPrompt}
              </p>

              <h2>{question.prompt}</h2>
              <p className="mg-select-label">{t.choose}</p>

              <div className="mg-options">
                {question.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={answered !== null}
                    onClick={() => answerQuestion(option)}
                    className={`mg-option ${
                      answered !== null && option === question.answer
                        ? "is-correct"
                        : ""
                    } ${
                      answered === option && option !== question.answer
                        ? "is-wrong"
                        : ""
                    }`}
                  >
                    {option}
                    {answered !== null && option === question.answer && <span>✓</span>}
                    {answered === option && option !== question.answer && <span>×</span>}
                  </button>
                ))}
              </div>

              {answered !== null && (
                <div className={`mg-feedback ${answered === question.answer ? "good" : "bad"}`}>
                  <strong>
                    {answered === -1
                      ? t.timeUp
                      : answered === question.answer
                        ? t.correct
                        : t.wrong}
                  </strong>
                  {answered !== question.answer && <span>{question.answer}</span>}
                  <button type="button" onClick={nextQuestion}>
                    {questionNumber >= QUESTIONS_PER_ROUND ? t.completed : t.next}
                  </button>
                </div>
              )}

              <div className="mg-hint-wrap">
                <button
                  type="button"
                  className="mg-hint-button"
                  onClick={() => setShowHint((value) => !value)}
                >
                  💡 {t.hint} {showHint ? "−" : "+"}
                </button>
                {showHint && <p>{question.hint}</p>}
              </div>
            </div>
          </section>
        )}

        {selectedGame && roundDone && (
          <section className="mg-result-card">
            <div className="mg-result-icon">🏆</div>
            <span className="mg-eyebrow">{t.completed}</span>
            <h1>{score} <small>{t.pointsLabel}</small></h1>
            <p>{t.accuracy}: {Math.round((roundCorrect / QUESTIONS_PER_ROUND) * 100)}% · {roundCorrect}/{QUESTIONS_PER_ROUND}</p>

            <div className="mg-result-actions">
              <button
                type="button"
                className="mg-primary"
                onClick={() => startGame(selectedGame)}
              >
                {t.restart}
              </button>
              <button
                type="button"
                className="mg-secondary"
                onClick={() => {
                  setSelectedGame(null);
                  setQuestion(null);
                }}
              >
                {t.home}
              </button>
            </div>
          </section>
        )}

        <footer className="mg-footer">
          © Ranker Bhaiya · Aapki Mehnat, Hamari Strategy.
        </footer>
      </div>
    </div>
  );
}
