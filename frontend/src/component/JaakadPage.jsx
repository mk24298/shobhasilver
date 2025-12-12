// JaakadPageV2.jsx (patched)
// Replace your existing file with this one.
// NOTE: change API_BASE if needed.

import React, { useEffect, useState } from "react";

const API_BASE = "https://shobhasilverst.onrender.com"; // change if needed

const emptyLine = () => ({ stockId: "", itemName: "", gross: "", pcs: "" });

function formatFixed(n) {
  return Number(n || 0).toFixed(2);
}

function SearchableSelect({ items, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  useEffect(() => {
    setQ("");
  }, [items]);
  const filtered = items.filter(i => i.itemName.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ position: "relative" }}>
      <input
        placeholder={placeholder}
        value={q || (value?.itemName || "")}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="border p-1 w-full"
      />
      {open && (
        <div style={{ position: "absolute", zIndex: 50, background: "white", border: "1px solid #ddd", width: "100%", maxHeight: 220, overflowY: "auto" }}>
          {filtered.map(i => (
            <div
              key={i._id}
              style={{ padding: 8, borderBottom: "1px solid #f3f3f3", cursor: "pointer" }}
              onMouseDown={() => {
                onChange(i);
                setQ("");
                setOpen(false);
              }}
            >
              <div style={{ fontWeight: 600 }}>{i.itemName}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{i._id}</div>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: 8, color: "#666" }}>No matches</div>}
        </div>
      )}
    </div>
  );
}

