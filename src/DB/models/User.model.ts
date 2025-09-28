import mongoose, { HydratedDocument } from "mongoose";

export enum GenderEnum {
  male = "male",
  female = "female",
}

export enum RoleEnum {
  user = "User",
  admin = "Admin",
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

  gender?: GenderEnum;
  role: RoleEnum;

  createdAt: Date;
  updatedAt?: Date;
  __v?: number;

  phone?: string;
  address?: string;
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
export type HUserModel = HydratedDocument<IUser>
