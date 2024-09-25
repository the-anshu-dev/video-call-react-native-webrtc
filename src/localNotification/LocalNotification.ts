import PushNotification from 'react-native-push-notification';

// Create the notification function for incoming calls
const CallNotification = (title: string, message: string) => {
  const channelId = 'video-call'; // Define a constant channel ID for video calls

  // Create or update the notification channel
  PushNotification.createChannel(
    {
      channelId: channelId, 
      channelName: 'Incoming Call', 
      channelDescription: 'Notifications for incoming video calls', 
     
   
    },
    (created) => console.log(`createChannel returned '${created}'`) 
  );

  // Show the local notification
  PushNotification.localNotification({
    channelId: channelId, // Channel ID should match the one in createChannel
    title, // Title for the notification (e.g., "John Doe is calling")
    message, // Message (e.g., "Tap to answer the call")
    // actions: ['Accept', 'Reject'], // Actions for the notification
    playSound: true, // Play sound
    soundName: 'default', // Use the default sound for notifications
    vibrate: true, // Enable vibration
    priority: 'high', // High priority for video call notifications
    importance: 'high', // Set high importance for Android
    ongoing: true, // Make the notification non-dismissable (ongoing)
    autoCancel: false, 
    invokeApp: true, 
 
  });
};

// Export the notification function
export default CallNotification;
