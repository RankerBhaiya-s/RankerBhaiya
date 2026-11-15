
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type MCQ = {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
};

type DailyNewsItem = {
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
  content_hash: string;
  published: boolean;
};

const CATEGORIES = [
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

const EMPTY_FORM: Omit<DailyNewsItem, "id"> = {
  news_date: new Date().toISOString().slice(0, 10),
  source_name: "",
  source_url: "",
  published_at: "",
  title: "",
  title_hi: "",
  summary: "",
  summary_hi: "",
  key_facts: "",
  key_facts_hi: "",
  exam_point: "",
  exam_point_hi: "",
  mcqs: [],
  category: "National",
  language: "english",
  content_hash: "",
  published: false,
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

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminDailyNews() {
  const navigate = useNavigate();

  const [items, setItems] = useState<DailyNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<DailyNewsItem, "id">>({
    ...EMPTY_FORM,
  });
  const [mcqText, setMcqText] = useState("[]");

  const db = supabase as any;

  useEffect(() => {
    document.title = "RSS Daily News Admin | Ranker Bhaiya";
    void loadNews();
  }, []);

  async function loadNews() {
    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await db
        .from("daily_news")
        .select("*")
        .order("news_date", { ascending: false })
        .order("published_at", { ascending: false });

      if (fetchError) throw fetchError;

      const rows: DailyNewsItem[] = (data ?? []).map((row: any) => ({
        ...row,
        published_at: row.published_at ?? null,
        mcqs: normalizeMcqs(row.mcqs),
        source_name: row.source_name ?? "",
        source_url: row.source_url ?? "",
        title_hi: row.title_hi ?? "",
        summary_hi: row.summary_hi ?? "",
        key_facts_hi: row.key_facts_hi ?? "",
        exam_point_hi: row.exam_point_hi ?? "",
        category: row.category ?? "Other",
        language: row.language ?? "english",
        content_hash: row.content_hash ?? "",
        published: Boolean(row.published),
      }));

      setItems(rows);
    } catch (err) {
      console.error("Admin RSS Daily News load error:", err);
      setError(
        err instanceof Error ? err.message : "News load nahi ho saki.",
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesCategory =
        category === "All" || item.category === category;

      const matchesStatus =
        status === "All" ||
        (status === "Published" && item.published) ||
        (status === "Draft" && !item.published);

      const searchable = [
        item.title,
        item.title_hi,
        item.summary,
        item.summary_hi,
        item.source_name,
        item.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesCategory &&
        matchesStatus &&
        (!query || searchable.includes(query))
      );
    });
  }, [items, search, category, status]);

  function updateField<K extends keyof Omit<DailyNewsItem, "id">>(
    field: K,
    value: Omit<DailyNewsItem, "id">[K],
  ) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function startAdd() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      news_date: new Date().toISOString().slice(0, 10),
    });
    setMcqText("[]");
    setError("");
    setSuccess("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(item: DailyNewsItem) {
    const { id, ...rest } = item;
    setEditingId(id);
    setForm({
      ...EMPTY_FORM,
      ...rest,
      published_at: rest.published_at ?? "",
    });
    setMcqText(JSON.stringify(item.mcqs, null, 2));
    setError("");
    setSuccess("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setMcqText("[]");
  }

  function parseMcqs(): MCQ[] {
    let parsed: unknown;

    try {
      parsed = JSON.parse(mcqText || "[]");
    } catch {
      throw new Error("MCQs ka JSON format valid nahi hai.");
    }

    if (!Array.isArray(parsed)) {
      throw new Error("MCQs JSON ek array hona chahiye.");
    }

    const normalized = normalizeMcqs(parsed);

    if (normalized.length !== parsed.length) {
      throw new Error(
        "Har MCQ mein question, options aur answer hona chahiye.",
      );
    }

    for (const [index, mcq] of normalized.entries()) {
      if (mcq.options.length !== 4) {
        throw new Error(`MCQ ${index + 1}: exactly 4 options required hain.`);
      }
      if (!mcq.options.includes(mcq.answer)) {
        throw new Error(
          `MCQ ${index + 1}: answer options mein se ek hona chahiye.`,
        );
      }
    }

    return normalized;
  }

  function validateForm(): string | null {
    if (!form.news_date) return "News date required hai.";
    if (!form.title.trim()) return "English title required hai.";
    if (!form.title_hi.trim()) return "Hindi title required hai.";
    if (!form.source_name.trim()) return "Source name required hai.";

    if (
      form.source_url.trim() &&
      !/^https?:\/\/\S+/i.test(form.source_url.trim())
    ) {
      return "Source URL valid http/https link hona chahiye.";
    }

    if (!form.category.trim()) return "Category select karein.";
    return null;
  }

  async function saveNews() {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    let parsedMcqs: MCQ[];

    try {
      parsedMcqs = parseMcqs();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "MCQ JSON invalid hai.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        news_date: form.news_date,
        source_name: form.source_name.trim(),
        source_url: form.source_url.trim(),
        published_at: form.published_at || null,
        title: form.title.trim(),
        title_hi: form.title_hi.trim(),
        summary: form.summary.trim(),
        summary_hi: form.summary_hi.trim(),
        key_facts: form.key_facts.trim(),
        key_facts_hi: form.key_facts_hi.trim(),
        exam_point: form.exam_point.trim(),
        exam_point_hi: form.exam_point_hi.trim(),
        mcqs: parsedMcqs,
        category: form.category,
        language: form.language,
        content_hash: form.content_hash.trim(),
        published: Boolean(form.published),
      };

      if (editingId) {
        const { error: updateError } = await db
          .from("daily_news")
          .update(payload)
          .eq("id", editingId);

        if (updateError) throw updateError;
        setSuccess("News successfully update ho gayi.");
      } else {
        const { error: insertError } = await db
          .from("daily_news")
          .insert(payload);

        if (insertError) throw insertError;
        setSuccess("News successfully add ho gayi.");
      }

      await loadNews();
      cancelForm();
    } catch (err) {
      console.error("RSS Daily News save error:", err);
      setError(
        err instanceof Error ? err.message : "News save nahi ho saki.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(item: DailyNewsItem) {
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await db
        .from("daily_news")
        .update({ published: !item.published })
        .eq("id", item.id);

      if (updateError) throw updateError;

      setItems((previous) =>
        previous.map((row) =>
          row.id === item.id
            ? { ...row, published: !item.published }
            : row,
        ),
      );

      setSuccess(
        item.published
          ? "News unpublish kar di gayi."
          : "News publish kar di gayi.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Publish status update nahi hua.",
      );
    }
  }

  async function deleteNews(id: string) {
    if (
      !window.confirm(
        "Kya aap is news ko permanently delete karna chahte hain?",
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const { error: deleteError } = await db
        .from("daily_news")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setItems((previous) => previous.filter((item) => item.id !== id));
      setSuccess("News delete kar di gayi.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "News delete nahi ho saki.",
      );
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

  const labelClass =
    "mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200";

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl animate-pulse space-y-4">
          <div className="h-32 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-3 text-left"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-2xl text-white">
              📰
            </span>
            <span>
              <span className="block font-black">Ranker Bhaiya</span>
              <span className="block text-xs text-slate-500">
                Admin • RSS Daily News
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            ← Dashboard
          </button>
        </header>

        <section className="mb-6 rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-800 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                ADMIN PANEL
              </span>
              <h1 className="mt-4 text-3xl font-black">
                RSS Daily News
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-blue-100">
                Add, edit, publish and manage RSS-based exam-focused news.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <p className="text-sm text-blue-100">Total news</p>
              <p className="text-4xl font-black">{items.length}</p>
              <p className="text-xs text-blue-200">
                {items.filter((item) => item.published).length} published
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          >
            {success}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startAdd}
            className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
          >
            + Add News
          </button>
          <button
            type="button"
            onClick={() => void loadNews()}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            ↻ Refresh
          </button>
        </div>

        {showForm && (
          <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black">
                {editingId ? "Edit RSS News" : "Add RSS News"}
              </h2>
              <button
                type="button"
                onClick={cancelForm}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold dark:border-slate-700"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={labelClass}>News Date *</label>
                <input
                  type="date"
                  value={form.news_date}
                  onChange={(e) => updateField("news_date", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Source Name *</label>
                <input
                  value={form.source_name}
                  onChange={(e) => updateField("source_name", e.target.value)}
                  placeholder="The Hindu"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className={inputClass}
                >
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelClass}>Source URL</label>
                <input
                  type="url"
                  value={form.source_url}
                  onChange={(e) => updateField("source_url", e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Published At</label>
                <input
                  type="datetime-local"
                  value={form.published_at ?? ""}
                  onChange={(e) => updateField("published_at", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Language</label>
                <select
                  value={form.language}
                  onChange={(e) => updateField("language", e.target.value)}
                  className={inputClass}
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Content Hash (optional)</label>
                <input
                  value={form.content_hash}
                  onChange={(e) => updateField("content_hash", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div>
                <label className={labelClass}>Title (English) *</label>
                <textarea
                  rows={2}
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Title (Hindi) *</label>
                <textarea
                  rows={2}
                  value={form.title_hi}
                  onChange={(e) => updateField("title_hi", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Summary (English)</label>
                <textarea
                  rows={4}
                  value={form.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Summary (Hindi)</label>
                <textarea
                  rows={4}
                  value={form.summary_hi}
                  onChange={(e) => updateField("summary_hi", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Key Facts (English)</label>
                <textarea
                  rows={5}
                  value={form.key_facts}
                  onChange={(e) => updateField("key_facts", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Key Facts (Hindi)</label>
                <textarea
                  rows={5}
                  value={form.key_facts_hi}
                  onChange={(e) => updateField("key_facts_hi", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Exam Point (English)</label>
                <textarea
                  rows={3}
                  value={form.exam_point}
                  onChange={(e) => updateField("exam_point", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Exam Point (Hindi)</label>
                <textarea
                  rows={3}
                  value={form.exam_point_hi}
                  onChange={(e) => updateField("exam_point_hi", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-6">
              <label className={labelClass}>MCQs JSON</label>
              <textarea
                rows={12}
                spellCheck={false}
                value={mcqText}
                onChange={(e) => setMcqText(e.target.value)}
                placeholder={`[
  {
    "question": "Question?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "Explanation"
  }
]`}
                className={`${inputClass} font-mono text-xs`}
              />
              <p className="mt-2 text-xs text-slate-500">
                MCQs ko JSON array format mein enter karein. Har question mein
                exactly 4 options aur answer unmein se ek hona chahiye.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => updateField("published", e.target.checked)}
                  className="h-4 w-4"
                />
                Publish this news
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-bold dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void saveNews()}
                  disabled={saving}
                  className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update News" : "Save News"}
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, source..."
            className={inputClass}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            <option value="All">All Status</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>

          <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold dark:border-slate-800 dark:bg-slate-900">
            Showing {filteredItems.length} of {items.length}
          </div>
        </section>

        <section className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-4xl">📰</p>
              <h3 className="mt-3 text-lg font-black">No news found</h3>
              <p className="mt-1 text-sm text-slate-500">
                Add news or change your filters.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                    {item.category}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDate(item.news_date)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      item.published
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                    }`}
                  >
                    {item.published ? "Published" : "Draft"}
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-black">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {item.title_hi}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Source: {item.source_name || "—"} • MCQs: {item.mcqs.length}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void togglePublish(item)}
                    className={`rounded-lg px-4 py-2 text-xs font-bold text-white ${
                      item.published
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-emerald-700 hover:bg-emerald-800"
                    }`}
                  >
                    {item.published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteNews(item.id)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                  {item.source_url && (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-blue-200 px-4 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950"
                    >
                      Open Source ↗
                    </a>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
