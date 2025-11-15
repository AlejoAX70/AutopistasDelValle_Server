const { server } = require("./app");
const config = require("./config");
const { emularVehiculo } = require("./simulators/vehicleEmulator");
const { main } = require("./controllers/pesoController");

server.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
});

// setInterval(() => {
//   emularVehiculo();
// }, 10000); // cada 10 segundos simula un vehículo


setTimeout(() => {
  main(); // inicializa tu lógica
}, 5000);

