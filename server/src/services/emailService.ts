import nodemailer from "nodemailer";
import { config } from "dotenv";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";

config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // True cho 465, false cho 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Đảm bảo chứng chỉ SSL không bị từ chối (chỉ nên sử dụng nếu cần thiết)
  },
});

export const sendResetCodeEmail = async (email: string, resetCode: string) => {
  const templatePath = path.join(
    __dirname,
    "../views/emails/reset-password-email.ejs"
  );

  // Render template với dữ liệu
  const htmlContent = await ejs.renderFile(templatePath, { resetCode });
  await transporter.sendMail({
    from: '"Gens" <Gens@official.com>',
    to: email,
    subject: "Password Reset Code",
    text: `You requested a password reset. Use the following code to reset your password: ${resetCode}`,
    html: htmlContent,
  });
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${process.env.APP_URL}/api/auth/verify-email?token=${token}`;
  const templatePath = path.join(
    __dirname,
    "../views/emails/email-verification.ejs"
  );

  // Render Template với dữ liệu
  const htmlContent = await ejs.renderFile(templatePath, { verificationUrl });
  await transporter.sendMail({
    from: '"Gens" <Gens@official.com>',
    to: email,
    subject: "Verify your Email",
    text: `Làm ơn xác thực địa chỉ email của bạn bằng cách nhấp vào đường dẫn: ${verificationUrl}`,
    html: htmlContent,
  });
};
