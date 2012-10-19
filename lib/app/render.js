var logger = require("../logger.js")
var pages  = [
  {url: '/', title: 'Start'},
  {url: "/home", title: "Latest Swim"},
  {url: "/calendar", title: "Calendar"},
  {url: "/add", title: "Add A Swim"} 
];

module.exports = function(name, page, model) {
  logger.log("Entering get: " + name); 

  //if this is a server render of a route 
  if(model.session) { 
    model.set('_facebookAuthenticated', model.session.swimTrainingAuth); 
    model.set('_userId', model.session.userId);
    logger.log(model.session);
  }
 
  var ctx = { pages: pages, activeUrl: page.params.url };


  if((name !== "start") && (name !== "home") && (name !== "calendar") && !model.get('_facebookAuthenticated')) {
    name = "pleaseLogin";
  } 

  page.render(name, ctx);
  logger.log("Leaving get: " + name);
};