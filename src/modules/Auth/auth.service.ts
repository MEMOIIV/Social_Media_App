import { type Request, type Response } from "express";
import {
  IConfirmEmailDTO,
  ILoginDTO,
  ISignupDTO,
  ISignupGmail,
} from "./auth.dto";
import { UserRepository } from "../../DB/repositories/user.db.repository";
import { ProviderEnum, UserModel } from "../../DB/models/User.model";
import {
  BadRequestExceptions,
  ConflictExceptions,
  NotFoundExceptions,
} from "../../utils/response/err.response";
import { comparHash, generateHash } from "../../utils/security/hash.utils";
import { emailEvent } from "../../utils/events/email.event";
import { generateOTP } from "../../utils/security/generateOTP.utils";
import successResponse from "../../utils/successResponse";
import { createLoginCredentials } from "../../utils/security/token.utils";
import { OAuth2Client, type TokenPayload } from "google-auth-library";

class AuthenticationService {
  private _userModel = new UserRepository(UserModel);

  constructor() {}
  // signup with gmail
  private async verifyGmailAccount(idToken: string): Promise<TokenPayload> {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.WEB_CLIENT_IDS?.split(",") || [],
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified)
      throw new BadRequestExceptions("fail to verify this google account");
    return payload;
  }
  signupWithGmail = async (req: Request, res: Response): Promise<Response> => {
    const { idToken }: ISignupGmail = req.body;
    const { email, name, picture } = await this.verifyGmailAccount(idToken);
    const user = await this._userModel.findOne({
      filter: { email },
    });

    if (user) {
      if (user.provider === ProviderEnum.google) {
        return await this.loginWithGmail(req, res);
      }
      throw new ConflictExceptions(
        "Email already exist with another provider",
        { cause: { User_Provider: user.provider } }
      );
    }

    if (!email) {
      throw new BadRequestExceptions(
        "Google account does not provide an email"
      );
    }

    const [newUser] =
      (await this._userModel.create({
        data: [
          {
            email,
            fullName: name as string,
            profileImage: picture as string,
            confirmEmailAt: new Date(),
            provider: ProviderEnum.google,
          },
        ],
      })) || [];
    if (!newUser)
      throw new BadRequestExceptions(
        "Fail to signup with gmail pleas try again later"
      );
    const { accessToken, refreshToken } = await createLoginCredentials(newUser);
    return successResponse({
      res,
      statusCode: 201,
      data: { accessToken, refreshToken },
    });
  };
  // Login With Gmail
  loginWithGmail = async (req: Request, res: Response): Promise<Response> => {
    const { idToken }: ISignupGmail = req.body;
    const { email } = await this.verifyGmailAccount(idToken);
    const user = await this._userModel.findOne({
      filter: { email, provider: ProviderEnum.google },
    });
    if (!user)
      throw new NotFoundExceptions(
        "Not register account or registered with another provider"
      );
    const { accessToken, refreshToken } = await createLoginCredentials(user);
    return successResponse({ res, data: { accessToken, refreshToken } });
  };

  //signup
  signup = async (req: Request, res: Response): Promise<Response> => {
    const { fullName, email, password }: ISignupDTO = req.body;

    if (
      await this._userModel.findOne({
        filter: { email },
        select: "-_id email",
        options: { lean: true },
      })
    )
      throw new ConflictExceptions("email already exist", {
        cause: { field: "email", value: email },
      });

    const otp = generateOTP();

    const user = await this._userModel.createUser({
      data: [
        {
          fullName,
          email,
          password,
          confirmEmailOTP: `${otp}`,
        },
      ],
      options: { validateBeforeSave: true },
    });

    emailEvent.emit("confirmEmail", { to: email, fullName, otp });
    return successResponse({
      res,
      statusCode: 201,
      message: "created user success",
      data: user,
    });
  };

  // login
  login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password }: ILoginDTO = req.body;
    const user = await this._userModel.findOne({
      filter: { email, provider: ProviderEnum.system },
      options: { lean: true },
    });
    if (!user) throw new NotFoundExceptions("In-valid email or password");

    if (!user.confirmEmailAt || user.confirmEmailOTP)
      throw new BadRequestExceptions(
        "Email is not confirmed pleas confirmed your email first "
      );

    if (!(await comparHash(password, user.password)))
      throw new BadRequestExceptions("In-valid email or password");

    const { accessToken, refreshToken } = await createLoginCredentials(user);

    return successResponse({
      res,
      data: {
        accessToken,
        refreshToken,
      },
      message: "User Logged in successfully",
    });
  };

  //confirm Email
  confirmEmail = async (req: Request, res: Response): Promise<Response> => {
    const { otp, email }: IConfirmEmailDTO = req.body;
    const user = await this._userModel.findOne({
      filter: {
        email,
        confirmEmailOTP: { $exists: true },
        confirmEmailAt: { $exists: false },
      },
      options: { lean: true },
    });

    if (!user) throw new NotFoundExceptions("invalid account");

    if (!(await comparHash(otp, user?.confirmEmailOTP)))
      throw new BadRequestExceptions("otp is not correct pleas try again");

    await this._userModel.updateOne({
      filter: { email },
      update: {
        $set: { confirmEmailAt: Date.now() },
        $unset: { confirmEmailOTP: true },
      },
    });
    return successResponse({
      res,
      message: "User confirmed Success",
    });
  };
}

export default new AuthenticationService();
