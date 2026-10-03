import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type Language = "english" | "hindi";

interface NCERTBook {
  id: string;
  class_name: string;
  subject: string;
  title: string;
  language: Language;
  description: string | null;
  storage_path: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface FormState {
  className: string;
  subject: string;
  title: string;
  language: Language;
  description: string;
  file: File | null;
}

const initialForm: FormState = {
  className: "",
  subject: "",
  title: "",
  language: "english",
  description: "",
  file: null,
};

const CLASS_OPTIONS = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

const SUBJECT_OPTIONS = [
  "Mathematics",
  "Science",
  "Social Science",
  "English",
  "Hindi",
  "Physics",
  "Chemistry",
  "Biology",
  "Political Science",
  "History",
  "Geography",
  "Economics",
  "Accountancy",
  "Business Studies",
  "Other",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminNCERT() {
  const navigate = useNavigate();

  const [books, setBooks] = useState<NCERTBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormState>(initialForm);
  const [editingBook, setEditingBook] = useState<NCERTBook | null>(null);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  useEffect(() => {
    void loadBooks();
  }, []);

  async function loadBooks() {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("ncert_books")
      .select(
        `
          id,
          class_name,
          subject,
          title,
          language,
          description,
          storage_path,
          published,
          created_at,
          updated_at
        `,
      )
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error(fetchError);
      setError(fetchError.message);
      setBooks([]);
    } else {
      setBooks((data ?? []) as NCERTBook[]);
    }

    setLoading(false);
  }

  function resetForm() {
    setForm(initialForm);
    setEditingBook(null);
    setMessage("");
    setError("");
  }

  function startEdit(book: NCERTBook) {
    setEditingBook(book);

    setForm({
      className: book.class_name,
      subject: book.subject,
      title: book.title,
      language: book.language,
      description: book.description ?? "",
      file: null,
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.className.trim()) {
      setError("Class select karo.");
      return;
    }

    if (!form.subject.trim()) {
      setError("Subject select karo.");
      return;
    }

    if (!form.title.trim()) {
      setError("Book title enter karo.");
      return;
    }

    if (!editingBook && !form.file) {
      setError("Complete NCERT book ki PDF select karo.");
      return;
    }

    if (form.file) {
      if (form.file.type !== "application/pdf") {
        setError("Sirf PDF file upload kar sakte ho.");
        return;
      }

      if (form.file.size > 100 * 1024 * 1024) {
        setError("PDF size maximum 100 MB honi chahiye.");
        return;
      }
    }

    setSaving(true);

    try {
      let storagePath = editingBook?.storage_path ?? "";

      /*
       * New book:
       * class-10/english/mathematics/<unique-id>.pdf
       *
       * Existing book:
       * existing storage path par PDF replace hogi.
       */
      if (form.file) {
        if (editingBook) {
          storagePath = editingBook.storage_path;

          const { error: uploadError } = await supabase.storage
            .from("ncert-books")
            .upload(storagePath, form.file, {
              upsert: true,
              contentType: "application/pdf",
            });

          if (uploadError) {
            throw uploadError;
          }
        } else {
          const uniqueId = crypto.randomUUID();

          const classSlug = slugify(form.className);
          const languageSlug = slugify(form.language);
          const subjectSlug = slugify(form.subject);

          const originalName =
            form.file.name.replace(/\.pdf$/i, "");

          const fileSlug = slugify(originalName) || "book";

          storagePath =
            `${classSlug}/${languageSlug}/${subjectSlug}/${uniqueId}-${fileSlug}.pdf`;

          const { error: uploadError } = await supabase.storage
            .from("ncert-books")
            .upload(storagePath, form.file, {
              upsert: false,
              contentType: "application/pdf",
            });

          if (uploadError) {
            throw uploadError;
          }
        }
      }

      if (editingBook) {
        const { error: updateError } = await supabase
          .from("ncert_books")
          .update({
            class_name: form.className.trim(),
            subject: form.subject.trim(),
            title: form.title.trim(),
            language: form.language,
            description: form.description.trim() || null,
            storage_path: storagePath,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingBook.id);

        if (updateError) {
          throw updateError;
        }

        setMessage("NCERT book successfully updated.");
      } else {
        const { error: insertError } = await supabase
          .from("ncert_books")
          .insert({
            class_name: form.className.trim(),
            subject: form.subject.trim(),
            title: form.title.trim(),
            language: form.language,
            description: form.description.trim() || null,
            storage_path: storagePath,
            published: false,
          });

        if (insertError) {
          /*
           * Agar DB insert fail ho gaya aur file upload ho chuki hai,
           * uploaded file ko cleanup karne ki koshish.
           */
          if (storagePath) {
            await supabase.storage
              .from("ncert-books")
              .remove([storagePath]);
          }

          throw insertError;
        }

        setMessage(
          "NCERT book uploaded successfully. Ab ise publish kar sakte ho.",
        );
      }

      setForm(initialForm);
      setEditingBook(null);

      await loadBooks();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "NCERT book save nahi ho payi.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(book: NCERTBook) {
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("ncert_books")
      .update({
        published: !book.published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", book.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage(
      book.published
        ? "Book unpublished."
        : "Book published successfully.",
    );

    await loadBooks();
  }

  async function previewBook(book: NCERTBook) {
    setPreviewLoading(book.id);
    setError("");

    try {
      const { data, error: signedUrlError } = await supabase.storage
        .from("ncert-books")
        .createSignedUrl(book.storage_path, 60 * 60);

      if (signedUrlError) {
        throw signedUrlError;
      }

      if (!data?.signedUrl) {
        throw new Error("PDF URL generate nahi ho paya.");
      }

      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "PDF open nahi ho payi.",
      );
    } finally {
      setPreviewLoading(null);
    }
  }

  async function deleteBook(book: NCERTBook) {
    const confirmed = window.confirm(
      `Delete "${book.title}"?\n\nIsse database entry aur PDF dono delete ho jayenge.`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const { error: storageError } = await supabase.storage
        .from("ncert-books")
        .remove([book.storage_path]);

      if (storageError) {
        throw storageError;
      }

      const { error: deleteError } = await supabase
        .from("ncert_books")
        .delete()
        .eq("id", book.id);

      if (deleteError) {
        throw deleteError;
      }

      setMessage("NCERT book deleted successfully.");

      if (editingBook?.id === book.id) {
        resetForm();
      }

      await loadBooks();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "NCERT book delete nahi ho payi.",
      );
    }
  }

  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return books.filter((book) => {
      const matchesSearch =
        !query ||
        book.title.toLowerCase().includes(query) ||
        book.subject.toLowerCase().includes(query) ||
        book.class_name.toLowerCase().includes(query) ||
        (book.description ?? "").toLowerCase().includes(query);

      const matchesClass =
        classFilter === "all" ||
        book.class_name === classFilter;

      const matchesLanguage =
        languageFilter === "all" ||
        book.language === languageFilter;

      return (
        matchesSearch &&
        matchesClass &&
        matchesLanguage
      );
    });
  }, [books, search, classFilter, languageFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Ranker Bhaiya
            </p>

            <h1 className="text-xl font-black sm:text-2xl">
              NCERT Books
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete book PDF management
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/admin/dashboard")
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* Messages */}
        {message && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            ⚠ {error}
          </div>
        )}

        {/* Upload / Edit */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-black">
                {editingBook
                  ? "Edit NCERT Book"
                  : "Upload Complete NCERT Book"}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Ek PDF = ek complete NCERT book.
              </p>
            </div>

            {editingBook && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold dark:border-slate-700"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 lg:grid-cols-2"
          >
            {/* Class */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Class *
              </label>

              <select
                value={form.className}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    className: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">
                  Select Class
                </option>

                {CLASS_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Subject *
              </label>

              <select
                value={form.subject}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subject: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">
                  Select Subject
                </option>

                {SUBJECT_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Language *
              </label>

              <select
                value={form.language}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    language:
                      event.target.value as Language,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="english">
                  English
                </option>

                <option value="hindi">
                  Hindi
                </option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Book Title *
              </label>

              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="e.g. NCERT Mathematics Class 10"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            {/* Description */}
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-bold">
                Description
              </label>

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
                placeholder="Book ke baare mein short description..."
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            {/* PDF */}
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-bold">
                Complete Book PDF{" "}
                {editingBook ? "(optional)" : "*"}
              </label>

              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    file:
                      event.target.files?.[0] ?? null,
                  }))
                }
                className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-950"
              />

              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Maximum PDF size: 100 MB
              </p>

              {editingBook && (
                <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                  PDF select karoge to existing book PDF replace ho jayegi.
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-indigo-600 px-5 py-3.5 font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingBook
                    ? "Update NCERT Book"
                    : "Upload NCERT Book"}
              </button>
            </div>
          </form>
        </section>

        {/* Filters */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 lg:grid-cols-3">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search books..."
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
            />

            <select
              value={classFilter}
              onChange={(event) =>
                setClassFilter(event.target.value)
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="all">
                All Classes
              </option>

              {CLASS_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={languageFilter}
              onChange={(event) =>
                setLanguageFilter(event.target.value)
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="all">
                All Languages
              </option>

              <option value="english">
                English
              </option>

              <option value="hindi">
                Hindi
              </option>
            </select>
          </div>
        </section>

        {/* Books */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">
                NCERT Books
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                {filteredBooks.length} book
                {filteredBooks.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
              <p className="text-sm text-slate-500">
                Books loading...
              </p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 text-5xl">
                📚
              </div>

              <h3 className="font-black">
                No NCERT books found
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Abhi koi matching book available nahi hai.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredBooks.map((book) => (
                <article
                  key={book.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-6 text-white">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur">
                        {book.class_name}
                      </span>

                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase backdrop-blur">
                        {book.language}
                      </span>
                    </div>

                    <div className="text-4xl">
                      📚
                    </div>

                    <h3 className="mt-4 line-clamp-2 text-lg font-black">
                      {book.title}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-white/80">
                      {book.subject}
                    </p>
                  </div>

                  <div className="space-y-4 p-5">
                    {book.description && (
                      <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                        {book.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        Added {formatDate(book.created_at)}
                      </span>

                      <span
                        className={
                          book.published
                            ? "rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        }
                      >
                        {book.published
                          ? "Published"
                          : "Draft"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void previewBook(book)
                        }
                        disabled={
                          previewLoading === book.id
                        }
                        className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        {previewLoading === book.id
                          ? "Opening..."
                          : "📖 Preview"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          startEdit(book)
                        }
                        className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void togglePublished(book)
                        }
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                      >
                        {book.published
                          ? "Unpublish"
                          : "Publish"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void deleteBook(book)
                        }
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
