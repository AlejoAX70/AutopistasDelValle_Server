const net = require("net");
const { getConnection, sql } = require("../database/connection");
const { state } = require("../utils/systemSate");

function iniciarAnprServer() {
  const PORT = state.puertoCamaraPlaca;
  const HOST = state.IpCamaraPlaca;

  console.log("Intentando iniciar servidor ANPR en:", HOST, PORT);
  console.log("state:", state);

  const server = net.createServer((socket) => {
    console.log(
      "📡 Cámara conectada:",
      socket.remoteAddress,
      "port:",
      socket.remotePort
    );

    socket.on("data", (data) => {
      try {
        const mensaje = data.toString().trim();
        const jsons = mensaje.split("\n");
        jsons.forEach((js) => {
          if (!js) return;
          try {
            const info = JSON.parse(js);
            state.placa = info.plate || "XXX000";
            state.rutaFotoPlaca = info.imagePath || "";
            console.log("📸 Placa detectada:", info.plate);
            console.log("🕒 Hora:", info.time);
            console.log("🖼️ Imagen:", info.imagePath);
            console.log("---------------------------------");
          } catch (err) {
            console.warn("⚠️ No se pudo parsear JSON:", js, err && err.message);
          }
        });
      } catch (error) {
        console.error("❌ Error procesando datos:", error.message);
      }
    });

    socket.on("close", () => {
      console.log("🔌 Cámara desconectada");
    });

    socket.on("error", (err) => {
      console.error("❌ Error en socket:", err.message);
    });
  });

  server.on("listening", () => {
    console.log(`🚀 Servidor ANPR TCP escuchando en ${HOST}:${PORT}`);
  });

  server.on("error", (err) => {
    console.error("❌ Error en servidor TCP:", err.message);
    if (err.code === "EADDRINUSE") {
      console.error(
        `-> Puerto ${PORT} en uso. Cambia el puerto o mata el proceso que lo ocupa.`
      );
    }
  });

  // <-- listen OUTSIDE del createServer
  server.listen(PORT, HOST);
}

async function eliminarEvasor(placa) {
  try {
     const pool = await getConnection();
    const query = `
      UPDATE V
      SET V.Evasor = 0  -- cambia a FALSE 
      FROM [dinamica2].[dbo].[VehiculosEnDinamica] AS V
      WHERE V.VehiculoId = (
          SELECT TOP 1 V2.VehiculoId
          FROM [dinamica2].[dbo].[VehiculosEnDinamica] AS V2
          WHERE V2.Placa = @placa  
            AND CONVERT(date, V2.FechaRegistro) = CONVERT(date, GETDATE())  
          ORDER BY V2.FechaRegistro DESC  
      );

    `;

    // Ejecutar la consulta usando parámetros seguros
    const request = pool.request();
    request.input("placa", placa);
    await request.query(query);
  } catch (error) {
    console.error("Error al eliminar evasor:", error);
    throw error;
  }
}

function iniciarAnprServerEstatica() {
  const PORT = state.puertoCamaraPlacaEstatica;
  const HOST = state.IpCamaraPlacaEstatica;

  console.log("Intentando iniciar servidor ANPR en:", HOST, PORT);
  console.log("state:", state);

  const server = net.createServer((socket) => {
    console.log(
      "📡 Cámara conectada:",
      socket.remoteAddress,
      "port:",
      socket.remotePort
    );

    socket.on("data", (data) => {
      try {
        const mensaje = data.toString().trim();
        const jsons = mensaje.split("\n");
        jsons.forEach((js) => {
          if (!js) return;
          try {
            const info = JSON.parse(js);

            // state.placa = info.plate || "XXX000";
            // state.rutaFotoPlaca = info.imagePath || "";
            eliminarEvasor(info.plate);
            console.log(
              "📸 Placa detectada estaticaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:",
              info.plate
            );
            console.log("🕒 Hora:", info.time);
            console.log("🖼️ Imagen:", info.imagePath);
            console.log("---------------------------------");
          } catch (err) {
            console.warn("⚠️ No se pudo parsear JSON:", js, err && err.message);
          }
        });
      } catch (error) {
        console.error("❌ Error procesando datos:", error.message);
      }
    });

    socket.on("close", () => {
      console.log("🔌 Cámara desconectada");
    });

    socket.on("error", (err) => {
      console.error("❌ Error en socket:", err.message);
    });
  });

  server.on("listening", () => {
    console.log(`🚀 Servidor ANPR TCP escuchando en ${HOST}:${PORT}`);
  });

  server.on("error", (err) => {
    console.error("❌ Error en servidor TCP:", err.message);
    if (err.code === "EADDRINUSE") {
      console.error(
        `-> Puerto ${PORT} en uso. Cambia el puerto o mata el proceso que lo ocupa.`
      );
    }
  });

  // <-- listen OUTSIDE del createServer
  server.listen(PORT, HOST);
}

module.exports = { iniciarAnprServer, iniciarAnprServerEstatica };

// Opcional: permite ejecutar el archivo directamente con `node anprEvents.js`
