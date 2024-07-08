import mongoose from "mongoose";
import { User } from "./user.model.js";

const subscriptionSchema = new mongoose.Schema(
  {
    susbscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    channelOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);

//  We could have used the Subscriber field in an array but
//  if the subCount > 1 million the the operation in that array will be very expensive (DSA Concept)
