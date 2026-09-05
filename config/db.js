import mongoose from "mongoose";
import env from "./env.js";

const dbConnect = mongoose.connect(env.MONGODB_URL);

export default dbConnect;
