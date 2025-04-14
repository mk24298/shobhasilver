import React from "react";

const PrintableBill = ({
  selectedRetailer,
  billId,
  date,
  rate,
  items,
  totals,
  kachi,
  totalFineCredit,
  totalAmount,
  received,
  remaining,
}) => {
  return (
    <div className="p-6  text-black bg-white" style={{position:"relative"}}>
      {/* Header */}
      <style>
{`
  @media print {
    /* Display and Flex */
    .d-flex { display: flex !important; }
    .d-block { display: block !important; }
    .d-inline { display: inline !important; }
    .d-inline-block { display: inline-block !important; }
    .flex-column { flex-direction: column !important; }
    .flex-row { flex-direction: row !important; }

    /* Justify Content */
    .justify-content-between { justify-content: space-between !important; }
    .justify-content-start { justify-content: flex-start !important; }
    .justify-content-end { justify-content: flex-end !important; }
    .justify-content-center { justify-content: center !important; }

    /* Align Items */
    .align-items-center { align-items: center !important; }
    .align-items-start { align-items: flex-start !important; }
    .align-items-end { align-items: flex-end !important; }

    /* Text */
    .text-center { text-align: center !important; }
    .text-muted { color: #6c757d !important; }
    .text-end { text-align: right !important; }

    /* Background */
    .bg-light { background-color: #f8f9fa !important; }
    .bg-gray-200 { background-color: #e9ecef !important; }

    /* Borders and Spacing */
    .border { border: 1px solid #dee2e6 !important; }
    .border-t { border-top: 1px solid #dee2e6 !important; }
    .border-b { border-bottom: 1px solid #dee2e6 !important; }

    /* Padding */
    .p-2 { padding: 0.5rem !important; }
    .p-6 { padding: 1.5rem !important; }
    .pt-4 { padding-top: 1rem !important; }
    .pb-2 { padding-bottom: 0.5rem !important; }

    /* Margin */
    .m-0 { margin: 0 !important; }
    .mx-2 { margin-left: 0.5rem !important; margin-right: 0.5rem !important; }
    .mx-3 { margin-left: 1rem !important; margin-right: 1rem !important; }
    .mb-3 { margin-bottom: 1rem !important; }
    .mb-4 { margin-bottom: 1.5rem !important; }
    .mt-3 { margin-top: 1rem !important; }
    .mt-4 { margin-top: 1.5rem !important; }
    .mt-5 { margin-top: 3rem !important; }

    /* Width */
    .w-25 { width: 25% !important; }
    .w-100 { width: 100% !important; }

    /* Table */
    .border-collapse { border-collapse: collapse !important; }
    table, th, td { border: 1px solid #dee2e6 !important; }

    /* Font */
    strong { font-weight: bold !important; }
    h1, h6, p { margin: 0 !important; padding: 0 !important; }
  }
`}
</style>


      <div className="mb-4 text-center border-b pb-2">
        <h1 className="text-center m-0" style={{color:"orange"}}>Shobha Silvers</h1>
        <p className="text-muted m-0">Shobha Complex, Near Purani Sabji Mandi Nawabganj Gonda</p>
      </div>
<h6 style={{position:"absolute",top:"10px",right:"35px"}}>Bill No. : {billId}</h6>
<h6 style={{position:"absolute",top:"10px",left:"15px"}}>Mob No. : <span className="d-flex flex-column"><span>8090565000</span><span>7505866498</span></span></h6>

      {/* Retailer Details */}
      <div className="d-flex flex-row justify-content-center w-100 mb-3">
        <div className="d-flex flex-column  justify-content-center align-item-center" style={{width:"max-content"}}>
        <div className="d-flex justify-content-start " style={{width:"max-content"}}><strong className="mx-2">Name:</strong> {selectedRetailer?.name || "-"}</div>
        <div className="d-flex justify-content-start " style={{width:"max-content"}}><strong className="mx-2">Phone:</strong> {selectedRetailer?.phone || "-"}</div>
        </div>
        <div className="d-flex flex-column flex-row mx-3 " style={{width:"max-content"}}>
        <div className="d-flex justify-content-start " style={{width:"max-content"}}><strong className="mx-2">Rate:</strong> ₹{rate}</div>
        <div className="d-flex justify-content-start" style={{width:"max-content"}}><strong className="mx-2">Date:</strong> {new Date(date).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6 w-100">
        <table className="w-100 border border-collapse">
          <thead>
            <tr className="bg-gray-200">
            <th className="p-2">Item</th>
              <th className="p-2">G Wt (g)</th>
              <th className="p-2">Net Wt</th>
              <th className="p-2">Poly</th>
              <th className="p-2">Actual Tunch</th>
              <th className="p-2">Sell Tunch</th>
              <th className="p-2">Silver</th>
              <th className="p-2">Pcs</th>
              <th className="p-2">Labour</th>

            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                  <td className="p-2">{item.itemName}</td>
                <td className="p-2">{item.grossWeight}</td>
                <td className="p-2">{item.netWeight}</td>
                <td className="p-2">{item.poly}</td>
                <td className="p-2">{item.actualTunch}</td>
                <td className="p-2">{item.sellTunch}</td>
                <td className="p-2">{item.silver}</td>
                <td className="p-2">{item.pcs}</td>
                <td className="p-2">{item.labour}</td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="totaldiv bg-light d-flex justify-content-between mt-3 mb-3" style={{border:"1px solid black"}}>
        <div style={{border:"1px solid black" ,padding:"20px"}}>Total Gross: {totals.grossWeight.toFixed(2)}g</div>
        <div style={{border:"1px solid black" ,padding:"20px"}}>Total Net: {totals.netWeight.toFixed(2)}g</div>
        <div style={{border:"1px solid black" ,padding:"20px"}}>Total Silver: {totals.totalSilver.toFixed(2)}g</div>
        <div style={{border:"1px solid black" ,padding:"20px"}}>Total Labour: ₹{totals.netLabour}</div>

      </div>

      <div className="totaldiv bg-light d-flex justify-content-between mt-3 mb-3 p-2">
        <div>kachiwt: {kachi.kachiwt}g</div>
        <div>kachi Tounch: {kachi.kachiTunch}g</div>
        <div>Kachi Fine: {kachi.kachiFine}g</div>
      </div>
    
      <div className="valuediv bg-light d-flex justify-content-between mt-3 p-2">
        <div className="border mx-2 p-2">Total Fine Credit: {totalFineCredit.toFixed(2)}g</div>
        <div className="border mx-2 p-2">Total Amount: ₹{totalAmount.toFixed(2)}</div>
        <div className="border mx-2 p-2">Received: ₹{received}</div>
        <div className="border mx-2 p-2">Remaining(Fine): {remaining.toFixed(2)}g</div>

     
      </div>
      {/* Final Amounts */}
      {/* <div className="grid grid-cols-2 gap-2 border-t pt-4 mt-4 text-base font-medium">
        <div><strong>Total Fine (with Credit):</strong></div>
        <div className="text-right">{totalFineCredit}</div>
        <div><strong>Total Amount:</strong></div>
        <div className="text-right">₹{totalAmount}</div>
        <div><strong>Received:</strong></div>
        <div className="text-right">₹{received}</div>
        <div><strong>Remaining:</strong></div>
        <div className="text-right">₹{remaining}</div>
      </div> */}

<div className="d-flex justify-content-end mt-5">
  <div className="d-flex flex-column w-25">
  <hr />
  <p>Dealer</p>
  </div>
</div>
      {/* Optional Footer */}

      <h6 className="mt-4 text-muted text-center">
        Thank you for your business!
      </h6>
    </div>
  );
};

export default PrintableBill;
