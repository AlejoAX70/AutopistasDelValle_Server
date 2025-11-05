const net = require("net");
const { state } = require("../utils/systemSate");

// Función para generar una placa aleatoria tipo ABC123
function generarPlaca() {
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numeros = "0123456789";
  let placa = "";
  for (let i = 0; i < 3; i++)
    placa += letras[Math.floor(Math.random() * letras.length)];
  for (let i = 0; i < 3; i++)
    placa += numeros[Math.floor(Math.random() * numeros.length)];
  return placa;
}

// 👉 Función para iniciar el emulador
function iniciarEmuladorCamara() {
  let data = {};
  const PORT = state.puertoCamaraPlaca;
  const HOST = state.IpCamaraPlaca; // usa localhost para conectar al servidor TCP local

  const PORTestatica = state.puertoCamaraPlacaEstatica;
  const HOSTestatica = state.IpCamaraPlacaEstatica; // usa localhost para conectar al servidor TCP local

  const client = new net.Socket();
  const client2 = new net.Socket();

  data = {
        plate: generarPlaca(),
        confidence: Math.floor(Math.random() * 10) + 90, // 90–99%
        time: new Date().toISOString(),
        imagePath: `${
          `${state.rutaFotoPlaca}` ||
          `http://localhost/images/${Date.now()}.jpg`
        }`,
      };

  client2.connect(PORTestatica, HOSTestatica, () => {
    console.log(`🚗 Emulador de cámara conectado a ${HOST}:${PORT}`);
    // Enviar datos cada 5 segundos
    setInterval(() => {
      const json = JSON.stringify(data) + "\n"; // salto de línea separador
      client2.write(json);
      console.log("📤 Enviando datos simulados:", json.trim());
    }, 10000);
  });

  client2.on("error", (err) => {
    console.error("❌ Error en conexión del emulador:", err.message);
  });

  client2.on("close", () => {
    console.log("🔌 Emulador desconectado del servidor");
  });




  /// dinamica

  client.connect(PORT, HOST, () => {
    console.log(`🚗 Emulador de cámara conectado a ${HOST}:${PORT}`);

    // Enviar datos cada 5 segundos
    setInterval(() => {
    
      const json = JSON.stringify(data) + "\n"; // salto de línea separador
      client.write(json);
      console.log("📤 Enviando datos simulados:", json.trim());
    }, 5000);
  });

  client.on("error", (err) => {
    console.error("❌ Error en conexión del emulador:", err.message);
  });

  client.on("close", () => {
    console.log("🔌 Emulador desconectado del servidor");
  });
}

// 👇 Exporta la función para poder iniciarla desde otro archivo
module.exports = { iniciarEmuladorCamara };
