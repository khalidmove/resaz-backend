const nodemailer = require("nodemailer");
// const { default: currencySign } = require("./currencySign");

function currencySign(amount) {
  if (amount == null || isNaN(amount)) {
      return '₹0';
  }
  return `₹${amount}`;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});
const sendMail = async (to, subject, html) => {
  return new Promise((resolve, reject) => {
    const mailConfigurations = {
      from: `MarketPlace<${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    };
    transporter.sendMail(mailConfigurations, function (error, info) {
      if (error) return reject(error);
      return resolve(info);
    });
  });
};

module.exports = {
  welcomeMail: async (details) => {
    const html = `<div> \r\n<p>Hello ${details.username},<\/p>\r\n\r\n<p> Welcome to Islababa.com. <\/p>\r\n\r\n<p>You recently created a Islababa.com Account. <\/p>\r\n\r\n<p>Your Islababa.com Registered Mail is: <b>${details.email} <\/b><\/p>\r\n\r\n<p><\/br>Thanks,<\/p>\r\n\r\n<p><b>The Islababa.com Account Team<\/b><\/p>\r\n<\/div>`;
    await sendMail(details.email, "Welcome to SwiftGuard", html);
  },
  sendOTPmail: async ({ email, code }) => {
    console.log(email, code);
    try {
      const html = `<div> \r\n<p>Hello,<\/p>\r\n\r\n<p> Welcome to <strong>Marketplace</strong>. <\/p>\r\n\r\n<p>Your One-Time password  code is: <strong>${code}</strong>. This passcode will expire in 5 minutes<\/p>\r\n<\/br>Thanks,<\/p>\r\n\r\n<p><b>The Marketplace Account Team<\/b><\/p><\/div>`;
      //   const html = `<div> \r\n<p>Password Reset Instructions<\/p>\r\n\r\n<p>Your <strong>Walk Wise Meal</strong> One-Time password  code is: ${code}. Enter online when prompted. This passcode will expire in 5 minutes<\/p><\/br>Thank you for updating your password.<\/p>\r\n\r\n<p><b>SwiftGuard<\/b><\/p>\r\n<\/div>`;
      return await sendMail(email, "Password Reset Instructions", html);
    } catch (err) {
      console.log(err);
      throw new Error("Could not send OTP mail");
    }
  },
  passwordChange: async ({ email }) => {
    try {
      // const html = `<div> Your password has been reset, if you didn't update your password, please call us on (.) between 9am - 5pm Monday to Friday. \r\n\r\nSwiftGuard  </div>`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #333;">Password Reset Notification</h2>
          <p>Hello ${email},</p>
          <p>This is to inform you that your password has been reset.</p>
  
          <p>If you didn’t make this change or believe it was unauthorized, please contact support immediately.</p>
  
          <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
          <p style="font-size: 12px; color: #aaa;">&copy; ${new Date().getFullYear()} Marketplace. All rights reserved.</p>
        </div>
      `;
      return await sendMail(email, "PASSWORD RESET NOTIFICATION EMAIL", html);
    } catch (err) {
      throw new Error("Could not send OTP mail");
    }
  },
  updateMail: async ({ email, confirmUrl }) => {
    try {
      const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #333;">Admin Profile Update Request</h2>
      <p>Hello Admin,</p>
      <p>We received a request to update your profile details. To apply the changes, please confirm by clicking the button below:</p>
      
      <a href="${confirmUrl}" 
         style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Confirm Update
      </a>

      <p>If you didn't request this change, you can ignore this email. The changes will not be applied unless you confirm.</p>

      <p style="color: #888; font-size: 12px;">This link will expire in 15 minutes.</p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
      <p style="font-size: 12px; color: #aaa;">&copy; ${new Date().getFullYear()} Marketplace. All rights reserved.</p>
    </div>`;
      return await sendMail(email, "Confirm Your Admin Profile Update", html);
    } catch (err) {
      throw new Error("Could not send OTP mail");
    }
  },

  updateUser: async ({ email, name }) => {
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2 style="color: #333;">Profile Update Notification</h2>
          <p>Hello ${name},</p>
          <p>This is to inform you that your profile details have been updated successfully.</p>
  
          <p>If you didn’t make this change or believe it was unauthorized, please contact support immediately.</p>
  
          <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
          <p style="font-size: 12px; color: #aaa;">&copy; ${new Date().getFullYear()} Marketplace. All rights reserved.</p>
        </div>
      `;
  
      return await sendMail(email, "Your Profile Was Updated", html);
    } catch (err) {
      throw new Error("Could not send update notification email");
    }
  }, 
  returnMail: async ({ email, returnAmount }) => {
    try {
      const html = `A refund has been processed for one of your orders. Amount: ${currencySign(returnAmount)}`;
      return await sendMail(email, "Order Returned", html);
    } catch (err) {
      console.error("Mail error:", err);
      throw new Error("Could not send mail");
    }
  }
  
};
