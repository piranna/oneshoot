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


module.exports = directory
