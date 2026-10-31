export type DocumentId = string;
export type BlockId = string;
export type NotebookId = string;

export interface Notebook {
  id: NotebookId;
  name: string;
  closed?: boolean;
  icon?: string;
  sort?: number;
}

export interface DailyNote {
  id: string;
  dateStr: string;
  hasOpenTasks?: boolean;
}

export interface DayActivity {
  dateStr: string;
  blocks: number;
  hasOpenTasks?: boolean;
  id?: string;
}

export interface BlockRow {
  id: BlockId;
  box?: string;
  hpath?: string;
  ial?: string;
  type?: string;
  subtype?: string;
  content?: string;
  root_id?: string;
}

export interface SystemConfResponse {
  conf: {
    lang: string;
  };
}
