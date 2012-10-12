module.exports = function(auth) {
  return function(req, res, next) {
    var model;
    model = req.getModel();
    model.set('_mobileDevice', /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(req.header('User-Agent')));
    auth.setRequest(req);
    auth.newUserAndPurl();
    return next();
  }
};