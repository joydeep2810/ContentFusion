import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
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
} from "../controllers/userRegister.controller.js";

const router = Router();

//Register (upload.fields([]) when uploading multiple files)
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

//Login
router.route("/login").post(loginUser);

//Secured Routes
//Logout
router.route("/logout").post(verifyJwt, logoutUser);

//Regenerate the Token
router.route("/refresh_access_token").post(refreshAccessToken);

//Change Password
router.route("/change_password").post(verifyJwt, changeCurrentPassword);

//Update Account Details
router.route("/update_acc_details").patch(verifyJwt, updateAccountDetails);

//Update Avatar (upload.single() when single file)
router
  .route("/change_avatar")
  .patch(verifyJwt, upload.single("avatar"), updateAvatar);

// Update CoverImage
router
  .route("/change_cover_image")
  .patch(verifyJwt, upload.fields("coverImage"), updateCoverImage);

//Channel Profile
router.route("/channel_profile").get(getChannelProfile);

//Watch History
router.route("/watch_history").get(verifyJwt, getWatchHistory);

export default router;
