const { OPCUAClient, AttributeIds, DataType } = require("node-opcua");
const { enviarMensajeDisplay2 } = require("./displayController");
const { getConnection } = require("../database/connection");
const { state } = require("../utils/systemSate");

const client = OPCUAClient.create({});
let session = null;

// 🔹 Función para iniciar conexión OPC UA con reintento

async function iniciarPLC() {
  const maxReintentos = 20000;
  const tiempoReintento = 5000;
  const url = `opc.tcp://${state.plcIp}:${state.plcPort}`;

  const conectar = async (reintento = 0) => {
    if (reintento >= maxReintentos) {
      console.error(`❌ Máximo de reintentos (${maxReintentos}) alcanzado. Abortando.`);
      return;
    }

    try {
      console.log(`🔌 Intentando conectar a ${url} (Intento ${reintento + 1})`);

      // 🔹 Crear cliente nuevo en cada intento
      client = OPCUAClient.create({
        connectionStrategy: {
          initialDelay: 1000,
          maxRetry: 1, // solo 1 intento interno, nosotros manejamos los reintentos
        },
        keepSessionAlive: true,
        endpointMustExist: false,
      });

      client.on("close", () => {
        console.warn("⚠️ Conexión OPC UA cerrada. Reintentando en 5s...");
        setTimeout(() => conectar(0), tiempoReintento);
      });

      await client.connect(url);
      session = await client.createSession();

      console.log("✅ Conectado al servidor OPC UA correctamente");
       state.estadoPlc = true
    } catch (err) {
      console.error(`❌ Error al conectarse (intento ${reintento + 1}):`, err.message);
      state.estadoPlc = false
      // 🔹 Espera antes de reintentar
      setTimeout(() => conectar(reintento + 1), tiempoReintento);
    }
  };

  await conectar();
}


// 🔹 Función genérica para leer un nodo
const readNode = async (id) => {
  if (!session) return console.log("⚠️ No hay sesión activa con el PLC");
  try {
    return await session.read({ nodeId: `ns=4;i=${id}`, attributeId: AttributeIds.Value });
  } catch (e) {
    console.log(`Error leyendo nodo ${id}:`, e.message);
  }
};

// 🔹 Función genérica para escribir un nodo booleano
const writeNode = async (id, value) => {
  if (!session) return console.log("⚠️ No hay sesión activa con el PLC");
  try {
    return await session.write({
      nodeId: `ns=4;i=${id}`,
      attributeId: AttributeIds.Value,
      value: { value: { dataType: DataType.Boolean, value } },
    });
  } catch (e) {
    console.log(`Error escribiendo nodo ${id}:`, e.message);
  }
};

// 🔹 Generador automático de funciones nodeXXf()
const nodeFunctions = [
  25, 26, 51, 52, 35, 34, 33, 36, 38, 37, 39, 46, 54, 55, 57, 56, 60, 58, 59, 61, 28,
].reduce((acc, id) => {
  acc[`node${id}f`] = () => readNode(id);
  return acc;
}, {});

// 🔹 Funciones lógicas de control
async function no_ingreso_dinamica() {
  const pool = await getConnection();
  await pool.request().query(
    "UPDATE configuraciones SET valor='no_ingreso_dinamica' WHERE parametro='OPERACION'"
  );
  await writeNode(parseInt(state.ingresoDinamicaState), false);
  await writeNode(parseInt(state.No_ingresoDinamicaState), true);
}

async function ingreso_dinamica() {
  enviarMensajeDisplay2("Bienvenido");
  await writeNode(parseInt(state.No_ingresoDinamicaState), false);
  await writeNode(parseInt(state.ingresoDinamicaState), true);
}

async function salida_nacional() {
  await writeNode(parseInt(state.soloDinamicaState), true);
  setTimeout(() => writeNode(parseInt(state.soloDinamicaState), false), 2000);

  const pool = await getConnection();
  await pool.request().query(
    "UPDATE configuraciones SET valor='SOLODINAMICA' WHERE parametro='OPERACION'"
  );

  enviarMensajeDisplay2("solo_dinamica");
  setTimeout(() => enviarMensajeDisplay2("Bienvenido"), 5000);
}

const autorizarPesaje = (estado) => writeNode(parseInt(state.autorizarPesajeState), estado);

async function no_runtF() {
  await writeNode(parseInt(state.noRuntState), true);
  setTimeout(() => writeNode(parseInt(state.noRuntState), false), 2000);
}

async function ingreso_estatica() {
  await writeNode(parseInt(state.ingresoEstaticaState), true);
  console.log("cambio1 ingreso_estatica: true");
  setTimeout(async () => {
    await writeNode(parseInt(state.ingresoEstaticaState), false);
    console.log("cambio2 ingreso_estatica: false");
  }, 2000);
  enviarMensajeDisplay2("solo_estatica");
  setTimeout(() => enviarMensajeDisplay2("Bienvenido"), 5000);
}

async function sobrePeso() {
  await writeNode(parseInt(state.ingresoEstaticaState), true);
  setTimeout(() => writeNode(parseInt(state.ingresoEstaticaState), false), 2000);
}

async function solo_estatica() {
  const pool = await getConnection();
  await pool.request().query(
    "UPDATE configuraciones SET valor='SOLOESTATICA' WHERE parametro='OPERACION'"
  );
  await writeNode(parseInt(state.soloEstaticaState), false);
  setTimeout(() => writeNode(parseInt(state.soloNacionalState), true), 1000);
}

async function solo_nacional() {
  const pool = await getConnection();
  await pool.request().query(
    "UPDATE configuraciones SET valor='SOLODINAMICA' WHERE parametro='OPERACION'"
  );
  await writeNode(parseInt(state.soloNacionalState), false);
  setTimeout(() => writeNode(parseInt(state.soloEstaticaState), true), 1000);
}

async function automatico() {
  try {
    const pool = await getConnection();
    await pool.request().query(
      "UPDATE configuraciones SET valor='NORMAL' WHERE parametro='OPERACION'"
    );
    enviarMensajeDisplay2("Bienvenido");
    await writeNode(parseInt(state.automaticoState), true);
    setTimeout(() => writeNode(parseInt(state.automaticoState), false), 1000);
  } catch (e) {
    console.log("Error en automatico:", e.message);
  }
}

// 🔹 Exportar funciones y método de inicio
module.exports = {
  iniciarPLC, // ✅ ahora puedes llamarla desde app.js
  ...nodeFunctions,
  no_ingreso_dinamica,
  ingreso_dinamica,
  salida_nacional,
  ingreso_estatica,
  solo_estatica,
  solo_nacional,
  automatico,
  autorizarPesaje,
  no_runtF,
  sobrePeso,
};
