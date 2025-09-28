import { EventEmitter } from "node:events";
// import { sendEmail } from "../email/send.email.utils";
import Mail from "nodemailer/lib/mailer";
import { template } from "../email/template.email";
import { sendEmail } from "../email/send.email.utils";

export const emailEvent = new EventEmitter();

interface IMail extends Mail.Options {
  otp: number;
  fullName: string;
}

emailEvent.on("confirmEmail", async (data: IMail) => {
  try {
    (data.subject = "confirm Your Email"),
      (data.html = template(data.otp, data.fullName, data.subject));
    await sendEmail(data);
  } catch (error) {
    console.log("fail send email", error);
  }
});
