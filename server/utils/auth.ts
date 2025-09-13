import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { emailOTP } from "better-auth/plugins";
import { betterAuth } from "better-auth";
import nodemailer from "nodemailer";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const client = new PrismaClient();
const config = useRuntimeConfig();

const sesClient = new SESv2Client({
  region: config.awsRegion,
  credentials: {
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey,
  },
});

const transporter = nodemailer.createTransport({
  SES: { sesClient, SendEmailCommand },
});

export const auth = betterAuth({
  database: prismaAdapter(client, {
    provider: "sqlite",
  }),
  appName: "nuxt-app",
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }, request) {
        try {
          await transporter.sendMail({
            from: config.emailFrom,
            to: email,
            subject: `Your OTP for ${type}`,
            text: `Your OTP is: ${otp}`,
            html: `<b>Your OTP is: ${otp}</b>`,
          });
        } catch (error) {
          console.error("Error sending OTP email:", error);
        }
      },
    }),
  ],
});
