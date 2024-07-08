import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
  // Get the accessToken from the user
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    //Check the token (recieved or not)
    if (!token) throw console.error("401: Unauthorised Access");

    //Validate the recieved Token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decodedToken) throw console.error("400 : Wrong Token");

    //Getting User details
    const user = User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) throw console.error("400 : User not Found");

    //Created new Object to store the user info for token
    req.user = user;
    next();
  } catch (error) {
    console.log("Error", error);
  }
});
