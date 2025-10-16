"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Post_model_1 = require("../../DB/models/Post.model");
const User_model_1 = require("../../DB/models/User.model");
const post_db_repository_1 = require("../../DB/repositories/post.db.repository");
const user_db_repository_1 = require("../../DB/repositories/user.db.repository");
const comment_db_repository_1 = require("../../DB/repositories/comment.db.repository");
const Comment_model_1 = require("../../DB/models/Comment.model");
const successResponse_1 = __importDefault(require("../../utils/successResponse"));
const err_response_1 = require("../../utils/response/err.response");
const post_service_1 = require("../Post/post.service");
const s3_config_1 = require("../../utils/multer/s3.config");
class CommentService {
    _postModel = new post_db_repository_1.PostRepository(Post_model_1.PostModel);
    _userModel = new user_db_repository_1.UserRepository(User_model_1.UserModel);
    _commentModel = new comment_db_repository_1.CommentRepository(Comment_model_1.CommentModel);
    constructor() { }
    createComment = async (req, res) => {
        const { postId } = req.params;
        const post = await this._postModel.findOne({
            filter: {
                _id: postId,
                allowComments: Post_model_1.AllowCommentsEnum.Allow,
                $or: (0, post_service_1.postAvailability)(req),
            },
        });
        if (!post)
            throw new err_response_1.NotFoundExceptions("Fail to match result");
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
        if (req.files?.length) {
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${post.postCreatedBy}/post/${post.assetPostFolderId}`,
            });
        }
        const [comment] = (await this._commentModel.create({
            data: [
                {
                    ...req.body,
                    attachments,
                    postId,
                    commentCreatedBy: req.user?._id,
                },
            ],
        })) || [];
        if (!comment) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new err_response_1.BadRequestExceptions("Fail to create comment");
        }
        return (0, successResponse_1.default)({
            res,
            statusCode: 201,
            message: "Comment created successfully",
            data: comment,
        });
    };
    createReplay = async (req, res) => {
        const { postId, commentId } = req.params;
        const comment = await this._commentModel.findOne({
            filter: {
                _id: commentId,
                postId,
            },
            options: {
                populate: [
                    {
                        path: "postId",
                        match: {
                            allowComments: Post_model_1.AllowCommentsEnum.Allow,
                            $or: (0, post_service_1.postAvailability)(req),
                        },
                    },
                ],
            },
        });
        if (!comment?.postId)
            throw new err_response_1.NotFoundExceptions("Fail to match result");
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
        if (req.files?.length) {
            const post = comment.postId;
            attachments = await (0, s3_config_1.uploadFiles)({
                files: req.files,
                path: `users/${post.postCreatedBy}/post/${post.assetPostFolderId}`,
            });
        }
        const [replay] = (await this._commentModel.create({
            data: [
                {
                    ...req.body,
                    attachments,
                    postId,
                    commentId,
                    commentCreatedBy: req.user?._id,
                },
            ],
        })) || [];
        if (!replay) {
            if (attachments.length) {
                await (0, s3_config_1.deleteFiles)({ urls: attachments });
            }
            throw new err_response_1.BadRequestExceptions("Fail to create replay");
        }
        return (0, successResponse_1.default)({
            res,
            statusCode: 201,
            message: "Replay created successfully",
            data: replay,
        });
    };
}
exports.default = new CommentService();
