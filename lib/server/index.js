//modified server/index.js

var http = require('http')
  , path = require('path')
  , express = require('express')
  , gzippo = require('gzippo')
  , derby = require('derby')
  , everyauth = require('everyauth')
  , app = require('../app')
  , serverError = require('./serverError') 
  , auth = require('./auth')
  , mobile = require("./mobile-support.js");

// SERVER CONFIGURATION //
var expressApp = express()
  , server = module.exports = http.createServer(expressApp);

if (process.env.NODE_ENV !== 'production') { 
  derby.use(derby.logPlugin);
}

derby.use(require('racer-db-mongo'));

var store = derby.createStore({
  listen: server
, db:     {type: 'Mongo', uri: 'mongodb://localhost/database', safe: true}});

//Setup Authentication
//auth.setupQueries(store);
//auth.setupEveryauth(everyauth);
auth.configure(app);
auth.setupAccessControl(store);

var ONE_YEAR = 1000 * 60 * 60 * 24 * 365  
  , root = path.dirname(path.dirname(__dirname))
  , publicPath = path.join(root, 'public');

expressApp
  .use(express.favicon())
  // Gzip static files and serve from memory
  .use(gzippo.staticGzip(publicPath, {maxAge: ONE_YEAR}))
  // Gzip dynamically rendered content
  .use(express.compress())

  // Uncomment to add form data parsing support
   .use(express.bodyParser())
   .use(express.methodOverride())

  // Uncomment and supply secret to add Derby session handling
  // Derby session middleware creates req.model and subscribes to _session
  .use(express.cookieParser())
  .use(store.sessionMiddleware({
    secret: process.env.SESSION_SECRET || 'SECRET_MAGIC_SWIM_FUN_H2O_TOY'
  , cookie: {maxAge: ONE_YEAR}
  }))

  // Adds req.getModel method
  .use(store.modelMiddleware())

  //Add mobile support
  .use(mobile(auth))

  //authentication middlewares
 // .use(auth.ensureUser())
  .use(everyauth.middleware())

  // Creates an express middleware from the app's routes
  .use(app.router())
  .use(expressApp.router)
  .use(serverError(root));

// SERVER ONLY ROUTES //
expressApp.all('*', function(req) {
  throw '404: ' + req.url
})
