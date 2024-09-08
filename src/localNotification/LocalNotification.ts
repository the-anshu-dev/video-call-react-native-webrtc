import PushNotification from 'react-native-push-notification';

// Create the notification function for incoming calls
const CallNotification = (title: string, message: string) => {
  const channelId = 'video-call'; // Define a constant channel ID for video calls

  // Create or update the notification channel
  PushNotification.createChannel(
    {
      channelId: channelId, // Use a constant channel ID for video calls
      channelName: 'Incoming Call', // Descriptive name for the channel
      channelDescription: 'Notifications for incoming video calls', // Optional description
      importance: 4, // High importance for video call notifications
      vibrate: true, // Enable vibration for calls
    },
    (created) => console.log(`createChannel returned '${created}'`) // Log if channel is created or already exists
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
    autoCancel: false, // Prevent the notification from being swiped away
    invokeApp: true, // Ensure the app is launched when tapped
    // Custom actions for "Accept" and "Reject" will need to be handled
  });
};

// Export the notification function
export default CallNotification;
