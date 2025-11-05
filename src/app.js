const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");

const routes = require("./routes");
const { registerSocketEvents } = require("./events/socketEvents");
const { inicializarEventos } = require("./events/pesoEvents");
const { iniciarServidorTCP, getTcpSocket } = require("./events/tcpServer");
const { iniciarAnprServer, iniciarAnprServerEstatica } = require("./events/placaEvent");
// const { iniciarEmuladorCamara } = require("./simulators/placaEmulator");
// const { iniciarEmuladorCamaraEjes } = require("./simulators/CamaraEjesEmulator");
const { iniciarServidorConteoEjes } = require("./events/camaraCategoriasEvent");
const { iniciarPLC } = require("./controllers/plcController");
const { supervisionPlc } = require("./services/supervisionPlc");
const { iniciarPuertoPeaje } = require("./events/peajeEvent");
const { getAllInitData } = require("./controllers/inicioController");
// const { state } = require("./utils/systemSate");

const app = express();

// ================= EXPRESS + SOCKET.IO =================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(routes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", credentials: false } });
registerSocketEvents(io);

setTimeout(() => {
        // iniciarEmuladorCamaraEjes()
        // iniciarEmuladorCamara();
        supervisionPlc()
}, 5000);

setTimeout(async() => {
    const data = await getAllInitData(io)
    if(data) {
    
        //iniciarPuertoPeaje
        iniciarPuertoPeaje()
        // Inicializamos eventos que usan TCP + Websockets
        inicializarEventos(io, getTcpSocket);

        // ================= TCP SERVER =================
        iniciarServidorTCP(4000);

        // Reconocimiento de placas
        iniciarAnprServer();

        //placas estatica
        iniciarAnprServerEstatica()

        //reconocimiento de ejes
        iniciarServidorConteoEjes();

        //Plc
        iniciarPLC();

        io.emit("loader", {loader: false, msg: "Datos cargados correctamente"});
      

    }

}, 2000);
// Exportamos
module.exports = { app, server, io, getTcpSocket };








