import mongoose, { HydratedDocument } from "mongoose";

export interface IMessages {
  content: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IChat {
  // ovo
  participants: mongoose.Types.ObjectId[];
  messages: IMessages[];

  // ovm --> group
  group?: string;
  group_image?: string;
  roomId?: string;

  // common
  createdBy: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export type HChatModelDocument = HydratedDocument<IChat>;

export type HMessageDocument = HydratedDocument<IMessages>;

const messageSchema = new mongoose.Schema<IMessages>(
  // field
  {
    content: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 5000,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  // options
  { timestamps: true }
);

const chatSchema = new mongoose.Schema<IChat>(
  // field
  {
    // ovo
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [messageSchema],

    // ovm --> group
    group: String,
    group_image: String,
    roomId: {
      type: String,
      required: function () {
        return this.roomId;
      },
    },

    // common
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  // options
  { timestamps: true }
);

export const ChatModel =
  mongoose.models.Chat || mongoose.model("Chat", chatSchema);
