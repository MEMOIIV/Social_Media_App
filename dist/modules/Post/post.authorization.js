"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endPoint = void 0;
const User_model_1 = require("../../DB/models/User.model");
exports.endPoint = {
    createPost: [User_model_1.RoleEnum.user, User_model_1.RoleEnum.admin],
    likeAndUnlikePost: [User_model_1.RoleEnum.user, User_model_1.RoleEnum.admin],
    updatePost: [User_model_1.RoleEnum.user, User_model_1.RoleEnum.admin],
    getPosts: [User_model_1.RoleEnum.user, User_model_1.RoleEnum.admin],
};
