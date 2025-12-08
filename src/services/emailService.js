/**
 * ===============================================================
 * EMAIL SERVICE (BACKEND)
 * ===============================================================
 * Service gửi email qua SMTP (Gmail) hoặc log ra console nếu chưa config
 * 
 * Chức năng:
 * - ✉️ Gửi email xác thực đăng ký (verification code)
 * - 🔑 Gửi email reset password (reset code)
 * - 📧 Gửi email thông báo (booking confirmed, payment success, etc.)
 * - 🎨 HTML email templates responsive, đẹp mắt
 * - ⚠️ Fallback: Log to console nếu SMTP chưa config
 * 
 * Email templates:
 * 
 * 1. sendVerificationEmail(to, code)
 *    - Gửi mã xác thực 6 số khi user đăng ký
 *    - Code có hiệu lực 10 phút
 *    - Template: Logo ChargeTech + Gradient header + Code box
 * 
 * 2. sendPasswordResetEmail(to, code)
 *    - Gửi mã reset password 6 số
 *    - Code có hiệu lực 10 phút
 *    - Template tương tự verification nhưng chủ đề khác
 * 
 * 3. sendBookingConfirmationEmail(to, bookingData)
 *    - Thông báo booking đã confirmed
 *    - Hiển thị: Station name, address, time, charging point
 * 
 * 4. sendPaymentSuccessEmail(to, paymentData)
 *    - Thông báo thanh toán thành công
 *    - Hiển thị: Amount, method (MoMo/VNPay), session details
 * 
 * SMTP Configuration (.env):
 * ```
 * SMTP_HOST=smtp.gmail.com
 * SMTP_PORT=587
 * SMTP_USER=your-email@gmail.com
 * SMTP_PASS=your-app-password  # Gmail App Password, NOT regular password
 * ```
 * 
 * Security:
 * - Sử dụng Gmail App Password, KHÔNG dùng password thường
 * - TLS encryption (port 587) hoặc SSL (port 465)
 * - Không log sensitive data (password, code) ra console
 * 
 * Dependencies:
 * - nodemailer: SMTP client
 * - dotenv: Load SMTP credentials từ .env
 * - HTML/CSS: Inline styles cho email compatibility
 */

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
	console.log('✅ SMTP configured - emails will be sent via Gmail');
} else {
	console.warn('⚠️  SMTP not configured - emails will be logged to console');
}

