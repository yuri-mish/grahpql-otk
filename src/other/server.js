const express = require('express');
const {graphqlHTTP} = require('express-graphql');
const schema = require('./src/schema.js');
const cors = require('cors');

const { errorType } = require('./constants')

const getErrorCode = errorName => {
  return errorType[errorName] 
}

let port = 4000;
const app = express();
app.use ( cors() )
app.use('/', graphqlHTTP({
  schema: schema,
  graphiql: true,
  // customFormatErrorFn: (err) => {
  //   console.log(err)
  //   const error = getErrorCode(err.message)
  //   return ({ message: error.message, statusCode: error.statusCode })
  // }
}));

app.listen(port);   
console.log('GraphQL API server running at localhost:'+ port);