import z from "zod";
import { generalField } from "../../middleware/validationMiddleware";
import { fileValidation } from "../../utils/multer/cloud.multer";

export const chatSchema = {
  params: z.strictObject({
    userId: generalField.id,
  }),
};

export const groupChatSchema = {
  body: z
    .strictObject({
      participants: z.array(generalField.id).min(1),
      group: z.string().min(1).max(100),
      attachments: generalField.file(fileValidation.images).optional(),
    })
    .superRefine((data, ctx) => {
      if (
        data.participants.length &&
        data.participants.length !== [...new Set(data.participants)].length
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["participants"],
          message: "Please Provider Unique participants",
        });
      }
    }),
};

export const getGroupChatSchema = {
  params: z.strictObject({
    groupId: generalField.id,
  }),
};
