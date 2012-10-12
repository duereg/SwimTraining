var derby = require('derby')  
  , workout = require("./workout.js")
  , parse = require("./parser.js")
  , app = derby.createApp(module)
  , get = app.get
  , post = app.post
  , view = app.view
  , ready = app.ready;

derby.use(require('derby-ui-boot'))
derby.use(require('../../ui'))

var pages = [
  {url: '/', title: 'Start'},
  {url: "/home", title: "Latest Swim"},
  {url: "/add", title: "Add A Swim"} 
]

function render(name, page, model) {
  console.log("Entering get: " + name);
  var ctx = {
    pages: pages
  , activeUrl: page.params.url
  };

  if(model.session.swimTrainingAuth && model.session.swimTrainingAuth.facebook) {
    model.set('_facebookAuthenticated', true);
  }
  model.set('_userId', model.session.userId);
  page.render(name, ctx);
  console.log("Leaving get: " + name);
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
  //model.subscribe("potluck.event.people", function() {
    render('home', page, model);
  //}); 
});

// CONTROLLER FUNCTIONS //
ready(function(model) { 
  console.log("Entering Ready"); 

  // Functions on the app can be bound to DOM events using the "x-bind"
  // attribute in a template.
  exports.addSwim = function() {
    console.log("Entering add");
      
    var text = model.get('swims.new.text');
    var translated = parse(text);
    model.set('swims.new.translated', translated); 

    console.log("Leaving add");
  };

  exports.addEvent = function() {
    alert("Add event!");
  }

  exports.edit = function(e, element){
    model.at(element).set(false);
  };

  exports.display = function(e, element){
    model.at(element).set(true);
  };
  
  console.log("Leaving Ready");
});

module.exports = app;