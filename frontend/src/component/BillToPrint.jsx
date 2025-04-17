// BillToPrint.js
import React, { forwardRef } from "react";

const BillToPrint = forwardRef(({ selectedRetailer, date, rate, items, totals, kachi, totalFineCredit, totalAmount, received, remaining }, ref) => {
  return (
    <div ref={ref} className="p-4 text-black print:text-black bg-white">
      <h2 className="text-lg font-bold mb-2">Bill</h2>
      <div className="mb-2">
        <p><strong>Name:</strong> {selectedRetailer?.name}</p>
        <p><strong>Number:</strong> {selectedRetailer?.phone}</p>
        <p><strong>Date:</strong> {date}</p>
        <p><strong>Rate:</strong> {rate}</p>
      </div>

      <hr />

      <div className="my-4">
        <table className="w-full border border-collapse">
          <thead>
            <tr>
              <th className="border p-2">Item</th>
              <th className="border p-2">G Wt</th>
              <th className="border p-2">Net Wt</th>
              <th className="border p-2">Poly</th>
              <th className="border p-2">Actual Tunch</th>
              <th className="border p-2">Sell Tunch</th>
              <th className="border p-2">Silver</th>
              <th className="border p-2">Pcs</th>
              <th className="border p-2">Labour</th>

            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td className="border p-2">{item.itemName}</td>
                <td className="border p-2">{item.grossWeight}</td>
                <td className="border p-2">{item.netWeight}</td>
                <td className="border p-2">{item.poly}</td>
                <td className="border p-2">{item.actualTunch}</td>
                <td className="border p-2">{item.sellTunch}</td>
                <td className="border p-2">{item.silver}</td>
                <td className="border p-2">{item.pcs}</td>
                <td className="border p-2">{item.labour}</td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="totaldiv my-3">
        <p>Total Gross: {totals.grossWeight}</p>
        <p>Total Net: {totals.netWeight}</p>
        <p>Total Silver: {totals.totalSilver}</p>
        <p>Total Silver: {totals.netLabour}</p>

      </div>

      {/* <div className="kacchidiv my-3">
        <p>Kacchi Wt: {kachi.kachiwt}</p>
        <p>Kacchi Tunch: {kachi.kachiTunch}</p>
        <p>Kacchi Fine: {kachi.kachiFine}</p>
      </div> */}
      {Array.isArray(kachi) && kachi.length > 0 && (
  <div className="kacchidiv my-3">
    <h3 className="font-semibold mb-2">Kachi Items</h3>
    <table className="w-full border border-collapse">
      <thead>
        <tr>
          <th className="border p-2">Weight (g)</th>
          <th className="border p-2">Tunch</th>
          <th className="border p-2">Fine (g)</th>
        </tr>
      </thead>
      <tbody>
        {kachi.map((item, index) => (
          <tr key={index}>
            <td className="border p-2 mx-1">{item.kachiwt}</td>
            <td className="border p-2 mx-1">{item.kachiTunch}</td>
            <td className="border p-2 mx-1">{item.kachiFine}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}


      <div className="valuediv mt-3">
        <p>Total Fine Credit: {totalFineCredit}</p>
        <p>Total Amount: ₹{totalAmount.toFixed(2)}</p>
        <p>Received: ₹{received}</p>
        <p>Remaining: ₹{remaining.toFixed(2)}</p>
      </div>
    </div>
  );
});

export default BillToPrint;
