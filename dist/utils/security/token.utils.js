"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeToken = exports.decodeToken = exports.createLoginCredentials = exports.getSignature = exports.getSignatureLevel = exports.TokenEnum = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const User_model_1 = require("../../DB/models/User.model");
const err_response_1 = require("../response/err.response");
const user_db_repository_1 = require("../../DB/repositories/user.db.repository");
const uuid_1 = require("uuid");
const token_model_1 = require("../../DB/models/token.model");
const token_db_repository_1 = require("../../DB/repositories/token.db.repository");
const generateToken = async ({ payload, secretKey = process.env.ACCESS_USER_SIGNATURE, options = { expiresIn: Number(process.env.ACCESS_EXPIRES_IN) }, }) => {
    return await (0, jsonwebtoken_1.sign)(payload, secretKey, options);
};
exports.generateToken = generateToken;
const verifyToken = async ({ token, secretKey = process.env.ACCESS_USER_SIGNATURE, }) => {
    return (await (0, jsonwebtoken_1.verify)(token, secretKey));
};
exports.verifyToken = verifyToken;
var TokenEnum;
(function (TokenEnum) {
    TokenEnum["access"] = "Access";
    TokenEnum["refresh"] = "Refresh";
})(TokenEnum || (exports.TokenEnum = TokenEnum = {}));
const getSignatureLevel = async (role = User_model_1.RoleEnum.user) => {
    let signatureLevel = User_model_1.RoleEnum.user;
    switch (role) {
        case User_model_1.RoleEnum.admin:
            signatureLevel = User_model_1.RoleEnum.admin;
            break;
        case User_model_1.RoleEnum.user:
            signatureLevel = User_model_1.RoleEnum.user;
            break;
        default:
            break;
    }
    return signatureLevel;
};
exports.getSignatureLevel = getSignatureLevel;
const getSignature = async (signatureLevel = User_model_1.RoleEnum.user) => {
    let signatures = {
        access_signature: "",
        refresh_signature: "",
    };
    switch (signatureLevel) {
        case User_model_1.RoleEnum.admin:
            signatures.access_signature = process.env
                .ACCESS_ADMIN_SIGNATURE;
            signatures.refresh_signature = process.env
                .REFRESH_ADMIN_SIGNATURE;
            break;
        case User_model_1.RoleEnum.user:
            signatures.access_signature = process.env.ACCESS_USER_SIGNATURE;
            signatures.refresh_signature = process.env
                .REFRESH_USER_SIGNATURE;
            break;
        default:
            break;
    }
    return signatures;
};
exports.getSignature = getSignature;
const createLoginCredentials = async (user) => {
    const jwtid = (0, uuid_1.v4)();
    const signatureLevel = await (0, exports.getSignatureLevel)(user.role);
    const signature = await (0, exports.getSignature)(signatureLevel);
    const accessToken = await (0, exports.generateToken)({
        payload: { _id: user._id, email: user.email, name: user.firstName },
        secretKey: signature.access_signature,
        options: { expiresIn: Number(process.env.ACCESS_EXPIRES_IN), jwtid },
    });
    const refreshToken = await (0, exports.generateToken)({
        payload: { _id: user._id, email: user.email, name: user.firstName },
        secretKey: signature.refresh_signature,
        options: { expiresIn: Number(process.env.REFRESH_EXPIRES_IN), jwtid },
    });
    return { accessToken, refreshToken };
};
exports.createLoginCredentials = createLoginCredentials;
const decodeToken = async ({ authorization, tokenType = TokenEnum.access, }) => {
    const userModel = new user_db_repository_1.UserRepository(User_model_1.UserModel);
    const tokenModel = new token_db_repository_1.TokenRepository(token_model_1.TokenModel);
    const [bearer, token] = authorization.split(" ");
    if (!bearer || !token)
        throw new err_response_1.UnAuthorizedExceptions("Missing Token Parts ");
    const signature = await (0, exports.getSignature)(bearer);
    const decoded = await (0, exports.verifyToken)({
        token,
        secretKey: tokenType === TokenEnum.refresh
            ? signature.refresh_signature
            : signature.access_signature,
    });
    if (!decoded?._id || !decoded?.iat)
        throw new err_response_1.UnAuthorizedExceptions("In-valid token payload");
    if (await tokenModel.findOne({ filter: { jti: decoded.jti } }))
        throw new err_response_1.UnAuthorizedExceptions("In-valid or old login credentials");
    const user = await userModel.findOne({
        filter: { _id: decoded._id },
    });
    if (!user)
        throw new err_response_1.NotFoundExceptions("Not register account");
    if (user.changeCredentialsTime?.getTime() || 0 > decoded.iat * 1000)
        throw new err_response_1.UnAuthorizedExceptions("In-valid or old login credentials");
    return { user, decoded };
};
exports.decodeToken = decodeToken;
const revokeToken = async (decoded) => {
    const tokenModel = new token_db_repository_1.TokenRepository(token_model_1.TokenModel);
    const [results] = (await tokenModel.create({
        data: [
            {
                jti: decoded?.jti,
                expiresIn: decoded?.iat + Number(process.env.REFRESH_EXPIRES_IN),
                userId: decoded?._id,
            },
        ],
        options: { validateBeforeSave: true },
    })) || [];
    if (!results)
        throw new err_response_1.BadRequestExceptions("Failed to revoke token ");
    return results;
};
exports.revokeToken = revokeToken;
