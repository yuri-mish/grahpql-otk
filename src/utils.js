'use strict';

const parseCookies = request => {
  const list = {};
  const cookies = request.headers.cookie;

  if (cookies) {
    cookies.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }

  return list;
};


module.exports = {
  parseCookies,
};