const { getConnection } = require("../database/connection");

async function editRango(req, res) {
  console.log("req.body: ", req.body);

  try {
    const pool = await getConnection();
    const { id, CategoriaId, RangoOrden, Minimo, Maximo } = req.body;

    // Validación
    if (!id || CategoriaId == null || RangoOrden == null || Minimo == null || Maximo == null) {
      return res.status(400).json({
        error: "Debes enviar id, CategoriaId, RangoOrden, Minimo y Maximo",
      });
    }

    // SQL UPDATE
    const query = `
      UPDATE RangosEjes
      SET 
        CategoriaId = @CategoriaId,
        RangoOrden = @RangoOrden,
        Minimo = @Minimo,
        Maximo = @Maximo
      WHERE Id = @Id
    `;

    const request = pool.request();
    request.input("Id", id);
    request.input("CategoriaId", CategoriaId);
    request.input("RangoOrden", RangoOrden);
    request.input("Minimo", Minimo);
    request.input("Maximo", Maximo);

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "No se encontró el rango para actualizar" });
    }

    res.json({
      message: "Rango actualizado correctamente",
      data: req.body,
    });

  } catch (error) {
    console.error("Error al actualizar el rango:", error);
    res.status(500).json({ error: "Error interno al actualizar el rango" });
  }
}


async function createRango(req, res) {
  console.log("req.body: ", req.body);

  try {
    const pool = await getConnection();
    const { CategoriaId, RangoOrden, Minimo, Maximo } = req.body;

    // Validación
    if (CategoriaId == null || RangoOrden == null || Minimo == null || Maximo == null) {
      return res.status(400).json({
        error: "Debes enviar CategoriaId, RangoOrden, Minimo y Maximo",
      });
    }

    // Consulta SQL
    const query = `
      INSERT INTO RangosEjes (CategoriaId, RangoOrden, Minimo, Maximo)
      VALUES (@CategoriaId, @RangoOrden, @Minimo, @Maximo);

      SELECT SCOPE_IDENTITY() AS insertedId; -- 👈 para devolver el ID recién creado
    `;

    const request = pool.request();
    request.input("CategoriaId", CategoriaId);
    request.input("RangoOrden", RangoOrden);
    request.input("Minimo", Minimo);
    request.input("Maximo", Maximo);

    const result = await request.query(query);

    const insertedId = result.recordset[0].insertedId;

    res.json({
      message: "Rango creado correctamente",
      data: {
        id: insertedId,
        CategoriaId,
        RangoOrden,
        Minimo,
        Maximo,
      },
    });

  } catch (error) {
    console.error("Error al crear el rango:", error);
    res.status(500).json({ error: "Error interno al crear el rango" });
  }
}



module.exports = {
    editRango,
    createRango
};