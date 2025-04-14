const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// GET: All Retailers (only basic info)
router.get("/getretailers", async (req, res) => {
  try {
    const Retailer = mongoose.connection.db.collection("retailers");

    const retailers = await Retailer.find({}, {
      projection: { retailerId: 1, name: 1, phone: 1, _id: 0 }
    }).toArray();

    res.status(200).json(retailers);
  } catch (error) {
    console.error("Error fetching retailers:", error);
    res.status(500).json({ message: "Error fetching retailers", error });
  }
});

module.exports = router;
