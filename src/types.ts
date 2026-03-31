export interface ServerConfig {
  url: string;
  id: string;
  pw: string;
  model: string;
}

export interface ScannedItem {
  id: string;
  base64: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  results?: any; // Will use MeterData from apiService
  error?: string;
  saved: boolean;
}
