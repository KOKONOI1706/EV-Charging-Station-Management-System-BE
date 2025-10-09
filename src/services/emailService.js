import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../..', '.env') });

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

let transporter = null;
if (smtpHost && smtpPort && smtpUser && smtpPass) {
	transporter = nodemailer.createTransport({
		host: smtpHost,
		port: Number(smtpPort),
		secure: Number(smtpPort) === 465,
		auth: {
			user: smtpUser,
			pass: smtpPass
		}
	});
} else {
	console.warn('SMTP not configured - emails will be logged to console');
}

export async function sendVerificationEmail(to, code) {
	const subject = 'ChargeTech - Email verification code';
	const text = `Your verification code is: ${code}. It expires in 10 minutes.`;
	const html = `<p>Your verification code is: <strong>${code}</strong></p><p>It expires in 10 minutes.</p>`;

	if (!transporter) {
		console.log(`(email) To: ${to}\nSubject: ${subject}\n${text}`);
		return;
	}

	await transporter.sendMail({
		from: process.env.SMTP_FROM || 'no-reply@chargetech.example',
		to,
		subject,
		text,
		html
	});
}

export default {
	sendVerificationEmail,
};
