"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const successResponse = ({ res, message = "success", statusCode = 200, data, }) => {
    return res.status(statusCode).json({ message, data });
};
exports.default = successResponse;
