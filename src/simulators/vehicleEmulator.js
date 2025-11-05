const { pesoEmitter } = require("../controllers/pesoController");

function emularVehiculo() {
  console.log("🚗 Iniciando emulación de vehículo...");

  pesoEmitter.emit("peso", { caseNumber: 1, data: {} });

  setTimeout(() => {
    for (let i = 0; i < 3; i++) {
      pesoEmitter.emit("peso", {
        caseNumber: 2,
        data: {
          canal: "A",
          tipo: "S1",
          datos: {
            sww1: Math.random() * 5000,
            sww2: Math.random() * 5000,
            time2: Date.now(),
            time3: Date.now() + 5,
            time4: Date.now() + 10,
            descripcion: `Sensor A eje ${i + 1}`,
          },
        },
      });

      pesoEmitter.emit("peso", {
        caseNumber: 2,
        data: {
          canal: "B",
          tipo: "S2",
          datos: {
            sww1: Math.random() * 5000,
            sww2: Math.random() * 5000,
            time2: Date.now(),
            time3: Date.now() + 5,
            time4: Date.now() + 10,
            descripcion: `Sensor B eje ${i + 1}`,
          },
        },
      });
    }
  }, 500);

  setTimeout(() => {
    pesoEmitter.emit("peso", { caseNumber: 3, data: {} });
  }, 1500);

  setTimeout(() => {
    pesoEmitter.emit("peso", { caseNumber: 4, data: {} });
  }, 2000);
}









module.exports = { emularVehiculo };
