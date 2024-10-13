/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import RNNotificationCall from 'react-native-full-screen-notification-incoming-call';

import React, {useEffect, useRef, useState} from 'react';

import {
  ActivityIndicator,
  Alert,
  Button,
  Linking,
  PushNotificationIOS,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCView,
} from 'react-native-webrtc';
import {io, Socket} from 'socket.io-client';
import {loadUser, loadUserList, login} from './src/hook/api';

import RemoteNotification from './src/remoteNotification/RemoteNotification';
import messaging from '@react-native-firebase/messaging';
import LoginForm from './src/components/LoginForm';
import VideoStreamView from './src/components/VideoStreamView';
import CallControls from './src/components/CallControls';

interface RoomJoinedData {
  room_id: any;
}

function App(): React.JSX.Element {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomJoin, setRoomJoin] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteEmailId, setRemoteEmailId] = useState<String>();
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [EventMessage, setEventMessage] = useState<String>('');
  const [localMicOn, setlocalMicOn] = useState(true);
  const [localWebcamOn, setlocalWebcamOn] = useState(true);
  const [password, setPassword] = useState<string>();
  const [phone, setPhone] = useState<string>();
  const [me, setMe] = useState({});
  const [loading, setLoading] = useState(false);
  const [userList, setUserList] = useState([]);
  // const [email, setEmail] = useState<string>(''); // State for storing the user-entered email
  // const [roomId, setRoomId] = useState<string>('');

  const peerConnection = useRef<RTCPeerConnection | null>(null);

  // create socket connection and emit with email and code
  const handleMakeConnection = (email: string, roomId: string) => {
    try {
      let _socket = socket;
      if (!_socket) {
        _socket = io('https://ice-server-socket.onrender.com');
        // const _socket = io('http://10.0.2.2:8000');
        // _socket.emit('set-status', {code});
        setSocket(_socket);
      }

      if (_socket) {
        // const roomId = generateRandomString(10);
        // const email = `user${generateRandomString(5)}@example.com`;

        setEventMessage('Connecting...');

        _socket.emit('join_room', {room_id: roomId, email_id: email});
      } else {
        // console.log('socket not present');
      }
    } catch (error) {
      // console.log(error);
    }
  };

  // --------------------------------------------------------------------------------
  // when there is new user with same code on server this even trigger
  // we create offer and send buy socket newly arrived user
  const createOffer = async () => {
    if (!peerConnection.current) return;
    try {
      const offer = await peerConnection.current.createOffer({});
      await peerConnection.current.setLocalDescription(offer);

      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      // Handle error appropriately
    }
  };

  const handleNewUserJoin = async ({email_id}: any) => {
    if (socket) {
      const offer = await createOffer();
      console.log('new USer Arrive ');
      socket.emit('call_user', {email_id, offer});
      setRemoteEmailId(email_id);
    }
  };
  // --------------------------------------------------------------------------------------

  // --------------------------------------------------------------------------------------
  // when  newly arrive user receive offer he create ans
  // and send back to user who start calling
  const createAns = async (offer: any) => {
    if (!peerConnection.current) return;
    try {
      // console.log('offer recived to peer', offer);
      const offerDescription = new RTCSessionDescription(offer);
      await peerConnection.current.setRemoteDescription(offerDescription);
      const answerDescription = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answerDescription);

      return answerDescription;
    } catch (error) {
      console.error('Error creating ans:', error);
    }
  };
  const handleIncommingCall = async (data: any) => {
    if (socket) {
      const {fromEmail, offer} = data;
      const ans = await createAns(offer);

      socket.emit('call_accepted', {email_id: fromEmail, ans});
      setRemoteEmailId(fromEmail);
    }
  };
  // --------------------------------------------------------------------------------------

  // --------------------------------------------------------------------------------------
  // when call accepted user Receive the ans of offer
  // set to there remote description
  const handleCallAccepted = async ({ans}: any) => {
    if (peerConnection.current) {
      try {
        const answerDescription = new RTCSessionDescription(ans);
        await peerConnection.current.setRemoteDescription(answerDescription);
      } catch (error) {
        console.error('Error setting setRemoteDescription:', error);
      }
    }
  };
  // --------------------------------------------------------------------------------------

  // --------------------------------------------------------------------------------------
  // when user get connected  with socket by  code and email
  // we get joined_room Event
  // than we start camera and set Room join
  useEffect(() => {
    if (socket) {
      const startStream = async () => {
        try {
          const _stream = await mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
            },
            audio: true,
          });

          setStream(_stream);

          // Add each track from the local stream to the peer connection
          _stream.getTracks().forEach(track => {
            peerConnection.current.addTrack(track, _stream);
          });

          // Set the stream to be shown locally in the RTCView
        } catch (error) {
          console.error('Error accessing media devices.', error);
        }
      };

      const handleRoomJoined = (data: RoomJoinedData) => {
        setRoomJoin(data.room_id);
        setEventMessage('');
        startStream();
      };

      socket.on('joined_room', handleRoomJoined);

      return () => {
        socket.off('joined_room', handleRoomJoined);
        socket.disconnect(); // Ensure proper disconnection
      };
    }
  }, [socket]);
  // --------------------------------------------------------------------------------------

  useEffect(() => {
    if (socket) {
      socket.on('user_joined', handleNewUserJoin);
      socket.on('incomming_call', handleIncommingCall);
      socket.on('call_accepted', handleCallAccepted);
      socket.on('ice_candidate', async ({candidate}) => {
        try {
          if (candidate) {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(candidate),
            );
          }
        } catch (error) {
          console.error('Error adding received ICE candidate', error);
        }
      });

      return () => {
        socket.off('user_joined', handleNewUserJoin);
        socket.off('incomming_call', handleIncommingCall);
        socket.off('call_accepted', handleCallAccepted);
        socket.on('ice_candidate', async ({candidate}) => {
          try {
            if (candidate) {
              await peerConnection.current.addIceCandidate(
                new RTCIceCandidate(candidate),
              );
            }
          } catch (error) {
            console.error('Error adding received ICE candidate', error);
          }
        });
      };
    }
  }, [socket]);

  useEffect(() => {
    if (socket && peerConnection.current) {
      peerConnection.current.onicecandidate = event => {
        if (event.candidate && remoteEmailId) {
          socket.emit('ice_candidate', {
            email_id: remoteEmailId,
            candidate: event.candidate,
          });
        }
      };

      peerConnection.current.ontrack = event => {
        const [remoteStream] = event.streams;

        if (remoteStream) {
          setRemoteStream(remoteStream);
        }
      };

      peerConnection.current.onconnectionstatechange = () => {
        const connectionState = peerConnection.current.connectionState;

        if (connectionState === 'connected') {
          console.log('Peers connected');
        } else if (
          connectionState === 'disconnected' ||
          connectionState === 'failed'
        ) {
          console.log('Connection failed or disconnected');
        }
      };
    }
  }, [socket, peerConnection, remoteEmailId]);

  useEffect(() => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302',
        },
        {
          urls: 'stun:stun1.l.google.com:19302',
        },
        {
          urls: 'stun:stun2.l.google.com:19302',
        },
      ],
    });

    const _socket = io('https://ice-server-socket.onrender.com');
    // const _socket = io('http://10.0.2.2:8000');
    // _socket.emit('set-status', {code});
    setSocket(_socket);
  }, []);

  const handleLogin = async () => {
    if (!phone && !password) return;
    setLoading(true);
    const res = await login(phone, password);
    const data = await loadUser();

    setMe(data?.user);
    setLoading(false);
  };

  useEffect(() => {
    const unsub = async () => {
      setLoading(true);
      const data = await loadUser();

      setMe(data?.user);
      if (data?.user) {
        const {users} = await loadUserList();

        setUserList(users);
      }
      setLoading(false);
    };
    unsub();
  }, []);

  const handleHagout = () => {
    if (peerConnection.current) {
      // peerConnection.current.close();
      setStream(null);
      setRemoteStream(null);
      setRoomJoin('');
    }
  };

  function toggleMic() {
    if (stream) {
      setlocalMicOn(prev => !prev);
      stream.getAudioTracks().forEach(track => {
        localMicOn ? (track.enabled = false) : (track.enabled = true);
      });
    }
  }

  // Switch Camera
  // function switchCamera() {
  //   localStream.getVideoTracks().forEach((track) => {
  //     track._switchCamera();
  //   });
  // }

  // Enable/Disable Camera
  function toggleCamera() {
    if (stream) {
      setlocalWebcamOn(prev => !prev);
      stream.getVideoTracks().forEach(track => {
        localWebcamOn ? (track.enabled = false) : (track.enabled = true);
      });
    }
  }

  function switchCamera() {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track._switchCamera();
      });
    }
  }

  useEffect(() => {
    RNNotificationCall.addEventListener('answer', async data => {
      console.log('darshan1');

      RNNotificationCall.backToApp();
      console.log('darshan');

      const {callUUID, payload} = data;
      console.log('press answer', callUUID);
      const userData = await loadUser();
      console.log(userData?.user?.phone, userData?.user?.code);
      setMe(userData?.user);

      if (userData?.user) {
        handleMakeConnection(userData?.user?.name, userData?.user?.code);
      }
    });
    RNNotificationCall.addEventListener('endCall', data => {
      const {callUUID, endAction, payload} = data;
      console.log('press endCall', callUUID);
    });

    // Cleanup function on unmount
    return () => {
      RNNotificationCall.removeEventListener('answer');
      RNNotificationCall.removeEventListener('endCall');
    };
  }, []);

  if (loading)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: 'black',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {/* <Button title={'Click Here'} onPress={LocalNotification} /> */}
        <ActivityIndicator size="large" color="#00ff00" />
      </View>
    );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: 'black',
      }}>
      {EventMessage && (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{color: 'white'}}>{EventMessage}</Text>
        </View>
      )}

      <VideoStreamView
        stream={stream}
        remoteStream={remoteStream}
        localWebcamOn={localWebcamOn}
      />

      {(remoteStream || stream) && (
        <CallControls
          localMicOn={localMicOn}
          localWebcamOn={localWebcamOn}
          toggleMic={toggleMic}
          toggleCamera={toggleCamera}
          handleHangout={handleHagout}
        />
      )}
      {userList && !roomJoin && (
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-start',
            marginTop: 20,
          }}>
          {me && (
            <View
              style={{
                borderWidth: 1,
                borderColor: 'gray',
                borderRadius: 10,
                marginHorizontal: 10,
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 5,
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
              key={me?.phone}>
              <Text style={{color: 'white'}}>{me?.name}</Text>
              <TouchableOpacity
                onPress={() => handleMakeConnection(me?.name, me?.code)}
                style={{
                  backgroundColor: 'green',
                  borderRadius: 50,
                  paddingVertical: 10,
                  paddingHorizontal: 15,
                }}>
                <Icon name="phone" size={30} color="white" />
              </TouchableOpacity>
            </View>
          )}
          {!EventMessage &&
            userList.map(item => (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: 'gray',
                  borderRadius: 10,
                  marginHorizontal: 10,
                  alignItems: 'center',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
                key={item?.phone}>
                <Text style={{color: 'white'}}>{item?.name}</Text>
                <TouchableOpacity
                  onPress={() => handleMakeConnection(item?.phone, item?.code)}
                  style={{
                    backgroundColor: 'green',
                    borderRadius: 50,
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                  }}>
                  <Icon name="phone" size={30} color="white" />
                </TouchableOpacity>
              </View>
            ))}
        </View>
      )}
      <RemoteNotification />
      {/* <Button title={'Click Here'} onPress={LocalNotification} /> */}
      {!me && !EventMessage && (
        <LoginForm
          phone={phone}
          setPhone={setPhone}
          setPassword={setPassword}
          password={password}
          handleLogin={handleLogin}
          styles={styles}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    padding: 20,
  },
  input: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    width: '70%',
    paddingHorizontal: 10,
    color: 'white',
  },
});

export default App;
