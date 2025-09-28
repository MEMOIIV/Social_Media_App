"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparHash = exports.generateHash = void 0;
const bcrypt_1 = require("bcrypt");
const generateHash = async (plaintext, saltRound = Number(process.env.SALT_ROUND)) => {
    return await (0, bcrypt_1.hash)(plaintext, saltRound);
};
exports.generateHash = generateHash;
const comparHash = async (plaintext, hashValue) => {
    return await (0, bcrypt_1.compare)(plaintext, hashValue);
};
exports.comparHash = comparHash;
