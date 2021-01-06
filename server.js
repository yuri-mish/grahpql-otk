const express = require('express');
const {graphqlHTTP} = require('express-graphql');

//const { v4: uuidv4 } = require('uuid');
const schema = require('./src/schema.js');
const cors = require('cors');

const { errorType } = require('./constants')

const Users = require("./src/data/users");

const {docSync,catSync} = require("./src/schFunk");

const getErrorCode = errorName => {
  return errorType[errorName] 
}

let port = 4000;
const SESSION_SECRECT = 'bad secret';


const loggingMiddleware = (req, res, next) => {
 
  function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}
var token = parseCookies(req).token||'';
  console.log('token', token)
  req.currUser = Users.find((u)=>{return u.token===token})
  if (req.currUser)
    res.setHeader('Set-Cookie',[`token=${req.currUser.token};  Path=/; Max-age= 3600;SameSite=false;`]);  
  next();
}
const app = express();
app.use ( cors({
  'allowedHeaders': ['token', 'Content-Type'],
  'exposedHeaders': ['token'],
  'credentials': true,

  'origin': ['http://localhost:3000','http://localhost:4000'],

}) )

      
app.use(loggingMiddleware);
      


 app.get('/set-cookie', (req, res) => {
         res.cookie('token', '12345ABCDE')
         res.send('Set Cookie')
       })      

app.use('/', graphqlHTTP((req,res)=>{
    //console.log(res)
    return  ({
  schema: schema,
  graphiql: true,
  //rootValue: { session: "req.session" },
  
  
   customFormatErrorFn: (err) => {
     const error = getErrorCode(err.message)
     console.log('=Err:',err,error,err.message)
     if (!error) return ({ message: 'Якась помилка', statusCode: 303 })
     return ({ message: error.message, statusCode: error.statusCode })
   }
})}));

docSync();
catSync();

app.listen(port);   
console.log('GraphQL API server running at localhost:'+ port);