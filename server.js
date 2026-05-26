import 'dotenv/config';
import app from './app.js';
import DbConnect from './database/mongoDB.js';
import http from 'http';
import setupWebSocket from './webSockets/setupWebsocket.js';
const server=http.createServer(app);

setupWebSocket(server);

DbConnect.then(()=>{
    console.log('Database connected');
    server.listen(3000,()=>{
    console.log(`server is running on 3000`)
})
}).catch((error)=>{
    console.error('error connecting to db',error)
})