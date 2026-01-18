const mongoose = require("mongoose");

const RouteSchema = new mongoose.Schema({
  routeId: { type: Number, unique: true },
  routeName: { type: String, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Route", RouteSchema);
