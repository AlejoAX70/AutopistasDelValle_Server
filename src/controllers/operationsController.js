const { state } = require("../utils/systemSate");
const { enviarMensajeDisplay2, enviarMensajeDisplay } = require("./displayController");
const {
  no_ingreso_dinamica,
  ingreso_dinamica,
  salida_nacional,
  autorizarPesaje,
  no_runtF,
  ingreso_estatica,
  solo_estatica,
  solo_nacional,
  automatico,
  sobrePeso,
} = require("./plcController");

async function dinamicaCerrada(req, res) {
  try {
    enviarMensajeDisplay2("no_ingreso_dinamica");
    await no_ingreso_dinamica();
    res.send({ message: "no_ingreso_dinamica" });
  } catch (error) {
    console.log(error);
    res.send({ error: "no_ingreso_dinamica" });
  }
}

async function dinamicaAbierta(req, res) {
  try {
    enviarMensajeDisplay2("Bienvenido");
    await ingreso_dinamica();
    res.send({ message: "ingreso_dinamica" });
  } catch (error) {
    console.log(error);
    res.send({ error: "no_ingreso_dinamica" });
  }
}

async function soloBasculaDinamica(req, res) {
  try {
    enviarMensajeDisplay2("solo_dinamica");
    await salida_nacional();
    res.send({ message: "solo_dinamica" });
  } catch (error) {
    console.log(error);
    res.send({ error: "no_ingreso_dinamica" });
  }
}

async function autorizarPesajeApi(req, res) {
  try {
    console.log("autorizarPesajeApi");
    
    await autorizarPesaje(!state.autorizaPesaje);
    res.send({ message: "autorizar_pesaje" });
  } catch (error) {
    console.log(error);
    res.send({ error: "autorizar_pesaje" });
  }
}

async function noRunt(req, res) {
  try {
    console.log("noRunt");
    await no_runtF(!state.no_runt);
    res.send({ message: "no_runt" });
  } catch (error) {
    console.log(error);
    res.send({ error: "no_runt", msg: error });
  }
}

async function IngresoEstatica(req, res) {
  try {
    enviarMensajeDisplay2("IngresoEstatica");
    await ingreso_estatica();
    res.send({ message: "ingreso_estatica" });
  } catch (error) {
    console.log(error);
  }
}

async function soloEstatica(req, res) {
  try {
    enviarMensajeDisplay2("solo_estatica");
    await solo_estatica();
    res.send({ message: "solo_estatica" });
  } catch (error) {
    console.log(error);
    res.send({ error: "solo_estatica" });
  }
}

async function soloNacional(req, res) {
  try {
    enviarMensajeDisplay2("solo_dinamica");
    await solo_nacional();
    res.send({ message: "solo_nacional" });
  } catch (error) {
    console.log(error);
    res.send({ error: "solo_nacional" });
  }
}

async function automaticoApi(req, res) {
  try {
    await automatico();
    res.send({ message: "automatico" });
  } catch (error) {
    res.send({ error: "automatico" });
    console.log(error);
  }
}

async function borrarMensaje(req, res) {
  try {
    enviarMensajeDisplay("borrar");

    setTimeout(() => {
      enviarMensajeDisplay("inactivo");
    }, 1000);

    res.send({ message: "borrar" });
  } catch (error) {
    res.send({ error: "error al borrar" });
    console.log(error);
  }
}

async function sobrePesoApi(req, res) {
  try {
    await sobrePeso();
    res.send({ message: "sobre_peso" });
  } catch (error) {
    res.send({ error: "sobre_peso" });
    console.log(error);
  }
}
async function displayPersonalizado(req, res) {
  console.log("POST request received:", req.body); // Verificar si los datos están llegando
  const { mensaje } = req.body;

  if (!mensaje) {
    console.log("Mensaje no recibido correctamente");
    return res.status(400).send({ error: "Falta el mensaje" });
  }

  try {
    enviarMensajeDisplay("personalizado", `${mensaje}`);
    console.log("Mensaje enviado correctamente");
    res.status(200).send({ message: "Mensaje enviado" });
  } catch (error) {
    console.error("Error al enviar el mensaje:", error);
    res.status(500).send({ error: "Error al enviar el mensaje" });
  }
}

module.exports = {
  dinamicaCerrada,
  dinamicaAbierta,
  soloBasculaDinamica,
  autorizarPesajeApi,
  noRunt,
  IngresoEstatica,
  soloEstatica,
  soloNacional,
  automaticoApi,
  displayPersonalizado,
  borrarMensaje,
  sobrePesoApi
};
