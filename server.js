'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var fs = require('fs');
var express = require('express');
var app = express();

// // app.use(express.static('public'));
app.use("/", express.static(__dirname));
var bodyParser = require('body-parser');
const json = require('body-parser/lib/types/json');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
// var io = socketIO.listen(app);

var http = require('http').Server(app);
var io = require("socket.io")(http);

app.get('/', function(req, res){
  res.sendFile(__dirname+"/index.html");
});

app.get("/jj", function(req,res){
  res.sendFile(__dirname+"/web/shouye.html");
});


var login_user = {};
var connectCounter = 0;


var tempimage = "";
var messages = {};
var connection_pair = {};
var isvideoready = false;
var connectedcnt = 0;

  io.on("connection", function(socket){
    connectCounter ++;
    console.log("connected user count",connectCounter);
    socket.on("array_changed", function(msg){
        console.log("array_changed");
        socket.broadcast.emit("array_changed", msg);
    });

    socket.on("login", function(msg){
      console.log('login message',msg);
      console.log('message email',msg['email']);
      console.log('message password', msg['password']);
      var connection = mysqlconnection();
      // var querysql = "select password from user where email='"+msg['email']+"';";
      var querysql = "select * from user where email='"+msg['email']+"' and password='"+msg['password']+"'";
      connection.query(querysql,function(err, rows, fields) {    
        // console.log("rows length", rows.length);
        if(rows.length == 1){
          var cookie = Math.random().toString();
          login_user[cookie.toString()] = msg['email'];
          socket.emit("return_login", {"verified":true,"cookie":cookie});
        }else{
          socket.emit("return_login", false);
        }
      });
      connection.end();      
    });

    socket.on("register", function(msg){
      var connection = mysqlconnection();
      // var querysql = "select password from user where email='"+msg['email']+"';";
      var querysql = "select * from user where email='"+msg['email']+"' and password='"+msg['password']+"'";
      var email = msg['email'];
      var username = msg['username'];
      var password = msg['password'];
      var profile = "../img/u_01.jpg";
      var querysql = "insert into user(email, password, username, profile) value('"+email+"','"+password+"','"+username+"','"+profile+"');"
      console.log(querysql);
      connection.query(querysql,function(err, rows, fields) {    
        if(err){
          socket.emit("return_register", false);
        }else{
          var cookie = Math.random().toString();
          login_user[cookie.toString()] = msg['email'];
          socket.emit("return_register", {"verified":true,"cookie":cookie});
        }
      });
      connection.end();      
    });

    socket.on("personal_file", function(msg){
      var cookie = msg['cookie'].split(';')[0];
      var user = login_user[cookie];
      var connection = mysqlconnection();
      var querysql = "select * from personal_file where email='"+user+"'";
      console.log("personal file ======"+querysql);
      connection.query(querysql, function(err, rows, fields) {
        socket.emit("personal_file",rows);
        connection.end();
      });
    });

    socket.on("cooperation_file", function(msg){

      var cookie = msg['cookie'].split(';')[0];
      var user = login_user[cookie];
      var connection = mysqlconnection();
      var querysql = "select * from cooperation_file where email='"+user+"'";
      connection.query(querysql, function(err, rows, fields) {
        socket.emit("cooperation_file",rows);
        connection.end();
      });
    });

    socket.on("bin_file", function(msg){
      var cookie = msg['cookie'].split(';')[0];
      var user = login_user[cookie];
      var connection = mysqlconnection();
      var querysql = "select * from bin_file where email='"+user+"'";
      connection.query(querysql, function(err, rows, fields) {
        socket.emit("bin_file",rows);
        connection.end();
      });
    });

    socket.on("new_bin_file", function(msg){
      var cookie = msg['cookie'].split(';')[0];
      var user = login_user[cookie];
      var connection = mysqlconnection();
      var querysql = "select * from bin_file where email='"+user+"'";
      connection.query(querysql, function(err, rows, fields) {
        socket.emit("new_bin_file",rows);
        connection.end();
      });
    });

    socket.on("friend_file", function(msg){

      var cookie = msg['cookie'].split(';')[0];
      var user = login_user[cookie];
      var querysql = "select * from user where email in (select friend_email from friend where email='"+user+"')";
      var connection = mysqlconnection();
      connection.query(querysql, function(err, rows, fields) {
        socket.emit("friend_file",rows);
        connection.end();
      });
    });

    socket.on("stranger", function(msg){
      var cookie = msg['cookie'].split(';')[0];
      var user = login_user[cookie];
      var querysql = "select * from user where email not in (select friend_email from friend where email='"+user+"')"+" and email != '"+user+"'";
      var connection = mysqlconnection();
      connection.query(querysql, function(err, rows, fields) {
        socket.emit("stranger",rows);
        connection.end();
      });
    });

    socket.on("addfriend", function(msg){
      console.log("addfriend=======");
      var cookie = msg['cookie'].split(';')[0];
      var user = login_user[cookie];
      var querysql = "insert into friend(email, friend_email) value('"+user+"','"+msg['email']+"');"
      console.log(querysql);
      var connection = mysqlconnection();
      connection.query(querysql, function(err, rows, fields) {
        if(err){
          console.log(err);
          socket.emit("addfriend",{"result":false});
        }else{
          querysql = "insert into friend(email, friend_email) value('"+msg['email']+"','"+user+"');"
          console.log(querysql);
          connection.query(querysql, function(err, rows, fields) {
            if(err){
              console.log(err);
              socket.emit("addfriend",{"result":false});
            }else{
              socket.emit("addfriend",{"result":true});
            }
          });
        }
        connection.end();
      });
    });

    socket.on("friends", function(msg){
      var cookie = msg['cookie'].split(';')[0];
      var user = login_user[cookie];
      var querysql = "select * from user where email in (select friend_email from friend where email='"+user+"')";
      var connection = mysqlconnection();
      connection.query(querysql, function(err, rows, fields) {
        socket.emit("friends",rows);
        connection.end();
      });
    });

    socket.on("save_empty_file", function(msg){
      var imgData = msg['imgData'];
      var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
      var dataBuffer = new Buffer(base64Data, 'base64');
      
      var cookie = msg['cookie'].split(';')[0];
      var email = login_user[cookie];

      
      var querysql = "select count(*) from personal_file where email='"+email+"'";
      var connection = mysqlconnection();
      console.log(querysql);
      connection.query(querysql, function(err, rows, fields) {
        var count = rows[0]['count(*)'];
        var imagepath = "images/"+email+"/personal_file/"+(count+1).toString()+".png";
        var dir = "images/"+email+"/personal_file";
        var headline = msg['headline'];
        var introduction = msg['introduction'];
        var labels = msg['labels'];
        var personal_file_id = email+Math.random(1000000).toString();

        querysql = "INSERT INTO `nongwebeducation`.`personal_file` (`email`, `personal_file_id`, `image`, `headline`, `introduction`, `labels`) VALUES ('"
        +email+"', '"
        +personal_file_id+"', '"
        +"../"+imagepath+"', '"
        +headline+"', '"
        +introduction+"', '"
        +labels+"')";

        console.log(querysql);
        connection.query(querysql,function(err, result){
          if(err){
              console.log(err);
              socket.emit("save_empty_file",{"result":false});
              return;
          }

          if (!fs.existsSync(dir)){
                 fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFile(imagepath, dataBuffer, function(err) {
            if(err){
              socket.emit("save_empty_file",{"result":false});
              console.log("save failed"+err);
            }else{
              socket.emit("save_empty_file",{"result":true});
              console.log("save successfully");
            }
          });
          connection.end();
        });
      });
    });


    socket.on("modify_image", function(msg){
      var imagepath = msg['imagepath'].split("../")[1];
      var imgData = msg['imagedata'];
      var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
      var dataBuffer = new Buffer(base64Data, 'base64');
      fs.writeFile(imagepath, dataBuffer, function(err) {
        if(err){
          socket.emit("modify_image",{"result":false});
        }else{
          socket.emit("modify_image",{"result":true});
          console.log("save successfully");
        }
      });
    });

    socket.on("delete_file_bin", function(msg){
      var table = msg['table'];
      var image = msg['image'];
      var cookie = msg['cookie'].split(';')[0];
      var email = login_user[cookie];

      var querysql = "select * from "+table+" where image='"+image+"'";
      var querysql1 = "delete from "+table+" where image='"+image+"'";
      console.log(table);
      console.log("querysql",querysql);
      console.log("querysql1",querysql1);
      var querysql2 = "insert into bin_file(bin_file_id,email,image,headline,introduction,labels) value(?,?,?,?,?,?)";
      var connection = mysqlconnection();
      connection.query("SET SQL_SAFE_UPDATES = 0", function(err, result){
        if(err){
          console("SET SQL_SAFE_UPDATES = 0; failed");
        }else{
          connection.query(querysql, function(err, rows, fields) {
            var row = rows[0];
            var bin_file_id = Math.random().toString();
            // if(table == "personal_file"){
            //   bin_file_id = row['personal_file_id'];
            // }else{
            //   bin_file_id = row['cooperation_file_id'];
            // }
            var headline = row['headline'];
            var introduction = row['introduction'];
            var labels = row['labels'];
            connection.query(querysql2, [bin_file_id,email,image,headline,introduction,labels], function(err, result){
              if(err){
                console.log("bin_file_id,email,image,headline,introduction,labels",bin_file_id,email,image,headline,introduction,labels);
                console.log("insert into bin failed");
                socket.emit("delete_file_bin",{"result":false});
                connection.end();
              }else{
                connection.query(querysql1,function(err,result){
                  if(err){
                    socket.emit("delete_file_bin",{"result":false});
                  }else{
                    socket.emit("delete_file_bin",{"result":true});
                  }
                  connection.end();
                });
              }
            });
        });
        }
      });
      
    });

    socket.on("recover", function(msg){
      var table = msg['table'];
      var image = msg['image'];
      var cookie = msg['cookie'].split(';')[0];
      var email = login_user[cookie];

      var querysql = "select * from bin_file where image='"+image+"'";
      var querysql1;
      if(table=="personal_file"){
        querysql1 = "insert into personal_file(personal_file_id,email,image,headline,introduction,labels) value(?,?,?,?,?,?)";
      }else{
        querysql1 = "insert into cooperation_file(cooperation_file_id,email,image,headline,introduction,labels) value(?,?,?,?,?,?)";
      }
      var querysql2 = "delete from bin_file where image='"+image+"'";

      var connection = mysqlconnection();
      connection.query(querysql, function(err, rows, fields){
        if(err){
          console.log("querysql failed");
          socket.emit("recover",{"result":false});
        }else{
          var row = rows[0];
          var file_id = row['bin_file_id'];
          var email = row['email'];
          var image = row['image'];
          var headline = row['headline'];
          var introduction = row['introduction'];
          var labels = row['labels'];
          connection.query(querysql1,[file_id, email, image, headline, introduction, labels], function(err, result){
            if(err){
              socket.emit("recover",{"result":false});
              connection.end();
            }else{
              console.log("querysql1 insert in to personal file success");
              connection.query(querysql2,function(err, result){
                if(err){
                  socket.emit("recover",{"result":false});
                }else{
                  socket.emit("recover",{"result":true});
                }
              });
              connection.end();
            }
          });
        }
      });
    });

    socket.on("totally_delete", function(msg){
      var image = msg['image'];
      var cookie = msg['cookie'].split(';')[0];
      var email = login_user[cookie];


      var querysql = "delete from bin_file where image='"+image+"'";
      var connection = mysqlconnection();
      connection.query(querysql, function(err, result){
        if(err){
          socket.emit("totally_delete",{"result":false});
        }else{
          socket.emit("totally_delete",{"result":true});
        }
      });
      connection.end();
    });

    socket.on("call_friend", function(msg){
      // socket.emit("call_friend", {"image":msg["image"]});
      // console.log("call_friend----=====---====");
      var cookie = msg['cookie'].split(';')[0];
      var email = login_user[cookie];
      tempimage = msg['image'];
      connection_pair[msg['email']] = email;
      connection_pair[email] = msg['email'];
    });

    socket.on("call_friend_image", function(msg){
      socket.emit("call_friend_image", {"image":tempimage});
    });

    socket.on("search_friend", function(msg){

      var connection = mysqlconnection();
      var cookie = msg['cookie'].split(';')[0];
      var user = login_user[cookie];
      var friend = msg['friend'];
      var querysql = "select * from user where email in (select friend_email from friend where email='"+user+"' and friend_email like '%"+friend+"%')";
      connection.query(querysql, function(err, rows, fields){
        if(err){
          socket.emit("search_friend",{"result":false});
        }else{
          socket.emit("search_friend", {"result":true,"friends":rows});
        }
      });
      connection.end();
    });

    socket.on("messages", function(msg){
      var cookie = msg['cookie'].split(';')[0];
      var user = login_user[cookie];
      if(messages[user]){
        socket.emit("messages",{"result":true,'messages':messages[user]});
      }else{
        socket.emit("messages",{'result':false});
      }
      console.log("messages --- "+JSON.stringify(messages));
    });

    socket.on("send_message", function(msg){
      var cookie = msg['cookie'].split(';')[0];
      var user = login_user[cookie];
      var  email = msg['email'];
      var image = msg['image'];
      // messages[email] = {'friend':user};
      messages[email] = [{'friend':user,'image':image}];
    });

    socket.on("save_cooperation_file", function(msg){
      var cookie = msg['cookie'].split(';')[0];
      var user = login_user[cookie];

      var connection = mysqlconnection();
      var querysql1 = "insert into cooperation_file(cooperation_file_id,email,friend_email,image,headline,introduction,labels) value(?,?,?,?,?,?,?)";
      var imgData = msg['imgData'];
      var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
      var dataBuffer = new Buffer(base64Data, 'base64');
      
      var cookie = msg['cookie'].split(';')[0];
      var email = login_user[cookie];
      var friend_email = connection_pair[email];
      console.log("connection_pair",connection_pair);
      var querysql = "select count(*) from cooperation_file where email='"+email+"'";
      var connection = mysqlconnection();
      
      console.log("insert to cooperation file");
      connection.query(querysql, function(err, rows, fields) {
        if(err){
          console.log("insert to cooperation file failed in select from cooperation_file");
        }else{
          var count = rows[0]['count(*)'];
          var imagepath = "images/"+email+"/cooperation_file/"+(count+1).toString()+".png";
          var headline = msg['headline'];
          var introduction = msg['introduction'];
          var labels = msg['labels'];
          var dir = "images/"+email+"/cooperation_file";
          if (!fs.existsSync(dir)){
                 fs.mkdirSync(dir, { recursive: true });
          }

          connection.query(querysql1,[email+Math.random().toString(), email,friend_email, "../"+imagepath, headline, introduction, labels], function(err, result){
                if(err){
                  console.log("insert cooperation file failed "+err);
                  socket.emit("save_cooperation_file",{"result":false});
                }else{
                  fs.writeFile(imagepath, dataBuffer, function(err) {
                    if(err){
                      console.log("write cooperation failed " + err);
                      socket.emit("save_cooperation_file",{"result":false});
                    }else{
                      console.log("insert into cooperation file successu");
                      socket.emit("save_cooperation_file",{"result":true});
                      console.log("save successfully");
                    }
                  });
               }
            connection.end();
          });
        }
      });
    });

    socket.on("isvideoready", function(msg){
        socket.emit("isvideoready",{"result":isvideoready});
    });

    socket.on("answer", function(msg){
      isvideoready = true;
    });

    socket.on("inroom", function(msg){
      connectCounter += 1;
    });

    socket.on("modifyprofile", function(msg){
      var imgData = msg['imagedata'];
      var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
      var dataBuffer = new Buffer(base64Data, 'base64');
      
      var cookie = msg['cookie'].split(';')[0];
      var email = login_user[cookie];

      var dir = "images/"+email+"/";
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
      }
      var imagepath = dir+"profile.jpg";
      var querysql = "update user set profile='../"+imagepath+"' where email='"+email+"'";
      console.log(querysql);
      var connection = mysqlconnection();
      connection.query(querysql, function(err, rows, fields) {
          fs.writeFile(imagepath, dataBuffer, function(err) {
            if(err){
              socket.emit("modifyprofile",{"result":false});
              console.log("modify profile failed"+err);
            }else{
              socket.emit("modifyprofile",{"result":true});
              console.log("modify profile successfully");
            }
          });
      });


    });

    socket.on("modifyuser", function(msg){
      var cookie = msg['cookie'].split(';')[0];
      var email = login_user[cookie];

      var querysql = "update user set username='"+msg['username']+"' , password='"+msg['password']+"'"+" where email='"+email+"'";
      console.log(querysql);
      var connection = mysqlconnection();
      connection.query(querysql, function(err, rows, fields) {
          if(err){
            socket.emit("modifyuser", {"result":false});
          }else{
            socket.emit("modifyuser", {"result":true});
          }
      });

    });

    socket.on("user", function(msg){
      var cookie = msg['cookie'].split(';')[0];
      var email = login_user[cookie];
      var connection = mysqlconnection();
      var querysql = "select * from user where email='"+email+"'";
      console.log(querysql);
      connection.query(querysql,function(err, rows, fields) {   
        socket.emit("user", rows[0]) ;
      });
      connection.end();      
    });

    socket.on("islogin", function(msg){
      console.log("login user: "+JSON.stringify(login_user));
      console.log("cookie :"+msg['cookie']);
      console.log("islogin: "+JSON.stringify(login_user[msg['cookie']]));
      if(login_user[msg['cookie']] == undefined){
        socket.emit("islogin",{"result":false});
      }else{
        socket.emit("islogin",{"result":true});
      }
    });

    // convenience function to log server messages on the client
    function log() {
      var array = ['Message from server:'];
      array.push.apply(array, arguments);
      socket.emit('log', array);
    }

    socket.on('message', function(message) {
        log('Client said: ', message);
        // for a real app, would be room-only (not broadcast)
        socket.broadcast.emit('message', message);
      });
/**
      socket.on('create or join', function(room) {
        console.log('Received request to create or join room ' + room);
        if (connectCounter === 1) {
          socket.join(room);
          console.log('Client ID ' + socket.id + ' created room ' + room);
          socket.emit('created', room, socket.id);

        } else if (connectCounter < 10) {
          console.log('Client ID ' + socket.id + ' joined room ' + room);
          io.sockets.in(room).emit('join', room);
          socket.join(room);
          socket.emit('joined', room, socket.id);
          io.sockets.in(room).emit('ready');
        } else { // max two clients
          socket.emit('full', room);
        }
      });
**/
      socket.on('ipaddr', function() {
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
          ifaces[dev].forEach(function(details) {
            if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
              socket.emit('ipaddr', details.address);
            }
          });
        }
      });

      socket.on('bye', function(){
        console.log('received bye');
      });

      socket.on('disconnect', function() {
        connectCounter--;
        console.log("disconnected",connectCounter);
        });

      socket.on('return_main_page', function(msg) {
          var cookie = msg['cookie'].split(';')[0];
          var user = login_user[cookie];
          messages[user] = null;
          isvideoready = false;
          connectedcnt -= 1;
          socket.emit("return_main_page", {"result":true});
      });

      socket.on("quit", function(msg){
        if(connectedcnt < 2){
          socket.emit("quit", {"result":true});
        }else{
          socket.emit("quit", {"result":false});
        }
      });

      socket.on("inroom", function(msg){
        connectedcnt += 1;
      });

    }); 

  http.listen(8080, function(){
      console.log('listening on *:8080');
    });


function mysqlconnection(){
    var mysql = require('mysql');
    var connection = mysql.createConnection({
        host: 'sql.wsfdb.cn',
        user: 'nongwebeducation',
        password: '123456',
        database:'nongwebeducation'
    });
    connection.connect();
    return connection;
}


// // ???????????????
// http.createServer( function (request, response) {  
//     // ??????????????????????????????
//     var pathname = url.parse(request.url).pathname;
    
//     // ????????????????????????
//     console.log("Request for " + pathname + " received.");
    
//     // ?????????????????????????????????????????????
//     fs.readFile(pathname.substr(1), function (err, data) {
//        if (err) {
//           console.log(err);
//           // HTTP ?????????: 404 : NOT FOUND
//           // Content Type: text/plain
//           response.writeHead(404, {'Content-Type': 'text/html'});
//        }else{             
//           // HTTP ?????????: 200 : OK
//           // Content Type: text/plain
//           response.writeHead(200, {'Content-Type': 'text/html'});    
          
//           // ??????????????????
//           response.write(data.toString());        
//        }
//        //  ??????????????????
//        response.end();
//     });   
//  }).listen(8080);
