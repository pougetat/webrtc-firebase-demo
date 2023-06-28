import './style.css';

import firebase from 'firebase/app';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCdgs8o1j3inzFXJeKnIkivkfdRAswOePQ",
  authDomain: "testingwebrtc-tizen.firebaseapp.com",
  projectId: "testingwebrtc-tizen",
  storageBucket: "testingwebrtc-tizen.appspot.com",
  messagingSenderId: "1000063507339",
  appId: "1:1000063507339:web:fd260791ca2fb1152bed8e",
  measurementId: "G-DPJ96TKJMY"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Global State
const pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;

// HTML elements
const webcamButton = document.getElementById('webcamButton');
const webcamVideo = document.getElementById('webcamVideo');
const callButton = document.getElementById('callButton');
const callInput = document.getElementById('callInput');
const answerButton = document.getElementById('answerButton');
const remoteVideo = document.getElementById('remoteVideo');
const hangupButton = document.getElementById('hangupButton');

// 1. Setup media sources

webcamButton.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  remoteStream = new MediaStream();

  // Push tracks from local stream to peer connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // Pull tracks from remote stream, add to video stream
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  webcamVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;

  callButton.disabled = false;
  answerButton.disabled = false;
  webcamButton.disabled = true;
};

// 2. Create an offer
callButton.onclick = async () => {
  // Reference Firestore collections for signaling
  const callDoc = firestore.collection('calls').doc();
  const offerCandidates = callDoc.collection('offerCandidates');
  const answerCandidates = callDoc.collection('answerCandidates');

  callInput.value = callDoc.id;

  // Get candidates for caller, save to db
  pc.onicecandidate = (event) => {
    event.candidate && offerCandidates.add(event.candidate.toJSON());
  };

  // Create offer
  const offerDescription = await pc.createOffer();
  const fingerprintLine = getFingerprint(offerDescription.sdp);

/*
  offerDescription.sdp =
`v=0\r
o=- 662063277573701632 2 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE 0 1\r
a=extmap-allow-mixed\r
a=msid-semantic: WMS 2c99327e-1722-4fcc-a0b1-2b1b0e316b4d\r
m=audio 9 UDP/TLS/RTP/SAVPF 111 63 9 0 8 13 110 126\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:o46z\r
a=ice-pwd:xpLlpL0WQHICazUew2rHXN8c\r
a=ice-options:trickle\r
${fingerprintLine}\r
a=setup:actpass\r
a=mid:0\r
a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=sendonly\r
a=msid:2c99327e-1722-4fcc-a0b1-2b1b0e316b4d 5e61ea20-c5fc-4891-9d2d-de47d563740d\r
a=rtcp-mux\r
a=rtpmap:111 opus/48000/2\r
a=rtcp-fb:111 transport-cc\r
a=fmtp:111 minptime=10;useinbandfec=1\r
a=rtpmap:63 red/48000/2\r
a=fmtp:63 111/111\r
a=rtpmap:9 G722/8000\r
a=rtpmap:0 PCMU/8000\r
a=rtpmap:8 PCMA/8000\r
a=rtpmap:13 CN/8000\r
a=rtpmap:110 telephone-event/48000\r
a=rtpmap:126 telephone-event/8000\r
a=ssrc:2091796681 cname:lSOd4dTBmQJ/kxOu\r
a=ssrc:2091796681 msid:2c99327e-1722-4fcc-a0b1-2b1b0e316b4d 5e61ea20-c5fc-4891-9d2d-de47d563740d\r
m=video 9 UDP/TLS/RTP/SAVPF 106 122\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:o46z\r
a=ice-pwd:xpLlpL0WQHICazUew2rHXN8c\r
a=ice-options:trickle\r
${fingerprintLine}\r
a=setup:actpass\r
a=mid:1\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:13 urn:3gpp:video-orientation\r
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=extmap:10 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r
a=extmap:11 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r
a=sendrecv\r
a=msid:2c99327e-1722-4fcc-a0b1-2b1b0e316b4d 5fa47195-2ea0-4672-9177-bfedd526a2ea\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:106 H264/90000\r
a=rtcp-fb:106 goog-remb\r
a=rtcp-fb:106 transport-cc\r
a=rtcp-fb:106 ccm fir\r
a=rtcp-fb:106 nack\r
a=rtcp-fb:106 nack pli\r
a=fmtp:106 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:122 flexfec-03/90000\r
a=rtcp-fb:122 goog-remb\r
a=rtcp-fb:122 transport-cc\r
a=fmtp:122 repair-window=200000\r
a=ssrc-group:FID 1625343362 2003581107\r
a=ssrc-group:FEC-FR 1625343362 1080772241\r
a=ssrc:1625343362 cname:lSOd4dTBmQJ/kxOu\r
a=ssrc:1625343362 msid:2c99327e-1722-4fcc-a0b1-2b1b0e316b4d 5fa47195-2ea0-4672-9177-bfedd526a2ea\r
a=ssrc:2003581107 cname:lSOd4dTBmQJ/kxOu\r
a=ssrc:2003581107 msid:2c99327e-1722-4fcc-a0b1-2b1b0e316b4d 5fa47195-2ea0-4672-9177-bfedd526a2ea\r
a=ssrc:1080772241 cname:lSOd4dTBmQJ/kxOu\r
a=ssrc:1080772241 msid:2c99327e-1722-4fcc-a0b1-2b1b0e316b4d 5fa47195-2ea0-4672-9177-bfedd526a2ea\r\n`
*/

/*
offerDescription.sdp =
`v=0\r
o=- 8403615332048243445 2 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=group:BUNDLE 0\r
m=video 9 UDP/TLS/RTP/SAVPF 102 122\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:IZeV\r
a=ice-pwd:uaZhQD4rYM/Tta2qWBT1Bbt4\r
a=ice-options:trickle\r
${fingerprintLine}\r
a=setup:actpass\r
a=mid:0\r
a=sendrecv\r
a=msid:stream track\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:102 VP8/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=rtpmap:122 flexfec-03/90000\r
a=fmtp:122 repair-window=10000000\r
a=ssrc-group:FEC-FR 1224551896 1953032773\r
a=ssrc:1224551896 cname:/exJcmhSLpyu9FgV\r
a=ssrc:1953032773 cname:/exJcmhSLpyu9FgV\r\n`;
*/

offerDescription.sdp =
`v=0\r
o=- 3917366719420873404 2 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=msid-semantic: WMS yLfNPDbbimfHscKAhoknwawZaAwPogS2UHXe\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123 119 117\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:FaMq\r
a=ice-pwd:LdwFc2X4VT0cLYSNpVnJHdY2\r
a=ice-options:trickle\r
${fingerprintLine}\r
a=setup:actpass\r
a=mid:1\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:13 urn:3gpp:video-orientation\r
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:12 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:11 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:8 http://tools.ietf.org/html/draft-ietf-avtext-framemarking-07\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=extmap:5 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r
a=extmap:6 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r
a=sendrecv\r
a=msid:yLfNPDbbimfHscKAhoknwawZaAwPogS2UHXe cd9bb9d3-a612-45d5-afc7-8c0b60b0bde5\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 H264/90000\r
a=rtcp-fb:124 goog-remb\r
a=rtcp-fb:124 transport-cc\r
a=rtcp-fb:124 ccm fir\r
a=rtcp-fb:124 nack\r
a=rtcp-fb:124 nack pli\r
a=fmtp:124 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d0032\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 H264/90000\r
a=rtcp-fb:123 goog-remb\r
a=rtcp-fb:123 transport-cc\r
a=rtcp-fb:123 ccm fir\r
a=rtcp-fb:123 nack\r
a=rtcp-fb:123 nack pli\r
a=fmtp:123 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640032\r
a=rtpmap:119 rtx/90000\r
a=fmtp:119 apt=123\r
a=rtpmap:117 flexfec-03/90000\r
a=fmtp:117 L:5; D:10; ToP:2; repair-window:200\r
a=ssrc-group:FID 1150774572 3495085709\r
a=ssrc-group:FEC-FR 1150774572 2345\r
a=ssrc:1150774572 cname:VyEK+J+FlCThuUt0\r
a=ssrc:3495085709 cname:VyEK+J+FlCThuUt0\r
a=ssrc:2345 cname:VyEK+J+FlCThuUt0\r\n`;

  console.log("Here is the offer");
  console.log(offerDescription.sdp);

  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await callDoc.set({ offer });

  // Listen for remote answer
  callDoc.onSnapshot((snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
  });

  // When answered, add candidate to peer connection
  answerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });

  hangupButton.disabled = false;
};

