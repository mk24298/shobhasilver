const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const fs = require('fs');

router.get('/download-retailers-report', async (req, res) => {
  try {
    const Retailer = mongoose.connection.db.collection("retailers");
    const retailers = await Retailer.find({}).toArray();

    const filteredRetailers = retailers
      .map(retailer => {
        const totalRemaining = retailer.bills?.reduce((sum, bill) => {
          const remaining = parseFloat(bill.remaining || 0);
          return sum + (isNaN(remaining) ? 0 : remaining);
        }, 0);

        return {
          name: retailer.name,
          fineBalance: parseFloat(retailer.fineBalance || 0),
          cashBalance: parseFloat(retailer.cashBalance || 0),
          totalRemaining: parseFloat(totalRemaining.toFixed(2))
        };
      })
      .filter(ret => ret.fineBalance > 1 || ret.totalRemaining > 1 || ret.cashBalance > 1);

    if (filteredRetailers.length === 0) {
      return res.status(200).json({ message: 'No retailers with fineBalance > 1 or totalRemaining > 1.' });
    }

    const doc = new PDFDocument();
    const filename = 'Retailers_Report.pdf';

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(20).text('Retailers with Fine Balance or Bill Remaining > 1', { align: 'center' });
    doc.moveDown();

    filteredRetailers.forEach((ret, i) => {
      doc
        .fontSize(12)
        .text(`${i + 1}. ${ret.name}`)
        .text(`   Fine Balance: ${ret.fineBalance}`)
        .text(`   Total Remaining: ${ret.totalRemaining}`)
        .text(`   Total cash Balance: ${ret.cashBalance}`)
        .moveDown();
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while generating PDF' });
  }
});
  module.exports = router;