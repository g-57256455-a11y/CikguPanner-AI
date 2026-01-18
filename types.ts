export interface WeeklyPlanItem {
  minggu: number;
  tema: string;
  topik: string;
  bidangList?: string[]; // New: List of specific fields (e.g., ["Al-Quran", "Jawi", "Tasmik"])
  standardKandungan: string;
  standardPembelajaran: string;
  catatan?: string;
}

export interface DailyRPHRequest {
  weekItem: WeeklyPlanItem;
  day: string; // e.g., "Isnin", "Selasa"
  date?: string; // New: Date string YYYY-MM-DD
  className: string;
  time: string;
  selectedBidang?: string; // New: The specific field selected by the user
  additionalContext?: string; // New: User provided extra context
}

export interface SavedRPH {
  id: string;
  timestamp: number; // Date created/saved
  weekItem: WeeklyPlanItem;
  day: string;
  date?: string; // New
  className: string;
  time: string;
  content: string; // The Generated Markdown
  jawiContent?: string | null;
  selectedBidang?: string;
}

export enum AppView {
  INPUT_RPT = 'INPUT_RPT',
  WEEKLY_VIEW = 'WEEKLY_VIEW',
  CALENDAR_VIEW = 'CALENDAR_VIEW', // New View
}

export const DAYS_OF_WEEK = [
  "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat"
];