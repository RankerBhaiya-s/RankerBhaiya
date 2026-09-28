import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

/* =====================================================
   TYPES
===================================================== */

interface NoteSection {
  title: string;
  points: string[];
}

interface NoteData {
  topic: string;
  introduction?: string;
  sections: NoteSection[];
  importantPoints: string[];
  examPoint?: string;
  quickRevision: string[];
  memoryTrick?: string;
}

/* =====================================================
   HELPERS
===================================================== */

function cleanText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .trim();
}

function removeMarkdownTable(text: string): string {
  return text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();

      if (!trimmed) return true;

      if (
        /^\|?\s*:?-+:?\s*\|/.test(trimmed) ||
        /^\|?\s*-{3,}\s*\|/.test(trimmed)
      ) {
        return false;
      }

      return true;
    })
    .join("\n");
}

function extractBullets(text: string): string[] {
  return text
    .split(/\n|•|(?<=\.)\s+(?=[A-Z][^.!?]{3,80}:)/)
    .map((item) =>
      cleanText(
        item
          .replace(/^[-*•]\s*/, "")
          .replace(/^\d+[.)]\s*/, ""),
      ),
    )
    .filter((item) => item.length > 2)
    .filter(
      (item, index, array) =>
        array.findIndex(
          (x) =>
            x.toLowerCase() === item.toLowerCase(),
        ) === index,
    );
}

/* =====================================================
   PARSER
===================================================== */

