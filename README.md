# campusSphere

campusSphere is a Node.js backend for a campus social platform with auth, posts, chats, uploads, and websocket messaging.

> Status: This project is under active development. APIs, features, and configurations may change.

## Features
- Auth with JWT access/refresh tokens and OTP verification
- Users, posts, comments, likes, and follow relationships
- Real-time chat with websockets
- Media uploads (profile pics, posts, chat images)

## Tech Stack
- Node.js
- Express
- MongoDB
- WebSocket
- Cloudinary (uploads)

## Project Structure
- database/ - MongoDB connection and schemas
- middlewares/ - request validation and token verification
- routes/ - REST API routes grouped by feature
- webSockets/ - websocket setup and handlers

## Getting Started
### Prerequisites
- Node.js 18+ (or your preferred LTS)
- MongoDB instance
- Cloudinary account (optional, for media uploads)

### Install
```bash
npm install
```

### Configure Environment
Create a `.env` file in the project root with values similar to:
```bash
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Run
```bash
npm start
```

## API Overview
Routes are organized by feature under `routes/`:
- Auth: register, login, refresh, logout, verify, reset password
- Users: get/update/delete
- Posts: create/read/update/delete
- Chats: get/create
- Uploads: profile pics, posts, chat images

## Notes
- Websocket setup lives in `webSockets/`.
- Validation middleware is in `middlewares/`.

## License
MIT
