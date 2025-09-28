"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.template = void 0;
const template = (otp, fullName, subject) => {
    return `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <title>Your OTP Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
    }

    .container {
      max-width: 600px;
      margin: 30px auto;
      background-color: #ffffff;
      border-radius: 10px;
      /* box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); */
      overflow: hidden;
      border: 1px solid #00000043;
    }

    .header {
      background-color: #00bfa6;
      color: white;
      text-align: center;
      padding: 20px 0;
      font-size: 24px;
    }

    .content {
      padding: 30px 20px;
      text-align: left;
    }

    .name {
      color: #007BFF;
      font-weight: 600;
      font-size: 18px;
    }

    .description {
      color: #333;
      font-weight: 400;
      font-size:16px
    }
    .app-name {
      font-weight: bold;
      color: #00bfa6;
    }
    .otpContainer {
      text-align: center;
      margin: 20px 0;
    }
    .otp {
      display: inline-block;
      background-color: #f0f0f0;
      padding: 12px 24px;
      font-size: 28px;
      letter-spacing: 12px;
      font-weight: bold;
      border-radius: 6px;
      color: #333;
      margin-bottom: 30px;
    }

    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #00bfa6;
      color: white;
      text-decoration: none;
      font-weight: bold;
      border-radius: 5px;
      font-size: 16px;
    }

    .email-footer {
      text-align: center;
      padding: 15px;
      background-color: #f4f4f4;
      font-size: 14px;
      color: #777777;
    }

    .email-footer a {
      color: #007BFF;
      text-decoration: none;
    }

    @media only screen and (max-width: 600px) {
      .otp {
        font-size: 22px;
        letter-spacing: 8px;
        padding: 10px 20px;
      }

      .button {
        padding: 12px 24px;
        font-size: 15px;
      }
    }
  </style>
</head>

<body>

  <div class="container">
    <div class="header">${subject}</div>
    <div class="content">
      <p class="name">Hello ${fullName} 👋</p>
      <p class="description">Thank you for signing up with <span class="app-name">Social Media App</span>. To complete your registration and start using
        your account, please get code to activate your account:</p>
    </div>
    <div class="otpContainer" style="text-align: center;">
      <div class="otp">${otp}</div>
      <div>
        <a href="" class="button">Confirm Email</a>
      </div>
    </div>
    <div class="email-footer">
      <p>&copy; 2025 Social Media App. All rights reserved.</p>
      <p><a href="[SupportLink]">Contact Support</a> | <a href="[UnsubscribeLink]">Unsubscribe</a></p>
      <p>If you didn’t request this code, you can safely ignore this message.</p>
    </div>
  </div>

</body>

</html>
`;
};
exports.template = template;
