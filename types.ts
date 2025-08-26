export enum AppState {
  SETUP,
  DICTATION,
  RESULTS,
}

export interface Dictation {
  originalWord: string;
  handwrittenImage: string;
  isCorrect: boolean | null;
}

export interface SavedText {
  id: string;
  content: string;
}

