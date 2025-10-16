import type { NextFunction, Request, Response } from "express";
import z, { ZodError, ZodType } from "zod";
import { BadRequestExceptions } from "../utils/response/err.response";
import { Types } from "mongoose";

type ReqTypeKey = keyof Request;
type SchemaType = Partial<Record<ReqTypeKey, ZodType>>;

export const validation = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction): NextFunction => {
    const validationErrors: Array<{
      kye: ReqTypeKey;
      issues: Array<{
        message: string;
        path: (string | number | symbol)[];
      }>;
    }> = [];
    for (const kye of Object.keys(schema) as ReqTypeKey[]) {
      if (!schema[kye]) continue;

      // in case i used form data to send data i need to handle the request to apply validation on file
      // this way add the attachment in row body
      if (req.file) {
        req.body.attachments = req.file;
      }
      
      if (req.files) {
        req.body.attachments = req.files;
      }

      const validationResult = schema[kye].safeParse(req[kye]);
      if (!validationResult.success) {
        const errors = validationResult.error as ZodError;
        validationErrors.push({
          kye,
          issues: errors.issues.map((issue) => {
            return { message: issue.message, path: issue.path };
          }),
        });
      }
      if (validationErrors.length > 0)
        throw new BadRequestExceptions("validation errors", {
          cause: validationErrors,
        });
    }
    return next() as unknown as NextFunction;
  };
};

export const generalField = {
  // default required if i want be option write => .optional()
  fullName: z
    .string({ error: "username must be string" })
    .min(2, { error: "min length must be 2" })
    .max(20, { error: "max length must be 20" }),
  email: z.email({ error: "invalid email" }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(12, "Password must be a maximum of 12 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one digit")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character"
    ),
  confirmPassword: z.string(),
  otp: z.string().regex(/^\d{6}/),
  file: function (mimetypes: string[]) {
    return z
      .strictObject({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.string(),
        // buffer well be includes in case i used memory storage and in case i used dis storage the path well pe includes
        buffer: z.any().optional(), //instanceof(Buffer),
        path: z.string().optional(),
        size: z.number(),
      })
      .refine(
        (data) => {
          return data.buffer || data.path;
        },
        { message: "Please provide a file " }
      )
      .refine(
        (file) => {
          return mimetypes.includes(file.mimetype);
        },
        { message: `Invalid file type. Allowed types: ${mimetypes.join(", ")}` }
      );
  },
  id: z
    .string()
    .refine((data) => Types.ObjectId.isValid(data), {
      message: "In-valid tag id",
    }),
};
