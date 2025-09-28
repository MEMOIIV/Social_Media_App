"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = exports.ForbiddenExceptions = exports.UnAuthorizedExceptions = exports.ConflictExceptions = exports.NotFoundExceptions = exports.BadRequestExceptions = exports.ApplicationException = void 0;
class ApplicationException extends Error {
    statusCode;
    constructor(message, statusCode, options) {
        super(message, options);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApplicationException = ApplicationException;
class BadRequestExceptions extends ApplicationException {
    constructor(message, options) {
        super(message, 400, options);
    }
}
exports.BadRequestExceptions = BadRequestExceptions;
class NotFoundExceptions extends ApplicationException {
    constructor(message, options) {
        super(message, 404, options);
    }
}
exports.NotFoundExceptions = NotFoundExceptions;
class ConflictExceptions extends ApplicationException {
    constructor(message, options) {
        super(message, 409, options);
    }
}
exports.ConflictExceptions = ConflictExceptions;
class UnAuthorizedExceptions extends ApplicationException {
    constructor(message, options) {
        super(message, 401, options);
    }
}
exports.UnAuthorizedExceptions = UnAuthorizedExceptions;
class ForbiddenExceptions extends ApplicationException {
    constructor(message, options) {
        super(message, 403, options);
    }
}
exports.ForbiddenExceptions = ForbiddenExceptions;
const globalErrorHandler = (err, req, res, next) => {
    return res.status(err.statusCode || 500).json({
        message: err.message || "something went wrong !!",
        stack: process.env.MOOD === "DEV" ? err.stack : undefined,
        cause: err.cause,
    });
};
exports.globalErrorHandler = globalErrorHandler;
