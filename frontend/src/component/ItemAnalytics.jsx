import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ItemAnalytics = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [analytics, setAnalytics] = useState([]);
  const [summary, setSummary] = useState({ profitSilver: 0, profitRupees: 0 });
  const [extraMetrics, setExtraMetrics] = useState({ mostSoldItem: '', highestGrossingItem: '' });
  const [monthlySilverData, setMonthlySilverData] = useState([]);
  const handleMonthlySilverAnalytics = async () => {
    try {
      const response = await fetch(
        "https://shobhasilverst.onrender.com/api/getretailerbills"
      );
      const allBills = await response.json();

      const startDate = new Date("2025-04-01"); // From 1 April 2025
      const endDate = new Date();               // Till today

      const filteredBills = allBills.retailers.flatMap((r) =>
        r.bills.filter((bill) => {
          const billDate = new Date(bill.date);
          return billDate >= startDate && billDate <= endDate;
        })
      );

      const monthMap = {}; // { '2025-04': { monthKey, monthLabel, soldSilver, profitSilver } }

      filteredBills.forEach((bill) => {
        const d = new Date(bill.date);
        const year = d.getFullYear();
        const monthIndex = d.getMonth(); // 0–11

        const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
        const monthNames = [
          "Apr", "May", "Jun", "Jul", "Aug", "Sep",
          "Oct", "Nov", "Dec", "Jan", "Feb", "Mar",
        ];
        // But better map correctly:
        const properMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthLabel = `${properMonthNames[monthIndex]} ${year}`;

        if (!monthMap[monthKey]) {
          monthMap[monthKey] = {
            monthKey,
            monthLabel,
            soldSilver: 0,   // in grams
            profitSilver: 0, // in grams
          };
        }

        // 🔹 Profit in silver (g) from bill
        const billProfitSilver = parseFloat(bill.profitSilver || 0);
        monthMap[monthKey].profitSilver += billProfitSilver;

        // 🔹 Sold silver (g) from each item (item.silver)
        bill.items.forEach((item) => {
          const silver = parseFloat(item.netWeight || 0); // already in grams
          monthMap[monthKey].soldSilver += silver;
        });
      });

      const monthlyArray = Object.values(monthMap).sort((a, b) =>
        a.monthKey.localeCompare(b.monthKey)
      );

      setMonthlySilverData(monthlyArray);
    } catch (err) {
      console.error("Error fetching monthly silver analytics:", err);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('https://shobhasilverst.onrender.com/api/getretailerbills');
      const allBills = await response.json();

      const filteredBills = allBills.retailers.flatMap(b =>
        b.bills.filter(bill => {
          const billDate = new Date(bill.date);
          return billDate >= new Date(fromDate) && billDate <= new Date(toDate);
        })
      );

      const itemMap = {};
      let totalProfitSilver = 0;
      let totalProfitRupees = 0;
      let totalGrossWeight = 0;
      let totalNetWeight = 0;

      filteredBills.forEach(bill => {
        totalProfitSilver += parseFloat(bill.profitSilver || 0);
        totalProfitRupees += parseFloat(bill.profitRupees || 0);

        bill.items.forEach(item => {
          const key = item.itemName;
          const pcs = parseFloat(item.pcs || 0);
          const gross = parseFloat(item.grossWeight || 0);
          const net = parseFloat(item.netWeight || 0);
          const amount = parseFloat(item.rate || 0) * net;
          totalGrossWeight += gross;
          totalNetWeight += net;

          if (!itemMap[key]) {
            itemMap[key] = {
              itemName: key,
              totalPcs: 0,
              totalGross: 0,
              totalNet: 0,
              totalAmount: 0
            };
          }

          itemMap[key].totalPcs += pcs;
          itemMap[key].totalGross += gross;
          itemMap[key].totalNet += net;
          itemMap[key].totalAmount += amount;
        });
      });

      const itemsArray = Object.values(itemMap);
      itemsArray.sort((a, b) => b.totalPcs - a.totalPcs);

      const mostSoldItem = itemsArray[0]?.itemName || '';
      const highestGrossingItem = itemsArray.sort((a, b) => b.totalAmount - a.totalAmount)[0]?.itemName || '';

      setAnalytics(itemsArray);
      setSummary({
        profitSilver: totalProfitSilver,
        profitRupees: totalProfitRupees,
        totalGross: totalGrossWeight,
        totalNet: totalNetWeight
      });

      setExtraMetrics({ mostSoldItem, highestGrossingItem });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Item Analytics</h2>
      {monthlySilverData.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">
            Monthly Silver Analytics (From Apr 2025)
          </h3>

          {/* 1️⃣ Sold Silver (grams) per month */}
          <h4 className="font-semibold mb-1">
            Sold Silver per Month (grams)
          </h4>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart
                data={monthlySilverData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="soldSilver" name="Sold Silver (g)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 2️⃣ Profit in Silver (grams) per month */}
          <h4 className="font-semibold mt-6 mb-1">
            Profit in Silver per Month (grams)
          </h4>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart
                data={monthlySilverData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="profitSilver" name="Profit Silver (g)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <input
          type="date"
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <input
          type="date"
          value={toDate}
          onChange={e => setToDate(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-1 rounded">
          Submit
        </button>
        <button
          onClick={handleMonthlySilverAnalytics}
          className="bg-green-600 text-white px-4 py-1 rounded"
        >
          Monthly Silver Charts
        </button>
      </div>

      <div className="mb-6">
        <p><strong>Total Profit in Silver:</strong> {summary.profitSilver.toFixed(3)} g</p>
        <p><strong>Total Profit in Rupees:</strong> ₹{summary.profitRupees.toFixed(2)}</p>
        <p><strong>Total Gross Weight Sold:</strong> {summary.totalGross?.toFixed(2)} g</p>
        <p><strong>Total Net Weight Sold:</strong> {summary.totalNet?.toFixed(2)} g</p>
      </div>


      <table className="w-full table-auto border mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Item Name</th>
            <th className="border px-2 py-1">Total PCS</th>
            <th className="border px-2 py-1">Total Gross Weight</th>
            <th className="border px-2 py-1">Total Net Weight</th>
            <th className="border px-2 py-1">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {analytics.map((item, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1">{item.itemName}</td>
              <td className="border px-2 py-1">{item.totalPcs}</td>
              <td className="border px-2 py-1">{item.totalGross.toFixed(2)} g</td>
              <td className="border px-2 py-1">{item.totalNet.toFixed(2)} g</td>
              <td className="border px-2 py-1">₹{item.totalAmount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <h3 className="text-lg font-semibold mb-2">Extra Insights</h3>
        <p><strong>Most Sold Item:</strong> {extraMetrics.mostSoldItem}</p>
        <p><strong>Highest Grossing Item:</strong> {extraMetrics.highestGrossingItem}</p>
        <p><strong>No. of Bills Sold:</strong> {analytics.length}</p>
      </div>
    </div>
  );
};

export default ItemAnalytics;

