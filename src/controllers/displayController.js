const net = require("net");
const { state } = require("../utils/systemSate");

let mensajePersonalizadoEstable = null;

// 🔹 Convierte texto a hexadecimal
const stringAHex = (mensaje) =>
  mensaje.split("").map((c) => c.charCodeAt(0).toString(16)).join("");

// 🔹 Envía buffer a display genéricamente
const enviarTrama = (ip, puerto, mensajeHex, mensaje = "", bascula) => {

  
  if (!mensajeHex) return;
  const client = new net.Socket();

  client.connect(puerto, ip, () => {
    console.log(`✅ Conectado al display ${ip}:${puerto}`);
    client.write(mensajeHex);
    console.log(`Trama enviada: ${mensaje}`);
    if(bascula === "estatica"){
      state.estadoDisplayEstatica = true
    }else {
      state.estadoDisplayIngresoEstacion = true
    }
    client.end();
  });

  client.on("error", (err) => {
    if(bascula === "estatica"){
      state.estadoDisplayEstatica = false
    }else {
      state.estadoDisplayIngresoEstacion = false
    }
    console.error(`❌ Error al enviar mensaje: ${err.message}`)
  });
};

// 🔹 Plantillas HEX comunes
const tramasPredefinidas = {
  adelante:
    "244D534A32313323506F72206661766F722C20646573706C61636520656C207665686963756C6F206861636961206164656C616E74652E250A",
  atras:
    "244D534A32313323506F72206661766F722C206465206D617263686120617472617320616C207665686963756C6F2E250A",
  inactivo:
    "244D534A323133234175746F7069737461732044656C2043616665202F2043617264696E616C20436F6C6F6D62696120526563756572646520546F6D617220537520546971756574652050726573696F6E616E646F20456C20426F746F6E250A",
  vel: "2456454C37250A",
};

// 🔹 Envía mensaje al display de pesaje estático
async function enviarMensajeDisplay(mensaje, mensajePersonalizado, ) {
  
  const { portDisplayEstatica: puerto, ipDisplayEstatica: ip } = state;

  let mensajeHex = null;
  mensajePersonalizadoEstable = mensajePersonalizado;

  if (tramasPredefinidas[mensaje]) {
    mensajeHex = Buffer.from(tramasPredefinidas[mensaje], "hex");
  } else if (mensaje === "personalizado" && mensajePersonalizadoEstable) {
    const hexMsg = stringAHex(mensajePersonalizadoEstable);
    const trama = `244D534A323133234175746F7069737461732044656C2043616665202F2043617264696E616C20436F6C6F6D62696120526563756572646520546F6D617220537520546971756574652050726573696F6E61646F20456C20426F746F6E2020${hexMsg}250A`;
    mensajeHex = Buffer.from(trama, "hex");
  } else if (mensaje === "borrar") {
    mensajePersonalizadoEstable = null;
    return;
  }

  enviarTrama(ip, puerto, mensajeHex, mensaje, 'estatica');
}

// 🔹 Plantillas para el display de ingreso
const tramasIngreso = {
  Bienvenido:
    "244D534A333133234269656E76656E69646F2061206C61204573746163696F6E20446520506573616A652044652043616C617263612E250A",
  cerrada:
    "244D534A3231332342617363756C61204365727261646120446972696A617365206120566961204E6163696F6E616C2E250A",
  solo_dinamica:
    "244D534A33313323446972696A617365206120566961204E6163696F6E616C2E250A",
  solo_estatica: "244D534A33313323446972696A61736520612042617363756C612E250A",
  no_ingreso_dinamica:
    "244D534A3331332342617363756C6120436572726164612C20446972696A617365206120566961204E6163696F6E616C2E250A",
  vel: "2456454C30250A",
};

// 🔹 Envía mensaje al display de ingreso a la estación
async function enviarMensajeDisplay2(mensaje) {
  try {
    const { portDisplayIngresoEstacion: puerto, ipDisplayIngresoEstacion: ip } = state;
    let mensajeHex;

    if (tramasIngreso[mensaje]) {
      mensajeHex = Buffer.from(tramasIngreso[mensaje], "hex");
    } else {
      const hexStr = stringAHex(mensaje);
      mensajeHex = Buffer.from(`${hexStr}250A`, "hex");
    }

    enviarTrama(ip, puerto, mensajeHex, mensaje, 'dinamica');
  } catch (error) {
    console.error("Error en enviarMensajeDisplay2:", error.message);
  }
}

// 🔹 Envía mensaje al display de Contelect
async function enviarMensajeDisplayContelect() {
  try {
    const { portDisplayContelect: puerto, ipDisplayContelect: ip } = state;
    enviarTrama(ip, puerto, Buffer.from("2456454C30250A", "hex"), "Contelect");
  } catch (error) {
    console.error("Error en enviarMensajeDisplayContelect:", error.message);
  }
}

module.exports = {
  enviarMensajeDisplay,
  enviarMensajeDisplay2,
  enviarMensajeDisplayContelect,
};
