import {
  MediaStream,
  // ScreenCapturePickerView,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  //   RTCView,
  //   MediaStreamTrack,
  mediaDevices,
  //   registerGlobals,
} from 'react-native-webrtc';

// registerGlobals();

// import notifee, {AndroidImportance} from '@notifee/react-native';

import chalk_c from 'chalk';
const chalk = new chalk_c.Instance({level: 3}); // v4+rn 要求

import {HOST as hostname, peerConnectionOptions} from './setting';

export async function task() {
  console.log(chalk.greenBright.bold.bgBlack('headless task start'));

  const id = '111';
  const targetID = '112';
  // const role = 'sender';

  // ws 链接

  const url = `ws://${hostname}?id=${id}`;
  const ws = new WebSocket(url);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  await new Promise((resolve, reject) => {
    ws.onopen = () => {
      console.log(chalk.greenBright.bold.bgBlack('Connected to server'));

      ws.send(
        JSON.stringify({
          type: 'greeting',
          data: 'hello!',
          targetID,
        }),
      );

      resolve(null);
    };
  });

  ws.onmessage = event => {
    const msg = event.data;
    console.log(chalk.magenta('Received message:'), msg);
  };

  (globalThis as any).ws = ws;

  // get media stream

  // eslint-disable-next-line prettier/prettier
  const stream: MediaStream = await mediaDevices.getDisplayMedia(); // 这个库不支持参数
  console.log(chalk.greenBright('Got MediaStream:'), stream);

  // rtc

  const peerConnection = new RTCPeerConnection(peerConnectionOptions);

  // console.log(stream.getTracks());
  stream.getTracks().forEach(track => {
    peerConnection.addTrack(track, stream);
  });

  (peerConnection as any).addEventListener('icecandidate', (event: any) => {
    // onicecandidate = event => {
    if (event.candidate) {
      console.log(
        chalk.yellow('Sending ICE candidate...'),
        // event.candidate,
      );
      ws.send(
        JSON.stringify({
          type: 'ice-candidate',
          data: event.candidate,
          targetID,
        }),
      );
    }
  });

  peerConnection.createOffer({}).then(offer => {
    peerConnection.setLocalDescription(offer);
    ws.send(
      JSON.stringify({
        type: 'offer',
        data: offer,
        targetID,
      }),
    );
  });

  ws.onmessage = event => {
    const msg = JSON.parse(event.data);
    console.log(chalk.magenta('Received message:'), msg);

    if (msg.type === 'answer') {
      console.log(chalk.green('Received answer'));
      peerConnection.setRemoteDescription(new RTCSessionDescription(msg.data));
    }

    if (msg.type === 'ice-candidate') {
      console.log(chalk.yellow('Received ICE candidate'));
      peerConnection.addIceCandidate(new RTCIceCandidate(msg.data));
    }
  };
}

// export async function task() {
//   console.log(chalk.greenBright.bold.bgBlack('headless task start'));

//   setInterval(() => {
//     console.log(chalk.greenBright.bold.bgBlack('headless task running'));
//   }, 1000);
// }
