const { pesoEmitter } = require("../controllers/pesoController");

function emularVehiculo() {
  console.log("🚗 Iniciando emulación de vehículo...");

  // 1️⃣ Loop detecta el vehículo
  pesoEmitter.emit("peso", { caseNumber: 1, data: {} });
  console.log("🟢 Loop encendido");

  // 2️⃣ Primer eje pasa por A y C (delantero)
  setTimeout(() => {
    console.log("🟡 Eje delantero en A y C");

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
          descripcion: `Sensor A eje delantero`,
        },
      },
    });

    pesoEmitter.emit("peso", {
      caseNumber: 2,
      data: {
        canal: "C",
        tipo: "S3",
        datos: {
          sww1: Math.random() * 5000,
          sww2: Math.random() * 5000,
          time2: Date.now(),
          time3: Date.now() + 5,
          time4: Date.now() + 10,
          descripcion: `Sensor C eje delantero`,
        },
      },
    });
  }, 500);


  setTimeout(() => {
    console.log("🟡 Eje delantero en A y C");

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
          descripcion: `Sensor A eje delantero`,
        },
      },
    });

    pesoEmitter.emit("peso", {
      caseNumber: 2,
      data: {
        canal: "C",
        tipo: "S3",
        datos: {
          sww1: Math.random() * 5000,
          sww2: Math.random() * 5000,
          time2: Date.now(),
          time3: Date.now() + 5,
          time4: Date.now() + 10,
          descripcion: `Sensor C eje delantero`,
        },
      },
    });
  }, 1000);

  

  // 4️⃣ Luego pasa el eje trasero por B y D (con delay)
  setTimeout(() => {
    console.log("🔵 Eje trasero en B y D");

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
          descripcion: `Sensor B eje trasero`,
        },
      },
    });

    pesoEmitter.emit("peso", {
      caseNumber: 2,
      data: {
        canal: "D",
        tipo: "S4",
        datos: {
          sww1: Math.random() * 5000,
          sww2: Math.random() * 5000,
          time2: Date.now(),
          time3: Date.now() + 5,
          time4: Date.now() + 10,
          descripcion: `Sensor D eje trasero`,
        },
      },
    });
  }, 1500);



  // 3️⃣ El loop se apaga (vehículo aún no terminó)
  setTimeout(() => {
    console.log("🔴 Loop apagado — vehículo aún sobre los sensores");
    pesoEmitter.emit("peso", { caseNumber: 3, data: {} });
  }, 2000);


  setTimeout(() => {
    console.log("🔵 Eje trasero en B y D");

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
          descripcion: `Sensor B eje trasero`,
        },
      },
    });

    
  }, 2500);


  

  setTimeout(() => {
    console.log("🔵 Eje trasero en B y D");

    pesoEmitter.emit("peso", {
      caseNumber: 2,
      data: {
        canal: "D",
        tipo: "S2",
        datos: {
          sww1: Math.random() * 5000,
          sww2: Math.random() * 5000,
          time2: Date.now(),
          time3: Date.now() + 5,
          time4: Date.now() + 10,
          descripcion: `Sensor B eje trasero`,
        },
      },
    });

    
  }, 3000);

  // 5️⃣ Finalmente el vehículo sale completamente del sistema
}

module.exports = { emularVehiculo };
