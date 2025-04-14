const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

router.get("/getstocks", async (req, res) => {
  try {
    const stockCollection = await mongoose.connection.db.collection("stock");
    

    const stocks = await stockCollection.find({}).sort({ date: -1 }).toArray();
    res.status(200).json(stocks);
  } catch (error) {
    console.error("Error fetching stocks:", error);
    res.status(500).json({ message: "Error fetching stock", error });
  }
});

module.exports = router;
