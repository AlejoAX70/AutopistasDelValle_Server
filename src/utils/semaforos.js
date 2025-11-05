let estado = {
  ingresoEstatica: { verde: false, rojo: false },
  ingresoEstacion: { verde: false, rojo: false },
  salidaNacional: { verde: false, rojo: false },
  estaticaSobrePeso: false,
};

function setSemaforoSobrepeso() {
  estado.ingresoEstatica.verde = true;
  estado.ingresoEstatica.rojo = false;
  estado.salidaNacional.verde = false;
  estado.salidaNacional.rojo = true;
  estado.estaticaSobrePeso = true;
}

function setSemaforoEnNorma() {
  estado.salidaNacional.verde = true;
  estado.salidaNacional.rojo = false;
  estado.ingresoEstatica.verde = false;
  estado.ingresoEstatica.rojo = true;
  estado.estaticaSobrePeso = false;
}

module.exports = { estado, setSemaforoSobrepeso, setSemaforoEnNorma };
