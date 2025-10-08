"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const post_service_1 = __importDefault(require("./post.service"));
const authentication_middleware_1 = require("../../middleware/authentication.middleware");
const post_authorization_1 = require("./post.authorization");
const router = (0, express_1.Router)();
router.post("/create-post", (0, authentication_middleware_1.authentication)(post_authorization_1.endPoint.createPost), post_service_1.default.createPost);
exports.default = router;
