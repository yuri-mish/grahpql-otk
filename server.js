'use strict';

const http = require('http');

const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const cors = require('cors');

const schema = require('./src/schema.js');
const Users = require("./src/data/users");
const { docSync, catSync } = require("./src/schFunk");
const { parseCookies } = require('./src/utils');

const { getErrorCode } = require('./errors');
const config = require('./src/config');

const app = express();

app.disable('x-powered-by');

app.use(cors(config.server.cors));

app.get('/set-cookie', (req, res) => {
  res.cookie('token', '12345ABCDE')
  res.send('Set Cookie')
});

app.use((req, res, next) => {
  const token = parseCookies(req).token || '';
  console.log('token', token)
  
  req.currUser = Users.find(user => (user.token === token))

  if (req.currUser) {
    res.setHeader('Set-Cookie', [`token=${token};Path=/;Max-age=3800`]);
  }

  next();
});

app.get('/printform/:iddoc/:pform', async (req, res) => {
    var http = require('http');
    var externalReq = http.request({
	hostname: "1cweb.otk.in.ua",
        path: `/otk-base/hs/OTK?doc=buyers_order&ref=${req.params.iddoc}&rep=${req.params.pform}`
    }, function(externalRes) {
        externalRes.pipe(res);
    });
    externalReq.end()
 }) 

//const subscriptionsEndpoint = `ws://localhost:${config.server.port}/ws`;
app.use('/', graphqlHTTP(() => {
  return {
    schema: schema,
    graphiql: true,

    customFormatErrorFn: err => {
      const error = getErrorCode(err.message);
      console.log('=Err:', err, error, err.message);
      return error;
    }
  };
}));

docSync();
catSync();

const ws = http.createServer(app);

//app.listen(port);   
//console.log('GraphQL API server running at localhost:'+ port);
ws.listen(config.server.port, () => {
  console.log(
    `wsGraphQL Server is now running on http://localhost:${config.server.port}`
  );

  // Set up the WebSocket for handling GraphQL subscriptions.
  new SubscriptionServer(
    { execute, 
	subscribe, 
	schema:schema,
   //  onConnect: (msg, connection, connectionContext) => {
	//      console.log('wsConnect')
	//    console.log('msg:',msg)	
	//    console.log('connection:',connection)	
	//    console.log('context',connectionContext)	
	//},
    },
    { server: ws, path: '/ws' }
  );
});