var isDebug = process.env.NODE_ENV !== 'production'
module.exports = {
  log: function(str) {
    if(isDebug) { console.log(str); }
  }
};