"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.LogoutEnum = exports.ProviderEnum = exports.RoleEnum = exports.GenderEnum = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const err_response_1 = require("../../utils/response/err.response");
const hash_utils_1 = require("../../utils/security/hash.utils");
const email_event_1 = require("../../utils/events/email.event");
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["male"] = "male";
    GenderEnum["female"] = "female";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
var RoleEnum;
(function (RoleEnum) {
    RoleEnum["user"] = "User";
    RoleEnum["admin"] = "Admin";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
var ProviderEnum;
(function (ProviderEnum) {
    ProviderEnum["google"] = "Google";
    ProviderEnum["system"] = "System";
})(ProviderEnum || (exports.ProviderEnum = ProviderEnum = {}));
var LogoutEnum;
(function (LogoutEnum) {
    LogoutEnum["only"] = "Only";
    LogoutEnum["all"] = "All";
})(LogoutEnum || (exports.LogoutEnum = LogoutEnum = {}));
const userSchema = new mongoose_1.default.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
        minlength: [2, "First name must be at least 2 characters long"],
        maxlength: [20, "First name cannot exceed 20 characters"],
    },
    lastName: {
        type: String,
        minlength: [2, "Last name must be at least 2 characters long"],
        maxlength: [20, "Last name cannot exceed 20 characters"],
    },
    slug: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 41,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
    },
    confirmEmailAt: Date,
    confirmEmailOTP: String,
    password: {
        type: String,
        required: function () {
            return this.provider === ProviderEnum.system ? true : false;
        },
    },
    resetPasswordOTP: String,
    changeCredentialsTime: Date,
    provider: {
        type: String,
        enum: ProviderEnum,
        default: ProviderEnum.system,
    },
    gender: {
        type: String,
        enum: GenderEnum,
        default: GenderEnum.male,
    },
    role: {
        type: String,
        enum: RoleEnum,
        default: RoleEnum.user,
    },
    phone: String,
    address: String,
    profileImage: String,
    coverImages: [String],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema
    .virtual("fullName")
    .set(function (val) {
    const [firstName, lastName] = val?.split(" ") || [];
    this.set({ firstName, lastName, slug: val.replaceAll(/\s+/g, "-") });
    return;
})
    .get(function () {
    return ` ${this.firstName} ${this.lastName}`;
});
userSchema.pre("validate", function (next) {
    if (!this.slug?.includes("-")) {
        throw new err_response_1.BadRequestExceptions("Slug is required and must hold - like example : first-name-last-name");
    }
    next();
});
userSchema.pre("save", async function (next) {
    this.wasNew = this.isNew;
    console.log("Pre Hook", this.wasNew);
    if (this.isModified("password")) {
        this.password = await (0, hash_utils_1.generateHash)(this.password);
    }
});
userSchema.post("save", function (doc, next) {
    const that = this;
    console.log(that.wasNew);
    if (that.wasNew) {
        email_event_1.emailEvent.emit("confirmEmail", { to: this.email, otp: 123456 });
    }
});
exports.UserModel = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
