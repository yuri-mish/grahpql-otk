'use strict';
require('dotenv').config();
const env = process.env;

const config = {
  db: {
    host: env.DB_HOST,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  },
  couch: {
    host: env.COUCH_HOST,
    user: env.COUCH_USER,
    password: env.COUNCH_PASSWORD,
    db: {
      doc: env.COUCH_DB_DOC,
      cat: env.COUCH_DB_CAT,
    },
  },
  server: {
    port: +env.SERVER_PORT || 4000,
    cors: {
      allowedHeaders: ['token', 'Content-Type'],
      exposedHeaders: ['token'],
      credentials: true,
      origin: [ 'http://localhost:3000', 'https://otk.vioo.com.ua' ] ,
    },
  },
  api: {
    opendatabot: {
      host: env.API_OPENDATABOT_HOST,
      apiKey: env.API_OPENDATABOT_KEY,
    },
  },
  parentService:'7ab5cbd2-e9d8-11e9-810d-00155dcccf0a',
};

module.exports = config;
