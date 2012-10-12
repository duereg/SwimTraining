(function() {

  var derby = require('derby')
    , everyauth = require('everyauth') 
    , req = void 0
    , usersById = {}
    , usersByLogin = {
      'duereg@hotmail.com': addUser({ login: 'duereg@hotmail.com', password: 'password'})
    };
  
  function addUser (user) {  
    user.id = derby.uuid();
    usersById[user.id] = user; 
    return user;
  }

  module.exports.configure = function(app) {
    var views = {};

    function getView(viewName) {
      
      if(!views[viewName]){
        var buffer = [];
        var res = { 
          write: function(str) {
            //console.log("write: " + str);
            buffer.push(str);
          }, 
          getHeader: function(contentType) {
            console.log("getHeader Called.");
            return true;
          },
          writeHeader: function(header) {
            console.log("writeHeader Called.");
          }
        };

        app.render(res, viewName);
        views[viewName] = buffer.join('');
      }

      return views[viewName];
    }

    everyauth.debug = true;
    everyauth.everymodule.configure({
      userPkey: '_id',
      performRedirect: function(res, location) {
        return res.redirect(303, location);
      },
      findUserById: function(req, userId, callback) {
        var model;
        model = req.getModel();
        return model.subscribe("users." + userId, function(err, user) {
          if (err) {
            return callback(err);
          }
          model.ref('_user', user);
          return callback(null, user.get());
        });
      },
      handleLogout: function(req, res) {
        req.logout();
        return this.redirect(res, this.logoutRedirectPath());
      }
    });

    everyauth.password
      .loginKey('email')
      .loginFormFieldName('email')
      .loginWith('email')
      .getLoginPath('/login') // Uri path to the login page
      .postLoginPath('/login') // Uri path that your login form POSTs to
      .loginView(getView('login')) //a string of html; OR the name of the jade/etc-view-engine view
      // .loginLocals(function(req, res, done) {
      //   setTimeout(function() {
      //     done(null, {
      //       title: "Async login"
      //     });
      //   }, 200);
      // })
      .authenticate( function (login, password) {
        var errors = [];
        if (!login) errors.push('Missing login');
        if (!password) errors.push('Missing password');
        if (errors.length) return errors;
        var user = usersByLogin[login];
        if (!user) return ['Login failed'];
        if (user.password !== password) return ['Login failed'];
        return user;
      })
      .loginSuccessRedirect('/') // Where to redirect to after a login

        // If login fails, we render the errors via the login view template,
        // so just make sure your loginView() template incorporates an `errors` local.
        // See './example/views/login.jade'

      .getRegisterPath('/register') // Uri path to the registration page
      .postRegisterPath('/register') // The Uri path that your registration form POSTs to
      .registerView(getView('register')) //'a string of html; OR the name of the jade/etc-view-engine view'
      // .registerLocals(function(req, res, done) {
      //   setTimeout(function() {
      //     done(null, {
      //       title: "Async register"
      //     });
      //   }, 200);
      // })
      .validateRegistration( function (newUserAttributes, errors) {
          console.log('validateRegistration called ' + newUserAttributes);
          var login = newUserAttributes[this.loginKey()];
          if(usersByLogin[login]) errors.push('Login already exists: ' + newUserAttributes.login);
          return errors;
        // Validate the registration input
        // Return undefined, null, or [] if validation succeeds
        // Return an array of error messages (or Promise promising this array)
        // if validation fails
        //
        // e.g., assuming you define validate with the following signature
        // var errors = validate(login, password, extraParams);
        // return errors;
        //
        // The `errors` you return show up as an `errors` local in your jade template
      })
      .registerUser( function (newUserAttributes) {
          console.log('registerUser called ' + newUserAttributes);
          var login = newUserAttributes[this.loginKey()];
          return usersByLogin[login] = newUserAttributes;
        // This step is only executed if we pass the validateRegistration step without
        // any errors.
        //
        // Returns a user (or a Promise that promises a user) after adding it to
        // some user store.
        //
        // As an edge case, sometimes your database may make you aware of violation
        // of the unique login index, so if this error is sent back in an async
        // callback, then you can just return that error as a single element array
        // containing just that error message, and everyauth will automatically handle
        // that as a failed registration. Again, you will have access to this error via
        // the `errors` local in your register view jade template.
        // e.g.,
        // var promise = this.Promise();
        // User.create(newUserAttributes, function (err, user) {
        //   if (err) return promise.fulfill([err]);
        //   promise.fulfill(user);
        // });
        // return promise;
        //
        // Note: Index and db-driven validations are the only validations that occur 
        // here; all other validations occur in the `validateRegistration` step documented above.
      })
      .loginSuccessRedirect('/')
      .registerSuccessRedirect('/'); // Where to redirect to after a successful registration
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

  module.exports.setRequest = function(r) {
    return req = r;
  };

}).call(this);