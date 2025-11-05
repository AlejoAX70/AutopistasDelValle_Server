// pesoController.js
const net = require("net");
const EventEmitter = require("events");
const { state } = require("../utils/systemSate");

const HOST = "192.168.1.110"; // Mantén tu HOST
const PORT = 10001; // Mantén tu PORT
const BYTE_INICIO = 0x28; // '('



// Longitudes esperadas para los tipos de trama conocidos (documento Intercomp Protocol Guide)
const MESSAGE_LENGTHS = {
  S: 15, // Static Weight (ASWWWWJERRRC<cr><lf>)
  D: 35, // Dynamic Weight (AD...<cr><lf>)
  I: 13, // Inputs Message (AInTTTTDRC<cr><lf>)
  J: 18, // Jitter Message (AJDDDDDDEEEEEEC<cr><lf>)
  P: 35, // Dual Tire Detect Message (EP...<cr><lf>) (desde Scale E)
};

// Longitud mínima para poder identificar el tipo (BYTE_INICIO + Canal + Tipo = 3 bytes)
const MIN_LEN_TO_IDENTIFY_TYPE = 3;

class PesoEmitter extends EventEmitter {}
const pesoEmitter = new PesoEmitter();

function interpretarTrama(trama, tipoDetectado, canalDetectado) {
  const longitudTrama = trama.length;
  const resultado = {
    canal: canalDetectado,
    tipo: tipoDetectado, // Este será 'S', 'J', 'I', 'D', 'P'
    datos: {},
    error: null,
    hex: mostrarTramaHex(trama),
    legible: mostrarTramaLegible(trama),
  };

  if (trama[0] !== BYTE_INICIO) {
    resultado.error = "Inicio inválido";
    return resultado;
  }

  const longitudEsperada = MESSAGE_LENGTHS[tipoDetectado];
  if (!longitudEsperada || longitudTrama !== longitudEsperada) {
    resultado.error = `Longitud incorrecta o tipo no manejado. Esperada para tipo ${tipoDetectado}: ${longitudEsperada}, Recibida: ${longitudTrama}`;
    return resultado;
  }

  try {
    if (tipoDetectado === "S") {
      // Mensaje de Peso Estático (ej. ASWWWWJERRRC<cr><lf>)
      const pesoRaw = trama.readUInt32LE(3);
      resultado.datos.peso = pesoRaw;
      resultado.datos.pesoInterpretado = `${pesoRaw} (unidades raw)`;

      resultado.datos.jitter = trama[7];
      resultado.datos.errorBits = trama[8];
      resultado.datos.descripcion = `Peso estático de báscula ${canalDetectado}`;
    } else if (tipoDetectado === "J") {
      // Mensaje de Jitter (AJDDDDDDEEEEEEC<cr><lf>)
      resultado.datos.jitterScaleA = trama[3];
      resultado.datos.jitterScaleB = trama[4];
      resultado.datos.jitterScaleC = trama[5];
      resultado.datos.jitterScaleD = trama[6];
      resultado.datos.jitterDualTireSensor = trama[7]; // Corregido
      resultado.datos.reservedJitter = trama[8];
      resultado.datos.errorBitsScaleA = trama[9];
      resultado.datos.errorBitsScaleB = trama[10];
      resultado.datos.errorBitsScaleC = trama[11];
      resultado.datos.errorBitsScaleD = trama[12];
      resultado.datos.errorBitsScaleE = trama[13];
      resultado.datos.ignoreErrorByteE = trama[14];
      resultado.datos.ignoreErrorByteC = trama[15];
      resultado.datos.descripcion = `Mensaje de Jitter. Canal '${canalDetectado}' es fijo 'A' para este tipo.`;
    } else if (tipoDetectado === "I") {
      // Mensaje de Inputs (AInTTTTDRC<cr><If>)
      const subTipoN = String.fromCharCode(trama[3]);
      resultado.tipo = `I${subTipoN}`;

      resultado.datos.subTipoN = subTipoN;
      resultado.datos.tiempo1 = trama.readUInt16LE(4);
      resultado.datos.tiempo2 = trama.readUInt16LE(6);
      const dataInputsByte = trama[8];
      resultado.datos.dataInputsByte = dataInputsByte;
      const bit4 = (dataInputsByte & 0b00010000) >> 4;
      resultado.datos.loopDetectorPresence =
        bit4 === 0 ? "Presencia Detectada" : "Sin Presencia";
      resultado.datos.descripcion = `Mensaje de Inputs (Loop/Beam). Subtipo: ${subTipoN}. Canal '${canalDetectado}' es fijo 'A'.`;
    } else if (tipoDetectado === "D") {
      // Mensaje de Peso Dinámico
      // Tiempos (Time2, Time3, Time4) en 24 bits (Little Endian)
      const time2 = trama.readUIntLE(10, 3); // x100 µs
      const time3 = trama.readUIntLE(13, 3); // µs
      const time4 = trama.readUIntLE(16, 3); // x10 µs

      // Pesos calibrados (32 bits)
      const sww1 = trama.readUInt32LE(19);
      const sww2 = trama.readUInt32LE(23);

      resultado.datos.time2 = time2;
      resultado.datos.time3 = time3;
      resultado.datos.time4 = time4;
      resultado.datos.sww1 = sww1;
      resultado.datos.sww2 = sww2;
      resultado.datos.descripcion = `Peso dinámico de báscula ${canalDetectado}.`;
    } else if (tipoDetectado === 'P') { // Mensaje de Doble Neumático
    const time1 = trama.readUIntLE(7, 3);   // x100 µs
    const time2 = trama.readUIntLE(10, 3);  // x100 µs
    const time4 = trama.readUIntLE(16, 3);  // x10 µs

    const peak1 = trama[19];
    const peak2 = trama[20];
    const zeroRef = trama[21];

    resultado.datos.time1 = time1;
    resultado.datos.time2 = time2;
    resultado.datos.time4 = time4;
    resultado.datos.peak1 = peak1;
    resultado.datos.peak2 = peak2;
    resultado.datos.zeroReference = zeroRef;

    resultado.datos.dobleNeumaticoDetectado = peak2 !== 0;
    resultado.datos.descripcion = `Mensaje de detección de doble neumático. Canal fijo 'E'.`;
}


    // Añadir 'else if' para otros tipos como 'D' (Dynamic) y 'P' (Dual Tire) aquí
  } catch (e) {
    resultado.error = `Error al parsear trama tipo ${tipoDetectado}: ${e.message}`;
  }

  return resultado;
}

