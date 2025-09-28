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
class AuthenticationService {
    _userModel = new user_db_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
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
            filter: { email },
            options: { lean: true },
        });
        if (!user)
            throw new err_response_1.NotFoundExceptions("In-valid email or password");
        if (!user.confirmEmailAt || user.confirmEmailOTP)
            throw new err_response_1.BadRequestExceptions("Email is not confirmed pleas confirmed your email first ");
        if (!(await (0, hash_utils_1.comparHash)(password, user.password)))
            throw new err_response_1.BadRequestExceptions("In-valid email or password");
        const { accessToken, refreshToken } = await (0, token_utils_1.createLoginCredentials)(user);
        return (0, successResponse_1.default)({ res, data: {
                accessToken, refreshToken
            } });
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
