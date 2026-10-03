import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type PaperSet = {
  id: string;
  set_number: number;
  title: string;
  description: string | null;
  year: number | null;
  question_count: number | null;
  storage_path: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

type FormState = {
  setNumber: string;
  title: string;
  description: string;
  year: string;
  questionCount: string;
};

const emptyForm: FormState = {
  setNumber: "",
  title: "",
  description: "",
  year: "",
  questionCount: "",
};

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminPreviousYearPapers() {
  const [papers, setPapers] = useState<PaperSet[]>([]);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingPaper, setEditingPaper] = useState<PaperSet | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPapers();
  }, []);

  async function fetchPapers() {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("previous_year_paper_sets")
      .select(`
        id,
        set_number,
        title,
        description,
        year,
        question_count,
        storage_path,
        published,
        created_at,
        updated_at
      `)
      .order("set_number", { ascending: true });

    if (fetchError) {
      console.error("Admin PYQ fetch error:", fetchError);
      setError(fetchError.message || "Paper sets load nahi ho paaye.");
      setPapers([]);
    } else {
      setPapers((data ?? []) as PaperSet[]);
    }

    setLoading(false);
  }

  function resetForm() {
    setForm(emptyForm);
    setSelectedFile(null);
    setEditingPaper(null);
  }

  function startEdit(paper: PaperSet) {
    setEditingPaper(paper);

    setForm({
      setNumber: String(paper.set_number),
      title: paper.title,
      description: paper.description ?? "",
      year: paper.year ? String(paper.year) : "",
      questionCount:
        paper.question_count !== null
          ? String(paper.question_count)
          : "",
    });

    setSelectedFile(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function updateForm<K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const setNumber = Number(form.setNumber);
    const year = form.year ? Number(form.year) : null;
    const questionCount = form.questionCount
      ? Number(form.questionCount)
      : null;

    if (!Number.isInteger(setNumber) || setNumber <= 0) {
      setError("Valid Set Number enter karo.");
      return;
    }

    if (!form.title.trim()) {
      setError("Book/Paper title required hai.");
      return;
    }

    if (year !== null && (!Number.isInteger(year) || year < 1900)) {
      setError("Valid year enter karo.");
      return;
    }

    if (
      questionCount !== null &&
      (!Number.isInteger(questionCount) || questionCount < 0)
    ) {
      setError("Valid question count enter karo.");
      return;
    }

    if (!editingPaper && !selectedFile) {
      setError("PDF file select karo.");
      return;
    }

    if (selectedFile) {
      const isPdf =
        selectedFile.type === "application/pdf" ||
        selectedFile.name.toLowerCase().endsWith(".pdf");

      if (!isPdf) {
        setError("Sirf PDF file upload kar sakte ho.");
        return;
      }
    }

    setSaving(true);

    try {
      let storagePath = editingPaper?.storage_path ?? "";

      /*
       * Upload new PDF
       */
      if (selectedFile) {
        const safeName =
          sanitizeFileName(selectedFile.name) || "paper.pdf";

        const baseName = slugify(form.title) || "paper";

        const fileName = `${crypto.randomUUID()}-${safeName}`;

        storagePath = `set-${String(setNumber).padStart(
          3,
          "0"
        )}/${baseName}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("previous-year-papers")
          .upload(storagePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: "application/pdf",
          });

        if (uploadError) {
          throw new Error(
            uploadError.message || "PDF upload failed."
          );
        }
      }

      /*
       * Update existing record
       */
      if (editingPaper) {
        const { error: updateError } = await supabase
          .from("previous_year_paper_sets")
          .update({
            set_number: setNumber,
            title: form.title.trim(),
            description: form.description.trim() || null,
            year,
            question_count: questionCount,
            storage_path: storagePath,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingPaper.id);

        if (updateError) {
          /*
           * If DB update fails after uploading a new file,
           * remove the newly uploaded file.
           */
          if (selectedFile && storagePath) {
            await supabase.storage
              .from("previous-year-papers")
              .remove([storagePath]);
          }

          throw new Error(
            updateError.message || "Paper update failed."
          );
        }

        /*
         * Remove old PDF only after successful DB update.
         */
        if (
          selectedFile &&
          editingPaper.storage_path &&
          editingPaper.storage_path !== storagePath
        ) {
          const { error: removeOldError } =
            await supabase.storage
              .from("previous-year-papers")
              .remove([editingPaper.storage_path]);

          if (removeOldError) {
            console.warn(
              "Old PDF remove warning:",
              removeOldError
            );
          }
        }

        setSuccess("Previous Year Paper successfully updated.");
      } else {
        /*
         * Create new record
         */
        const { error: insertError } = await supabase
          .from("previous_year_paper_sets")
          .insert({
            set_number: setNumber,
            title: form.title.trim(),
            description: form.description.trim() || null,
            year,
            question_count: questionCount,
            storage_path: storagePath,
            published: false,
          });

        if (insertError) {
          /*
           * Remove uploaded file if DB insert fails.
           */
          if (storagePath) {
            await supabase.storage
              .from("previous-year-papers")
              .remove([storagePath]);
          }

          throw new Error(
            insertError.message || "Paper save failed."
          );
        }

        setSuccess(
          "Previous Year Paper uploaded successfully. Abhi unpublished hai."
        );
      }

      resetForm();
      await fetchPapers();
    } catch (submitError) {
      console.error("PYQ submit error:", submitError);

      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(paper: PaperSet) {
    setTogglingId(paper.id);
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase
      .from("previous_year_paper_sets")
      .update({
        published: !paper.published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paper.id);

    if (updateError) {
      setError(
        updateError.message || "Publish status update failed."
      );
    } else {
      setSuccess(
        paper.published
          ? "Paper unpublished successfully."
          : "Paper published successfully."
      );

      await fetchPapers();
    }

    setTogglingId(null);
  }

  async function deletePaper(paper: PaperSet) {
    const confirmed = window.confirm(
      `Set ${String(paper.set_number).padStart(
        3,
        "0"
      )} delete karna hai?\n\nIsse database record aur PDF dono delete ho jayenge.`
    );

    if (!confirmed) return;

    setDeletingId(paper.id);
    setError("");
    setSuccess("");

    try {
      /*
       * Delete database row first.
       */
      const { error: deleteDbError } = await supabase
        .from("previous_year_paper_sets")
        .delete()
        .eq("id", paper.id);

      if (deleteDbError) {
        throw new Error(
          deleteDbError.message || "Database delete failed."
        );
      }

      /*
       * Delete PDF from storage.
       */
      if (paper.storage_path) {
        const { error: deleteFileError } = await supabase.storage
          .from("previous-year-papers")
          .remove([paper.storage_path]);

        if (deleteFileError) {
          console.warn(
            "PDF delete warning:",
            deleteFileError
          );
        }
      }

      setSuccess("Previous Year Paper deleted successfully.");
      await fetchPapers();
    } catch (deleteError) {
      console.error("PYQ delete error:", deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Delete failed."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function openPaper(paper: PaperSet) {
    setOpeningId(paper.id);
    setError("");

    const { data, error: signedUrlError } = await supabase.storage
      .from("previous-year-papers")
      .createSignedUrl(paper.storage_path, 60 * 60);

    if (signedUrlError || !data?.signedUrl) {
      setError("Paper open nahi ho pa raha.");
      setOpeningId(null);
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");

    setOpeningId(null);
  }

  const filteredPapers = papers.filter((paper) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return (
      paper.title.toLowerCase().includes(query) ||
      (paper.description ?? "").toLowerCase().includes(query) ||
      String(paper.set_number).includes(query) ||
      String(paper.year ?? "").includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                Ranker Bhaiya Admin
              </p>

              <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                Previous Year Papers
              </h1>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Upload, manage and publish complete question paper sets.
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 px-5 py-3 dark:bg-blue-950/30">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                TOTAL SETS
              </p>

              <p className="mt-1 text-2xl font-black text-blue-900 dark:text-blue-200">
                {papers.length}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            ✅ {success}
          </div>
        )}

        {/* Form */}
        <section className="mb-10 rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">
                  {editingPaper
                    ? "Edit Previous Year Paper"
                    : "Upload Previous Year Paper"}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Complete question paper PDF upload karo.
                </p>
              </div>

              {editingPaper && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-5 sm:p-7"
          >
            <div className="grid gap-5 md:grid-cols-2">
              {/* Set Number */}
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Set Number *
                </label>

                <input
                  type="number"
                  min="1"
                  value={form.setNumber}
                  onChange={(event) =>
                    updateForm("setNumber", event.target.value)
                  }
                  placeholder="Example: 1"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
                  required
                />
              </div>

              {/* Year */}
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Year
                </label>

                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={form.year}
                  onChange={(event) =>
                    updateForm("year", event.target.value)
                  }
                  placeholder="Example: 2025"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Paper Title *
              </label>

              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  updateForm("title", event.target.value)
                }
                placeholder="Example: Previous Year Question Paper Set 1"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Description
              </label>

              <textarea
                value={form.description}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
                placeholder="Paper ke baare mein short description..."
                rows={4}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {/* Question Count */}
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Question Count
                </label>

                <input
                  type="number"
                  min="0"
                  value={form.questionCount}
                  onChange={(event) =>
                    updateForm(
                      "questionCount",
                      event.target.value
                    )
                  }
                  placeholder="Example: 100"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              {/* PDF */}
              <div>
                <label className="mb-2 block text-sm font-bold">
                  PDF {editingPaper ? "(Optional)" : "*"}
                </label>

                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) =>
                    setSelectedFile(
                      event.target.files?.[0] ?? null
                    )
                  }
                  className="block w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 text-sm file:mr-4 file:border-0 file:bg-blue-600 file:px-4 file:py-3 file:font-bold file:text-white hover:file:bg-blue-700 dark:border-slate-700 dark:bg-slate-950"
                  required={!editingPaper}
                />

                {editingPaper && !selectedFile && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Existing PDF same rahega. Naya PDF select karoge to
                    old PDF replace ho jayega.
                  </p>
                )}
              </div>
            </div>

            {/* Existing file */}
            {editingPaper && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  Current Storage Path
                </p>

                <p className="mt-2 break-all text-sm font-medium text-blue-900 dark:text-blue-200">
                  {editingPaper.storage_path}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : editingPaper ? (
                <>💾 Update Paper</>
              ) : (
                <>⬆️ Upload Paper</>
              )}
            </button>
          </form>
        </section>

        {/* Search */}
        <section className="mb-6">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              🔎
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search paper sets..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>
        </section>

        {/* Paper list */}
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

            <p className="mt-4 text-sm font-semibold text-slate-500">
              Loading paper sets...
            </p>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="text-4xl">📄</div>

            <h3 className="mt-4 text-xl font-black">
              No Paper Sets
            </h3>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Abhi koi Previous Year Paper set nahi mila.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPapers.map((paper) => (
              <article
                key={paper.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                        SET{" "}
                        {String(paper.set_number).padStart(3, "0")}
                      </span>

                      {paper.year && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {paper.year}
                        </span>
                      )}

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          paper.published
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                        }`}
                      >
                        {paper.published
                          ? "Published"
                          : "Draft"}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-black">
                      {paper.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {paper.description ||
                        "No description added."}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>
                        📝{" "}
                        {paper.question_count ??
                          "Questions not specified"}
                      </span>

                      <span>
                        📁 PDF attached
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
                    <button
                      type="button"
                      onClick={() => openPaper(paper)}
                      disabled={openingId === paper.id}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {openingId === paper.id
                        ? "Opening..."
                        : "👁 View"}
                    </button>

                    <button
                      type="button"
                      onClick={() => startEdit(paper)}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePublished(paper)}
                      disabled={togglingId === paper.id}
                      className={`rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 ${
                        paper.published
                          ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
                          : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                      }`}
                    >
                      {togglingId === paper.id
                        ? "Updating..."
                        : paper.published
                          ? "Unpublish"
                          : "Publish"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deletePaper(paper)}
                      disabled={deletingId === paper.id}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                    >
                      {deletingId === paper.id
                        ? "Deleting..."
                        : "🗑 Delete"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
