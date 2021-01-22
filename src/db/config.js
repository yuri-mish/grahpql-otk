'use strict';

const env = process.env;

const config = {
  db: {
    host: env.DB_HOST || 'starsam.net',
    database: env.DB_NAME || 'test_db',
    user: env.DB_USER || 'postgres',
    password: env.DB_PASSWORD || 'qq031018',
  },
  couch: {
    host: env.COUCH_HOST || 'couch.vioo.com.ua',
    user: env.COUCH_USER || 'admin',
    password: env.COUNCH_PASSWORD || 'NodeArt9',
  },
};

module.exports = config;