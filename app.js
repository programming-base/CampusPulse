import express from 'express';

import registrationRoute from "./routes/auth/registrationRoute.js";
import loginRoute from './routes/auth/loginRoute.js';
import logoutRoute from './routes/auth/logoutRoute.js';
import getUser from './routes/auth/getUser.js';
import resetPassword from './routes/auth/resetPassword.js';
import refreshToken from './routes/auth/refreshToken.js';
import verifyRoute from './routes/auth/verifyRoute.js';
import forgotPassword from './routes/auth/forgotPassword.js';

import userGetRoute from './routes/users/usersGetRoute.js';
import userDeleteRoute from './routes/users/userDeleteRoute.js'; 
import userPutRoute from './routes/users/usersPutRoute.js';
import userPostRoute from './routes/users/usersPostRoute.js';


import postsGetsRoute from './routes/posts/postsGetsRoute.js';
import postsPostRoute from './routes/posts/postsPostRoute.js';
import postsPutRoute from './routes/posts/postsPutRoute.js';
import postsDeleteRoute from './routes/posts/postsDeleteRoute.js';

import chatGetRoute from './routes/chats/chatGetRoute.js';
import chatPostRoute from './routes/chats/chatPostRoute.js';
import chatPutRoute from './routes/chats/chatPutRoute.js';
import chatDeleteRoute from './routes/chats/chatDeleteRoute.js';

import notificationGetRoute from './routes/notifications/notificationGetRoute.js';
import notificationPutRoute from './routes/notifications/notificationsPutRoute.js';
import notificationDeleteRoute from './routes/notifications/notificationDeleteRoute.js';

import uploadImageRoute from './routes/upload/uploadImage.js';
import uploadProfilePicRoute from './routes/upload/uploadProfilePic.js';
import uploadChatImageRoute from './routes/upload/uploadChatImage.js';



const app=express();

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use('/api',registrationRoute);
app.use('/api',loginRoute);
app.use('/api',logoutRoute);
app.use('/api',getUser);
app.use('/api',resetPassword);
app.use('/api',refreshToken);
app.use('/api',verifyRoute);
app.use('/api',forgotPassword);

app.use('/api',userGetRoute);
app.use('/api',userDeleteRoute);
app.use('/api',userPostRoute);
app.use('/api',userPutRoute);

app.use('/api',postsGetsRoute);
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

export default app;

