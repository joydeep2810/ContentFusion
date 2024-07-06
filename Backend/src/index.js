import dotenv from "dotenv";
import connectDB from "./db/connectDb.js";
import app from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(`${process.env.PORT}`, () => {
      console.log("Server Running");
    });
  })
  .catch((err) => {
    console.log("Mongo DB connection Failed", err);
  });