function parseNotes(rawContent: string): NoteData {
  const source = removeMarkdownTable(rawContent);

  const lines = source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let topic = "Study Notes";

  const titleLine = lines.find((line) => {
    const clean = cleanText(line);

    return (
      clean.length > 2 &&
      clean.length < 120 &&
      !clean.includes("|") &&
      !/^important points$/i.test(clean) &&
      !/^exam revision$/i.test(clean) &&
      !/^quick revision$/i.test(clean)
    );
  });

  if (titleLine) {
    topic = cleanText(
      titleLine
        .replace(/^#+\s*/, "")
        .replace(/^topic\s*:/i, ""),
    );
  }

  const sections: NoteSection[] = [];

  let currentSection: NoteSection | null = null;

  const importantPoints: string[] = [];
  const quickRevision: string[] = [];

  let examPoint = "";
  let memoryTrick = "";
  let introduction = "";

  for (const rawLine of lines) {
    const line = cleanText(
      rawLine
        .replace(/^#+\s*/, "")
        .replace(/^\|/, "")
        .replace(/\|$/, ""),
    );

    if (!line) continue;

    /* Ignore branding / duplicate headings */

    if (
      /^ranker bhaiya$/i.test(line) ||
      /^ask vidhya/i.test(line) ||
      /^ai notes$/i.test(line) ||
      /^important points$/i.test(line) ||
      /^exam revision$/i.test(line)
    ) {
      continue;
    }

    /* Exam point */

    if (
      /^exam point\s*:?\s*/i.test(line) ||
      /^exam tip\s*:?\s*/i.test(line)
    ) {
      examPoint = line
        .replace(
          /^exam (point|tip)\s*:?\s*/i,
          "",
        )
        .trim();

      continue;
    }

    /* Memory trick */

    if (
      /^memory trick\s*:?\s*/i.test(line) ||
      /^mnemonic\s*:?\s*/i.test(line)
    ) {
      memoryTrick = line
        .replace(
          /^(memory trick|mnemonic)\s*:?\s*/i,
          "",
        )
        .trim();

      continue;
    }

    /* Quick revision */

    if (
      /^quick revision\s*:?\s*/i.test(line)
    ) {
      continue;
    }

    /* Bullet */

    if (
      /^[-•*]\s*/.test(rawLine) &&
      currentSection
    ) {
      const point = cleanText(
        rawLine.replace(/^[-•*]\s*/, ""),
      );

      if (
        point &&
        !currentSection.points.some(
          (item) =>
            item.toLowerCase() ===
            point.toLowerCase(),
        )
      ) {
        currentSection.points.push(point);
      }

      continue;
    }

    /* Section headings */

    const looksLikeHeading =
      /^(\d+[.)]\s*)?(constitutional|legislative|executive|military|foreign|introduction|overview|powers|functions|features|causes|effects|advantages|disadvantages|types|importance|definition|meaning)/i.test(
        line,
      );

    if (
      looksLikeHeading &&
      !line.includes(". ")
    ) {
      currentSection = {
        title: line.replace(
          /^\d+[.)]\s*/,
          "",
        ),
        points: [],
      };

      sections.push(currentSection);

      continue;
    }

    /* Important points heading */

    if (
      /important|key fact|मुख्य तथ्य|महत्वपूर्ण/i.test(
        line,
      )
    ) {
      continue;
    }

    /* Table-like content */

    if (line.includes("|")) {
      const cells = line
        .split("|")
        .map((cell) => cleanText(cell))
        .filter(Boolean);

      if (cells.length >= 2) {
        const heading = cells[0];

        const detail = cells
          .slice(1)
          .join(" — ");

        if (
          heading &&
          detail &&
          !/^क्षेत्र$/i.test(heading)
        ) {
          const section: NoteSection = {
            title: heading,
            points: [detail],
          };

          sections.push(section);
          currentSection = section;
        }

        continue;
      }
    }

    /* Normal content */

    if (
      line.length > 15 &&
      currentSection
    ) {
      if (
        !currentSection.points.some(
          (item) =>
            item.toLowerCase() ===
            line.toLowerCase(),
        )
      ) {
        currentSection.points.push(line);
      }

      continue;
    }

    /* Introduction */

    if (
      !introduction &&
      line.length > 30 &&
      !line.includes(":")
    ) {
      introduction = line;
    }
  }

  /* ===================================================
     FALLBACK SECTION
  =================================================== */

  if (sections.length === 0) {
    const fallbackPoints =
      extractBullets(source);

    if (fallbackPoints.length > 0) {
      sections.push({
        title: "मुख्य बातें",
        points: fallbackPoints.slice(0, 12),
      });
    }
  }

  /* ===================================================
     REMOVE DUPLICATE SECTIONS
  =================================================== */

  const uniqueSections =
    sections.filter(
      (section, index, array) => {
        const signature =
          section.title
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

        return (
          array.findIndex(
            (item) =>
              item.title
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim() === signature,
          ) === index
        );
      },
    );

  /* ===================================================
     IMPORTANT POINTS
  =================================================== */

  if (importantPoints.length === 0) {
    for (const section of uniqueSections) {
      for (const point of section.points) {
        if (importantPoints.length >= 5) {
          break;
        }

        if (
          point.length > 20 &&
          !importantPoints.some(
            (item) =>
              item.toLowerCase() ===
              point.toLowerCase(),
          )
        ) {
          importantPoints.push(point);
        }
      }

      if (importantPoints.length >= 5) {
        break;
      }
    }
  }

  /* ===================================================
     QUICK REVISION
  =================================================== */

  for (const section of uniqueSections) {
    if (quickRevision.length >= 6) {
      break;
    }

    const title = section.title.trim();

    if (
      title.length > 2 &&
      !quickRevision.some(
        (item) =>
          item.toLowerCase() ===
          title.toLowerCase(),
      )
    ) {
      quickRevision.push(title);
    }
  }

  return {
    topic,
    introduction,
    sections: uniqueSections.filter(
      (section) =>
        section.points.length > 0,
    ),
    importantPoints:
      importantPoints.slice(0, 6),
    examPoint,
    quickRevision:
      quickRevision.slice(0, 6),
    memoryTrick,
  };
}

/* =====================================================
   COMPONENT
===================================================== */

