import 'dotenv/config';
import app from './app.js';
import DbConnect from './config/db.js';
import env from './config/env.js';

DbConnect.then(() => {
    console.log('Database connected');
    app.listen(env.PORT, () => {
        console.log(`server is running on ${env.PORT}`);
    });
}).catch((error) => {
    console.error('error connecting to db', error);
});