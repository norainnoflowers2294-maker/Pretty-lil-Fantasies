export type JournalSection = 'prompts' | 'ideas' | 'diary';
export type JournalPaper = 'graph' | 'floral' | 'lined' | 'plain';

export interface JournalPage {
  id: string;
  section: JournalSection;
  title: string;
  paper: JournalPaper;
  body: string;
  stickers: string[];
  images: string[];
  updatedAt: string;
}
