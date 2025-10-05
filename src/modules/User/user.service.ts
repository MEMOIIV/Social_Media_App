import { Request, Response } from "express";
import successResponse from "../../utils/successResponse";
import { ILogoutDTO } from "./user.dto";
import {
  HUserModel,
  IUser,
  LogoutEnum,
  UserModel,
} from "../../DB/models/User.model";
import { UpdateQuery } from "mongoose";
import { UserRepository } from "../../DB/repositories/user.db.repository";
import {
  createLoginCredentials,
  revokeToken,
} from "../../utils/security/token.utils";
import { JwtPayload } from "jsonwebtoken";
import {
  uploadFile,
  uploadFiles,
  uploadLargeFile,
} from "../../utils/multer/s3.config";
import { StorageEnum } from "../../utils/multer/cloud.multer";

class UserService {
  private _userModel = new UserRepository(UserModel);

  constructor() {}

  // Get profile
  getProfile = async (req: Request, res: Response): Promise<Response> => {
    return successResponse({
      res,
      data: {
        user: req.user,
      },
    });
  };

  // Logout
  logout = async (req: Request, res: Response): Promise<Response> => {
    const { flag }: ILogoutDTO = req.body;

    let statusCode = 200;

    const update: UpdateQuery<IUser> = {};

    switch (flag) {
      case LogoutEnum.all:
        update.changeCredentialsTime = Date.now();
        break;
      case LogoutEnum.only:
        await revokeToken(req.decoded as JwtPayload);
        statusCode = 201;
        break;
      default:
        break;
    }

    await this._userModel.updateOne({
      filter: { _id: req.decoded?._id },
      update, // key same value
    });
    return successResponse({
      res,
      statusCode, // kye sane value
    });
  };

  // Refresh Token
  refreshToken = async (req: Request, res: Response): Promise<Response> => {
    const newCredentials = await createLoginCredentials(req.user as HUserModel);
    await revokeToken(req.decoded as JwtPayload);
    return successResponse({ res, data: newCredentials, statusCode: 201 });
  };

  // Profile Image
  profileImage = async (req: Request, res: Response): Promise<Response> => {
    // upload small size file

    // const key = await uploadFile({
    //   file: req.file as Express.Multer.File,
    //   path: `users/${req.decoded?._id}`,
    // });

    // upload large size file

    const key = await uploadLargeFile({
      file: req.file as Express.Multer.File,
      path: `users/${req.decoded?._id}`,
    });

    // update user

    // const user = await this._userModel.updateOne({
    //   filter: { _id: req.decoded?._id },
    //   update: { profileImage: key },
    // });

    return successResponse({
      res,
      statusCode: 201,
      message: "Profile image upload successfully",
      data: { key },
    });
  };

  // Profile Cover Image
  profileCoverImage = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const urls = await uploadFiles({
      storageApproach: StorageEnum.disk,
      files: req.files as Express.Multer.File[],
      path: `users/${req.decoded?._id}/cover`,
    });
    return successResponse({
      res,
      statusCode: 201,
      message: "Profile image upload successfully",
      data: { urls },
    });
  };
}

export default new UserService();
