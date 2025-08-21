const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

router.post('/addcashentry', async (req, res) => {
    try {
        let { name, amount, date, remark } = req.body;

        // Validate inputs
        amount = parseFloat(amount);
        if (!name || !date || isNaN(amount)) {
            return res.status(400).json({ message: 'Missing or invalid required fields.' });
        }

        const Retailer = mongoose.connection.db.collection("retailers");

        // Check if retailer exists
        const retailer = await Retailer.findOne({ name });
        if (!retailer) return res.status(404).json({ message: 'Retailer not found.' });

        // Prepare the cash entry object
        const cashEntry = {
            amount,
            date,
            remark: remark || ""
        };

        // Update the retailer document with the new cash entry
          const updateResult = await Retailer.updateOne(
            { name },
            { 
                $push: { cashEntries: cashEntry },
                $inc: { cashBalance: amount }
            }
        );
        // await Retailer.updateOne(
        //     { name },
        //     { $push: { cashEntries: cashEntry } }
        // );
  if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ message: "Failed to add cash entry." });
        }
        res.status(200).json({ message: "Cash entry added successfully.", cashEntry });

    } catch (err) {
        console.error("Error adding cash entry:", err);
        res.status(500).json({ message: "Server error while adding cash entry." });
    }
});

module.exports = router;
