# oneshoot
WebSockets and static web server for just one request

This is a WebSocket and a static web server that gets clossed 5 second after the
last connection was clossed. The delay is introduced to reuse previous instances.
This is used on NodeOS to start to serve the users files and give them an
interactive shell session from inside a secure environment instead of using a
global web server.

Think of it as a web server started on demand from another web server as CGI to
serve a particular subpath :-P
