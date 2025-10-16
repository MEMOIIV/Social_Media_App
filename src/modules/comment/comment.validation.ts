import z from "zod";
import { generalField } from "../../middleware/validationMiddleware";
import { fileValidation } from "../../utils/multer/cloud.multer";

export const crateCommentSchema = {
  params: z.strictObject({
    postId: generalField.id,
  }),
  body: z
    .strictObject({
      content: z.string().min(2).max(2000).optional(),
      attachments: z
        .array(generalField.file(fileValidation.images))
        .max(3)
        .optional(),
      likes: z.string().optional(),
      tags: z.array(generalField.id).max(10).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.attachments?.length && !data.content) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "pleas provide content or attachments",
        });
      }
      if (
        data.tags?.length &&
        data.tags?.length !== [...new Set(data.tags)].length // if tags =>  not unique tags
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["tags"],
          message: "pleas provide unique tags",
        });
      }
    }),
};

export const crateReplaySchema = {
  params: crateCommentSchema.params.extend({
    commentId: generalField.id,
  }),
  body: crateCommentSchema.body,
};
