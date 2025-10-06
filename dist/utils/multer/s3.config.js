"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFile = exports.createPreSignedURL = exports.uploadFiles = exports.uploadLargeFile = exports.uploadFile = exports.s3Config = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const cloud_multer_1 = require("./cloud.multer");
const uuid_1 = require("uuid");
const node_fs_1 = require("node:fs");
const err_response_1 = require("../response/err.response");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3Config = () => {
    return new client_s3_1.S3Client({
        region: process.env.REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });
};
exports.s3Config = s3Config;
const uploadFile = async ({ storageApproach = cloud_multer_1.StorageEnum.memory, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", path = "General", file, }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        ACL,
        Key: `${process.env.APPLICATION_NAME}/${path}/${(0, uuid_1.v4)()}-${file.originalname}`,
        Body: storageApproach === cloud_multer_1.StorageEnum.memory
            ? file.buffer
            : (0, node_fs_1.createReadStream)(file.path),
        ContentType: file.mimetype,
    });
    await (0, exports.s3Config)().send(command);
    if (!command?.input?.Key)
        throw new err_response_1.BadRequestExceptions("fail to upload file");
    return command.input.Key;
};
exports.uploadFile = uploadFile;
const uploadLargeFile = async ({ storageApproach = cloud_multer_1.StorageEnum.memory, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", path = "General", file, }) => {
    const upload = new lib_storage_1.Upload({
        client: (0, exports.s3Config)(),
        params: {
            Bucket,
            ACL,
            Key: `${process.env.APPLICATION_NAME}/${path}/${(0, uuid_1.v4)()}-${file.originalname}`,
            Body: storageApproach === cloud_multer_1.StorageEnum.memory
                ? file.buffer
                : (0, node_fs_1.createReadStream)(file.path),
            ContentType: file.mimetype,
        },
    });
    upload.on("httpUploadProgress", (progress) => {
        console.log("upload progress", progress);
    });
    const { Key } = await upload.done();
    if (!Key)
        throw new err_response_1.BadRequestExceptions("fail to upload file");
    return Key;
};
exports.uploadLargeFile = uploadLargeFile;
const uploadFiles = async ({ storageApproach = cloud_multer_1.StorageEnum.memory, Bucket = process.env.AWS_BUCKET_NAME, ACL = "private", path = "General", files, }) => {
    let urls = [];
    urls = await Promise.all(files.map((file) => {
        return (0, exports.uploadFile)({
            storageApproach,
            Bucket,
            ACL,
            path,
            file,
        });
    }));
    return urls;
};
exports.uploadFiles = uploadFiles;
const createPreSignedURL = async ({ Bucket = process.env.AWS_BUCKET_NAME, path = "general", ContentType, originalname, expiresIn = 120, }) => {
    const command = new client_s3_1.PutObjectCommand({
        Bucket,
        Key: `${process.env.APPLICATION_NAME}/${path}/${(0, uuid_1.v4)()}-preSigned-${originalname}`,
        ContentType,
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)((0, exports.s3Config)(), command, { expiresIn });
    if (!url || !command?.input?.Key)
        throw new err_response_1.BadRequestExceptions("fail to generate presignedURL");
    return { url, Key: command.input.Key };
};
exports.createPreSignedURL = createPreSignedURL;
const getFile = async ({ Bucket = process.env.AWS_BUCKET_NAME, Key, }) => {
    const command = new client_s3_1.GetObjectCommand({
        Bucket,
        Key,
    });
    return (0, exports.s3Config)().send(command);
};
exports.getFile = getFile;
