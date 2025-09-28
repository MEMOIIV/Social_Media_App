"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEvent = void 0;
const node_events_1 = require("node:events");
const template_email_1 = require("../email/template.email");
const send_email_utils_1 = require("../email/send.email.utils");
exports.emailEvent = new node_events_1.EventEmitter();
exports.emailEvent.on("confirmEmail", async (data) => {
    try {
        (data.subject = "confirm Your Email"),
            (data.html = (0, template_email_1.template)(data.otp, data.fullName, data.subject));
        await (0, send_email_utils_1.sendEmail)(data);
    }
    catch (error) {
        console.log("fail send email", error);
    }
});
