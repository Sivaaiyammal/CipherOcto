/** A failure the client should see, with a stable machine-readable `code`. */
export class AppError extends Error {
  readonly status: number
  readonly code: string
  readonly extra: Record<string, unknown>

  constructor(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
    super(message)
    this.name = "AppError"
    this.status = status
    this.code = code
    this.extra = extra
  }
}

export const unauthenticated = (message = "Sign in to continue.") => new AppError(401, "unauthenticated", message)
export const forbidden = (message = "Your role doesn't allow this.", extra: Record<string, unknown> = {}) =>
  new AppError(403, "forbidden", message, extra)
export const notFound = (message = "Not found.") => new AppError(404, "not_found", message)
export const conflict = (code: string, message: string) => new AppError(409, code, message)
export const badRequest = (code: string, message: string) => new AppError(400, code, message)
