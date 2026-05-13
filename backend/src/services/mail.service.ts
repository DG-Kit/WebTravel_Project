import nodemailer from 'nodemailer';

class MailService {
  private transporter: any;

  private isInitialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (this.isInitialized) return;

    let auth = {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    };

    let host = process.env.MAIL_HOST;
    let port = Number(process.env.MAIL_PORT) || 587;

    if (!auth.user || !auth.pass) {
      console.log('--- Generating Test Email Account (Ethereal) ---');
      const testAccount = await nodemailer.createTestAccount();
      auth = { user: testAccount.user, pass: testAccount.pass };
      host = 'smtp.ethereal.email';
      port = 587;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.MAIL_SECURE === 'true',
      auth,
    });
    
    this.isInitialized = true;
    console.log(`Mail Service initialized with user: ${auth.user}`);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    if (!this.isInitialized) await this.init();
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"WebTravel Support" <${process.env.MAIL_FROM || 'noreply@webtravel.com'}>`,
      to,
      subject: 'Password Reset Request - WebTravel',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 12px;">
          <h2 style="color: #3b82f6;">Reset Your Password</h2>
          <p>Chào bạn,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản WebTravel của bạn. Vui lòng nhấn vào nút bên dưới để tiến hành:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Đặt lại mật khẩu</a>
          </div>
          <p>Đường dẫn này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">WebTravel Team - Khám phá thế giới theo cách của bạn.</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    if (!this.isInitialized) await this.init();
    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"WebTravel Support" <${process.env.MAIL_FROM || 'noreply@webtravel.com'}>`,
      to,
      subject: 'Verify Your Email - WebTravel',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #3b82f6;">Xác thực tài khoản WebTravel</h2>
          <p>Chào bạn,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản tại WebTravel. Vui lòng nhấn vào nút bên dưới để xác thực email và kích hoạt tài khoản của bạn:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Xác thực ngay</a>
          </div>
          <p>Nếu nút trên không hoạt động, bạn có thể copy link sau vào trình duyệt:</p>
          <p>${verifyLink}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">WebTravel Team - Khám phá thế giới theo cách của bạn.</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Verification Preview URL: %s', nodemailer.getTestMessageUrl(info));
      return info;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  async sendBookingConfirmationEmail(to: string, bookingInfo: any) {
    if (!this.isInitialized) await this.init();
    
    const mailOptions = {
      from: `"WebTravel Support" <${process.env.MAIL_FROM || 'noreply@webtravel.com'}>`,
      to,
      subject: `Booking Confirmed - ${bookingInfo.hotel_name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #10b981;">Đặt phòng của bạn đã được xác nhận!</h2>
          <p>Chào bạn,</p>
          <p>Khách sạn <strong>${bookingInfo.hotel_name}</strong> đã xác nhận đơn đặt phòng của bạn.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Mã đơn hàng:</strong> #${bookingInfo.booking_id}</p>
            <p style="margin: 5px 0;"><strong>Khách sạn:</strong> ${bookingInfo.hotel_name}</p>
            <p style="margin: 5px 0;"><strong>Ngày nhận phòng:</strong> ${new Date(bookingInfo.check_in).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Ngày trả phòng:</strong> ${new Date(bookingInfo.check_out).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Tổng tiền:</strong> $${bookingInfo.total_price.toLocaleString()}</p>
          </div>
          
          <p>Chúc bạn có một chuyến đi tuyệt vời!</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">WebTravel Team - Khám phá thế giới theo cách của bạn.</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Confirmation Email Sent. Preview URL: %s', nodemailer.getTestMessageUrl(info));
      return info;
    } catch (error) {
      console.error('Error sending booking confirmation email:', error);
      throw error;
    }
  }
}

export default new MailService();
