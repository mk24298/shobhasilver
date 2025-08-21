const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

router.post("/delete-bill", async (req, res) => {
  try {
    const { retailerId, billId } = req.body;
    if (!retailerId || !billId) {
      return res.status(400).json({ message: "Missing retailerId or billId" });
    }

    const Retailer = mongoose.connection.db.collection("retailers");
    const Stock = mongoose.connection.db.collection("stock");

    // 1. Find retailer
    const retailer = await Retailer.findOne({ retailerId });
    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    // 2. Find the bill to delete
    const bill = retailer.bills.find((b) => b.billId === billId);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // 3. Reverse stock for each item
    for (const item of bill.items) {
      const stockId = item._id;
      const stock = await Stock.findOne({ _id: new mongoose.Types.ObjectId(stockId) });

      if (!stock) {
        return res.status(404).json({ message: `Stock item not found for ID: ${stockId}` });
      }

      const updatedGross = parseFloat(stock.grossWeight) + parseFloat(item.grossWeight);
      const updatedNet = parseFloat(stock.netWeight) + parseFloat(item.netWeight);
      const updatedPcs = parseFloat(stock.pcs) + parseFloat(item.pcs);

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

    // 4. Remove bill and adjust fine balance
    const remaining = parseFloat(bill.remaining || 0);
    const remainingCash = parseFloat(bill.remainingCash || 0);
    const today = new Date().toISOString().split("T")[0];
    const cashEntry = {
      amount: remainingCash, // Deduction
      date: today,
      remark: `Bill #${billId} deleted, deducted labour added back to cash balance`
    };

    const updateResult = await Retailer.updateOne(
      { retailerId },
      {
        $pull: { bills: { billId: billId } },
        $inc: {
          fineBalance: -remaining,
          cashBalance: +remainingCash
        },
        $push: {
          cashEntries: cashEntry
        }

      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({ message: "Failed to delete bill" });
    }

    res.status(200).json({ message: `Bill with Bill ID: ${billId} deleted successfully.` });
  } catch (error) {
    console.error("Error deleting bill:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
});
module.exports = router;