import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

interface NoteBlock {
  id: string;
  type:
    | "introduction"
    | "section"
    | "important"
    | "exam"
    | "quick"
    | "memory";
  title?: string;
  text?: string;
  points?: string[];
}

/* =====================================================
   CONSTANTS
===================================================== */

const STORAGE_KEY =
  "ranker_bhaiya_handwritten_notes";

const PAGE_CAPACITY = 1250;

/* =====================================================
   TEXT HELPERS
===================================================== */

function cleanText(
  value: string,
): string {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/`/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(
  items: string[],
): string[] {
  const seen = new Set<string>();

  return items.filter(
    (item) => {
      const value = cleanText(
        item,
      );

      if (!value) {
        return false;
      }

      const key =
        value.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    },
  );
}

/* =====================================================
   HEADING DETECTION
===================================================== */

function isHeading(
  raw: string,
): boolean {
  const line = cleanText(
    raw
      .replace(/^#+\s*/, "")
      .replace(/^\d+[.)]\s*/, ""),
  );

  if (!line) {
    return false;
  }

  if (
    line.length < 3 ||
    line.length > 85
  ) {
    return false;
  }

  if (
    /[.!?]$/.test(line)
  ) {
    return false;
  }

  if (
    line.split(/\s+/).length >
    12
  ) {
    return false;
  }

  if (
    /^(important points|key facts|exam point|exam tip|quick revision|memory trick|mnemonic)$/i.test(
      line,
    )
  ) {
    return false;
  }

  if (
    /^topic\s*:/i.test(
      line,
    ) ||
    /^title\s*:/i.test(
      line,
    )
  ) {
    return false;
  }

  if (
    /^#{1,6}\s+/.test(
      raw.trim(),
    )
  ) {
    return true;
  }

  if (
    /^\d+[.)]\s+/.test(
      raw.trim(),
    )
  ) {
    return true;
  }

  const commonHeading =
    /^(introduction|overview|background|definition|meaning|features|characteristics|importance|objectives|aims|types|classification|causes|effects|advantages|disadvantages|functions|powers|structure|composition|role|significance|examples|applications|process|stages|steps|problems|solutions|परिचय|परिभाषा|अर्थ|विशेषताएँ|महत्व|उद्देश्य|प्रकार|वर्गीकरण|कारण|प्रभाव|लाभ|हानियाँ|कार्य|शक्तियाँ|संरचना|भूमिका|उदाहरण|प्रक्रिया|चरण|समस्याएँ|समाधान)/i;

  if (
    commonHeading.test(
      line,
    )
  ) {
    return true;
  }

  /*
   * Short title-like lines.
   */
  if (
    line.length <= 55 &&
    line.split(/\s+/).length <= 7
  ) {
    return true;
  }

  return false;
}

/* =====================================================
   BULLET
===================================================== */

function isBullet(
  value: string,
): boolean {
  return /^[-*•◦▪●]\s+/.test(
    value.trim(),
  );
}

function cleanBullet(
  value: string,
): string {
  return cleanText(
    value
      .replace(
        /^[-*•◦▪●]\s*/,
        "",
      )
      .replace(
        /^\d+[.)]\s*/,
        "",
      ),
  );
}

/* =====================================================
   PARSER
===================================================== */

function parseNotes(
  rawContent: string,
): NoteData {
  const source =
    rawContent
      .replace(/\r/g, "")
      .trim();

  const lines =
    source
      .split("\n")
      .map(
        (line) =>
          line.trim(),
      )
      .filter(Boolean);

  let topic =
    "Handwritten Study Notes";

  /*
   * Topic
   */
  const topicLine =
    lines.find(
      (line) =>
        /^topic\s*:/i.test(
          line,
        ) ||
        /^title\s*:/i.test(
          line,
        ),
    );

  if (topicLine) {
    topic = cleanText(
      topicLine.replace(
        /^(topic|title)\s*:/i,
        "",
      ),
    );
  } else {
    const firstUseful =
      lines.find(
        (line) => {
          const clean =
            cleanText(
              line,
            );

          if (
            !clean ||
            clean.length < 3 ||
            clean.length > 100
          ) {
            return false;
          }

          if (
            /^ranker bhaiya$/i.test(
              clean,
            ) ||
            /^ask vidhya/i.test(
              clean,
            ) ||
            /^ai notes$/i.test(
              clean,
            )
          ) {
            return false;
          }

          if (
            isBullet(line)
          ) {
            return false;
          }

          return true;
        },
      );

    if (firstUseful) {
      topic =
        cleanText(
          firstUseful
            .replace(
              /^#+\s*/,
              "",
            )
            .replace(
              /^\d+[.)]\s*/,
              "",
            ),
        );
    }
  }

  const sections:
    NoteSection[] = [];

  let currentSection:
    | NoteSection
    | null = null;

  const importantPoints:
    string[] = [];

  const quickRevision:
    string[] = [];

  let examPoint = "";
  let memoryTrick = "";
  let introduction = "";

  /*
   * Parse content
   */
  for (
    const rawLine of lines
  ) {
    const line =
      cleanText(
        rawLine
          .replace(
            /^#+\s*/,
            "",
          )
          .replace(
            /^\|/,
            "",
          )
          .replace(
            /\|$/,
            "",
          ),
      );

    if (!line) {
      continue;
    }

    /*
     * Ignore branding.
     */
    if (
      /^ranker bhaiya$/i.test(
        line,
      ) ||
      /^ask vidhya/i.test(
        line,
      ) ||
      /^ai notes$/i.test(
        line,
      )
    ) {
      continue;
    }

    /*
     * Exam point
     */
    if (
      /^exam point\s*:/i.test(
        line,
      ) ||
      /^exam tip\s*:/i.test(
        line,
      )
    ) {
      const value =
        line.replace(
          /^exam (point|tip)\s*:\s*/i,
          "",
        );

      if (value) {
        examPoint =
          value;
      }

      continue;
    }

    /*
     * Memory trick
     */
    if (
      /^memory trick\s*:/i.test(
        line,
      ) ||
      /^mnemonic\s*:/i.test(
        line,
      )
    ) {
      const value =
        line.replace(
          /^(memory trick|mnemonic)\s*:\s*/i,
          "",
        );

      if (value) {
        memoryTrick =
          value;
      }

      continue;
    }

    /*
     * Special headings
     */
    if (
      /^important points\s*:?\s*$/i.test(
        line,
      ) ||
      /^key facts\s*:?\s*$/i.test(
        line,
      ) ||
      /^महत्वपूर्ण बिंदु\s*:?\s*$/i.test(
        line,
      )
    ) {
      continue;
    }

    if (
      /^quick revision\s*:?\s*$/i.test(
        line,
      )
    ) {
      continue;
    }

    /*
     * Bullet
     */
    if (
      isBullet(rawLine)
    ) {
      const point =
        cleanBullet(
          rawLine,
        );

      if (!point) {
        continue;
      }

      if (
        /^(important|key fact|मुख्य तथ्य|महत्वपूर्ण)/i.test(
          point,
        )
      ) {
        importantPoints.push(
          point.replace(
            /^(important|key fact|मुख्य तथ्य|महत्वपूर्ण)\s*:?\s*/i,
            "",
          ),
        );

        continue;
      }

      if (
        currentSection
      ) {
        currentSection.points.push(
          point,
        );
      } else {
        importantPoints.push(
          point,
        );
      }

      continue;
    }

    /*
     * Heading
     */
    if (
      isHeading(rawLine)
    ) {
      const heading =
        cleanText(
          line.replace(
            /^\d+[.)]\s*/,
            "",
          ),
        );

      if (
        /^important points$/i.test(
          heading,
        ) ||
        /^quick revision$/i.test(
          heading,
        ) ||
        /^exam point$/i.test(
          heading,
        ) ||
        /^memory trick$/i.test(
          heading,
        )
      ) {
        continue;
      }

      currentSection = {
        title:
          heading,
        points: [],
      };

      sections.push(
        currentSection,
      );

      continue;
    }

    /*
     * Table-like content
     */
    if (
      rawLine.includes("|")
    ) {
      const cells =
        rawLine
          .split("|")
          .map(
            (cell) =>
              cleanText(
                cell,
              ),
          )
          .filter(Boolean);

      if (
        cells.length >= 2
      ) {
        const heading =
          cells[0];

        const detail =
          cells
            .slice(1)
            .join(" — ");

        if (
          heading &&
          detail &&
          !/^[-:]+$/.test(
            heading,
          )
        ) {
          currentSection = {
            title:
              heading,
            points: [
              detail,
            ],
          };

          sections.push(
            currentSection,
          );
        }

        continue;
      }
    }

    /*
     * Normal content
     */
    if (
      line.length > 20
    ) {
      if (
        currentSection
      ) {
        currentSection.points.push(
          line,
        );
      } else if (
        !introduction
      ) {
        introduction =
          line;
      } else {
        introduction +=
          ` ${line}`;
      }
    }
  }

  /*
   * Clean sections.
   */
  const cleanSections =
    sections
      .map(
        (section) => ({
          title:
            cleanText(
              section.title,
            ),
          points:
            uniqueStrings(
              section.points,
            ),
        }),
      )
      .filter(
        (section) =>
          section.title &&
          section.points
            .length > 0,
      );

  /*
   * If no sections were detected,
   * create one natural section.
   */
  if (
    cleanSections.length === 0
  ) {
    const fallback =
      lines
        .map(
          (line) =>
            cleanText(
              line,
            ),
        )
        .filter(
          (line) =>
            line.length >
              20 &&
            line !== topic &&
            !isBullet(line),
        )
        .slice(0, 12);

    if (
      fallback.length > 0
    ) {
      cleanSections.push({
        title:
          "मुख्य बातें",
        points:
          fallback,
      });
    }
  }

  /*
   * Important points fallback.
   */
  if (
    importantPoints.length ===
    0
  ) {
    for (
      const section of cleanSections
    ) {
      for (
        const point of section.points
      ) {
        if (
          importantPoints.length >=
          6
        ) {
          break;
        }

        importantPoints.push(
          point,
        );
      }

      if (
        importantPoints.length >=
        6
      ) {
        break;
      }
    }
  }

  /*
   * Quick revision:
   * only section names, no artificial numbering.
   */
  for (
    const section of cleanSections
  ) {
    if (
      quickRevision.length >=
      6
    ) {
      break;
    }

    if (
      section.title &&
      !quickRevision.some(
        (item) =>
          item.toLowerCase() ===
          section.title.toLowerCase(),
      )
    ) {
      quickRevision.push(
        section.title,
      );
    }
  }

  return {
    topic:
      topic ||
      "Handwritten Study Notes",

    introduction:
      introduction ||
      undefined,

    sections:
      cleanSections,

    importantPoints:
      uniqueStrings(
        importantPoints,
      ).slice(0, 6),

    examPoint:
      examPoint ||
      undefined,

    quickRevision:
      uniqueStrings(
        quickRevision,
      ).slice(0, 6),

    memoryTrick:
      memoryTrick ||
      undefined,
  };
}

/* =====================================================
   PAGE BLOCKS
===================================================== */

function blockWeight(
  block: NoteBlock,
): number {
  if (
    block.type === "section"
  ) {
    return (
      190 +
      (
        block.points?.join(
          "",
        ).length ?? 0
      )
    );
  }

  if (
    block.type ===
    "introduction"
  ) {
    return (
      200 +
      (
        block.text?.length ??
        0
      )
    );
  }

  if (
    block.type ===
    "important"
  ) {
    return (
      220 +
      (
        block.points?.join(
          "",
        ).length ?? 0
      )
    );
  }

  if (
    block.type === "exam"
  ) {
    return (
      180 +
      (
        block.text?.length ??
        0
      )
    );
  }

  if (
    block.type === "quick"
  ) {
    return 180;
  }

  if (
    block.type === "memory"
  ) {
    return (
      180 +
      (
        block.text?.length ??
        0
      )
    );
  }

  return 150;
}

/* =====================================================
   CREATE A4 PAGES
===================================================== */

function createPages(
  notes: NoteData,
): NoteBlock[][] {
  const blocks:
    NoteBlock[] = [];

  if (
    notes.introduction
  ) {
    blocks.push({
      id:
        "introduction",
      type:
        "introduction",
      title:
        "परिचय",
      text:
        notes.introduction,
    });
  }

  notes.sections.forEach(
    (
      section,
      index,
    ) => {
      blocks.push({
        id:
          `section-${index}`,
        type:
          "section",
        title:
          section.title,
        points:
          section.points,
      });
    },
  );

  if (
    notes.importantPoints
      .length > 0
  ) {
    blocks.push({
      id:
        "important",
      type:
        "important",
      title:
        "Important Points",
      points:
        notes.importantPoints,
    });
  }

  if (
    notes.examPoint
  ) {
    blocks.push({
      id:
        "exam",
      type:
        "exam",
      title:
        "Exam Point",
      text:
        notes.examPoint,
    });
  }

  if (
    notes.quickRevision
      .length > 0
  ) {
    blocks.push({
      id:
        "quick",
      type:
        "quick",
      title:
        "Quick Revision",
      points:
        notes.quickRevision,
    });
  }

  if (
    notes.memoryTrick
  ) {
    blocks.push({
      id:
        "memory",
      type:
        "memory",
      title:
        "Memory Trick",
      text:
        notes.memoryTrick,
    });
  }

  const pages:
    NoteBlock[][] = [];

  let current:
    NoteBlock[] = [];

  let weight = 0;

  for (
    const block of blocks
  ) {
    const blockSize =
      blockWeight(
        block,
      );

    if (
      current.length > 0 &&
      weight +
        blockSize >
        PAGE_CAPACITY
    ) {
      pages.push(
        current,
      );

      current = [];
      weight = 0;
    }

    current.push(
      block,
    );

    weight +=
      blockSize;
  }

  if (
    current.length > 0
  ) {
    pages.push(
      current,
    );
  }

  if (
    pages.length === 0
  ) {
    pages.push([]);
  }

  return pages;
}

/* =====================================================
   PAGE HEADER
===================================================== */

function PageHeader() {
  return (
    <header className="relative z-10 border-b-2 border-blue-900/20 pb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[24px] font-black tracking-[0.08em] text-blue-900">
            RANKER BHAIYA
          </div>

          <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
            Aapki Mehnat, Hamari Strategy.
          </div>

          <div className="mt-2 inline-flex rounded-full bg-purple-100 px-3 py-1 text-[10px] font-black tracking-wide text-purple-800">
            ✍️ ASK VIDHYA
          </div>
        </div>

        <div className="rounded-2xl border-2 border-blue-900/20 bg-white/70 px-3 py-2 text-right">
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            AI
          </div>

          <div className="text-[11px] font-black text-blue-900">
            STUDY NOTES
          </div>
        </div>
      </div>
    </header>
  );
}

/* =====================================================
   BLOCK RENDERER
===================================================== */

function NoteBlockView({
  block,
}: {
  block: NoteBlock;
}) {
  if (
    block.type ===
    "introduction"
  ) {
    return (
      <section className="rounded-[18px] border border-blue-200 bg-blue-50/70 p-4">
        <h2 className="mb-2 text-[19px] font-black text-blue-900">
          {block.title}
        </h2>

        <p className="text-[14px] font-semibold leading-7 text-slate-800">
          {block.text}
        </p>
      </section>
    );
  }

  if (
    block.type ===
    "section"
  ) {
    return (
      <section className="relative">
        <div className="mb-2">
          <h2 className="inline-block border-b-[3px] border-blue-500/60 pb-1 text-[20px] font-black leading-7 text-slate-900">
            {block.title}
          </h2>
        </div>

        <div className="space-y-1.5 pl-2">
          {block.points?.map(
            (
              point,
              index,
            ) => (
              <div
                key={`${point}-${index}`}
                className="flex items-start gap-3 text-[14px] font-semibold leading-7 text-slate-800"
              >
                <span className="mt-[10px] h-2 w-2 shrink-0 rounded-full bg-blue-600" />

                <p className="flex-1">
                  {point}
                </p>
              </div>
            ),
          )}
        </div>
      </section>
    );
  }

  if (
    block.type ===
    "important"
  ) {
    return (
      <section className="relative overflow-hidden rounded-[20px] border-2 border-amber-300 bg-amber-50/85 p-4">
        <div className="absolute -right-5 -top-5 h-16 w-16 rounded-full bg-amber-200/40" />

        <div className="relative mb-3 flex items-center gap-2">
          <span className="text-xl">
            ⭐
          </span>

          <h2 className="text-[19px] font-black text-amber-900">
            Important Points
          </h2>
        </div>

        <div className="relative space-y-1.5">
          {block.points?.map(
            (
              point,
              index,
            ) => (
              <div
                key={`${point}-${index}`}
                className="flex items-start gap-2 text-[13px] font-bold leading-6 text-amber-950"
              >
                <span>
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
    );
  }

  if (
    block.type ===
    "exam"
  ) {
    return (
      <section className="relative rounded-[20px] border-2 border-purple-300 bg-purple-50/80 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xl">
            🎯
          </span>

          <h2 className="text-[19px] font-black text-purple-900">
            Exam Point
          </h2>
        </div>

        <p className="text-[14px] font-bold leading-7 text-purple-950">
          {block.text}
        </p>
      </section>
    );
  }

  if (
    block.type ===
    "quick"
  ) {
    return (
      <section className="rounded-[20px] border-2 border-green-300 bg-green-50/80 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xl">
            ⚡
          </span>

          <h2 className="text-[19px] font-black text-green-900">
            Quick Revision
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {block.points?.map(
            (
              item,
              index,
            ) => (
              <span
                key={`${item}-${index}`}
                className="rounded-full border border-green-300 bg-white px-3 py-1.5 text-[11px] font-black text-green-800 shadow-sm"
              >
                {item}
              </span>
            ),
          )}
        </div>
      </section>
    );
  }

  if (
    block.type ===
    "memory"
  ) {
    return (
      <section className="rounded-[20px] border-2 border-pink-300 bg-pink-50/80 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xl">
            🧠
          </span>

          <h2 className="text-[19px] font-black text-pink-900">
            Memory Trick
          </h2>
        </div>

        <p className="text-[14px] font-bold leading-7 text-pink-950">
          {block.text}
        </p>
      </section>
    );
  }

  return null;
}

/* =====================================================
   A4 PAGE
===================================================== */

function A4Page({
  topic,
  blocks,
  pageNumber,
  totalPages,
}: {
  topic: string;
  blocks: NoteBlock[];
  pageNumber: number;
  totalPages: number;
}) {
  return (
    <section className="note-page relative mx-auto flex h-[297mm] min-h-[297mm] w-[210mm] max-w-full flex-col overflow-hidden bg-[#fffdf7]">
      {/* Paper */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, rgba(74,122,177,0.14) 32px)",
        }}
      />

      {/* Left red margin */}
      <div className="pointer-events-none absolute bottom-0 left-[17mm] top-0 w-[1px] bg-red-300/60" />

      {/* Decorative dots */}
      <div className="pointer-events-none absolute right-[9mm] top-[10mm] text-[12px] font-black tracking-[6px] text-blue-900/15">
        ✦ ✎ ✦
      </div>

      {/* Actual content */}
      <div className="relative z-10 flex min-h-[297mm] flex-1 flex-col px-[20mm] pb-[11mm] pl-[25mm] pt-[11mm]">
        <PageHeader />

        {/* Topic */}
        <div className="mt-5 border-b border-blue-900/10 pb-4">
          <div className="mb-1 text-[9px] font-black uppercase tracking-[0.2em] text-blue-600">
            Topic
          </div>

          <h1
            className="font-black leading-tight text-slate-900"
            style={{
              fontSize:
                topic.length > 60
                  ? "22px"
                  : "28px",
            }}
          >
            {topic}
          </h1>

          <div className="mt-2 h-[3px] w-20 rounded-full bg-blue-600" />
        </div>

        {/* Content */}
        <div className="mt-5 flex flex-1 flex-col gap-5">
          {blocks.map(
            (block) => (
              <NoteBlockView
                key={block.id}
                block={block}
              />
            ),
          )}
        </div>

        {/* Footer */}
        <footer className="relative z-10 mt-5 border-t-2 border-blue-900/15 pt-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-black tracking-[0.12em] text-blue-900">
                RANKER BHAIYA
              </div>

              <div className="mt-0.5 text-[8px] font-semibold text-slate-500">
                Generated by Ask Vidhya · Ranker Bhaiya
              </div>
            </div>

            <div className="rounded-full bg-blue-50 px-3 py-1 text-[9px] font-black text-blue-800">
              Page {pageNumber} /{" "}
              {totalPages}
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
}

/* =====================================================
   MAIN COMPONENT
===================================================== */

export function HandwrittenNotes() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    rawContent,
    setRawContent,
  ] = useState("");

  const [
    topic,
    setTopic,
  ] = useState("");

  const [
    pdfLoading,
    setPdfLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* ===================================================
     RECEIVE NOTES
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
        STORAGE_KEY,
      );

    const content =
      state?.content ||
      stored ||
      "";

    const incomingTopic =
      state?.topic ||
      "";

    setRawContent(
      content,
    );

    setTopic(
      incomingTopic,
    );

    if (content) {
      sessionStorage.setItem(
        STORAGE_KEY,
        content,
      );
    }
  }, [
    location.state,
  ]);

  /* ===================================================
     PARSE
  =================================================== */

  const notes =
    useMemo(
      () =>
        parseNotes(
          rawContent ||
            topic,
        ),
      [
        rawContent,
        topic,
      ],
    );

  /* ===================================================
     A4 PAGES
  =================================================== */

  const pages =
    useMemo(
      () =>
        createPages(
          notes,
        ),
      [notes],
    );

  /* ===================================================
     BACK
  =================================================== */

  function handleBack() {
    navigate(
      "/student/ask",
    );
  }

  /* ===================================================
     PDF
  =================================================== */

  async function handleDownloadPDF() {
    setError("");
    setPdfLoading(true);

    try {
      /*
       * Wait one frame so fonts/layout
       * are completely rendered.
       */
      await new Promise<void>(
        (resolve) =>
          requestAnimationFrame(
            () =>
              resolve(),
          ),
      );

      const pageElements =
        Array.from(
          document.querySelectorAll(
            ".note-page",
          ),
        ) as HTMLElement[];

      if (
        pageElements.length ===
        0
      ) {
        throw new Error(
          "No A4 pages found.",
        );
      }

      const pdf =
        new jsPDF({
          orientation:
            "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        });

      for (
        let index = 0;
        index <
        pageElements.length;
        index++
      ) {
        const page =
          pageElements[
            index
          ];

        const canvas =
          await html2canvas(
            page,
            {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor:
                "#fffdf7",
              logging: false,
              width:
                page.offsetWidth,
              height:
                page.offsetHeight,
            },
          );

        const image =
          canvas.toDataURL(
            "image/jpeg",
            0.96,
          );

        if (
          index > 0
        ) {
          pdf.addPage(
            "a4",
            "portrait",
          );
        }

        pdf.addImage(
          image,
          "JPEG",
          0,
          0,
          210,
          297,
          undefined,
          "FAST",
        );
      }

      const safeTopic =
        notes.topic
          .replace(
            /[^a-zA-Z0-9\u0900-\u097F]+/g,
            "-",
          )
          .replace(
            /^-+|-+$/g,
            "",
          )
          .slice(
            0,
            70,
          ) ||
        "Handwritten-Notes";

      pdf.save(
        `${safeTopic}-Ranker-Bhaiya.pdf`,
      );
    } catch (err) {
      console.error(
        "PDF generation error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "PDF generate nahi ho paya.",
      );
    } finally {
      setPdfLoading(false);
    }
  }

  /* ===================================================
     EMPTY
  =================================================== */

  if (
    !rawContent &&
    !topic
  ) {
    return (
      <div className="min-h-screen bg-[#f6f1e7] px-4 py-10">
        <div className="mx-auto max-w-xl rounded-[28px] bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-4xl">
            ✍️
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-900">
            No Notes Found
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Ask Vidhya se handwritten
            notes generate karne ke
            baad yahan notes appear
            honge.
          </p>

          <button
            type="button"
            onClick={
              handleBack
            }
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            ← Ask Vidhya
          </button>
        </div>
      </div>
    );
  }

  /* ===================================================
     MAIN
  =================================================== */

  return (
    <div className="min-h-screen bg-[#ddd6ca] px-3 py-6 print:bg-white print:px-0 print:py-0">
      {/* Action bar */}
      <div className="mx-auto mb-5 flex max-w-[210mm] items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={
            handleBack
          }
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          ← Ask Vidhya
        </button>

        <button
          type="button"
          disabled={
            pdfLoading
          }
          onClick={() => {
            void handleDownloadPDF();
          }}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pdfLoading
            ? "⏳ Creating PDF..."
            : "📄 Download PDF"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-auto mb-5 max-w-[210mm] rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 print:hidden">
          {error}
        </div>
      )}

      {/* A4 pages */}
      <div
        id="handwritten-notes-pages"
        className="space-y-8 print:space-y-0"
      >
        {pages.map(
          (
            page,
            index,
          ) => (
            <A4Page
              key={`page-${index}`}
              topic={
                notes.topic
              }
              blocks={page}
              pageNumber={
                index + 1
              }
              totalPages={
                pages.length
              }
            />
          ),
        )}
      </div>

      {/* =================================================
          RESPONSIVE + PRINT CSS
      ================================================= */}

      <style>{`
        @page {
          size: A4 portrait;
          margin: 0;
        }

        .note-page {
          box-sizing: border-box;
          width: 210mm;
          height: 297mm;
          min-height: 297mm;
          max-height: 297mm;
        }

        .note-page,
        .note-page * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .note-page article,
        .note-page section {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        @media print {
          html,
          body {
            width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .note-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            box-shadow: none !important;
          }

          .note-page + .note-page {
            break-before: page !important;
            page-break-before: always !important;
          }
        }

        .note-page {
          font-family:
            "Segoe Print",
            "Comic Sans MS",
            "Bradley Hand",
            "Noto Sans Devanagari",
            "Noto Sans",
            cursive;
        }

        @media screen and (max-width: 700px) {
          .note-page {
            width: 100%;
            height: auto;
            min-height: 0;
            max-height: none;
          }

          .note-page > div.relative {
            min-height: 0;
            padding-left: 65px;
            padding-right: 25px;
          }

          .note-page > div.absolute {
            left: 45px;
          }
        }
      `}</style>
    </div>
  );
}

export default HandwrittenNotes;
