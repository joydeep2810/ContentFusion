import { User } from "../models/user.model.js";

const generateAccessandRefreshToken = async (userid) => {
  try {
    const user = await User.findById(userid); // user getting all User properties
    //console.log(user);

    const accessToken = user.generateAccessToken(); //Generating Token
    console.log(accessToken);
    const refreshToken = user.generateRefreshToken();
    console.log(refreshToken);

    user.refreshToken = refreshToken; // Entering refreshToken field in DB
    await user.save({ validateBeforeSave: false }); // Save

    return { accessToken, refreshToken };
  } catch (error) {
    throw console.error("500 : Error occured during Token Generation");
  }
};

export default generateAccessandRefreshToken;
