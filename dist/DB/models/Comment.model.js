"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const commentSchema = new mongoose_1.default.Schema({
    content: {
        type: String,
        minLength: 2,
        maxLength: 2000,
        required: function () {
            return !this.attachments?.length;
        },
    },
    attachments: [String],
    likes: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
    commentCreatedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    postId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        ref: "Post",
    },
    commentId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
    },
    freezedAt: Date,
    freezedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    restoredBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
}, {
    timestamps: true,
});
commentSchema.pre(["find", "findOne", "findOneAndUpdate", "updateOne"], async function () {
    const query = this.getQuery();
    if (query.paranoId === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
});
exports.CommentModel = mongoose_1.default.models.Comment || mongoose_1.default.model("Comment", commentSchema);
