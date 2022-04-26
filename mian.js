import socket from 'socket.io/socket.io.js';

var socket = io();
 window.URL.createObjectURL = window.URL.createObjectURL || window.URL.webkitCreateObjectURL || window.URL.mozCreateObjectURL || window.URL.msCreateObjectURL;               
 socket.on("data", function(data){
        var binaryData = [];
        binaryData.push(data);
        videoElement = document.getElementById('video');
        videoElement.src = window.URL.createObjectURL(new Blob(binaryData, {type: "video/webm"}));
        console.log("on data --------");
});
var mediaConstraints = {
        video: true
};

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);
function onMediaSuccess(stream) {
    alert("sdf---")
    var arrayOfStreams = [stream];
    alert("on MediaStreamRecorder ------++++--");
    var medias = new MediaStreamRecorder(stream);
    alert("on MediaStreamRecorder --------");
    medias.ondataavailable = function(blob) {
         socket.emit("send", blob);
    };
    medias.start();
}
function onMediaError(e) {
    console.error('media error', e);
}