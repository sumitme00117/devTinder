const express = require("express");
const authRouter = express.Router();
const { validateSignUpData } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");



authRouter.post("/signup", async (req, res) => {
  try {
    // Validation of data
    validateSignUpData(req);

    // Encrypt the password
    const { firstName, lastName, emailId, password } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });

    const savedUser = await user.save();

    const token = await savedUser.getJWT()

    res.cookie("token", token, {expires: new Date(Date.now() + 8*3600000)}); // expires in 8 hours

    res.json({ message: "User registered successfully", data: savedUser });
  } catch (err) {
    res.status(500).send("Error:" + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId });

    if (!user) throw new Error("Invalid credentials");

    const isPasswordValid = await user.validatePassword(password);

    if (isPasswordValid) {
      const token = await user.getJWT()

      res.cookie("token", token, {expires: new Date(Date.now() + 8*3600000)}); // expires in 8 hours
      res.send(user);
    } else throw new Error("Invalid credential");
  } catch (err) {
    res.status(500).send("Error:" + err.message);
  }
});

authRouter.get("/logout", (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()) });
  res.send("Logout Successful");
});

module.exports = authRouter;