export type NoteBlockType =
  | "definitions"
  | "bullets"
  | "diagram"
  | "flowchart"
  | "equation"
  | "exam_points"
  | "quick_revision"
  | "mnemonic";

export interface NotePoint {
  title?: string;
  text: string;
  hindi?: string;
}

export interface NoteDiagram {
  type: "plant-cell" | "chloroplast" | "generic";
  title: string;
  labels?: string[];
}

export interface NoteFlowStep {
  title: string;
  hindi?: string;
  description?: string;
  color?: "yellow" | "blue" | "green" | "pink";
}

export interface NoteEquation {
  equation: string;
  label?: string;
  parts?: {
    left?: string;
    middle?: string;
    right?: string;
  };
}

export interface HandwrittenNoteSection {
  id: string;
  heading: string;
  headingHindi?: string;
  type: NoteBlockType;

  points?: NotePoint[];

  diagram?: NoteDiagram;

  flow?: NoteFlowStep[];

  equation?: NoteEquation;

  items?: string[];

  mnemonic?: string;
}

export interface HandwrittenNotesData {
  title: string;
  titleHindi?: string;
  titleRoman?: string;

  subtitle?: string;

  sections: HandwrittenNoteSection[];

  footerTip?: string;

  generatedBy?: string;
}
