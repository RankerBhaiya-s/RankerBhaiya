
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../../lib/supabase";

type MCQ = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type NewsObject = Record<string, unknown>;

type RSSNewsItem = {
  id: string;
  news_date: string;
  source_name: string;
  source_url: string;
  published_at: string;
  title: string;
  title_hi: string;
  summary: string;
  summary_hi: string;
  introduction: string;
  introduction_hi: string;
  article_body: string;
  article_body_hi: string;
  causes_impact: string;
  causes_impact_hi: string;
  challenges: string;
  challenges_hi: string;
  key_facts: unknown;
  key_facts_hi: unknown;
  exam_point: string;
  exam_point_hi: string;
  exam_relevance: unknown;
  prelims_questions: unknown;
  mains_questions: unknown;
  syllabus_mapping: unknown;
  static_gk: unknown;
  static_gk_hi: unknown;
  vocabulary: unknown;
  vocabulary_hi: unknown;
  answer_writing: string;
  answer_writing_hi: string;
  reading_time: number;
  mcqs: MCQ[];
  category: string;
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

const BOOKMARK_KEY = "ranker-bhaiya-trending-bookmarks";
const READ_KEY = "ranker-bhaiya-trending-read";

function safeText(value: unknown): string {
  if (typeof value === "string") return value.trim();

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function parseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeStringList(value: unknown): string[] {
  const parsed = parseJson(value);

  if (Array.isArray(parsed)) {
    return parsed.map(safeText).filter(Boolean);
  }

  const text = safeText(parsed);

  if (!text) return [];

  return text
    .split(/\n|•|(?<=\.)\s+(?=[A-Z0-9])/)
    .map((item) => item.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

function normalizeObjects(value: unknown): NewsObject[] {
  const parsed = parseJson(value);

  if (!Array.isArray(parsed)) return [];

  return parsed.filter(
    (item): item is NewsObject =>
      typeof item === "object" &&
      item !== null &&
      !Array.isArray(item)
  );
}

function normalizeMcqs(value: unknown): MCQ[] {
  return normalizeObjects(value)
    .map((item) => ({
      question: safeText(item.question),
      options: Array.isArray(item.options)
        ? item.options.map(safeText).filter(Boolean)
        : [],
      answer: safeText(item.answer),
      explanation: safeText(item.explanation),
    }))
    .filter(
      (item) =>
        item.question &&
        item.options.length >= 2 &&
        item.answer
    );
}

function normalizeRow(row: Record<string, unknown>): RSSNewsItem {
  return {
    id: safeText(row.id),
    news_date: safeText(row.news_date),
    source_name: safeText(row.source_name),
    source_url: safeText(row.source_url),
    published_at: safeText(row.published_at),

    title: safeText(row.title),
    title_hi: safeText(row.title_hi),
    summary: safeText(row.summary),
    summary_hi: safeText(row.summary_hi),

    introduction: safeText(row.introduction),
    introduction_hi: safeText(row.introduction_hi),

    article_body: safeText(row.article_body),
    article_body_hi: safeText(row.article_body_hi),

    causes_impact: safeText(row.causes_impact),
    causes_impact_hi: safeText(row.causes_impact_hi),

    challenges: safeText(row.challenges),
    challenges_hi: safeText(row.challenges_hi),

    key_facts: row.key_facts,
    key_facts_hi: row.key_facts_hi,

    exam_point: safeText(row.exam_point),
    exam_point_hi: safeText(row.exam_point_hi),

    exam_relevance: row.exam_relevance,
    prelims_questions: row.prelims_questions,
    mains_questions: row.mains_questions,
    syllabus_mapping: row.syllabus_mapping,

    static_gk: row.static_gk,
    static_gk_hi: row.static_gk_hi,

    vocabulary: row.vocabulary,
    vocabulary_hi: row.vocabulary_hi,

    answer_writing: safeText(row.answer_writing),
    answer_writing_hi: safeText(row.answer_writing_hi),

    reading_time: Number(row.reading_time) || 5,

    mcqs: normalizeMcqs(row.mcqs),
    category: safeText(row.category) || "Other",
  };
}

function displayText(
  english: unknown,
  hindi: unknown,
  isHindi: boolean
): string {
  const hi = safeText(hindi);
  const en = safeText(english);

  return isHindi && hi ? hi : en;
}

function formatDate(value: string, isHindi: boolean): string {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(isHindi ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function readStoredList(key: string): string[] {
  try {
    const value = localStorage.getItem(key);
    const parsed = value ? JSON.parse(value) : [];

    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    return safeText(error.message) || "Unknown database error";
  }

  return safeText(error) || "Unknown database error";
}

function isCorrectAnswer(mcq: MCQ, selected: string): boolean {
  const answer = mcq.answer.trim().toLowerCase();
  const chosen = selected.trim().toLowerCase();

  if (answer === chosen) return true;

  if (/^\d+$/.test(answer)) {
    const index = Number(answer);

    if (
      mcq.options[index] &&
      mcq.options[index].toLowerCase() === chosen
    ) {
      return true;
    }
  }

  const letter = answer.match(/^([a-d])(?:[\s).:-]|$)/);

  if (letter) {
    const index = letter[1].charCodeAt(0) - 97;

    if (
      mcq.options[index] &&
      mcq.options[index].toLowerCase() === chosen
    ) {
      return true;
    }
  }

  if (/^[1-4]$/.test(answer)) {
    const index = Number(answer) - 1;

    if (
      mcq.options[index] &&
      mcq.options[index].toLowerCase() === chosen
    ) {
      return true;
    }
  }

  return false;
}

export default function RSSDailyNews() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const isHindi = safeText(i18n.language)
    .toLowerCase()
    .startsWith("hi");

  const [news, setNews] = useState<RSSNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [expandedNews, setExpandedNews] = useState<string[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});

  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [readArticles, setReadArticles] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);

  const t = useCallback(
    (english: string, hindi: string) =>
      isHindi ? hindi : english,
    [isHindi]
  );

  useEffect(() => {
    setBookmarks(readStoredList(BOOKMARK_KEY));
    setReadArticles(readStoredList(READ_KEY));
  }, []);

  useEffect(() => {
    document.title = t(
      "Trending News | Ranker Bhaiya",
      "ट्रेंडिंग न्यूज़ | Ranker Bhaiya"
    );
  }, [t]);

  const loadNews = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

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
          introduction,
          introduction_hi,
          article_body,
          article_body_hi,
          causes_impact,
          causes_impact_hi,
          challenges,
          challenges_hi,
          key_facts,
          key_facts_hi,
          exam_point,
          exam_point_hi,
          exam_relevance,
          prelims_questions,
          mains_questions,
          syllabus_mapping,
          static_gk,
          static_gk_hi,
          vocabulary,
          vocabulary_hi,
          answer_writing,
          answer_writing_hi,
          reading_time,
          mcqs,
          category
        `)
        .eq("published", true)
        .order("news_date", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      const rows = (data ?? []).map((row) =>
        normalizeRow(row as Record<string, unknown>)
      );

      setNews(rows);
    } catch (err) {
      console.error("Trending News loading error:", err);

      setError(
        `${t("News could not be loaded.", "न्यूज़ लोड नहीं हो सकी।")} ${getErrorMessage(err)}`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const availableCategories = useMemo(() => {
    const found = new Set(news.map((item) => item.category));

    return CATEGORIES.filter(
      (category) => category === "All" || found.has(category)
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
        item.introduction,
        item.introduction_hi,
        item.exam_point,
        item.exam_point_hi,
        item.source_name,
        item.category,
        ...normalizeStringList(item.key_facts),
        ...normalizeStringList(item.key_facts_hi),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchable.includes(query);

      const matchesCategory =
        activeCategory === "All" ||
        item.category === activeCategory;

      const matchesSaved =
        !savedOnly || bookmarks.includes(item.id);

      return matchesSearch && matchesCategory && matchesSaved;
    });
  }, [news, search, activeCategory, savedOnly, bookmarks]);

  const progress = news.length
    ? Math.round((readArticles.length / news.length) * 100)
    : 0;

  function toggleItem(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    id: string
  ) {
    setter((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id]
    );
  }

  function toggleBookmark(id: string) {
    setBookmarks((previous) => {
      const next = previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id];

      localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
      return next;
    });
  }

  function markAsRead(id: string) {
    setReadArticles((previous) => {
      const next = previous.includes(id)
        ? previous
        : [...previous, id];

      localStorage.setItem(READ_KEY, JSON.stringify(next));
      return next;
    });
  }

  function selectAnswer(id: string, answer: string) {
    setSelectedAnswers((previous) => ({
      ...previous,
      [id]: answer,
    }));
  }

  function renderList(value: unknown, emptyText: string) {
    const items = normalizeStringList(value);

    if (!items.length) {
      return (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {emptyText}
        </p>
      );
    }

    return (
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={`${index}-${item}`}
            className="flex gap-3 text-sm leading-7 text-slate-700 dark:text-slate-200"
          >
            <span className="mt-1 text-blue-600">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }

  function renderObjectList(
    value: unknown,
    fields: string[],
    emptyText: string
  ) {
    const items = normalizeObjects(value);

    if (!items.length) {
      return (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {emptyText}
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
          >
            {fields.map((field) => {
              const valueText = safeText(item[field]);

              if (!valueText) return null;

              return (
                <p key={field} className="mt-1 text-sm leading-6">
                  <strong className="capitalize">
                    {field.replaceAll("_", " ")}:
                  </strong>{" "}
                  {valueText}
                </p>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-5 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl animate-pulse space-y-5">
          <div className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* HERO */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-800 p-6 text-white shadow-xl sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative">
            <button
              type="button"
              onClick={() => navigate("/student/dashboard")}
              className="mb-6 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
            >
              ← {t("Back to Dashboard", "डैशबोर्ड पर जाएँ")}
            </button>

            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-200">
                  RANKER BHAIYA
                </p>

                <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                  📰 {t("Trending News", "ट्रेंडिंग न्यूज़")}
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
                  {t(
                    "Understand the news. Connect it with your syllabus. Prepare for your exams.",
                    "खबरों को समझें, उन्हें अपने सिलेबस से जोड़ें और परीक्षा की तैयारी करें।"
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm sm:min-w-44">
                <p className="text-sm text-blue-100">
                  {t("Published articles", "प्रकाशित खबरें")}
                </p>
                <p className="mt-1 text-4xl font-black">
                  {news.length}
                </p>
                <p className="mt-1 text-xs text-blue-200">
                  {t("Available updates", "उपलब्ध अपडेट")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* READING PROGRESS */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-extrabold">
                {t("Your reading progress", "आपकी पढ़ने की प्रगति")}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {readArticles.length} / {news.length}{" "}
                {t("articles completed", "खबरें पढ़ीं")}
              </p>
            </div>

            <p className="text-2xl font-black text-blue-700 dark:text-blue-300">
              {progress}%
            </p>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        {/* SEARCH AND FILTERS */}
        <section className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t(
                "Search news, topics, facts...",
                "खबर, विषय या तथ्य खोजें..."
              )}
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900"
            />

            <button
              type="button"
              onClick={() => void loadNews(true)}
              disabled={refreshing}
              className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {refreshing
                ? t("Refreshing...", "रिफ्रेश हो रहा है...")
                : t("↻ Refresh", "↻ रिफ्रेश")}
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {availableCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
                  activeCategory === category
                    ? "bg-blue-700 text-white"
                    : "border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {category === "All"
                  ? t("All", "सभी")
                  : isHindi
                    ? CATEGORY_HI[category] ?? category
                    : category}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSavedOnly((value) => !value)}
            className={`rounded-xl border px-4 py-2 text-sm font-bold ${
              savedOnly
                ? "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            ★ {savedOnly
              ? t("Showing bookmarks", "सेव की गई खबरें")
              : t("Show bookmarks", "बुकमार्क दिखाएँ")}
          </button>
        </section>

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
          >
            <strong>{t("Loading error", "लोडिंग में समस्या")}</strong>
            <p className="mt-2 break-words">{error}</p>
            <button
              type="button"
              onClick={() => void loadNews(true)}
              className="mt-3 rounded-lg bg-red-700 px-4 py-2 font-bold text-white"
            >
              {t("Try again", "दोबारा प्रयास करें")}
            </button>
          </div>
        )}

        {/* NEWS */}
        <section className="mt-8 space-y-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold tracking-widest text-blue-700 dark:text-blue-300">
                {t("NEWS DESK", "न्यूज़ डेस्क")}
              </p>
              <h2 className="mt-1 text-2xl font-black">
                {t("Latest updates", "ताज़ा अपडेट")}
              </h2>
            </div>

            <span className="rounded-full bg-slate-200 px-3 py-2 text-xs font-bold dark:bg-slate-800">
              {filteredNews.length} {t("results", "परिणाम")}
            </span>
          </div>

          {!error && filteredNews.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="text-5xl">📰</div>
              <h3 className="mt-4 text-xl font-bold">
                {news.length === 0
                  ? t("No published news yet", "अभी कोई खबर प्रकाशित नहीं है")
                  : t("No matching news found", "कोई खबर नहीं मिली")}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {t(
                  "Please try another search or check again later.",
                  "दूसरा शब्द खोजें या बाद में फिर प्रयास करें।"
                )}
              </p>
            </div>
          )}

          {filteredNews.map((item) => {
            const title = displayText(item.title, item.title_hi, isHindi);
            const summary = displayText(item.summary, item.summary_hi, isHindi);
            const introduction = displayText(
              item.introduction,
              item.introduction_hi,
              isHindi
            );
            const articleBody = displayText(
              item.article_body,
              item.article_body_hi,
              isHindi
            );
            const causes = displayText(
              item.causes_impact,
              item.causes_impact_hi,
              isHindi
            );
            const challenges = displayText(
              item.challenges,
              item.challenges_hi,
              isHindi
            );
            const facts = isHindi
              ? item.key_facts_hi
              : item.key_facts;
            const staticGk = isHindi
              ? item.static_gk_hi
              : item.static_gk;
            const vocabulary = isHindi
              ? item.vocabulary_hi
              : item.vocabulary;

            const examPoint = displayText(
              item.exam_point,
              item.exam_point_hi,
              isHindi
            );

            const answerWriting = displayText(
              item.answer_writing,
              item.answer_writing_hi,
              isHindi
            );

            const isExpanded = expandedNews.includes(item.id);
            const isBookmarked = bookmarks.includes(item.id);
            const isRead = readArticles.includes(item.id);

            const prelims = normalizeMcqs(item.prelims_questions);
            const mcqs = item.mcqs;
            const mains = normalizeObjects(item.mains_questions);
            const syllabus = normalizeObjects(item.syllabus_mapping);
            const relevance = parseJson(item.exam_relevance);

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="p-5 sm:p-7">

                  {/* ARTICLE META */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                      {isHindi
                        ? CATEGORY_HI[item.category] ?? item.category
                        : item.category}
                    </span>

                    <span className="text-xs text-slate-500">
                      {formatDate(item.news_date, isHindi)}
                    </span>

                    {item.source_name && (
                      <span className="text-xs text-slate-500">
                        • {item.source_name}
                      </span>
                    )}

                    <span className="ml-auto text-xs font-bold text-slate-400">
                      {item.reading_time} min
                    </span>
                  </div>

                  {/* TITLE */}
                  <h3 className="mt-5 text-xl font-black leading-8 tracking-tight sm:text-2xl">
                    {title || t("Untitled news", "बिना शीर्षक की खबर")}
                  </h3>

                  {/* SUMMARY */}
                  {summary && (
                    <div className="mt-4 rounded-2xl bg-blue-50/70 p-4 dark:bg-blue-950/30">
                      <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                        {t("Quick overview", "संक्षिप्त जानकारी")}
                      </p>
                      <p className="text-sm leading-7">
                        {summary}
                      </p>
                    </div>
                  )}

                  {/* INTRODUCTION */}
                  {introduction && (
                    <section className="mt-5">
                      <h4 className="mb-2 font-extrabold">
                        {t("Introduction", "परिचय")}
                      </h4>
                      <p className="whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">
                        {introduction}
                      </p>
                    </section>
                  )}

                  {/* ARTICLE BODY */}
                  {articleBody && (
                    <section className="mt-5">
                      <h4 className="mb-2 font-extrabold">
                        {t("Detailed explanation", "विस्तृत जानकारी")}
                      </h4>
                      <div className="whitespace-pre-line text-sm leading-8 text-slate-700 dark:text-slate-300">
                        {articleBody}
                      </div>
                    </section>
                  )}

                  {/* KEY FACTS */}
                  {normalizeStringList(facts).length > 0 && (
                    <section className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                      <h4 className="mb-3 font-extrabold">
                        📌 {t("Key facts", "मुख्य तथ्य")}
                      </h4>
                      {renderList(
                        facts,
                        t("No facts available.", "तथ्य उपलब्ध नहीं हैं।")
                      )}
                    </section>
                  )}

                  {/* CAUSES AND IMPACT */}
                  {causes && (
                    <section className="mt-5 rounded-2xl border border-indigo-100 p-4 dark:border-indigo-900">
                      <h4 className="mb-2 font-extrabold">
                        {t("Causes & Impact", "कारण और प्रभाव")}
                      </h4>
                      <p className="whitespace-pre-line text-sm leading-7">
                        {causes}
                      </p>
                    </section>
                  )}

                  {/* CHALLENGES */}
                  {challenges && (
                    <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                      <h4 className="mb-2 font-extrabold">
                        {t("Challenges", "चुनौतियाँ")}
                      </h4>
                      <p className="whitespace-pre-line text-sm leading-7">
                        {challenges}
                      </p>
                    </section>
                  )}

                  {/* EXAM POINT */}
                  {examPoint && (
                    <section className="mt-5 rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-4 dark:bg-amber-950/30">
                      <h4 className="mb-2 text-sm font-extrabold text-amber-900 dark:text-amber-200">
                        🎯 {t("Important exam point", "महत्वपूर्ण परीक्षा बिंदु")}
                      </h4>
                      <p className="text-sm leading-7 text-amber-950 dark:text-amber-100">
                        {examPoint}
                      </p>
                    </section>
                  )}

                  {/* ACTIONS */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleItem(setExpandedNews, item.id)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      {isExpanded
                        ? t("Hide exam preparation", "परीक्षा तैयारी छिपाएँ")
                        : t("Exam preparation", "परीक्षा तैयारी")}
                      {isExpanded ? " ↑" : " ↓"}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleBookmark(item.id)}
                      className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${
                        isBookmarked
                          ? "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {isBookmarked
                        ? "★ " + t("Saved", "सेव किया")
                        : "☆ " + t("Bookmark", "बुकमार्क")}
                    </button>

                    <button
                      type="button"
                      onClick={() => markAsRead(item.id)}
                      disabled={isRead}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold disabled:opacity-60 dark:border-slate-700"
                    >
                      {isRead
                        ? "✓ " + t("Read", "पढ़ लिया")
                        : t("Mark as read", "पढ़ा हुआ चिह्नित करें")}
                    </button>

                    {item.source_url && (
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-slate-800"
                      >
                        {t("Original source", "मूल स्रोत")} ↗
                      </a>
                    )}
                  </div>

                  {/* EXAM PREPARATION */}
                  {isExpanded && (
                    <div className="mt-7 space-y-6 border-t border-slate-200 pt-6 dark:border-slate-700">

                      {/* EXAM RELEVANCE */}
                      <section>
                        <h4 className="mb-3 text-lg font-black">
                          🎓 {t("Exam-wise relevance", "परीक्षा के अनुसार महत्व")}
                        </h4>

                        {typeof relevance === "object" &&
                        relevance !== null &&
                        !Array.isArray(relevance) ? (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {Object.entries(relevance as Record<string, unknown>).map(
                              ([exam, value]) => (
                                <div
                                  key={exam}
                                  className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                                >
                                  <p className="font-extrabold text-blue-700 dark:text-blue-300">
                                    {exam}
                                  </p>
                                  <p className="mt-2 text-sm leading-6">
                                    {safeText(value)}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">
                            {t("No exam mapping available.", "परीक्षा मैपिंग उपलब्ध नहीं है।")}
                          </p>
                        )}
                      </section>

                      {/* SYLLABUS */}
                      <section>
                        <h4 className="mb-3 text-lg font-black">
                          📚 {t("Syllabus mapping", "सिलेबस मैपिंग")}
                        </h4>

                        {renderObjectList(
                          syllabus,
                          ["exam", "paper", "topic"],
                          t("No confirmed syllabus mapping available.", "सिलेबस मैपिंग उपलब्ध नहीं है।")
                        )}
                      </section>

                      {/* STATIC GK */}
                      <section>
                        <h4 className="mb-3 text-lg font-black">
                          📖 {t("Static GK connection", "स्टैटिक GK")}
                        </h4>

                        {renderList(
                          staticGk,
                          t("No additional static GK available.", "अतिरिक्त स्टैटिक GK उपलब्ध नहीं है।")
                        )}
                      </section>

                      {/* VOCABULARY */}
                      <section>
                        <h4 className="mb-3 text-lg font-black">
                          🔤 {t("Vocabulary builder", "शब्दावली")}
                        </h4>

                        {renderObjectList(
                          vocabulary,
                          ["word", "meaning", "hindi", "usage"],
                          t("No vocabulary available.", "शब्दावली उपलब्ध नहीं है।")
                        )}
                      </section>

                      {/* PRELIMS */}
                      <section>
                        <h4 className="mb-3 text-lg font-black">
                          📝 {t("Prelims practice", "प्रारंभिक परीक्षा अभ्यास")}
                        </h4>

                        <Quiz
                          questions={prelims}
                          prefix={`${item.id}-prelims`}
                          selectedAnswers={selectedAnswers}
                          onSelect={selectAnswer}
                          isHindi={isHindi}
                        />
                      </section>

                      {/* MAINS */}
                      <section>
                        <h4 className="mb-3 text-lg font-black">
                          ✍️ {t("Mains answer practice", "मुख्य परीक्षा अभ्यास")}
                        </h4>

                        {renderObjectList(
                          mains,
                          ["question", "approach", "marks"],
                          t("No Mains questions available.", "मुख्य परीक्षा के प्रश्न उपलब्ध नहीं हैं।")
                        )}
                      </section>

                      {/* ANSWER WRITING */}
                      {answerWriting && (
                        <section className="rounded-2xl bg-indigo-50 p-4 dark:bg-indigo-950/30">
                          <h4 className="mb-2 font-extrabold">
                            {t("Answer-writing framework", "उत्तर लेखन मार्गदर्शन")}
                          </h4>
                          <p className="whitespace-pre-line text-sm leading-7">
                            {answerWriting}
                          </p>
                        </section>
                      )}

                      {/* GENERAL MCQS */}
                      {mcqs.length > 0 && (
                        <section>
                          <h4 className="mb-3 text-lg font-black">
                            🧠 {t("Knowledge check", "अपना ज्ञान जाँचें")}
                          </h4>

                          <Quiz
                            questions={mcqs}
                            prefix={`${item.id}-mcq`}
                            selectedAnswers={selectedAnswers}
                            onSelect={selectAnswer}
                            isHindi={isHindi}
                          />
                        </section>
                      )}

                      <div className="rounded-xl border border-slate-200 p-4 text-xs leading-6 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        {t(
                          "Study note: This is an AI-assisted explainer based on the linked news source. Verify important facts with the original report and official sources.",
                          "अध्ययन नोट: यह लिंक की गई खबर पर आधारित AI-सहायता प्राप्त व्याख्या है। महत्वपूर्ण तथ्यों को मूल रिपोर्ट और आधिकारिक स्रोतों से सत्यापित करें।"
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {/* FOOTER */}
        <footer className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="font-black text-blue-800 dark:text-blue-300">
            Ranker Bhaiya
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t(
              "Aapki Mehnat, Hamari Strategy.",
              "आपकी मेहनत, हमारी रणनीति।"
            )}
          </p>
        </footer>
      </div>
    </main>
  );
}

function Quiz({
  questions,
  prefix,
  selectedAnswers,
  onSelect,
  isHindi,
}: {
  questions: MCQ[];
  prefix: string;
  selectedAnswers: Record<string, string>;
  onSelect: (id: string, answer: string) => void;
  isHindi: boolean;
}) {
  const t = (en: string, hi: string) => isHindi ? hi : en;

  if (!questions.length) {
    return (
      <p className="text-sm text-slate-500">
        {t("No questions available.", "प्रश्न उपलब्ध नहीं हैं।")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => {
        const id = `${prefix}-${index}`;
        const selected = selectedAnswers[id];
        const answered = Boolean(selected);
        const correct = selected
          ? isCorrectAnswer(question, selected)
          : false;

        return (
          <div
            key={id}
            className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700 sm:p-5"
          >
            <p className="font-bold leading-7">
              <span className="mr-2 text-blue-700 dark:text-blue-300">
                Q{index + 1}.
              </span>
              {question.question}
            </p>

            <div className="mt-4 grid gap-2">
              {question.options.map((option, optionIndex) => {
                const isSelected = selected === option;
                const isRight =
                  answered && isCorrectAnswer(question, option);

                let style =
                  "border-slate-200 hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-800";

                if (isRight) {
                  style =
                    "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100";
                } else if (isSelected && !correct) {
                  style =
                    "border-red-400 bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-100";
                }

                return (
                  <button
                    key={`${id}-${optionIndex}`}
                    type="button"
                    disabled={answered}
                    onClick={() => onSelect(id, option)}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left text-sm leading-6 transition disabled:cursor-default ${style}`}
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
                    : t("Incorrect answer. See the highlighted answer.", "उत्तर सही नहीं है। सही उत्तर हाइलाइट किया गया है।")}
                </p>

                {question.explanation && (
                  <p className="mt-1">{question.explanation}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
