
const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// FRONTEND URL FOR PASSWORD RESET
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173"; // fallback for local dev

// Utility: generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send email verification OTP email
const sendVerificationEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "🎭 Verify Your UnderCover Email - Your Shadow Awaits",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification - UnderCover</title>
          <style>
            @media screen and (max-width: 600px) {
              .container { width: 100% !important; margin: 0 !important; border-radius: 0 !important; }
              .header { padding: 30px 20px !important; }
              .content { padding: 30px 20px !important; }
              .footer { padding: 20px !important; }
              .title { font-size: 28px !important; }
              .subtitle { font-size: 16px !important; }
              .otp-container { padding: 15px 25px !important; margin: 15px 0 !important; }
              .otp-code { font-size: 32px !important; letter-spacing: 4px !important; }
              .features-grid { display: block !important; }
              .feature-item { margin-bottom: 15px !important; }
              .emoji { font-size: 28px !important; }
              .section-padding { padding: 20px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%); color: #ffffff; min-height: 100vh;">
          <div class="container" style="max-width: 100%; width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.5);">
            
            <!-- Header with Gradient -->
            <div class="header" style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%); padding: 40px 30px; text-align: center; position: relative;">
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"grain\" width=\"100\" height=\"100\" patternUnits=\"userSpaceOnUse\"><circle cx=\"50\" cy=\"50\" r=\"1\" fill=\"white\" opacity=\"0.1\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23grain)\"/></svg>'); opacity: 0.3;"></div>
              <div style="position: relative; z-index: 1;">
                <div class="emoji" style="font-size: 40px; margin-bottom: 10px;">🎭</div>
                <h1 class="title" style="margin: 0; font-size: 32px; font-weight: bold; color: white; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">UnderCover</h1>
                <div class="subtitle" style="font-size: 16px; color: rgba(255,255,255,0.9); font-weight: 500; margin-top: 8px;">Email Verification</div>
              </div>
            </div>
            
            <!-- Main Content -->
            <div class="content" style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; padding: 20px; background: rgba(139, 92, 246, 0.15); border-radius: 50%; margin-bottom: 20px; border: 2px solid rgba(139, 92, 246, 0.3);">
                  <div style="font-size: 48px;">🔐</div>
                </div>
                <h2 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: 700; line-height: 1.3;">Welcome to the Shadows!</h2>
                <p style="margin: 12px 0 0 0; color: #cbd5e1; font-size: 15px; line-height: 1.6;">Your anonymous identity awaits verification</p>
              </div>
              
              <!-- Welcome Message -->
              <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%); border-left: 4px solid #8b5cf6; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                <p style="margin: 0; color: #e2e8f0; line-height: 1.7; font-size: 15px;">
                  🌟 <strong>Welcome to UnderCover!</strong><br><br>
                  You're about to join a community where anonymity meets authenticity. Your shadow identity keeps you safe while you connect, share, and discover others in the realm of mysteries.
                </p>
              </div>
              
              <!-- OTP Section -->
              <div style="text-align: center; margin: 40px 0;">
                <p style="margin: 0 0 15px 0; color: #94a3b8; font-size: 15px;">
                  Enter this verification code in the app:
                </p>
                <div class="otp-container" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); padding: 18px 35px; border-radius: 16px; box-shadow: 0 15px 35px rgba(139, 92, 246, 0.4); margin: 15px 0;">
                  <div class="otp-code" style="font-size: 36px; font-weight: bold; letter-spacing: 6px; color: white; font-family: 'Courier New', monospace; text-shadow: 0 2px 10px rgba(0,0,0,0.3);">
                    ${otp}
                  </div>
                </div>
                <p style="margin: 15px 0 0 0; color: #64748b; font-size: 13px;">
                  This code expires in <strong style="color: #8b5cf6;">10 minutes</strong>
                </p>
              </div>
              
              <!-- Features Preview -->
              <div class="section-padding" style="background: rgba(255,255,255,0.03); border-radius: 16px; padding: 25px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #8b5cf6; font-size: 18px; font-weight: 600; text-align: center;">🚀 What awaits you:</h3>
                <div class="features-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                  <div class="feature-item" style="text-align: center; padding: 12px;">
                    <div style="font-size: 28px; margin-bottom: 8px;">💬</div>
                    <div style="color: #e2e8f0; font-size: 13px; font-weight: 500;">Anonymous Whispers</div>
                  </div>
                  <div class="feature-item" style="text-align: center; padding: 12px;">
                    <div style="font-size: 28px; margin-bottom: 8px;">🕵️</div>
                    <div style="color: #e2e8f0; font-size: 13px; font-weight: 500;">Identity Recognition</div>
                  </div>
                  <div class="feature-item" style="text-align: center; padding: 12px;">
                    <div style="font-size: 28px; margin-bottom: 8px;">🎭</div>
                    <div style="color: #e2e8f0; font-size: 13px; font-weight: 500;">Ghost Circles</div>
                  </div>
                  <div class="feature-item" style="text-align: center; padding: 12px;">
                    <div style="font-size: 28px; margin-bottom: 8px;">🌙</div>
                    <div style="color: #e2e8f0; font-size: 13px; font-weight: 500;">Shadow Posts</div>
                  </div>
                </div>
              </div>
              
              <!-- Security Notice -->
              <div style="border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; background: rgba(139, 92, 246, 0.05); margin-top: 30px;">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <span style="font-size: 20px; margin-right: 10px;">🛡️</span>
                  <strong style="color: #8b5cf6; font-size: 16px;">Security Notice</strong>
                </div>
                <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; line-height: 1.7; font-size: 14px;">
                  <li>This code expires in <strong>10 minutes</strong></li>
                  <li>Never share this code with anyone</li>
                  <li>If you didn't create an account, ignore this email</li>
                  <li>Your identity remains anonymous until you choose to reveal it</li>
                </ul>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer" style="background: rgba(0,0,0,0.3); padding: 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
              <div style="margin-bottom: 12px;">
                <span style="font-size: 20px;">🌙</span>
                <span style="font-size: 20px; margin: 0 6px;">✨</span>
                <span style="font-size: 20px;">🎭</span>
              </div>
              <p style="margin: 0 0 12px 0; color: #94a3b8; font-size: 15px; font-weight: 500;">
                Welcome to the realm of mysteries
              </p>
              <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5;">
                © 2024 UnderCover. All rights reserved.<br>
                This is an automated message, please do not reply.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();

    // Point to frontend reset password page instead of backend
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: '🔐 Reset Your UnderCover Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - UnderCover</title>
          <style>
            @media screen and (max-width: 600px) {
              .container { width: 100% !important; margin: 0 !important; border-radius: 0 !important; }
              .header { padding: 30px 20px !important; }
              .content { padding: 30px 20px !important; }
              .footer { padding: 20px !important; }
              .title { font-size: 28px !important; }
              .subtitle { font-size: 16px !important; }
              .reset-button { padding: 14px 28px !important; font-size: 15px !important; }
              .link-box { padding: 10px !important; font-size: 12px !important; }
              .emoji { font-size: 28px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #0f0f23; color: #ffffff; min-height: 100vh;">
          <div class="container" style="max-width: 100%; width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
            
            <!-- Header -->
            <div class="header" style="background: linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%); padding: 35px 25px; text-align: center;">
              <div class="emoji" style="font-size: 28px; margin-bottom: 8px;">🎭</div>
              <div class="title" style="font-size: 28px; font-weight: bold; color: white; margin-bottom: 6px;">UnderCover</div>
              <div class="subtitle" style="font-size: 15px; color: rgba(255,255,255,0.9); font-weight: 500;">Password Reset Request</div>
            </div>
            
            <!-- Content -->
            <div class="content" style="padding: 35px 25px;">
              <div style="text-align: center; margin-bottom: 25px;">
                <div style="display: inline-block; padding: 18px; background: rgba(139, 92, 246, 0.1); border-radius: 50%; margin-bottom: 18px;">
                  <div style="font-size: 40px;">🔑</div>
                </div>
                <h2 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 600;">Reset Your Password</h2>
              </div>
              
              <div style="background: rgba(255,255,255,0.05); border-left: 4px solid #8b5cf6; padding: 18px; border-radius: 8px; margin-bottom: 25px;">
                <p style="margin: 0; color: #e5e7eb; line-height: 1.6; font-size: 15px;">
                  Hello there, shadow dweller! 👋<br><br>
                  Someone (hopefully you) requested to reset the password for your UnderCover account. 
                  Don't worry - your secret identity is safe with us!
                </p>
              </div>
              
              <!-- Reset Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${resetUrl}" class="reset-button" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3); transition: all 0.3s ease;">
                  🚀 Reset My Password
                </a>
              </div>
              
              <!-- Alternative Link -->
              <div style="background: rgba(255,255,255,0.03); padding: 18px; border-radius: 8px; margin-bottom: 25px;">
                <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 13px; text-align: center;">
                  Button not working? Copy and paste this link:
                </p>
                <div class="link-box" style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; word-break: break-all; text-align: center;">
                  <a href="${resetUrl}" style="color: #8b5cf6; text-decoration: none; font-size: 13px;">${resetUrl}</a>
                </div>
              </div>
              
              <!-- Security Notice -->
              <div style="border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 18px; background: rgba(139, 92, 246, 0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 18px; margin-right: 8px;">⚠️</span>
                  <strong style="color: #8b5cf6; font-size: 15px;">Security Notice</strong>
                </div>
                <ul style="margin: 0; padding-left: 18px; color: #d1d5db; line-height: 1.6; font-size: 14px;">
                  <li>This link will expire in <strong>10 minutes</strong></li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer" style="background: rgba(0,0,0,0.2); padding: 25px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 13px;">
                Stay anonymous, stay secure 🛡️
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 11px;">
                © 2024 UnderCover. All rights reserved.<br>
                This is an automated message, please do not reply.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
  generateOTP,
};
