
const express = require("express");

const app = express();

// Home route
app.get("/", (req, res) => {
    res.status(200).send("Welcome to my BDF Lab 1 server!");
});

// About route
app.get("/about", (req, res) => {
    res.status(200).json({
        name: "Lasya",
        section: "113"
    });
});

// Time route
app.get("/time", (req, res) => {
    res.status(200).json({
        currentTime: new Date().toString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).send("404 - Page Not Found");
});

// Start server
app.listen(3000, () => {
    console.log("Express server running at http://localhost:3000");
});
