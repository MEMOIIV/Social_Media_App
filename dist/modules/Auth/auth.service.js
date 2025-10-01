"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_db_repository_1 = require("../../DB/repositories/user.db.repository");
const User_model_1 = require("../../DB/models/User.model");
const err_response_1 = require("../../utils/response/err.response");
const hash_utils_1 = require("../../utils/security/hash.utils");
const email_event_1 = require("../../utils/events/email.event");
const generateOTP_utils_1 = require("../../utils/security/generateOTP.utils");
const successResponse_1 = __importDefault(require("../../utils/successResponse"));
const token_utils_1 = require("../../utils/security/token.utils");
const google_auth_library_1 = require("google-auth-library");
class AuthenticationService {
    _userModel = new user_db_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    async verifyGmailAccount(idToken) {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.WEB_CLIENT_IDS?.split(",") || [],
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified)
            throw new err_response_1.BadRequestExceptions("fail to verify this google account");
        return payload;
    }
    signupWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email, name, picture } = await this.verifyGmailAccount(idToken);
        const user = await this._userModel.findOne({
            filter: { email },
        });
        if (user) {
            if (user.provider === User_model_1.ProviderEnum.google) {
                return await this.loginWithGmail(req, res);
            }
            throw new err_response_1.ConflictExceptions("Email already exist with another provider", { cause: { User_Provider: user.provider } });
        }
        if (!email) {
            throw new err_response_1.BadRequestExceptions("Google account does not provide an email");
        }
        const [newUser] = (await this._userModel.create({
            data: [
                {
                    email,
                    fullName: name,
                    profileImage: picture,
                    confirmEmailAt: new Date(),
                    provider: User_model_1.ProviderEnum.google,
                },
            ],
        })) || [];
        if (!newUser)
            throw new err_response_1.BadRequestExceptions("Fail to signup with gmail pleas try again later");
        const { accessToken, refreshToken } = await (0, token_utils_1.createLoginCredentials)(newUser);
        return (0, successResponse_1.default)({
            res,
            statusCode: 201,
            data: { accessToken, refreshToken },
        });
    };
    loginWithGmail = async (req, res) => {
        const { idToken } = req.body;
        const { email } = await this.verifyGmailAccount(idToken);
        const user = await this._userModel.findOne({
            filter: { email, provider: User_model_1.ProviderEnum.google },
        });
        if (!user)
            throw new err_response_1.NotFoundExceptions("Not register account or registered with another provider");
        const { accessToken, refreshToken } = await (0, token_utils_1.createLoginCredentials)(user);
        return (0, successResponse_1.default)({ res, data: { accessToken, refreshToken } });
    };
    signup = async (req, res) => {
        const { fullName, email, password } = req.body;
        if (await this._userModel.findOne({
            filter: { email },
            select: "-_id email",
            options: { lean: true },
        }))
            throw new err_response_1.ConflictExceptions("email already exist", {
                cause: { field: "email", value: email },
            });
        const otp = (0, generateOTP_utils_1.generateOTP)();
        const user = await this._userModel.createUser({
            data: [
                {
                    fullName,
                    email,
                    password: await (0, hash_utils_1.generateHash)(password),
                    confirmEmailOTP: await (0, hash_utils_1.generateHash)(String(otp)),
                },
            ],
            options: { validateBeforeSave: true },
        });
        email_event_1.emailEvent.emit("confirmEmail", { to: email, fullName, otp });
        return (0, successResponse_1.default)({
            res,
            statusCode: 201,
            message: "created user success",
            data: user,
        });
    };
    login = async (req, res) => {
        const { email, password } = req.body;
        const user = await this._userModel.findOne({
            filter: { email, provider: User_model_1.ProviderEnum.system },
            options: { lean: true },
        });
        if (!user)
            throw new err_response_1.NotFoundExceptions("In-valid email or password");
        if (!user.confirmEmailAt || user.confirmEmailOTP)
            throw new err_response_1.BadRequestExceptions("Email is not confirmed pleas confirmed your email first ");
        if (!(await (0, hash_utils_1.comparHash)(password, user.password)))
            throw new err_response_1.BadRequestExceptions("In-valid email or password");
        const { accessToken, refreshToken } = await (0, token_utils_1.createLoginCredentials)(user);
        return (0, successResponse_1.default)({
            res,
            data: {
                accessToken,
                refreshToken,
            },
        });
    };
    confirmEmail = async (req, res) => {
        const { otp, email } = req.body;
        const user = await this._userModel.findOne({
            filter: {
                email,
                confirmEmailOTP: { $exists: true },
                confirmEmailAt: { $exists: false },
            },
            options: { lean: true },
        });
        if (!user)
            throw new err_response_1.NotFoundExceptions("invalid account");
        if (!(await (0, hash_utils_1.comparHash)(otp, user?.confirmEmailOTP)))
            throw new err_response_1.BadRequestExceptions("otp is not correct pleas try again");
        await this._userModel.updateOne({
            filter: { email },
            update: {
                $set: { confirmEmailAt: Date.now() },
                $unset: { confirmEmailOTP: true },
            },
        });
        return (0, successResponse_1.default)({
            res,
            message: "User confirmed Success",
        });
    };
}
exports.default = new AuthenticationService();
