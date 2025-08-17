// Base API response structure
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Generic error response
export interface ApiError {
  message: string;
  errors: Record<string, string[]>;
  status: number;
}