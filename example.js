const express = require('express');
const cors = require('cors');
const { buildSchema } = require('graphql');
const {graphqlHTTP} = require('express-graphql');
let port = 4000;

/*  Это простая схема построенная с использванием
    языка схемы GraphQL */

let schema = buildSchema(`
  type Query {
    postTitle: String,
    blogTitle: String
  }
`);

/* root предоставляет функции распознования для каждого
   endpoint'a */

let root = {
  postTitle: () => {
    return 'Build a Simple GraphQL Server With Express and NodeJS';
  },
  blogTitle: () => {
    return 'scotch.io';
  }
};

const app = express();

const corsOptions = {
  origin(origin, callback) {
    console.log(origin)
      callback(null, true);
  },
  credentials: true
};
//app.use(cors())
//app.options('*', cors()); 
//app.options('*', cors(corsOptions) )

var allowCrossDomain = function(req, res, next) {
  console.log(res)
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,token');
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true // Если true, то отображает GraphiQL
  })
}
app.use('/graphql',allowCrossDomain);             // (браузерная IDE для создания и выполненения запросов к endpoint'ам),
                 // когда endpoint'ы GraphQL были загружены   

app.listen(port);
console.log('GraphQL API server running at localhost: ' + port);