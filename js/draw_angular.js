var socket = io.connect();
var app = angular.module('draw_app', []);
app.directive('drawcanvas', function(){
    return {
        templateUrl: 'canvas.html',
        replace: true,
        restrict: 'AE',
    }
});


app.controller("main_controller", function($http, $scope){

  var loc = location.href;//获取整个跳转地址内容，其实就是你传过来的整个地址字符串
	console.log("我的地址"+loc);
	var n1 = loc.length;//地址的总长
	var n2 = loc.indexOf("?");//取得=号的位置
	var parameter = decodeURI(loc.substr(n2+1, n1-n2));//截取从?号后面的内容,也就是参数列表，因为传过来的路径是加了码的，所以要解码
	var parameters  = parameter.split("&");//从&处拆分，返回字符串数组
  $scope.fromcall = false;
  if(parameters.length>1){
    $scope.fromcall = true;
  }
  
    $scope.drawhtml = true;
    $scope.image = "";
    $scope.xx = 1;
    $scope.ctx = undefined;
    $scope.canvas_imagedata = undefined;
    $scope.array_data  = undefined;
    window.setTimeout(add_canvas,100);
    
    // window.setTimeout(init($scope),200);
    $scope.socket = socket;
    // window.setTimeout(init_canvas($scope), 4000);

    socket.on("call_friend", function(msg){
      $scope.image = msg['image'];
    });

    $scope.remove = function(){
        if($scope.drawcanvas.length== 0){
            $scope.drawcanvas = [1];
        }else{
            $scope.drawcanvas = []; 
        }
        
    };
    //window.setTimeout(function(){init_canvas($scope);init_video($scope)},500);
    window.setTimeout(function(){init_canvas($scope);},500);
    init_video($scope);
    $scope.test = function(){
        init_canvas($scope);
        init_video($scope);
    }

    $scope.only_video = function(){
        document.getElementById("videobox").style.cssText = "";
        $scope.show_navigator = false;
        $scope.show_canvas = false;
        $("video:first").get(0).style.width = "300px";
        $("video:first").get(0).style.height = "200px";
        document.getElementById("localVideo").style="width: 300px; height: 200px;margin-left: 10px;margin-top: 10px;";
        $("video:last").get(0).style.position = "absolute";
        
        $("video:last").get(0).style.width = document.body.offsetWidth.toString()+"px";
        $("video:last").get(0).style.height = (document.body.offsetHeight+80).toString()+"px";
        $("video:last").get(0).style.top = "10px";
        $("video:last").get(0).style.left = "10px";
        $("video:last").get(0).style.zIndex = "-1";
    }

    $scope.hide_video= function(){
        if(document.querySelector('#hidevideolink').text == "隐藏"){
            document.querySelector('#hidevideolink').text = "显示";
            document.querySelector('#video_panel').style.display = "none"; 
        }else{
            document.querySelector('#hidevideolink').text = "隐藏";
            document.querySelector('#video_panel').style.display = "block"; 
        }
    }

    $scope.return_main_page = function(){
        stop();
        socket.emit("return_main_page", {"cookie":document.cookie});
        socket.on("return_main_page",  function(msg){
            if(msg['result']){
                window.location.href = "./shouye.html";
            }
        });
    };

    $scope.recover = function(){
        document.getElementById("videobox").style.cssText = "margin-left: 200px;margin-top: 10px;";
        document.getElementById("localVideo").style="";
        $scope.show_navigator = true;
        $scope.show_canvas = true;
        $("video:last").get(0).style.position = "static";
        $("video:first").get(0).style.width = "300px";
        $("video:first").get(0).style.height = "220px";

        $("video:last").get(0).style.width = "300px";
        $("video:last").get(0).style.height = "220px";
    }

    $scope.openvideo = function(){
        alert("open video");
        maybeStart();
    }


    $scope.icons = function(){
        if($scope.show_icons == true){
            $scope.show_icons = false;
        }else{
            $scope.show_icons = true;
        }
    }

    $scope.save_empty_file = function(){
      console.log("save empty file",$scope.introduction);
            var canvas = $("canvas:first").get(0);
            socket.emit('save_cooperation_file',{"introduction":$scope.introduction,"headline":$scope.headline,"cookie":document.cookie,"imgData":canvas.toDataURL(),"labels":$scope.labels});
            socket.on("save_cooperation_file", function(msg){
                if(msg['result'] == true){ alert("新文件保存成功")}
                else alert("新文件保存失败");
            });
    }
});


app.controller('navigator_controller', function($http, $scope) {
  $scope.messages = false;
  $scope.m1 = "../img/message.png";
  $scope.m2 = "../img/message1.png";
  socket.emit("messages", {"cookie":document.cookie});
  socket.on("messages", function(msg){
      if(msg['result']){
          $scope.messages = msg['messages'];
      }
      console.log("messages", )
  });

  $scope.data_list = []
  $scope.$watch('search_value', function(newValue, oldValue) {
      if (newValue === oldValue) {
          return;
      }else if((newValue.length==1 && oldValue==undefined) || (newValue.length > oldValue.length)){
          $scope.data_list.push({"h":"老年","p":"架飞机阿咖酚散放辣椒发了卡机发","img":"../images/1.png"});
      }else{
          $scope.data_list.pop()
      }
      console.log("data changed");
  }, true);
});


