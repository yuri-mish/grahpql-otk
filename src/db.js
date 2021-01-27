const { Pool,Client } = require('pg')
var nano = require('nano')

const config = require('./config');

const pool = new Pool(config.db)
const docListener = new Client(config.db)
docListener.connect()
docListener.query('LISTEN changedoc')

const poolSync = new Pool(config.db)

module.exports = { 
  query: (text, params, callback) => {
    return pool.query(text, params, callback)
  },
  querySync: (text, params, callback) => {
    return poolSync.query(text, params, callback)
  },
  couch: nano( `https://${config.couch.user}:${config.couch.password}@${config.couch.host}`),
  docListener:docListener,
};