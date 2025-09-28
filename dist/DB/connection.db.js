"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(process.env.DB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(chalk_1.default.bgBlue(`MongoDB Connected : ${conn.connection.host}`));
    }
    catch (error) {
        console.log(chalk_1.default.bgRed(`MongoDB fail Connected ${error.message}`));
    }
};
exports.default = connectDB;
