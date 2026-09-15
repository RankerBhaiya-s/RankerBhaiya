import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { LanguageToggle } from "../../components/LanguageToggle";
import { getDailyMindset } from "../../data/dailyMindsets";

export function StudentDashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [today, setToday] = useState(() => new Date());

  const menuRef = useRef<HTMLDivElement | null>(null);

  /* ===================================================
     LANGUAGE
  =================================================== */

  const language =
    i18n.resolvedLanguage === "hi"
      ? "hi"
      : i18n.resolvedLanguage === "hinglish"
        ? "hinglish"
        : "en";

  /* ===================================================
     DAILY MINDSET
  =================================================== */

  const mindset = getDailyMindset(today);

  const mindsetQuote =
    mindset?.[language] ??
    mindset?.en ??
    "";

  /* ===================================================
     UPDATE DATE AFTER MIDNIGHT
  =================================================== */

  useEffect(() => {
    const now = new Date();

    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);

    const timeout = window.setTimeout(() => {
      setToday(new Date());
    }, nextMidnight.getTime() - now.getTime() + 1000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [today]);

  /* ===================================================
     CLOSE MENU ON OUTSIDE CLICK
  =================================================== */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ===================================================
     STUDENT
  =================================================== */

  const studentName = useMemo(() => {
    return profile?.full_name?.trim() || "Student";
  }, [profile]);

  /* ===================================================
     DATE
  =================================================== */

  const formattedDate = useMemo(() => {
    const locale =
      language === "hi"
        ? "hi-IN"
        : "en-IN";

    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(today);
  }, [today, language]);

  /* ===================================================
     DAY OF YEAR
  =================================================== */

  const mindsetDay = useMemo(() => {
    const start = new Date(today.getFullYear(), 0, 0);

    const diff =
      today.getTime() -
      start.getTime() +
      (start.getTimezoneOffset() -
        today.getTimezoneOffset()) *
        60 *
        1000;

    const day = Math.floor(
      diff / (1000 * 60 * 60 * 24),
    );

    return Math.min(365, Math.max(1, day));
  }, [today]);

  /* ===================================================
     NAVIGATION
  =================================================== */

  const handleProfile = () => {
    setMenuOpen(false);
    navigate("/student/profile");
  };

  const handleLogout = async () => {
    setMenuOpen(false);

    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const handleFastRevision = () => {
    navigate("/student/quick-revision");
  };

  const handleCurrentAffairs = () => {
    navigate("/student/current-affairs");
  };

  const handleNewspaper = () => {
    navigate("/student/daily-newspaper");
  };

  const handleAskVidhya = () => {
    navigate("/student/ask");
  };

  const handleVocabulary = () => {
    navigate("/student/vocabulary");
  };

  const handleExamTips = () => {
    navigate("/student/exam-tips");
  };

  /* ===================================================
     NEW FEATURES
  =================================================== */

  const handleStudyPlanner = () => {
    navigate("/student/study-planner");
  };

  const handlePracticeQuestions = () => {
    navigate("/student/practice-questions");
  };

  const handleProgressTracker = () => {
    navigate("/student/progress");
  };

  const handleDailyChallenge = () => {
    navigate("/student/daily-challenge");
  };

  /* ===================================================
     EXAM BOOSTER TEXT
  =================================================== */

  const boosterText = {
    en: {
      eyebrow: "LEVEL UP",
      title: "Exam Booster",
      description:
        "Practice, test and learn to perform better in your exams.",
      soon: "Coming Soon",

      pyqTitle: "PYQ Practice",
      pyqDescription:
        "Practice previous year questions and understand real exam patterns.",
      pyqAction: "Practice PYQs",

      mockTitle: "Mock Test",
      mockDescription:
        "Test your preparation with exam-style questions and timed practice.",
      mockAction: "Start Test",

      tipsTitle: "Exam Tips",
      tipsDescription:
        "Get smart strategies, revision techniques and last-minute exam tips.",
      tipsAction: "Learn Tips",
    },

    hi: {
      eyebrow: "बेहतर तैयारी",
      title: "एग्जाम बूस्टर",
      description:
        "बेहतर परीक्षा प्रदर्शन के लिए अभ्यास, टेस्ट और स्मार्ट तैयारी करें।",
      soon: "जल्द आ रहा है",

      pyqTitle: "PYQ अभ्यास",
      pyqDescription:
        "पिछले वर्षों के प्रश्नों का अभ्यास करें और वास्तविक परीक्षा पैटर्न समझें।",
      pyqAction: "PYQ अभ्यास करें",

      mockTitle: "मॉक टेस्ट",
      mockDescription:
        "परीक्षा जैसे प्रश्नों और टाइम्ड प्रैक्टिस से अपनी तैयारी जांचें।",
      mockAction: "टेस्ट शुरू करें",

      tipsTitle: "एग्जाम टिप्स",
      tipsDescription:
        "स्मार्ट रणनीतियां, रिवीजन तकनीक और अंतिम समय की परीक्षा टिप्स पाएं।",
      tipsAction: "टिप्स देखें",
    },

    hinglish: {
      eyebrow: "LEVEL UP",
      title: "Exam Booster",
      description:
        "Better exam performance ke liye practice, test aur smart preparation karo.",
      soon: "Coming Soon",

      pyqTitle: "PYQ Practice",
      pyqDescription:
        "Previous year questions practice karo aur real exam pattern samjho.",
      pyqAction: "PYQs Practice Karo",

      mockTitle: "Mock Test",
      mockDescription:
        "Exam-style questions aur timed practice ke saath preparation test karo.",
      mockAction: "Test Start Karo",

      tipsTitle: "Exam Tips",
      tipsDescription:
        "Smart strategies, revision techniques aur last-minute exam tips pao.",
      tipsAction: "Tips Dekho",
    },
  }[language];

  /* ===================================================
     NEW OPTIONS TEXT
  =================================================== */

  const newFeaturesText = {
    en: {
      eyebrow: "STUDY SMART",
      title: "Your Preparation Tools",
      description:
        "Plan your study, practice questions, track progress and challenge yourself every day.",

      plannerTitle: "Study Planner",
      plannerDescription:
        "Plan your daily and weekly study goals and stay consistent with your preparation.",
      plannerAction: "Plan Your Study",

      practiceTitle: "Practice Questions",
      practiceDescription:
        "Solve topic-wise questions and strengthen your concepts with regular practice.",
      practiceAction: "Practice Now",

      progressTitle: "Progress Tracker",
      progressDescription:
        "Track your preparation, practice performance and improvement over time.",
      progressAction: "View Progress",

      challengeTitle: "Daily Challenge",
      challengeDescription:
        "Take a quick daily challenge, test your knowledge and build a winning streak.",
      challengeAction: "Take Challenge",
    },

    hi: {
      eyebrow: "स्मार्ट पढ़ाई",
      title: "आपके तैयारी टूल्स",
      description:
        "अपनी पढ़ाई प्लान करें, प्रश्नों का अभ्यास करें, प्रोग्रेस ट्रैक करें और रोज़ खुद को चैलेंज करें।",

      plannerTitle: "स्टडी प्लानर",
      plannerDescription:
        "अपनी दैनिक और साप्ताहिक पढ़ाई के लक्ष्य बनाएं और तैयारी में निरंतरता रखें।",
      plannerAction: "पढ़ाई प्लान करें",

      practiceTitle: "प्रैक्टिस प्रश्न",
      practiceDescription:
        "टॉपिक के अनुसार प्रश्न हल करें और नियमित अभ्यास से अपनी समझ मजबूत करें।",
      practiceAction: "अभ्यास करें",

      progressTitle: "प्रोग्रेस ट्रैकर",
      progressDescription:
        "अपनी तैयारी, अभ्यास प्रदर्शन और समय के साथ सुधार को ट्रैक करें।",
      progressAction: "प्रोग्रेस देखें",

      challengeTitle: "डेली चैलेंज",
      challengeDescription:
        "हर दिन एक छोटा चैलेंज लें, अपनी जानकारी जांचें और लगातार बेहतर बनें।",
      challengeAction: "चैलेंज लें",
    },

    hinglish: {
      eyebrow: "STUDY SMART",
      title: "Your Preparation Tools",
      description:
        "Apni study plan karo, questions practice karo, progress track karo aur daily khud ko challenge karo.",

      plannerTitle: "Study Planner",
      plannerDescription:
        "Daily aur weekly study goals plan karo aur preparation mein consistency maintain karo.",
      plannerAction: "Study Plan Karo",

      practiceTitle: "Practice Questions",
      practiceDescription:
        "Topic-wise questions solve karo aur regular practice se concepts strong karo.",
      practiceAction: "Practice Karo",

      progressTitle: "Progress Tracker",
      progressDescription:
        "Apni preparation, practice performance aur improvement ko time ke saath track karo.",
      progressAction: "Progress Dekho",

      challengeTitle: "Daily Challenge",
      challengeDescription:
        "Har din ek quick challenge lo, apni knowledge test karo aur winning streak banao.",
      challengeAction: "Challenge Lo",
    },
  }[language];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          {/* LOGO */}

          <button
            type="button"
            onClick={() => navigate("/student/dashboard")}
            className="group flex items-center gap-3"
          >
            <img
              src={`${import.meta.env.BASE_URL}favicon.png`}
              alt="Ranker Bhaiya"
              className="h-10 w-10 rounded-xl object-cover shadow-lg shadow-blue-500/20 transition group-hover:scale-105"
            />

            <div className="hidden text-left sm:block">
              <div className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Ranker <span className="text-yellow-500">Bhaiya</span>
              </div>

              <div className="text-[10px] font-medium tracking-wide text-slate-400">
                Aapki Mehnat&nbsp; · &nbsp;Hamari Strategy
              </div>
            </div>
          </button>

          {/* RIGHT SIDE */}

          <div className="flex items-center gap-2 sm:gap-3">

            <LanguageToggle />

            {/* THEME */}

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-10 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-sm shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
            >
              <span>
                {theme === "dark" ? "🌙" : "☀️"}
              </span>
            </button>

            {/* STUDENT */}

            <div className="hidden items-center gap-3 sm:flex">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white shadow-md shadow-blue-500/20">
                {studentName.charAt(0).toUpperCase()}
              </div>

              <div className="hidden text-left md:block">

                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {studentName}
                </p>

                <p className="text-[10px] text-slate-400">
                  {profile?.email ?? "Student"}
                </p>

              </div>
            </div>

            {/* MENU */}

            <div
              className="relative"
              ref={menuRef}
            >
              <button
                type="button"
                onClick={() =>
                  setMenuOpen((value) => !value)
                }
                aria-label={t("dashboard.openMenu")}
                aria-expanded={menuOpen}
                className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                ⋮
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">

                  <button
                    type="button"
                    onClick={handleProfile}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <span>👤</span>
                    {t("dashboard.menu.profile")}
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <span>↪</span>
                    {t("dashboard.menu.logout")}
                  </button>

                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* ===================================================
            TODAY'S MINDSET
        =================================================== */}

        <section className="group relative isolate overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_70px_-30px_rgba(37,99,235,0.25)] dark:border-slate-800 dark:bg-slate-900">

          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />

          <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />

          <div className="absolute right-1/4 top-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035] dark:opacity-[0.05]">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  "linear-gradient(#2563eb 1px, transparent 1px), linear-gradient(90deg, #2563eb 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

          <div className="relative grid min-h-[320px] items-center gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1fr_240px] lg:px-12">

            <div className="relative z-10">

              <div className="flex flex-wrap items-center gap-3">

                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-blue-600 backdrop-blur-sm dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400">

                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />

                  {t("dashboard.mindset.label")}

                </div>

                <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-500 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400">
                  {formattedDate}
                </span>

              </div>

              <div className="relative mt-7 max-w-4xl">

                <span className="pointer-events-none absolute -left-5 -top-12 select-none font-serif text-[110px] font-black leading-none text-blue-600/[0.07] dark:text-blue-400/[0.08] sm:-left-7 sm:-top-14 sm:text-[140px]">
                  “
                </span>

                <blockquote className="relative text-3xl font-black leading-[1.08] tracking-[-0.03em] text-slate-950 dark:text-white sm:text-4xl lg:text-5xl xl:text-[3.5rem]">
                  {mindsetQuote}
                </blockquote>

              </div>

              <div className="mt-7 flex items-center gap-3">

                <div className="h-px w-8 bg-blue-500/50" />

                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {t("dashboard.mindset.subtitle")}
                </p>

              </div>

              <div className="mt-6 flex items-center gap-3">

                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
                </div>

                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Daily Growth
                </span>

              </div>

            </div>

            {/* DESKTOP MINDSET COUNTER */}

            <div className="relative hidden h-56 items-center justify-center lg:flex">

              <div className="absolute h-48 w-48 rounded-full border border-blue-500/10" />
              <div className="absolute h-40 w-40 rounded-full border border-violet-500/10" />
              <div className="absolute h-32 w-32 rounded-full border border-cyan-500/10" />
              <div className="absolute h-28 w-28 rounded-full bg-blue-500/10 blur-2xl" />

              <div className="relative flex h-28 w-28 flex-col items-center justify-center rounded-full border border-white/70 bg-white/75 shadow-[0_15px_45px_-15px_rgba(37,99,235,0.35)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/75">

                <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {mindsetDay}
                </span>

                <span className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  / 365
                </span>

                <span className="mt-1 text-[8px] font-black uppercase tracking-[0.18em] text-blue-500">
                  Mindset
                </span>

              </div>

              <span className="absolute left-1 top-7 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_14px_rgba(59,130,246,0.8)]" />
              <span className="absolute bottom-7 right-4 h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.8)]" />
              <span className="absolute right-5 top-4 h-1 w-1 rounded-full bg-cyan-400" />
              <span className="absolute bottom-10 left-8 h-1 w-1 rounded-full bg-blue-400" />

            </div>

          </div>
        </section>

        {/* ===================================================
            WELCOME
        =================================================== */}

        <section className="relative mt-6 overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-7 text-white shadow-[0_20px_50px_-20px_rgba(37,99,235,0.45)] sm:px-10">

          <div className="absolute -right-10 -top-20 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 right-20 h-56 w-56 rounded-full bg-violet-300/10 blur-3xl" />

          <div className="relative z-10">

            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
              👋 {t("dashboard.welcomeBack")}
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {studentName}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              {t("dashboard.welcomeDescription")}
            </p>

          </div>

          <div className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 text-[100px] opacity-10 lg:block">
            🧠
          </div>

        </section>

        {/* ===================================================
            PRIMARY LEARNING
        =================================================== */}

        <section className="mt-10">

          <div className="grid gap-5 md:grid-cols-3">

            <DashboardCard
              icon="⚡"
              title={t("dashboard.fastRevision.title")}
              description={t("dashboard.fastRevision.description")}
              action={t("dashboard.fastRevision.action")}
              badge={t("dashboard.fastRevision.badge")}
              badgeClass="bg-violet-600"
              className="border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:border-violet-900/50 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-fuchsia-950/20"
              actionClass="text-violet-700 dark:text-violet-400"
              onClick={handleFastRevision}
            />

            <DashboardCard
              icon="📰"
              title={t("dashboard.currentAffairs.title")}
              description={t("dashboard.currentAffairs.description")}
              action={t("dashboard.currentAffairs.action")}
              badge={t("dashboard.currentAffairs.badge")}
              badgeClass="bg-emerald-600"
              className="border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-green-950/20"
              actionClass="text-emerald-700 dark:text-emerald-400"
              onClick={handleCurrentAffairs}
            />

            <DashboardCard
              icon="🗞️"
              title={t("dashboard.newspaper.title")}
              description={t("dashboard.newspaper.description")}
              action={t("dashboard.newspaper.action")}
              badge={t("dashboard.newspaper.badge")}
              badgeClass="bg-blue-600"
              className="border-blue-200 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 dark:border-blue-900/50 dark:from-blue-950/30 dark:via-sky-950/20 dark:to-indigo-950/30"
              actionClass="text-blue-700 dark:text-blue-400"
              onClick={handleNewspaper}
            />

          </div>
        </section>

        {/* ===================================================
            EXAM BOOSTER
        =================================================== */}

        <section className="mt-10">

          <div className="flex items-end justify-between gap-4">

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <span className="text-xl">
                  🎯
                </span>

                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                  {boosterText.eyebrow}
                </p>

                <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400">
                  {boosterText.soon}
                </span>

              </div>

              <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {boosterText.title}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {boosterText.description}
              </p>

            </div>

          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-3">

            {/* PYQ */}

            <button
              type="button"
              onClick={() => undefined}
              className="group relative overflow-hidden rounded-[1.5rem] border border-blue-200 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-blue-900/50 dark:from-blue-950/30 dark:via-sky-950/20 dark:to-indigo-950/30"
            >

              <div className="relative z-10 flex items-start justify-between gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-slate-900/70">
                  🎯
                </div>

                <span className="rounded-full bg-blue-600 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-white">
                  {boosterText.soon}
                </span>

              </div>

              <h3 className="relative z-10 mt-5 text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {boosterText.pyqTitle}
              </h3>

              <p className="relative z-10 mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {boosterText.pyqDescription}
              </p>

              <div className="relative z-10 mt-5 flex items-center gap-2 text-sm font-black text-blue-700 dark:text-blue-400">
                {boosterText.pyqAction}

                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </div>

              <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-blue-500/10 transition duration-500 group-hover:scale-150" />

            </button>

            {/* MOCK TEST */}

            <button
              type="button"
              onClick={() => undefined}
              className="group relative overflow-hidden rounded-[1.5rem] border border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-violet-900/50 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-fuchsia-950/30"
            >

              <div className="relative z-10 flex items-start justify-between gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-slate-900/70">
                  📝
                </div>

                <span className="rounded-full bg-violet-600 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-white">
                  {boosterText.soon}
                </span>

              </div>

              <h3 className="relative z-10 mt-5 text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {boosterText.mockTitle}
              </h3>

              <p className="relative z-10 mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {boosterText.mockDescription}
              </p>

              <div className="relative z-10 mt-5 flex items-center gap-2 text-sm font-black text-violet-700 dark:text-violet-400">
                {boosterText.mockAction}

                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </div>

              <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-violet-500/10 transition duration-500 group-hover:scale-150" />

            </button>

            {/* EXAM TIPS */}

            <button
              type="button"
              onClick={handleExamTips}
              className="group relative overflow-hidden rounded-[1.5rem] border border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-orange-900/50 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-yellow-950/30"
            >

              <div className="relative z-10 flex items-start justify-between gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-slate-900/70">
                  🔥
                </div>

              </div>

              <h3 className="relative z-10 mt-5 text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {boosterText.tipsTitle}
              </h3>

              <p className="relative z-10 mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                {boosterText.tipsDescription}
              </p>

              <div className="relative z-10 mt-5 flex items-center gap-2 text-sm font-black text-orange-700 dark:text-orange-400">
                {boosterText.tipsAction}

                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </div>

              <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-orange-500/10 transition duration-500 group-hover:scale-150" />

            </button>

          </div>
        </section>

        {/* ===================================================
            NEW PREPARATION TOOLS
        =================================================== */}

        <section className="mt-10">

          <div>

            <div className="flex flex-wrap items-center gap-2">

              <span className="text-xl">
                🚀
              </span>

              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                {newFeaturesText.eyebrow}
              </p>

            </div>

            <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {newFeaturesText.title}
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              {newFeaturesText.description}
            </p>

          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {/* STUDY PLANNER */}

            <FeatureCard
              icon="📅"
              title={newFeaturesText.plannerTitle}
              description={newFeaturesText.plannerDescription}
              action={newFeaturesText.plannerAction}
              onClick={handleStudyPlanner}
              className="border-cyan-200 bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 dark:border-cyan-900/50 dark:from-cyan-950/30 dark:via-sky-950/20 dark:to-blue-950/30"
              actionClass="text-cyan-700 dark:text-cyan-400"
              iconClass="bg-cyan-100 dark:bg-cyan-500/10"
            />

            {/* PRACTICE QUESTIONS */}

            <FeatureCard
              icon="📝"
              title={newFeaturesText.practiceTitle}
              description={newFeaturesText.practiceDescription}
              action={newFeaturesText.practiceAction}
              onClick={handlePracticeQuestions}
              className="border-rose-200 bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 dark:border-rose-900/50 dark:from-rose-950/30 dark:via-pink-950/20 dark:to-orange-950/20"
              actionClass="text-rose-700 dark:text-rose-400"
              iconClass="bg-rose-100 dark:bg-rose-500/10"
            />

            {/* PROGRESS TRACKER */}

            <FeatureCard
              icon="📊"
              title={newFeaturesText.progressTitle}
              description={newFeaturesText.progressDescription}
              action={newFeaturesText.progressAction}
              onClick={handleProgressTracker}
              className="border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-green-950/20"
              actionClass="text-emerald-700 dark:text-emerald-400"
              iconClass="bg-emerald-100 dark:bg-emerald-500/10"
            />

            {/* DAILY CHALLENGE */}

            <FeatureCard
              icon="🔥"
              title={newFeaturesText.challengeTitle}
              description={newFeaturesText.challengeDescription}
              action={newFeaturesText.challengeAction}
              onClick={handleDailyChallenge}
              className="border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:border-amber-900/50 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-orange-950/20"
              actionClass="text-amber-700 dark:text-amber-400"
              iconClass="bg-amber-100 dark:bg-amber-500/10"
            />

          </div>
        </section>

        {/* ===================================================
            SECONDARY LEARNING
        =================================================== */}

        <section className="mt-10">

          <div className="grid gap-5 md:grid-cols-3">

            <DashboardCard
              icon="🤖"
              title={t("dashboard.askVidhya.title")}
              description={t("dashboard.askVidhya.description")}
              action={t("dashboard.askVidhya.action")}
              badge={t("dashboard.askVidhya.badge")}
              badgeClass="bg-blue-600"
              className="border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:border-blue-900/50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-violet-950/30"
              actionClass="text-blue-700 dark:text-blue-400"
              onClick={handleAskVidhya}
            />

            <DashboardCard
              icon="📖"
              title={t("dashboard.vocabulary.title")}
              description={t("dashboard.vocabulary.description")}
              action={t("dashboard.vocabulary.action")}
              badge={t("dashboard.vocabulary.badge")}
              badgeClass="bg-violet-600"
              className="border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 dark:border-violet-900/50 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-indigo-950/20"
              actionClass="text-violet-700 dark:text-violet-400"
              onClick={handleVocabulary}
            />

            <DashboardCard
              icon="▶️"
              title={t("dashboard.videos.title")}
              description={t("dashboard.videos.description")}
              action={t("dashboard.videos.action")}
              badge={t("dashboard.videos.badge")}
              badgeClass="bg-slate-500"
              className="border-slate-200 bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 dark:border-slate-700 dark:from-slate-900 dark:via-blue-950/20 dark:to-sky-950/20"
              actionClass="text-slate-600 dark:text-slate-300"
              onClick={() => undefined}
            />

          </div>
        </section>

      </main>

      {/* ===================================================
          FOOTER
      =================================================== */}

      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">

        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">

          <div className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
            Ranker <span className="text-yellow-500">Bhaiya</span>
          </div>

          <p className="text-center text-xs text-slate-400 sm:text-right">
            {t("dashboard.footer.tagline")}
          </p>

        </div>
      </footer>

    </div>
  );
}

