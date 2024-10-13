
import RNNotificationCall from 'react-native-full-screen-notification-incoming-call';




export const showIncomingCallNotification=()=>{

  RNNotificationCall.displayNotification(
    '22221a97-8eb4-4ac2-b2cf-0a3c0b9100ad',
    null,
    30000,
    {
      channelId: 'com.abc.incomingcall',
      channelName: 'Incoming video call',
      notificationIcon: 'ic_launcher', //mipmap
      notificationTitle: 'Linh Vo',
      notificationBody: 'Incoming video call',
      answerText: 'Answer',
      declineText: 'Decline',
      notificationColor: 'colorAccent',
      isVideo:true,
      notificationSound: null, //raw
      //mainComponent:'MyReactNativeApp',//AppRegistry.registerComponent('MyReactNativeApp', () => CustomIncomingCall);
      // payload:{name:'Test',Body:'test'}
    }
  );
}






