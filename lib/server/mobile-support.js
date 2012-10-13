module.exports = function(auth) {
  return function(req, res, next) {
    var model = req.getModel();
    model.set('_mobileDevice', /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(req.header('User-Agent')));
    auth.setRequest(req);
    return next();
  }
};