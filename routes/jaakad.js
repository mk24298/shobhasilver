// routes/jaakad_v2.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// helper: generate readable id
const genId = (pref = "J") => {
  const now = new Date();
  return `${pref}${now.toISOString().slice(0,10).replace(/-/g,"")}-${Math.floor(Math.random()*90000)+10000}`;
};

// ensure indexes
(async function ensure() {
  try {
    const coll = mongoose.connection.db.collection("jaakad");
    await coll.createIndex({ jaakadId: 1 }, { unique: true });
    await coll.createIndex({ retailerId: 1, status: 1 });
    console.log("jaakad_v2 indexes ok");
  } catch (e) {
    console.warn("jaakad_v2 index warning", e.message || e);
  }
})();

// helper: sum item arrays by stockId|itemName
function sumItems(arr) {
  // returns map key -> { stockId, itemName, weight, pcs }
  const map = {};
  (arr || []).forEach(it => {
    const key = it.stockId ? String(it.stockId) : (`name:${it.itemName}`);
    if (!map[key]) map[key] = { stockId: it.stockId || null, itemName: it.itemName, weight: 0, pcs: 0 };
    map[key].weight += Number(it.weight || 0);
    map[key].pcs += Number(it.pcs || 0);
  });
  return Object.values(map);
}

// helper: compute remaining = initial - (sumReturns + sumBilled + sumCarry)
function computeRemaining(initialItems, returnsArr, billedArr, carryArr) {
  // build map for initial
  const initMap = {};
  (initialItems || []).forEach(it => {
    const key = it.stockId ? String(it.stockId) : (`name:${it.itemName}`);
    initMap[key] = { stockId: it.stockId || null, itemName: it.itemName, weight: Number(it.weight||0), pcs: Number(it.pcs||0) };
  });

  // subtract arrays
  const subs = [...(returnsArr||[]), ...(billedArr||[]), ...(carryArr||[])].flatMap(h => h.items || []).map(it => ({
    stockId: it.stockId || null,
    itemName: it.itemName,
    weight: Number(it.weight||0),
    pcs: Number(it.pcs||0)
  }));

  const subMap = {};
  subs.forEach(it => {
    const key = it.stockId ? String(it.stockId) : (`name:${it.itemName}`);
    if (!subMap[key]) subMap[key] = { weight: 0, pcs: 0 };
    subMap[key].weight += it.weight;
    subMap[key].pcs += it.pcs;
  });

  // compute remaining per initial key
  const remain = [];
  Object.keys(initMap).forEach(k => {
    const base = initMap[k];
    const s = subMap[k] || { weight: 0, pcs: 0 };
    const remWeight = Math.max(0, (base.weight - s.weight));
    const remPcs = Math.max(0, (base.pcs - s.pcs));
    if (remWeight > 0 || remPcs > 0) {
      remain.push({ stockId: base.stockId, itemName: base.itemName, weight: remWeight, pcs: remPcs });
    }
  });
  return remain;
}

/**
 * POST /api/jaakad
 * create a jaakad
 * body:
 * {
 *   retailerId, retailerName, retailerPhone, date, items: [{ stockId, itemName, weight, pcs }]
 * }
 */
router.post("/jaakad", async (req, res) => {
  try {
    const { retailerId, retailerName, retailerPhone, date, items } = req.body;
    if (!retailerId) return res.status(400).json({ message: "retailerId required" });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "items required" });

    const Jaakad = mongoose.connection.db.collection("jaakad");
    const doc = {
      jaakadId: genId("J"),
      retailerId: Number(retailerId),
      retailerName: retailerName || "",
      retailerPhone: retailerPhone || "",
      date: date || new Date().toISOString().slice(0,10),
      initialItems: (items || []).map(it => ({
        stockId: it.stockId || null,
        itemName: it.itemName,
        weight: Number(it.weight || 0),
        pcs: Number(it.pcs || 0)
      })),
      returns: [],        // array of { returnId, date, items }
      billed: [],         // array of { billId, date, items } <-- NOTE: internal marking only
      carryforwards: [],  // array of { cfId, date, items }
      status: "open",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await Jaakad.insertOne(doc);
    res.status(201).json({ message: "Jaakad created", jaakad: doc });
  } catch (err) {
    console.error("create jaakad err", err);
    res.status(500).json({ message: "Internal server error", error: err.message || err });
  }
});

