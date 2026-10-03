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
}

const CLASS_OPTIONS = [
  "All Classes",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

const SUBJECT_OPTIONS = [
  "All Subjects",
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function NCERTBooks() {
  const navigate = useNavigate();

  const [books, setBooks] = useState<NCERTBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] =
    useState("All Classes");
  const [subjectFilter, setSubjectFilter] =
    useState("All Subjects");
  const [languageFilter, setLanguageFilter] =
    useState("all");

  const [openingBook, setOpeningBook] =
    useState<string | null>(null);

  useEffect(() => {
    void loadBooks();
  }, []);

  async function loadBooks() {
    setLoading(true);
    setError("");

    const { data, error: fetchError } =
      await supabase
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
            created_at
          `,
        )
        .eq("published", true)
        .order("class_name", {
          ascending: true,
        })
        .order("subject", {
          ascending: true,
        })
        .order("title", {
          ascending: true,
        });

    if (fetchError) {
      console.error(fetchError);
      setError(
        "NCERT Books load nahi ho paayi.",
      );
      setBooks([]);
    } else {
      setBooks((data ?? []) as NCERTBook[]);
    }

    setLoading(false);
  }

  async function openBook(book: NCERTBook) {
    setOpeningBook(book.id);
    setError("");

    try {
      const { data, error: signedUrlError } =
        await supabase.storage
          .from("ncert-books")
          .createSignedUrl(
            book.storage_path,
            60 * 60,
          );

      if (signedUrlError) {
        throw signedUrlError;
      }

      if (!data?.signedUrl) {
        throw new Error(
          "PDF URL generate nahi ho paya.",
        );
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
          : "Book open nahi ho payi.",
      );
    } finally {
      setOpeningBook(null);
    }
  }

  const filteredBooks = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return books.filter((book) => {
      const matchesSearch =
        !query ||
        book.title
          .toLowerCase()
          .includes(query) ||
        book.subject
          .toLowerCase()
          .includes(query) ||
        book.class_name
          .toLowerCase()
          .includes(query) ||
        (book.description ?? "")
          .toLowerCase()
          .includes(query);

      const matchesClass =
        classFilter === "All Classes" ||
        book.class_name === classFilter;

      const matchesSubject =
        subjectFilter === "All Subjects" ||
        book.subject === subjectFilter;

      const matchesLanguage =
        languageFilter === "all" ||
        book.language === languageFilter;

      return (
        matchesSearch &&
        matchesClass &&
        matchesSubject &&
        matchesLanguage
      );
    });
  }, [
    books,
    search,
    classFilter,
    subjectFilter,
    languageFilter,
  ]);

  const clearFilters = () => {
    setSearch("");
    setClassFilter("All Classes");
    setSubjectFilter("All Subjects");
    setLanguageFilter("all");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Ranker Bhaiya
            </p>

            <h1 className="text-xl font-black sm:text-2xl">
              NCERT Books
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete NCERT books in PDF
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/student/dashboard")
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-6 text-white shadow-lg sm:p-8">

          <div className="max-w-3xl">
            <div className="text-5xl">
              📚
            </div>

            <h2 className="mt-4 text-2xl font-black sm:text-3xl">
              NCERT Books Library
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/80 sm:text-base">
              Apni class aur subject ke hisaab se
              complete NCERT books padho. Har entry
              ek poori book PDF hai.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-black">
                {books.length}
              </p>

              <p className="mt-1 text-xs text-white/70">
                Books
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-black">
                6–12
              </p>

              <p className="mt-1 text-xs text-white/70">
                Classes
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-black">
                EN
              </p>

              <p className="mt-1 text-xs text-white/70">
                English
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-black">
                HI
              </p>

              <p className="mt-1 text-xs text-white/70">
                Hindi
              </p>
            </div>

          </div>
        </section>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            ⚠ {error}
          </div>
        )}

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            {/* SEARCH */}

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="🔍 Search NCERT book..."
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950"
            />

            {/* CLASS */}

            <select
              value={classFilter}
              onChange={(event) =>
                setClassFilter(event.target.value)
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
            >
              {CLASS_OPTIONS.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            {/* SUBJECT */}

            <select
              value={subjectFilter}
              onChange={(event) =>
                setSubjectFilter(event.target.value)
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
            >
              {SUBJECT_OPTIONS.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            {/* LANGUAGE */}

            <select
              value={languageFilter}
              onChange={(event) =>
                setLanguageFilter(
                  event.target.value,
                )
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
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

          {(search ||
            classFilter !== "All Classes" ||
            subjectFilter !== "All Subjects" ||
            languageFilter !== "all") && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Clear Filters
            </button>
          )}
        </section>

        {/* =====================================================
            BOOK COUNT
        ===================================================== */}

        <div className="mt-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">
              Available Books
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {filteredBooks.length} book
              {filteredBooks.length !== 1
                ? "s"
                : ""}{" "}
              available
            </p>
          </div>
        </div>

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading ? (
          <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 dark:border-slate-700 dark:border-t-indigo-400" />

            <p className="mt-4 text-sm font-semibold text-slate-500">
              NCERT Books loading...
            </p>
          </section>
        ) : filteredBooks.length === 0 ? (
          /* =====================================================
             EMPTY
          ===================================================== */

          <section className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">

            <div className="text-6xl">
              📚
            </div>

            <h3 className="mt-5 text-lg font-black">
              No NCERT Books Found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Is filter ya search ke according
              koi published NCERT book available
              nahi hai.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
            >
              View All Books
            </button>
          </section>
        ) : (
          /* =====================================================
             BOOK GRID
          ===================================================== */

          <section className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {filteredBooks.map((book) => (
              <article
                key={book.id}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >

                {/* BOOK HEADER */}

                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 text-white">

                  <div className="flex items-start justify-between gap-3">

                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black backdrop-blur">
                      {book.class_name}
                    </span>

                    <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase backdrop-blur">
                      {book.language}
                    </span>

                  </div>

                  <div className="mt-6 text-5xl">
                    📖
                  </div>

                </div>

                {/* BOOK DETAILS */}

                <div className="p-5">

                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                    {book.subject}
                  </p>

                  <h3 className="mt-2 line-clamp-2 text-lg font-black text-slate-900 dark:text-white">
                    {book.title}
                  </h3>

                  {book.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-5 text-slate-500 dark:text-slate-400">
                      {book.description}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Complete Book
                    </span>

                    <span>
                      {formatDate(
                        book.created_at,
                      )}
                    </span>
                  </div>

                  {/* OPEN */}

                  <button
                    type="button"
                    onClick={() =>
                      void openBook(book)
                    }
                    disabled={
                      openingBook === book.id
                    }
                    className="mt-5 w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {openingBook === book.id
                      ? "Opening PDF..."
                      : "📖 Open Complete Book"}
                  </button>

                </div>
              </article>
            ))}
          </section>
        )}

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer className="py-10 text-center">
          <p className="text-xs font-bold text-slate-400">
            RANKER BHAIYA
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Aapki Mehnat, Hamari Strategy.
          </p>

          <p className="mt-2 text-[10px] text-slate-400">
            Complete NCERT Books • Smart Learning
          </p>
        </footer>
      </main>
    </div>
  );
}
