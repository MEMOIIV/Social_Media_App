import mongoose, { HydratedDocument } from "mongoose";

export interface IFriendRequest {
  createdBy: mongoose.Types.ObjectId;
  sendTo: mongoose.Types.ObjectId;
  acceptedAt?: Date;

  createdAt:Date
  updatedAt?:Date
}

export type HFriendModelDocument = HydratedDocument<IFriendRequest>;

const friendSchema = new mongoose.Schema<IFriendRequest>(
  // field
  {
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    sendTo:{
        type:mongoose.Schema.Types.ObjectId,
         required:true,
        ref:"User"
    },
    acceptedAt : Date,
  },
  // options
  { timestamps: true }
);

export const FriendModel =
  mongoose.models.Friend ||
  mongoose.model<IFriendRequest>("Friend", friendSchema);
