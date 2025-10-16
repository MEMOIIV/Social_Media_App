"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endPoint = void 0;
const User_model_1 = require("../../DB/models/User.model");
exports.endPoint = {
    profile: [User_model_1.RoleEnum.user, User_model_1.RoleEnum.admin],
    logout: [User_model_1.RoleEnum.user, User_model_1.RoleEnum.admin],
    refreshToken: [User_model_1.RoleEnum.user, User_model_1.RoleEnum.admin],
    profileImage: [User_model_1.RoleEnum.user, User_model_1.RoleEnum.admin],
    friendRequest: [User_model_1.RoleEnum.user, User_model_1.RoleEnum.admin],
    acceptRequest: [User_model_1.RoleEnum.user, User_model_1.RoleEnum.admin],
};
