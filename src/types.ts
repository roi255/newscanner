/* Shared view-model types for the screen layer. */
export interface SessionVM {
  code: string;
  name: string;
  venue: string;
  date: string;
  time: string;
  course: string;
  institution: string;
  invigilator: string;
  invigilatorRole: string;
  currency: string;
  examCategory?: string;
  semester?: string;
}
