/* eslint-disable @typescript-eslint/no-unused-vars */
import {useEffect, useRef, useState} from 'react';

import notifee, {AndroidImportance} from '@notifee/react-native';

import chalk_c from 'chalk';
const chalk = new chalk_c.Instance({level: 3}); // v4+rn 要求

export function Notice() {
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
          body: 'Screen capturing.',
          android: {
            channelId,
            asForegroundService: true,
          },
        });
      } catch (err) {
        // Handle Error
        console.error(err);
      }
    })();
    return () => {
      // notifee.stopForegroundService();
    };
  }, []);

  return <></>;
}