/**
 * GET /api/jaakad
 * optional query: ?status=open&retailerId=5
 */
router.get("/jaakad", async (req, res) => {
  try {
    const Jaakad = mongoose.connection.db.collection("jaakad");
    const { status, retailerId } = req.query;
    const q = {};
    if (status) q.status = status;
    if (retailerId) q.retailerId = Number(retailerId);
    const docs = await Jaakad.find(q).sort({ createdAt: -1 }).toArray();
    res.json({ jaakads: docs });
  } catch (err) {
    console.error("list jaakad err", err);
    res.status(500).json({ message: "Internal server error", error: err.message || err });
  }
});

/**
 * GET /api/jaakad/:jaakadId
 */
router.get("/jaakad/:jaakadId", async (req, res) => {
  try {
    const Jaakad = mongoose.connection.db.collection("jaakad");
    const jaakadId = req.params.jaakadId;
    const doc = await Jaakad.findOne({ jaakadId });
    if (!doc) return res.status(404).json({ message: "Jaakad not found" });
    // Also compute computedRemaining to help frontend
    const remaining = computeRemaining(doc.initialItems || [], doc.returns || [], doc.billed || [], doc.carryforwards || []);
    res.json({ jaakad: doc, remaining });
  } catch (err) {
    console.error("get jaakad err", err);
    res.status(500).json({ message: "Internal server error", error: err.message || err });
  }
});

/**
 * POST /api/jaakad/:jaakadId/return
 * body: { date, returnedItems: [{ stockId?, itemName, weight, pcs }] }
 * Adds a return history entry; does NOT remove initialItems.
 * Sets status -> partially_returned or closed (if remaining==0)
 */
router.post("/jaakad/:jaakadId/return", async (req, res) => {
  try {
    const jaakadId = req.params.jaakadId;
    const { date, returnedItems } = req.body;
    if (!Array.isArray(returnedItems) || returnedItems.length === 0) return res.status(400).json({ message: "returnedItems required" });

    const Jaakad = mongoose.connection.db.collection("jaakad");
    const doc = await Jaakad.findOne({ jaakadId });
    if (!doc) return res.status(404).json({ message: "Not found" });

    const entry = {
      returnId: genId("R"),
      date: date || new Date().toISOString().slice(0,10),
      items: (returnedItems || []).map(it => ({
        stockId: it.stockId || null,
        itemName: it.itemName,
        weight: Number(it.weight || 0),
        pcs: Number(it.pcs || 0)
      })),
      createdAt: new Date()
    };

    // push return entry and recompute status (remaining)
    await Jaakad.updateOne({ jaakadId }, { $push: { returns: entry }, $set: { updatedAt: new Date() } });

    // fetch updated doc
    const updated = await Jaakad.findOne({ jaakadId });
    const remaining = computeRemaining(updated.initialItems || [], updated.returns || [], updated.billed || [], updated.carryforwards || []);

    const newStatus = (remaining.length === 0) ? "closed" : "partially_returned";
    if (newStatus !== updated.status) {
      await Jaakad.updateOne({ jaakadId }, { $set: { status: newStatus, updatedAt: new Date() } });
    }

    const docAfter = await Jaakad.findOne({ jaakadId });
    res.json({ message: "Return recorded", jaakad: docAfter, remaining });
  } catch (err) {
    console.error("return err", err);
    res.status(500).json({ message: "Internal server error", error: err.message || err });
  }
});

