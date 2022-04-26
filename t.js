var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var fs = require("fs")

app.use(express.static('public'))
app.get("/", function(req, res){
 res.sendFile(__dirname+ "/t.html");
 });


io.on("connection", function(socket) {
  console.log("A user is connected");
  socket.on("send", function(data){
    console.log(data);
    socket.emit("data", data);
  });
  socket.on("disconnect", function() {
    console.log("A user is disconnected");
  });
});


http.listen(3000, function(){
    console.log("Server is started at port 3000\nTo close use Ctrl+C");
});