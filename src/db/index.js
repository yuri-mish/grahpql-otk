const { Pool } = require('pg')
var nano = require('nano')

const pool = new Pool({
  host:"starsam.net",
    database:"test_db",
    user:"postgres",
    password:"qq031018"
})

const poolSync = new Pool({
  host:"starsam.net",
    database:"test_db",
    user:"postgres",
    password:"qq031018"
})
module.exports = { 
  query: (text, params, callback) => {
    return pool.query(text, params, callback)
  },
  querySync: (text, params, callback) => {
    return poolSync.query(text, params, callback)
  },
  couch: nano('https://admin:NodeArt9@couch.vioo.com.ua')
  
}