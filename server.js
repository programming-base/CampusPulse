import 'dotenv/config';
import app from './app.js';
import DbConnect from './database/mongoDB.js';
DbConnect.then(()=>{
    console.log('Database connected');
    app.listen(3000,()=>{
    console.log(`server is running on 3000`)
})
}).catch((error)=>{
    console.error('error connecting to db',error)
})