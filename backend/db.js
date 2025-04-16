// Simulación de conexión a Oracle
async function connectToDatabase() {
    console.log("⏳ Simulando conexión a Oracle...");
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Espera de 1 segundo
    console.log("✅ Conexión simulada con Oracle exitosa.");
}

module.exports = { connectToDatabase };