
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../../lib/supabase";

type MCQ = {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
};

type RSSNewsItem = {
  id: string;
  news_date: string;
  source_name: string;
  source_url: string;
  published_at: string | null;
  title: string;
  title_hi: string;
  summary: string;
  summary_hi: string;
  key_facts: string;
  key_facts_hi: string;
  exam_point: string;
  exam_point_hi: string;
  mcqs: MCQ[];
  category: string;
  language: string;
};

const CATEGORY_HI: Record<string, string> = {
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
      question: typeof item.question === "string" ? item.question : "",
      options: Array.isArray(item.options)
        ? item.options.filter(
            (option): option is string => typeof option === "string",
          )
        : [],
      answer: typeof item.answer === "string" ? item.answer : "",
      explanation:
        typeof item.explanation === "string" ? item.explanation : "",
    }))
    .filter(
      (item) =>
        item.question.trim() &&
        item.options.length > 0 &&
        item.answer.trim(),
    );
}

function formatDate(value: string, isHindi: boolean) {
  if (!value) return "—";

  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat(isHindi ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function displayText(
  english: string | null | undefined,
  hindi: string | null | undefined,
  isHindi: boolean,
) {
  if (isHindi && hindi?.trim()) return hindi;
  return english?.trim() || "";
}

function isCorrectAnswer(mcq: MCQ, selected: string) {
  const answer = mcq.answer.trim().toLowerCase();
  const chosen = selected.trim().toLowerCase();

  if (!answer || !chosen) return false;

  // Answer is the exact option text.
  if (answer === chosen) return true;

  // Answer is a zero-based option index.
  if (/^\d+$/.test(answer)) {
    const index = Number(answer);

    if (mcq.options[index]?.trim().toLowerCase() === chosen) {
      return true;
    }
  }

  // Answer is A, B, C, D or A), B), etc.
  const letterMatch = answer.match(/^([a-d])(?:[\s).:-]|$)/);

  if (letterMatch) {
    const index = letterMatch[1].charCodeAt(0) - 97;

    if (mcq.options[index]?.trim().toLowerCase() === chosen) {
      return true;
    }
  }

  // Answer is an option number from 1 to 4.
  if (/^[1-4]$/.test(answer)) {
    const index = Number(answer) - 1;

    if (mcq.options[index]?.trim().toLowerCase() === chosen) {
      return true;
    }
  }

  return false;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unknown database error";
}

export default function RSSDailyNews() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const isHindi = i18n.language?.toLowerCase().startsWith("hi") ?? false;

  const [news, setNews] = useState<RSSNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedNews, setExpandedNews] = useState<string[]>([]);
  const [expandedMcqs, setExpandedMcqs] = useState<string[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});

  const t = useCallback(
    (english: string, hindi: string) => (isHindi ? hindi : english),
    [isHindi],
  );

  useEffect(() => {
    document.title = t(
      "Trending News | Ranker Bhaiya",
      "ट्रेंडिंग न्यूज़ | Ranker Bhaiya",
    );
  }, [t]);

  // Load published news.
  // Authentication is handled by the application's protected route.
  const loadNews = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const { data, error: fetchError } = await supabase
          .from("daily_news")
          .select(`
            id,
            news_date,
            source_name,
            source_url,
            published_at,
            title,
            title_hi,
            summary,
            summary_hi,
            key_facts,
            key_facts_hi,
            exam_point,
            exam_point_hi,
            mcqs,
            category,
            language
          `)
          .eq("published", true)
          .order("news_date", { ascending: false })
          .order("published_at", { ascending: false })
          .limit(100);

        if (fetchError) {
          throw fetchError;
        }

        const rows: RSSNewsItem[] = (data ?? []).map((row) => ({
          id: row.id,
          news_date: row.news_date ?? "",
          source_name: row.source_name ?? "",
          source_url: row.source_url ?? "",
          published_at: row.published_at ?? null,
          title: row.title ?? "",
          title_hi: row.title_hi ?? "",
          summary: row.summary ?? "",
          summary_hi: row.summary_hi ?? "",
          key_facts: row.key_facts ?? "",
          key_facts_hi: row.key_facts_hi ?? "",
          exam_point: row.exam_point ?? "",
          exam_point_hi: row.exam_point_hi ?? "",
          mcqs: normalizeMcqs(row.mcqs),
          category: row.category ?? "Other",
          language: row.language ?? "english",
        }));

        setNews(rows);
      } catch (err) {
        console.error("Trending News loading error:", err);

        const message = getErrorMessage(err);

        setError(
          `${t(
            "News could not be loaded.",
            "न्यूज़ लोड नहीं हो सकी।",
          )} ${message}`,
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const availableCategories = useMemo(() => {
    const categories = new Set(
      news
        .map((item) => item.category?.trim())
        .filter((item): item is string => Boolean(item)),
    );

    return CATEGORIES.filter(
      (item) => item === "All" || categories.has(item),
    );
  }, [news]);

  const filteredNews = useMemo(() => {
    const query = search.trim().toLowerCase();

    return news.filter((item) => {
      const searchable = [
        item.title,
        item.title_hi,
        item.summary,
        item.summary_hi,
        item.key_facts,
        item.key_facts_hi,
        item.exam_point,
        item.exam_point_hi,
        item.source_name,
        item.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);

      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [news, search, activeCategory]);

  function toggleNews(id: string) {
    setExpandedNews((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }

  function toggleMcqs(id: string) {
    setExpandedMcqs((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  }

  function selectAnswer(mcqId: string, answer: string) {
    setSelectedAnswers((previous) => ({
      ...previous,
      [mcqId]: answer,
    }));
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

  const latestDate = news[0]?.news_date ?? null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* HERO SECTION */}
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
                {t("Trending News", "ट्रेंडिंग न्यूज़")}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                {t(
                  "Stay updated with important news, key facts and exam-focused practice questions.",
                  "महत्वपूर्ण खबरों, मुख्य तथ्यों और परीक्षा उपयोगी अभ्यास प्रश्नों से अपडेट रहें।",
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

        {/* DATE AND REFRESH */}
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
            <span aria-hidden="true">
              {refreshing ? "⏳" : "↻"}
            </span>

            {refreshing
              ? t("Refreshing...", "रिफ्रेश हो रहा है...")
              : t("Refresh news", "न्यूज़ रिफ्रेश करें")}
          </button>
        </section>

        {/* SEARCH */}
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

          {/* CATEGORY FILTERS */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {availableCategories.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setActiveCategory(item)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeCategory === item
                    ? "bg-blue-700 text-white shadow-md"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {isHindi && item !== "All"
                  ? CATEGORY_HI[item] ?? item
                  : item === "All"
                    ? t("All", "सभी")
                    : item}
              </button>
            ))}
          </div>
        </section>

        {/* ERROR MESSAGE */}
        {error && (
          <section
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          >
            <p className="font-bold">
              {t("Loading error", "लोडिंग में समस्या")}
            </p>

            <p className="mt-2 break-words text-sm leading-6">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadNews(true)}
              disabled={refreshing}
              className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {t("Try again", "दोबारा प्रयास करें")}
            </button>
          </section>
        )}

        {/* NEWS LIST */}
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
                      "No published news is available yet. Please check again later.",
                      "अभी कोई खबर प्रकाशित नहीं है। कृपया बाद में फिर देखें।",
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
                const title = displayText(
                  item.title,
                  item.title_hi,
                  isHindi,
                );

                const summary = displayText(
                  item.summary,
                  item.summary_hi,
                  isHindi,
                );

                const facts = displayText(
                  item.key_facts,
                  item.key_facts_hi,
                  isHindi,
                );

                const examPoint = displayText(
                  item.exam_point,
                  item.exam_point_hi,
                  isHindi,
                );

                const isExpanded = expandedNews.includes(item.id);
                const mcqsExpanded = expandedMcqs.includes(item.id);

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="p-5 sm:p-7">
                      {/* NEWS META */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                          {isHindi
                            ? CATEGORY_HI[item.category] ?? item.category
                            : item.category}
                        </span>

                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(item.news_date, isHindi)}
                        </span>

                        {item.source_name && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            • {item.source_name}
                          </span>
                        )}

                        <span className="ml-auto text-xs font-semibold text-slate-400">
                          #{index + 1}
                        </span>
                      </div>

                      {/* TITLE */}
                      <h3 className="mt-4 text-xl font-extrabold leading-8 tracking-tight sm:text-2xl">
                        {title || t("Untitled news", "बिना शीर्षक की खबर")}
                      </h3>

                      {/* SUMMARY */}
                      {summary && (
                        <div className="mt-4">
                          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {t("News summary", "खबर का सार")}
                          </p>

                          <p className="whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-200">
                            {summary}
                          </p>
                        </div>
                      )}

                      {/* KEY FACTS */}
                      {facts && (
                        <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                          <p className="mb-2 flex items-center gap-2 text-sm font-extrabold">
                            <span>📌</span>
                            {t("Key facts", "मुख्य तथ्य")}
                          </p>

                          <p className="whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
                            {facts}
                          </p>
                        </div>
                      )}

                      {/* EXAM POINT */}
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

                      {/* ACTION BUTTONS */}
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
                            onClick={() => toggleMcqs(item.id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800"
                          >
                            <span>✍️</span>

                            {mcqsExpanded
                              ? t("Hide MCQs", "MCQ छिपाएँ")
                              : `${t("Practice MCQs", "MCQ अभ्यास")} (${item.mcqs.length})`}
                          </button>
                        )}

                        {item.source_url && (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-slate-800"
                          >
                            {t("Read source", "मूल खबर पढ़ें")} ↗
                          </a>
                        )}
                      </div>

                      {/* MORE DETAILS */}
                      {isExpanded && (
                        <div className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {t("News information", "खबर की जानकारी")}
                          </p>

                          <p className="mt-2 text-sm">
                            <strong>{t("Source:", "स्रोत:")}</strong>{" "}
                            {item.source_name || "—"}
                          </p>

                          <p className="mt-1 text-sm">
                            <strong>{t("Date:", "तारीख:")}</strong>{" "}
                            {formatDate(item.news_date, isHindi)}
                          </p>

                          {item.published_at && (
                            <p className="mt-1 text-sm">
                              <strong>{t("Published:", "प्रकाशित:")}</strong>{" "}
                              {new Date(item.published_at).toLocaleString(
                                isHindi ? "hi-IN" : "en-IN",
                              )}
                            </p>
                          )}
                        </div>
                      )}

                      {/* MCQ PRACTICE */}
                      {mcqsExpanded && item.mcqs.length > 0 && (
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

                                      const isRightOption =
                                        answered &&
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
                                          onClick={() =>
                                            selectAnswer(mcqId, option)
                                          }
                                          className={`flex items-start gap-3 rounded-xl border p-3 text-left text-sm leading-6 transition disabled:cursor-default ${optionStyle}`}
                                        >
                                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold dark:bg-slate-800">
                                            {String.fromCharCode(
                                              65 + optionIndex,
                                            )}
                                          </span>

                                          <span>{option}</span>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* ANSWER FEEDBACK */}
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
                                          : t(
                                              "Not quite. Review the highlighted answer.",
                                              "उत्तर सही नहीं है। हाइलाइट किया गया उत्तर देखें।",
                                            )}
                                      </p>

                                      {mcq.explanation && (
                                        <p className="mt-1">
                                          {mcq.explanation}
                                        </p>
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

        {/* FOOTER */}
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
