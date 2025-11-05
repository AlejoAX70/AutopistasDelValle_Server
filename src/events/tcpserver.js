const net = require("net");

let clientSocket = null; // socket actual del cliente
let serverNet = null;    // servidor TCP

function iniciarServidorTCP(port = 4000) {
  serverNet = net.createServer((socket) => {
    console.log("✅ Cliente TCP conectado");
    clientSocket = socket;

    socket.on("data", (data) => {
      console.log("📩 Datos recibidos del cliente TCP:", data.toString());
      // Aquí puedes procesar los datos
    });

    socket.on("end", () => {
      console.log("❌ Cliente TCP desconectado");
      clientSocket = null;
    });

    socket.on("error", (err) => {
      console.error("⚠️ Error en el socket TCP:", err);
    });
  });

  serverNet.on("error", (err) => {
    console.error("⚠️ Error en el servidor TCP:", err);
    serverNet.close(() => iniciarServidorTCP(port)); // reinicia
  });

  serverNet.listen(port, () => {
    console.log(`🚀 Servidor TCP escuchando en puerto ${port}`);
  });


  
}

function getTcpSocket() {
  return clientSocket; // retornamos el socket del cliente conectado
}

module.exports = { iniciarServidorTCP, getTcpSocket };
