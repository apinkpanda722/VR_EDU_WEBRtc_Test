/*
 *  Copyright (c) 2018 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

// Polyfill in Firefox.
// See https://blog.mozilla.org/webrtc/getdisplaymedia-now-available-in-adapter-js/

const socket = io("/");
const videoGrid = document.getElementById("video-grid");
/* const myPeer = new Peer(undefined, {
  host: "/",
  port: "3001",
}); */
const myPeer = new Peer();
const myVideo = document.createElement("video");
myVideo.muted = true;
/* const peers = {};
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream); // 이건 내 stream을 내 화면에 표시

    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    }); // 내가 call을 받는 것 => 즉 내가 상대방이 보내오는 stream을 받아서 내 화면에 표시
    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    }); // 내가 call을 보내는 것 => 즉 내 stream을 상대방에게 보내는 것
  });
 */
socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

/***** Sharing Display Part *****/

if (adapter.browserDetails.browser == "firefox") {
  adapter.browserShim.shimGetDisplayMedia(window, "screen");
}

function handleSuccess(stream) {
  startButton.disabled = true;
  const video = document.querySelector("video");
  video.srcObject = stream;

  myPeer.on("call", (call) => {
    call.answer(stream);
    call.on("stream", (userVideoStream) => {
      if (srcObject in video) {
        video.srcObject = null;
      } else {
        video.srcObject = userVideoStream;
      }
    });
  });
  socket.on("user-connected", (userId) => {
    sharingNewUser(userId, stream);
  });

  // Demonstrates how to detect that the user has stopped
  // Sharing the screen via the browser UI.
  stream.getVideoTracks()[0].addEventListener("ended", () => {
    errorMsg("The user has ended sharing the screen");
    startButton.disabled = false;
  });
}

function sharingNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.srcObject = "";
  });
}

function handleError(error) {
  errorMsg(`getDisplayMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
  const errorElement = document.querySelector("#errorMsg");
  errorElement.innerHTML += `<p>${msg}</p>`;
  if (typeof error !== "undefined") {
    console.error(error);
  }
}

const startButton = document.getElementById("startButton");
startButton.addEventListener("click", () => {
  navigator.mediaDevices
    .getDisplayMedia({ video: true })
    .then(handleSuccess, handleError);
});

if (navigator.mediaDevices && "getDisplayMedia" in navigator.mediaDevices) {
  startButton.disabled = false;
  stop;
} else {
  errorMsg("getDisplayMedia is not supported");
}
