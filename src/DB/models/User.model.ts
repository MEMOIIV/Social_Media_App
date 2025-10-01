import mongoose, { HydratedDocument } from "mongoose";

export enum GenderEnum {
  male = "male",
  female = "female",
}
export enum RoleEnum {
  user = "User",
  admin = "Admin",
}
export enum ProviderEnum {
  google = "Google",
  system = "System",
}
export enum LogoutEnum {
  only = "Only",
  all = "All",
}
export interface IUser {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  fullName?: string;

  email: string;
  confirmEmailAt: Date;
  confirmEmailOTP?: String;

  password: string;
  resetPasswordOTP?: string;
  changeCredentialsTime?: Date;

  provider: ProviderEnum;
  gender?: GenderEnum;
  role: RoleEnum;

  phone?: string;
  address?: string;
  profileImage?: string;
  coverImages?: [];

  createdAt: Date;
  updatedAt?: Date;
  __v?: number;
}

const userSchema = new mongoose.Schema<IUser>(
  // field
  {
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
  },
  // options
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Computed fullname
userSchema
  .virtual("fullName")
  .set(function (val: string) {
    const [firstName, lastName] = val?.split(" ") || [];
    this.set({ firstName, lastName });
    return;
  })
  .get(function () {
    return this.firstName + " " + this.lastName;
  });

export const UserModel =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

// 2
export type HUserModel = HydratedDocument<IUser>;