function init_canvas(scope){
    var canvas = $("canvas:first").get(0);
    var img = document.createElement("img");
    scope.socket.emit("call_friend_image",{"xx":"xx"});
    scope.socket.on("call_friend_image", function(msg){
      img.src = msg['image'];
      window.setTimeout(function(){$("canvas:first").get(0).getContext('2d').drawImage(img,0,0);},1000);
    });
    canvas.id = "main_canvas";
    scope.ctx = $("canvas:first").get(0).getContext('2d');
    scope.canvas_imagedata = scope.ctx.getImageData(0,0,990,500);
    scope.array_data = new Uint8ClampedArray(scope.canvas_imagedata.data);

    if(window.Worker){

        var myWorker = new Worker("worker.js");

        window.setInterval(function(){
            var lasted_array = $("#main_canvas").get(0).getContext("2d").getImageData(0,0,990,500).data;
            // var lasted_array = document.getElementById("main_canvas").getContext("2d").getImageData(0,0,990,500).data;
            myWorker.postMessage([scope.array_data, lasted_array]);
        },100);


        myWorker.onmessage = function(e){
            if(e.data["isChanged"] == true){
                scope.array_data = $("#main_canvas").get(0).getContext("2d").getImageData(0,0,990,500).data;
                scope.array_data = new Uint8ClampedArray(scope.array_data);
                scope.socket.emit("array_changed", e.data["change_data"])
            }else{
                console.log("not changed");
            }
        }

             
        scope.socket.on("array_changed", function(msg){
            var lasted_array = $("#main_canvas").get(0).getContext("2d").getImageData(0,0,990,500).data;
            for(var i=0; i<msg.length; i += 2){
                lasted_array[msg[i]] = msg[i+1];
            }
            scope.array_data = new Uint8ClampedArray(lasted_array);
            var imagedata =  new ImageData(lasted_array , scope.canvas_imagedata.width, scope.canvas_imagedata.height);
            $("#main_canvas").get(0).getContext("2d").putImageData(imagedata,0,0);
            console.log("success");
        });
    }
}


