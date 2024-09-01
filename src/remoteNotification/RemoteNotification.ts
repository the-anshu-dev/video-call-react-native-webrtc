import { useEffect } from "react";
import messaging from '@react-native-firebase/messaging';
import { sendTokenToServer } from "../hook/api";

const requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
    if (enabled) {
      console.log('Authorization status:', authStatus);
    } else {
      console.warn('Notification permission not granted.');
    }
  };
const RemoteNotification = () => {
    useEffect(() => {
      // Request permission for notifications
      requestUserPermission();
  
      // Get FCM token
      const getFCMToken = async () => {
        const token = await messaging().getToken();
        if (token) {
          console.log('FCM Token:', token);
          await sendTokenToServer(token); // Send token to your server
        }
      };
  
      // Register FCM token
      getFCMToken();
  
      // Handle foreground messages
      const unsubscribe = messaging().onMessage(async (remoteMessage) => {
        console.log('A new FCM message arrived!', remoteMessage);
        // You can display a local notification here if needed
      });
  
      // Clean up the listener on unmount
      return unsubscribe;
    }, []);
  
    return null;
  };
  export default RemoteNotification;
  
