import React, { useEffect, useState } from 'react';
import PrintableBill from './PrintableBill';

const RetailerBillsPage = () => {
    const [retailers, setRetailers] = useState([]);
    const [selectedRetailerName, setSelectedRetailerName] = useState('');
    const [selectedRetailerData, setSelectedRetailerData] = useState(null);
    const [bills, setBills] = useState([]);
    const [totalRemaining, setTotalRemaining] = useState(0);
    const [fineBalance, setFinebalance] = useState(0);
    const [formsubmit, setFormSubmit] = useState(false);
    const [fineGivenList, setFineGivenList] = useState([]);
    useEffect(() => {
        fetch('https://shobhasilver.onrender.com/api/getretailers')
            .then((res) => res.json())
            .then((data) => setRetailers(data));
    }, []);

    const fetchBills = async () => {
        const response = await fetch('https://shobhasilver.onrender.com/api/getretailerbills', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: selectedRetailerName }) // use name instead of id
        });

        const rawdata = await response.json();

        // console.log("bfulla", rawdata)
        const data = rawdata.retailer.bills

        // console.log("bill wala", data)

        if (!data || !Array.isArray(data)) {
            console.error("Invalid bills data:", data);
            setBills([]);
            setTotalRemaining(0);
            return;
        }

        const retailer = retailers.find(r => r.name === selectedRetailerName);
        setSelectedRetailerData(retailer);
        setBills(data.reverse());
        setFinebalance(rawdata.retailer.fineBalance)
        setFineGivenList(rawdata.retailer.FinePayments);
        console.log("erer", rawdata.retailer)
        console.log("ereeferfr", rawdata.retailer.FinePayments)
        console.log("ff", fineGivenList)

        const remainingSum = data.reduce((acc, bill) => acc + (parseFloat(bill.remaining) || 0), 0);
        setTotalRemaining(remainingSum.toFixed(2));
    };

    const handlePrint = (billId) => {
        const printContents = document.getElementById(`print-section-${billId}`).innerHTML;
        const newWindow = window.open("", "", "width=800,height=600");
        newWindow.document.write(`
            <html>
                <head>
                    <title>Print Bill</title>
                    <style>
                        /* Add any required print styles here */
                        body {
                            font-family: sans-serif;
                            padding: 20px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        th, td {
                            border: 1px solid black;
                            padding: 4px;
                            text-align: left;
                        }
                    </style>
                </head>
                <body>
                    ${printContents}
                </body>
            </html>
        `);
        newWindow.document.close();
        newWindow.focus();
        newWindow.print();
        newWindow.close();
    };
    // console.log("dataa",selectedRetailerData)
    const handleDeleteBill = async (billId) => {
        if (!selectedRetailerData || !selectedRetailerData.retailerId) {
            return alert("Retailer data missing!");
        }

        const confirmDelete = window.confirm("Are you sure you want to delete this bill?");
        if (!confirmDelete) return;

        try {
            const response = await fetch("https://shobhasilver.onrender.com/api/delete-bill", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    retailerId: selectedRetailerData.retailerId,
                    billId: billId
                })
            });

            const result = await response.json();
            alert(result.message || "Bill deleted.");
            fetchBills(); // refresh bills after deletion
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete the bill.");
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Retailer Bills Summary</h2>
            <div className="p-4 bg-gray-100 rounded mb-4">
                <strong>Fine Balance (Fine):</strong> {fineBalance}g
            </div>
            <div className="flex gap-4 mb-4">
                <select className="border px-2 py-1" value={selectedRetailerName} onChange={(e) => setSelectedRetailerName(e.target.value)}>
                    <option value="">Select Retailer</option>
                    {retailers.map((retailer, index) => (
                        <option key={`${retailer.name}-${index}`} value={retailer.name}>{retailer.name}</option>
                    ))}
                </select>
                <button onClick={fetchBills} className="bg-blue-600 text-white px-4 py-1 rounded">Search</button>
            </div>
            <div className="bg-white p-4 rounded shadow mb-6">
                <h3 className="text-lg font-semibold mb-2">Add Fine Payment</h3>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setFormSubmit(true)
                        const fineGiven = parseFloat(e.target.fine.value);
                        const date = e.target.date.value;
                        if (!fineGiven || !date) return alert("Please enter both fields.");

                        const response = await fetch('https://shobhasilver.onrender.com/api/addfinepayment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: selectedRetailerName,
                                date,
                                fineGiven
                            })
                        });

                        const result = await response.json();
                        alert(result.message || 'Fine payment recorded.');
                        setFormSubmit(false)

                        // refresh data
                        fetchBills();
                        e.target.reset();
                    }}
                >
                    <div className="mb-2">
                        <label className="block">Date:</label>
                        <input type="date" name="date" className="border p-1 w-full" required />
                    </div>
                    <div className="mb-2">
                        <label className="block">Fine Given (gms):</label>
                        <input type="number" name="fine" step="0.01" className="border p-1 w-full" required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={formsubmit}>Submit Fine Payment</button>
                </form>
            </div>
            {fineGivenList && fineGivenList.length > 0 && (
                <div className="fine-payments mt-6">
                    <h3 className="text-lg font-semibold mb-2">Fine Payments</h3>
                    <table className="min-w-full table-auto border-collapse border border-gray-300">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Fine Given (gms)</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Adjusted Bills</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fineGivenList.map((payment, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                    <td className="border border-gray-300 px-4 py-2">{payment.date}</td>
                                    <td className="border border-gray-300 px-4 py-2">{payment.fineGiven}</td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        {payment.adjustments && payment.adjustments.length > 0 ? (
                                            <ul className="list-disc ml-4">
                                                {payment.adjustments.map((adjustment, idx) => (
                                                    <li key={idx}>
                                                        Bill ID: <strong>{adjustment.billId}</strong> — Adjusted: <strong>{adjustment.adjusted} gms</strong>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <em>No Adjustments</em>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}


            {bills.length > 0 && (
                <div className="mb-6">
                    <div className="p-4 bg-gray-100 rounded mb-4">
                        <strong>Total Remaining (Fine):</strong> {totalRemaining}g
                    </div>


                    {bills.map((bill) => (
                        <div className='border mb-3 pb-2' key={bill.billId}>
                            <div className="mb-6 border p-4 rounded shadow-sm bg-white" id={`print-section-${bill.billId}`}>
                                <PrintableBill
                                    selectedRetailer={selectedRetailerData}
                                    billId={bill.billId}
                                    date={bill.date}
                                    rate={bill.rate}
                                    items={bill.items}
                                    totals={bill.totals}
                                    kachi={bill.kachi}
                                    totalFineCredit={bill.totalFineCredit}
                                    totalAmount={bill.totalAmount}
                                    received={bill.received}
                                    remaining={bill.remaining}
                                />
                                <p>Reprint</p>
                            </div>
                            <button onClick={() => handlePrint(bill.billId)} className="btn btn-success mt-4">
                                Print Bill
                            </button>
                            <button
                                className="bg-red-500 text-white px-3 py-1 rounded"
                                onClick={() => handleDeleteBill(bill.billId)}
                            >
                                Delete
                            </button>
                            {bill.profitSilver}g{bill.profitRupees}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RetailerBillsPage;
