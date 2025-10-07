import {
  S3Client,
  PutObjectCommand,
  ObjectCannedACL,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  GetObjectCommandOutput,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3"; // upload file
import { StorageEnum } from "./cloud.multer";
import { v4 as uuid } from "uuid";
import { createReadStream } from "node:fs";
import { BadRequestExceptions } from "../response/err.response";
import { Upload } from "@aws-sdk/lib-storage"; // upload Large file
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Config = () => {
  return new S3Client({
    region: process.env.REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
};

export const uploadFile = async ({
  storageApproach = StorageEnum.memory,
  Bucket = process.env.AWS_BUCKET_NAME as string,
  ACL = "private",
  path = "General",
  file,
}: {
  storageApproach?: StorageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path?: string;
  file: Express.Multer.File;
}): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket,
    ACL,
    Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}-${
      file.originalname
    }`,
    Body:
      storageApproach === StorageEnum.memory
        ? file.buffer
        : createReadStream(file.path),
    ContentType: file.mimetype,
  });

  s3Config().send(command);

  if (!command?.input?.Key)
    throw new BadRequestExceptions("fail to upload file");

  return command.input.Key;
};

export const uploadLargeFile = async ({
  storageApproach = StorageEnum.memory,
  Bucket = process.env.AWS_BUCKET_NAME as string,
  ACL = "private",
  path = "General",
  file,
}: {
  storageApproach?: StorageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path?: string;
  file: Express.Multer.File;
}): Promise<string> => {
  const upload = new Upload({
    client: s3Config(),
    params: {
      Bucket,
      ACL,
      Key: `${process.env.APPLICATION_NAME}/${path}/${uuid()}-${
        file.originalname
      }`,
      Body:
        storageApproach === StorageEnum.memory
          ? file.buffer
          : createReadStream(file.path),
      ContentType: file.mimetype,
    },
    // partSize: 1024 * 1024 * 500, // 500 MB By => Default 5 MB
  });
  upload.on("httpUploadProgress", (progress) => {
    console.log("upload progress", progress);
  });

  const { Key } = await upload.done();
  if (!Key) throw new BadRequestExceptions("fail to upload file");

  return Key;
};

export const uploadFiles = async ({
  storageApproach = StorageEnum.memory,
  Bucket = process.env.AWS_BUCKET_NAME as string,
  ACL = "private",
  path = "General",
  files,
}: {
  storageApproach?: StorageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path?: string;
  files: Express.Multer.File[];
}): Promise<string[]> => {
  let urls: string[] = [];
  urls = await Promise.all(
    files.map((file) => {
      return uploadFile({
        storageApproach,
        Bucket,
        ACL,
        path,
        file,
      });
    })
  );
  return urls;
};

// PreSignedURL
export const createPreSignedURL = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  path = "general",
  ContentType,
  Originalname,
  expiresIn = 120,
}: {
  Bucket?: string;
  path?: string;
  ContentType: string;
  Originalname: string;
  expiresIn?: number;
}): Promise<{ url: string; Key: string }> => {
  const command = new PutObjectCommand({
    Bucket,
    Key: `${
      process.env.APPLICATION_NAME
    }/${path}/${uuid()}-preSigned-${Originalname}`,
    ContentType,
  });

  const url = await getSignedUrl(s3Config(), command, { expiresIn });

  if (!url || !command?.input?.Key)
    throw new BadRequestExceptions("fail to generate presignedURL");

  return { url, Key: command.input.Key };
};

// Get Asset With PreSignedURL
export const createGetPreSignedURL = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  Key,
  downloadName = "dummy",
  download = "false",
  path,
  expiresIn = 120,
}: {
  Bucket?: string;
  Key: string;
  downloadName?: string;
  download?: string;
  path?: string;
  expiresIn?: number;
}): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
    ResponseContentDisposition:
      download === "true"
        ? `attachment;filename=${downloadName}.${path}`
        : undefined,
  });

  const url = await getSignedUrl(s3Config(), command, { expiresIn });

  if (!url) throw new BadRequestExceptions("Fail to generate presignedURL");

  return url;
};

// Get asset
export const getFile = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  Key,
}: {
  Bucket?: string;
  Key: string;
}): Promise<GetObjectCommandOutput> => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
  });
  return s3Config().send(command);
};

// Delete File
export const deleteFile = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  Key,
}: {
  Bucket?: string;
  Key: string;
}): Promise<DeleteObjectCommandOutput> => {
  const command = new DeleteObjectCommand({
    Bucket,
    Key,
  });

  return s3Config().send(command);
};

// Delete Files
export const deleteFiles = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  urls,
  Quiet = false,
}: {
  Bucket?: string;
  urls: string[];
  Quiet?: boolean;
}): Promise<DeleteObjectsCommandOutput> => {
  // Objects = [{Key:""} , {Key:""}]
  const Objects = urls.map((url) => {
    return { Key: url };
  });

  const command = new DeleteObjectsCommand({
    Bucket,
    Delete: {
      Objects,
      Quiet,
    },
  });

  return s3Config().send(command);
};

// select files into folder
export const listDirectoryFiles = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  path,
}: {
  Bucket?: string;
  path: string;
}) => {
  const command = new ListObjectsV2Command({
    Bucket,
    Prefix: `${process.env.APPLICATION_NAME}/${path}`,
  });

  return s3Config().send(command);
};

// Delete Folder
export const deleteFolderByPrefix = async ({
  Bucket = process.env.AWS_BUCKET_NAME as string,
  path,
  Quiet = false,
}: {
  Bucket?: string;
  path: string;
  Quiet?: boolean;
}): Promise<DeleteObjectsCommandOutput> => {

  const fileList = await listDirectoryFiles({ Bucket, path });

  if (!fileList?.Contents?.length)
    throw new BadRequestExceptions("Empty directory");

  const urls: string[] = fileList.Contents.map((file) => {
    return file.Key as string;
  });

  return await deleteFiles({ urls  , Bucket , Quiet});
};
