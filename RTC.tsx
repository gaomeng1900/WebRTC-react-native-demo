/* eslint-disable @typescript-eslint/no-unused-vars */
import {useEffect, useRef, useState} from 'react';

import {
  MediaStream,
  ScreenCapturePickerView,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  //   RTCView,
  //   MediaStreamTrack,
  mediaDevices,
  //   registerGlobals,
} from 'react-native-webrtc';

// registerGlobals();

import notifee, {AndroidImportance} from '@notifee/react-native';

import chalk_c from 'chalk';
const chalk = new chalk_c.Instance({level: 3}); // v4+rn 要求

import {HOST as hostname, peerConnectionOptions} from './setting';

export function RTC() {
  const id = '111';
  const targetID = '112';
  const role = 'sender';

  const [ws, setWs] = useState<WebSocket | null>(null);

  // 建立 ws 链接

  useEffect(() => {
    console.log(chalk.greenBright.bold.bgBlack('Initing App...'));

    if (!id) {
      console.error(chalk.red('Missing id in query params'));
      return;
    }

    if (!targetID) {
      console.error(chalk.red('Missing targetID in query params'));
      return;
    }

    const url = `ws://${hostname}?id=${id}`;

    const ws = new WebSocket(url);
    // ws.binaryType = 'blob';

    ws.onopen = () => {
      console.log(chalk.greenBright.bold.bgBlack('Connected to server'));

      setWs(ws);

      ws.send(
        JSON.stringify({
          type: 'greeting',
          data: 'hello!',
          targetID,
        }),
      );
    };

    ws.onmessage = event => {
      const msg = event.data;
      console.log(chalk.magenta('Received message:'), msg);
    };

    globalThis.ws = ws;

    return () => {
      console.log(chalk.redBright.bold.bgBlack('Closing connection...'));
      ws.close();
      setWs(null);
    };
  }, [id, targetID]);

  /**
   * @see https://react-native-webrtc.github.io/handbook/guides/extra-steps/android.html#screen-capture-support-android-10
   * The basic requirement to get screen capturing working since Android 10 and above
   * is to have a foreground service with mediaProjection included as a service type
   * and to have that service running before starting a screen capture session.
   */
  const [foregroundService, setForegroundService] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const channelId = await notifee.createChannel({
          id: 'screen_capture',
          name: 'Screen Capture',
          lights: false,
          vibration: false,
          importance: AndroidImportance.DEFAULT,
        });
        console.log(chalk.greenBright('channelId:'), channelId);

        await notifee.displayNotification({
          title: 'Screen Capture',
          body: 'This notification will be here until you stop capturing.',
          android: {
            channelId,
            asForegroundService: true,
          },
        });

        setForegroundService(true);
      } catch (err) {
        // Handle Error
        console.error(err);
        setForegroundService(false);
      }
    })();
    return () => {
      (async () => {
        setForegroundService(false);
        await notifee.stopForegroundService();
      })();
    };
  }, []);

  // get media stream
  const [stream, setStream] = useState<MediaStream | null>(null);
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    let stream: MediaStream | null = null;
    (async () => {
      if (!foregroundService) {
        return;
      }

      // eslint-disable-next-line prettier/prettier
      stream = await (mediaDevices.getDisplayMedia as any)({
        video: true,
        audio: false,
      });
      setStream(stream);

      console.log(chalk.greenBright('Got MediaStream:'), stream);

      // const track = stream.getVideoTracks()[0];
      // const sender = new RTCPeerConnection();
      // sender.addTrack(track, stream);

      // const offer = await sender.createOffer();
      // await sender.setLocalDescription(offer);

      // ws.send(
      //   JSON.stringify({
      //     type: 'offer',
      //     data: offer,
      //     targetID,
      //   }),
      // );
    })();

    return () => {
      if (stream) {
        stream.getTracks().map(track => track.stop());
      }
      stream = null;
      setStream(null);
    };
  }, [foregroundService]);

  // 发送侧
  useEffect(() => {
    if (!ws) {
      return;
    }
    if (!stream) {
      return;
    }
    if (!targetID) {
      console.error(chalk.red('Missing targetID in query params'));
      return;
    }

    if (role !== 'sender') {
      return;
    }

    const peerConnection = new RTCPeerConnection(peerConnectionOptions);

    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    peerConnection.addEventListener('icecandidate', event => {
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

    peerConnection.createOffer().then(offer => {
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
        peerConnection.setRemoteDescription(
          new RTCSessionDescription(msg.data),
        );
      }

      if (msg.type === 'ice-candidate') {
        console.log(chalk.yellow('Received ICE candidate'));
        peerConnection.addIceCandidate(new RTCIceCandidate(msg.data));
      }
    };

    return () => {
      console.log(chalk.redBright.bold.bgBlack('Closing connection...'));
      peerConnection.close();
    };
  }, [ws, id, targetID, role, stream]);

  return <></>;
}
