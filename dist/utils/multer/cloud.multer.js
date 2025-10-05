"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudFileUpload = exports.fileValidation = exports.StorageEnum = void 0;
const multer_1 = __importDefault(require("multer"));
const node_os_1 = __importDefault(require("node:os"));
const uuid_1 = require("uuid");
const err_response_1 = require("../response/err.response");
var StorageEnum;
(function (StorageEnum) {
    StorageEnum["memory"] = "Memory";
    StorageEnum["disk"] = "Disk";
})(StorageEnum || (exports.StorageEnum = StorageEnum = {}));
exports.fileValidation = {
    images: ["image/jpeg", "image/png", "image/jpg"],
    pdf: ["application/pdf"],
    word: [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    videos: [
        "video/mp4",
        "video/mpeg",
        "video/ogg",
        "video/webm",
        "video/3gpp",
        "video/3gpp2",
        "video/x-msvideo",
    ],
};
const cloudFileUpload = ({ storageApproach = StorageEnum.memory, validation = [], maxsize = 2, }) => {
    const storage = storageApproach === StorageEnum.memory
        ? multer_1.default.memoryStorage()
        : multer_1.default.diskStorage({
            destination: node_os_1.default.tmpdir(),
            filename: (req, file, cb) => {
                cb(null, `${(0, uuid_1.v4)()}-${file.originalname}`);
            },
        });
    function fileFilter(req, file, cb) {
        if (!validation.includes(file.mimetype)) {
            return cb(new err_response_1.BadRequestExceptions("In-valid file type"));
        }
        return cb(null, true);
    }
    return (0, multer_1.default)({
        fileFilter,
        limits: { fileSize: maxsize * 1024 * 1024 },
        storage,
    });
};
exports.cloudFileUpload = cloudFileUpload;
