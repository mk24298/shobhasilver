import React, { useEffect, useState } from 'react';
import PrintableBill from './PrintableBill';

const RetailerBillsPage = () => {
    const [retailers, setRetailers] = useState([]);
    const [selectedRetailerName, setSelectedRetailerName] = useState('');
    const [selectedRetailerData, setSelectedRetailerData] = useState(null);
    const [bills, setBills] = useState([]);
    const [totalRemaining, setTotalRemaining] = useState(0);

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

        const data = await response.json();

        if (!data.bills || !Array.isArray(data.bills)) {
            console.error("Invalid bills data:", data);
            setBills([]);
            setTotalRemaining(0);
            return;
        }

        const retailer = retailers.find(r => r.name === selectedRetailerName);
        setSelectedRetailerData(retailer);
        setBills(data.bills.reverse());

        const remainingSum = data.bills.reduce((acc, bill) => acc + (parseFloat(bill.remaining) || 0), 0);
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

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Retailer Bills Summary</h2>
            <div className="flex gap-4 mb-4">
                <select className="border px-2 py-1" value={selectedRetailerName} onChange={(e) => setSelectedRetailerName(e.target.value)}>
                    <option value="">Select Retailer</option>
                    {retailers.map((retailer, index) => (
                        <option key={`${retailer.name}-${index}`} value={retailer.name}>{retailer.name}</option>
                    ))}
                </select>
                <button onClick={fetchBills} className="bg-blue-600 text-white px-4 py-1 rounded">Search</button>
            </div>

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
                            {bill.profitSilver}g{bill.profitRupees}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RetailerBillsPage;
