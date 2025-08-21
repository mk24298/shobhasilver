const express = require("express");
const path = require("path");
const mongodb = require("./mongooseConnect"); // Import MongoDB connection
const createBillRoutes = require("./routes/createBill");
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());


// Middleware
app.use(express.json());

// Connect to MongoDB
mongodb();

// // API routes
// app.use("/api", require("./routes/createBill"));
// app.use("/api", require("./routes/getRetailers"));
// app.use("/api", require("./routes/addStock"));
// app.use("/api", require("./routes/getStock"));
// app.use("/api", require("./routes/getBills"));


// All /api routes
app.use("/api", require("./routes/createBill"));
app.use("/api", require("./routes/getRetailers"));
app.use("/api", require("./routes/addStock"));
app.use("/api", require("./routes/getStock"));
app.use("/api", require("./routes/getBills"));
app.use("/api", require("./routes/finePayment"));
app.use("/api", require("./routes/updateStock"));
app.use("/api", require("./routes/deleteBill"));
app.use("/api", require("./routes/downloadRemaining"));
app.use("/api", require("./routes/cashEntry"));
app.use("/api", require("./routes/retailerInfo"));







// Serve static files
app.use(express.static(path.join(__dirname, "frontend", "build")));

// Fallback route for SPA
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "build", "index.html"));
});




// // Serve frontend build files
// app.use(express.static(path.join(__dirname, "frontend", "build")));
// console.log(path.join(__dirname, "frontend", "build", "index.html"),"sdcs")


// const currentDir = __dirname;
// console.log("Current Directory:", currentDir);
// app.use(express.static(path.join(__dirname, "/frontend/build")));

// app.get("*", (req, res) =>
//   res.sendFile(path.join(__dirname, "./frontend/build/index.html"))
// );
// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
