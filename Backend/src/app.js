import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// app.use() is used for middleware purpose {whatever function is called in app.use() it will be called for all the app routes}
app.use(express.json());
app.use(cors()); // used for connection Backend to Frontend and vice-versa
app.use(cookieParser()); // for Cookies
app.use(express.urlencoded()); // used for data taken from params and convert it into meaningful data
app.use(express.static("public"));

//import Routes
import userRoutes from "./routes/user.routes.js";

//Routes Declaration
app.use("/users", userRoutes); // Eg : https//localhost:4000/users/register

export default app;
