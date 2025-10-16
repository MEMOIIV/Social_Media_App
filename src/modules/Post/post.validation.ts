import z from "zod";
import {
  ActionEnum,
  AllowCommentsEnum,
  AvailabilityEnum,
} from "../../DB/models/Post.model";
import { generalField } from "../../middleware/validationMiddleware";
import { fileValidation } from "../../utils/multer/cloud.multer";

export const cratePostSchema = {
  body: z
    .strictObject({
      // strictObject => does not allowed any field from out this validation
      content: z.string().min(2).max(2000).optional(),
      attachments: z
        .array(generalField.file(fileValidation.images))
        .max(3)
        .optional(),
      allowComments: z.enum(AllowCommentsEnum).default(AllowCommentsEnum.Allow),
      availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.Public),
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

export const likeAndUnlikePostSchema = {
  params: z.strictObject({
    postId: generalField.id,
  }),
  query: z.strictObject({
    action: z.enum(ActionEnum).default(ActionEnum.like),
  }),
};

export const updatePostSchema = {
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
      allowComments: z.enum(AllowCommentsEnum).default(AllowCommentsEnum.Allow),
      availability: z.enum(AvailabilityEnum).default(AvailabilityEnum.Public),
      likes: z.string().optional(),
      tags: z.array(generalField.id).max(10).optional(),
      removedTags: z.array(generalField.id).max(10).optional(),
      removedAttachments: z.array(z.string()).max(3).optional(),
    })
    .superRefine((data, ctx) => {
      // tags
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
      // removed tags
      if (
        data.removedTags?.length &&
        data.removedTags?.length !== [...new Set(data.removedTags)].length // if removedTags =>  not unique removedTags
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["removedTags"],
          message: "pleas provide unique removedTags",
        });
      }
    }),
};

export const getPostsSchema = {
  query: z.strictObject({
    page: z.coerce.number(),
    limit: z.coerce.number(),
  }),
};
