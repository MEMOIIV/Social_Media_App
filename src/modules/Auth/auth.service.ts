import type { Request, Response } from "express";
import { IConfirmEmailDTO, ILoginDTO, ISignupDTO } from "./auth.dto";
import { UserRepository } from "../../DB/repositories/user.db.repository";
import { UserModel } from "../../DB/models/User.model";
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

class AuthenticationService {
  private _userModel = new UserRepository(UserModel);

  constructor() {}

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
          password: await generateHash(password),
          confirmEmailOTP: await generateHash(String(otp)),
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
      filter: { email },
      options: { lean: true },
    });
    if (!user) throw new NotFoundExceptions("In-valid email or password");

    if (!user.confirmEmailAt || user.confirmEmailOTP)
      throw new BadRequestExceptions(
        "Email is not confirmed pleas confirmed your email first "
      );

    if (!(await comparHash(password, user.password)))
      throw new BadRequestExceptions("In-valid email or password");

    const {accessToken , refreshToken} = await createLoginCredentials(user)

    return successResponse({ res  , data: {
      accessToken , refreshToken
    } });
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
