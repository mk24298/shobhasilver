const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();// Adjust the path to your Retailer model

// GET retailer balance by retailerId
router.get('/getretailerbalance/:retailerId', async (req, res) => {
  try {
    const { retailerId } = req.params;
console.log(retailerId)
    // Find retailer by retailerId
    const Retailer = mongoose.connection.db.collection("retailers");
    const retailer = await Retailer.findOne({ retailerId: parseInt(retailerId) });

    if (!retailer) {
      return res.status(404).json({ message: 'Retailer not found' });
    }

    // Return fineBalance and cashBalance
    res.status(200).json({
      fineBalance: retailer.fineBalance || 0,
      cashBalance: retailer.cashBalance || 0,
    });
  } catch (error) {
    console.error('Error fetching retailer balance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;





