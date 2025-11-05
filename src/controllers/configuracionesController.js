const { getConnection, sql } = require("../database/connection");
const  bcrypt = require('bcrypt')
const { exec } = require("child_process");

async function getInitialData(req, res) {
  try {
    const pool = await getConnection();

    // ==========================
    // 3️⃣ Limites por eje
    // ==========================

    const queryLimitesEjes = `
        SELECT CategoriaId
        ,NumeroEje
        ,PesoMaximoPermitido
        ,IdLimite
        FROM LimitesEjesCategoria
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

    const queryUsers = `
    
        SELECT  nick
        ,nombreCom
        ,estado
        ,rango
    FROM usuarios
    
    `

    // ==========================
    // 5️⃣ Configruaciones
    // ==========================
    const queryConfiguraciones = `
      SELECT parametro
      ,valor
      FROM configuraciones
    `;

    // ==========================
    // 6️⃣ Ejecución de consultas
    // ==========================
    const request = pool.request();

    // ✅ Todas las consultas que usan variables comparten el mismo request
    const [limitesResult, categoriasResult, configuracionesResult, usersResult] =
      await Promise.all([
        request.query(queryLimitesEjes),
        request.query(queryCategorias),
        request.query(queryConfiguraciones),
        request.query(queryUsers),

      ]);

    // ==========================
    // 7️⃣ Procesamiento de resultados
    // ==========================
    const limites = limitesResult.recordset;
    const categorias = categoriasResult.recordset;
    const configuraciones = configuracionesResult.recordset;
    const users = usersResult.recordset;


    // ==========================
    // 9️⃣ Respuesta final
    // ==========================
    res.json({
      limites,
      categorias,
      configuraciones,
      users
    });
  } catch (error) {
    console.error("Error en getAllDashboard:", error);
    res
      .status(500)
      .json({ error: "Error al obtener los datos y estadísticas" });
  }
}

async function createCategoria(req, res) {
 
  try {
    const pool = await getConnection();
    const { categoria, pesoMaximo, id_dinamica } = req.body; // 👈 Se reciben los datos del body

    // Validación simple
    if (!categoria || !pesoMaximo || !id_dinamica) {
      return res
        .status(400)
        .json({ error: "Debes enviar 'categoria' y 'pesoMaximo'" });
    }

    // Consulta SQL para insertar una nueva categoría
    const query = `
      INSERT INTO categorias (categoria, pesoMaximo, id_dinamica)
      VALUES (@categoria, @pesoMaximo, @id_dinamica);
    `;

    // Ejecutar la consulta usando parámetros seguros
    const request = pool.request();
    request.input("categoria", categoria);
    request.input("pesoMaximo", pesoMaximo);
    request.input("id_dinamica", id_dinamica);


    await request.query(query);

    // Responder con éxito
    res.status(201).json({
      message: "Categoría creada exitosamente",
      data: { categoria, pesoMaximo },
    });
  } catch (error) {
    console.error("Error al crear la categoría:", error);
    res.status(500).json({ error: "Error al crear la categoría" });
  }
}


async function editCategoria(req, res) {
  try {
    const pool = await getConnection();
    const { id_dinamica, categoria, pesoMaximo } = req.body; // 👈 Datos del body

    // Validación básica
    if (!id_dinamica || !categoria || !pesoMaximo) {
      return res
        .status(400)
        .json({ error: "Debes enviar 'id_dinamica', 'categoria' y 'pesoMaximo'" });
    }

    // Consulta SQL para actualizar la categoría
    const query = `
      UPDATE categorias
      SET categoria = @categoria,
          pesoMaximo = @pesoMaximo
      WHERE id_dinamica = @id_dinamica;
    `;

    const request = pool.request();
    request.input("id_dinamica", id_dinamica);
    request.input("categoria", categoria);
    request.input("pesoMaximo", pesoMaximo);

    const result = await request.query(query);

    // Verificar si realmente se actualizó algo
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }

    // Responder con éxito
    res.json({
      message: "Categoría actualizada correctamente",
      data: { id_dinamica, categoria, pesoMaximo },
    });
  } catch (error) {
    console.error("Error al actualizar la categoría:", error);
    res.status(500).json({ error: "Error al actualizar la categoría" });
  }
}


async function createLimite(req, res) {

  try {
    const pool = await getConnection();
    const { idCategoria, numeroEje, PesoMaximoPermitido } = req.body; // 👈 Se reciben los datos del body

    // Validación simple
    if (!idCategoria || !numeroEje || !PesoMaximoPermitido) {
      return res
        .status(400)
        .json({ error: "Debes enviar 'categoria' y 'pesoMaximo'" });
    }

    // Consulta SQL para insertar una nueva categoría
    const query = `
      insert into LimitesEjesCategoria (CategoriaId, NumeroEje, PesoMaximoPermitido)
        values
        (@idCategoria, @numeroEje, @PesoMaximoPermitido)
    `;

    // Ejecutar la consulta usando parámetros seguros
    const request = pool.request();
    request.input("idCategoria", idCategoria);
    request.input("numeroEje", numeroEje);
    request.input("PesoMaximoPermitido", PesoMaximoPermitido);


    await request.query(query);

    // Responder con éxito
    res.status(201).json({
      message: "Categoría creada exitosamente",
      data: { numeroEje, PesoMaximoPermitido },
    });
  } catch (error) {
    console.error("Error al crear la categoría:", error);
    res.status(500).json({ error: "Error al crear la categoría" });
  }
}

async function editLimite(req, res) {
  try {
    const pool = await getConnection();
    const { key, CategoriaId, NumeroEje, PesoMaximoPermitido, idLimite } = req.body; // 👈 Datos del body

    // Validación básica
    if (!key || !CategoriaId || !NumeroEje || !PesoMaximoPermitido || !idLimite) {
      return res
        .status(400)
        .json({ error: "Debes enviar 'key', 'CategoriaId', 'NumeroEje', 'PesoMaximoPermitido' y 'idLimite'" });
    }

    // Consulta SQL para actualizar la categoría
    const query = `
      UPDATE LimitesEjesCategoria
      SET CategoriaId = @CategoriaId,
          NumeroEje = @NumeroEje,
          PesoMaximoPermitido = @PesoMaximoPermitido
      WHERE IdLimite = @IdLimite;
    `;

    const request = pool.request();
    request.input("CategoriaId", CategoriaId);
    request.input("NumeroEje", NumeroEje);
    request.input("PesoMaximoPermitido", PesoMaximoPermitido);
    request.input("idLimite", idLimite);


    const result = await request.query(query);

    // Verificar si realmente se actualizó algo
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "No se pudo crear el limite" });
    }

    // Responder con éxito
    res.json({
      message: "Categoría actualizada correctamente",
      data: { CategoriaId, NumeroEje, PesoMaximoPermitido },
    });
  } catch (error) {
    console.error("Error al actualizar el limite:", error);
    res.status(500).json({ error: "Error al actualizar la categoría" });
  }
}


async function editGlobalConfig(req, res) {
  try {
    const pool = await getConnection();
    const { parametro, valor, } = req.body; // 👈 Datos del body

    // Validación básica
    if (!parametro || !valor ) {
      return res
        .status(400)
        .json({ error: "Debes enviar 'parametro' y'valor'," });
    }

    // Consulta SQL para actualizar la categoría
    const query = `
        update configuraciones set valor = @valor where parametro = @parametro
    `;

    const request = pool.request();
    request.input("valor", valor);
    request.input("parametro", parametro);
  

    const result = await request.query(query);

    // Verificar si realmente se actualizó algo
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "No se pudo editar el parametro " });
    }

    // Responder con éxito
    res.json({
      message: "Categoría actualizada correctamente",
      data: { valor, parametro },
    });
  } catch (error) {
    console.error("Error al actualizar el limite:", error);
    res.status(500).json({ error: "Error al actualizar la categoría" });
  }
}


async function createUser(req, res) {
  console.log("req", req.body);
  
  try {
    const pool = await getConnection();
    const { nick, nombreCom, contrasena, estado, rango} = req.body; // 👈 Se reciben los datos del body
    let rangoNumero

    // Validación simple
    if (!nick || !nombreCom || !contrasena || !estado || !rango) {
      return res
        .status(400)
        .json({ error: "Debes enviar 'categoria' y 'pesoMaximo'" });
    }

     const hashedPassword = bcrypt.hashSync(contrasena, 10)
     if(rango === "Administrador"){
      rangoNumero = 50
     }else if(rango === "Operario") {
      rangoNumero = 10
     }else if(rango === "Técnico"){
      rangoNumero = 100
     }

    // Consulta SQL para insertar una nueva categoría
    const query = `
        insert into usuarios (nick, nombreCom, contrasena, estado, rango)
        values
        (@nick, @nombreCom, @contrasena, @estado, @rango)
    `;

    // Ejecutar la consulta usando parámetros seguros
    const request = pool.request();
    request.input("nick", nick);
    request.input("nombreCom", nombreCom);
    request.input("contrasena", hashedPassword);
    request.input("estado", estado);
    request.input("rango", rangoNumero);

    await request.query(query);

    // Responder con éxito
    res.status(201).json({
      message: "Usuario creado correctamente",
      data: { nick, nombreCom, estado },
    });
  } catch (error) {
    console.error("Error al crear el usuario: ", error);
    res.status(500).json({ error: "Error al crear la categoría" });
  }
}

async function EditUser(req, res) {
  console.log("req", req.body);
  
  try {
    const pool = await getConnection();
    const { nick, nombreCom, contrasena, estado, rango} = req.body; // 👈 Se reciben los datos del body
    let rangoNumero

    // Validación simple
    if (!nick || !nombreCom || !estado || !rango) {
      return res
        .status(400)
        .json({ error: "Debes enviar 'nick', 'nombreCom', 'contrasena', 'estado' y 'rango'" });
    }
    let queryContraseña = ``
    if(contrasena){
      queryContraseña = `,contrasena = @contrasena`
    }

     const hashedPassword = bcrypt.hashSync(contrasena, 10)
  
    // Consulta SQL para insertar una nueva categoría
    const query = `
        update usuarios set 
        nombreCom = @nombreCom,
        estado = @estado,
        rango = @rango
        ${queryContraseña}
        where nick = @nick
    `;

    // Ejecutar la consulta usando parámetros seguros
    const request = pool.request();
    request.input("nick", nick);
    request.input("nombreCom", nombreCom);
    request.input("contrasena", hashedPassword);
    request.input("estado", estado);
    request.input("rango", rango);

    await request.query(query);

    // Responder con éxito
    res.status(201).json({
      message: "Usuario creado correctamente",
      data: { nick, nombreCom, estado },
    });
  } catch (error) {
    console.error("Error al a el usuario: ", error);
    res.status(500).json({ error: "Error al crear la categoría" });
  }
}


async function restartServer(req, res) {
  console.log("restart server");
  

    exec("pm2 restart back", (error, stdout, stderr) => {
      if (error) {
        console.error("Error al reiniciar:", error);
        return res.status(500).json({ ok: false, error });
      }
      console.log("Servidor reiniciado:", stdout);
      res.json({ ok: true, msg: "Servidor reiniciado" });
    });
  
}








module.exports = { getInitialData, createCategoria, editCategoria, createLimite, editLimite, editGlobalConfig, createUser, EditUser, restartServer };
