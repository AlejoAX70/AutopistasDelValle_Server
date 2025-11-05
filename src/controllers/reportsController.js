const { getConnection, sql } = require("../database/connection");

async function getAllDashboard(req, res) {
  try {
    const pool = await getConnection();
    const { fechaInicio, fechaFin, placa, categoria, evasor } = req.query;
    console.log("Data vehiculos: ", placa);

    // ==========================
    // 1️⃣ Filtros dinámicos
    // ==========================
    let whereClauses = [];

    if (fechaInicio && fechaFin) {
      whereClauses.push(`vd.FechaRegistro BETWEEN @fechaInicio AND @fechaFin`);
    } else {
      whereClauses.push(
        `CAST(vd.FechaRegistro AS DATE) = CAST(GETDATE() AS DATE)`
      );
    }

    if (evasor){
       if(evasor === "evasores"){
        whereClauses.push(`vd.Evasor = 1`);
       }else if(evasor === "no_evasores"){
         whereClauses.push(`vd.Evasor = 0`);
       }
    }

    if (placa) {
      whereClauses.push(`vd.Placa LIKE '%' + @placa + '%'`);
    }

    if (categoria && categoria !== "todas") {
      whereClauses.push(`vd.Categoria = @categoria`);
    }

    const whereClause =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // ==========================
    // 2️⃣ Consulta principal (vehículos)
    // ==========================
    let queryVehiculos = `
      SELECT 
        vd.VehiculoId,
        vd.Placa,
        vd.Categoria,
        vd.CantidadEjes,
        vd.FechaRegistro,
        vd.PesoMaximo,
        vd.Evasor,
        SUM(ISNULL(pe.PesoRegistrado, 0)) AS PesoTotalRegistrado,
        SUM(ISNULL(pe.Exceso, 0)) AS ExcesoTotal,
        CASE 
          WHEN SUM(ISNULL(pe.PesoRegistrado, 0)) > vd.PesoMaximo OR SUM(ISNULL(pe.Exceso, 0)) > 0 THEN 'SI'
          ELSE 'NO'
        END AS SobrePeso,
        ISNULL(ejes.EjesConExceso, '') AS EjesConExceso
      FROM VehiculosEnDinamica vd
      LEFT JOIN PesosPorEje pe ON vd.VehiculoId = pe.VehiculoId
      LEFT JOIN (
        SELECT 
          VehiculoId, 
          STRING_AGG(CAST(NumeroEje AS VARCHAR(5)), ', ') AS EjesConExceso
        FROM PesosPorEje
        WHERE Exceso > 0
        GROUP BY VehiculoId
      ) AS ejes ON vd.VehiculoId = ejes.VehiculoId
      ${whereClause}
      GROUP BY 
        vd.VehiculoId, 
        vd.Placa, 
        vd.Categoria, 
        vd.CantidadEjes, 
        vd.FechaRegistro, 
        vd.PesoMaximo, 
        vd.Evasor,
        ejes.EjesConExceso
      ORDER BY vd.FechaRegistro DESC
    `;

    if (!fechaInicio || !fechaFin) {
      queryVehiculos += ` OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY`;
    }


    // ==========================
    // 3️⃣ Consulta del dashboard general
    // ==========================
    const queryDashboard = `
      WITH Datos AS (
        SELECT 
          vd.VehiculoId,
          vd.Placa,
          vd.FechaRegistro,
          ISNULL(SUM(pe.PesoRegistrado), 0) AS PesoTotal,
          ISNULL(SUM(pe.Exceso), 0) AS ExcesoTotal
        FROM VehiculosEnDinamica vd
        LEFT JOIN PesosPorEje pe ON vd.VehiculoId = pe.VehiculoId
        ${whereClause}
        GROUP BY vd.VehiculoId, vd.Placa, vd.FechaRegistro
      )
      SELECT
        COUNT(*) AS totalVehiculos,
        AVG(PesoTotal) AS pesoPromedio,
        SUM(CASE WHEN ExcesoTotal > 0 THEN 1 ELSE 0 END) AS conSobrepeso,
        SUM(CASE WHEN ExcesoTotal <= 0 THEN 1 ELSE 0 END) AS sinSobrepeso
      FROM Datos;
    `;

    // ==========================
    // 4️⃣ Consulta de categorías base
    // ==========================
    const queryCategorias = `
      SELECT 
        id_dinamica,
        categoria,
        pesoMaximo
      FROM categorias
      ORDER BY categoria ASC;
    `;

    // ==========================
    // 5️⃣ Consulta del peso promedio por categoría
    // ==========================
    const queryPesoPromedioCategorias = `
      SELECT 
        vd.Categoria,
        CAST(AVG(ISNULL(pe.PesoRegistrado, 0)) AS DECIMAL(10,2)) AS PesoPromedio
      FROM VehiculosEnDinamica vd
      LEFT JOIN PesosPorEje pe ON vd.VehiculoId = pe.VehiculoId
      ${whereClause}
      GROUP BY vd.Categoria
      ORDER BY vd.Categoria ASC;
    `;

     const queryVehiculosPorHora = `
      SELECT 
        RIGHT('0' + CAST(DATEPART(HOUR, vd.FechaRegistro) AS VARCHAR(2)), 2) + ':00' AS Hora,
        COUNT(vd.VehiculoId) AS TotalVehiculos
      FROM VehiculosEnDinamica vd
      ${whereClause}
      GROUP BY DATEPART(HOUR, vd.FechaRegistro)
      ORDER BY DATEPART(HOUR, vd.FechaRegistro);
      `;

      const queryPorcentajeCategoria = `
        SELECT 
        vd.Categoria,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() AS Porcentaje
        FROM VehiculosEnDinamica vd
        ${whereClause}
        GROUP BY Categoria;
      `

      const queryTendenciaDiaria = `
      SELECT 
        CAST(vd.FechaRegistro AS DATE) AS Fecha,
        COUNT(vd.VehiculoId) AS TotalVehiculos
      FROM VehiculosEnDinamica vd
      ${whereClause}
      GROUP BY CAST(vd.FechaRegistro AS DATE)
      ORDER BY Fecha ASC;
      `

    // ==========================
    // 6️⃣ Ejecución de consultas
    // ==========================
    const request = pool.request();

    if (fechaInicio && fechaFin) {
      request.input("fechaInicio", fechaInicio);
      request.input("fechaFin", fechaFin);
    }
    if (placa) request.input("placa", placa);
    if (categoria) request.input("categoria", categoria);

    // ✅ Todas las consultas que usan variables comparten el mismo request
    const [vehiculosResult, dashboardResult, pesosPorCategoriaResult, vehiculosPorHoraResult, porcentajeCategoriaResult, TendenciaDiariaResult] =
      await Promise.all([
        request.query(queryVehiculos),
        request.query(queryDashboard),
        request.query(queryPesoPromedioCategorias),
        request.query(queryVehiculosPorHora),
        request.query(queryPorcentajeCategoria),
        request.query(queryTendenciaDiaria),
      ]);

    // ✅ La consulta de categorías es independiente (no usa variables)
    const categoriasResult = await pool.request().query(queryCategorias);

    // ==========================
    // 7️⃣ Procesamiento de resultados
    // ==========================
    const vehiculos = vehiculosResult.recordset;
    const stats = dashboardResult.recordset[0];
    const categorias = categoriasResult.recordset;
    const pesosPorCategoria = pesosPorCategoriaResult.recordset;
    const vehiculosPorHora = vehiculosPorHoraResult.recordset;
    const porcentajeCategoria = porcentajeCategoriaResult.recordset;
    const tendenciaDiaria = TendenciaDiariaResult.recordset
    // ==========================
    // 8️⃣ Calcular porcentajes
    // ==========================
    const total = stats.totalVehiculos || 0;
    const conSobrepeso = stats.conSobrepeso || 0;
    const sinSobrepeso = stats.sinSobrepeso || 0;
    const porcentajeSobrepeso =
      total > 0 ? ((conSobrepeso / total) * 100).toFixed(2) : 0;
    const porcentajeSinSobrepeso =
      total > 0 ? ((sinSobrepeso / total) * 100).toFixed(2) : 0;

    // ==========================
    // 9️⃣ Respuesta final
    // ==========================
    res.json({
      data: vehiculos,
      dashboard: {
        totalVehiculos: total,
        pesoPromedio: Number(stats.pesoPromedio?.toFixed(2)) || 0,
        conSobrepeso,
        sinSobrepeso,
        porcentajeSobrepeso,
        porcentajeSinSobrepeso,
      },
      categorias,
      pesosPorCategoria, // ✅ agregado al resultado
      vehiculosPorHora,
      porcentajeCategoria,
      tendenciaDiaria
    });
  } catch (error) {
    console.error("Error en getAllDashboard:", error);
    res
      .status(500)
      .json({ error: "Error al obtener los datos y estadísticas" });
  }
}



