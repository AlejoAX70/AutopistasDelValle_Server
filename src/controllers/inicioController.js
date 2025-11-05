const { getConnection, sql } = require("../database/connection");
const { state } = require("../utils/systemSate");

async function getConfigValues(pool, params) {
  const query = `
    SELECT [parametro], [valor]
    FROM [dinamica2].[dbo].[configuraciones]
    WHERE parametro IN (${params.map(p => `'${p}'`).join(", ")});
  `;
  const result = await pool.request().query(query);
  return result.recordset;
}

async function getAllInitData(io) {
  
  try {
    io.emit("loader", {loader: true, msg: "Cargando datos iniciales...."});
    const pool = await getConnection();

    // Define los grupos de parámetros que quieres leer
    const configGroups = {
      rutaFotosDinamica: ["RUTA_IMAGENES_DINAMICA"],
      camaraPlacas: ["IP_CAMARA_PLACAS", "PUERTO_CAMARA_PLACAS"],
      peaje: ["IP_PEAJE", "PUERTO_PEAJE"],
      plc: ["IP_PLC", "PORT_PLC"],
      displayContelect: ["IP_DISPLAY_CONTELECT", "PUERTO_DISPLAY_CONTELECT"],
      displayEstatica: ["IP_DISPLAY_ESTATICA", "PUERTO_DISPLAY_ESTATICA"],
      displayIngreso: ["IP_DISPLAY", "PUERTO_DISPLAY"],
      ingresoDinamica: ["ingresoDinamica"],
      No_ingresoDinamica: ["No_ingresoDinamica"],
      soloDinamica: ["soloDinamica"],
      soloEstatica: ["soloEstatica"],
      operacionNormal: ["operacionNormal"],
      ingresoEstatica: ["ingresoEstatica"],
      salidaNacional: ["salidaNacional"],
      autorizarPesaje: ['autorizarPesaje'],
      noRunt: ['noRunt']
    };

    // Ejecuta todas las consultas en paralelo
    const [
      rutaFotos,
      camaraPlacas,
      peaje,
      plc,
      contelect,
      estatica,
      ingreso,
      ingresoDinamica,
      No_ingresoDinamica,
      soloDinamica,
      soloEstatica,
      operacionNormal,
      ingresoEstatica,
      salidaNacional,
      autorizarPesaje,
      noRunt
    ] = await Promise.all(
      Object.values(configGroups).map(params => getConfigValues(pool, params))
    );

    if(ingresoDinamica.length > 0){
      state.ingresoDinamicaState = ingresoDinamica[0].valor
    }

    if(No_ingresoDinamica.length > 0){
      state.No_ingresoDinamicaState = No_ingresoDinamica[0].valor
    }

    if(soloDinamica.length > 0){
      state.soloDinamicaState = soloDinamica[0].valor
    }

    if(soloEstatica.length > 0){
      state.soloEstaticaState = soloEstatica[0].valor
    }

    if(operacionNormal.length > 0){
      state.operacionNormalState = operacionNormal[0].valor
    }

     if(ingresoEstatica.length > 0){
      state.ingresoEstaticaState = ingresoEstatica[0].valor
    }

    if(salidaNacional.length > 0){
      state.salidaNacionalState = salidaNacional[0].valor
    }

    if(autorizarPesaje.length > 0){
      state.autorizarPesajeState = autorizarPesaje[0].valor
    }

    if(noRunt.length > 0){
      state.noRuntState = noRunt[0].valor
    }
    
    // Asignaciones automáticas
    if (rutaFotos.length > 0) state.rutaFotoPlaca = rutaFotos[0].valor;
    if (camaraPlacas.length > 1) {
      state.IpCamaraPlaca = camaraPlacas[0].valor;
      state.puertoCamaraPlaca = camaraPlacas[1].valor;
    }
    if (peaje.length > 1) {
      state.ipPeaje = peaje[0].valor;
      state.puertoPeaje = peaje[1].valor;
    }
    if (plc.length > 1) {
      state.plcIp = plc[0].valor;
      state.plcPort = plc[1].valor;
    }
    if (contelect.length > 1) {
      state.ipDisplayContelect = contelect[0].valor;
      state.portDisplayContelect = contelect[1].valor;
    }
    if (estatica.length > 1) {
      state.ipDisplayEstatica = estatica[0].valor;
      state.portDisplayEstatica = estatica[1].valor;
    }
    if (ingreso.length > 1) {
      state.ipDisplayIngresoEstacion = ingreso[0].valor;
      state.portDisplayIngresoEstacion = ingreso[1].valor;
    }

    // Puedes devolver algo informativo
    return true;

  } catch (error) {
    io.emit("loader", {loader: false, msg: "Algunos datos no cargaron, revisa los logs"});
    console.error("Error en getAllInitData:", error);
    return false;
  }
}

module.exports = { getAllInitData };
