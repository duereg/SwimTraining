var derby   = require('derby')  
  , parse   = require("./swim/parser.js")
  , render  = require("./render.js")
  , logger  = require("../logger.js")
  , app     = derby.createApp(module)
  , get     = app.get
  , post    = app.post
  , view    = app.view
  , ready   = app.ready;

derby.use(require('derby-ui-boot'))
derby.use(require('../../ui')) 

// ROUTES FUNCTIONS //
get("/", function(page, model, params) {
  render("start", page, model);
});

get("/add", function(page, model, params) {  
  render("swimAdd", page, model);     
});
 
get('/home', function(page, model, params) { 
  render('home', page, model);
});

get('/calendar', function(page, model, params) { 
  render('calendar', page, model);
});

get('/user/:userId', function(page, model, params) {
  var userId = params.userId; 
  var user = model.get("users." + userId + ".auth.facebook"); 

  model.set("_user", user);
  render('user', page, model);
});

// CONTROLLER FUNCTIONS //
ready(function(model) { 
  logger.log("Entering Ready"); 
   
  app.on('render:calendar', function(ctx) {
    logger.log("rendering calendar client-side...");
    new Timeline("timeline", new Date());
  };

  // Functions on the app can be bound to DOM events using the "x-bind"
  // attribute in a template.
  exports.addSwim = function() {
    logger.log("Entering add");
      
    var text = model.get('swims.new.text');
    var date = model.get('swims.new.date');
    var translated = parse(text);

    model.set('swims.' + date + '.workout', translated);
    model.set('swims.new', {});
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