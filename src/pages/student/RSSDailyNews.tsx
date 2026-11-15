
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
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

const CATEGORY_ICONS: Record<string, string> = {
  National: "🇮🇳",
  International: "🌍",
  Economy: "📈",
  "Science & Technology": "🔬",
  Environment: "🌱",
  Defence: "🛡️",
  Sports: "🏆",
  Awards: "🏅",
  Appointments: "👤",
  "Government Schemes": "🏛️",
  "Reports & Index": "📊",
  "Important Days": "📅",
  Other: "📰",
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

function categoryName(category: string, isHindi: boolean): string {
  if (category === "All") return isHindi ? "सभी" : "All";

  return isHindi
    ? CATEGORY_HI[category] ?? category
    : category;
}

function categoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? "📰";
}

function SectionHeading({
  eyebrow,
  title,
  description,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  dark?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600 dark:text-cyan-300">
        {eyebrow}
      </p>
      <h2
        className={`mt-1 text-xl font-black tracking-tight sm:text-2xl ${
          dark ? "text-white" : "text-slate-900 dark:text-white"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-1 text-sm ${
            dark ? "text-blue-100/75" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    news.forEach((item) => {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
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

  const readCount = useMemo(
    () => news.filter((item) => readArticles.includes(item.id)).length,
    [news, readArticles]
  );

  const progress = news.length
    ? Math.min(100, Math.round((readCount / news.length) * 100))
    : 0;

  const featuredNews = news[0] ?? null;

  const dailyBriefing = useMemo(
    () => news.slice(0, 3),
    [news]
  );

  function toggleItem(
    setter: Dispatch<SetStateAction<string[]>>,
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

      try {
        localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
      } catch (storageError) {
        console.error("Bookmark storage error:", storageError);
      }

      return next;
    });
  }

  function markAsRead(id: string) {
    setReadArticles((previous) => {
      const next = previous.includes(id)
        ? previous
        : [...previous, id];

      try {
        localStorage.setItem(READ_KEY, JSON.stringify(next));
      } catch (storageError) {
        console.error("Read progress storage error:", storageError);
      }

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
            className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/50"
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
      <main className="min-h-screen bg-[#f4f7fc] px-4 py-6 dark:bg-[#080e1d]">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-64 rounded-[32px] bg-slate-200 dark:bg-slate-800" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-52 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-72 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f7fc] px-3 py-5 text-slate-900 dark:bg-[#080e1d] dark:text-slate-100 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* PREMIUM HERO */}
        <section className="relative isolate overflow-hidden rounded-[30px] border border-white/10 bg-[#101d43] shadow-[0_24px_70px_-25px_rgba(30,64,175,0.55)] sm:rounded-[36px]">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#10234d] via-[#172e68] to-[#34218b]" />
          <div className="absolute -right-24 -top-28 -z-10 h-96 w-96 rounded-full bg-cyan-400/20 blur-[90px]" />
          <div className="absolute -bottom-36 left-1/3 -z-10 h-96 w-96 rounded-full bg-violet-500/30 blur-[100px]" />
          <div className="absolute right-10 top-10 -z-10 h-36 w-36 rounded-full border border-white/10" />
          <div className="absolute right-20 top-20 -z-10 h-16 w-16 rounded-full border border-white/10" />

          <div className="relative p-5 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate("/student/dashboard")}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                <span>←</span>
                {t("Back to Dashboard", "डैशबोर्ड पर जाएँ")}
              </button>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                </span>
                {t("Latest Updates", "ताज़ा अपडेट")}
              </div>
            </div>

            <div className="mt-9 grid items-end gap-8 lg:grid-cols-[1fr_310px]">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-200">
                  RANKER BHAIYA · NEWS DESK
                </p>

                <h1 className="mt-3 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {t("Stay Ahead.", "खबरों से आगे रहें।")}
                  <span className="mt-2 block bg-gradient-to-r from-cyan-200 via-blue-100 to-violet-200 bg-clip-text text-transparent">
                    {t("Stay Informed.", "हर अपडेट से अवगत रहें।")}
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100/85 sm:text-base">
                  {t(
                    "Your daily destination for important news, clear explanations and exam-focused learning.",
                    "महत्वपूर्ण खबरों, आसान व्याख्या और परीक्षा-केंद्रित अध्ययन के लिए आपका दैनिक न्यूज़ डेस्टिनेशन।"
                  )}
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("latest-news")?.scrollIntoView({
                        behavior: "smooth",
                      })
                    }
                    className="rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50"
                  >
                    {t("Explore Latest News", "ताज़ा खबरें देखें")} →
                  </button>

                  <button
                    type="button"
                    onClick={() => setSavedOnly((value) => !value)}
                    className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    ☆ {t("My Saved News", "मेरी सेव खबरें")}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-5 backdrop-blur-xl">
                  <p className="text-xs font-semibold text-blue-100/75">
                    {t("Published Articles", "प्रकाशित खबरें")}
                  </p>
                  <p className="mt-2 text-4xl font-black text-white">
                    {news.length}
                  </p>
                  <p className="mt-1 text-[10px] text-cyan-200">
                    {t("Available to explore", "पढ़ने के लिए उपलब्ध")}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/[0.09] p-5 backdrop-blur-xl">
                  <p className="text-xs font-semibold text-blue-100/75">
                    {t("Your Reading Progress", "आपकी पढ़ने की प्रगति")}
                  </p>
                  <div className="mt-2 flex items-end gap-2">
                    <p className="text-4xl font-black text-white">
                      {progress}%
                    </p>
                    <p className="pb-1 text-[10px] text-cyan-200">
                      {readCount}/{news.length}
                    </p>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* QUICK STATS */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#101a30] sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-2xl">📰</span>
              <span className="rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-black text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                NEWS
              </span>
            </div>
            <p className="mt-3 text-2xl font-black">{news.length}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t("Total published", "कुल प्रकाशित")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#101a30] sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-2xl">📚</span>
              <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                READ
              </span>
            </div>
            <p className="mt-3 text-2xl font-black">{readCount}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t("Articles completed", "पढ़ी गई खबरें")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#101a30] sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🔖</span>
              <span className="rounded-lg bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                SAVED
              </span>
            </div>
            <p className="mt-3 text-2xl font-black">{bookmarks.length}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t("Bookmarked news", "सेव की गई खबरें")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#101a30] sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🎯</span>
              <span className="rounded-lg bg-violet-50 px-2 py-1 text-[9px] font-black text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                EXAM
              </span>
            </div>
            <p className="mt-3 text-2xl font-black">
              {news.filter((item) => item.exam_point || item.exam_point_hi).length}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t("Exam-focused articles", "परीक्षा उपयोगी खबरें")}
            </p>
          </div>
        </section>

        {/* DAILY BRIEFING */}
        {dailyBriefing.length > 0 && (
          <section className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-indigo-50/80 p-5 shadow-sm dark:border-blue-900/50 dark:from-[#111d36] dark:via-[#12203d] dark:to-[#1b1d42] sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-cyan-300">
                  YOUR DAILY BRIEFING
                </p>
                <h2 className="mt-1 text-xl font-black sm:text-2xl">
                  {t("Today's News Briefing", "आज की न्यूज़ ब्रीफिंग")}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t(
                    "A quick look at the latest published updates.",
                    "हाल ही में प्रकाशित खबरों पर एक त्वरित नज़र।"
                  )}
                </p>
              </div>

              <span className="rounded-full bg-blue-100 px-3 py-2 text-[10px] font-black text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                {dailyBriefing.length} {t("Highlights", "मुख्य खबरें")}
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {dailyBriefing.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    document
                      .getElementById(`news-${item.id}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="group rounded-2xl border border-white bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg dark:border-white/5 dark:bg-white/[0.04] dark:hover:border-blue-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">
                      {categoryIcon(item.category)}
                    </span>
                    <span className="rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-black text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      0{index + 1}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-extrabold leading-6 group-hover:text-blue-700 dark:group-hover:text-cyan-300">
                    {displayText(item.title, item.title_hi, isHindi)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {displayText(item.summary, item.summary_hi, isHindi) ||
                      t("Open this story to read more.", "इस खबर को पढ़ने के लिए खोलें।")}
                  </p>
                  <p className="mt-3 text-[10px] font-bold text-blue-600 dark:text-cyan-300">
                    {t("Read briefing", "खबर पढ़ें")} →
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* TRENDING TOPICS */}
        {categoryCounts.length > 0 && (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <SectionHeading
                eyebrow="EXPLORE BY TOPIC"
                title={t("Trending Topics", "ट्रेंडिंग विषय")}
                description={t(
                  "Browse published news by category.",
                  "श्रेणी के अनुसार प्रकाशित खबरें देखें।"
                )}
              />
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("All");
                  setSavedOnly(false);
                  setSearch("");
                }}
                className="text-xs font-bold text-blue-700 hover:underline dark:text-cyan-300"
              >
                {t("View all topics", "सभी विषय देखें")} →
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {categoryCounts.map(([category, count]) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category);
                    setSavedOnly(false);
                    document
                      .getElementById("latest-news")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`group rounded-2xl border p-4 text-left transition hover:-translate-y-1 hover:shadow-lg ${
                    activeCategory === category
                      ? "border-blue-500 bg-blue-50 shadow-md dark:border-blue-500 dark:bg-blue-950/40"
                      : "border-slate-200 bg-white hover:border-blue-200 dark:border-slate-800 dark:bg-[#101a30] dark:hover:border-blue-800"
                  }`}
                >
                  <span className="text-2xl">{categoryIcon(category)}</span>
                  <p className="mt-3 line-clamp-1 text-xs font-black">
                    {categoryName(category, isHindi)}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    {count} {t("articles", "खबरें")}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* FEATURED STORY */}
        {featuredNews && !savedOnly && activeCategory === "All" && !search.trim() && (
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#101a30]">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
              <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#13295c] via-[#1b3980] to-[#352a86] p-6 text-white sm:p-8">
                <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
                <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl" />

                <div className="relative flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider backdrop-blur">
                    ★ {t("Featured Story", "प्रमुख खबर")}
                  </span>
                  <span className="text-2xl">
                    {categoryIcon(featuredNews.category)}
                  </span>
                </div>

                <div className="relative mt-10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-200">
                    {categoryName(featuredNews.category, isHindi)} ·{" "}
                    {formatDate(featuredNews.news_date, isHindi)}
                  </p>
                  <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
                    {displayText(
                      featuredNews.title,
                      featuredNews.title_hi,
                      isHindi
                    )}
                  </h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-7 text-blue-100/85">
                    {displayText(
                      featuredNews.summary,
                      featuredNews.summary_hi,
                      isHindi
                    ) ||
                      t(
                        "Explore this important news update and its exam relevance.",
                        "इस महत्वपूर्ण खबर और इसके परीक्षा महत्व को समझें।"
                      )}
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-center p-6 sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-cyan-300">
                  WHY IT MATTERS
                </p>
                <h3 className="mt-2 text-xl font-black">
                  {t("Understand beyond the headline", "सिर्फ हेडलाइन नहीं, पूरी जानकारी")}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {displayText(
                    featuredNews.exam_point,
                    featuredNews.exam_point_hi,
                    isHindi
                  ) ||
                    displayText(
                      featuredNews.summary,
                      featuredNews.summary_hi,
                      isHindi
                    ) ||
                    t(
                      "Read the full story and explore its key facts.",
                      "पूरी खबर पढ़ें और इसके मुख्य तथ्यों को जानें।"
                    )}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    🎯 {t("Exam Focus", "परीक्षा उपयोगी")}
                  </span>
                  <span className="rounded-full bg-violet-50 px-3 py-2 text-[10px] font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    📖 {featuredNews.reading_time} min
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setExpandedNews((previous) =>
                      previous.includes(featuredNews.id)
                        ? previous
                        : [...previous, featuredNews.id]
                    );
                    document
                      .getElementById(`news-${featuredNews.id}`)
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="mt-6 w-full rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 sm:w-fit"
                >
                  {t("Read Featured Story", "प्रमुख खबर पढ़ें")} →
                </button>
              </div>
            </div>
          </section>
        )}

        {/* SEARCH AND FILTERS */}
        <section
          id="latest-news"
          className="scroll-mt-6 rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#101a30] sm:p-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeading
              eyebrow="NEWS EXPLORER"
              title={t("Find Your News", "अपनी खबर खोजें")}
              description={t(
                "Search, filter and save the updates that matter.",
                "खबरें खोजें, श्रेणी चुनें और जरूरी अपडेट सेव करें।"
              )}
            />

            <button
              type="button"
              onClick={() => void loadNews(true)}
              disabled={refreshing}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              {refreshing
                ? t("Refreshing...", "रिफ्रेश हो रहा है...")
                : "↻ " + t("Refresh News", "न्यूज़ रिफ्रेश करें")}
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                ⌕
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t(
                  "Search news, topics, facts...",
                  "खबर, विषय या तथ्य खोजें..."
                )}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:focus:bg-slate-950"
              />
            </div>

            <button
              type="button"
              onClick={() => setSavedOnly((value) => !value)}
              className={`rounded-xl border px-5 py-3 text-xs font-black transition ${
                savedOnly
                  ? "border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                  : "border-slate-200 bg-white hover:border-amber-300 dark:border-slate-700 dark:bg-slate-900"
              }`}
            >
              ★ {savedOnly
                ? t("Showing Saved", "सेव खबरें दिखाई जा रही हैं")
                : t("Saved News", "सेव खबरें")}
            </button>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {availableCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition ${
                  activeCategory === category
                    ? "bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-md shadow-blue-700/20"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {category === "All" ? "✦ " : ""}
                {categoryName(category, isHindi)}
              </button>
            ))}
          </div>

          {(search || activeCategory !== "All" || savedOnly) && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("Active filters applied", "फिल्टर लागू हैं")} ·{" "}
                {filteredNews.length} {t("matching results", "मिलती-जुलती खबरें")}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("All");
                  setSavedOnly(false);
                }}
                className="text-xs font-bold text-blue-700 hover:underline dark:text-cyan-300"
              >
                {t("Clear filters", "फिल्टर हटाएँ")} ×
              </button>
            </div>
          )}
        </section>

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
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

        {/* LATEST NEWS */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeading
              eyebrow="THE LATEST"
              title={savedOnly
                ? t("Your Saved Stories", "आपकी सेव की गई खबरें")
                : t("Latest News & Updates", "ताज़ा खबरें और अपडेट")}
              description={t(
                "Read the story, understand the facts and connect it with your preparation.",
                "खबर पढ़ें, तथ्यों को समझें और अपनी तैयारी से जोड़ें।"
              )}
            />

            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm dark:border-slate-700 dark:bg-[#101a30] dark:text-slate-300">
              {filteredNews.length} {t("Stories", "खबरें")}
            </span>
          </div>

          {!error && filteredNews.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-[#101a30] sm:p-14">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl dark:bg-blue-950/50">
                📰
              </div>
              <h3 className="mt-5 text-xl font-black">
                {news.length === 0
                  ? t("No published news yet", "अभी कोई खबर प्रकाशित नहीं है")
                  : t("No matching news found", "कोई खबर नहीं मिली")}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                {t(
                  "Please try another search or check again later.",
                  "दूसरा शब्द खोजें या बाद में फिर प्रयास करें।"
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("All");
                  setSavedOnly(false);
                  void loadNews(true);
                }}
                className="mt-5 rounded-xl bg-blue-700 px-5 py-3 text-xs font-black text-white hover:bg-blue-800"
              >
                {t("Reset and refresh", "रीसेट करके रिफ्रेश करें")}
              </button>
            </div>
          )}

          <div className="grid gap-5 xl:grid-cols-2">
            {filteredNews.map((item, index) => {
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
              const facts = isHindi ? item.key_facts_hi : item.key_facts;
              const staticGk = isHindi ? item.static_gk_hi : item.static_gk;
              const vocabulary = isHindi ? item.vocabulary_hi : item.vocabulary;

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
                  id={`news-${item.id}`}
                  key={item.id}
                  className="scroll-mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 dark:border-slate-800 dark:bg-[#101a30] dark:hover:border-blue-900"
                >
                  <div className="p-5 sm:p-6">
                    {/* CARD META */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-[10px] font-black text-blue-800 dark:bg-blue-950/60 dark:text-blue-200">
                        <span>{categoryIcon(item.category)}</span>
                        {categoryName(item.category, isHindi)}
                      </span>

                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        {formatDate(item.news_date, isHindi)}
                      </span>

                      {index === 0 && activeCategory === "All" && !savedOnly && (
                        <span className="rounded-lg bg-amber-50 px-2 py-1 text-[9px] font-black text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          ★ {t("LATEST", "नई खबर")}
                        </span>
                      )}

                      {isRead && (
                        <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          ✓ {t("READ", "पढ़ लिया")}
                        </span>
                      )}
                    </div>

                    {/* TITLE */}
                    <h3 className="mt-4 text-lg font-black leading-7 tracking-tight text-slate-900 dark:text-white sm:text-xl">
                      {title || t("Untitled news", "बिना शीर्षक की खबर")}
                    </h3>

                    {/* SOURCE AND READING TIME */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                      {item.source_name && (
                        <span className="font-semibold">
                          {t("Source:", "स्रोत:")} {item.source_name}
                        </span>
                      )}
                      <span>•</span>
                      <span>📖 {item.reading_time} {t("min read", "मिनट")}
                      </span>
                    </div>

                    {/* SUMMARY */}
                    {summary && (
                      <div className="mt-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/60 p-4 dark:border-blue-900/50 dark:from-blue-950/40 dark:to-indigo-950/20">
                        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-blue-700 dark:text-cyan-300">
                          ✦ {t("Quick Briefing", "संक्षिप्त जानकारी")}
                        </p>
                        <p className="text-sm leading-7 text-slate-700 dark:text-slate-200">
                          {summary}
                        </p>
                      </div>
                    )}

                    {/* INTRODUCTION */}
                    {introduction && (
                      <section className="mt-5">
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-black">
                          <span className="text-blue-600">01</span>
                          {t("Introduction", "परिचय")}
                        </h4>
                        <p className="whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {introduction}
                        </p>
                      </section>
                    )}

                    {/* ARTICLE BODY */}
                    {articleBody && (
                      <section className="mt-5">
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-black">
                          <span className="text-blue-600">02</span>
                          {t("Detailed Explanation", "विस्तृत जानकारी")}
                        </h4>
                        <div className="whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {articleBody}
                        </div>
                      </section>
                    )}

                    {/* KEY FACTS */}
                    {normalizeStringList(facts).length > 0 && (
                      <section className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                        <h4 className="mb-3 text-sm font-black">
                          📌 {t("Key Facts", "मुख्य तथ्य")}
                        </h4>
                        {renderList(
                          facts,
                          t("No facts available.", "तथ्य उपलब्ध नहीं हैं।")
                        )}
                      </section>
                    )}

                    {/* CAUSES AND IMPACT */}
                    {causes && (
                      <section className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                        <h4 className="mb-2 text-sm font-black">
                          ⚡ {t("Causes & Impact", "कारण और प्रभाव")}
                        </h4>
                        <p className="whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">
                          {causes}
                        </p>
                      </section>
                    )}

                    {/* CHALLENGES */}
                    {challenges && (
                      <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                        <h4 className="mb-2 text-sm font-black">
                          ⚠️ {t("Challenges", "चुनौतियाँ")}
                        </h4>
                        <p className="whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">
                          {challenges}
                        </p>
                      </section>
                    )}

                    {/* EXAM POINT */}
                    {examPoint && (
                      <section className="mt-5 overflow-hidden rounded-2xl border border-amber-200 dark:border-amber-900/50">
                        <div className="flex items-center gap-2 bg-amber-100/70 px-4 py-3 dark:bg-amber-950/40">
                          <span>🎯</span>
                          <h4 className="text-xs font-black text-amber-900 dark:text-amber-200">
                            {t("Exam Booster · Important Point", "एग्जाम बूस्टर · महत्वपूर्ण बिंदु")}
                          </h4>
                        </div>
                        <p className="p-4 text-sm leading-7 text-amber-950 dark:text-amber-100">
                          {examPoint}
                        </p>
                      </section>
                    )}

                    {/* ACTIONS */}
                    <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => toggleItem(setExpandedNews, item.id)}
                        className="rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-blue-800"
                      >
                        {isExpanded
                          ? t("Hide Exam Tools", "परीक्षा टूल्स छिपाएँ")
                          : t("Explore Exam Tools", "परीक्षा टूल्स देखें")}
                        {isExpanded ? " ↑" : " ↓"}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBookmark(item.id)}
                        className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                          isBookmarked
                            ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                            : "border-slate-200 bg-white hover:border-amber-300 dark:border-slate-700 dark:bg-slate-900"
                        }`}
                      >
                        {isBookmarked
                          ? "★ " + t("Saved", "सेव किया")
                          : "☆ " + t("Save News", "खबर सेव करें")}
                      </button>

                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        disabled={isRead}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold transition hover:border-emerald-300 disabled:opacity-60 dark:border-slate-700"
                      >
                        {isRead
                          ? "✓ " + t("Read", "पढ़ लिया")
                          : t("Mark as Read", "पढ़ा हुआ चिह्नित करें")}
                      </button>

                      {item.source_url && (
                        <a
                          href={item.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:text-cyan-300 dark:hover:bg-slate-800"
                        >
                          {t("Original Source", "मूल स्रोत")} ↗
                        </a>
                      )}
                    </div>

                    {/* EXAM PREPARATION */}
                    {isExpanded && (
                      <div className="mt-7 space-y-7 border-t border-slate-200 pt-7 dark:border-slate-700">

                        {/* EXAM RELEVANCE */}
                        <section>
                          <h4 className="mb-3 text-base font-black">
                            🎓 {t("Exam-wise Relevance", "परीक्षा के अनुसार महत्व")}
                          </h4>

                          {typeof relevance === "object" &&
                          relevance !== null &&
                          !Array.isArray(relevance) ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                              {Object.entries(relevance as Record<string, unknown>).map(
                                ([exam, value]) => (
                                  <div
                                    key={exam}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
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
                          <h4 className="mb-3 text-base font-black">
                            📚 {t("Syllabus Mapping", "सिलेबस मैपिंग")}
                          </h4>
                          {renderObjectList(
                            syllabus,
                            ["exam", "paper", "topic"],
                            t("No confirmed syllabus mapping available.", "सिलेबस मैपिंग उपलब्ध नहीं है।")
                          )}
                        </section>

                        {/* STATIC GK */}
                        <section>
                          <h4 className="mb-3 text-base font-black">
                            📖 {t("Static GK Connection", "स्टैटिक GK")}
                          </h4>
                          {renderList(
                            staticGk,
                            t("No additional static GK available.", "अतिरिक्त स्टैटिक GK उपलब्ध नहीं है।")
                          )}
                        </section>

                        {/* VOCABULARY */}
                        <section>
                          <h4 className="mb-3 text-base font-black">
                            🔤 {t("Vocabulary Builder", "शब्दावली")}
                          </h4>
                          {renderObjectList(
                            vocabulary,
                            ["word", "meaning", "hindi", "usage"],
                            t("No vocabulary available.", "शब्दावली उपलब्ध नहीं है।")
                          )}
                        </section>

                        {/* PRELIMS */}
                        <section>
                          <h4 className="mb-3 text-base font-black">
                            📝 {t("Prelims Practice", "प्रारंभिक परीक्षा अभ्यास")}
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
                          <h4 className="mb-3 text-base font-black">
                            ✍️ {t("Mains Answer Practice", "मुख्य परीक्षा अभ्यास")}
                          </h4>
                          {renderObjectList(
                            mains,
                            ["question", "approach", "marks"],
                            t("No Mains questions available.", "मुख्य परीक्षा के प्रश्न उपलब्ध नहीं हैं।")
                          )}
                        </section>

                        {/* ANSWER WRITING */}
                        {answerWriting && (
                          <section className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                            <h4 className="mb-2 font-black">
                              {t("Answer-writing Framework", "उत्तर लेखन मार्गदर्शन")}
                            </h4>
                            <p className="whitespace-pre-line text-sm leading-7">
                              {answerWriting}
                            </p>
                          </section>
                        )}

                        {/* GENERAL MCQS */}
                        {mcqs.length > 0 && (
                          <section>
                            <h4 className="mb-3 text-base font-black">
                              🧠 {t("Knowledge Check", "अपना ज्ञान जाँचें")}
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

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
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
          </div>
        </section>

        {/* READING PROGRESS */}
        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#101a30] sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-cyan-300">
                YOUR LEARNING JOURNEY
              </p>
              <h2 className="mt-1 text-xl font-black">
                {t("Keep Your Reading Streak Going", "अपनी रीडिंग प्रगति जारी रखें")}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {readCount} / {news.length}{" "}
                {t("published articles read", "प्रकाशित खबरें पढ़ीं")}
              </p>
            </div>

            <p className="text-3xl font-black text-blue-700 dark:text-cyan-300">
              {progress}%
            </p>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-700 via-indigo-500 to-cyan-400 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 flex justify-between text-[10px] font-semibold text-slate-400">
            <span>{t("Start reading", "पढ़ना शुरू करें")}</span>
            <span>{t("Complete all articles", "सभी खबरें पढ़ें")}</span>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#101e45] via-[#172e68] to-[#302779] p-7 text-center text-white shadow-lg sm:p-9">
          <div className="absolute -right-10 -top-20 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-violet-300/15 blur-3xl" />

          <div className="relative">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200">
              RANKER BHAIYA
            </p>
            <h2 className="mt-2 text-2xl font-black">
              {t("Stay Curious. Keep Learning.", "जिज्ञासु रहें। सीखते रहें।")}
            </h2>
            <p className="mt-2 text-sm text-blue-100/80">
              {t(
                "Aapki Mehnat, Hamari Strategy.",
                "आपकी मेहनत, हमारी रणनीति।"
              )}
            </p>
            <button
              type="button"
              onClick={() => navigate("/student/dashboard")}
              className="mt-5 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-black text-white transition hover:bg-white/20"
            >
              ← {t("Back to Dashboard", "डैशबोर्ड पर जाएँ")}
            </button>
          </div>
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
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60 sm:p-5"
          >
            <p className="font-bold leading-7">
              <span className="mr-2 text-blue-700 dark:text-cyan-300">
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
                    : t(
                        "Incorrect answer. See the highlighted answer.",
                        "उत्तर सही नहीं है। सही उत्तर हाइलाइट किया गया है।"
                      )}
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
