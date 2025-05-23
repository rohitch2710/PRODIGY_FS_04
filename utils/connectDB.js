const mongoose = require("mongoose");
const dbUri = process.env.DB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(dbUri);
    console.log("Connected to DB");
  } catch (err) {
    console.log("DB connection failed");
    process.exit(1);
  }
};

module.exports = connectDB;
