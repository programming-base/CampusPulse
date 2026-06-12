import mongoose from "mongoose";

const dbConnect=mongoose.connect(process.env.MONGODB_URL||'mongodb://localhost:27017/mydb');

export default dbConnect;
