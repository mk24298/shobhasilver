const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const routesCol = () => mongoose.connection.db.collection("routes");
const retailersCol = () => mongoose.connection.db.collection("retailers");
const callsCol = () => mongoose.connection.db.collection("route_calls");


/* CREATE ROUTE */
router.post("/", async (req, res) => {
  try {
    const { routeName } = req.body;
    if (!routeName) return res.status(400).json({ message: "Route name required" });

    const route = {
      routeId: "R" + Date.now(), // STRING
      routeName,
      retailers: [],
      createdAt: new Date(),
      active: true
    };

    await routesCol().insertOne(route);
    res.json({ message: "Route created", route });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Route creation failed" });
  }
});

/* GET ROUTES */
router.get("/", async (req, res) => {
  const routes = await routesCol().find({ active: true }).toArray();
  res.json(routes);
});

/* GET UNASSIGNED RETAILERS (MUST BE ABOVE routeId) */
router.get("/unassigned-retailers", async (req, res) => {
  try {
    const routes = await routesCol().find({ active: true }).toArray();

    const assignedIds = new Set();
    routes.forEach(route => {
      (route.retailers || []).forEach(r => {
        assignedIds.add(Number(r.retailerId));
      });
    });

    const allRetailers = await retailersCol().find({}).toArray();
    const unassigned = allRetailers.filter(
      r => !assignedIds.has(Number(r.retailerId))
    );

    res.json(unassigned);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load unassigned retailers" });
  }
});

/* ADD RETAILERS TO ROUTE */
router.post("/:routeId/add-retailers", async (req, res) => {
  const { retailerIds } = req.body;

  const retailers = await retailersCol()
    .find({ retailerId: { $in: retailerIds } })
    .toArray();

  const mapped = retailers.map(r => ({
    retailerId: r.retailerId,
    name: r.name,
    phone: r.phone,
    callPreference: "regular",
    lastCallDate: null
  }));

  await routesCol().updateOne(
    { routeId: req.params.routeId },
    { $push: { retailers: { $each: mapped } } }
  );

  res.json({ message: "Retailers added to route" });
});

/* ROUTE DASHBOARD */
router.get("/:routeId/dashboard", async (req, res) => {
    try {
      const routeId = req.params.routeId;
  
      const route = await routesCol().findOne({ routeId });
      if (!route) return res.json([]);
  
      const routeRetailers = route.retailers || [];
  
      const retailerDocs = await retailersCol()
        .find({ retailerId: { $in: routeRetailers.map(r => r.retailerId) } })
        .toArray();
  
      const calls = await callsCol().find({}).toArray();
  
      const enriched = routeRetailers.map(r => {
        const doc = retailerDocs.find(d => d.retailerId === r.retailerId);
        const bills = doc?.bills || [];
  
        const sortedBills = [...bills].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
  
        const lastBuyDate = sortedBills[0]?.date || null;
  
        let avgGap = null;
        if (sortedBills.length >= 2) {
          const first = new Date(sortedBills[sortedBills.length - 1].date);
          const last = new Date(sortedBills[0].date);
          avgGap = Math.round(
            (last - first) / (86400000 * (sortedBills.length - 1))
          );
        }
  
        const rCalls = calls
        .filter(c => c.retailerId === r.retailerId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      const lastCall = rCalls[0] || null;
      
        const daysSinceBuy = lastBuyDate
          ? (Date.now() - new Date(lastBuyDate)) / 86400000
          : 999;
  
        let priority = "LOW";
        if (daysSinceBuy > 90) priority = "NO_CALL";
        else if (avgGap && daysSinceBuy >= avgGap) priority = "HIGH";
        else if (avgGap && daysSinceBuy > avgGap * 0.6) priority = "MEDIUM";
  
        return {
            retailerId: r.retailerId,
            retailerName: r.name,
            phone: r.phone,
          
            lastBuyDate,
            avgBuyGapDays: avgGap,
          
            lastCallDate: lastCall?.date || null,
            lastCallNote: lastCall?.note || "",
            lastCallOutcome: lastCall?.outcome || "",
          
            priority
          };
          
      });
  
      res.json(enriched);
    } catch (err) {
      console.error("Route dashboard error:", err);
      res.status(500).json({ message: "Dashboard failed" });
    }
  });
  
  router.post("/:routeId/remove-retailer/:retailerId", async (req, res) => {
    await routesCol().updateOne(
      { routeId: req.params.routeId },
      {
        $pull: {
          retailers: { retailerId: Number(req.params.retailerId) }
        }
      }
    );
  
    res.json({ message: "Retailer removed from route" });
  });
    
/* LOG CALL */
router.post("/log-call", async (req, res) => {
    try {
      const { routeId, retailerId, note, outcome } = req.body;
  
      if (!routeId || !retailerId) {
        return res.status(400).json({ message: "Missing data" });
      }
  
      if (!note || !note.trim()) {
        return res.status(400).json({ message: "Call remark is required" });
      }
  
      const callDoc = {
        routeId,
        retailerId: Number(retailerId),
        note: note.trim(),
        outcome: outcome || "call",
        date: new Date()
      };
  
      await mongoose.connection
        .collection("route_calls")
        .insertOne(callDoc);
  
      await mongoose.connection.db.collection("routes").updateOne(
        { routeId, "retailers.retailerId": Number(retailerId) },
        {
          $set: {
            "retailers.$.lastCallDate": callDoc.date,
            "retailers.$.lastCallNote": callDoc.note,
            "retailers.$.lastCallOutcome": callDoc.outcome
          }
        }
      );
  
      // ✅ ALWAYS return call object
      res.json({
        success: true,
        call: callDoc
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to log call" });
    }
  });
  
  
  
router.post("/:routeId/call/:retailerId", async (req, res) => {
  const { note, outcome } = req.body;

  await routesCol().updateOne(
    {
      routeId: req.params.routeId,
      "retailers.retailerId": Number(req.params.retailerId)
    },
    {
      $set: {
        "retailers.$.lastCallDate": new Date(),
        "retailers.$.lastCallNote": note,
        "retailers.$.lastCallOutcome": outcome
      }
    }
  );

  await callsCol().insertOne({
    routeId: req.params.routeId,
    retailerId: Number(req.params.retailerId),
    date: new Date(),
    note,
    outcome
  });

  res.json({ message: "Call logged" });
});

module.exports = router;
