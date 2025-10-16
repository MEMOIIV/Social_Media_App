import type { Request, Response } from "express";
import {
  AllowCommentsEnum,
  HPostModelDocument,
  PostModel,
} from "../../DB/models/Post.model";
import { UserModel } from "../../DB/models/User.model";
import { PostRepository } from "../../DB/repositories/post.db.repository";
import { UserRepository } from "../../DB/repositories/user.db.repository";
import { CommentRepository } from "../../DB/repositories/comment.db.repository";
import { CommentModel } from "../../DB/models/Comment.model";
import { ICommentParamsDTO, IReplayParamsDTO } from "./comment.dto";
import successResponse from "../../utils/successResponse";
import {
  BadRequestExceptions,
  NotFoundExceptions,
} from "../../utils/response/err.response";
import { postAvailability } from "../Post/post.service";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";

class CommentService {
  private _postModel = new PostRepository(PostModel);
  private _userModel = new UserRepository(UserModel);
  private _commentModel = new CommentRepository(CommentModel);

  constructor() {}

  createComment = async (req: Request, res: Response) => {
    const { postId } = req.params as ICommentParamsDTO;
    const post = await this._postModel.findOne({
      filter: {
        _id: postId,
        allowComments: AllowCommentsEnum.Allow,
        $or: postAvailability(req),
      },
    });

    if (!post) throw new NotFoundExceptions("Fail to match result");

    // Validate that all tagged users exist \
    if (
      req.body.tags?.length &&
      (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } }))
        .length !== req.body.tags.length
    ) {
      throw new NotFoundExceptions("Some mentioned user dose not exists");
    }

    // Check for duplicate tags in request body
    if (req.body.tags?.length) {
      const uniqueTags = new Set(
        req.body.tags.map((tag: string) => tag.toString())
      );
      if (uniqueTags.size !== req.body.tags.length)
        throw new BadRequestExceptions("Duplicate tags are not allowed");
    }

    // Attachments
    let attachments: string[] = [];
    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${post.postCreatedBy}/post/${post.assetPostFolderId}`,
      });
    }

    // Create  Comment
    const [comment] =
      (await this._commentModel.create({
        data: [
          {
            ...req.body,
            attachments, // key same value
            postId, // key same value
            commentCreatedBy: req.user?._id,
          },
        ],
      })) || [];

    if (!comment) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
      }
      throw new BadRequestExceptions("Fail to create comment");
    }

    return successResponse({
      res,
      statusCode: 201,
      message: "Comment created successfully",
      data: comment,
    });
  };

  createReplay = async (req: Request, res: Response) => {
    const { postId, commentId } = req.params as IReplayParamsDTO;
    const comment = await this._commentModel.findOne({
      filter: {
        _id: commentId,
        postId, // key same value and for populate
      },
      options: {
        populate: [
          {
            path: "postId",
            match: {
              allowComments: AllowCommentsEnum.Allow,
              $or: postAvailability(req),
            },
          },
        ],
      },
    });

    if (!comment?.postId) throw new NotFoundExceptions("Fail to match result");

    // Validate that all tagged users exist \
    if (
      req.body.tags?.length &&
      (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } }))
        .length !== req.body.tags.length
    ) {
      throw new NotFoundExceptions("Some mentioned user dose not exists");
    }

    // Check for duplicate tags in request body
    if (req.body.tags?.length) {
      const uniqueTags = new Set(
        req.body.tags.map((tag: string) => tag.toString())
      );
      if (uniqueTags.size !== req.body.tags.length)
        throw new BadRequestExceptions("Duplicate tags are not allowed");
    }

    // Attachments
    let attachments: string[] = [];
    if (req.files?.length) {
      const post = comment.postId as Partial<HPostModelDocument>; // Partial as post document
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${post.postCreatedBy}/post/${post.assetPostFolderId}`,
      });
    }

    // Create  Repaly
    const [replay] =
      (await this._commentModel.create({
        data: [
          {
            ...req.body,
            attachments, // key same value
            postId, // key same
            commentId,
            commentCreatedBy: req.user?._id,
          },
        ],
      })) || [];

    if (!replay) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
      }
      throw new BadRequestExceptions("Fail to create replay");
    }

    return successResponse({
      res,
      statusCode: 201,
      message: "Replay created successfully",
      data: replay,
    });
  };
}

export default new CommentService();
