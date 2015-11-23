#!/usr/bin/env node

var http  = require('http')
var parse = require('url').parse
var spawn = require('child_process').spawn

var finalhandler    = require('finalhandler')
var parseArgs       = require('minimist')
var serveStatic     = require('serve-static')
var WebSocketServer = require('ws').Server

var directory = require('./directory')


const TIMEOUT = 5*1000


// Check arguments
var args = parseArgs(process.argv.slice(2),
{
  default:
  {
    port: 0
  }
})

var command = args.command
if(!command) console.warn('COMMAND not given, WebSockets are disabled')


// Create server
var server = http.createServer()

var timeout
function startTimeout()
{
  timeout = setTimeout(server.close.bind(server), TIMEOUT)
}

var socketClossed = server.getConnections.bind(server, function(error, count)
{
  if(error) return console.trace(error)

  if(count <= 0) startTimeout()
})

server.on('connection', function(socket)
{
  clearTimeout(timeout)

  socket.on('close', socketClossed)
})


// HTTP
var options =
{
  dotfiles: 'allow',
  index: false
}

var static = serveStatic('/', options)

server.on('request', function(req, res)
{
  var done = finalhandler(req, res)
  var dir  = directory(req, res, done)

  static(req, res, dir)
})


// WebSockets
if(command)
{
  var options =
  {
    server: server
  }

  var wss = new WebSocketServer(options)

  wss.on('connection', function connection(ws)
  {
    var options =
    {
      cwd: parse(ws.upgradeReq.url).pathname || '/'
    }

    var cp = spawn(command, args._, options)

    var send  = ws.send.bind(ws)
    var close = ws.close.bind(ws, undefined)

    cp.stdout.on('data', send)
    cp.stderr.on('data', send)

    cp.on('error', close)
    cp.on('close', close)

    var stdin = cp.stdin
    ws.on('message', stdin.write,bind(stdin))
    ws.on('close'  , cp.kill.bind(cp, 'SIGTERM'))
  })
}


// Start server
server.listen(args.port, function()
{
  console.log(this.address().port)
})
startTimeout()