/**
 * POST /api/jaakad/:jaakadId/makebill
 * Body: { date, items: [{ stockId?, itemName, weight, pcs }] }
 * Marks those items as billed (append to billed array) and marks jaakad as closed.
 * (NOTE: this does NOT call create-bill or touch stock)
 */
router.post("/jaakad/:jaakadId/makebill", async (req, res) => {
  try {
    const jaakadId = req.params.jaakadId;
    const { date, items } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "items required to bill" });

    const Jaakad = mongoose.connection.db.collection("jaakad");
    const doc = await Jaakad.findOne({ jaakadId });
    if (!doc) return res.status(404).json({ message: "Not found" });

    const entry = {
      billId: genId("B"),
      date: date || new Date().toISOString().slice(0,10),
      items: items.map(it => ({
        stockId: it.stockId || null,
        itemName: it.itemName,
        weight: Number(it.weight || 0),
        pcs: Number(it.pcs || 0)
      })),
      createdAt: new Date()
    };

    await Jaakad.updateOne({ jaakadId }, { $push: { billed: entry }, $set: { status: "closed", updatedAt: new Date() } });

    const updated = await Jaakad.findOne({ jaakadId });
    res.json({ message: "Marked billed — jaakad closed", jaakad: updated });
  } catch (err) {
    console.error("makebill err", err);
    res.status(500).json({ message: "Internal server error", error: err.message || err });
  }
});

/**
 * POST /api/jaakad/:jaakadId/carryforward
 * Body: { date, items: [{ stockId?, itemName, weight, pcs }] }
 * Creates a new jaakad doc with these items and marks old jaakad closed and stores carryforward history.
 */
router.post("/jaakad/:jaakadId/carryforward", async (req, res) => {
  try {
    const jaakadId = req.params.jaakadId;
    const { date, items } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "items required to carryforward" });

    const Jaakad = mongoose.connection.db.collection("jaakad");
    const old = await Jaakad.findOne({ jaakadId });
    if (!old) return res.status(404).json({ message: "Not found" });

    // create new jaakad (carryforward entry)
    const newDoc = {
      jaakadId: genId("J"),
      retailerId: old.retailerId,
      retailerName: old.retailerName,
      retailerPhone: old.retailerPhone,
      date: date || new Date().toISOString().slice(0,10),
      initialItems: items.map(it => ({ stockId: it.stockId || null, itemName: it.itemName, weight: Number(it.weight||0), pcs: Number(it.pcs||0) })),
      returns: [],
      billed: [],
      carryforwards: [],
      status: "carryforward",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // insert new doc and mark old as closed with carryforward history
    const cfEntry = { cfId: genId("CF"), date: date || new Date().toISOString().slice(0,10), items: newDoc.initialItems, createdAt: new Date() };

    await Jaakad.insertOne(newDoc);
    await Jaakad.updateOne({ jaakadId }, { $push: { carryforwards: cfEntry }, $set: { status: "closed", updatedAt: new Date() } });

    const inserted = await Jaakad.findOne({ jaakadId: newDoc.jaakadId });
    res.json({ message: "Carryforward created; old jaakad closed", newJaakad: inserted });
  } catch (err) {
    console.error("carryforward err", err);
    res.status(500).json({ message: "Internal server error", error: err.message || err });
  }
});

/**
 * POST /api/jaakad/:jaakadId/close
 * simply mark closed (no other action)
 */
router.post("/jaakad/:jaakadId/close", async (req, res) => {
  try {
    const jaakadId = req.params.jaakadId;
    const Jaakad = mongoose.connection.db.collection("jaakad");
    const result = await Jaakad.updateOne({ jaakadId }, { $set: { status: "closed", updatedAt: new Date() } });
    if (result.modifiedCount === 0) return res.status(404).json({ message: "Not found or not updated" });
    const updated = await Jaakad.findOne({ jaakadId });
    res.json({ message: "Closed", jaakad: updated });
  } catch (err) {
    console.error("close err", err);
    res.status(500).json({ message: "Internal server error", error: err.message || err });
  }
});

module.exports = router;
