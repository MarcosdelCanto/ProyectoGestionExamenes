const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { connectToDatabase } = require("./db");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
    res.send("API funcionando 🚀");
});

connectToDatabase();

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
