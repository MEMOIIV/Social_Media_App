"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModel = exports.ActionEnum = exports.AvailabilityEnum = exports.AllowCommentsEnum = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var AllowCommentsEnum;
(function (AllowCommentsEnum) {
    AllowCommentsEnum["Allow"] = "Allow";
    AllowCommentsEnum["Deny"] = "Deny";
})(AllowCommentsEnum || (exports.AllowCommentsEnum = AllowCommentsEnum = {}));
var AvailabilityEnum;
(function (AvailabilityEnum) {
    AvailabilityEnum["Private"] = "Private";
    AvailabilityEnum["Public"] = "Public";
    AvailabilityEnum["Friends"] = "Friends";
})(AvailabilityEnum || (exports.AvailabilityEnum = AvailabilityEnum = {}));
var ActionEnum;
(function (ActionEnum) {
    ActionEnum["like"] = "like";
    ActionEnum["unLike"] = "unlike";
})(ActionEnum || (exports.ActionEnum = ActionEnum = {}));
const postSchema = new mongoose_1.default.Schema({
    content: {
        type: String,
        minLength: 2,
        maxLength: 2000,
        required: function () {
            return !this.attachments?.length;
        },
    },
    attachments: [String],
    assetPostFolderId: String,
    allowComments: {
        type: String,
        enum: Object.values(AllowCommentsEnum),
        default: AllowCommentsEnum.Allow,
    },
    availability: {
        type: String,
        enum: Object.values(AvailabilityEnum),
        default: AvailabilityEnum.Public,
    },
    likes: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
    postCreatedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    freezedAt: Date,
    freezedBy: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
    restoredAt: Date,
    restoredBy: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }],
}, {
    timestamps: true,
});
postSchema.pre(["find", "findOne", "findOneAndUpdate", "updateOne"], async function () {
    const query = this.getQuery();
    if (query.paranoId === false) {
        this.setQuery({ ...query });
    }
    else {
        this.setQuery({ ...query, freezedAt: { $exists: false } });
    }
});
exports.PostModel = mongoose_1.default.models.Post || mongoose_1.default.model("Post", postSchema);
