var port = process.env.PORT || 1790;
if(process.env.NODE_ENV === 'debug' || process.env.NODE_ENV === 'production' ) {
  console.log("Running in " + process.env.NODE_ENV + ": require('./lib/server').listen('" + port + ');');
  require('./lib/server').listen(port);
} else {
  require('derby').run(__dirname + '/lib/server', port)
}

