"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.LogoutEnum = exports.RoleEnum = exports.GenderEnum = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
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
        required: [true, "Last name is required"],
        minlength: [2, "Last name must be at least 2 characters long"],
        maxlength: [20, "Last name cannot exceed 20 characters"],
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
        required: true,
    },
    resetPasswordOTP: String,
    changeCredentialsTime: Date,
    gender: {
        type: String,
        enum: {
            values: Object.values(GenderEnum),
            message: `gender only allow ${Object.values(GenderEnum)}`,
        },
        default: GenderEnum.male,
    },
    role: {
        type: String,
        enum: {
            values: Object.values(RoleEnum),
            message: `gender only allow ${Object.values(RoleEnum)}`,
        },
        default: RoleEnum.user,
    },
    phone: String,
    address: String,
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema
    .virtual("fullName")
    .set(function (val) {
    const [firstName, lastName] = val?.split(" ") || [];
    this.set({ firstName, lastName });
    return;
})
    .get(function () {
    return this.firstName + " " + this.lastName;
});
exports.UserModel = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
