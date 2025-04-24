const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// Retailer Schema


// API to create a new retailer
router.post("/create-retailer", async (req, res) => {
  try {
    const { name, phone } = req.body;
    const Retailer = mongoose.connection.db.collection("retailers");

    const lastRetailer = await Retailer.findOne({}, { sort: { retailerId: -1 } });
    const newRetailerId = lastRetailer ? lastRetailer.retailerId + 1 : 1;

    const newRetailer = {
      retailerId: newRetailerId,
      name,
      phone,
      bills: [],
    };

    await Retailer.insertOne(newRetailer);
    res.status(201).json({ message: "Retailer created", retailer: newRetailer });
  } catch (error) {
    res.status(500).json({ message: "Error creating retailer", error });
  }
});

// API to create a bill for a retailer
// API to create a bill for a retailer
// API to create a bill for a retailer
router.post("/create-bill", async (req, res) => {
  try {
    const { retailerId, bill } = req.body;
    if (!retailerId || !bill || !Array.isArray(bill.items)) {
      return res.status(400).json({ message: "Missing or invalid retailerId or bill data" });
    }

    const Retailer = mongoose.connection.db.collection("retailers");
    const Stock = mongoose.connection.db.collection("stock");

    // 1. Fetch retailer to determine latest billId
    const retailer = await Retailer.findOne({ retailerId });

    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    const latestBill = retailer.bills?.slice(-1)[0];
    const lastBillId = latestBill?.billId || (retailerId * 10); // starts like 50, 60, etc.
    const newBillId = lastBillId + 1;

    // 2. Subtract stock
    for (const item of bill.items) {
      const stockId = item._id;
      const stock = await Stock.findOne({ _id: new mongoose.Types.ObjectId(stockId) });

      if (!stock) {
        return res.status(404).json({ message: `Stock item not found for ID: ${stockId}` });
      }

      const updatedGross = parseFloat(stock.grossWeight) - parseFloat(item.grossWeight);
      const updatedNet = parseFloat(stock.netWeight) - parseFloat(item.netWeight);
      const updatedPcs = parseFloat(stock.pcs) - parseFloat(item.pcs);

      if (updatedGross < 0 || updatedNet < 0 || updatedPcs < 0) {
        return res.status(400).json({ message: `Not enough stock for item: ${item.itemName}` });
      }

      await Stock.updateOne(
        { _id: new mongoose.Types.ObjectId(stockId) },
        {
          $set: {
            grossWeight: updatedGross.toFixed(2),
            netWeight: updatedNet.toFixed(2),
            pcs: updatedPcs.toFixed(0),
          },
        }
      );
    }

    // 3. Add new bill with generated billId
    const finalBill = { ...bill, billId: newBillId };
    const remaining = parseFloat(bill.remaining || 0);
    const result = await Retailer.updateOne(
      { retailerId },
      { $push: { bills: finalBill },
      $inc: { fineBalance: remaining } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ message: "Failed to add bill to retailer" });
    }

    res.status(201).json({
      message: `Bill created successfully with Bill ID: ${newBillId}`,
      billId: newBillId,
    });
  } catch (error) {
    console.error("Error adding bill:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
});




module.exports = router;
