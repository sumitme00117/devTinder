const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");

const requestRouter = express.Router();

requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const { status, toUserId } = req.params;
      const fromUserId = req.user._id;

      const allowedStatus = ["ignored", "interested"]

        if (!allowedStatus.includes(status)) {
          return res.status(400).json({ message: "Invalid status type" + status });
        }

        
        const toUser = await User.findById(toUserId);

        if (!toUser) {
          return res.status(404).json({ message: "User not found" });
        }

        const existingRequest = await ConnectionRequest.findOne({
          $or: [
            { fromUserId, toUserId },
            { fromUserId: toUserId, toUserId: fromUserId },
          ],
        });

        if (existingRequest) {
          return res.status(400).json({ message: "Connection request already exists" });
        }

      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      const data = await connectionRequest.save();
      res.json({ message: "Connection request sent successfully", data });
    } catch (err) {
      res.status(400).send("Error sending connection request: " + err.message);
    }
  },
);

requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const { requestId, status } = req.params;
      const userId = req.user._id;

      const allowedStatus = ["accepted", "rejected"]

        if (!allowedStatus.includes(status)) {
          return res.status(400).json({ message: "Invalid status type" + status });
        }
        
      const connectionRequest = await ConnectionRequest.findOne({ _id: requestId, toUserId: userId, status: "interested" });
      if (!connectionRequest) {
        return res.status(404).json({ message: "Connection request not found" });
      }

      connectionRequest.status = status;
      const data = await connectionRequest.save();

      res.json({ message: `Connection request ${status} successfully`, data });
    } catch (err) {
      res.status(400).send("Error responding to connection request: " + err.message);
    }
  },
);
module.exports = requestRouter;
