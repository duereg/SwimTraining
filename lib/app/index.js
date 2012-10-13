var derby   = require('derby')  
  , parse   = require("./swim/parser.js")
  , app     = derby.createApp(module)
  , get     = app.get
  , post    = app.post
  , view    = app.view
  , ready   = app.ready
  , isDebug = process.env.NODE_ENV !== 'production';

derby.use(require('derby-ui-boot'))
derby.use(require('../../ui'))

var logger = {
  log: function(str) {
    if(isDebug) { console.log(str); }
  }
};

var pages = [
  {url: '/', title: 'Start'},
  {url: "/home", title: "Latest Swim"},
  {url: "/add", title: "Add A Swim"} 
];

function render(name, page, model) {
  logger.log("Entering get: " + name); 
 
  //if this is a server render of a route 
  if(model.session) { 
    model.set('_facebookAuthenticated', model.session.swimTrainingAuth); 
    model.set('_userId', model.session.userId);
    logger.log(model.session);
  }

  var ctx = {
    pages: pages
  , activeUrl: page.params.url
  };

  page.render(name, ctx);
  logger.log("Leaving get: " + name);
}

get("/", function(page, model, params) {
  render("start", page, model);
});

get("/add", function(page, model, params) { 
  model.subscribe("swims.new.text", function() { 
    render("swimAdd", page, model); 
  });
});
 
get('/home', function(page, model, params) { 
    render('home', page, model);
});

get('/user/:userId', function(page, model, params) {
  var userId = params.userId;
  logger.log(userId);
  var user = model.get("users." + userId + ".auth.facebook");
  logger.log(user);
  //add _user model with facebook information
  model.set("_user", user);
  render('user', page, model);
});

// CONTROLLER FUNCTIONS //
ready(function(model) { 
  logger.log("Entering Ready"); 
   
  // Functions on the app can be bound to DOM events using the "x-bind"
  // attribute in a template.
  exports.addSwim = function() {
    logger.log("Entering add");
      
    var text = model.get('swims.new.text');
    var translated = parse(text);
    model.set('swims.new.translated', translated); 

    logger.log("Leaving add");
  };

  exports.addEvent = function() { };

  exports.edit = function(e, element){
    model.at(element).set(false);
  };

  exports.display = function(e, element){
    model.at(element).set(true);
  };
  
  logger.log("Leaving Ready");
});

module.exports = app;