import express from 'express';
import cors from 'cors';
import registrationRoute from "./routes/auth/registrationRoute.js";
import loginRoute from './routes/auth/loginRoute.js';
import logoutRoute from './routes/auth/logoutRoute.js';
import getUserRoute from './routes/auth/getUserRoute.js';
import resetPasswordRoute from './routes/auth/resetPasswordRoute.js';
import refreshTokenRoute from './routes/auth/refreshTokenRoute.js';
import verifyRoute from './routes/auth/verifyRoute.js';
import forgotPasswordRoute from './routes/auth/forgotPasswordRoute.js';
import verifyOtpRoute from './routes/auth/verifyOtp.js';

import usersGetRoute from './routes/users/usersGetRoute.js';
import usersDeleteRoute from './routes/users/usersDeleteRoute.js'; 
import userPutRoute from './routes/users/usersPutRoute.js';
import userPostRoute from './routes/users/usersPostRoute.js';


import postsGetRoute from './routes/posts/postsGetRoute.js';
import postsPostRoute from './routes/posts/postsPostRoute.js';
import postsPutRoute from './routes/posts/postsPutRoute.js';
import postsDeleteRoute from './routes/posts/postsDeleteRoute.js';

import chatGetRoute from './routes/chats/chatGetRoute.js';
import chatPostRoute from './routes/chats/chatPostRoute.js';
import chatPutRoute from './routes/chats/chatPutRoute.js';
import chatDeleteRoute from './routes/chats/chatDeleteRoute.js';

import notificationGetRoute from './routes/notifications/notificationGetRoute.js';
import notificationPutRoute from './routes/notifications/notificationPutRoute.js';
import notificationDeleteRoute from './routes/notifications/notificationDeleteRoute.js';

import uploadImageRoute from './routes/upload/uploadImage.js';
import uploadProfilePicRoute from './routes/upload/uploadProfilePic.js';
import uploadChatImageRoute from './routes/upload/uploadChatImage.js';
import { error } from 'console';
import env from './config/env.js'

const app=express();
const corsOptions={
  origin:env.FRONTEND_URL,
  credential:true,
  optionsSuccessStatus:200,
  methods:['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions));
app.use(express.urlencoded({extended:true,limit:'10mb'}));
app.use(express.json({limit:'10mb'}));
app.get('/',(req,res)=>{
    res.status(200).json({
      message: "API Running"
    })
})
app.use('/api',registrationRoute);
app.use('/api',loginRoute);
app.use('/api',logoutRoute);
app.use('/api',getUserRoute);
app.use('/api',resetPasswordRoute);
app.use('/api',refreshTokenRoute);
app.use('/api',verifyRoute);
app.use('/api',forgotPasswordRoute);
app.use('/api',verifyOtpRoute);

app.use('/api',usersGetRoute);
app.use('/api',usersDeleteRoute);
app.use('/api',userPostRoute);
app.use('/api',userPutRoute);

app.use('/api',postsGetRoute);
app.use('/api',postsPostRoute);
app.use('/api',postsPutRoute);
app.use('/api',postsDeleteRoute);

app.use('/api',chatGetRoute);
app.use('/api',chatPostRoute);
app.use('/api',chatPutRoute);
app.use('/api',chatDeleteRoute);

app.use('/api',notificationGetRoute);
app.use('/api',notificationPutRoute);
app.use('/api',notificationDeleteRoute);

app.use('/api',uploadImageRoute);
app.use('/api',uploadProfilePicRoute);
app.use('/api',uploadChatImageRoute);

app.use((req,res)=>{
  res.status(404).json({
    status:false,
    error:'Route not found'
  })
})

app.use((err, req, res, next) => {

    console.error(err);
    const statusCode = err.statusCode || err.status || 500;
    const message =
        statusCode >= 500
            ? 'Internal server error'
            : err.message;
    res.status(statusCode).json({
        success: false,
        error: message
    });
});

export default app;

