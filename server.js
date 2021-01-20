const express = require('express');
const {graphqlHTTP} = require('express-graphql');
const { createServer } = require('http');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { PubSub } = require('graphql-subscriptions');


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
       res.setHeader('Set-Cookie',[`token=${req.currUser.token};Path=/; Max-age= 3800`]);  
  next();
}
const app = express();
const ws = createServer(app);
const subscriptionsEndpoint = `ws://localhost:${port}/subscriptions`;

app.disable('x-powered-by');
app.use ( cors({
  'allowedHeaders': ['token', 'Content-Type'],
  'exposedHeaders': ['token'],
  'credentials': true,
  'origin': ['http://localhost:3000','https://otk.vioo.com.ua'] ,
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

//app.listen(port);   
//console.log('GraphQL API server running at localhost:'+ port);
ws.listen(port, () => {
  console.log(`wsGraphQL Server is now running on http://localhost:${port}`);

  // Set up the WebSocket for handling GraphQL subscriptions.
  new SubscriptionServer({
    execute,
    subscribe,
    schema
  }, {
    server: ws,
    path: '/',
  });
});