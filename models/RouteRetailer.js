const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({
  date: Date,
  text: String
}, { _id: false });

const RouteRetailerSchema = new mongoose.Schema({
  routeId: Number,
  retailerId: Number,

  retailerName: String,
  phone: String,

  lastBuyDate: Date,
  lastBuyQty: Number,

  avgBuyGapDays: { type: Number, default: 10 },

  lastCallDate: Date,

  callPreference: {
    type: String,
    enum: ["regular", "occasional", "do_not_call"],
    default: "regular"
  },

  priority: {
    type: String,
    enum: ["HIGH", "MEDIUM", "LOW", "NO_CALL"],
    default: "LOW"
  },

  notes: [NoteSchema],

  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

module.exports = mongoose.model("RouteRetailer", RouteRetailerSchema);
