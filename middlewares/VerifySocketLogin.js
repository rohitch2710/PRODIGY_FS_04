const Users = require("../models/Users");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

const verifySocketLogin = (socket, next) => {
  try {
    const cookies = socket.handshake.headers.cookie;
    if (!cookies) return next(new Error("No cookies found"));
    const token = cookies
      .split(";")
      .find((cookie) => cookie.trim().startsWith("rtchat_auth_token="));
    const jwtToken = token.split("=")[1];
    if (!jwtToken) return next(new Error("No token found"));
    jwt.verify(jwtToken, jwtSecret, async (err, decodedToken) => {
      if (err) return next(new Error("Invalid token"));
      const { id } = decodedToken;
      const userExist = await Users.findById(id);
      if (!userExist) return next(new Error("Invalid token"));
      socket.userId = id;
      socket.username = userExist.username;
      next();
    });
  } catch (error) {
    next(new Error("Server side error occurred"));
  }
};

module.exports = verifySocketLogin;
