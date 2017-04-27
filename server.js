#!/usr/bin/env node

var parse = require('url').parse
var spawn = require('child_process').spawn

var finalhandler    = require('finalhandler')
var minimist        = require('minimist')
var serveStatic     = require('serve-static')
var WebSocketServer = require('ws').Server

var OneShoot  = require('./lib')
var directory = require('./lib/directory')


const HOME = (process.platform === 'win32') ? process.env.HOMEPATH : process.env.HOME;


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
var server = OneShoot(args.timeout).createServer()


// HTTP
var options =
{
  dotfiles: 'allow',
  index: false
}

var static = serveStatic(HOME, options)

server.on('request', function(req, res)
{
  var done = finalhandler(req, res)
  var dir  = directory(req, res, done)

  static(req, res, dir)
})


// WebSockets
if(command)
{
  var wss = new WebSocketServer({server: server})

  wss.on('connection', function connection(ws)
  {
    var options =
    {
      cwd: parse(ws.upgradeReq.url).pathname || HOME
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
  var port = this.address().port

  // Executed with `child_process.fork()`, send port over comunnication channel
  if(process.send) return process.send(port)

  // Running standalone, show port on stdout
  console.log(port)
})
