import type {
  HandwrittenNoteSection,
  HandwrittenNotesData,
  NoteFlowStep,
} from "../../types/handwrittenNotes";

interface Props {
  notes: HandwrittenNotesData;
}

function FlowBox({
  step,
}: {
  step: NoteFlowStep;
}) {
  const colorClass =
    step.color === "yellow"
      ? "hw-flow-yellow"
      : step.color === "green"
        ? "hw-flow-green"
        : step.color === "pink"
          ? "hw-flow-pink"
          : "hw-flow-blue";

  return (
    <div className={`hw-flow-box ${colorClass}`}>
      <div className="hw-flow-title">
        {step.title}
      </div>

      {step.hindi && (
        <div className="hw-flow-hindi">
          {step.hindi}
        </div>
      )}

      {step.description && (
        <div className="hw-flow-description">
          {step.description}
        </div>
      )}
    </div>
  );
}

function PlantCellDiagram() {
  return (
    <div className="hw-plant-diagram">
      <div className="hw-plant-title">
        Plant Cell
      </div>

      <div className="hw-plant-cell">
        <div className="hw-cell-nucleus">
          <span />
        </div>

        <div className="hw-chloroplast hw-c1" />
        <div className="hw-chloroplast hw-c2" />
        <div className="hw-chloroplast hw-c3" />
        <div className="hw-chloroplast hw-c4" />

        <div className="hw-cell-label hw-label-wall">
          Cell Wall
        </div>

        <div className="hw-cell-label hw-label-nucleus">
          Nucleus
        </div>

        <div className="hw-cell-label hw-label-chloro">
          Chloroplasts
        </div>
      </div>
    </div>
  );
}

function ChloroplastDiagram() {
  return (
    <div className="hw-chloroplast-diagram">
      <div className="hw-chloro-title">
        Chloroplasts
      </div>

      <div className="hw-chloro-body">
        <div className="hw-thylakoid-stack">
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="hw-thylakoid-stack second">
          <span />
          <span />
          <span />
          <span />
        </div>

        <div className="hw-stroma-label">
          Stroma
        </div>
      </div>

      <div className="hw-chloro-label">
        Thylakoids
      </div>
    </div>
  );
}

