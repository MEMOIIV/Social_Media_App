"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const successResponse_1 = __importDefault(require("../../utils/successResponse"));
const Post_model_1 = require("../../DB/models/Post.model");
const post_db_repository_1 = require("../../DB/repositories/post.db.repository");
const user_db_repository_1 = require("../../DB/repositories/user.db.repository");
const User_model_1 = require("../../DB/models/User.model");
class PostService {
    _postModel = new post_db_repository_1.PostRepository(Post_model_1.PostModel);
    _userModel = new user_db_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    createPost = async (req, res) => {
        return (0, successResponse_1.default)({
            res,
            message: "Post created successfully",
            statusCode: 201,
        });
    };
}
exports.default = new PostService();