export default function JaakadPageV2() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [retailers, setRetailers] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [retailerId, setRetailerId] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [line, setLine] = useState(emptyLine());
  const [lines, setLines] = useState([]);
  const [jaakads, setJaakads] = useState([]);
  const [loading, setLoading] = useState(false);

  // return modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [activeJaakad, setActiveJaakad] = useState(null);
  const [returnInputs, setReturnInputs] = useState([]); // per initial item
  const [busy, setBusy] = useState(false);

  // NEW: optional remark for return modal
  const [returnRemark, setReturnRemark] = useState("");

  // NEW: remaining shown in modal right after submitting return
  const [remainingForModal, setRemainingForModal] = useState(null);
  // NEW: a refresh key to tell RemainingBlock to re-fetch if needed
  const [remainingRefreshKey, setRemainingRefreshKey] = useState(0);

  // filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRetailerId, setFilterRetailerId] = useState("all");

  useEffect(() => {
    fetch(API_BASE + "/api/getretailers").then(r => r.json()).then(d => setRetailers(Array.isArray(d) ? d : (d.retailers || d)));
    fetch(API_BASE + "/api/getstocks").then(r => r.json()).then(d => setStocks(Array.isArray(d) ? d : (d.stocks || d || [])));
    loadJaakads();
  }, []);

  const loadJaakads = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE + "/api/jaakad");
      const data = await res.json();
      setJaakads(data.jaakads || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSelectStock = (stock) => {
    setSelectedItem(stock);
    setLine({ stockId: stock._id, itemName: stock.itemName, gross: "", pcs: 1 });
  };

  const addLine = () => {
    if (!retailerId) return alert("Select retailer");
    if (!line.itemName) return alert("Select item");
    if (!line.gross || Number(line.gross) <= 0) return alert("Enter gross weight");
    if (!line.pcs || Number(line.pcs) <= 0) return alert("Enter pcs");
    setLines(prev => [...prev, { ...line }]);
    setLine(emptyLine());
    setSelectedItem(null);
  };

  const removeLine = (idx) => {
    setLines(prev => prev.filter((_, i) => i !== idx));
  };

  const submitJaakad = async () => {
    if (!retailerId) return alert("Select retailer");
    if (!lines.length) return alert("Add items");
    setBusy(true);
    try {
      const r = retailers.find(x => Number(x.retailerId) === Number(retailerId));
      const payload = {
        retailerId: Number(retailerId),
        retailerName: r?.name || "",
        retailerPhone: r?.phone || "",
        date,
        items: lines.map(it => ({ stockId: it.stockId || null, itemName: it.itemName, weight: Number(it.gross), pcs: Number(it.pcs) }))
      };
      const res = await fetch(API_BASE + "/api/jaakad", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      alert("Jaakad created");
      setLines([]);
      loadJaakads();
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.message || "unknown"));
    } finally {
      setBusy(false);
    }
  };

  const sendWhatsApp = (jaakad) => {
    const header = `आदरणीय ${jaakad.retailerName || ""},\nआपने निम्न आइटम हमारी दुकान से लिए हैं (${jaakad.date}):\n`;
    const items = (jaakad.initialItems || []).map(it => `- ${it.itemName} ${formatFixed(it.weight)} g × ${it.pcs} pcs`).join("\n");
    const total = (jaakad.initialItems || []).reduce((s, it) => s + (Number(it.weight) || 0), 0);
    const tail = `\nकृपया संभालकर रखें।\nकुल: ${formatFixed(total)} g\n\nशोभा सिल्वर, नवाबगंज, गोंडा`;
    const msg = header + items + tail;
    if (!jaakad.retailerPhone) return alert("Phone not found");
    window.open(`https://wa.me/91${jaakad.retailerPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // OPEN RETURN: fetch fresh jaakad and prepare return inputs
  const openReturn = async (jaakad) => {
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/jaakad/${jaakad.jaakadId}`);
      const data = await res.json();
      const doc = data.jaakad;
      setActiveJaakad(doc);
      // prepare return inputs per initial item
      const inputs = (doc.initialItems || []).map(it => ({
        stockId: it.stockId,
        itemName: it.itemName,
        origWeight: Number(it.weight || 0),
        origPcs: Number(it.pcs || 0),
        returnWeight: 0,
        returnPcs: 0
      }));
      setReturnInputs(inputs);
      // clear modal remaining cache
      setRemainingForModal(data.remaining || null);
      // reset remark when opening modal
      setReturnRemark("");
      setShowReturnModal(true);
    } catch (err) {
      console.error(err);
      alert("Error loading jaakad");
    } finally {
      setBusy(false);
    }
  };

  const updateReturnInput = (idx, field, val) => {
    const copy = [...returnInputs];
    copy[idx][field] = val;
    setReturnInputs(copy);
  };

  // SUBMIT RETURN:
  // - include optional remark in body
  // - use returned 'data.remaining' from server response to update modal immediately
  const submitReturn = async () => {
    if (!activeJaakad) return;
    const returned = returnInputs
      .map(r => ({ stockId: r.stockId, itemName: r.itemName, weight: Number(r.returnWeight || 0), pcs: Number(r.returnPcs || 0) }))
      .filter(x => x.weight > 0 || x.pcs > 0);
    if (returned.length === 0) return alert("Enter returned items");
    for (let i = 0; i < returnInputs.length; i++) {
      const r = returnInputs[i];
      if (Number(r.returnWeight || 0) > Number(r.origWeight || 0)) return alert(`Returned weight for ${r.itemName} exceeds original`);
      if (Number(r.returnPcs || 0) > Number(r.origPcs || 0)) return alert(`Returned pcs for ${r.itemName} exceeds original`);
    }

    setBusy(true);
    try {
      const body = {
        date: new Date().toISOString().slice(0, 10),
        returnedItems: returned,
        remark: returnRemark?.trim() || ""
      };
      const res = await fetch(`${API_BASE}/api/jaakad/${activeJaakad.jaakadId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Return failed");

      // data.jaakad is updated jaakad doc; data.remaining is computed remaining
      alert("Return recorded");

      // update modal state using server data (no stale reads)
      setActiveJaakad(data.jaakad || activeJaakad);
      setRemainingForModal(data.remaining || null);

      // increment refresh key so RemainingBlock can refetch if needed
      setRemainingRefreshKey(k => k + 1);

      // reload list on background
      loadJaakads();
      // reset return inputs so user can re-enter if needed
      const freshInputs = (data.jaakad?.initialItems || []).map(it => ({
        stockId: it.stockId,
        itemName: it.itemName,
        origWeight: Number(it.weight || 0),
        origPcs: Number(it.pcs || 0),
        returnWeight: 0,
        returnPcs: 0
      }));
      setReturnInputs(freshInputs);

      // clear remark input
      setReturnRemark("");

    } catch (err) {
      console.error(err);
      alert("Error: " + (err.message || "unknown"));
    } finally {
      setBusy(false);
    }
  };

  const makeBillFromRemaining = async () => {
    if (!activeJaakad) return;
    setBusy(true);
    try {
      // fetch remaining via API (ensures we have latest)
      const resJ = await fetch(`${API_BASE}/api/jaakad/${activeJaakad.jaakadId}`);
      const d = await resJ.json();
      const remaining = d.remaining || [];
      if (!remaining.length) {
        await fetch(`${API_BASE}/api/jaakad/${activeJaakad.jaakadId}/close`, { method: "POST" });
        alert("No remaining items — jaakad closed");
        setShowReturnModal(false);
        setActiveJaakad(null);
        loadJaakads();
        return;
      }
      const res = await fetch(`${API_BASE}/api/jaakad/${activeJaakad.jaakadId}/makebill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: new Date().toISOString().slice(0, 10), items: remaining })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Make bill failed");
      alert("Remaining items marked as billed and jaakad closed");
      setShowReturnModal(false);
      setActiveJaakad(null);
      loadJaakads();
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.message || "unknown"));
    } finally {
      setBusy(false);
    }
  };

  const carryForwardRemaining = async () => {
    if (!activeJaakad) return;
    setBusy(true);
    try {
      const resJ = await fetch(`${API_BASE}/api/jaakad/${activeJaakad.jaakadId}`);
      const d = await resJ.json();
      const remaining = d.remaining || [];
      if (!remaining.length) return alert("No remaining items to carry forward");
      const res = await fetch(`${API_BASE}/api/jaakad/${activeJaakad.jaakadId}/carryforward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: new Date().toISOString().slice(0, 10), items: remaining })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Carry forward failed");
      alert("Remaining items forwarded to a new jaakad. Original jaakad closed.");
      setShowReturnModal(false);
      setActiveJaakad(null);
      loadJaakads();
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.message || "unknown"));
    } finally {
      setBusy(false);
    }
  };

  const statusColor = (s) => {
    if (s === "open") return { background: "#42f54eff", color: "#000" };
    if (s === "partially_returned") return { background: "#f39c12", color: "#fff" };
    if (s === "closed") return { background: "#cc2e2eff", color: "#fff" };
    if (s === "carryforward") return { background: "#3498db", color: "#fff" };
    return { background: "#95a5a6", color: "#fff" };
  };

  const filteredJaakads = jaakads.filter(j => {
    // status filter
    if (filterStatus && filterStatus !== "all" && (j.status || "").toLowerCase() !== filterStatus.toLowerCase()) {
      return false;
    }
    // retailer filter
    if (filterRetailerId && filterRetailerId !== "all" && String(j.retailerId) !== String(filterRetailerId)) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">Jaakad - Credit Management (V2)</h2>

      {/* Create jaakad */}
      <div className="p-3 border rounded mb-4">
        <div className="flex gap-3 items-end">
          <div>
            <label className="block text-sm">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border p-1" />
          </div>

          <div>
            <label className="block text-sm">Retailer</label>
            <select value={retailerId} onChange={e => setRetailerId(e.target.value)} className="border p-1">
              <option value="">Select retailer</option>
              {retailers.map(r => <option key={r.retailerId} value={r.retailerId}>{r.name} ({r.phone})</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-3">
          <div>
            <label className="block text-sm">Search item</label>
            <SearchableSelect items={stocks} value={selectedItem} onChange={onSelectStock} placeholder="Type to search item..." />
          </div>
          <div>
            <label className="block text-sm">Gross (g)</label>
            <input type="number" value={line.gross} onChange={e => setLine({ ...line, gross: e.target.value })} className="border p-1 w-full" />
          </div>
          <div>
            <label className="block text-sm">PCS</label>
            <input type="number" value={line.pcs} onChange={e => setLine({ ...line, pcs: e.target.value })} className="border p-1 w-full" />
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={addLine} className="bg-blue-600 text-white px-3 py-1 rounded">Add</button>
            <button onClick={() => { setLine(emptyLine()); setSelectedItem(null); }} className="border px-3 py-1 rounded">Clear</button>
          </div>
        </div>

        <div className="mt-3">
          <table className="w-full border">
            <thead><tr className="bg-gray-100"><th>#</th><th>Item</th><th>Gross (g)</th><th>PCS</th><th>Action</th></tr></thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td className="p-2 border">{i + 1}</td>
                  <td className="p-2 border">{l.itemName}</td>
                  <td className="p-2 border">{formatFixed(l.gross)}</td>
                  <td className="p-2 border">{l.pcs}</td>
                  <td className="p-2 border"><button onClick={() => removeLine(i)} className="text-red-600">Remove</button></td>
                </tr>
              ))}
              {lines.length === 0 && <tr><td colSpan={5} className="p-2 text-center text-gray-500">No items</td></tr>}
            </tbody>
          </table>

          <div className="mt-2">
            <strong>Total Gross:</strong> {formatFixed(lines.reduce((s, l) => s + (Number(l.gross) || 0), 0))} g
          </div>

          <div className="mt-3 flex gap-2">
            <button onClick={submitJaakad} className="bg-green-600 text-white px-3 py-1 rounded" disabled={busy}>Submit Jaakad</button>
            <button onClick={() => {
              if (!retailerId) return alert("Select retailer");
              if (!lines.length) return alert("Add items");
              const r = retailers.find(x => Number(x.retailerId) === Number(retailerId));
              const msgHead = `आदरणीय ${r?.name || ""},\nआपने निम्न आइटम हमारी दुकान से लिए हैं (${date}):\n`;
              const items = lines.map(it => `- ${it.itemName} ${formatFixed(it.gross)} g × ${it.pcs} pcs`).join("\n");
              const total = lines.reduce((s, it) => s + (Number(it.gross) || 0), 0);
              const tail = `\nकृपया संभालें।\nकुल: ${formatFixed(total)} g\n\nशोभा सिल्वर, नवाबगंज`;
              window.open(`https://wa.me/91${r?.phone}?text=${encodeURIComponent(msgHead + items + tail)}`, "_blank");
            }} className="bg-sky-600 text-white px-3 py-1 rounded">Send on WhatsApp</button>
          </div>
        </div>
      </div>

      {/* Jaakad cards with filters */}
      <div>
        <h3 className="text-lg font-semibold mb-2">All Jaakads</h3>

        {/* FILTERS */}
        <div className="flex gap-3 mb-4 items-center">
          <div>
            <label className="block text-sm">Filter by Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border p-1">
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="partially_returned">Partially Returned</option>
              <option value="closed">Closed</option>
              <option value="carryforward">Carryforward</option>
            </select>
          </div>

          <div>
            <label className="block text-sm">Filter by Retailer</label>
            <select value={filterRetailerId} onChange={(e) => setFilterRetailerId(e.target.value)} className="border p-1">
              <option value="all">All retailers</option>
              {retailers.map(r => (
                <option key={r.retailerId} value={r.retailerId}>
                  {r.name} ({r.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => { setFilterStatus("all"); setFilterRetailerId("all"); }}
              className="border px-3 py-1 rounded"
            >
              Clear filters
            </button>
          </div>
        </div>

        {loading ? <div>Loading...</div> : null}

        <div className="grid gap-3">
          {filteredJaakads.length === 0 && !loading && (
            <div className="text-gray-600 p-2">No jaakads match the selected filter(s).</div>
          )}

          {filteredJaakads.map(j => (
            <div key={j.jaakadId} className="p-3 border rounded">
              <div className="flex justify-between items-start">
                <div>
                  <strong>{j.retailerName}</strong> <div className="text-sm text-gray-600">date: {j.date}</div>
                </div>
                <div style={{ padding: "4px 8px", borderRadius: 6, ...statusColor(j.status) }}>
                  {j.status?.toUpperCase()}
                </div>
              </div>

              {/* Remarks display (if any) */}
              {(j.remarks || []).length > 0 && (
                <div className="mt-2">
                  <strong>Remarks:</strong>
                  <ul className="text-sm">
                    {j.remarks.map((rm, idx) => (
                      <li key={idx} className="text-gray-700">
                        <span className="text-xs text-gray-500 mr-2">[{rm.date || rm._id || idx}]</span>
                        {rm.text || rm}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-2">
                <strong>Initial Items:</strong>
                <ul>{(j.initialItems || []).map((it, idx) => (<li key={idx}>{it.itemName} — {formatFixed(it.weight)} g × {it.pcs} pcs</li>))}</ul>
              </div>

              <div className="mt-2">
                <strong>Returned:</strong>
                {(j.returns || []).length === 0 ? <div className="text-sm text-gray-500">No returns</div> :
                  <ul>{j.returns.map(r => (
                    <li key={r.returnId} className="text-sm">{r.date} — {r.items.map(it => `${it.itemName} ${formatFixed(it.weight)}g × ${it.pcs}pcs`).join(", ")}</li>
                  ))}</ul>
                }
              </div>

              <div className="mt-2">
                <strong>Billed (sold):</strong>
                {(j.billed || []).length === 0 ? <div className="text-sm text-gray-500">None</div> :
                  <ul>{j.billed.map(b => (
                    <li key={b.billId} className="text-sm">{b.date} — {b.items.map(it => `${it.itemName} ${formatFixed(it.weight)}g × ${it.pcs}pcs`).join(", ")}</li>
                  ))}</ul>
                }
              </div>

              <div className="mt-2">
                <strong>Carryforwards:</strong>
                {(j.carryforwards || []).length === 0 ? <div className="text-sm text-gray-500">None</div> :
                  <ul>{j.carryforwards.map(c => (
                    <li key={c.cfId} className="text-sm">{c.date} — {c.items.map(it => `${it.itemName} ${formatFixed(it.weight)}g × ${it.pcs}pcs`).join(", ")}</li>
                  ))}</ul>
                }
              </div>

              <div className="mt-3 flex gap-2">
                <button onClick={() => sendWhatsApp(j)} className="bg-sky-500 text-white px-3 py-1 rounded">Send on WhatsApp</button>
                <button onClick={() => openReturn(j)} className="bg-orange-500 text-white px-3 py-1 rounded">Return</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Return modal */}
      {showReturnModal && activeJaakad && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ width: 900, background: "#fff", padding: 20, borderRadius: 8, maxHeight: "90vh", overflowY: "auto" }}>
            <h3>Return — Jaakad {activeJaakad.jaakadId} — {activeJaakad.retailerName}</h3>

            <p className="text-sm text-gray-600">Enter returned qty for items (leave zero if not returned)</p>

            <table className="w-full border mb-3">
              <thead><tr className="bg-gray-100"><th>Item</th><th>Orig Weight</th><th>Orig PCS</th><th>Return Weight</th><th>Return PCS</th></tr></thead>
              <tbody>
                {returnInputs.map((r, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border">{r.itemName}</td>
                    <td className="p-2 border">{formatFixed(r.origWeight)}</td>
                    <td className="p-2 border">{r.origPcs}</td>
                    <td className="p-2 border"><input className="border p-1 w-full" type="number" value={r.returnWeight} onChange={e => updateReturnInput(idx, 'returnWeight', e.target.value)} /></td>
                    <td className="p-2 border"><input className="border p-1 w-full" type="number" value={r.returnPcs} onChange={e => updateReturnInput(idx, 'returnPcs', e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Remark input */}
            <div className="mt-3 mb-3">
              <label className="block text-sm font-medium">Remark (optional)</label>
              <input
                type="text"
                value={returnRemark}
                onChange={(e) => setReturnRemark(e.target.value)}
                placeholder="Enter short note about this return (optional)"
                className="border p-2 w-full"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={submitReturn} className="bg-green-600 text-white px-3 py-1 rounded" disabled={busy}>Submit Return</button>
              <button onClick={() => { setShowReturnModal(false); setActiveJaakad(null); setRemainingForModal(null); setReturnRemark(""); }} className="border px-3 py-1 rounded">Close</button>
            </div>

            {/* After submission show remaining: use remainingForModal (if present) otherwise RemainingBlock will fetch fresh */}
            <div className="mt-4">
              <h4>Remaining Items (computed)</h4>
              <RemainingBlock jaakadId={activeJaakad.jaakadId} initialRemaining={remainingForModal} refreshKey={remainingRefreshKey} />
              <div className="mt-3 flex gap-2">
                <button onClick={makeBillFromRemaining} className="bg-blue-600 text-white px-3 py-1 rounded" disabled={busy}>Make Bill (mark remaining as billed & close)</button>
                <button onClick={carryForwardRemaining} className="bg-indigo-600 text-white px-3 py-1 rounded" disabled={busy}>Carry Forward (create new jaakad & close)</button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

/* RemainingBlock: helper component to fetch remaining and list them
   - if initialRemaining provided, show it immediately
   - also re-fetch when refreshKey increments
*/
function RemainingBlock({ jaakadId, initialRemaining = null, refreshKey = 0 }) {
  const [remaining, setRemaining] = useState(initialRemaining === null ? null : initialRemaining);

  useEffect(() => {
    let alive = true;
    // If initialRemaining provided, show it immediately but still fetch to sync
    if (initialRemaining !== null) {
      setRemaining(initialRemaining);
    }

    // Fetch from server to get authoritative value (also runs when refreshKey changes)
    fetch(`${API_BASE}/api/jaakad/${jaakadId}`)
      .then(r => r.json())
      .then(d => {
        if (!alive) return;
        setRemaining(d.remaining || []);
      })
      .catch(e => {
        console.error(e);
        setRemaining([]);
      });

    return () => { alive = false; };
  }, [jaakadId, refreshKey, initialRemaining]);

  if (remaining === null) return <div>Loading remaining...</div>;
  if (!remaining.length) return <div className="text-sm text-gray-600">No remaining items</div>;
  return <ul>{remaining.map((it, i) => (<li key={i}>{it.itemName} — {formatFixed(it.weight)} g × {it.pcs} pcs</li>))}</ul>;
}
