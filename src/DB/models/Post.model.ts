import mongoose, { type HydratedDocument } from "mongoose";

export enum AllowCommentsEnum {
  Allow = "Allow",
  Deny = "Deny",
}

export enum AvailabilityEnum {
  Private = "Private",
  Public = "Public",
  Friends = "Friends",
}

export interface IPost {
  content?: string;
  attachments?: string[];

  allowComments: AllowCommentsEnum;
  availability: AvailabilityEnum;

  tags?: mongoose.Types.ObjectId[];
  likes?: mongoose.Types.ObjectId[];

  postCreatedBy: mongoose.Types.ObjectId;

  freezedAt?: Date;
  freezedBy?: mongoose.Types.ObjectId;

  restoredAt?: Date;
  restoredBy?: mongoose.Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export type HPostModelDocument = HydratedDocument<IPost>;

const postSchema = new mongoose.Schema<IPost>(
  // field
  {
    content: {
      type: String,
      minLength: 2,
      maxLength: 2000,
      required: function () {
        return !this.attachments?.length;
      },
    },
    attachments: [String],
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
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    postCreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref:"User"
    },
    freezedAt: Date,
    freezedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    restoredAt: Date,
    restoredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  // options
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const PostModel =
  mongoose.models.Post || mongoose.model<IPost>("Post", postSchema);
