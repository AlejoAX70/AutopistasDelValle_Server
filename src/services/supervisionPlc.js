const { enviarMensajeDisplay } = require("../controllers/displayController");
const {
  node25f,
  node26f,
  node51f,
  node52f,
  node35f,
  node34f,
  node33f,
  node36f,
  node38f,
  node39f,
  node37f,
  no_ingreso_dinamica,
  ingreso_dinamica,
  salida_nacional,
  ingreso_estatica,
  solo_nacional,
  automatico,
  solo_estatica,
  node46f,
  node54f,
  node55f,
  node57f,
  node56f,
  node60f,
  node58f,
  node59f,
  node61f,
  autorizarPesaje,
  no_runtF,
  sobrePeso,
  node28f,
} = require("../controllers/plcController");
const { state } = require("../utils/systemSate");

async function supervisionPlc() {
  try {
    await automatico();
    const leerVariables = async () => {
      const node25 = await node25f();
      const node26 = await node26f();
      const node51 = await node51f();
      const node52 = await node52f();
      const node46 = await node46f();
      const node54 = await node54f();
      const node55 = await node55f();
      const node57 = await node57f();
      const node56 = await node56f();
      const node60 = await node60f();
      const node58 = await node58f();
      const node59 = await node59f();
      const node61 = await node61f();

      const node28 = await node28f();
      const value46 = node46?.value.value || "";
      const value54 = node54?.value.value || "";
      const value55 = node55?.value.value || "";
      const value57 = node57?.value.value || "";
      const value56 = node56?.value.value || "";
      const value60 = node60?.value.value || "";
      const value58 = node58?.value.value || "";
      const value59 = node59?.value.value || "";
      const value61 = node61?.value.value || "";

      const value28 = node28?.value.value || "";

      state.numeroVehiculos = value28;
      state.autorizaPesaje = value46;
      state.no_runt = value54;
      state.semafotoIngresoEstacionRojo = value55;
      state.semafotoIngresoEstacionVerde = value57;
      state.semaforoIngresoEstaticaRojo = value56;
      state.semaforoIngresoEstaticaVerde = value60;

      state.semaforoSalidaNacionalRojo = value58;
      state.semaforoSalidaNacionalVerde = value59;

      state.semaforoEstaticaSobrePeso = value61;

      const value25 = node25?.value.value || "";
      const value26 = node26?.value.value || "";
      const value51 = node51?.value.value || "";
      const value52 = node52?.value.value || "";

      if (value26 || value51) {
        if (state.ultimoMensaje != "adelante") {
          enviarMensajeDisplay("adelante");
          state.ultimoMensaje = "adelante";
        }
      } else if (value25 || value52) {
        if (state.ultimoMensaje != "atras") {
          enviarMensajeDisplay("atras");
          state.ultimoMensaje = "atras";
        }
      } else if (!value25 && !value26 && !value51 && !value52) {
        if (state.enviandoMensajePersonalizado && state.ultimoMensaje !== "personalizado") {
          enviarMensajeDisplay("personalizado");
          state.ultimoMensaje = "personalizado";
        } else if (
          !state.enviandoMensajePersonalizado &&
          state.ultimoMensaje !== "inactivo"
        ) {
          enviarMensajeDisplay("inactivo");
          state.ultimoMensaje = "inactivo";
        }
      }
    };

    setInterval(() => {
      leerVariables();
    }, 2000);
  } catch (error) {
    console.log("Error setTimeOut 325: ", error);
  }
}

module.exports = {supervisionPlc}
