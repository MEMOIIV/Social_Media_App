import { Request, Response } from "express";
import successResponse from "../../utils/successResponse";
import {
  IAcceptParams,
  IFriendParams,
  ILogoutDTO,
  IPresignedURL,
} from "./user.dto";
import {
  HUserModelDocument,
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
import { createPreSignedURL, uploadFiles } from "../../utils/multer/s3.config";
import { StorageEnum } from "../../utils/multer/cloud.multer";
import { FriendModel } from "../../DB/models/friendRequest.model";
import {
  BadRequestExceptions,
  ConflictExceptions,
  NotFoundExceptions,
} from "../../utils/response/err.response";
import { FriendRepository } from "../../DB/repositories/friend.db.repository";
import { Types } from "mongoose";
import { ChatRepository } from "../../DB/repositories/chat.db.repository";
import { ChatModel } from "../../DB/models/Chat.model";

class UserService {
  private _userModel = new UserRepository(UserModel);
  private _friendModel = new FriendRepository(FriendModel);
  private _chatModel = new ChatRepository(ChatModel);

  constructor() {}

  // Get profile
  getProfile = async (req: Request, res: Response): Promise<Response> => {
    await req.user?.populate("friends");

    const groups = await this._chatModel.find({
      filter: {
        participants: { $in: [req.user?._id as Types.ObjectId] },
        group: { $exists: true },
      },
    });

    if(!groups) throw new NotFoundExceptions("Failed to find groups")
    return successResponse({
      res,
      data: {
        user: req.user,
        decoded: req.decoded,
        groups,
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
    const newCredentials = await createLoginCredentials(
      req.user as HUserModelDocument
    );
    await revokeToken(req.decoded as JwtPayload);
    return successResponse({ res, data: newCredentials, statusCode: 201 });
  };

  // Profile Image
  profileImage = async (req: Request, res: Response): Promise<Response> => {
    // upload small size file

    // const Key = await uploadFile({
    //   file: req.file as Express.Multer.File,
    //   path: `users/${req.decoded?._id}`,
    // });

    // upload large size file

    // const key = await uploadLargeFile({
    //   file: req.file as Express.Multer.File,
    //   path: `users/${req.decoded?._id}`,
    // });

    // use preSignedURL

    const { ContentType, Originalname }: IPresignedURL = req.body;
    const { url, Key } = await createPreSignedURL({
      ContentType,
      Originalname,
      path: `users/${req.decoded?._id}`,
    });

    // update user
    const user = await this._userModel.updateOne({
      filter: { _id: req.decoded?._id },
      update: { profileImage: Key },
    });

    return successResponse({
      res,
      statusCode: 201,
      message: "Profile image upload successfully",
      data: { url, Key, user },
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
    const user = await this._userModel.updateOne({
      filter: { _id: req.decoded?._id },
      update: { coverImages: urls },
    });
    return successResponse({
      res,
      statusCode: 201,
      message: "Profile image upload successfully",
      data: { urls, user },
    });
  };

  // Friend Request
  friendRequest = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params as IFriendParams;

    // check if i send request to same user before
    const checkFriendRequestExists = await this._friendModel.findOne({
      filter: {
        createdBy: { $in: [req.user?._id, userId] },
        sendTo: { $in: [req.user?._id, userId] },
      },
    });

    if (checkFriendRequestExists)
      throw new ConflictExceptions("Friends request already exists");

    // check if user i want send to him friend request is exists or not
    const user = await this._userModel.findOne({
      filter: {
        _id: userId,
      },
    });

    if (!user) throw new NotFoundExceptions("User not found");

    // Prevent users from sending friend requests to themselves
    if (userId === req.user?._id.toString()) {
      throw new BadRequestExceptions(
        "You can't send a friend request to yourself"
      );
    }

    // Create friend request
    const [friend] =
      (await this._friendModel.create({
        data: [
          {
            createdBy: req.user?._id as Types.ObjectId,
            sendTo: new Types.ObjectId(userId),
          },
        ],
      })) || [];

    if (!friend) throw new BadRequestExceptions("Fail to send friend request");

    return successResponse({
      res,
      statusCode: 201,
      message: "Send friend request successfully",
      data: friend,
    });
  };

  // Accept Friend Request
  acceptRequest = async (req: Request, res: Response): Promise<Response> => {
    const { requestId } = req.params as IAcceptParams;

    // check if i send request to same user before
    const friend = await this._friendModel.findOne({
      filter: {
        _id: requestId,
        sendTo: req.user?._id,
      },
    });

    if (!friend) throw new NotFoundExceptions("Friend request not found");

    // Prevent sending a new request if users are already friends
    if (friend.acceptedAt)
      throw new NotFoundExceptions("You are already friends with this user");

    // Update the friend request to mark it as accepted
    const acceptRequest = await this._friendModel.updateOne({
      filter: { _id: requestId },
      update: {
        acceptedAt: Date.now(),
      },
    });

    // Check if the update actually modified any document
    if (acceptRequest.modifiedCount === 0) {
      throw new BadRequestExceptions("Failed to accept the friend request");
    }

    // Add both users to each other's friends list after accepting the request
    const updateFriends = await Promise.all([
      await this._userModel.updateOne({
        filter: { _id: friend.createdBy },
        update: { $addToSet: { friends: friend.sendTo } },
      }),
      await this._userModel.updateOne({
        filter: { _id: friend.sendTo },
        update: { $addToSet: { friends: friend.createdBy } },
      }),
    ]);

    // Check if both updates were successful
    if (!updateFriends[0].modifiedCount || !updateFriends[1].modifiedCount) {
      throw new BadRequestExceptions("Failed to update friends list");
    }

    return successResponse({
      res,
      message: "Friend request accepted successfully",
    });
  };
}

export default new UserService();
