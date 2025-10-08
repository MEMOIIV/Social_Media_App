"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const successResponse_1 = __importDefault(require("../../utils/successResponse"));
class PostService {
    constructor() { }
    createPost = async (req, res) => {
        return (0, successResponse_1.default)({ res, message: 'Post created successfully', statusCode: 201 });
    };
}
exports.default = new PostService;
