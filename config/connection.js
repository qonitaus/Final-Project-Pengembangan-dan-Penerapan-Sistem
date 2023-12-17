const mysql = require('mysql')

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'soalujian',
    multipleStatements: true
})

module.exports = db