function init_video(scope){
//    var isChannelReady = false;
//    var isInitiator = false;
//    var isStarted = false;
    var localStream;
    var pc;
    var remoteStream;
    var turnReady;
    
    var pcConfig = {
      'iceServers': [{
        'urls': 'stun:stun.l.google.com:19302'
      }]
    };
    
    // Set up audio and video regardless of what devices are present.
    var sdpConstraints = {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    };
    
    /////////////////////////////////////////////
    
    scope.socket.on('log', function(array) {
      console.log.apply(console, array);
    });
    
    ////////////////////////////////////////////////
    
    function sendMessage(message) {
      console.log('Client sending message: ', message);
      scope.socket.emit('message', message);
    }
    
    // This client receives a message
    scope.socket.on('message', function(message) {
      if (message === 'got user media') {
        maybeStart();
      } else if (message.type === 'offer') {
        if (!isInitiator && !isStarted) {
          maybeStart();
        }
        pc.setRemoteDescription(new RTCSessionDescription(message));
        doAnswer();
      } else if (message.type === 'answer') {
        pc.setRemoteDescription(new RTCSessionDescription(message));
      } else if (message.type === 'candidate') {
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: message.label,
          candidate: message.candidate
        });
        pc.addIceCandidate(candidate);
      } else if (message === 'bye') {
        handleRemoteHangup();
      }
    });
    
    ////////////////////////////////////////////////////
    
    var localVideo = document.querySelector('#localVideo');
    var remoteVideo = document.querySelector('#remoteVideo');
    navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
            echoCancellation: true
        }
    },
      video: true
    })
    .then(function(stream){
      localVideo.srcObject = stream;
      localVideo.play();
      var intervalId = null;
      if(scope.fromcall){
        intervalId = setInterval(()=>{
          scope.socket.emit("isvideoready",{"xx":"xx"});
          scope.socket.on('isvideoready', function(message) {
            if(message["result"]){
              remoteVideo.srcObject = stream;
              remoteVideo.play();
              clearInterval(intervalId);
            }
          });
        }, 1000);
      }else{
        scope.socket.emit("answer",{"xx":"xx"});
        setTimeout(()=>{
          remoteVideo.srcObject = stream;
          remoteVideo.play();
        },2000);
      }
      sendMessage('got user media');
      maybeStart();
    })
    .catch(function(e) {
      alert('getUserMedia() error: ' + e.name);
    });

    var constraints = {
      video: true
    };
    
    console.log('Getting user media with constraints', constraints);
    
    if (location.hostname !== 'localhost') {
      requestTurn(
        'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
      );
    }
    
    function maybeStart() {
      //if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
      if (typeof localStream !== 'undefined') {
        console.log('>>>>>> creating peer connection');
        createPeerConnection();
        pc.addStream(localStream);
        doCall();

//        if (isInitiator) {
//          doCall();
//        }
      }
    }
    
    window.onbeforeunload = function() {
      sendMessage('bye');
    };
    
    /////////////////////////////////////////////////////////
    
    function createPeerConnection() {
      try {
        pc = new RTCPeerConnection(null);
        pc.onicecandidate = handleIceCandidate;
        pc.onaddstream = handleRemoteStreamAdded;
        pc.onremovestream = handleRemoteStreamRemoved;
        console.log('Created RTCPeerConnnection');
      } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
      }
    }
    
    function handleIceCandidate(event) {
      if (event.candidate) {
        sendMessage({
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        });
      } else {
        console.log('End of candidates.');
      }
    }
    
    function handleCreateOfferError(event) {
      console.log('createOffer() error: ', event);
    }
    
    function doCall() {
      console.log('Sending offer to peer');
      pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
    }
    
    function doAnswer() {
      console.log('Sending answer to peer.');
      pc.createAnswer().then(
        setLocalAndSendMessage,
        onCreateSessionDescriptionError
      );
    }
    
    function setLocalAndSendMessage(sessionDescription) {
      // Set Opus as the preferred codec in SDP if Opus is present.
      //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
      pc.setLocalDescription(sessionDescription);
      sendMessage(sessionDescription);
    }
    
    function onCreateSessionDescriptionError(error) {
      trace('Failed to create session description: ' + error.toString());
    }
    
    function requestTurn(turnURL) {
      var turnExists = false;
      for (var i in pcConfig.iceServers) {
        if (pcConfig.iceServers[i].url.substr(0, 5) === 'turn:') {
          turnExists = true;
          turnReady = true;
          break;
        }
      }
      if (!turnExists) {
        console.log('Getting TURN server from ', turnURL);
        // No TURN server. Get one from computeengineondemand.appspot.com:
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4 && xhr.status === 200) {
            var turnServer = JSON.parse(xhr.responseText);
            console.log('Got TURN server: ', turnServer);
            pcConfig.iceServers.push({
              'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
              'credential': turnServer.password
            });
            turnReady = true;
          }
        };
        xhr.open('GET', turnURL, true);
        xhr.send();
      }
    }
    
    function handleRemoteStreamAdded(event) {
      console.log('Remote stream added.');
      remoteVideo.srcObject = event.stream;
      remoteVideo.play();
      remoteStream = event.stream;
    }
    
    function handleRemoteStreamRemoved(event) {
      console.log('Remote stream removed. Event: ', event);
    }
    
    function hangup() {
      console.log('Hanging up.');
      stop();
      sendMessage('bye');
    }
    
    function handleRemoteHangup() {
      console.log('Session terminated.');
      stop();
    }
    
    function stop() {
      // isAudioMuted = false;
      // isVideoMuted = false;
      pc.close();
      pc = null;
    }
    
    ///////////////////////////////////////////
    
    // Set Opus as the default audio codec if it's present.
    function preferOpus(sdp) {
      var sdpLines = sdp.split('\r\n');
      var mLineIndex;
      // Search for m line.
      for (var i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('m=audio') !== -1) {
          mLineIndex = i;
          break;
        }
      }
      if (mLineIndex === null) {
        return sdp;
      }
    
      // If Opus is available, set it as the default in m line.
      for (i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('opus/48000') !== -1) {
          var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
          if (opusPayload) {
            sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex],
              opusPayload);
          }
          break;
        }
      }
    
      // Remove CN in m line and sdp.
      sdpLines = removeCN(sdpLines, mLineIndex);
    
      sdp = sdpLines.join('\r\n');
      return sdp;
    }
    
    function extractSdp(sdpLine, pattern) {
      var result = sdpLine.match(pattern);
      return result && result.length === 2 ? result[1] : null;
    }
    
    // Set the selected codec to the first in m line.
    function setDefaultCodec(mLine, payload) {
      var elements = mLine.split(' ');
      var newLine = [];
      var index = 0;
      for (var i = 0; i < elements.length; i++) {
        if (index === 3) { // Format of media starts from the fourth.
          newLine[index++] = payload; // Put target payload to the first.
        }
        if (elements[i] !== payload) {
          newLine[index++] = elements[i];
        }
      }
      return newLine.join(' ');
    }
    
    // Strip CN from sdp before CN constraints is ready.
    function removeCN(sdpLines, mLineIndex) {
      var mLineElements = sdpLines[mLineIndex].split(' ');
      // Scan from end for the convenience of removing an item.
      for (var i = sdpLines.length - 1; i >= 0; i--) {
        var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
        if (payload) {
          var cnPos = mLineElements.indexOf(payload);
          if (cnPos !== -1) {
            // Remove CN payload from m line.
            mLineElements.splice(cnPos, 1);
          }
          // Remove CN line in sdp
          sdpLines.splice(i, 1);
        }
      }
    
      sdpLines[mLineIndex] = mLineElements.join(' ');
      return sdpLines;
    }
}


function init(scope){
  add_canvas();
  init_canvas(scope);
  init_video(socket);
}