// ============================================
// 1. EMAIL XÁC THỰC ĐĂNG KÝ
// ============================================
export async function sendVerificationEmail(to, code) {
	const subject = '⚡ ChargeTech - Mã xác thực email';
	const text = `Mã xác thực của bạn là: ${code}. Mã có hiệu lực trong 10 phút.`;
	
	const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>ChargeTech - Mã xác thực</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Arial, sans-serif;">
	<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
		<tr>
			<td align="center">
				<!-- Main Container -->
				<table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
					
					<!-- Header with Logo -->
					<tr>
						<td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 20px; text-align: center;">
							<div style="background-color: #ffffff; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
								<span style="font-size: 40px;">⚡</span>
							</div>
							<h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">ChargeTech</h1>
							<p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Hệ thống sạc xe điện thông minh</p>
						</td>
					</tr>
					
					<!-- Content -->
					<tr>
						<td style="padding: 40px 30px;">
							<h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Xác thực tài khoản</h2>
							<p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
								Chào mừng bạn đến với ChargeTech! Để hoàn tất đăng ký tài khoản, vui lòng sử dụng mã xác thực bên dưới:
							</p>
							
							<!-- Verification Code Box -->
							<table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
								<tr>
									<td align="center" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 3px dashed #059669; border-radius: 12px; padding: 30px;">
										<p style="margin: 0 0 10px 0; color: #065f46; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Mã xác thực</p>
										<div style="font-size: 42px; font-weight: bold; color: #059669; letter-spacing: 8px; font-family: 'Courier New', monospace;">
											${code}
										</div>
										<p style="margin: 15px 0 0 0; color: #059669; font-size: 13px;">
											⏰ Mã có hiệu lực trong <strong>10 phút</strong>
										</p>
									</td>
								</tr>
							</table>
							
							<!-- Instructions -->
							<div style="background-color: #f9fafb; border-left: 4px solid #059669; padding: 20px; border-radius: 8px; margin: 30px 0;">
								<p style="margin: 0 0 10px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
									📝 Hướng dẫn:
								</p>
								<ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
									<li>Quay lại trang đăng ký</li>
									<li>Nhập mã <strong>6 chữ số</strong> ở trên</li>
									<li>Nhấn nút "Xác thực"</li>
								</ol>
							</div>
							
							<p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
								Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
							</p>
						</td>
					</tr>
					
					<!-- Footer -->
					<tr>
						<td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
							<p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
								© 2025 ChargeTech. All rights reserved.
							</p>
							<p style="margin: 0; color: #9ca3af; font-size: 12px;">
								Email này được gửi tự động, vui lòng không trả lời.
							</p>
							<div style="margin-top: 20px;">
								<a href="#" style="color: #059669; text-decoration: none; font-size: 12px; margin: 0 10px;">Trang chủ</a>
								<span style="color: #d1d5db;">|</span>
								<a href="#" style="color: #059669; text-decoration: none; font-size: 12px; margin: 0 10px;">Hỗ trợ</a>
								<span style="color: #d1d5db;">|</span>
								<a href="#" style="color: #059669; text-decoration: none; font-size: 12px; margin: 0 10px;">Điều khoản</a>
							</div>
						</td>
					</tr>
					
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
	`;

	if (!transporter) {
		console.log(`📧 [EMAIL] To: ${to}\n📧 [EMAIL] Subject: ${subject}\n📧 [EMAIL] ${text}`);
		return;
	}

	await transporter.sendMail({
		from: `ChargeTech ⚡ <${process.env.SMTP_USER}>`,
		to,
		subject,
		text,
		html
	});
}

// ============================================
// 2. EMAIL CHÀO MỪNG
// ============================================
export async function sendWelcomeEmail(to, userName) {
	const subject = '🎉 Chào mừng đến với ChargeTech!';
	const text = `Chào ${userName}! Chúc mừng bạn đã tạo tài khoản ChargeTech thành công. Hãy bắt đầu khám phá các trạm sạc xe điện gần bạn!`;
	
	const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Chào mừng đến với ChargeTech</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Arial, sans-serif;">
	<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
		<tr>
			<td align="center">
				<table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
					
					<!-- Header -->
					<tr>
						<td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 50px 20px; text-align: center;">
							<div style="background-color: #ffffff; width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 6px 20px rgba(0,0,0,0.2);">
								<span style="font-size: 50px;">🎉</span>
							</div>
							<h1 style="color: #ffffff; margin: 0; font-size: 36px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Chào mừng đến với ChargeTech!</h1>
							<p style="color: #d1fae5; margin: 15px 0 0 0; font-size: 18px;">Tài khoản của bạn đã được kích hoạt</p>
						</td>
					</tr>
					
					<!-- Content -->
					<tr>
						<td style="padding: 50px 40px;">
							<h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 28px; font-weight: 600; text-align: center;">
								Xin chào, ${userName}! 👋
							</h2>
							<p style="color: #4b5563; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; text-align: center;">
								Chúc mừng bạn đã tham gia cộng đồng ChargeTech - nền tảng sạc xe điện thông minh hàng đầu Việt Nam!
							</p>
							
							<!-- Features Grid -->
							<table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0;">
								<tr>
									<td width="50%" style="padding: 20px;" align="center">
										<div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 30px; height: 100%;">
											<div style="font-size: 48px; margin-bottom: 15px;">🗺️</div>
											<h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">Tìm trạm sạc</h3>
											<p style="color: #047857; margin: 0; font-size: 14px; line-height: 1.6;">
												Khám phá hàng nghìn trạm sạc trên toàn quốc
											</p>
										</div>
									</td>
									<td width="50%" style="padding: 20px;" align="center">
										<div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; padding: 30px; height: 100%;">
											<div style="font-size: 48px; margin-bottom: 15px;">📅</div>
											<h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">Đặt lịch dễ dàng</h3>
											<p style="color: #1d4ed8; margin: 0; font-size: 14px; line-height: 1.6;">
												Book trước, không lo chờ đợi
											</p>
										</div>
									</td>
								</tr>
								<tr>
									<td width="50%" style="padding: 20px;" align="center">
										<div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 30px; height: 100%;">
											<div style="font-size: 48px; margin-bottom: 15px;">⚡</div>
											<h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">Sạc siêu nhanh</h3>
											<p style="color: #b45309; margin: 0; font-size: 14px; line-height: 1.6;">
												Công nghệ sạc nhanh DC, tiết kiệm thời gian
											</p>
										</div>
									</td>
									<td width="50%" style="padding: 20px;" align="center">
										<div style="background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); border-radius: 12px; padding: 30px; height: 100%;">
											<div style="font-size: 48px; margin-bottom: 15px;">💳</div>
											<h3 style="color: #9f1239; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">Thanh toán linh hoạt</h3>
											<p style="color: #be123c; margin: 0; font-size: 14px; line-height: 1.6;">
												Nhiều hình thức thanh toán tiện lợi
											</p>
										</div>
									</td>
								</tr>
							</table>
							
							<!-- CTA Button -->
							<table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0;">
								<tr>
									<td align="center">
										<a href="http://localhost:3000" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 12px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);">
											🚀 Khám phá ngay
										</a>
									</td>
								</tr>
							</table>
							
							<!-- Tips -->
							<div style="background-color: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 25px; margin: 40px 0;">
								<p style="margin: 0 0 15px 0; color: #92400e; font-size: 16px; font-weight: 600;">
									💡 Mẹo nhỏ cho bạn:
								</p>
								<ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 1.8;">
									<li>Đặt lịch trước 30 phút để đảm bảo có chỗ</li>
									<li>Kiểm tra loại cổng sạc phù hợp với xe của bạn</li>
									<li>Tích điểm thành viên để nhận ưu đãi hấp dẫn</li>
									<li>Cập nhật app thường xuyên để nhận thông báo mới</li>
								</ul>
							</div>
							
							<p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
								Cần hỗ trợ? Liên hệ với chúng tôi qua email hoặc hotline 24/7
							</p>
						</td>
					</tr>
					
					<!-- Footer -->
					<tr>
						<td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
							<div style="margin-bottom: 20px;">
								<a href="#" style="display: inline-block; margin: 0 10px;">
									<img src="https://img.icons8.com/color/48/000000/facebook-new.png" alt="Facebook" style="width: 32px; height: 32px;" />
								</a>
								<a href="#" style="display: inline-block; margin: 0 10px;">
									<img src="https://img.icons8.com/color/48/000000/instagram-new.png" alt="Instagram" style="width: 32px; height: 32px;" />
								</a>
								<a href="#" style="display: inline-block; margin: 0 10px;">
									<img src="https://img.icons8.com/color/48/000000/youtube-play.png" alt="YouTube" style="width: 32px; height: 32px;" />
								</a>
							</div>
							<p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
								© 2025 ChargeTech. All rights reserved.
							</p>
							<p style="margin: 0; color: #9ca3af; font-size: 12px;">
								📧 support@chargetech.vn | ☎️ 1900-xxxx
							</p>
						</td>
					</tr>
					
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
	`;

	if (!transporter) {
		console.log(`(email) To: ${to}\nSubject: ${subject}\n${text}`);
		return;
	}

	await transporter.sendMail({
		from: `ChargeTech ⚡ <${process.env.SMTP_USER}>`,
		to,
		subject,
		text,
		html
	});
}

