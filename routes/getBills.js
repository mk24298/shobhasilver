const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");
const { ObjectId } = require("mongoose").Types;
router.post('/getretailerbills', async (req, res) => {
    try {
      const Retailer = mongoose.connection.db.collection("retailers");
      const { name } = req.body;
  
      if (!name) {
        return res.status(400).json({ error: "Retailer name is required" });
      }
  
      const retailer = await Retailer.findOne({ name });
  
      if (!retailer) return res.status(404).json({ error: 'Retailer not found' });
  
      res.json({ retailer: retailer});
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  router.get('/getretailerbills', async (req, res) => {
    try {
      const Retailer = mongoose.connection.db.collection("retailers");
  
      // Fetch all retailers and project only necessary fields (you can adjust as needed)
      const allRetailers = await Retailer.find({}).toArray();
  
      res.json({ retailers: allRetailers });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
module.exports = router;
