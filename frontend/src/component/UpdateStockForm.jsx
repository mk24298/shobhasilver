import { useEffect, useState } from "react";

export default function UpdateStockForm() {
  const [stocks, setStocks] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState({
    itemName: "", actualTunch: "", tunch: "", sellTunch: "",
    grossWeight: "", netWeight: "", pcs: "", poly: "",
    rate: "", labour: "", date: "", vendor: ""
  });

  useEffect(() => {
    fetch("https://shobhasilverst.onrender.com/api/getstocks")
      .then(res => res.json())
      .then(data => setStocks(data));
  }, []);

  const handleItemChange = (e) => {
    const selected = stocks.find(item => item.itemName === e.target.value);
    setSelectedItem(selected);

    if (selected) {
      setForm({
        ...selected,
        grossWeight: "",
        pcs: "",
        poly: selected.poly || "", // allow reusing existing poly if user wants
        netWeight: ""
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };

    const gross = parseFloat(updatedForm.grossWeight) || 0;
    const poly = parseFloat(updatedForm.poly) || 0;
    const pcs = parseFloat(updatedForm.pcs) || 0;

    if (!isNaN(gross) && !isNaN(poly) && !isNaN(pcs)) {
      updatedForm.netWeight = (gross - (poly * pcs)).toFixed(3);
    } else {
      updatedForm.netWeight = "";
    }

    setForm(updatedForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = {
      itemName: form.itemName,
      grossWeight: form.grossWeight,
      netWeight: form.netWeight,
      pcs: form.pcs
    };

    const res = await fetch("https://shobhasilverst.onrender.com/api/updatestock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const result = await res.text();
    alert(result);

    if (res.ok) {
      setForm({
        itemName: "", actualTunch: "", tunch: "", sellTunch: "",
        grossWeight: "", netWeight: "", pcs: "", poly: "",
        rate: "", labour: "", date: "", vendor: ""
      });
      setSelectedItem(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2 p-4 border shadow rounded">
      <select value={form.itemName} onChange={handleItemChange} className="col-span-2 p-2 border rounded" required>
        <option value="">Select item</option>
        {stocks.map(item => (
          <option key={item._id} value={item.itemName}>{item.itemName}</option>
        ))}
      </select>

      <input name="actualTunch" value={form.actualTunch} readOnly className="p-2 border rounded bg-gray-100" placeholder="Actual Tunch" />
      <input name="tunch" value={form.tunch} readOnly className="p-2 border rounded bg-gray-100" placeholder="Tunch" />
      <input name="sellTunch" value={form.sellTunch} readOnly className="p-2 border rounded bg-gray-100" placeholder="Sell Tunch" />
      <input name="rate" value={form.rate} readOnly className="p-2 border rounded bg-gray-100" placeholder="Rate" />
      <input name="labour" value={form.labour} readOnly className="p-2 border rounded bg-gray-100" placeholder="Labour" />
      <input name="vendor" value={form.vendor} readOnly className="p-2 border rounded bg-gray-100" placeholder="Vendor" />
      <input name="date" value={form.date} readOnly className="p-2 border rounded bg-gray-100" placeholder="Date" />

      <input name="grossWeight" placeholder="Gross Weight" value={form.grossWeight} onChange={handleChange} className="p-2 border rounded" required />
      <input name="pcs" placeholder="Pieces" value={form.pcs} onChange={handleChange} className="p-2 border rounded" required />
      <input name="poly" placeholder="Poly (optional)" value={form.poly} onChange={handleChange} className="p-2 border rounded" />

      <input name="netWeight" value={form.netWeight} readOnly placeholder="Net Weight (auto)" className="p-2 border rounded bg-gray-100" />

      <button type="submit" className="col-span-2 bg-blue-600 text-white p-2 rounded">Update Stock</button>
    </form>
  );
}
