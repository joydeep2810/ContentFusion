import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration Of Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Function to upload file on Cloudinary
const uploadOnCloudinary = async (localfilepath) => {
  try {
    if (!localfilepath) {
      return null;
    } else {
      // main body of upload function
      const response = await cloudinary.uploader.upload(localfilepath, {
        resource_type: "auto",
      });
      fs.unlinkSync(localfilepath);
      return response;
    }
  } catch (error) {
    fs.unlinkSync(localfilepath); // This is used to remove the file from the local server
    return null;
  }
};

export default uploadOnCloudinary;
