import { createTransport, Transporter } from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { BadRequestExceptions } from "../response/err.response";

export const sendEmail = async (data: Mail.Options): Promise<void> => {
  if (!data.html && !data.alternatives?.length && !data.text)
    throw new BadRequestExceptions("Messing email content");
  const transporter: Transporter<
    SMTPTransport.SentMessageInfo,
    SMTPTransport.Options
  > = createTransport({
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
