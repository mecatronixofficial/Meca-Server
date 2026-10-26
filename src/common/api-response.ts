export interface ApiResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
}

/** Standard success envelope used by every endpoint: `{ success, message, data? }`. */
export const ok = <T>(message: string, data?: T): ApiResponse<T> =>
  data === undefined ? { success: true, message } : { success: true, message, data };
