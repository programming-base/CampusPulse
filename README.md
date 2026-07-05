# CampusPulse

> A backend powering a campus-exclusive social networking platform built to help college students connect, collaborate, and build meaningful relationships within their campus community.

![Status](https://img.shields.io/badge/status-active_development-orange)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

# What is CampusPulse?

College life is much more than attending lectures and submitting assignments. It is about meeting new people, collaborating on ideas, discovering opportunities, and becoming part of a community.

However, in many colleges, students often interact only with classmates from their own department or friend circle. Finding students with similar interests, connecting with seniors, or discovering people from other branches can be surprisingly difficult.

Existing platforms such as LinkedIn are excellent for professional networking, but they are designed for the global workforce—not for everyday interactions within a college campus. They are often too broad and crowded to support a close-knit campus community.

**CampusPulse** aims to solve this problem by providing a dedicated social platform exclusively for college students.

It creates a digital campus where students can:

- Connect with peers across different departments
- Share updates and campus moments
- Follow students with similar interests
- Build meaningful campus relationships
- Discover people beyond their classroom
- Create a stronger sense of community within the college

CampusPulse brings the familiarity of a social media platform while keeping the experience focused on a single college ecosystem.

---

# About this Repository

This repository contains the **backend server** for CampusPulse.

It provides secure authentication, user management, post management, social interactions, media uploads, notifications, and REST APIs that power the frontend application.

The project follows a modular architecture to keep features organized and maintainable as the platform grows.

---

# Features

## Authentication

- JWT Access & Refresh Token Authentication
- Email OTP Verification
- Secure Password Hashing
- Password Reset
- Protected Routes
- Authentication Middleware

## User Management

- User Registration
- Login & Logout
- Profile Management
- User Search
- Profile Picture Upload
- Follow / Unfollow Users

## Social Features

- Create Posts
- Edit Posts
- Delete Posts
- Like Posts
- Comment on Posts
- Personalized Feed

## Notifications

- User Notifications
- Notification Preferences

## Media Uploads

- Profile Images
- Post Images
- Cloudinary Integration

## Security

- JWT Authorization
- Password Encryption
- Request Validation
- Environment Variable Configuration

---

# Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Multer
- Cloudinary
- Nodemailer
- Jest
- Supertest

---

# Project Structure

```
CampusPulse/
│
├── database/
│   ├── mongoDB.js
│   └── schema/
│
├── routes/
│   ├── auth/
│   ├── users/
│   ├── posts/
│   ├── chats/
│   ├── notifications/
│   └── upload/
│
├── middlewares/
│
├── tests/
│
├── app.js
├── server.js
└── package.json
```

---

# Getting Started

## Prerequisites

Before running the project, ensure you have:

- Node.js (v18+)
- MongoDB
- Cloudinary Account (for media uploads)

---

# Installation

Clone the repository

```bash
git clone https://github.com/your-username/CampusPulse.git
```

Navigate into the project

```bash
cd CampusPulse
```

Install dependencies

```bash
npm install
```

---

# Environment Variables

Create a `.env` file in the project root.

```env
PORT=3000

MONGODB_URI=your_mongodb_uri

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

# Running the Server

```bash
npm start
```

The backend will start at:

```
http://localhost:3000
```

---

# API Modules

The backend APIs are organized by feature.

### Authentication

- Register
- Login
- Verify OTP
- Refresh Token
- Logout
- Forgot Password
- Reset Password

### Users

- User Profile
- Update Profile
- Search Users
- Delete Account
- Follow / Unfollow

### Posts

- Create Post
- Update Post
- Delete Post
- Like
- Comment
- Feed

### Chats

- Create Chat
- Manage Conversations
- Send Messages

### Notifications

- Get Notifications
- Update Notification Settings

### Uploads

- Upload Profile Picture
- Upload Post Images

---

# Testing

The project includes a comprehensive automated testing suite using **Jest** and **Supertest**.

Tests cover:

- Authentication
- Users
- Posts
- Comments
- Likes
- Chats
- Uploads
- Middleware
- Security

Run tests with:

```bash
npm test
```

---

# Future Roadmap

- Real-time messaging
- Event management
- Clubs & Communities
- College Marketplace
- Story Sharing
- Campus Announcements
- API Documentation (Swagger)
- Docker Support
- CI/CD Pipeline

---

# Contributing

Contributions are always welcome.

1. Fork the repository.
2. Create a new feature branch.
3. Commit your changes.
4. Push your branch.
5. Open a Pull Request.

---

# License

This project is licensed under the MIT License.

---

# Author

Developed with ❤️ by **Gautam Vishwakarma**
