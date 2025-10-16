import mongoose, { type HydratedDocument } from "mongoose";
import { IPost } from "./Post.model";

export interface IComment {
  content?: string;
  attachments?: string[];

  tags?: mongoose.Types.ObjectId[];
  likes?: mongoose.Types.ObjectId[];

  commentCreatedBy: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId | Partial<IPost>;
  commentId?: mongoose.Types.ObjectId;

  freezedAt?: Date;
  freezedBy?: mongoose.Types.ObjectId;

  restoredAt?: Date;
  restoredBy?: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt?: Date;
}

export type HCommentModelDocument = HydratedDocument<IComment>;

const commentSchema = new mongoose.Schema<IComment>(
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
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    commentCreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Post",
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    freezedAt: Date,
    freezedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    restoredAt: Date,
    restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  // options
  {
    timestamps: true,
  }
);

// Filter out freezed users by default
commentSchema.pre(["find" , "findOne", "findOneAndUpdate" , "updateOne"] , async function(){
   const query = this.getQuery();
  if (query.paranoId === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, freezedAt: { $exists: false } });
  }
})

export const CommentModel =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", commentSchema);
