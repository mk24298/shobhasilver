const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

router.post('/addfinepayment', async (req, res) => {
    try {
        let { name, date, fineGiven, remark } = req.body;

        // Convert fineGiven to number
        fineGiven = parseFloat(fineGiven);
        if (!name || !date || isNaN(fineGiven) || fineGiven <= 0) {
            return res.status(400).json({ message: 'Missing or invalid required fields.' });
        }

        const Retailer = mongoose.connection.db.collection("retailers");

        // Get retailer document
        const retailer = await Retailer.findOne({ name });

        if (!retailer) return res.status(404).json({ message: 'Retailer not found' });

        let remainingFine = fineGiven;
        const adjustments = [];

        // Sort bills by date
        const sortedBills = [...retailer.bills].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Adjust bills
        for (let bill of sortedBills) {
            if (remainingFine <= 0) break;
            if (bill.remaining > 0) {
                const adjustAmount = Math.min(remainingFine, bill.remaining);
                bill.remaining -= adjustAmount;
                remainingFine -= adjustAmount;

                adjustments.push({
                    billId: bill.billId || bill._id,
                    adjusted: adjustAmount
                });
            }
        }

        // Ensure FinePayments field exists
        if (!retailer.FinePayments) retailer.FinePayments = [];

        // Push new fine payment
        retailer.FinePayments.push({
            date,
            fineGiven,
            adjustments,
            remark
        });

        // Update fineBalance
        retailer.fineBalance = (retailer.fineBalance || 0) - fineGiven;
        // if (retailer.fineBalance < 0) retailer.fineBalance = 0;

        // Update the retailer document in MongoDB
        await Retailer.updateOne(
            { _id: retailer._id },
            {
                $set: {
                    bills: retailer.bills,
                    fineBalance: retailer.fineBalance
                },
                $push: {
                    FinePayments: {
                        date,
                        fineGiven,
                        adjustments,
                        remark
                    }
                }
            }
        );

        res.json({ message: 'Fine payment recorded successfully.', fineBalance: retailer.fineBalance });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