async function getVehicleById(req, res) {
  try {
    const { vehiculoId } = req.params; // ejemplo: ?vehiculoId=42
    if (!vehiculoId) {
      return res.status(400).json({ error: "Debe enviar el vehiculoId" });
    }

    const pool = await getConnection();

    // 🔹 1️⃣ Obtener los datos principales del vehículo
    const vehiculoQuery = await pool.request()
      .input("vehiculoId", sql.Int, vehiculoId)
      .query(`
        SELECT 
          v.VehiculoId,
          v.Placa,
          v.Categoria,
          v.CantidadEjes,
          v.FechaRegistro,
          v.PesoMaximo AS pesoMaximoPermitido
        FROM VehiculosEnDinamica v
        WHERE v.VehiculoId = @vehiculoId
      `);

    const vehiculo = vehiculoQuery.recordset[0];
    if (!vehiculo) {
      return res.status(404).json({ error: "Vehículo no encontrado" });
    }

    // 🔹 2️⃣ Obtener los pesos por eje asociados al vehículo
    const pesosPorEjeQuery = await pool.request()
      .input("vehiculoId", sql.Int, vehiculo.VehiculoId)
      .query(`
        SELECT 
          p.NumeroEje       AS numeroEje,
          p.PesoRegistrado  AS pesoRegistrado,
          p.PesoPermitido   AS pesoPermitido,
          p.Exceso          AS exceso
        FROM PesosPorEje p
        INNER JOIN VehiculosEnDinamica v ON v.VehiculoId = p.VehiculoId
        WHERE v.VehiculoId = @vehiculoId
        ORDER BY p.NumeroEje ASC;

      `);

    // 🔹 3️⃣ Obtener las lecturas de sensores asociadas
    const lecturasSensoresQuery = await pool.request()
      .input("vehiculoId", sql.Int, vehiculo.VehiculoId)
      .query(`
        SELECT 
          l.LecturaId,
          l.Canal,
          l.Tipo,
          l.Peso1,
          l.Peso2,
          l.Time2,
          l.Time3,
          l.Time4,
          l.TiempoManual,
          l.DiferenciaManual,
          l.DiferenciaAB,
          l.Velocidad,
          l.Distancia,
          l.Descripcion
        FROM LecturasSensores l
        INNER JOIN VehiculosEnDinamica v ON v.VehiculoId = l.VehiculoId
        WHERE v.VehiculoId = @vehiculoId
        ORDER BY l.LecturaId ASC
      `);

    // 🔹 4️⃣ Crear lista de distanciasEjes a partir de lecturas
    const distanciasEjes = lecturasSensoresQuery.recordset.map(l => ({
      canal: l.Canal,
      distancia: l.Distancia,
      velocidad: l.Velocidad
    }));

    // 🔹 5️⃣ Calcular si cumple norma
    const cumpleNorma = !pesosPorEjeQuery.recordset.some(p => p.Exceso > 0);

    // 🔹 6️⃣ Armar el objeto final con la estructura esperada
    const response = {
      vehiculoId: vehiculo.VehiculoId,
      placa: vehiculo.Placa,
      categoria: vehiculo.Categoria,
      cantidadEjes: vehiculo.CantidadEjes,
      fechaRegistro: vehiculo.FechaRegistro,
      pesoMaximoPermitido: vehiculo.pesoMaximoPermitido,
      cumpleNorma,
      pesosPorEje: pesosPorEjeQuery.recordset,
      lecturasSensores: lecturasSensoresQuery.recordset,
      distanciasEjes
    };

    res.json(response);

  } catch (error) {
    console.error("Error en getVehicleById:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}



module.exports = { getAllDashboard, getVehicleById };
