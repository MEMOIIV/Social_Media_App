import type { Request, Response } from "express";
import {
  ActionEnum,
  AvailabilityEnum,
  PostModel,
} from "../../DB/models/Post.model";
import { HUserModelDocument, UserModel } from "../../DB/models/User.model";
import { PostRepository } from "../../DB/repositories/post.db.repository";
import { UserRepository } from "../../DB/repositories/user.db.repository";
import successResponse from "../../utils/successResponse";
import {
  BadRequestExceptions,
  NotFoundExceptions,
} from "../../utils/response/err.response";
import { deleteFiles, uploadFiles } from "../../utils/multer/s3.config";
import { v4 as uuid } from "uuid";
import { likePostQueryDTO, updatePostParamsDto } from "./post.dto";
import { Types, type UpdateQuery } from "mongoose";
import { getPostsSchema } from "./post.validation";

export const postAvailability = (req: Request) => {
  return [
    // public
    { availability: AvailabilityEnum.Public },
    // just private with out tags
    {
      availability: AvailabilityEnum.Private,
      postCreatedBy: req.user?._id,
    },
    // private with tags
    {
      availability: AvailabilityEnum.Private,
      tags: { $in: [req.user?._id] },
    },
    // just friends
    {
      availability: AvailabilityEnum.Friends,
      postCreatedBy: { $in: [...(req.user?.friends || []), req.user?._id] },
    },
  ];
};

class PostService {
  private _postModel = new PostRepository(PostModel);
  private _userModel = new UserRepository(UserModel);

  constructor() {}

  // create post
  createPost = async (req: Request, res: Response) => {
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

    let attachments: string[] = [];
    let assetPostFolderId = uuid(); // generate unique id for post folder to attachments
    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req.user._id}/post/${assetPostFolderId}`,
      });
    }

    const [post] =
      (await this._postModel.create({
        data: [
          {
            ...req.body,
            attachments, // key same value
            assetPostFolderId, // kye same value
            postCreatedBy: req.user?._id,
          },
        ],
      })) || [];

    if (!post) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
      }
      throw new BadRequestExceptions("Fail to create post");
    }

    return successResponse({
      res,
      message: "Post created successfully",
      statusCode: 201,
      data: post,
    });
  };

  // like and unlike posts
  likeAndUnlikePost = async (req: Request, res: Response) => {
    const { postId } = req.params as unknown as { postId: string };

    const { action } = req.query as likePostQueryDTO;

    let update: UpdateQuery<HUserModelDocument> = {
      $addToSet: { likes: req.user?._id },
    };
    if (action === ActionEnum.unLike) {
      update = { $pull: { likes: req.user?._id } };
    }
    const post = await this._postModel.findOneAndUpdate({
      filter: {
        _id: postId,
        $or: postAvailability(req),
      },
      update, // kye same value
    });

    if (!post) {
      throw new NotFoundExceptions("post dose not exists");
    }
    return successResponse({
      res,
      statusCode: 200,
      data: post,
    });
  };

  // Update Post
  updatePost = async (req: Request, res: Response) => {
    const { postId } = req.params as updatePostParamsDto;
    const post = await this._postModel.findOne({
      filter: { _id: postId, postCreatedBy: req.user?._id },
    });
    if (!post) throw new NotFoundExceptions("Post dose not exist");

    // Validate that all tagged users exist \
    if (
      req.body.tags?.length &&
      (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } }))
        .length !== req.body.tags.length
    )
      throw new NotFoundExceptions("Some mentioned user dose not exists");

    // Check for duplicated tags before update
    if (req.body.tags?.length) {
      const existingTags = post.tags.map((t: Types.ObjectId) => t.toString());
      const duplicateTags = req.body.tags.filter((tag: string) =>
        existingTags.includes(tag)
      );
      if (duplicateTags.length)
        throw new BadRequestExceptions("Some tags already exist in the post");
    }

    // Upload post attachments if files are provided \
    let attachments: string[] = [];
    if (req.files?.length) {
      attachments = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${post.postCreatedBy}/post/${post.assetPostFolderId}`,
      });
    }

    // updata post
    const updatePost = await this._postModel.updateOne({
      filter: { _id: postId },
      update: [
        {
          $set: {
            content: req.body.content || post.content,
            allowComments: req.body.allowComments || post.allowComments,
            availability: req.body.availability || post.availability,
            attachments: {
              $setUnion: [
                {
                  $setDifference: [
                    "$attachments",
                    req.body.removedAttachments || [],
                  ],
                },
                attachments,
              ],
            },
            tags: {
              $setUnion: [
                {
                  $setDifference: [
                    "$tags",
                    (req.body.removedTags || []).map((tag: string) => {
                      return Types.ObjectId.createFromHexString(tag);
                    }),
                  ],
                },
                (req.body.tags || []).map((tag: string) => {
                  return Types.ObjectId.createFromHexString(tag);
                }),
              ],
            },
          },
        },
      ],
    });
    // if update failed
    // first: delete all new attachments
    if (!updatePost.modifiedCount) {
      if (attachments.length) {
        await deleteFiles({ urls: attachments });
        throw new BadRequestExceptions("fail to update post");
      }
    } else {
      // Second: Destroy the attachment removal process.
      if (req.body.removedAttachments?.length) {
        await deleteFiles({ urls: req.body.removedAttachments });
      }
    }
    successResponse({ res, message: "Updated post successfully" });
  };

  // Get All Posts
  getPosts = async (req: Request, res: Response) => {
    const parsedQuery = getPostsSchema.query.parse(req.query);
    const { page, limit } = parsedQuery;
    const posts = await this._postModel.paginate({
      filter: { $or: postAvailability(req) },
      page, // key same value
      limit, // key same value
    });

      if (!posts?.result?.length) {
        return successResponse({
          res,
          data: [],
          message: "No more posts available",
        });
      }

    return successResponse({ res, data: posts });
  };
}

export default new PostService();
