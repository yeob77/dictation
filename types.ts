export enum AppState {
  SETUP = 'SETUP',
  DICTATION = 'DICTATION',
  RESULTS = 'RESULTS',
}

export interface Dictation {
  originalWord: string;
  handwrittenImage: string; // base64 data URL
  isCorrect: boolean | null; // null: not graded, true: correct, false: incorrect
}
