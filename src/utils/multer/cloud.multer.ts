import type { Request } from "express";
import multer, { FileFilterCallback, type Multer } from "multer";
import os from "node:os";
import { v4 as uuid } from "uuid";
import { BadRequestExceptions } from "../response/err.response";

export enum StorageEnum {
  memory = "Memory",
  disk = "Disk",
}

export const fileValidation = {
  images: ["image/jpeg", "image/png", "image/jpg"],
  pdf: ["application/pdf"],
  word: [
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  ],
  videos: [
    "video/mp4",
    "video/mpeg",
    "video/ogg",
    "video/webm",
    "video/3gpp",
    "video/3gpp2",
    "video/x-msvideo", // avi
  ],
};

export const cloudFileUpload = ({
  storageApproach = StorageEnum.memory,
  validation = [],
  maxsize = 2,
}: {
  storageApproach?: StorageEnum;
  validation?: string[];
  maxsize?: number | undefined;
}): Multer => {
  const storage =
    storageApproach === StorageEnum.memory
      ? multer.memoryStorage() // In memoryStorage the file automatic stored in os.tmpdir => (temporary directory)
      : multer.diskStorage({
          destination: os.tmpdir(), // هخزن فين => function or ""
          filename: (req: Request, file: Express.Multer.File, cb) => {
            cb(null, `${uuid()}-${file.originalname}`);
          }, // هخزن باسم اي
        });

  function fileFilter(
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) {
    if (!validation.includes(file.mimetype)) {
      return cb(new BadRequestExceptions("In-valid file type"));
    }
    return cb(null, true);
  }

  return multer({
    fileFilter,
    limits: { fileSize: maxsize * 1024 * 1024 },
    storage,
  });
};
