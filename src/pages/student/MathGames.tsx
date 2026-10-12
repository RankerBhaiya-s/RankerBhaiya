
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import "./MathGames.css";

type GameId = "flashcards" | "tables" | "arithmetic" | "calculator" | "quiz";
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
    submit: "Check answer",
    next: "Next question →",
    choose: "Choose an answer",
    correct: "Great job! That's correct.",
    wrong: "Not quite. Here's the correct answer:",
    timeUp: "Time's up!",
    completed: "Round complete!",
    accuracy: "Accuracy",
    playAgain: "Play another round",
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
    arithmeticDesc: "Build speed with basic calculations.",
    calculatorTitle: "Calculator Practice",
    calculatorDesc: "Solve mixed-operation challenges.",
    quizTitle: "Math Quiz",
    quizDesc: "Test your overall maths skills.",
    recent: "Recent rounds",
    empty: "Start a game to see your progress.",
    pointsLabel: "points",
    saved: "Scores save on this device.",
  },
  hi: {
    eyebrow: "सीखें • खेलें • बेहतर बनें",
    title: "मैथ गेम्स",
    subtitle: "मज़ेदार राउंड खेलकर अपनी गणित की प्रैक्टिस बेहतर बनाएं।",
    back: "← डैशबोर्ड",
    games: "अपना गेम चुनें",
    gamesSub: "एक चुनौती चुनें और खेलना शुरू करें।",
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
    submit: "जवाब जाँचें",
    next: "अगला प्रश्न →",
    choose: "एक जवाब चुनें",
    correct: "बहुत बढ़िया! जवाब सही है।",
    wrong: "जवाब सही नहीं है। सही उत्तर है:",
    timeUp: "समय पूरा!",
    completed: "राउंड पूरा हुआ!",
    accuracy: "सटीकता",
    playAgain: "एक और राउंड खेलें",
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
    empty: "अपनी प्रगति देखने के लिए गेम खेलें।",
    pointsLabel: "अंक",
    saved: "स्कोर इसी डिवाइस पर सेव होते हैं।",
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

function makeQuestion(game: GameId): Question {
  let a = randomInt(2, 20);
  let b = randomInt(2, 12);
  let answer = 0;
  let prompt = "";
  let hint = "";

  if (game === "tables") {
    a = randomInt(2, 20);
    b = randomInt(2, 12);
    answer = a * b;
    prompt = `${a} × ${b} = ?`;
    hint = `${a} groups of ${b}`;
  } else if (game === "arithmetic") {
    const subtract = Math.random() > 0.5;
    if (subtract && b > a) [a, b] = [b, a];
    answer = subtract ? a - b : a + b;
    prompt = `${a} ${subtract ? "−" : "+"} ${b} = ?`;
    hint = subtract ? "Find the difference." : "Combine both numbers.";
  } else if (game === "calculator") {
    const operation = randomInt(1, 3);
    if (operation === 1) {
      answer = a + b;
      prompt = `${a} + ${b} = ?`;
      hint = "Add both numbers.";
    } else if (operation === 2) {
      if (b > a) [a, b] = [b, a];
      answer = a - b;
      prompt = `${a} − ${b} = ?`;
      hint = "Subtract the smaller number.";
    } else {
      answer = a * b;
      prompt = `${a} × ${b} = ?`;
      hint = "Use multiplication.";
    }
  } else if (game === "flashcards") {
    const operation = randomInt(1, 3);
    if (operation === 1) {
      answer = a + b;
      prompt = `${a} + ${b} = ?`;
      hint = "Add tens and units.";
    } else if (operation === 2) {
      if (b > a) [a, b] = [b, a];
      answer = a - b;
      prompt = `${a} − ${b} = ?`;
      hint = "Find the difference.";
    } else {
      answer = a * b;
      prompt = `${a} × ${b} = ?`;
      hint = "Think of equal groups.";
    }
  } else {
    const operation = randomInt(1, 4);
    if (operation === 1) {
      answer = a + b;
      prompt = `What is ${a} + ${b}?`;
      hint = "Combine both numbers.";
    } else if (operation === 2) {
      if (b > a) [a, b] = [b, a];
      answer = a - b;
      prompt = `What is ${a} − ${b}?`;
      hint = "Find the difference.";
    } else if (operation === 3) {
      answer = a * b;
      prompt = `What is ${a} × ${b}?`;
      hint = "Use multiplication.";
    } else {
      a = randomInt(2, 12);
      answer = a;
      prompt = `${a * b} ÷ ${b} = ?`;
      hint = "Think of the related multiplication fact.";
    }
  }

  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const offset = randomInt(1, 10) * (Math.random() > 0.5 ? 1 : -1);
    if (answer + offset !== answer && answer + offset >= 0) wrong.add(answer + offset);
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
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [seconds, setSeconds] = useState(60);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [roundCorrect, setRoundCorrect] = useState(0);
  const [roundDone, setRoundDone] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const isPlaying = selectedGame !== null && !roundDone;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  useEffect(() => {
    if (seconds === 0 && selectedGame && !roundDone) {
      finishRound();
    }
    // finishRound is intentionally called only when the timer reaches zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  const gameTitle = useMemo(
    () => gameInfo.find((game) => game.id === selectedGame),
    [selectedGame],
  );

  function startGame(game: GameId) {
    setSelectedGame(game);
    setQuestion(makeQuestion(game));
    setQuestionNumber(1);
    setSeconds(60);
    setScore(0);
    setRoundCorrect(0);
    setAnswered(null);
    setRoundDone(false);
    setShowHint(false);
  }

  function finishRound(finalScore = score, finalCorrect = roundCorrect) {
    if (!selectedGame || roundDone) return;
    setRoundDone(true);
    const nextStats = {
      ...stats,
      played: stats.played + 1,
      correct: stats.correct + finalCorrect,
      best: {
        ...stats.best,
        [selectedGame]: Math.max(stats.best[selectedGame], finalScore),
      },
      recent: [
        {
          game: gameInfo.find((g) => g.id === selectedGame)?.titleKey || selectedGame,
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
      // Gameplay still works when local storage is unavailable.
    }
  }

  function answerQuestion(value: number) {
    if (answered !== null || roundDone || !question) return;
    setAnswered(value);
    if (value === question.answer) {
      const nextScore = score + 10;
      const nextCorrect = roundCorrect + 1;
      setScore(nextScore);
      setRoundCorrect(nextCorrect);
    }
  }

  function nextQuestion() {
    if (questionNumber >= 10) {
      finishRound();
      return;
    }
    if (selectedGame) setQuestion(makeQuestion(selectedGame));
    setQuestionNumber((value) => value + 1);
    setAnswered(null);
    setShowHint(false);
  }


  return (
    <div className={`math-games-page ${dark ? "mg-dark" : ""}`}>
      <div className="mg-shell">
        <header className="mg-topbar">
          <button className="mg-brand" onClick={() => navigate("/student/dashboard")} type="button">
            <span className="mg-logo">RB</span>
            <span>
              <strong>Ranker Bhaiya</strong>
              <small>Aapki Mehnat, Hamari Strategy.</small>
            </span>
          </button>
          <div className="mg-top-actions">
            <button className="mg-ghost" onClick={() => setHindi((v) => !v)} type="button">
              🌐 {t.language}
            </button>
            <button className="mg-ghost" onClick={() => navigate("/student/dashboard")} type="button">
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
              <div className="mg-stat"><span>🏆</span><small>{t.played}</small><strong>{stats.played}</strong></div>
              <div className="mg-stat"><span>✅</span><small>{t.score}</small><strong>{stats.correct}</strong></div>
              <div className="mg-stat"><span>⭐</span><small>{t.best}</small><strong>{Math.max(...GAME_IDS.map((id) => stats.best[id]))}</strong></div>
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
                    onClick={() => startGame(game.id)}
                  >
                    <span className="mg-game-icon">{game.icon}</span>
                    <span className="mg-game-copy">
                      <strong>{t[game.titleKey]}</strong>
                      <small>{t[game.descKey]}</small>
                    </span>
                    <span className="mg-game-arrow">↗</span>
                    <span className="mg-best-line">{t.best}: {stats.best[game.id]}</span>
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
                      <span className="mg-score-name">{t[entry.game as keyof typeof t] || entry.game}</span>
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

        {selectedGame && question && !roundDone && (
          <section className="mg-play-card">
            <div className="mg-play-header">
              <button type="button" className="mg-ghost" onClick={() => { setSelectedGame(null); setQuestion(null); }}>
                ← {t.home}
              </button>
              <span className={`mg-timer ${seconds <= 10 ? "urgent" : ""}`}>⏱ {seconds} {t.min}</span>
            </div>
            <div className="mg-progress-label">
              <span>{t.question} {questionNumber} {t.of} 10</span>
              <span>⭐ {t.points}: {score}</span>
            </div>
            <div className="mg-progress"><span style={{ width: `${questionNumber * 10}%` }} /></div>
            <div className="mg-question-area">
              <span className="mg-question-icon">{gameTitle?.icon}</span>
              <p className="mg-question-kicker">{selectedGame === "tables" ? t.tablePrompt : selectedGame === "flashcards" ? t.flashPrompt : selectedGame === "arithmetic" ? t.arithmeticPrompt : selectedGame === "calculator" ? t.calculatorPrompt : t.quizPrompt}</p>
              <h2>{question.prompt}</h2>
              <p className="mg-select-label">{t.choose}</p>
              <div className="mg-options">
                {question.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={answered !== null}
                    onClick={() => answerQuestion(option)}
                    className={`mg-option ${answered !== null && option === question.answer ? "is-correct" : ""} ${answered === option && option !== question.answer ? "is-wrong" : ""}`}
                  >
                    {option}
                    {answered !== null && option === question.answer && <span>✓</span>}
                    {answered === option && option !== question.answer && <span>×</span>}
                  </button>
                ))}
              </div>
              {answered !== null && (
                <div className={`mg-feedback ${answered === question.answer ? "good" : "bad"}`}>
                  <strong>{answered === question.answer ? t.correct : t.wrong}</strong>
                  {answered !== question.answer && <span>{question.answer}</span>}
                  <button type="button" onClick={nextQuestion}>{questionNumber >= 10 ? t.completed : t.next}</button>
                </div>
              )}
              <div className="mg-hint-wrap">
                <button type="button" className="mg-hint-button" onClick={() => setShowHint((v) => !v)}>
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
            <p>{t.accuracy}: {Math.round((roundCorrect / 10) * 100)}% · {roundCorrect}/10</p>
            <div className="mg-result-actions">
              <button type="button" className="mg-primary" onClick={() => startGame(selectedGame)}>{t.restart}</button>
              <button type="button" className="mg-secondary" onClick={() => { setSelectedGame(null); setQuestion(null); }}>{t.home}</button>
            </div>
          </section>
        )}

        <footer className="mg-footer">© Ranker Bhaiya · Aapki Mehnat, Hamari Strategy.</footer>
      </div>
    </div>
  );
}
