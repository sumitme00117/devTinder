const express = require("express");
const paymentRouter = express.Router();
const razorpayInstance = require("../utils/razorpay");
const { userAuth } = require("../middlewares/auth");
const Payment = require("../models/payment");
const { membershipAmount } = require("../utils/constants");
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");
const User = require("../models/user");

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { membershipType } = req.body;
    const { firstName, lastName, emailId } = req.user;
    const order = await razorpayInstance.orders.create({
      amount: membershipAmount[membershipType] * 100, // amount in the smallest currency unit (e.g., paise for INR)
      currency: "INR",
      receipt: "receipt#1",
      notes: {
        firstName,
        lastName,
        emailId,
        membershipType: membershipType,
      },
    });

    // we will save the orderId and order details in the database.

    const payment = new Payment({
      userId: req.user._id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      notes: order.notes,
    });

    const savedPayment = await payment.save();

    // return back my order details to frontend.

    res.json({ ...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).send("Error:" + err.message);
  }
});

// webhook will be calling this api so we don't need userAuth

paymentRouter.post("/payment/webhook", async (req, res) => {
  try {
    const webhookSignature = req.get("X-Razorpay-Signature");

    const isWebhookValid = validateWebhookSignature(
      JSON.stringify(req.body),
      webhookSignature,
      process.env.RAZORPAY_WEBHOOK_SECRET,
    );

    if (!isWebhookValid)
      return res.status(400).json({ msg: "Invalid webhook signature" });

    // The webhook will send the event in req.body.event and we will update the db(update the user as premium) according to that.

    const paymentDetails = req.body.payload.payment.entity;

    const payment = await Payment.findOne({ orderId: paymentDetails.order_id });

    if (!payment) return res.status(404).json({ msg: "Payment not found" });

    payment.status = paymentDetails.status;
    await payment.save();

    // Update the user as premium

    const user = await User.findOne({ _id: payment.userId });

    if (!user) return res.status(404).json({ msg: "User not found" });

    user.isPremium = true;
    user.membershipType = payment.notes.membershipType;
    await user.save();

    // Also we will send a response to razorpay that we have received the webhook and processed it successfully. Otherwise it will keep calling the api.

    // if(req.body.event === "payment.captured"){
    // }
    // if(req.body.event === "payment.failed"){
    // }
    res
      .status(200)
      .json({ msg: "Webhook received and processed successfully" });
  } catch (err) {
    res.status(500).send("Error:" + err.message);
  }
});

paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
  try {
    const user = req.user;
    if (user.isPremium) return res.json({ isPremium: true });
    return res.json({ isPremium: false });
  } catch (err) {
    res.status(500).send("Error:" + err.message);
  }
});
module.exports = paymentRouter;
