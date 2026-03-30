import React, { useEffect, useState } from "react";

const Card = ({ title, list }) => (
  <div className="mb-4">
    <h4 className="mb-3">{title} ({list.length})</h4>

    <div className="row">
      {list.map((r, i) => (
        <div className="col-md-4 mb-3" key={i}>
          <div className="card bg-dark text-white border border-light shadow">

            <div className="card-body">

              <h5>{r.name}</h5>

              <p><b>Exposure:</b> {r.exposure} g</p>
              <p><b>Business:</b> {r.totalSilver} g</p>
              <p><b>Last Bill:</b> {r.lastBillDate || "N/A"}</p>
<p><b>Inactive:</b> {r.daysInactive} days</p>
              <div className="alert alert-warning text-dark p-2">
                {r.reason}
              </div>

              <div className="alert alert-info text-dark p-2">
                {r.action}
              </div>

              <div className="d-flex gap-2">
                <a href={`tel:${r.phone}`} className="btn btn-danger btn-sm">Call</a>
                <a href={`https://wa.me/91${r.phone}`} target="_blank" className="btn btn-success btn-sm">Msg</a>
              </div>

            </div>

          </div>
        </div>
      ))}
    </div>
  </div>
);

const RealDashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("https://shobhasilverst.onrender.com/api/real")
      .then(res => res.json())
      .then(setData);
  }, []);

 if (!data || !data.summary) {
  return <p>Loading or No Data...</p>;
}

  return (
    <div className="container mt-4">

      <h2 className="mb-4">📊 Business Dashboard</h2>

      {/* SUMMARY */}
      <div className="card mb-4 shadow">
        <div className="card-body">
          <h4>Total Credit: {data.summary.totalCredit} g</h4>
          <h5>Total Retailers: {data.summary.totalRetailers}</h5>
        </div>
      </div>
<Card title="🚨 INACTIVE (28+ DAYS) — CALL NOW" list={data.actions.inactive} />
      <Card title="🔴 ASK PAYMENT" list={data.actions.askPayment} />
      <Card title="🟡 PUSH SALES" list={data.actions.pushSales} />
      <Card title="🟢 ENCOURAGE" list={data.actions.encourage} />
      <Card title="⚫ KILL" list={data.actions.kill} />

      <Card title="🏆 TOP RETAILERS" list={data.topRetailers} />
      <Card title="💀 WORST RETAILERS" list={data.worstRetailers} />

    </div>
  );
};

export default RealDashboard;