function GenericDiagram({
  title,
  labels = [],
}: {
  title: string;
  labels?: string[];
}) {
  return (
    <div className="hw-generic-diagram">
      <div className="hw-generic-title">
        {title}
      </div>

      <div className="hw-generic-visual">
        <div className="hw-generic-circle">
          ✦
        </div>

        <div className="hw-generic-arrows">
          <span>→</span>
          <span>→</span>
        </div>
      </div>

      {labels.length > 0 && (
        <div className="hw-generic-labels">
          {labels.map((label, index) => (
            <span key={`${label}-${index}`}>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Diagram({
  section,
}: {
  section: HandwrittenNoteSection;
}) {
  if (!section.diagram) {
    return null;
  }

  if (section.diagram.type === "plant-cell") {
    return <PlantCellDiagram />;
  }

  if (section.diagram.type === "chloroplast") {
    return <ChloroplastDiagram />;
  }

  return (
    <GenericDiagram
      title={section.diagram.title}
      labels={section.diagram.labels}
    />
  );
}

function Section({
  section,
}: {
  section: HandwrittenNoteSection;
}) {
  return (
    <section className="hw-section">
      <div className="hw-section-heading">
        <span className="hw-section-number">
          {section.id}
        </span>

        <span>
          {section.heading}
          {section.headingHindi && (
            <>
              {" "}
              /{" "}
              <span className="hw-hindi">
                {section.headingHindi}
              </span>
            </>
          )}
        </span>
      </div>

      {section.type === "definitions" &&
        section.points && (
          <div className="hw-definition-list">
            {section.points.map(
              (point, index) => (
                <div
                  className="hw-definition"
                  key={index}
                >
                  <span className="hw-dot">
                    ●
                  </span>

                  <div>
                    <div className="hw-point-text">
                      {point.title && (
                        <strong>
                          {point.title}:{" "}
                        </strong>
                      )}

                      {point.text}
                    </div>

                    {point.hindi && (
                      <div className="hw-hindi-line">
                        {point.hindi}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        )}

      {section.type === "bullets" &&
        section.points && (
          <div className="hw-bullet-list">
            {section.points.map(
              (point, index) => (
                <div
                  className="hw-bullet"
                  key={index}
                >
                  <span>•</span>

                  <div>
                    <div>
                      {point.title && (
                        <strong>
                          {point.title}:{" "}
                        </strong>
                      )}
                      {point.text}
                    </div>

                    {point.hindi && (
                      <div className="hw-hindi-line">
                        {point.hindi}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        )}

      {section.type === "diagram" && (
        <Diagram section={section} />
      )}

      {section.type === "flowchart" &&
        section.flow && (
          <div className="hw-flow">
            {section.flow.map(
              (step, index) => (
                <div
                  className="hw-flow-item"
                  key={index}
                >
                  <FlowBox step={step} />

                  {index <
                    section.flow!.length -
                      1 && (
                    <div className="hw-flow-arrow">
                      →
                    </div>
                  )}
                </div>
              ),
            )}
          </div>
        )}

      {section.type === "equation" &&
        section.equation && (
          <div className="hw-equation-box">
            <div className="hw-equation-heading">
              {section.equation.label ??
                "Chemical Equation"}
            </div>

            <div className="hw-equation">
              {section.equation.equation}
            </div>
          </div>
        )}

      {section.type === "exam_points" &&
        section.items && (
          <div className="hw-exam-box">
            <div className="hw-exam-heading">
              ⭐ Important Points for Exams
            </div>

            {section.items.map(
              (item, index) => (
                <div
                  className="hw-exam-item"
                  key={index}
                >
                  <span>✓</span>
                  <span>{item}</span>
                </div>
              ),
            )}
          </div>
        )}

      {section.type ===
        "quick_revision" &&
        section.items && (
          <div className="hw-revision-box">
            <div className="hw-revision-heading">
              💡 Quick Revision / झटपट याद रखें
            </div>

            {section.items.map(
              (item, index) => (
                <div
                  className="hw-revision-item"
                  key={index}
                >
                  <span>✓</span>
                  <span>{item}</span>
                </div>
              ),
            )}
          </div>
        )}

      {section.type === "mnemonic" &&
        section.mnemonic && (
          <div className="hw-mnemonic">
            <div className="hw-mnemonic-label">
              Memory Trick
            </div>

            <div>
              {section.mnemonic}
            </div>
          </div>
        )}
    </section>
  );
}

export default function HandwrittenNotesRenderer({
  notes,
}: Props) {
  return (
    <div className="hw-renderer-wrapper">
      <div className="hw-page">
        {/* TOP BRANDING */}
        <header className="hw-brand-header">
          <div className="hw-ranker-brand">
            <div className="hw-brand-icon">
              🎓
            </div>

            <div>
              <div className="hw-brand-name">
                RANKER BHAIYA
              </div>

              <div className="hw-brand-tagline">
                Better Students → Brighter Future
              </div>
            </div>
          </div>

          <div className="hw-vidhya-brand">
            <div className="hw-vidhya-icon">
              🤖
            </div>

            <div>
              <div className="hw-vidhya-name">
                Ask Vidhya ✨
              </div>

              <div className="hw-vidhya-tagline">
                Your AI Learning Assistant
              </div>
            </div>
          </div>
        </header>

        {/* TITLE */}
        <div className="hw-title-area">
          <h1>
            {notes.title}
            {notes.titleHindi && (
              <>
                {" "}
                /{" "}
                {notes.titleHindi}
              </>
            )}
          </h1>

          {notes.titleRoman && (
            <div className="hw-title-roman">
              ({notes.titleRoman})
            </div>
          )}

          {notes.subtitle && (
            <div className="hw-subtitle">
              {notes.subtitle}
            </div>
          )}
        </div>

        {/* CONTENT */}
        <main className="hw-content">
          {notes.sections.map(
            (section) => (
              <Section
                section={section}
                key={section.id}
              />
            ),
          )}
        </main>

        {/* FOOTER TIP */}
        {notes.footerTip && (
          <div className="hw-footer-tip">
            💡 {notes.footerTip}
          </div>
        )}

        {/* FOOTER BRAND */}
        <footer className="hw-footer">
          <span>
            🤖 Generated by Ask Vidhya
          </span>

          <span>•</span>

          <strong>
            Ranker Bhaiya
          </strong>

          <span>♥</span>
        </footer>
      </div>
    </div>
  );
}
