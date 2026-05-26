import mongoose from "mongoose";

const dbConnect=mongoose.connect('mongodb://localhost:27017/mydb');

export default dbConnect;
