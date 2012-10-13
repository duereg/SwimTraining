var http = require('http')
  , path = require('path')
  , express     = require('express')
  , gzippo      = require('gzippo')
  , derby       = require('derby')
  , app         = require('../app')
  , serverError = require('./serverError')
  , racer       = require('derby/node_modules/racer')
  , everyauth   = require('everyauth')
  , auth        = require('./auth')
  , expressApp  = express()
  , server      = http.createServer(expressApp);

// SERVER CONFIGURATION //
racer.io.set('transports', ['xhr-polling']);

if (process.env.NODE_ENV !== 'production') {
  racer.use(racer.logPlugin);
  derby.use(derby.logPlugin);
}
 
derby.use(require('racer-db-mongo'));

var store = derby.createStore({
  listen: server
, db:     { type: 'Mongo', 
            uri: process.env.MONGOLAB_URI || 'mongodb://localhost/database', 
            safe: true }
});

auth.setupQueries(store);
auth.setupEveryauth(everyauth);
auth.setupAccessControl(store);

var ONE_YEAR = 1000 * 60 * 60 * 24 * 365   
  , root = path.dirname(path.dirname(__dirname))
  , publicPath = path.join(root, 'public');

expressApp
  .use(express.favicon()) 
  .use(gzippo.staticGzip(publicPath, {maxAge: ONE_YEAR})) 
  .use(express.compress()) 
  .use(express.bodyParser())
  .use(express.methodOverride()) 
  .use(express.cookieParser())
  .use(store.sessionMiddleware({
    secret: process.env.SESSION_SECRET || 'SECRET_MAGIC_SWIM_FUN_H2O_TOY'
  , cookie: { maxAge: ONE_YEAR }
  })) 
  .use(store.modelMiddleware()) 

  .use(require("./mobile-support")(auth))
  .use(everyauth.middleware())

  .use(app.router())
  .use(expressApp.router)
  .use(serverError(root));

// SERVER ONLY ROUTES //
expressApp.all('*', function(req) {
  throw '404: ' + req.url
})

module.exports = server;
