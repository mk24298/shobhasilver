import { useState } from "react";

export default function CreateRetailerForm() {
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/create-retailer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Retailer created: ${data.retailer.name} (ID: ${data.retailer.retailerId})`);
        setForm({ name: "", phone: "" });
      } else {
        setMessage(`❌ Error: ${data.message}`);
      }
    } catch (err) {
      setMessage("❌ Network error");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded shadow-md mt-4">
      <h2 className="text-xl font-bold mb-4">Create New Retailer</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          name="name"
          placeholder="Retailer Name"
          value={form.name}
          onChange={handleChange}
          className="p-2 border rounded"
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className="p-2 border rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className={`p-2 text-white rounded ${loading ? "bg-gray-500" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {loading ? "Creating..." : "Create Retailer"}
        </button>
      </form>

      {message && (
        <p className="mt-3 text-sm font-medium text-center">
          {message}
        </p>
      )}
    </div>
  );
}
