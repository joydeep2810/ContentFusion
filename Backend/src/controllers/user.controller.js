import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

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
    console.log("400 : Field not Found");
    throw new error();
  }

  //Step 3: Check whether the User already present or not
  const existedUser = User.findOne({ $or: [{ email }, { username }] }); //findone finds in the DB   "$or" this checks eveything the return required fields
  if (existedUser) {
    console.log("409 : User Already Exist");
    throw new error();
  }

  //Step 4: Check for avatar
  const avatarlocalpath = req.files?.avatar[0]?.path; // This is how u get the local path of th image from multer
  console.log(avatarlocalpath);
  const coverImagelocalpath = req.files?.coverImage[0]?.path;
  //check if present
  if (!avatarlocalpath) {
    console.log("400 : Avatar not Found");
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

export { registerUser };
