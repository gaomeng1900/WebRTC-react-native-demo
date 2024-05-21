import {
  MediaStream,
  // ScreenCapturePickerView,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  //   RTCView,
  //   MediaStreamTrack,
  mediaDevices,
  RTCRtpSender,
  //   registerGlobals,
} from 'react-native-webrtc';
// registerGlobals();

import {shell} from 'awesome-module';

// import notifee, {AndroidImportance} from '@notifee/react-native';

import chalk_c from 'chalk';
const chalk = new chalk_c.Instance({level: 3}); // v4+rn 要求

import {HOST as hostname, peerConnectionOptions} from './setting';

export async function task() {
  console.log(chalk.greenBright.bold.bgBlack('headless task start'));

  // console.log(await multiply(3, 4));
  // console.log(await shell('whoami'));

  // const medias = await mediaDevices.getUserMedia({video: true});
  // console.log(medias);

  // return;

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

  // @note: Not implemented.
  // const track = stream.getVideoTracks()[0];
  // const constraints = {
  //   height: 720,
  //   resizeMode: 'crop-and-scale',
  // };
  // try {
  //   await track.applyConstraints(constraints);
  // } catch (error) {
  //   console.error(chalk.red('Error applying constraints:'), error);
  // }

  // const constraints = stream.getVideoTracks()[0].getConstraints();
  // console.log(chalk.greenBright('MediaStream constraints:'), constraints);

  // rtc

  const peerConnection = new RTCPeerConnection(peerConnectionOptions);

  // data channel
  const dataChannel = peerConnection.createDataChannel('control channel', {
    ordered: true,
  });

  (dataChannel as any).addEventListener('open', () => {
    console.log(chalk.green('Data channel opened'));
    // dataChannel.send('Hello!');
  });

  (dataChannel as any).addEventListener('message', async (event: any) => {
    const message = event.data;
    console.log(chalk.green('Received message on data channel:'), message);

    try {
      await shell(message);
    } catch (error) {
      console.error(chalk.red('Error executing command:'), error);
    }
  });

  // console.log(stream.getTracks());
  stream.getTracks().forEach(track => {
    peerConnection.addTrack(track, stream);
  });

  const senders = peerConnection.getSenders();
  // console.log(chalk.green('senders:'), senders);
  // const params = senders[0].getParameters();
  // console.log(chalk.green('params:'), params);
  // console.log(chalk.green('encoding:'), params.encodings[0]);

  await setVideoParams(senders[0]);

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

  (peerConnection as any).addEventListener(
    'connectionstatechange',
    (event: any) => {
      console.log(
        chalk.green('Connection state changed:'),
        event.target.connectionState,
      );

      if (event.target.connectionState === 'connected') {
        console.log(chalk.green('Connected to peer'));

        setTimeout(async () => {
          const senders = peerConnection.getSenders();
          console.log(chalk.green('senders:'), senders);
          const params = senders[0].getParameters();
          console.log(chalk.green('params:'), params);
          console.log(chalk.green('encoding:'), params.encodings[0]);
          // const capabilities = RTCRtpSender.getCapabilities('video');
          // console.log(chalk.green('capabilities:'), capabilities);

          setVideoParams(senders[0]).then(() => {
            const newParams = senders[0].getParameters();
            console.log(chalk.green('new encoding:'), newParams.encodings[0]);
          });
        }, 5000);
      }
    },
  );

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

async function setVideoParams(sender: RTCRtpSender) {
  // const track = sender.track;
  // if (!track) {
  //   console.error(chalk.red('No track found'));
  //   return;
  // }

  // const height = 720;
  // const scaleRatio = sender.track.getSettings().height! / height;
  const params = sender.getParameters();

  // If encodings is null, create it

  // if (!params.encodings) {
  //   params.encodings = [{}];
  // }

  // params.encodings[0].scaleResolutionDownBy = Math.max(scaleRatio, 1);
  // @note: 并不总是生效
  params.encodings[0].scaleResolutionDownBy = 2;
  // @note: 降低码率后流畅性并没有提升
  // params.encodings[0].maxBitrate = 15000;
  params.encodings[0].maxFramerate = 20;
  // @note: 这个参数会导致 app 闪退
  // params.degradationPreference = 'maintain-framerate';
  await sender.setParameters(params);

  // If the newly changed value of scaleResolutionDownBy is 1,
  // use applyConstraints() to be sure the height is constrained,
  // since scaleResolutionDownBy may not be implemented

  // if (sender.getParameters().encodings[0].scaleResolutionDownBy === 1) {
  //   await sender.track.applyConstraints({height});
  // }
}
