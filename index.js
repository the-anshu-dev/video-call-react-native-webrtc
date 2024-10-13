/**
 * @format
 */

import { AppRegistry, DeviceEventEmitter } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';
import { showIncomingCallNotification } from './src/localNotification/LocalNotification';
import RNNotificationCall from 'react-native-full-screen-notification-incoming-call';
import { loadUser } from './src/hook/api';




messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Message handled in the background!', remoteMessage);

    const { data } = remoteMessage;
    if (data && data.type === 'call') {  // Ensure it's a call notification
        console.log('Displaying incoming call:', data);


        showIncomingCallNotification()




        console.log('Incoming call displayed.');


        let isAnswerHandled = false;

        const handleAnswer = async (data) => {
            if (isAnswerHandled) return; // Prevent handling if already done

            console.log('Call answered with data:', data);

            // Bring the app back to the foreground
            RNNotificationCall.backToApp();

            // Set the flag to true to prevent re-triggering
            isAnswerHandled = true;

            // Emit the event after a delay to let the app settle
            setTimeout(() => {
                console.log('Emitting RNNotificationAnswerAction');
                DeviceEventEmitter.emit('RNNotificationAnswerAction', data);

                // Reset the flag for future calls
                isAnswerHandled = false;
            }, 2000);
        };

        // Listen for the 'answer' event
        RNNotificationCall.addEventListener('answer', handleAnswer);
        RNNotificationCall.addEventListener('endCall', data => {
            const { callUUID, endAction, payload } = data;
            console.log('press endCall', callUUID);
        });


    }
});




// Register the main application component
AppRegistry.registerComponent(appName, () => App);




