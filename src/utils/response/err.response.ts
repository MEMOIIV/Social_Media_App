import type { NextFunction, Request, Response } from "express";

export interface IError extends Error {
  statusCode: number;
}
export class ApplicationException extends Error {
  constructor(
    message: string,
    public statusCode: number,
    options?: ErrorOptions
  ) {
    super(message, options); // come from Error
    this.name = this.constructor.name;
    Error.captureStackTrace(this,this.constructor) // safety check options 
  }
}

// Custom Application Errors \
// BadRequest
export class BadRequestExceptions extends ApplicationException {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 400, options);
  }
}
// NotFound
export class NotFoundExceptions extends ApplicationException {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 404, options);
  }
}
// email already exists \ 
export class ConflictExceptions extends ApplicationException {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 409, options);
  }
}

// unAuthorized \ 
export class UnAuthorizedExceptions extends ApplicationException {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 401, options);
  }
}

// Forbidden \ 
export class ForbiddenExceptions extends ApplicationException {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 403, options);
  }
}

export const globalErrorHandler = (
  err: IError,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  return res.status(err.statusCode || 500).json({
    message: err.message || "something went wrong !!",
    stack: process.env.MOOD === "DEV" ? err.stack : undefined,
    cause: err.cause,
  });
};
