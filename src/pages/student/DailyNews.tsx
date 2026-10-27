
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

type MCQ = {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
};

type DailyNewsItem = {
  id: string;
  affair_date: string;
  serial_no: number;
  title: string;
  why_in_news: string | null;
  key_facts: string | null;
  exam_point: string | null;
  static_gk: string | null;
  mcqs: MCQ[];
  category: string | null;
  title_hi: string | null;
  why_in_news_hi: string | null;
  key_facts_hi: string | null;
  exam_point_hi: string | null;
  static_gk_hi: string | null;
};

const CATEGORIES = [
  "All",
  "National",
  "International",
  "Economy",
  "Science & Technology",
  "Environment",
  "Defence",
  "Sports",
  "Awards",
  "Appointments",
  "Government Schemes",
  "Reports & Index",
  "Important Days",
  "Other",
];

const CATEGORY_HI: Record<string, string> = {
  All: "सभी",
  National: "राष्ट्रीय",
  International: "अंतरराष्ट्रीय",
  Economy: "अर्थव्यवस्था",
  "Science & Technology": "विज्ञान और तकनीक",
  Environment: "पर्यावरण",
  Defence: "रक्षा",
  Sports: "खेल",
  Awards: "पुरस्कार",
  Appointments: "नियुक्तियाँ",
  "Government Schemes": "सरकारी योजनाएँ",
  "Reports & Index": "रिपोर्ट और सूचकांक",
  "Important Days": "महत्वपूर्ण दिवस",
  Other: "अन्य",
};

function normalizeMcqs(value: unknown): MCQ[] {
  let parsed = value;

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item) => ({
      question:
        typeof item.question === "string" ? item.question : "",
      options: Array.isArray(item.options)
        ? item.options.filter(
            (option): option is string =>
              typeof option === "string",
          )
        : [],
      answer: typeof item.answer === "string" ? item.answer : "",
      explanation:
        typeof item.explanation === "string"
          ? item.explanation
          : undefined,
    }))
    .filter(
      (item) =>
        item.question.length > 0 &&
        item.options.length > 0 &&
        item.answer.length > 0,
    );
}

