



const sql = require('mssql')
// user: 'Desarrollador',
//     password: 'Cardinal2023',
const dbSettings = {
    server: 'localhost',
    user: 'Desarrollador',
    password: 'Cardinal2025;',
    database: 'dinamica2',
    options: {
        encrypt: false,
        enableArithAbort: false,
        trustServerCertificate: true
    },

}

// Usuario: Autotruck
// Password: @dminAut0trk
// AUTOTRUCK_EU

async function getConnection() {
    try {
        const pool = await sql.connect(dbSettings)
        return pool
    } catch (error) {
        console.log(error)
    }
}

module.exports = {getConnection, sql}