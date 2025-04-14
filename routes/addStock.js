// routes/addStock.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

router.post("/addstock", async (req, res) => {
  try {
    const stockCollection = await mongoose.connection.db.collection("stock");


    await stockCollection.insertOne(req.body);
    res.status(201).json({ message: "Stock item added" });
  } catch (error) {
    console.error("Error adding stock:", error);
    res.status(500).json({ message: "Error adding stock", error });
  }
});

module.exports = router;
