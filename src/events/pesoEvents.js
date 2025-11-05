const { pesoEmitter } = require("../controllers/pesoController");
const {
  cargarCategorias,
  clasificarVehiculo,
} = require("../services/clasificacionService");

const { performance } = require("perf_hooks");
const { sensores, pesos, vehiculoActual } =
  require("../utils/systemSate").state;
const { state } = require("../utils/systemSate");
const { getConnection, sql } = require("../database/connection");
const { ingreso_estatica, salida_nacional } = require("../controllers/plcController");

// Aquí mueves todo el switch (case 0,1,2,3,4)
// y lo de emitir el paquete al frontend con `io.emit`

function inicializarEventos(io, getTcpSocket) {
  pesoEmitter.on("peso", async ({ caseNumber, data }) => {
    switch (caseNumber) {
      case 0:
        break;

      case 1:
        state.loop = "Encendido";
        state.sensores.A = [];
        state.sensores.B = [];
        state.sensores.C = [];
        state.sensores.D = [];
        break;

      case 2:
        console.log("caseNumber 2", data);
        const { canal, tipo, datos } = data;

        if (tipo == "I1") {
          return null;
        }

        const nuevoTiempoManual = Math.floor(performance.now());

        const existe = state.vehiculoActual.some(
          (v) => v.canal === canal && v.timepoManual === nuevoTiempoManual
        );

        if (!existe) {
          state.vehiculoActual.push({
            canal,
            tipo,
            peso1: datos.sww1,
            peso2: datos.sww2,
            time2: datos.time2,
            time3: datos.time3,
            time4: datos.time4,
            descripcion: datos.descripcion,
            datos,
            timepoManual: nuevoTiempoManual,
          });

          if (state.loop === "Apagado") {
            console.log("Condicion apagado", state.sensores);

            state.sensores.A = [];
            state.sensores.B = [];
            state.sensores.C = [];
            state.sensores.D = [];
            pesoEmitter.emit("peso", { caseNumber: 3, data: {} });
          }
        } else {
          console.log("Ya existe un objeto con el mismo canal y tiempoManual");
        }

        for (const canal in state.sensores) {
          state.sensores[canal].sort((a, b) => a.datos.time2 - b.datos.time2);
        }
        break;

      case 3:
        console.log("caseNumber 3", data);
        console.log("vehiculoActual 3", state.vehiculoActual);

        state.loop = "Apagado";
        state.vehiculoActual.forEach((registro) => {
          const canal = registro.canal;
          if (state.sensores[canal]) {
            state.sensores[canal].push(registro);
          }
        });

        Object.keys(state.sensores).forEach((canal) => {
          const registros = state.sensores[canal];

          for (let i = 1; i < registros.length; i++) {
            const actual = registros[i];
            const anterior = registros[i - 1];
            actual.diferenciaManual =
              actual.timepoManual - anterior.timepoManual;
          }
        });

        if (state.sensores.A.length == state.sensores.B.length) {
          console.log("Vehiculo finalizado");
          pesoEmitter.emit("peso", { caseNumber: 4, data: {} });
        }
        break;

      case 4:
        // Calcular distancias
        state.sensores.B.forEach((itemB, index) => {
          const itemA = state.sensores.A[index];
          if (
            itemA &&
            typeof itemA.timepoManual === "number" &&
            typeof itemB.timepoManual === "number"
          ) {
            itemB.diferenciaAB = itemB.timepoManual - itemA.timepoManual;
            itemB.velocidad = 3 / itemB.diferenciaAB;
          } else {
            itemB.diferenciaAB = null;
            itemB.velocidad = null;
          }
        });

        for (let index = 0; index < state.sensores.B.length; index++) {
          const itemA = state.sensores.A[index + 1];
          const itemB = state.sensores.B[index];

          itemA
            ? (itemB.distancia = itemB.velocidad * itemA.diferenciaManual ?? 0)
            : (itemB.distancia = 0);
        }

        const nuevoArreglo = state.sensores.B.filter(
          (item) => item.distancia > 0
        ).map((item) => item.distancia);

        if (!state.categoriasCache) {
          await cargarCategorias();
        }

        const clasificacion = clasificarVehiculo(
          nuevoArreglo,
          state.categoriasCache
        );

        // ========================
        // Guardar en la BD
        // ========================
        (async () => {
          try {
            const pool = await getConnection();

            console.log("Clasificación del vehículo:", clasificacion);

            // 🔎 1. Buscar el peso máximo de la categoría clasificada
            const pesoQuery = await pool
              .request()
              .input(
                "Categoria",
                sql.VarChar(50),
                clasificacion ? clasificacion : "OTROS"
              ).query(`
          SELECT TOP 1 pesoMaximo 
          FROM categorias 
          WHERE categoria = @Categoria
        `);

            let pesoMaximo = null;
            if (pesoQuery.recordset.length > 0) {
              pesoMaximo = pesoQuery.recordset[0].pesoMaximo;
            }

            console.log(
              `Peso máximo para la categoría ${clasificacion}:`,
              pesoMaximo
            );

            // 2. Insertar paso de vehículo con el peso máximo
          

            // Traer los límites por eje de la categoría clasificada
            const limitesEjesQuery = await pool
              .request()
              .input("Categoria", sql.VarChar(50), clasificacion).query(`
              SELECT le.NumeroEje, le.PesoMaximoPermitido
              FROM LimitesEjesCategoria le
              JOIN Categorias c ON le.CategoriaId = c.id_dinamica
              WHERE c.categoria = @Categoria
              ORDER BY le.NumeroEje
            `);

            const limitesEjes = limitesEjesQuery.recordset;
            console.log("📌 Límites legales por eje:", limitesEjes);

            const pesosEjes = sensores.B.map((itemB, index) => {
              const itemD = sensores.D[index];

              const pesoIzq = (itemB.peso1 ?? 0) + (itemB.peso2 ?? 0);
              const pesoDer = itemD
                ? (itemD.peso1 ?? 0) + (itemD.peso2 ?? 0)
                : 0;

              const pesoPromedio = (pesoIzq + pesoDer) / (itemD ? 2 : 1);

              return {
                numeroEje: index + 1,
                peso: pesoPromedio,
              };
            });

            let cumpleNorma = true;
            for (const eje of pesosEjes) {
              const limite = limitesEjes.find(
                (l) => l.NumeroEje === eje.numeroEje
              );
              if (limite) {
                if (eje.peso > limite.PesoMaximoPermitido) {
                  cumpleNorma = false;
                  console.log(
                    `⚠️ Eje ${eje.numeroEje} excede: ${eje.peso} > ${limite.PesoMaximoPermitido}`
                  );
                } else {
                  console.log(
                    `✅ Eje ${eje.numeroEje} dentro del límite (${eje.peso}/${limite.PesoMaximoPermitido})`
                  );
                }
              }
            }
            
            const pesosPorEje = pesosEjes.map((eje) => {
                const limite = limitesEjes.find(
                  (l) => l.NumeroEje === eje.numeroEje
                );
                return {
                  numeroEje: eje.numeroEje,
                  pesoRegistrado: eje.peso,
                  pesoPermitido: limite?.PesoMaximoPermitido ?? 0,
                  exceso: limite
                    ? Math.max(0, eje.peso - limite.PesoMaximoPermitido)
                    : 0,
                };
              })

            const pesoTotal = pesosPorEje.reduce((sum, eje) => sum + eje.pesoRegistrado, 0);

              const vehiculoResult = await pool
              .request()
              .input("Placa", sql.VarChar(20), state.placa || "XXX000") // puedes reemplazar por placa real
              .input(
                "Categoria",
                sql.VarChar(50),
                state.categoriaVehiculo ? state.categoriaVehiculo : "OTROS"
              )
              .input("CantidadEjes", sql.Int, sensores.B.length)
              .input("Evasor", sql.Bit, pesoTotal > pesoMaximo  ? 1 : cumpleNorma ? 0 : 1)
              .input("PesoMaximo", sql.Decimal(10, 2), pesoMaximo ?? 0).query(`
          INSERT INTO VehiculosEnDinamica (Placa, Categoria, CantidadEjes, PesoMaximo, FechaRegistro, Evasor)
          OUTPUT INSERTED.VehiculoId
          VALUES (@Placa, @Categoria, @CantidadEjes, @PesoMaximo, SYSDATETIME(), @Evasor)
        `);

            const vehiculoId = vehiculoResult.recordset[0].VehiculoId;

            for (const eje of pesosEjes) {
              const limite = limitesEjes.find(
                (l) => l.NumeroEje === eje.numeroEje
              );
              const exceso = limite
                ? Math.max(0, eje.peso - limite.PesoMaximoPermitido)
                : 0;

              await pool
                .request()
                .input("VehiculoId", sql.Int, vehiculoId)
                .input("NumeroEje", sql.Int, eje.numeroEje)
                .input("PesoRegistrado", sql.Decimal(10, 2), eje.peso)
                .input(
                  "PesoPermitido",
                  sql.Decimal(10, 2),
                  limite?.PesoMaximoPermitido ?? 0
                )
                .input("Exceso", sql.Decimal(10, 2), exceso).query(`
                INSERT INTO PesosPorEje (VehiculoId, NumeroEje, PesoRegistrado, PesoPermitido, Exceso)
                VALUES (@VehiculoId, @NumeroEje, @PesoRegistrado, @PesoPermitido, @Exceso)
              `);
            }

            // 2. Insertar lecturas de todos los sensores
            for (const canal in sensores) {
              for (const lectura of sensores[canal]) {
                await pool
                  .request()
                  .input("VehiculoId", sql.Int, vehiculoId)
                  .input("Canal", sql.Char(1), lectura.canal)
                  .input("Tipo", sql.VarChar(5), lectura.tipo)
                  .input("Peso1", sql.Decimal(10, 2), lectura.peso1)
                  .input("Peso2", sql.Decimal(10, 2), lectura.peso2)
                  .input("Time2", sql.BigInt, lectura.time2)
                  .input("Time3", sql.BigInt, lectura.time3)
                  .input("Time4", sql.BigInt, lectura.time4)
                  .input("TiempoManual", sql.BigInt, lectura.timepoManual)
                  .input(
                    "DiferenciaManual",
                    sql.BigInt,
                    lectura.diferenciaManual ?? null
                  )
                  .input(
                    "DiferenciaAB",
                    sql.Decimal(10, 2),
                    lectura.diferenciaAB ?? null
                  )
                  .input(
                    "Velocidad",
                    sql.Decimal(10, 4),
                    lectura.velocidad !== undefined &&
                      lectura.velocidad !== null &&
                      isFinite(lectura.velocidad)
                      ? Number(parseFloat(lectura.velocidad).toFixed(4))
                      : null
                  )

                  .input(
                    "Distancia",
                    sql.Decimal(10, 4),
                    lectura.distancia !== undefined &&
                      lectura.distancia !== null &&
                      isFinite(lectura.distancia)
                      ? Number(parseFloat(lectura.distancia).toFixed(4))
                      : null
                  )
                  .input("Descripcion", sql.NVarChar(100), lectura.descripcion)
                  .query(`
              INSERT INTO LecturasSensores
              (VehiculoId, Canal, Tipo, Peso1, Peso2, Time2, Time3, Time4, TiempoManual, 
               DiferenciaManual, DiferenciaAB, Velocidad, Distancia, Descripcion)
              VALUES
              (@VehiculoId, @Canal, @Tipo, @Peso1, @Peso2, @Time2, @Time3, @Time4, @TiempoManual,
               @DiferenciaManual, @DiferenciaAB, @Velocidad, @Distancia, @Descripcion)
            `);
              }
            }

            // 3. (Opcional) Insertar distancias por eje
            let ejeNum = 1;
            for (const distancia of nuevoArreglo) {
              await pool
                .request()
                .input("VehiculoId", sql.Int, vehiculoId)
                .input("NumeroEje", sql.Int, ejeNum++)
                .input(
                  "Distancia",
                  sql.Decimal(10, 4),
                  distancia !== undefined &&
                    distancia !== null &&
                    isFinite(distancia)
                    ? Number(parseFloat(distancia).toFixed(4))
                    : null
                ).query(`
            INSERT INTO DistanciasEjes (VehiculoId, NumeroEje, Distancia)
            VALUES (@VehiculoId, @NumeroEje, @Distancia)
          `);
            }

            console.log("✅ Vehículo y lecturas insertadas correctamente");
            // ========================
            // Construir paquete para el front
            // ========================
            const paqueteFront = {
              vehiculoId, // el que insertaste en BD
              placa: state.placa || "XXX000",
              categoriaPorCamara: state.categoriaVehiculo || "No disponible",
              categoria: state.categoriaVehiculo ? state.categoriaVehiculo : "OTROS",
              cantidadEjes: sensores.B.length,
              pesoMaximoPermitido: pesoMaximo ?? 0,
              pesosPorEje: pesosEjes.map((eje) => {
                const limite = limitesEjes.find(
                  (l) => l.NumeroEje === eje.numeroEje
                );
                return {
                  numeroEje: eje.numeroEje,
                  pesoRegistrado: eje.peso,
                  pesoPermitido: limite?.PesoMaximoPermitido ?? 0,
                  exceso: limite
                    ? Math.max(0, eje.peso - limite.PesoMaximoPermitido)
                    : 0,
                };
              }),
              lecturasSensores: Object.keys(sensores).flatMap((canal) =>
                sensores[canal].map((lectura) => ({
                  canal: lectura.canal,
                  tipo: lectura.tipo,
                  peso1: lectura.peso1,
                  peso2: lectura.peso2,
                  tiempoManual: lectura.timepoManual,
                  diferenciaManual: lectura.diferenciaManual ?? null,
                  diferenciaAB: lectura.diferenciaAB ?? null,
                  velocidad: lectura.velocidad ?? null,
                  distancia: lectura.distancia ?? null,
                  descripcion: lectura.descripcion,
                }))
              ),
              distanciasEjes: nuevoArreglo.map((distancia, i) => ({
                numeroEje: i + 1,
                distancia,
              })),
              cumpleNorma,
              fechaRegistro: new Date(),
            };

            // ========================
            // Emitir al frontend
            // ========================
            io.emit("vehiculoProcesado", paqueteFront);
            console.log(
              "📤 Paquete enviado al front:",
              JSON.stringify(paqueteFront, null, 2)
            );
         
            if (cumpleNorma) {
              // ✅ Vehículo dentro del límite → habilitar salida a nacional
               const salida = await salida_nacional()
               console.log("Salida nacional",salida);
            } else {
              // ⚠️ Vehículo con sobrepeso → debe ir a báscula estática
              const ingreso =  await ingreso_estatica()
              console.log("Ingreso estatica: ",ingreso);
              console.log("🚦 Vehículo con sobrepeso → Semáforo Estática VERDE");
            }

            // Calcular peso total del vehículo
            const pesoTotalVehiculo = pesosEjes.reduce(
              (acc, eje) => acc + eje.peso,
              0
            );

            // Comparar contra el peso máximo permitido
            const sobrePesoTotal = pesoTotalVehiculo > (pesoMaximo ?? 0);

            // ========================
            // CONTROL DE SEMÁFOROS SEGÚN PESO TOTAL
            // ========================
            if (sobrePesoTotal) {
              // ⚠️ Vehículo con sobrepeso → debe ir a báscula estática
              state.semaforoIngresoEstaticaVerde = true;
              state.semaforoIngresoEstaticaVerde = true;
              state.semaforoIngresoEstaticaRojo = false;

              state.semaforoSalidaNacionalVerde = false;
              state.semaforoSalidaNacionalRojo = true;

              console.log(
                `🚦 Vehículo con sobrepeso: ${pesoTotalVehiculo} > ${pesoMaximo}`
              );
            } else {
              // ✅ Vehículo dentro del límite → habilitar salida a nacional
              state.semaforoIngresoEstaticaVerde = true;
              state.semaforoSalidaNacionalVerde = true;
              state.semaforoSalidaNacionalRojo = false;

              state.semaforoIngresoEstaticaRojo = true;
              state.semaforoIngresoEstaticaVerde = false;

              console.log(
                `🚦 Vehículo en norma: ${pesoTotalVehiculo} <= ${pesoMaximo}`
              );
            }

            const tcpSocket = getTcpSocket();
            if (tcpSocket && !tcpSocket.destroyed) {
              try {
                // Datos para enviar al hardware por TCP
                const envioPlaca2 = paqueteFront.placa || "SIN_PLACA";
                const totalValue = paqueteFront.pesosPorEje.reduce(
                  (acc, eje) => acc + eje.pesoRegistrado,
                  0
                );
                const combinedAxleValues = paqueteFront.pesosPorEje
                  .map((eje) => eje.pesoRegistrado)
                  .join(",");

                const ejes = paqueteFront.pesosPorEje;
                const categoriaReal = paqueteFront.categoria || "OTROS";
                const direccion = "ENTRADA"; // ⚠️ Ajusta según tu lógica real
                const rutaFotoInsertada = "/ruta/foto.jpg"; // ⚠️ Ajusta según donde tengas la foto
                const fechaFormateada = new Date().toISOString(); // o formateo más bonito

                const mensajeTCP = `placa: ${envioPlaca2}, peso_total: ${totalValue}, peso_ejes: ${combinedAxleValues}, clase: ${categoriaReal}, direccion: ${direccion}, rutaFotoInsertada: ${rutaFotoInsertada}, sobrepeso: ${!paqueteFront.cumpleNorma}, fechaPaso: ${fechaFormateada} \r\n`;

                tcpSocket.write(mensajeTCP);
                console.log("📡 Enviado al socket TCP:", mensajeTCP);
              } catch (err) {
                console.error("❌ Error enviando al socket TCP:", err);
              }
            } else {
              console.warn(
                "⚠️ No hay cliente TCP conectado, no se puede enviar el mensaje."
              );
            }
          } catch (error) {
            console.error("❌ Error guardando en BD:", error);
          } finally {
            state.vehiculoActual.length = 0; // limpiar para siguiente vehículo
          }
        })();

        break;
      default:
        break;
    }
  });
}

module.exports = { inicializarEventos };
