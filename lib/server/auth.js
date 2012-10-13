var derby = require('derby')
  , req = null;

module.exports.setRequest = function(r) {
  req = r;
  return req;
};

module.exports.setupEveryauth = function(everyauth) {
  everyauth.debug = true;
  
  everyauth.everymodule.findUserById(function(req, userId, callback) {
    var model = req.getModel();
    model.subscribe("users." + userId, function(err, user) {
      if(err) { return callback(err); }
      model.ref('_user', user);
      user.setNull('created_at', new Date());
      callback(null, user.get());
    });
  });

  everyauth.facebook
           .appId(process.env.FACEBOOK_APP_ID)
           .appSecret(process.env.FACEBOOK_SECRET)
           .findOrCreateUser(function(session, accessToken, accessTokenExtra, fbUserMetadata) {

    var model  = req.getModel();
    var userId = fbUserMetadata.id

    session.userId = userId; 
    session.swimTrainingAuth = {userId: userId,
                                name:   fbUserMetadata.name};

    model.set('_userId', userId);
    model.set("users." + userId + ".auth.facebook", fbUserMetadata);

    return fbUserMetadata;
  }).redirectPath("/");

  everyauth.everymodule.handleLogout(function(req, res) {
    var model = req.getModel();
    var session = req.session;

    req.session.swimTrainingAuth = null;
    req.session.userId = null;

    model.set('_facebookAuthenticated', null); 
    model.set('_userId', null);

    req.logout();
    this.redirect(res, this.logoutRedirectPath());
  });
};

module.exports.setupAccessControl = function(store) {
  store.accessControl = true;
  store.readPathAccess('users.*', function() {
    var captures, next;
    if (!(this.session && this.session.userId)) {
      return;
    }
    captures = arguments[0];
    next = arguments[arguments.length - 1];
    return next(captures === this.session.userId);
  });
  return store.writeAccess('*', 'users.*', function() {
    var captures, next, pathArray;
    if (!(this.session && this.session.userId)) {
      return;
    }
    captures = arguments[0];
    next = arguments[arguments.length - 1];
    pathArray = captures.split('.');
    return next(pathArray[0] === this.session.userId);
  });
};