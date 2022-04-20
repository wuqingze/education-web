'use strict';

const honor_name = {"sxchzh":"思想成长" ,"shjxx":"实践学习" ,"zhygy":"志愿公益" ,"xshky":"学术科研" ,"wthd":"文体活动" ,"gzll":"工作履历" ,"kjzhsh":"考级证书"};
//var sql = require("./sql.js");
//var database = require('./database.js');

var os = require('os');
var nodeStatic = require('node-static');
var fs = require('fs');

var express = require('express');
var app = express();
app.use("/", express.static(__dirname));
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var http = require('http').Server(app);
var io = require("socket.io")(http);


var loginUser = {'_ga':[]};

const successResult = {result:true};
const failResult = {result:false};


function getCookie(cookie){
    if(cookie in loginUser){
        return true;
    }
}


app.get('/', function(req, res){
    console.log("faldjf");
  res.sendFile(__dirname+"/verify.html");
});

http.listen(8080, function(){
    console.log('listening on *:8080');
  });

