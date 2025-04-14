import { useEffect, useState } from "react";
import ItemAnalytics from "./ItemAnalytics"; // make sure this path is correct

export default function DisplayStocks() {
  const [stocks, setStocks] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/getstocks")
      .then(res => res.json())
      .then(data => setStocks(data))
      .catch(err => console.error("Error fetching stocks:", err));
  }, []);

  const totalGrossWeight = stocks.reduce((sum, item) => {
    const gross = parseFloat(item.grossWeight);
    return sum + (isNaN(gross) ? 0 : gross);
  }, 0).toFixed(3);

  const totalNetWeight = stocks.reduce((sum, item) => {
    const net = parseFloat(item.netWeight);
    return sum + (isNaN(net) ? 0 : net);
  }, 0).toFixed(3);

  return (
    <div className="p-4 overflow-x-auto">
      {/* Clickable heading to toggle */}
      <div
        className="flex justify-between items-center mb-4 cursor-pointer"
        onClick={() => setShowAnalytics(!showAnalytics)}
      >
        <h2 className="text-xl font-bold text-blue-700 hover:underline">
          Stock List
        </h2>
      
      </div>

      {showAnalytics ? (
        <ItemAnalytics />
      ) : (
        <>
          <div className="mt-1 mb-4 text-right font-semibold text-lg space-y-1">
            <div>
              Gross Weight: <span className="text-green-700">{totalGrossWeight} gm</span>
            </div>
            <div>
              Net Weight: <span className="text-blue-700">{totalNetWeight} gm</span>
            </div>
          </div>

          <table className="min-w-full border text-sm">
            <thead>
              <tr>
                {[
                  "Item", "Act. Tunch", "Tunch", "Sell Tunch", "Gross", "Net",
                  "Pcs", "Poly", "Labour", "Rate", "Date", "Vendor"
                ].map((h, i) => (
                  <th key={i} className="border px-2 py-1">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stocks.map((item, idx) => (
                <tr key={idx} className="border">
                  <td className="border px-2">{item.itemName}</td>
                  <td className="border px-2">{item.actualTunch}</td>
                  <td className="border px-2">{item.tunch}</td>
                  <td className="border px-2">{item.sellTunch}</td>
                  <td className="border px-2">{item.grossWeight}</td>
                  <td className="border px-2">{item.netWeight}</td>
                  <td className="border px-2">{item.pcs}</td>
                  <td className="border px-2">{item.poly}</td>
                  <td className="border px-2">{item.labour}</td>
                  <td className="border px-2">{item.rate}</td>
                  <td className="border px-2">{item.date}</td>
                  <td className="border px-2">{item.vendor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
