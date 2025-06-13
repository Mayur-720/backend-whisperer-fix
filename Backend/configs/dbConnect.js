const mongoose = require("mongoose");

function ConnectTODB() {
  mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log("connected to DB");
  });
}

module.exports = ConnectTODB;
