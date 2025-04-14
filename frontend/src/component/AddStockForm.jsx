import { useState } from "react";

export default function AddStockForm() {
  const [form, setForm] = useState({
    itemName: "", actualTunch: "", tunch: "", sellTunch: "",
    grossWeight: "", netWeight: "", pcs: "", poly: "",
    rate: "", labour: "", date: "", vendor: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedForm = { ...form, [name]: value };

    const gross = parseFloat(updatedForm.grossWeight) || 0;
    const poly = parseFloat(updatedForm.poly) || 0;
    const pcs = parseFloat(updatedForm.pcs) || 0;

    updatedForm.netWeight = (gross - (poly * pcs)).toFixed(3);

    setForm(updatedForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/addstock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (res.ok) {
      alert("Stock added!");
      setForm({
        itemName: "", actualTunch: "", tunch: "", sellTunch: "",
        grossWeight: "", netWeight: "", pcs: "", poly: "",
        rate: "", labour: "", date: "", vendor: ""
      });
    } else {
      alert("Error adding stock.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-2 p-4">
      {Object.keys(form).map((key) => (
        <input
          key={key}
          name={key}
          placeholder={key}
          value={form[key]}
          onChange={handleChange}
          className="border p-2 rounded"
          required={key !== "netWeight"} // Don't require netWeight, it's auto
          readOnly={key === "netWeight"} // Make netWeight readonly
        />
      ))}
      <button type="submit" className="col-span-2 bg-green-600 text-white p-2 rounded">Add Stock</button>
    </form>
  );
}
