# oneshoot
WebSockets and static web server for just one request

This is a WebSocket and a static web server that gets clossed 5 second after the
last connection was clossed. The delay is introduced to reuse previous instances.
This is used on NodeOS to start to serve the users files and give them an
interactive shell session from inside a secure environment instead of using a
global web server.

Think of it as a web server started on demand from another web server as CGI to
serve a particular subpath :-P

## options

* **hostname**: address from only accept connections. Default: any
* **port**: port where to listen for connections. The used port will be printed
  on *stdout*. Default: random
* **timeout**: seconds to wait before exiting the server for new incomming
  connections, if set to zero it doesn't exit. Default: 5 seconds
* **command**: command to exec for interactive WebSocket sessions. If not set
  WebSocket server will be disabled

Any arguments after '--' will be passed as arguments array to the *command* used
for WebSocket sessions.
