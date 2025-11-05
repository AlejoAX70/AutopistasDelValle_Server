const net = require("net");
const { state } = require("../utils/systemSate");

function iniciarPuertoPeaje() {
  const PORT = state.puertoPeaje;
  const HOST = state.ipPeaje;

  console.log("Intentando iniciar servidor Peaje en:", HOST, PORT);
  console.log("state inicial:", state);

  // 🔹 Lista de clientes conectados
  const clientes = new Set();

  const server = net.createServer((socket) => {
   
    clientes.add(socket);

    // 🔹 Evento: recepción de datos de la cámar
    // 🔹 Evento: desconexión del cliente
    socket.on("close", () => {
     
      clientes.delete(socket);
    });

    // 🔹 Evento: error
    socket.on("error", (err) => {
      console.error("❌ Error en socket:", err.message);
      clientes.delete(socket);
    });
  });

  // 🔹 Servidor escuchando
  server.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor ANPR TCP escuchando en ${HOST}:${PORT}`);
  });

  server.on("error", (err) => {
    console.error("❌ Error en servidor TCP:", err.message);
    if (err.code === "EADDRINUSE") {
      console.error(`-> Puerto ${PORT} en uso. Cambia el puerto o mata el proceso que lo ocupa.`);
    }
  });

  // 🔹 Enviar el estado de los equipos cada 10 segundos
  setInterval(() => {
    const estadoActual = JSON.stringify({
      ultimaActualizacion: new Date().toISOString(),
      equipos: {
        estadoBasculaDinamica: state.estadoBasculaDinamica,
        estadoPlc: state.estadoPlc,
        displayIngresoEstacion: state.estadoDisplayIngresoEstacion,
        displayEstatica: state.estadoDisplayEstatica
      },
    });

    if (clientes.size > 0) {
      console.log(`📤 Enviando estado a ${clientes.size} cliente(s)...`);
      for (const cliente of clientes) {
        if (!cliente.destroyed) {
          cliente.write(estadoActual + "\n");
        }
      }
    } else {
      console.log("🕒 No hay cámaras conectadas, estado no enviado.");
    }
  }, 10000); // cada 10 segundos
}

module.exports = { iniciarPuertoPeaje };

// Permite ejecutar directamente con: node anprServer.js
if (require.main === module) {
  iniciarPuertoPeaje();
}