// 3. Answer the call with the unique ID
answerButton.onclick = async () => {
  const callId = callInput.value;
  const callDoc = firestore.collection('calls').doc(callId);
  const answerCandidates = callDoc.collection('answerCandidates');
  const offerCandidates = callDoc.collection('offerCandidates');

  pc.onicecandidate = (event) => {
    event.candidate && answerCandidates.add(event.candidate.toJSON());
  };

  const callData = (await callDoc.get()).data();

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();

  console.log("HERE IS THE OLD ANSWER");
  console.log(answerDescription.sdp);


  const fingerprintLine = getFingerprint(answerDescription.sdp);

  answerDescription.sdp =
`v=0\r
o=- 3936474526705670197 2 IN IP4 127.0.0.1\r
s=-\r
t=0 0\r
a=msid-semantic: WMS 65e82b7e-1d89-485b-aac2-7d8b28c3c9e9\r
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102 122 127 121 125 107 108 109 124 120 123 119 117\r
c=IN IP4 0.0.0.0\r
a=rtcp:9 IN IP4 0.0.0.0\r
a=ice-ufrag:ASpm\r
a=ice-pwd:jZ30ohe+1A4YJVgqD4/8d6PY\r
a=ice-options:trickle\r
${fingerprintLine}\r
a=setup:active\r
a=mid:1\r
a=extmap:14 urn:ietf:params:rtp-hdrext:toffset\r
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r
a=extmap:13 urn:3gpp:video-orientation\r
a=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01\r
a=extmap:12 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay\r
a=extmap:11 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type\r
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing\r
a=extmap:9 http://www.webrtc.org/experiments/rtp-hdrext/color-space\r
a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mid\r
a=extmap:5 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id\r
a=extmap:6 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id\r
a=sendrecv\r
a=msid:65e82b7e-1d89-485b-aac2-7d8b28c3c9e9 ed0d5f28-d226-47f7-9098-3c7718a73fc9\r
a=rtcp-mux\r
a=rtcp-rsize\r
a=rtpmap:96 VP8/90000\r
a=rtcp-fb:96 goog-remb\r
a=rtcp-fb:96 transport-cc\r
a=rtcp-fb:96 ccm fir\r
a=rtcp-fb:96 nack\r
a=rtcp-fb:96 nack pli\r
a=rtpmap:97 rtx/90000\r
a=fmtp:97 apt=96\r
a=rtpmap:98 VP9/90000\r
a=rtcp-fb:98 goog-remb\r
a=rtcp-fb:98 transport-cc\r
a=rtcp-fb:98 ccm fir\r
a=rtcp-fb:98 nack\r
a=rtcp-fb:98 nack pli\r
a=fmtp:98 profile-id=0\r
a=rtpmap:99 rtx/90000\r
a=fmtp:99 apt=98\r
a=rtpmap:100 VP9/90000\r
a=rtcp-fb:100 goog-remb\r
a=rtcp-fb:100 transport-cc\r
a=rtcp-fb:100 ccm fir\r
a=rtcp-fb:100 nack\r
a=rtcp-fb:100 nack pli\r
a=fmtp:100 profile-id=2\r
a=rtpmap:101 rtx/90000\r
a=fmtp:101 apt=100\r
a=rtpmap:102 H264/90000\r
a=rtcp-fb:102 goog-remb\r
a=rtcp-fb:102 transport-cc\r
a=rtcp-fb:102 ccm fir\r
a=rtcp-fb:102 nack\r
a=rtcp-fb:102 nack pli\r
a=fmtp:102 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42001f\r
a=rtpmap:122 rtx/90000\r
a=fmtp:122 apt=102\r
a=rtpmap:127 H264/90000\r
a=rtcp-fb:127 goog-remb\r
a=rtcp-fb:127 transport-cc\r
a=rtcp-fb:127 ccm fir\r
a=rtcp-fb:127 nack\r
a=rtcp-fb:127 nack pli\r
a=fmtp:127 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42001f\r
a=rtpmap:121 rtx/90000\r
a=fmtp:121 apt=127\r
a=rtpmap:125 H264/90000\r
a=rtcp-fb:125 goog-remb\r
a=rtcp-fb:125 transport-cc\r
a=rtcp-fb:125 ccm fir\r
a=rtcp-fb:125 nack\r
a=rtcp-fb:125 nack pli\r
a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f\r
a=rtpmap:107 rtx/90000\r
a=fmtp:107 apt=125\r
a=rtpmap:108 H264/90000\r
a=rtcp-fb:108 goog-remb\r
a=rtcp-fb:108 transport-cc\r
a=rtcp-fb:108 ccm fir\r
a=rtcp-fb:108 nack\r
a=rtcp-fb:108 nack pli\r
a=fmtp:108 level-asymmetry-allowed=1;packetization-mode=0;profile-level-id=42e01f\r
a=rtpmap:109 rtx/90000\r
a=fmtp:109 apt=108\r
a=rtpmap:124 H264/90000\r
a=rtcp-fb:124 goog-remb\r
a=rtcp-fb:124 transport-cc\r
a=rtcp-fb:124 ccm fir\r
a=rtcp-fb:124 nack\r
a=rtcp-fb:124 nack pli\r
a=fmtp:124 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=4d001f\r
a=rtpmap:120 rtx/90000\r
a=fmtp:120 apt=124\r
a=rtpmap:123 H264/90000\r
a=rtcp-fb:123 goog-remb\r
a=rtcp-fb:123 transport-cc\r
a=rtcp-fb:123 ccm fir\r
a=rtcp-fb:123 nack\r
a=rtcp-fb:123 nack pli\r
a=fmtp:123 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=64001f\r
a=rtpmap:119 rtx/90000\r
a=fmtp:119 apt=123\r
a=rtpmap:117 flexfec-03/90000\r
a=fmtp:117 L:5; D:10; ToP:2; repair-window:200\r
a=ssrc-group:FID 2938260438 1859461734\r
a=ssrc-group:FEC-FR 2938260438 2345\r
a=ssrc:2938260438 cname:uwa1YcMXZcIOqtQ4\r
a=ssrc:1859461734 cname:uwa1YcMXZcIOqtQ4\r
a=ssrc:2345 cname:uwa1YcMXZcIOqtQ4\r\n`


console.log("HERE IS THE NEW ANSWER")
console.log(answerDescription.sdp);

  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await callDoc.update({ answer });

  offerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      console.log(change);
      if (change.type === 'added') {
        let data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
};

function getFingerprint(sdp) {
  const lines = sdp.trim().split('\n').map((line) => { return line.trim(); })
  for (let line of lines) {
      if (/^a=fingerprint:/.test(line)) {
          return line;
      }
  }
  return '';
}