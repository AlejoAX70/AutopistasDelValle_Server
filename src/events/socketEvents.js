const {
  state
} = require("../utils/systemSate"); // 👈 variables centralizadas en un módulo

function registerSocketEvents(io) {
  io.on("connection", (socket) => {
    setTimeout(() => {
        io.emit("port", {port: state.port});
    }, 3000);
    console.log("🔌 Cliente conectado");
    const interval = setInterval(() => {
      socket.emit("autorizar_pesaje", state.autorizaPesaje);
      socket.emit("no_runt", state.no_runt);
      socket.emit("semaforo_ingreso_estacion_rojo", state.semafotoIngresoEstacionRojo);
      socket.emit("semaforo_ingreso_estacion_verde", state.semafotoIngresoEstacionVerde);
      socket.emit("semaforo_ingreso_estatica_rojo", state.semaforoIngresoEstaticaRojo);
      socket.emit("semaforo_ingreso_estatica_verde", state.semaforoIngresoEstaticaVerde);
      socket.emit("semaforo_salida_nacional_rojo", state.semaforoSalidaNacionalRojo);
      socket.emit("semaforo_salida_nacional_verde", state.semaforoSalidaNacionalVerde);
      socket.emit("semaforo_estatica_sobre_peso", state.semaforoEstaticaSobrePeso);
      socket.emit("estado_bascula_dinamica", state.estadoBasculaDinamica);
      socket.emit("estado_diplay_estatica", state.estadoDisplayEstatica);
      socket.emit("estado_display_dinamica", state.estadoDisplayIngresoEstacion);
      socket.emit("estado_plc", state.estadoPlc);
      socket.emit("numero_vehiculos", state.numeroVehiculos);
    }, 1000);

    socket.on("disconnect", () => {
      console.log("❌ Cliente desconectado");
      clearInterval(interval);
    });
  });
}

module.exports = { registerSocketEvents };
