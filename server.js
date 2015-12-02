#!/usr/bin/env node

var parse = require('url').parse
var spawn = require('child_process').spawn

var finalhandler    = require('finalhandler')
var minimist        = require('minimist')
var serveStatic     = require('serve-static')
var WebSocketServer = require('ws').Server

var createServer = require('./index').createServer
var directory    = require('./directory')


// Check arguments
var args = minimist(process.argv.slice(2),
{
  string: 'hostname',
  default:
  {
    hostname: '0.0.0.0',
    port: 0
  },
  '--': true
})

var command = args.command
if(!command) console.warn('COMMAND not given, WebSockets are disabled')


// Create server
var server = createServer(args.timeout)


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

    var cp = spawn(command, args['--'], options)

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
server.listen(args.port, args.hostname, function()
{
  console.log(this.address().port)
})
