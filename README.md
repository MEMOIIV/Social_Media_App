# Social_Media_App
---

# 🛠️ Backend Project – Node.js + Express + MongoDB

## 🚀 Features

* **Authentication & Authorization**

  * Sign up / Login
  * Login with Google
  * Logout (with revoke token)
  * Access Token (expires in 1 hour)
  * Refresh Token (expires in 1 year)
  * Password hashing (bcryptjs)
  * Phone encryption (crypto-js)

* **Email Confirmation**

  * OTP verification using **nanoid**
  * Sent via **nodemailer**

* **User Management**

  * View / Update / Delete account
  * Upload profile picture (stored in **Cloudinary**)

* **Messages**

  * Send / Delete messages
  * Attach images to messages

* **Validation**

  * All input fields validated using **Joi**

* **Security & Performance**

  * Rate limiting (express-rate-limit)
  * Logging (morgan)

## 🔑 Environment Variables

Create a `.env` file in the root directory and add the following variables:

```env
PORT=3000
MOOD="DEV"
DB_URI=Url_MongoDB
SALT_ROUND=
EMAIL=YOUR_Email
APP_PASS=YOUR_PASSWORD
ACCESS_USER_SIGNATURE=EXAMPLE"121AFF1BJ5V"
REFRESH_USER_SIGNATURE=EXAMPLE"442RFFAJ5V"
ACCESS_ADMIN_SIGNATURE=EXAMPLE"5819HAKCB1"
REFRESH_ADMIN_SIGNATURE=EXAMPLE"7AUDHV7QL"
ACCESS_EXPIRES_IN=2600 
REFRESH_EXPIRES_IN=3500 
```
### 🔑 Auth API
| Method    | Endpoint                      | Description              |
| --------- | ----------------------------- | ------------------------ |
| **POST**  | `/auth/signup`                | Create new user account  |
| **POST**  | `/auth/login`                 | Login with email & pass  |
| **PATCH** | `/auth/confirm-email`         | Confirm user email       |
| **PATCH** | `/auth/reset-forget-password` | Reset forgotten password |

### 👤 User API
| Method     | Endpoint                 | Description             |
| ---------- | ------------------------ | ----------------------- |
| **GET**    | `/users/:id`             | Get user profile by ID  |
| **PATCH**  | `/users/update-profile`  | Update user profile     |
| **DELETE** | `/users/:id/hard-delete` | Permanently delete user |
