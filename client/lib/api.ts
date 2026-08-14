const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: { message: string; name?: string };
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Thin wrapper around fetch for calling the Server API.
 * Server responses always follow the { success, data } / { success, error }
 * shape (see server/src/common/utils/response.ts), so this unwraps that
 * consistently and throws ApiError on failure rather than making every
 * call site check response.ok manually.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = (await res.json()) as ApiResponse<T>;

  if (!body.success) {
    throw new ApiError(body.error.message, res.status);
  }

  return body.data;
}
