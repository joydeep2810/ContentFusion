import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import generateAccessandRefreshToken from "../utils/tokenGenerator.js";
import mongoose from "mongoose";

/*Steps to create register User method
Step 1: take details from user (username,email,password,fullname)
Step 2: check validation - user gave right details or not
Step 3: Check if user already exist or not (by using email,username)
Step 4: check for avatar (then upload it to cloudinary)
Step 5: Create new entry in DB
Step 6: Return the message and response to user (Created )
*/
const registerUser = asyncHandler(async (req, res) => {
  //Step 1: Getting all the information
  const { username, email, password, fullname } = req.body;

  //Step 2: Check all fields are present
  //.some() accepts a callback fn that return checking on every element Here used for checking if any field in array is empty or not
  if (
    [fullname, email, password, username].some((field) => {
      return field?.trim() === "";
    })
  ) {
    throw console.error("400 : Field not Found");
  }

  //Step 3: Check whether the User already present or not
  const existedUser = await User.findOne({ $or: [{ email }, { username }] }); //findone finds in the DB   "$or" this checks eveything the return required fields
  if (existedUser) {
    throw console.error("409 : User Already Exist");
  }

  //Step 4: Check for avatar and CoverImage
  const avatarlocalpath = req.files?.avatar[0]?.path; // This is how u get the local path of th image from multer
  //For Cover Image
  let coverImagelocalpath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImagelocalpath = req.files.coverImage[0].path;
  }
  //check if present
  if (!avatarlocalpath) {
    throw console.error("400 : Avatar Not Found");
  }
  // Upload on Cloudinary
  const avatar = await uploadOnCloudinary(avatarlocalpath);
  if (!avatar) throw console.error("400 : CLoudinary upload Failed");
  const coverImage = await uploadOnCloudinary(coverImagelocalpath);

  //Step 5: Create new entry in DB
  const user = await User.create({
    username: username.toLowerCase(),
    email: email,
    fullname: fullname,
    password: password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  //Checking User is Successfully created or not and removing the password and refreshToken field from response that we need to send to user back
  //This .select() method is used to remove the field not required in response (only write the field which are not required)
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) throw console.error("500 : User not Created");

  //Step 6: Return the response to User
  return res.status(200).json({
    msg: "User Created Successfully",
    createdUser,
  });
});

/*Steps For login Page
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

/*Steps for Logout */
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json({
      msg: "User Loggged Out",
    });
});

/*Steps for refreshAccessToken */
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    // Get the Token form cookie
    const incomingRefreshToken = req.cookie?.refreshToken;
    if (!incomingRefreshToken) throw console.error("400 : No Token ");

    // Decoded the token for User properties
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    if (!decodedToken) throw console.error("400 : Unautorized Token");

    //validate the token
    const user = await User.findById(decodedToken._id);
    if (incomingRefreshToken != user.refreshToken)
      throw console.error("400 : Wrong Token Unautorized");

    //Generate a new AccessToken
    const { accessToken, refreshToken } = await generateAccessandRefreshToken(
      user._id
    );
    const cookieOptions = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({
        msg: "Regeneration Succussfull",
      });
  } catch (error) {
    console.log(error);
  }
});

/*Steps For Changing Password*/
const changeCurrentPassword = asyncHandler(async (req, res) => {
  // Get old and new pass from user
  const { oldPassword, newPassword } = req.body;

  //Validate the old Password
  const user = await User.findById(req.user?._id);
  const isPasswordRight = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordRight) throw console.error("400 : Wrong Password");

  //Change Password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json({ msg: "Password Changed Succesfully" });
});

/*Steps for Updating Account Details */
const updateAccountDetails = asyncHandler(async (req, res) => {
  //Get the data from user
  const { fullname, email } = req.body;
  const user = User.findByIdAndUpdate(
    req.user._id,
    { fullname: fullname, email: email },
    { new: true }
  ).select("-password -refreshToken");

  res.status(200).json({ msg: "Updated Succesfully", user });
});

/*Steps for Updating Avatar Image */
const updateAvatar = asyncHandler(async (req, res) => {
  //Get the avatar from the user
  const avatarlocalpath = req.file?.path;
  if (!avatarlocalpath) throw console.error("400 : Avatar not Found");

  //upload on cloudinary
  const avatar = await uploadOnCloudinary(avatarlocalpath);
  if (!avatar) throw console.error("500 : Upload on Cloudinary Failed");

  //Update the avatar in DB
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  );

  res.status(200).json({
    msg: "Avatar updated Successfully",
  });
});

/*Steps for Updating CoverImage */
const updateCoverImage = asyncHandler(async (req, res) => {
  //Get the avatar from the user
  const coverImagelocalpath = req.file?.path;
  if (!coverImagelocalpath) throw console.error("400 : CoverImage not Found");

  //upload on cloudinary
  const coverImage = await uploadOnCloudinary(coverImagelocalpath);
  if (!coverImage) throw console.error("500 : Upload on Cloudinary Failed");

  //Update the avatar in DB
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  );

  res.status(200).json({
    msg: "CoverImage updated Successfully",
  });
});

/*Channel Profile (Mongoose aggregation Pipeline)*/
const getChannelProfile = asyncHandler(async (req, res) => {
  //Get the Data from user
  const { username } = req.params;
  if (!username?.trim()) throw console.error("400 : User not Found");

  //Channel Info by aggregation pipeline
  const channel = await User.aggregate([
    {
      //Matching the username for user
      $match: {
        username: username,
      },
    },
    {
      // Subscriber of my channel
      $lookup: {
        from: "subcriptions",
        localField: "_id",
        foreignField: "channelOwner",
        as: "subscribers",
      },
    },
    {
      // Channels I have Subscribed
      $lookup: {
        from: "subcriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      //Add These two fields in user which shows the respective total count
      $addFields: {
        // Adds fields in User Model
        subscribersCount: {
          // Gives the total Count
          $size: "$subscribers",
        },
        channelSubscribedCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: { $in: [req.user?._id, "$subscribers.subscriber"] },
          then: true,
          else: false,
        },
      },
    },
    {
      //This projects all the fields so that frontend guys can use thes details
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelSubscribedCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  if (!channel?.length) throw console.error("400 : Channel NOt Found");

  console.log(channel);
  const result = channel[0];

  res.status(200).json({
    msg: "Channel Fetched",
    result,
  });
});

/*Get Watch History of user*/
const getWatchHistory = asyncHandler(async (req, res) => {
  //Match the User Id
  const user = User.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  const result = user[0].watchHistory;
  return res.status(200).json({
    msg: "WatchHistory Fetched",
    result,
  });
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getChannelProfile,
  getWatchHistory,
};
