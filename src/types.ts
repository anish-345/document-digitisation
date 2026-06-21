export interface Row {
  [key: string]: string;
}

export interface ExtractionResult {
  columns: string[];
  rows: Row[];
}

export interface ExportRequest {
  data: ExtractionResult;
  filename: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  filename: string;
  data: ExtractionResult;
  fileType: string;
}

export interface AnalysisResult {
  summary: string;
  metrics: {
    label: string;
    value: string;
    trend?: string;
  }[];
  chartData: {
    name: string;
    value: number;
  }[];
}
