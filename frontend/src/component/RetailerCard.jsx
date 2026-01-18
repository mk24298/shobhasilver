function daysAgo(date) {
    if (!date) return "Never";
    return Math.floor((Date.now() - new Date(date)) / 86400000) + " days ago";
  }
  
  export default function RetailerCard({ r, routeId, onCallLogged }) {
    const badge = {
      HIGH: "bg-green-500",
      MEDIUM: "bg-yellow-500",
      LOW: "bg-gray-400",
      NO_CALL: "bg-black"
    }[r.priority];
  
    const call = async () => {
        const note = prompt("Call remark (required):");
      
        if (note === null) return; // cancel
        if (!note.trim()) {
          alert("Call remark is required");
          return;
        }
      
        const res = await fetch("https://shobhasilverst.onrender.com/api/routes/log-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            routeId,
            retailerId: r.retailerId,
            outcome: "call",
            note: note.trim()
          })
        });
      
        const data = await res.json();
      
        if (!res.ok || !data.call) {
          alert(data.message || "Call logging failed");
          return;
        }
      
        // ✅ SAFE update
        onCallLogged(r.retailerId, data.call);
      };
      
  
    const removeFromRoute = async () => {
      if (!window.confirm("Remove retailer from this route?")) return;
  
      await fetch(
        `https://shobhasilverst.onrender.com/api/routes/${routeId}/remove-retailer/${r.retailerId}`,
        { method: "POST" }
      );
  
      window.location.reload();
    };
  
    return (
      <div className="border p-3 rounded m-1">
        <div className="flex justify-between">
          <strong>{r.retailerName}</strong>
          <span className={`text-white px-2 py-1 rounded ${badge}`}>
            {r.priority}
          </span>
        </div>
  
        <div className="text-sm mt-1">
          Last Buy: {daysAgo(r.lastBuyDate)} <br />
          Avg Cycle: ~{r.avgBuyGapDays || "-"} days <br />
          Last Call: {daysAgo(r.lastCallDate)}
        </div>
  
        {r.lastCallNote && (
          <div className="mt-1 text-xs text-gray-600">
            📝 <strong>Last Remark:</strong> {r.lastCallNote}
          </div>
        )}
  
        <div className="mt-2 flex gap-2">
          <button
            onClick={call}
            className="btn btn-success mx-2"
          >
            📞 Call
          </button>
  
          <button
            onClick={removeFromRoute}
            className="btn btn-danger mx-2"
          >
            ❌ Remove
          </button>
  
         
        </div>
      </div>
    );
  }
  