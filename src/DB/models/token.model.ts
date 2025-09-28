import mongoose, { HydratedDocument } from "mongoose";

export interface IToken {
  _id: mongoose.Types.ObjectId;
  jti: string;
  expiresIn: number;
  userId: mongoose.Types.ObjectId;
}
const tokenSchema = new mongoose.Schema<IToken>(
  // field
  {
    jti: {
      type: String,
      required: true,
      unique: true,
    },
    expiresIn: {
      type: Number,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref:"User"
    },
  },
  // options
  {
    timestamps: true,
  }
);

export const TokenModel = mongoose.models.Token|| mongoose.model<IToken> ("Token", tokenSchema);
export type HTokenDocument = HydratedDocument<IToken>;
