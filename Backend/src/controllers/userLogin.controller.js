import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import generateAccessandRefreshToken from "../utils/tokenGenerator.js";
/*
Steps For login Page
Step 1: collect data from user (email,username,password)
Step 2: Validate data (email,username) in DB if match
Step 3: Check Password if matched
Step 4: Generate Access and Refresh Token
Step 5: Send Cookie
*/

const loginUser = asyncHandler(async (req, res) => {
  //Step 1: Collect Data
  const { email, username, password } = req.body;
  console.log({ email, username, password });

  //Step 2 and 3: Validate (id and password)
  const existedUser = await User.findOne({ $or: [{ email }, { username }] });
  //Checking the User
  if (existedUser) {
    //If exists Checking the Password
    const validPassword = await existedUser.isPasswordCorrect(password);
    if (!validPassword) throw console.error("400 : Password is Wrong");
  } else {
    throw console.error("404 : User not Found");
  }

  //Step 4: Generate Access and Refresh Token
  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    existedUser._id
  );

  //Step 5:
  const loggedinUser = await User.findById(existedUser._id).select(
    "-password -refreshToken"
  );
  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions) // Sending Cookies (here accesstoken are sent as cookie)
    .cookie("refreshToken", refreshToken, cookieOptions) // Sending Cookies (here refreshtoken are sent as cookie)
    .json({
      msg: "User Logged In Successfully",
      loggedinUser,
      accessToken,
      refreshToken,
    });
});

export { loginUser };
