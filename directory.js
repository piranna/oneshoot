var fs   = require('fs')
var join = require('path').join

var escapeHtml = require('escape-html')
var map        = require('async').map


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

        map(files, function(item, callback)
        {
          fs.stat(join(url, item), function(error, stats)
          {
            if(error) return callback(error)

            stats.name = item

            callback(null, stats)
          })
        },
        function(error, results)
        {
          if(error) return done(error)

          var body = JSON.stringify(results)

          // standard headers
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Content-Length', body.length)

          res.end(body)
        })
      })
    })
  }
}


module.exports = directory
