/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {task} from './rtc-headless';

AppRegistry.registerComponent(appName, () => App);

notifee.registerForegroundService(notification => {
  return new Promise(() => {
    // Handle Notification
    console.log('ForegroundService start', notification);
    task();
  });
});

// AppRegistry.registerHeadlessTask('rtc-headless', () => {
//   return task;
// });

// task();

// console.log('hahahahhs');

// try {
//   const channelId = await notifee.createChannel({
//     id: 'screen_capture',
//     name: 'Screen Capture',
//     lights: false,
//     vibration: false,
//     importance: AndroidImportance.DEFAULT,
//   });
//   // console.log(chalk.greenBright('channelId:'), channelId);

//   await notifee.displayNotification({
//     title: 'Screen Capture',
//     body: 'This notification will be here until you stop capturing.',
//     android: {
//       channelId,
//       asForegroundService: true,
//     },
//   });
// } catch (err) {
//   // Handle Error
//   console.error(err);
// }
