const { getConnection, sql } = require("../database/connection");
const { state } = require("../utils/systemSate");



async function cargarCategorias() {
  const pool = await getConnection();
  const result = await pool.request().query(`
    SELECT cv.categoria, re.RangoOrden, re.Minimo, re.Maximo
    FROM categorias cv
    JOIN RangosEjes re ON cv.id_dinamica = re.CategoriaId
    ORDER BY cv.categoria, re.RangoOrden
  `);

  const categorias = [];
  for (const row of result.recordset) {
    let categoria = categorias.find(c => c.nombre === row.categoria);
    if (!categoria) {
      categoria = { nombre: row.categoria, rangos: [] };
      categorias.push(categoria);
    }
    categoria.rangos.push({ min: Number(row.Minimo), max: Number(row.Maximo) });
  }

  state.categoriasCache = categorias;
  return categorias;
}

function clasificarVehiculo(distancias, categorias) {
  for (const categoria of categorias) {
    if (categoria.rangos.length !== distancias.length) continue;

    const coincide = categoria.rangos.every((r, i) => {
      const d = parseFloat(distancias[i]);
      return d >= r.min && d <= r.max;
    });

    if (coincide) return categoria.nombre;
  }
  return null;
}

module.exports = { cargarCategorias, clasificarVehiculo };
