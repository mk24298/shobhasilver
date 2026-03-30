import React, { useEffect, useState } from "react";

const RetailerAnalysisPage = () => {
    const [retailers, setRetailers] = useState([]);
    const [selectedRetailer, setSelectedRetailer] = useState("");
    const [analysis, setAnalysis] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    useEffect(() => {
        fetch("https://shobhasilverst.onrender.com/api/getretailers")
            .then(res => res.json())
            .then(data => setRetailers(data));
    }, []);

    const fetchAnalysis = async () => {
        if (!selectedRetailer) return alert("Select retailer");

        const res = await fetch(
            "https://shobhasilverst.onrender.com/api/analysis",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: selectedRetailer,
                    startDate,
                    endDate
                })
            }
        );

        const data = await res.json();
        setAnalysis(data);
    };

    return (
        <div className="p-5">
            <h2 className="text-xl font-bold mb-4">Retailer Analysis</h2>

            <div className="flex gap-3 mb-4">
                <select
                    value={selectedRetailer}
                    onChange={(e) => setSelectedRetailer(e.target.value)}
                    className="border px-3 py-1"
                >
                    <option value="">Select Retailer</option>
                    {retailers.map((r, i) => (
                        <option key={i} value={r.name}>
                            {r.name}
                        </option>
                    ))}
                </select>
                <input type="date" onChange={(e) => setStartDate(e.target.value)} />
                <input type="date" onChange={(e) => setEndDate(e.target.value)} />
                <button
                    onClick={fetchAnalysis}
                    className="bg-blue-600 text-white px-4 py-1 rounded"
                >
                    Analyze
                </button>
            </div>

            {analysis && (
                <div className="bg-white p-4 shadow rounded">

                    <h3 className="text-lg font-semibold mb-3">📊 Summary</h3>
                    <p>First Bill: {analysis.dates.firstBillDate}</p>
<p>Last Bill: {analysis.dates.lastBillDate}</p>
<p>Avg Gap: {analysis.dates.avgGapBetweenBills} days</p>
                    <p>Bills: {analysis.summary.totalBills}</p>
                    <p>Profit: {analysis.summary.totalProfitSilver} g</p>
                    <p>₹ Profit: {analysis.summary.totalProfitRupees}</p>
                    <p>Silver Given: {analysis.summary.totalSilverGiven} g</p>
                    <p>Fine Balance: {analysis.summary.fineBalance} g</p>
                    <p>Cash Balance: ₹ {analysis.summary.cashBalance}</p>

                    <hr className="my-3" />

                    <h3 className="text-lg font-semibold">📈 Credit</h3>
                    <p>Avg Days: {analysis.credit.avgDays}</p>
                    <p>Category: {analysis.credit.category}</p>

                    <h3 className="text-lg font-semibold mt-3">⚡ Performance</h3>
                    <p>Efficiency: {analysis.performance.efficiency} g/day</p>

                    <h3 className="text-lg font-semibold mt-3">🧠 Behavior</h3>
                    <p>{analysis.behavior.paymentPattern}</p>

                    <h3 className="text-lg font-semibold mt-3">⚠️ Risk</h3>
                    <p>Exposure: {analysis.risk.exposure} g</p>
                    <p>Risk: {analysis.risk.riskLevel}</p>

                    <div className="mt-4 p-3 bg-yellow-100 rounded">
                        <h4 className="font-semibold">📞 Follow-up</h4>
                        <p>{analysis.followup.suggestion}</p>
                    </div>

                </div>
            )}
        </div>
    );
};

export default RetailerAnalysisPage;