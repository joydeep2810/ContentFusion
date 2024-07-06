import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URL}/${DB_NAME}`
    );
    console.log(`DB Connected : ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("Connection Failed", error);
    throw error;
  }
};

export default connectDB;
