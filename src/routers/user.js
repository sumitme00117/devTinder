const express = require("express");
const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");

const userRouter = express.Router();

userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const connectionRequest = await ConnectionRequest.find({toUserId: user._id, status: "interested"}).populate("fromUserId", "firstName lastName photoUrl about skills");

    res.json({ message: "Connection requests retrieved successfully", data: connectionRequest });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const connectionRequest = await ConnectionRequest.find({$or: [{fromUserId: user._id, status: "accepted"}, {toUserId: user._id, status: "accepted"}]}).populate("fromUserId", "firstName lastName photoUrl about skills").populate("toUserId", "firstName lastName photoUrl about skills");

    const data = connectionRequest.map(row => {
        if(row.fromUserId._id.toString() == user._id.toString()) return row.toUserId
        return row.fromUserId
    })

    res.json({ message: "All Connections retrieved successfully", data });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

userRouter.get("/feed", userAuth, async (req, res) => {
    try{
        const user = req.user;

        const page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        limit = limit > 30 ? 30 : limit;
        const skip = (page - 1) * limit;

        const connectionRequest = await ConnectionRequest.find({$or: [{fromUserId: user._id}, {toUserId: user._id}]}).select("fromUserId toUserId")

        const hiderUsersFromFeed = new Set()

        connectionRequest.forEach(row => {
            hiderUsersFromFeed.add(row.fromUserId.toString())
            hiderUsersFromFeed.add(row.toUserId.toString())
        })

        const users = await User.find({$and: [{_id: {$nin: Array.from(hiderUsersFromFeed)}}, {_id: {$ne: user._id}}]}).select("firstName lastName photoUrl about skills").skip(skip).limit(limit)
        res.json({ message: "User feed retrieved successfully", data: users });
    }
    catch(err){
        res.status(400).json({ message: err.message });
    }
})

module.exports = userRouter;