const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

router.post("/updatestock", async (req, res) => {
  try {
    const { itemName, grossWeight, netWeight, pcs } = req.body;

    if (!itemName || !grossWeight || !netWeight || !pcs) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const stockCollection = await mongoose.connection.db.collection("stock");

    const existingItem = await stockCollection.findOne({ itemName });

    if (!existingItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    const updatedGross = (parseFloat(existingItem.grossWeight) + parseFloat(grossWeight)).toFixed(3);
    const updatedNet = (parseFloat(existingItem.netWeight) + parseFloat(netWeight)).toFixed(3);
    const updatedPcs = (parseInt(existingItem.pcs) + parseInt(pcs)).toString();

    await stockCollection.updateOne(
      { itemName },
      {
        $set: {
          grossWeight: updatedGross,
          netWeight: updatedNet,
          pcs: updatedPcs,
        },
      }
    );

    res.json({ message: "Stock updated successfully" });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ message: "Error updating stock", error });
  }
});

module.exports = router;
