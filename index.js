/**
 * @format
 */
import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import LocalNotification from './src/localNotification/LocalNotification';

messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);

});

// Handler for foreground notifications
messaging().onMessage(async remoteMessage => {
    console.log('A new message arrived!', remoteMessage);

    LocalNotification(remoteMessage?.notification?.title, remoteMessage?.notification?.body)

});


AppRegistry.registerComponent(appName, () => App);
