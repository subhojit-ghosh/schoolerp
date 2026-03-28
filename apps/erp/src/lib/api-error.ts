/**
 * Shared API error extraction for the ERP app.
 *
 * Every mutation error handler should use these utilities
 * so users never see raw JS/HTTP error strings.
 */

/**
 * Extract a human-readable message from an API error.
 *
 * Handles:
 *  - NestJS error responses with `message` string
 *  - NestJS validation errors with `message` string[]
 *  - Standard Error instances
 *  - Unknown shapes (falls back to `fallback`)
 */
export function extractApiError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error == null) return fallback;

  if (typeof error === "string") return error;

  if (typeof error === "object" && "message" in error) {
    const msg = (error as { message: unknown }).message;

    // NestJS validation pipes return message as string[]
    if (Array.isArray(msg)) {
      const first = msg.find((m) => typeof m === "string");
      return first ?? fallback;
    }

    if (typeof msg === "string" && msg.length > 0) {
      return msg;
    }
  }

  // Axios/fetch wrappers sometimes nest the response body
  if (typeof error === "object" && "body" in error) {
    const body = (error as { body: unknown }).body;
    return extractApiError(body, fallback);
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

/**
 * Type-guard: is this a NestJS-style error with a statusCode?
 */
export function isApiError(
  error: unknown,
): error is { statusCode: number; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    "message" in error
  );
}
