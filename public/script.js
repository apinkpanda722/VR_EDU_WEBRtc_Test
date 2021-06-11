const socket = io("/", { transports: ["polling"] });
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer();
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream); // 이건 내 stream을 내 화면에 표시

    myPeer.on("call", (call) => {
      call.answer(stream); // call에는 자기의 stream으로 대답
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    }); // call에 실려 온 stream을 내 화면에 추가
    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    }); // 소켓에 userId를 가진 유저가 들어오면 그 유저의 stream을 가지고 와서 내 화면에 표시
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("videostream", (userVideoStream) => {
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