/* =====================================================
   FEATURE CARD
===================================================== */

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  action: string;
  className?: string;
  actionClass?: string;
  iconClass?: string;
  onClick?: () => void;
}

function FeatureCard({
  icon,
  title,
  description,
  action,
  className = "",
  actionClass = "",
  iconClass = "",
  onClick,
}: FeatureCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-[1.5rem] border p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6 ${className}`}
    >

      <div className="relative z-10">

        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-sm ${iconClass}`}
        >
          {icon}
        </div>

        <h3 className="mt-5 text-lg font-black tracking-tight text-slate-900 dark:text-white">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {description}
        </p>

        <div
          className={`mt-5 flex items-center gap-2 text-sm font-black ${actionClass}`}
        >
          {action}

          <span className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </div>

      </div>

      <div className="absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-white/30 transition duration-500 group-hover:scale-150 dark:bg-white/5" />

    </button>
  );
}

/* =====================================================
   DASHBOARD CARD
===================================================== */

interface DashboardCardProps {
  icon: string;
  title: string;
  description: string;
  action: string;
  badge?: string;
  badgeClass?: string;
  className?: string;
  actionClass?: string;
  onClick?: () => void;
}

function DashboardCard({
  icon,
  title,
  description,
  action,
  badge,
  badgeClass = "",
  className = "",
  actionClass = "",
  onClick,
}: DashboardCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-[1.5rem] border p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-7 ${className}`}
    >

      <div className="relative z-10 flex items-start justify-between gap-4">

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-3xl shadow-sm dark:bg-slate-900/60">
          {icon}
        </div>

        {badge && (
          <span
            className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white ${badgeClass}`}
          >
            {badge}
          </span>
        )}

      </div>

      <h3 className="relative z-10 mt-6 text-xl font-black tracking-tight text-slate-900 dark:text-white">
        {title}
      </h3>

      <p className="relative z-10 mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
        {description}
      </p>

      <span
        className={`relative z-10 mt-5 inline-flex items-center gap-2 text-sm font-black ${actionClass}`}
      >
        {action}

        <span className="transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </span>

      <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/20 transition duration-500 group-hover:scale-150 dark:bg-white/5" />

    </button>
  );
}

export default StudentDashboard;
