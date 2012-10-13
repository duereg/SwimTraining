var derby = require('derby')
  , req = null;

module.exports.setRequest = function(r) {
  req = r;
  return req;
};

module.exports.newUserAndPurl = function() {
  var model = req.getModel()
    , sess = model.session
    , uidParam = req.url.split('/')[1]
    , acceptableUid = require('guid').isGuid(uidParam) || (uidParam === '3');

  if (!sess.userId) {
    sess.userId = derby.uuid();
    model.set("users." + sess.userId, { });
  }

  if (acceptableUid && (sess.userId !== uidParam) && !(sess.swimTrainingAuth && sess.swimTrainingAuth.facebook)) {
    return sess.userId = uidParam;
  }
};

module.exports.setupEveryauth = function(everyauth) {
  everyauth.debug = true;
  
  everyauth.everymodule.findUserById(function(id, callback) {
    return callback(null, null);
  });

  everyauth.facebook
           .appId(process.env.FACEBOOK_APP_ID)
           .appSecret(process.env.FACEBOOK_SECRET)
           .findOrCreateUser(function(session, accessToken, accessTokenExtra, fbUserMetadata) {

    var model = req.getModel()
      , q     = model.query('users').withEveryauth('facebook', fbUserMetadata.id);

    session.swimTrainingAuth = session.swimTrainingAuth || {};
    session.swimTrainingAuth.facebook = fbUserMetadata.id; 
    session.swimTrainingAuth.name = fbUserMetadata.name; 

    model.fetch(q, function(err, user) {
      var id = user && user.get() && user.get()[0].id;
      console.log({ err: err, id: id, fbUserMetadata: fbUserMetadata });

      if (id && (id !== session.userId)) {
        return session.userId = id;
      } else {
        model.setNull("users." + session.userId + ".auth", {
          'facebook': {}
        });
        return model.set("users." + session.userId + ".auth.facebook", fbUserMetadata);
      }
    });

    return fbUserMetadata;
  }).redirectPath("/");

  return everyauth.everymodule.handleLogout(function(req, res) {
    if (req.session.swimTrainingAuth && req.session.swimTrainingAuth.facebook) {
      req.session.swimTrainingAuth.facebook = null;
    }
    req.session.userId = null;
    req.logout();
    return this.redirect(res, this.logoutRedirectPath());
  });
};

module.exports.setupQueries = function(store) {
  store.query.expose('users', 'withId', function(id) {
    return this.byId(id);
  });
  store.query.expose('users', 'withEveryauth', function(provider, id) {
    console.log({
      withEveryauth: {
        provider: provider,
        id: id
      }
    });
    return this.where("auth." + provider + ".id").equals(id);
  });
  return store.queryAccess('users', 'withEveryauth', function(methodArgs) {
    var accept;
    accept = arguments[arguments.length - 1];
    return accept(true);
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