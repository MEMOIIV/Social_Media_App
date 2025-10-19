"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endPoint = void 0;
const User_model_1 = require("../../DB/models/User.model");
exports.endPoint = {
    test: [User_model_1.RoleEnum.user, User_model_1.RoleEnum.admin],
};