export function HandwrittenNotes() {
  const navigate = useNavigate();
  const location = useLocation();

  const [rawContent, setRawContent] =
    useState("");

  const [topic, setTopic] =
    useState("");

  /* ===================================================
     RECEIVE CONTENT FROM ASK VIDHYA
  =================================================== */

  useEffect(() => {
    const state =
      location.state as
        | {
            content?: string;
            topic?: string;
          }
        | null;

    const stored =
      sessionStorage.getItem(
        "ranker_bhaiya_handwritten_notes",
      );

    const content =
      state?.content ||
      stored ||
      "";

    const incomingTopic =
      state?.topic || "";

    setRawContent(content);
    setTopic(incomingTopic);

    if (content) {
      sessionStorage.setItem(
        "ranker_bhaiya_handwritten_notes",
        content,
      );
    }
  }, [location.state]);

  /* ===================================================
     PARSED NOTES
  =================================================== */

  const notes = useMemo(
    () =>
      parseNotes(
        rawContent || topic,
      ),
    [rawContent, topic],
  );

  /* ===================================================
     PRINT
  =================================================== */

  function handlePrint() {
    window.print();
  }

  /* ===================================================
     BACK
  =================================================== */

  function handleBack() {
    navigate("/student/ask");
  }

  /* ===================================================
     EMPTY STATE
  =================================================== */

  if (!rawContent && !topic) {
    return (
      <div className="min-h-screen bg-[#f6f1e7] px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-4xl">
            ✍️
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-900">
            No Notes Found
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Ask Vidhya se notes generate
            karne ke baad yahan handwritten
            notes appear honge.
          </p>

          <button
            type="button"
            onClick={handleBack}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            ← Ask Vidhya
          </button>
        </div>
      </div>
    );
  }

  /* ===================================================
     PAGE
  =================================================== */

  return (
    <div className="min-h-screen bg-[#e8e2d6] px-3 py-6 text-[#252525] print:bg-white print:px-0 print:py-0">

      {/* =================================================
          ACTION BAR
      ================================================= */}

      <div className="mx-auto mb-5 flex max-w-[900px] items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={handleBack}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          ← Ask Vidhya
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          🖨️ Download / Print PDF
        </button>
      </div>

      {/* =================================================
          NOTEBOOK PAGE
      ================================================= */}

      <main
        className="note-page relative mx-auto max-w-[900px] overflow-hidden bg-[#fffdf7] shadow-2xl print:max-w-none print:shadow-none"
        style={
          {
            "--line-height":
              "34px",
          } as CSSProperties
        }
      >

        {/* PAPER LINES */}

        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0px, transparent 33px, rgba(91,132,180,0.20) 34px)",
          }}
        />

        {/* LEFT RED MARGIN */}

        <div className="pointer-events-none absolute bottom-0 left-[58px] top-0 w-px bg-red-300/70" />

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="relative px-[82px] py-10">

          {/* =================================================
              BRANDING
          ================================================= */}

          <header className="border-b-2 border-blue-900/20 pb-5">
            <div className="flex items-start justify-between gap-4">

              <div>
                <div className="text-[24px] font-black tracking-[0.08em] text-blue-900">
                  RANKER BHAIYA
                </div>

                <div className="mt-1 text-[13px] font-bold tracking-[0.12em] text-slate-600">
                  ✍️ ASK VIDHYA
                </div>
              </div>

              <div className="rounded-full border-2 border-blue-900/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-900">
                Study Notes
              </div>

            </div>
          </header>

          {/* =================================================
              TOPIC
          ================================================= */}

          <section className="pt-7">
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
              Topic
            </div>

            <h1
              className="font-black text-slate-900"
              style={{
                fontSize:
                  notes.topic.length > 55
                    ? "28px"
                    : "34px",
                lineHeight: 1.25,
              }}
            >
              {notes.topic}
            </h1>

            <div className="mt-4 h-[3px] w-24 rounded-full bg-blue-700" />
          </section>

          {/* =================================================
              INTRODUCTION
          ================================================= */}

          {notes.introduction && (
            <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50/50 p-5">
              <h2 className="mb-2 text-lg font-black text-blue-900">
                परिचय
              </h2>

              <p className="text-[16px] font-medium leading-8">
                {notes.introduction}
              </p>
            </section>
          )}

          {/* =================================================
              MAIN SECTIONS
          ================================================= */}

          <section className="mt-8 space-y-7">
            {notes.sections.map(
              (section, index) => (
                <article
                  key={`${section.title}-${index}`}
                  className="relative"
                >
                  <div className="mb-3 flex items-start gap-3">

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-blue-700 text-sm font-black text-blue-800">
                      {String(
                        index + 1,
                      ).padStart(2, "0")}
                    </div>

                    <h2 className="pt-0.5 text-[21px] font-black text-slate-900">
                      {section.title}
                    </h2>

                  </div>

                  <div className="ml-11 space-y-2">
                    {section.points.map(
                      (
                        point,
                        pointIndex,
                      ) => (
                        <div
                          key={`${point}-${pointIndex}`}
                          className="flex items-start gap-3 text-[16px] font-medium leading-8"
                        >
                          <span className="mt-[11px] h-2 w-2 shrink-0 rounded-full bg-blue-700" />

                          <p className="flex-1">
                            {point}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </article>
              ),
            )}
          </section>

          {/* =================================================
              IMPORTANT POINTS
          ================================================= */}

          {notes.importantPoints.length >
            0 && (
            <section className="mt-10 rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-5">

              <div className="mb-4 flex items-center gap-2">
                <span className="text-xl">
                  ⭐
                </span>

                <h2 className="text-xl font-black text-amber-900">
                  Important Points
                </h2>
              </div>

              <div className="space-y-2">
                {notes.importantPoints.map(
                  (point, index) => (
                    <div
                      key={`${point}-${index}`}
                      className="flex items-start gap-3 text-[15px] font-semibold leading-7"
                    >
                      <span className="font-black text-amber-700">
                        •
                      </span>

                      <span>
                        {point}
                      </span>
                    </div>
                  ),
                )}
              </div>

            </section>
          )}

          {/* =================================================
              EXAM POINT
          ================================================= */}

          {notes.examPoint && (
            <section className="mt-7 rounded-2xl border-2 border-purple-300 bg-purple-50/60 p-5">

              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">
                  🎯
                </span>

                <h2 className="text-xl font-black text-purple-900">
                  Exam Point
                </h2>
              </div>

              <p className="text-[16px] font-semibold leading-8">
                {notes.examPoint}
              </p>

            </section>
          )}

          {/* =================================================
              QUICK REVISION
          ================================================= */}

          {notes.quickRevision.length >
            0 && (
            <section className="mt-7 rounded-2xl border-2 border-green-300 bg-green-50/60 p-5">

              <div className="mb-4 flex items-center gap-2">
                <span className="text-xl">
                  ⚡
                </span>

                <h2 className="text-xl font-black text-green-900">
                  Quick Revision
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {notes.quickRevision.map(
                  (item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className="rounded-full border border-green-300 bg-white px-3 py-1.5 text-sm font-bold text-green-800"
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>

            </section>
          )}

          {/* =================================================
              MEMORY TRICK
          ================================================= */}

          {notes.memoryTrick && (
            <section className="mt-7 rounded-2xl border-2 border-pink-300 bg-pink-50/60 p-5">

              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">
                  🧠
                </span>

                <h2 className="text-xl font-black text-pink-900">
                  Memory Trick
                </h2>
              </div>

              <p className="text-[16px] font-bold leading-8">
                {notes.memoryTrick}
              </p>

            </section>
          )}

          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="mt-12 border-t-2 border-blue-900/20 pt-5 text-center">

            <div className="text-sm font-black tracking-[0.12em] text-blue-900">
              RANKER BHAIYA
            </div>

            <div className="mt-1 text-xs font-semibold text-slate-500">
              Ask Vidhya • Smart Study • Better Revision
            </div>

          </footer>

        </div>
      </main>

      {/* =================================================
          PRINT + FONT CSS
      ================================================= */}

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          html,
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .note-page {
            width: 210mm;
            min-height: 297mm;
          }
        }

        .note-page {
          font-family:
            "Noto Sans Devanagari",
            "Nirmala UI",
            "Mangal",
            "Comic Sans MS",
            "Segoe Print",
            "Bradley Hand",
            sans-serif;
        }

        @media screen and (max-width: 700px) {
          .note-page > div.relative {
            padding-left: 72px;
            padding-right: 28px;
          }

          .note-page > div.absolute {
            left: 48px;
          }
        }
      `}</style>
    </div>
  );
}

export default HandwrittenNotes;