function formatDate(date: string, isHindi: boolean): string {
  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat(isHindi ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function getDisplayText(
  english: string | null,
  hindi: string | null,
  isHindi: boolean,
): string {
  if (isHindi && hindi?.trim()) return hindi;
  return english?.trim() || "";
}

export default function DailyNews() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();

  const isHindi = i18n.language?.toLowerCase().startsWith("hi") ?? false;

  const [news, setNews] = useState<DailyNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedNews, setExpandedNews] = useState<string | null>(null);
  const [expandedMcqs, setExpandedMcqs] = useState<string[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});

  const t = useCallback(
    (english: string, hindi: string) =>
      isHindi ? hindi : english,
    [isHindi],
  );

  useEffect(() => {
    document.title = t(
      "Daily News | Ranker Bhaiya",
      "डेली न्यूज़ | Ranker Bhaiya",
    );
  }, [t]);

  const loadNews = useCallback(
    async (isRefresh = false) => {
      if (!user) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const { data, error: fetchError } = await supabase
          .from("current_affairs")
          .select(`
            id,
            affair_date,
            serial_no,
            title,
            why_in_news,
            key_facts,
            exam_point,
            static_gk,
            mcqs,
            category,
            title_hi,
            why_in_news_hi,
            key_facts_hi,
            exam_point_hi,
            static_gk_hi
          `)
          .eq("published", true)
          .order("affair_date", { ascending: false })
          .order("serial_no", { ascending: true })
          .limit(100);

        if (fetchError) throw fetchError;

        const rows: DailyNewsItem[] = (data ?? []).map((row) => ({
          id: row.id,
          affair_date: row.affair_date,
          serial_no: row.serial_no,
          title: row.title,
          why_in_news: row.why_in_news,
          key_facts: row.key_facts,
          exam_point: row.exam_point,
          static_gk: row.static_gk,
          mcqs: normalizeMcqs(row.mcqs),
          category: row.category,
          title_hi: row.title_hi,
          why_in_news_hi: row.why_in_news_hi,
          key_facts_hi: row.key_facts_hi,
          exam_point_hi: row.exam_point_hi,
          static_gk_hi: row.static_gk_hi,
        }));

        setNews(rows);
      } catch (err) {
        console.error("Daily News loading error:", err);
        setError(
          t(
            "News could not be loaded. Please try again.",
            "न्यूज़ लोड नहीं हो सकी। कृपया दोबारा प्रयास करें।",
          ),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, t],
  );

  useEffect(() => {
    if (!user) {
      navigate("/student/login", { replace: true });
      return;
    }

    void loadNews();
  }, [user, navigate, loadNews]);

  const availableCategories = useMemo(() => {
    const categories = new Set(
      news
        .map((item) => item.category?.trim())
        .filter((category): category is string => Boolean(category)),
    );

    return CATEGORIES.filter(
      (category) => category === "All" || categories.has(category),
    );
  }, [news]);

  const latestDate = news[0]?.affair_date ?? null;

  const filteredNews = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return news.filter((item) => {
      const title = getDisplayText(
        item.title,
        item.title_hi,
        isHindi,
      );
      const why = getDisplayText(
        item.why_in_news,
        item.why_in_news_hi,
        isHindi,
      );
      const facts = getDisplayText(
        item.key_facts,
        item.key_facts_hi,
        isHindi,
      );
      const examPoint = getDisplayText(
        item.exam_point,
        item.exam_point_hi,
        isHindi,
      );

      const matchesSearch =
        !normalizedSearch ||
        [
          title,
          why,
          facts,
          examPoint,
          item.category ?? "",
          item.title,
          item.why_in_news ?? "",
        ].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );

      const matchesCategory =
        activeCategory === "All" ||
        item.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [news, search, activeCategory, isHindi]);

  function toggleNews(id: string) {
    setExpandedNews((current) => (current === id ? null : id));
  }

  function toggleMcq(id: string) {
    setExpandedMcqs((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function selectAnswer(mcqId: string, answer: string) {
    setSelectedAnswers((current) => ({
      ...current,
      [mcqId]: answer,
    }));
  }

  function isCorrectAnswer(mcq: MCQ, selected: string): boolean {
    const correct = mcq.answer.trim().toLowerCase();
    const chosen = selected.trim().toLowerCase();

    if (correct === chosen) return true;

    const correctIndex = Number(correct);
    if (
      Number.isInteger(correctIndex) &&
      correctIndex >= 0 &&
      correctIndex < mcq.options.length
    ) {
      if (mcq.options[correctIndex].trim().toLowerCase() === chosen) {
        return true;
      }
    }

    const optionLetter = chosen.match(/^([a-d])[\s).:-]?$/);
    if (optionLetter) {
      const index = optionLetter[1].charCodeAt(0) - 97;
      if (mcq.options[index]?.trim().toLowerCase() === correct) {
        return true;
      }
    }

    return false;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-40 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="mt-8 h-10 w-2/3 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-800 p-6 text-white shadow-xl sm:p-9">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <button
                type="button"
                onClick={() => navigate("/student/dashboard")}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-blue-50 transition hover:bg-white/20"
              >
                <span aria-hidden="true">←</span>
                {t("Back to Dashboard", "डैशबोर्ड पर जाएँ")}
              </button>

              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl">
                  📰
                </span>
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
                  Ranker Bhaiya
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {t("Daily News", "डेली न्यूज़")}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                {t(
                  "Stay informed with exam-focused news, important facts and practice questions.",
                  "परीक्षा के लिए उपयोगी खबरें, महत्वपूर्ण तथ्य और अभ्यास प्रश्न एक ही जगह पढ़ें।",
                )}
              </p>
            </div>

            <div className="shrink-0 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:min-w-48">
              <p className="text-sm text-blue-100">
                {t("Available news", "उपलब्ध खबरें")}
              </p>
              <p className="mt-1 text-4xl font-black">
                {news.length}
              </p>
              <p className="mt-1 text-xs text-blue-200">
                {t("Published articles", "प्रकाशित खबरें")}
              </p>
            </div>
          </div>
        </section>

        {/* Date and refresh */}
        <section className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("Latest available date", "नवीनतम उपलब्ध तारीख")}
            </p>
            <p className="mt-1 font-bold">
              {latestDate
                ? formatDate(latestDate, isHindi)
                : t("No published news yet", "अभी कोई खबर प्रकाशित नहीं है")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadNews(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span aria-hidden="true">{refreshing ? "⏳" : "↻"}</span>
            {refreshing
              ? t("Refreshing...", "रिफ्रेश हो रहा है...")
              : t("Refresh news", "न्यूज़ रिफ्रेश करें")}
          </button>
        </section>

        {/* Search and filters */}
        <section className="mt-6 space-y-4">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
              🔎
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t(
                "Search news, facts or exam points...",
                "खबर, तथ्य या परीक्षा बिंदु खोजें...",
              )}
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {availableCategories.map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeCategory === category
                    ? "bg-blue-700 text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {isHindi
                  ? CATEGORY_HI[category] ?? category
                  : category}
              </button>
            ))}
          </div>
        </section>

        {/* Error */}
        {error && (
          <section
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          >
            <p className="font-bold">{error}</p>
            <button
              type="button"
              onClick={() => void loadNews(true)}
              className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              {t("Try again", "दोबारा प्रयास करें")}
            </button>
          </section>
        )}

        {/* Results */}
        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {t("NEWS DESK", "न्यूज़ डेस्क")}
              </p>
              <h2 className="mt-1 text-2xl font-black">
                {t("Latest updates", "ताज़ा अपडेट")}
              </h2>
            </div>
            <span className="rounded-full bg-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {filteredNews.length} {t("results", "परिणाम")}
            </span>
          </div>

          {!error && filteredNews.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="text-5xl">📰</div>
              <h3 className="mt-4 text-xl font-bold">
                {news.length === 0
                  ? t("News is being prepared", "खबरें तैयार की जा रही हैं")
                  : t("No matching news found", "कोई मिलती-जुलती खबर नहीं मिली")}
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
                {news.length === 0
                  ? t(
                      "No published items are available in the current affairs table yet. Please check again after news has been added and published.",
                      "अभी current affairs टेबल में कोई प्रकाशित खबर उपलब्ध नहीं है। खबरें जोड़कर प्रकाशित करने के बाद फिर से देखें।",
                    )
                  : t(
                      "Try another search term or choose a different category.",
                      "दूसरा शब्द खोजें या कोई अन्य श्रेणी चुनें।",
                    )}
              </p>
              {search || activeCategory !== "All" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActiveCategory("All");
                  }}
                  className="mt-5 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800"
                >
                  {t("Clear filters", "फ़िल्टर हटाएँ")}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-5">
              {filteredNews.map((item, index) => {
                const title = getDisplayText(
                  item.title,
                  item.title_hi,
                  isHindi,
                );
                const why = getDisplayText(
                  item.why_in_news,
                  item.why_in_news_hi,
                  isHindi,
                );
                const facts = getDisplayText(
                  item.key_facts,
                  item.key_facts_hi,
                  isHindi,
                );
                const examPoint = getDisplayText(
                  item.exam_point,
                  item.exam_point_hi,
                  isHindi,
                );
                const staticGk = getDisplayText(
                  item.static_gk,
                  item.static_gk_hi,
                  isHindi,
                );
                const isExpanded = expandedNews === item.id;

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="p-5 sm:p-7">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                          {item.category
                            ? isHindi
                              ? CATEGORY_HI[item.category] ?? item.category
                              : item.category
                            : t("General", "सामान्य")}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(item.affair_date, isHindi)}
                        </span>
                        <span className="ml-auto text-xs font-semibold text-slate-400">
                          #{index + 1}
                        </span>
                      </div>

                      <h3 className="mt-4 text-xl font-extrabold leading-8 tracking-tight sm:text-2xl">
                        {title}
                      </h3>

                      {why && (
                        <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {t("Why in news?", "चर्चा में क्यों?")}
                          </p>
                          <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
                            {why}
                          </p>
                        </div>
                      )}

                      {facts && (
                        <div className="mt-5">
                          <p className="mb-2 flex items-center gap-2 text-sm font-extrabold">
                            <span>📌</span>
                            {t("Important facts", "महत्वपूर्ण तथ्य")}
                          </p>
                          <p className="whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
                            {facts}
                          </p>
                        </div>
                      )}

                      {examPoint && (
                        <div className="mt-4 rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-4 dark:bg-amber-950/30">
                          <p className="mb-1 text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-200">
                            {t("Exam point", "परीक्षा बिंदु")}
                          </p>
                          <p className="whitespace-pre-line text-sm leading-7 text-amber-950 dark:text-amber-100">
                            {examPoint}
                          </p>
                        </div>
                      )}

                      {isExpanded && staticGk && (
                        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                          <p className="mb-1 text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-200">
                            {t("Static GK", "स्थिर सामान्य ज्ञान")}
                          </p>
                          <p className="whitespace-pre-line text-sm leading-7 text-emerald-950 dark:text-emerald-100">
                            {staticGk}
                          </p>
                        </div>
                      )}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => toggleNews(item.id)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                          {isExpanded
                            ? t("Show less", "कम दिखाएँ")
                            : t("More details", "और जानकारी")}
                          <span aria-hidden="true">
                            {isExpanded ? "↑" : "↓"}
                          </span>
                        </button>

                        {item.mcqs.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleMcq(item.id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
                          >
                            <span>✍️</span>
                            {expandedMcqs.includes(item.id)
                              ? t("Hide MCQs", "MCQ छिपाएँ")
                              : `${t("Practice MCQs", "MCQ अभ्यास")} (${item.mcqs.length})`}
                          </button>
                        )}
                      </div>

                      {expandedMcqs.includes(item.id) &&
                        item.mcqs.length > 0 && (
                          <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
                            <h4 className="mb-4 text-lg font-extrabold">
                              {t("Test your knowledge", "अपना ज्ञान जाँचें")}
                            </h4>

                            <div className="space-y-5">
                              {item.mcqs.map((mcq, mcqIndex) => {
                                const mcqId = `${item.id}-${mcqIndex}`;
                                const selected = selectedAnswers[mcqId];
                                const answered = Boolean(selected);
                                const correct = selected
                                  ? isCorrectAnswer(mcq, selected)
                                  : false;

                                return (
                                  <div
                                    key={mcqId}
                                    className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700 sm:p-5"
                                  >
                                    <p className="font-bold leading-7">
                                      <span className="mr-2 text-blue-700 dark:text-blue-300">
                                        Q{mcqIndex + 1}.
                                      </span>
                                      {mcq.question}
                                    </p>

                                    <div className="mt-4 grid gap-2">
                                      {mcq.options.map((option, optionIndex) => {
                                        const isSelected = selected === option;
                                        const isRightOption = answered &&
                                          isCorrectAnswer(mcq, option);

                                        let optionStyle =
                                          "border-slate-200 hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-800";

                                        if (answered && isRightOption) {
                                          optionStyle =
                                            "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100";
                                        } else if (isSelected && !correct) {
                                          optionStyle =
                                            "border-red-400 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100";
                                        }

                                        return (
                                          <button
                                            key={`${mcqId}-${optionIndex}`}
                                            type="button"
                                            disabled={answered}
                                            onClick={() => selectAnswer(mcqId, option)}
                                            className={`flex items-start gap-3 rounded-xl border p-3 text-left text-sm leading-6 transition disabled:cursor-default ${optionStyle}`}
                                          >
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold dark:bg-slate-800">
                                              {String.fromCharCode(65 + optionIndex)}
                                            </span>
                                            <span>{option}</span>
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {answered && (
                                      <div
                                        className={`mt-4 rounded-xl p-3 text-sm leading-6 ${
                                          correct
                                            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                                            : "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200"
                                        }`}
                                      >
                                        <p className="font-bold">
                                          {correct
                                            ? t("Correct answer!", "सही उत्तर!")
                                            : t("Not quite. Review the highlighted answer.", "उत्तर सही नहीं है। हाइलाइट किया गया उत्तर देखें।")}
                                        </p>
                                        {mcq.explanation && (
                                          <p className="mt-1">{mcq.explanation}</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="font-extrabold text-blue-800 dark:text-blue-300">
            Ranker Bhaiya
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {t(
              "Learn smarter. Prepare with confidence.",
              "स्मार्ट तरीके से सीखें। आत्मविश्वास के साथ तैयारी करें।",
            )}
          </p>
        </footer>
      </div>
    </main>
  );
}

