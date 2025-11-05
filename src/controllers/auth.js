const {getConnection} = require('../database/connection');
const jwt = require('jsonwebtoken')
const  bcrypt = require('bcrypt')

async function loginUser(req, res){
    console.log(req.body);
    
    const username = req.body.user;
    const password = req.body.password;
    const pool = await getConnection();
    const result = await pool.request()
        .input("Nick", username)
        .query(`SELECT * FROM Usuarios where Nick = @Nick`)
    console.log(result.recordset[0])
    
    console.log("response login", result.recordset[0]);
    if (result.recordset.length == 0) {
        res.send({ error: 'usuario no encontrado' })
    }else {
        const passwordCheck = await bcrypt.compare(password, result.recordset[0].contrasena)
        if (!passwordCheck) {
            res.send({ error: 'usuario no encontrado' })
        }else {
            const user = { ...result.recordset[0] };
            delete user.contrasena;
            const id = user.nick
            jwt.sign({ id }, 'secret_key', (err, token) => {
                if (err) {
                    res.status(400).send({ error: 'jwt error' })
                }
                else {
                    res.send({
                        token: token, user
                    })
                }
            })
        }
        
    } 
}

module.exports = {loginUser}
