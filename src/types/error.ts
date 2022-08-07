export interface AppError {
  xref: string;
  status: number;
  message: string;
  title?: string;
  data?: object;
  cause?: any;
  timestamp: number;
  severity: string;
  debug?: string;
}
