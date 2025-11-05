const net = require("net");

// IP y puerto del servidor receptor (tu servidor Node.js)
const SERVER_HOST = "127.0.0.1";
const SERVER_PORT = 4000;

// Tabla de clases EURO13 (solo para mostrar en consola)
const euro13Classes = {
  1: "N/A",
  2: "C2",
  3: "C3",
  4: "C4",
  5: "C2R2",
  6: "C3R2 ",
  7: "C2S1",
  8: "C2S2",
  9: "C2S3",
  10: "C3S2",
  11: "C3S3",
  12: "OTROS",
};

// Genera una trama JSON simulada con datos realistas
function crearTramaEjemplo() {
  const claseE13 = Math.floor(Math.random() * 12) + 1; // valor 1–12 aleatorio
  const categoria = euro13Classes[claseE13]; // toma la primera palabra descriptiva

  return JSON.stringify({
    EVENT_ID: "EVT-" + Date.now(),
    CATEGORIA: categoria,
    CLASE_E13: claseE13, // ahora es un número válido
    LONGITUD: Math.floor(Math.random() * 10000) + 4000, // 4 a 14 m
    NWHEELS: Math.floor(Math.random() * 6) + 4, // 4 a 10 ruedas
    AXLEGROUPS: Math.floor(Math.random() * 3) + 1, // 1 a 3 grupos
    WHEEL_DISTANCES: [
      Math.floor(Math.random() * 1500) + 2500,
      Math.floor(Math.random() * 1500) + 2500,
      Math.floor(Math.random() * 1500) + 2500,
    ],
    NSUBVEH: Math.random() > 0.7 ? 2 : 1, // a veces lleva remolque
    FRAME_SCORE: (Math.random() * 5 + 95).toFixed(2), // confianza 95–100%
    timestamp: new Date().toISOString(),
  });
}

// Función principal del emulador
function iniciarEmuladorCamaraEjes() {
  const client = new net.Socket();

  client.connect(SERVER_PORT, SERVER_HOST, () => {
    console.log(`📡 Emulador conectado al servidor en ${SERVER_HOST}:${SERVER_PORT}`);

    // Enviar una trama cada 5 segundos
    setInterval(() => {
      const trama = crearTramaEjemplo();
      const parsed = JSON.parse(trama);
      console.log(
        `📤 Enviando trama simulada: CLASE ${parsed.CLASE_E13} → ${euro13Classes[parsed.CLASE_E13]}`
      );
      client.write(trama + "\n");
    }, 5000);
  });

  client.on("data", (data) => {
    console.log("📥 Respuesta del servidor:", data.toString());
  });

  client.on("close", () => {
    console.log("🔌 Conexión cerrada con el servidor");
  });

  client.on("error", (err) => {
    console.error("⚠️ Error en el emulador:", err.message);
  });
}

// Ejecutar el emulador
module.exports = { iniciarEmuladorCamaraEjes }