export async function sendPasswordResetEmail(to, resetCode) {
	const subject = '🔐 ChargeTech - Đặt lại mật khẩu';
	const text = `Mã đặt lại mật khẩu của bạn là: ${resetCode}. Mã có hiệu lực trong 15 phút.`;
	
	const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>ChargeTech - Đặt lại mật khẩu</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Arial, sans-serif;">
	<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
		<tr>
			<td align="center">
				<table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
					
					<!-- Header -->
					<tr>
						<td style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px 20px; text-align: center;">
							<div style="background-color: #ffffff; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
								<span style="font-size: 40px;">🔐</span>
							</div>
							<h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">ChargeTech</h1>
							<p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">Yêu cầu đặt lại mật khẩu</p>
						</td>
					</tr>
					
					<!-- Content -->
					<tr>
						<td style="padding: 40px 30px;">
							<h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Đặt lại mật khẩu</h2>
							<p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
								Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Sử dụng mã bên dưới để tiếp tục:
							</p>
							
							<!-- Security Warning -->
							<div style="background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; margin: 30px 0;">
								<p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
									<strong>⚠️ Cảnh báo bảo mật:</strong><br/>
									Nếu bạn không thực hiện yêu cầu này, vui lòng <strong>bỏ qua email</strong> và liên hệ với chúng tôi ngay lập tức.
								</p>
							</div>
							
							<!-- Reset Code Box -->
							<table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
								<tr>
									<td align="center" style="background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%); border: 3px dashed #dc2626; border-radius: 12px; padding: 30px;">
										<p style="margin: 0 0 10px 0; color: #991b1b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Mã đặt lại mật khẩu</p>
										<div style="font-size: 42px; font-weight: bold; color: #dc2626; letter-spacing: 8px; font-family: 'Courier New', monospace;">
											${resetCode}
										</div>
										<p style="margin: 15px 0 0 0; color: #dc2626; font-size: 13px;">
											⏰ Mã có hiệu lực trong <strong>15 phút</strong>
										</p>
									</td>
								</tr>
							</table>
							
							<!-- Instructions -->
							<div style="background-color: #f9fafb; border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px; margin: 30px 0;">
								<p style="margin: 0 0 10px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
									📝 Hướng dẫn:
								</p>
								<ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
									<li>Quay lại trang đặt lại mật khẩu</li>
									<li>Nhập mã <strong>6 chữ số</strong> ở trên</li>
									<li>Tạo mật khẩu mới (tối thiểu 6 ký tự)</li>
									<li>Xác nhận và lưu mật khẩu mới</li>
								</ol>
							</div>
							
							<!-- Security Tips -->
							<div style="background-color: #fffbeb; border-radius: 12px; padding: 20px; margin: 30px 0;">
								<p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: 600;">
									🔒 Mẹo bảo mật:
								</p>
								<ul style="margin: 0; padding-left: 20px; color: #78350f; font-size: 13px; line-height: 1.6;">
									<li>Sử dụng mật khẩu mạnh (chữ hoa, chữ thường, số, ký tự đặc biệt)</li>
									<li>Không sử dụng lại mật khẩu cũ</li>
									<li>Không chia sẻ mật khẩu với bất kỳ ai</li>
									<li>Bật xác thực 2 lớp nếu có thể</li>
								</ul>
							</div>
							
							<p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
								Nếu bạn gặp vấn đề, liên hệ đội ngũ hỗ trợ của chúng tôi 24/7.
							</p>
						</td>
					</tr>
					
					<!-- Footer -->
					<tr>
						<td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
							<p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px;">
								© 2025 ChargeTech. All rights reserved.
							</p>
							<p style="margin: 0 0 15px 0; color: #9ca3af; font-size: 12px;">
								Email này được gửi tự động, vui lòng không trả lời.
							</p>
							<div>
								<a href="#" style="color: #dc2626; text-decoration: none; font-size: 12px; margin: 0 10px;">Trung tâm bảo mật</a>
								<span style="color: #d1d5db;">|</span>
								<a href="#" style="color: #dc2626; text-decoration: none; font-size: 12px; margin: 0 10px;">Hỗ trợ</a>
								<span style="color: #d1d5db;">|</span>
								<a href="#" style="color: #dc2626; text-decoration: none; font-size: 12px; margin: 0 10px;">Báo cáo sự cố</a>
							</div>
						</td>
					</tr>
					
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
	`;

	if (!transporter) {
		console.log(`(email) To: ${to}\nSubject: ${subject}\n${text}`);
		return;
	}

	await transporter.sendMail({
		from: `ChargeTech 🔐 <${process.env.SMTP_USER}>`,
		to,
		subject,
		text,
		html
	});
}

export default {
	sendVerificationEmail,
	sendWelcomeEmail,
	sendPasswordResetEmail,
};
