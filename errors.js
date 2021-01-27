'use strict';

const errorName = {
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  SERVER_ERROR: 'SERVER_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',

  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

const errorType = {
  [errorName.USER_ALREADY_EXISTS]: {
    message: 'User is already exists.',
    statusCode: 403,
  },
  [errorName.SERVER_ERROR]: {
    message: 'Server error.',
    statusCode: 500
  },
  [errorName.AUTH_ERROR]: {
    message: 'Необхідна авторизація',
    statusCode: 401
  },

  [errorName.UNKNOWN_ERROR]: {
    message: 'Якась помилка',
    statusCode: 303,
  },
};

const getErrorCode = name => (
  errorType[name] || errorType[name.UNKNOWN_ERROR]
);

module.exports = { errorName, errorType, getErrorCode };