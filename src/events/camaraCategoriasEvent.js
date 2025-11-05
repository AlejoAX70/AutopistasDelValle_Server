const net = require("net");
const xml2js = require("xml2js"); // Para convertir XML a JSON
const { state } = require("../utils/systemSate");
const parser = new xml2js.Parser({ explicitArray: false });

// Configuración del servidor
const PORT = 4000;
const HOST = "0.0.0.0";

// Mapa de clasificación EURO13
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

function iniciarServidorConteoEjes() {
  const server = net.createServer((socket) => {
    console.log(`📡 Conexión establecida desde: ${socket.remoteAddress}:${socket.remotePort}`);

    socket.on("data", async (data) => {
      const mensaje = data.toString().trim();
      console.log("\n📥 Trama recibida completa:\n", mensaje);

      // Intentamos parsear como JSON
      try {
        const json = JSON.parse(mensaje);
        console.log("✅ Trama en formato JSON detectada");
        mostrarDatosEjes(json);
        return;
      } catch {}

      // Intentamos parsear como XML
      try {
        const result = await parser.parseStringPromise(mensaje);
        console.log("✅ Trama en formato XML detectada (convertida a JSON)");
        mostrarDatosEjes(result);
      } catch (err) {
        console.error("⚠️ No se pudo interpretar la trama ni como JSON ni como XML:", err.message);
      }
    });

    socket.on("close", () => {
      console.log("🔌 Conexión cerrada con la cámara");
    });

    socket.on("error", (err) => {
      console.error("⚠️ Error en socket:", err.message);
    });
  });

  server.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor de cámara de ejes escuchando en ${HOST}:${PORT}`);
  });
}

/**
 * Muestra los datos importantes y la clasificación EURO13.
 */
function mostrarDatosEjes(data) {
  try {
    console.log("\n====================== DATOS DEL EVENTO ======================");

    const event = data.VAC_VEHICULOS || data.VAC_WHEELS || data.event || data;

    // Extraer datos principales
    const claseE13 =
      parseInt(event.CLASE_E13 || event.claseE13 || event.CLASS_E13 || 0, 10);

    const info = {
      idEvento: event.EVENT_ID || event.idEvento || "No disponible",
      categoria: event.CATEGORIA || event.categoria || "No disponible",
      claseE13: claseE13 || "No disponible",
      descripcionE13: euro13Classes[claseE13] || "Desconocida",
      longitud: event.LONGITUD || event.longitud || "No disponible",
      numEjes: event.NWHEELS || event.numEjes || event.AXLE_COUNT || "No disponible",
      gruposEjes: event.AXLEGROUPS || event.gruposEjes || "No disponible",
      distanciaEjes: event.WHEEL_DISTANCES || event.distanciaEjes || "No disponible",
      subvehiculos: event.NSUBVEH || event.subvehiculos || "No disponible",
      puntuacion: event.FRAME_SCORE || event.puntuacion || "No disponible",
    };

    console.table(info);

    state.categoriaVehiculo = event.CATEGORIA || "No disponible"

    // Mostrar resultado detallado
    if (claseE13 && euro13Classes[claseE13]) {
      console.log(
        `🚛 Vehículo identificado como CLASE ${claseE13} → ${euro13Classes[claseE13]}`
      );
    } else {
      console.log("⚠️ No se pudo determinar la clase EURO13.");
    }

    console.log("==============================================================\n");
  } catch (err) {
    console.error("❌ Error mostrando datos de la trama:", err.message);
  }
}

module.exports = { iniciarServidorConteoEjes };

// Para ejecutar directamente si es este archivo el principal
if (require.main === module) {
  iniciarServidorConteoEjes();
}
