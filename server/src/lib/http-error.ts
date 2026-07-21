/**
 * An error with an HTTP status. Services and middleware throw these;
 * the central error handler translates them into responses. Keeps
 * `res.status(...)` calls out of business logic entirely.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
