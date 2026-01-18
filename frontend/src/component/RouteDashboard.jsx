import React, { useEffect, useState } from "react";
import RetailerCard from "./RetailerCard";

const API = "https://shobhasilverst.onrender.com/api";

export default function RouteDashboard() {
  const [routes, setRoutes] = useState([]);
  const [routeId, setRouteId] = useState("");
  const [retailers, setRetailers] = useState([]);

  const [unassignedRetailers, setUnassignedRetailers] = useState([]);
  const [selectedRetailers, setSelectedRetailers] = useState([]);
  const [newRouteName, setNewRouteName] = useState("");
  const handleCallLogged = (retailerId, call) => {
    if (!call || !call.date) return;
  
    setRetailers(prev =>
      prev.map(r =>
        r.retailerId === retailerId
          ? {
              ...r,
              lastCallDate: call.date,
              lastCallNote: call.note,
              lastCallOutcome: call.outcome
            }
          : r
      )
    );
  };
  
  
  /* LOAD ROUTES */
  const loadRoutes = () => {
    fetch(API + "/routes")
      .then(r => r.json())
      .then(setRoutes);
  };

  /* LOAD INITIAL DATA */
  useEffect(() => {
    loadRoutes();

    fetch(API + "/routes/unassigned-retailers")
      .then(r => r.json())
      .then(setUnassignedRetailers);
  }, []);

  /* LOAD ROUTE DASHBOARD */
  useEffect(() => {
    if (!routeId) return;
    fetch(`${API}/routes/${routeId}/dashboard`)
      .then(r => r.json())
      .then(setRetailers);
  }, [routeId]);

  /* CREATE ROUTE */
  const createRoute = async () => {
    if (!newRouteName.trim()) return alert("Enter route name");

    await fetch(API + "/routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routeName: newRouteName })
    });

    setNewRouteName("");
    alert("Route created");
    loadRoutes();
  };

  /* ADD RETAILERS TO ROUTE */
  const addRetailersToRoute = async () => {
    if (!routeId) return alert("Select route first");
    if (selectedRetailers.length === 0) return alert("Select retailers");

    await fetch(`${API}/routes/${routeId}/add-retailers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        retailerIds: selectedRetailers.map(r => r.retailerId)
      })
    });

    alert("Retailers added to route");
    setSelectedRetailers([]);

    // refresh dashboard
    fetch(`${API}/routes/${routeId}/dashboard`)
      .then(r => r.json())
      .then(setRetailers);

    // refresh unassigned list
    fetch(API + "/routes/unassigned-retailers")
      .then(r => r.json())
      .then(setUnassignedRetailers);
  };
  const [showUnassigned, setShowUnassigned] = useState(false);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📍 Route Sales Dashboard</h2>

      {/* UNASSIGNED INFO */}
   {/* UNASSIGNED INFO */}
<div className="mb-4 p-3 border bg-yellow-50 rounded">
  <div className="flex justify-between items-center">
    <strong>
      ⚠️ Unassigned Retailers: {unassignedRetailers.length}
    </strong>

    {unassignedRetailers.length > 0 && (
      <button
        onClick={() => setShowUnassigned(!showUnassigned)}
        className="text-sm text-blue-600 underline"
      >
        {showUnassigned ? "Hide list" : "View list"}
      </button>
    )}
  </div>

  <div className="text-sm text-gray-600 mt-1">
    These retailers are not part of any route and may be ignored accidentally.
  </div>

  {showUnassigned && unassignedRetailers.length > 0 && (
    <ul className="mt-2 text-sm list-disc list-inside">
      {unassignedRetailers.map(r => (
        <li key={r.retailerId}>
          <strong>{r.name}</strong> ({r.phone})
        </li>
      ))}
    </ul>
  )}
</div>


      {/* CREATE ROUTE */}
      <div className="border p-3 mb-4 rounded">
        <h3 className="font-semibold mb-2">➕ Create New Route</h3>
        <div className="flex gap-2">
          <input
            value={newRouteName}
            onChange={e => setNewRouteName(e.target.value)}
            placeholder="Route name (e.g. Gonda East)"
            className="border p-2 flex-1"
          />
          <button
            onClick={createRoute}
            className="bg-green-600 text-white px-4 rounded"
          >
            Add Route
          </button>
        </div>
      </div>

      {/* SELECT ROUTE */}
      <div className="mb-4">
        <label className="block text-sm mb-1">Select Route</label>
        <select
          className="border p-2 w-full"
          value={routeId}
          onChange={e => setRouteId(e.target.value)}
        >
          <option value="">-- Select Route --</option>
          {routes.map(r => (
            <option key={r.routeId} value={r.routeId}>
              {r.routeName}
            </option>
          ))}
        </select>
      </div>

      {/* ADD RETAILERS TO ROUTE */}
      {routeId && (
        <div className="border p-3 mb-4 rounded">
          <h3 className="font-semibold mb-2">👥 Add Retailers to Route</h3>

          <select
            multiple
            className="border p-2 w-full h-40"
            value={selectedRetailers.map(r => String(r.retailerId))}
            onChange={(e) => {
              const ids = Array.from(e.target.selectedOptions).map(o => Number(o.value));
              const selected = unassignedRetailers.filter(r =>
                ids.includes(Number(r.retailerId))
              );
              setSelectedRetailers(selected);
            }}
          >
            {unassignedRetailers.map(r => (
              <option key={r.retailerId} value={r.retailerId}>
                {r.name} ({r.phone})
              </option>
            ))}
          </select>

          <button
            onClick={addRetailersToRoute}
            className="btn btn-info"
          >
            Add Selected Retailers
          </button>
        </div>
      )}

      {/* ROUTE DASHBOARD */}
      <div className="grid gap-3">
        {retailers.length === 0 && routeId && (
          <div className="text-gray-500 text-sm">
            No retailers assigned to this route yet.
          </div>
        )}
        <h3>Retailers List</h3>
<div className="d-flex flex-row">
{retailers.map(r => (
          <RetailerCard
          key={r.retailerId}
          r={r}
          routeId={routeId}
          onCallLogged={handleCallLogged}
        />
        ))}
</div>
     
      </div>
    </div>
  );
}
