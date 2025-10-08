import mongoose, { HydratedDocument } from "mongoose";

export interface IPost {
  _id: mongoose.Types.ObjectId;
}

const postSchema = new mongoose.Schema<IPost>(
  // field
  {},
  // options
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const PostModel =
  mongoose.models.User || mongoose.model<IPost>("Post", postSchema);
export type HPostModelDocument = HydratedDocument<IPost>;