"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authentication = void 0;
const err_response_1 = require("../utils/response/err.response");
const token_utils_1 = require("../utils/security/token.utils");
const authentication = (accessRole = [], tokenType = token_utils_1.TokenEnum.access) => {
    return async (req, res, next) => {
        if (!req.headers.authorization)
            throw new err_response_1.BadRequestExceptions("Missing Authorization");
        const { decoded, user } = await (0, token_utils_1.decodeToken)({
            authorization: req.headers.authorization,
            tokenType
        });
        if (!accessRole.includes(user.role))
            throw new err_response_1.ForbiddenExceptions("You are not authorized to access this route");
        req.user = user;
        req.decoded = decoded;
        next();
    };
};
exports.authentication = authentication;
