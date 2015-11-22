#!/usr/bin/env node

var fs    = require('fs')
var http  = require('http')
var parse = require('url').parse
var spawn = require('child_process').spawn

var escapeHtml      = require('escape-html')
var finalhandler    = require('finalhandler')
var serveStatic     = require('serve-static')
var WebSocketServer = require('ws').Server


const TIMEOUT = 5*1000


function directory(req, res, done)
{
  return function(error)
  {
    if(error) return done(error)

    var url = escapeHtml(req.originalUrl || req.url)

    fs.stat(url, function(error, stats)
    {
      if(error) return done(error)

      if(!stats.isDirectory()) return done()

      fs.readdir(url, function(error, files)
      {
        if(error) return done(error)

        var body = JSON.stringify(files)

        // standard headers
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Length', body.length)

        res.end(body)
      })
    })
  }
}


// Check arguments
var argv = process.argv.slice(2)
if(!argv.length)
{
  console.error('PORT argument is mandatory')
  process.exit(1)
}

var port    = argv.shift()
var command = argv.shift()

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

    var cp = spawn(command, argv, options)

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
server.listen(port)
startTimeout()
