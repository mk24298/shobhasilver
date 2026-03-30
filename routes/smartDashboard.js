const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/real", async (req, res) => {
  try {
    // ✅ ensure DB is ready
    if (!mongoose.connection.db) {
      return res.status(500).json({ message: "DB not connected yet" });
    }

    const retailers = await mongoose.connection.db
      .collection("retailers")
      .find({})
      .toArray();

    let totalCredit = 0;

    let askPayment = [];
    let pushSales = [];
    let encourage = [];
    let kill = [];
    let inactive = [];

    let topRetailers = [];
    let worstRetailers = [];

    const today = new Date();

    for (let r of retailers) {
      const bills = r.bills || [];
      const payments = r.FinePayments || [];

      const exposure = parseFloat(r.fineBalance) || 0;
      totalCredit += exposure;

      // 🔹 last bill date
      let lastBillDate = null;
      let lastBillDateObj = null;

      if (bills.length > 0) {
        lastBillDate = bills[bills.length - 1].date;
        lastBillDateObj = new Date(lastBillDate);
      }

      // 🔹 last payment date
      let lastPaymentDateObj = null;
      if (payments.length > 0) {
        lastPaymentDateObj = new Date(payments[payments.length - 1].date);
      }

      // 🔹 last activity
      let lastActivityDate = lastBillDateObj || lastPaymentDateObj;

      if (lastBillDateObj && lastPaymentDateObj) {
        lastActivityDate =
          lastBillDateObj > lastPaymentDateObj
            ? lastBillDateObj
            : lastPaymentDateObj;
      }

      let daysInactive = 0;

      if (lastActivityDate) {
        daysInactive =
          (today - lastActivityDate) / (1000 * 60 * 60 * 24);
      }

      // 🔹 total business
      let totalSilver = 0;
      bills.forEach(b => {
        totalSilver += parseFloat(b.totalFineCredit) || 0;
      });

      const obj = {
        name: r.name,
        phone: r.phone,
        exposure: exposure.toFixed(2),
        totalSilver: totalSilver.toFixed(2),
        lastBillDate
      };

      // =====================
      // 🔴 INACTIVE
      // =====================
      if (daysInactive > 28) {
        inactive.push({
          ...obj,
          daysInactive: daysInactive.toFixed(0),
          reason: `No activity for ${daysInactive.toFixed(0)} days`,
          action: "Call + WhatsApp"
        });
      }

      // =====================
      // 🔥 DECISION ENGINE
      // =====================

      if (exposure > 300 && totalSilver < 200) {
        kill.push({
          ...obj,
          reason: "High credit + low business",
          action: "STOP credit + recover"
        });

      } else if (exposure > 200) {
        askPayment.push({
          ...obj,
          reason: "High balance",
          action: "Call for recovery"
        });

      } else if (exposure < 50 && totalSilver > 300) {
        pushSales.push({
          ...obj,
          reason: "Fast & strong customer",
          action: "Push sales"
        });

      } else {
        encourage.push({
          ...obj,
          reason: "Normal customer",
          action: "Maintain relation"
        });
      }

      topRetailers.push({ ...obj });
      worstRetailers.push({ ...obj });
    }

    // 🔥 SORTING
    topRetailers.sort((a, b) => b.totalSilver - a.totalSilver);
    worstRetailers.sort((a, b) => b.exposure - a.exposure);

    res.json({
      summary: {
        totalCredit: totalCredit.toFixed(2),
        totalRetailers: retailers.length
      },
      actions: {
        inactive,
        askPayment,
        pushSales,
        encourage,
        kill
      },
      topRetailers: topRetailers.slice(0, 5),
      worstRetailers: worstRetailers.slice(0, 5)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Dashboard error" });
  }
});

module.exports = router;