function mostrarTramaHex(trama) {
  return Array.from(trama)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
}

function mostrarTramaLegible(trama) {
  let endIdx = trama.length;
  // Excluir <cr><lf> si están al final
  if (
    trama.length >= 2 &&
    trama[trama.length - 2] === 0x0d &&
    trama[trama.length - 1] === 0x0a
  ) {
    endIdx -= 2;
  } else if (
    trama.length >= 1 &&
    (trama[trama.length - 1] === 0x0d || trama[trama.length - 1] === 0x0a)
  ) {
    endIdx -= 1;
  }
  return Array.from(trama.slice(0, endIdx))
    .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : "."))
    .join("");
}

function main() {
  const client = new net.Socket();
  let buffer = Buffer.alloc(0);

  console.log(`Conectando a ${HOST}:${PORT}...`);

  client.connect(PORT, HOST, () => {
    state.estadoBasculaDinamica = true
    console.log(`Conectado a ${HOST}:${PORT}. Escuchando tramas...`);
  });

  client.on("data", (data) => {
    buffer = Buffer.concat([buffer, data]);

    while (true) {
      const inicio = buffer.indexOf(BYTE_INICIO);
      if (inicio === -1) {
        if (buffer.length > 1024) {
          console.warn(
            "Buffer grande sin byte de inicio, descartando parte del buffer."
          );
          buffer = buffer.slice(buffer.length - 256);
        }
        break;
      }

      if (inicio > 0) {
        buffer = buffer.slice(inicio);
      }

      if (buffer.length < MIN_LEN_TO_IDENTIFY_TYPE) {
        break;
      }

      const charCanalProtocolo = String.fromCharCode(buffer[1]);
      const charTipoProtocolo = String.fromCharCode(buffer[2]);

      let tipoMensajeReal;
      let longitudEsperadaTrama;
      let canalParaParseo = charCanalProtocolo;

      if (charCanalProtocolo === "A" && charTipoProtocolo === "I") {
        tipoMensajeReal = "I";
      } else if (charCanalProtocolo === "A" && charTipoProtocolo === "J") {
        tipoMensajeReal = "J";
      } else if (charCanalProtocolo === "E" && charTipoProtocolo === "P") {
        tipoMensajeReal = "P";
      } else if (
        ["A", "B", "C", "D"].includes(charCanalProtocolo) &&
        ["S", "D"].includes(charTipoProtocolo)
      ) {
        tipoMensajeReal = charTipoProtocolo;
      } else {
        console.warn(
          `Secuencia de inicio desconocida: (${charCanalProtocolo}${charTipoProtocolo}. Descartando byte de inicio y reintentando.`
        );
        buffer = buffer.slice(1);
        continue;
      }

      longitudEsperadaTrama = MESSAGE_LENGTHS[tipoMensajeReal];

      if (!longitudEsperadaTrama) {
        console.error(
          `Error interno: Longitud no definida para tipo '${tipoMensajeReal}'. Descartando byte de inicio.`
        );
        buffer = buffer.slice(1);
        continue;
      }

      if (buffer.length < longitudEsperadaTrama) {
        break;
      }

      const tramaCompleta = buffer.slice(0, longitudEsperadaTrama);
      buffer = buffer.slice(longitudEsperadaTrama);

      const resultadoParseo = interpretarTrama(
        tramaCompleta,
        tipoMensajeReal,
        canalParaParseo
      );

      if (resultadoParseo.error) {
        console.log(
          `TRAMA INVÁLIDA: ${resultadoParseo.hex} | ${resultadoParseo.legible} -> ${resultadoParseo.error}`
        );
      } else {
        if (resultadoParseo.tipo === "S") {
          pesoEmitter.emit("peso", resultadoParseo);
          console.log(
            `PESO ESTÁTICO: Canal ${resultadoParseo.canal} | Peso: ${resultadoParseo.datos.pesoInterpretado} | Hex: ${resultadoParseo.hex} | Legible: ${resultadoParseo.legible}`
          );
        } else if (resultadoParseo.tipo === "J") {
          console.log(
            `JITTER: Canal ${resultadoParseo.canal} | Jitter A: ${resultadoParseo.datos.jitterScaleA}, B: ${resultadoParseo.datos.jitterScaleB}, C: ${resultadoParseo.datos.jitterScaleC}, D: ${resultadoParseo.datos.jitterScaleD} | Hex: ${resultadoParseo.hex} | Legible: ${resultadoParseo.legible}`
          );
        } else if (
          resultadoParseo.tipo &&
          resultadoParseo.tipo.startsWith("I")
        ) {
          console.log(
            `INPUTS: Canal ${resultadoParseo.canal} | Tipo ${resultadoParseo.tipo} | Loop: ${resultadoParseo.datos.loopDetectorPresence} | T1: ${resultadoParseo.datos.tiempo1}, T2: ${resultadoParseo.datos.tiempo2} | Hex: ${resultadoParseo.hex} | Legible: ${resultadoParseo.legible}`
          );
          if(resultadoParseo.datos.loopDetectorPresence == "Presencia Detectada"){
            pesoEmitter.emit("peso", {caseNumber: 1, data: resultadoParseo});
          }else {
             pesoEmitter.emit("peso", {caseNumber: 3, data: resultadoParseo});
          }
          
        } else {
          console.log(
            `OTRA TRAMA: Canal ${resultadoParseo.canal} | TIPO ${
              resultadoParseo.tipo
            } | Datos: ${JSON.stringify(resultadoParseo.datos)} | Hex: ${
              resultadoParseo.hex
            } | Legible: ${resultadoParseo.legible}`
          );

          pesoEmitter.emit("peso", {caseNumber: 2, data: resultadoParseo});
        }
      }
    }
  });

  client.on("close", () => console.log("Conexión cerrada."));
  client.on("error", (err) =>{
    state.estadoBasculaDinamica = false
    console.error(`Error de conexión: ${err.message}`)
  });
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
  pesoEmitter,
  interpretarTrama,
};
