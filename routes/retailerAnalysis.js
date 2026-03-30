const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.post("/analysis", async (req, res) => {
  try {
    const { name, startDate, endDate } = req.body;

    const Retailer = mongoose.connection.db.collection("retailers");
    const retailer = await Retailer.findOne({ name });

    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    let bills = retailer.bills || [];
    const payments = retailer.FinePayments || [];

    // ✅ FILTER BY DATE RANGE
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      bills = bills.filter(b => {
        const billDate = new Date(b.date);
        return billDate >= start && billDate <= end;
      });
    }

    if (bills.length === 0) {
      return res.json({ message: "No data in selected range" });
    }

    // ✅ SORT BILLS
    bills.sort((a, b) => new Date(a.date) - new Date(b.date));

    // =========================
    // 📊 SUMMARY CALCULATIONS
    // =========================
    let totalProfitSilver = 0;
    let totalProfitRupees = 0;
    let totalSilverGiven = 0;

    bills.forEach(b => {
      totalProfitSilver += parseFloat(b.profitSilver) || 0;
      totalProfitRupees += parseFloat(b.profitRupees) || 0;
      totalSilverGiven += parseFloat(b.totalFineCredit) || 0;
    });

    totalProfitSilver = Number(totalProfitSilver.toFixed(3));
    totalProfitRupees = Number(totalProfitRupees.toFixed(2));

    // =========================
    // 📅 DATE ANALYSIS
    // =========================
    const firstBillDate = bills[0].date;
    const lastBillDate = bills[bills.length - 1].date;

    let totalGap = 0;
    for (let i = 1; i < bills.length; i++) {
      const prev = new Date(bills[i - 1].date);
      const curr = new Date(bills[i].date);
      totalGap += (curr - prev) / (1000 * 60 * 60 * 24);
    }

    const avgGap = bills.length > 1 ? (totalGap / (bills.length - 1)).toFixed(1) : 0;

    // =========================
    // ⏱️ CREDIT DAYS
    // =========================
    let totalDays = 0;
    let count = 0;

    bills.forEach(bill => {
      const billDate = new Date(bill.date);

      const payment = payments.find(p =>
        p.adjustments?.some(a => a.billId === bill.billId)
      );

      if (payment) {
        const payDate = new Date(payment.date);
        const diff = (payDate - billDate) / (1000 * 60 * 60 * 24);
        totalDays += diff;
        count++;
      }
    });

    const avgDays = count ? Number((totalDays / count).toFixed(1)) : 0;

    // =========================
    // 🧠 CATEGORY
    // =========================
    let category = "B";
    if (avgDays < 15) category = "A";
    else if (avgDays > 30) category = "C";

    // =========================
    // ⚡ EFFICIENCY
    // =========================
    const start = new Date(firstBillDate);
    const end = new Date(lastBillDate);
    const totalDaysActive = (end - start) / (1000 * 60 * 60 * 24) || 1;

    const efficiency = Number((totalProfitSilver / totalDaysActive).toFixed(4));

    // =========================
    // 💳 PAYMENT BEHAVIOR
    // =========================
    const paymentPattern =
      payments.length > bills.length / 2 ? "Regular" : "Irregular";

    // =========================
    // ⚠️ RISK
    // =========================
    const exposure = retailer.fineBalance || 0;

    let risk = "LOW";
    if (exposure > 200 || avgDays > 30) risk = "HIGH";
    else if (avgDays > 20) risk = "MEDIUM";

    // =========================
    // 📞 FOLLOW-UP ENGINE
    // =========================
    let followup = "";
    let action = "";

    if (avgDays > 30 || exposure > 300) {
      followup = "Call immediately. High exposure + delay.";
      action = "CALL";
    } else if (avgDays > 20) {
      followup = "Send WhatsApp reminder.";
      action = "MESSAGE";
    } else {
      followup = "Healthy. Push sales.";
      action = "NONE";
    }

    res.json({
      summary: {
        totalBills: bills.length,
        totalProfitSilver,
        totalProfitRupees,
        totalSilverGiven,
        fineBalance: retailer.fineBalance,
        cashBalance: retailer.cashBalance
      },
      dates: {
        firstBillDate,
        lastBillDate,
        avgGapBetweenBills: avgGap
      },
      credit: {
        avgDays,
        category
      },
      performance: {
        efficiency
      },
      behavior: {
        paymentPattern
      },
      risk: {
        exposure,
        riskLevel: risk
      },
      followup: {
        suggestion: followup,
        action
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating analysis" });
  }
});


module.exports = router;