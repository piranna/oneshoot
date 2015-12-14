var http = require('http')


function OneShoot(timeout)
{
  if(!(this instanceof OneShoot)) return new OneShoot(timeout)

  if(timeout == null) timeout = 5000


  this.createServer = function(requestListener)
  {
    var server = http.createServer(requestListener)

    var _timeout
    function startTimeout()
    {
      if(timeout)
        _timeout = setTimeout(server.close.bind(server), timeout)
    }

    var socketClossed = server.getConnections.bind(server, function(error, count)
    {
      if(error) return console.trace(error)

      if(count <= 0) startTimeout()
    })

    server.on('connection', function(socket)
    {
      clearTimeout(_timeout)

      socket.on('close', socketClossed)
    })

    server.on('listening', startTimeout)

    return server
  }
}


module.exports = OneShoot
