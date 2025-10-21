"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postAvailability = void 0;
const Post_model_1 = require("../../DB/models/Post.model");
const User_model_1 = require("../../DB/models/User.model");
const post_db_repository_1 = require("../../DB/repositories/post.db.repository");
const user_db_repository_1 = require("../../DB/repositories/user.db.repository");
const successResponse_1 = __importDefault(require("../../utils/successResponse"));
const err_response_1 = require("../../utils/response/err.response");
const s3_config_1 = require("../../utils/multer/s3.config");
const uuid_1 = require("uuid");
const mongoose_1 = require("mongoose");
const post_validation_1 = require("./post.validation");
const gateway_1 = require("../gateway/gateway");
const postAvailability = (req) => {
    return [
        { availability: Post_model_1.AvailabilityEnum.Public },
        {
            availability: Post_model_1.AvailabilityEnum.Private,
            postCreatedBy: req.user?._id,
        },
        {
            availability: Post_model_1.AvailabilityEnum.Private,
            tags: { $in: [req.user?._id] },
        },
        {
            availability: Post_model_1.AvailabilityEnum.Friends,
            postCreatedBy: { $in: [...(req.user?.friends || []), req.user?._id] },
        },
    ];
};
exports.postAvailability = postAvailability;
class PostService {
    _postModel = new post_db_repository_1.PostRepository(Post_model_1.PostModel);
    _userModel = new user_db_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    createPost = async (req, res) => {
        if (req.body.tags?.length &&
            (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } }))
                .length !== req.body.tags.length) {
            throw new err_response_1.NotFoundExceptions("Some mentioned user dose not exists");
        }
        if (req.body.tags?.length) {
            const uniqueTags = new Set(req.body.tags.map((tag) => tag.toString()));
            if (uniqueTags.size !== req.body.tags.length)
                throw new err_response_1.BadRequestExceptions("Duplicate tags are not allowed");
        }
        let attachments = [];
        let assetPostFolderId = (0, uuid_1.v4)();
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${req.user._id}/post/${assetPostFolderId}`,
            });
        }
        const [post] = (await this._postModel.create({
            data: [
                {
                    ...req.body,
                    attachments,
                    assetPostFolderId,
                    postCreatedBy: req.user?._id,
                },
            ],
        })) || [];
        if (!post) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new err_response_1.BadRequestExceptions("Fail to create post");
        }
        return (0, successResponse_1.default)({
            res,
            message: "Post created successfully",
            statusCode: 201,
            data: post,
        });
    };
    likeAndUnlikePost = async (req, res) => {
        const { postId } = req.params;
        const { action } = req.query;
        let update = {
            $addToSet: { likes: req.user?._id },
        };
        if (action === Post_model_1.ActionEnum.unLike) {
            update = { $pull: { likes: req.user?._id } };
        }
        const post = await this._postModel.findOneAndUpdate({
            filter: {
                _id: postId,
                $or: (0, exports.postAvailability)(req),
            },
            update,
        });
        if (!post) {
            throw new err_response_1.NotFoundExceptions("post dose not exists");
        }
        const receivers = gateway_1.connectedSockets.get(post.createdBy?.toString()) || [];
        if (action !== Post_model_1.ActionEnum.unLike) {
            for (const socketId of receivers) {
                (0, gateway_1.getIo)()
                    .to(socketId)
                    .emit("likePost", { postId, userId: req.user?._id });
            }
        }
        return (0, successResponse_1.default)({
            res,
            statusCode: 200,
            data: post,
        });
    };
    updatePost = async (req, res) => {
        const { postId } = req.params;
        const post = await this._postModel.findOne({
            filter: { _id: postId, postCreatedBy: req.user?._id },
        });
        if (!post)
            throw new err_response_1.NotFoundExceptions("Post dose not exist");
        if (req.body.tags?.length &&
            (await this._userModel.find({ filter: { _id: { $in: req.body.tags } } }))
                .length !== req.body.tags.length)
            throw new err_response_1.NotFoundExceptions("Some mentioned user dose not exists");
        if (req.body.tags?.length) {
            const existingTags = post.tags.map((t) => t.toString());
            const duplicateTags = req.body.tags.filter((tag) => existingTags.includes(tag));
            if (duplicateTags.length)
                throw new err_response_1.BadRequestExceptions("Some tags already exist in the post");
        }
        let attachments = [];
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${post.postCreatedBy}/post/${post.assetPostFolderId}`,
            });
        }
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
                                        (req.body.removedTags || []).map((tag) => {
                                            return mongoose_1.Types.ObjectId.createFromHexString(tag);
                                        }),
                                    ],
                                },
                                (req.body.tags || []).map((tag) => {
                                    return mongoose_1.Types.ObjectId.createFromHexString(tag);
                                }),
                            ],
                        },
                    },
                },
            ],
        });
        if (!updatePost.modifiedCount) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
                throw new err_response_1.BadRequestExceptions("fail to update post");
            }
        }
        else {
            if (req.body.removedAttachments?.length) {
                await (0, s3_config_1.deleteFiles)({ urls: req.body.removedAttachments });
            }
        }
        (0, successResponse_1.default)({ res, message: "Updated post successfully" });
    };
    getPosts = async (req, res) => {
        const parsedQuery = post_validation_1.getPostsSchema.query.parse(req.query);
        const { page, limit } = parsedQuery;
        const posts = await this._postModel.paginate({
            filter: { $or: (0, exports.postAvailability)(req) },
            page,
            limit,
        });
        if (!posts?.result?.length) {
            return (0, successResponse_1.default)({
                res,
                data: [],
                message: "No more posts available",
            });
        }
        return (0, successResponse_1.default)({ res, data: posts });
    };
}
exports.default = new PostService();
