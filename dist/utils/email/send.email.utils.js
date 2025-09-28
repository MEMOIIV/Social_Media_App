"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = require("nodemailer");
const err_response_1 = require("../response/err.response");
const sendEmail = async (data) => {
    if (!data.html && !data.alternatives?.length && !data.text)
        throw new err_response_1.BadRequestExceptions("Messing email content");
    const transporter = (0, nodemailer_1.createTransport)({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.APP_PASS,
        },
    });
    await transporter.sendMail({
        ...data,
        from: `"Social Media" <${process.env.EMAIL}>`,
    });
};
exports.sendEmail = sendEmail;
