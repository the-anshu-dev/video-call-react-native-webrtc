/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useRef, useState} from 'react';

import {
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCView,
} from 'react-native-webrtc';
import {io, Socket} from 'socket.io-client';

interface RoomJoinedData {
  room_id: any;
}

function App(): React.JSX.Element {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomJoin, setRoomJoin] = useState();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteEmailId, setRemoteEmailId] = useState<String>();
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [EventMessage, setEventMessage] = useState<String>();
  const [email, setEmail] = useState<string>(''); // State for storing the user-entered email
  const [roomId, setRoomId] = useState<string>('');
  const peerConnection = useRef<RTCPeerConnection | null>(null);

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
  }, []);

  // create socket connection and emit with email and code
  const handleMakeConnection = () => {
    if (!roomId || !email) {
      alert('enter roomid and email');
    }

    console.log('click');
    setEventMessage('button Click');
    if (socket) {
      socket.disconnect();
    }

    const _socket = io('https://ice-server-socket.onrender.com');
    setSocket(_socket);
    _socket.emit('join_room', {room_id: roomId, email_id: email});
    setEventMessage('Join Room');
  };

  // --------------------------------------------------------------------------------
  // when there is new user with same code on server this even trigger
  // we create offer and send buy socket newly arrived user
  const createOffer = async () => {
    try {
      const offer = await peerConnection.current.createOffer({});
      await peerConnection.current.setLocalDescription(offer);
      console.log('offer send to peer');
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
      setEventMessage('new USer Arrive');
      socket.emit('call_user', {email_id, offer});
      setRemoteEmailId(email_id);
    }
  };
  // --------------------------------------------------------------------------------------

  // --------------------------------------------------------------------------------------
  // when  newly arrive user receive offer he create ans
  // and send back to user who start calling
  const createAns = async (offer: any) => {
    try {
      // console.log('offer recived to peer', offer);
      const offerDescription = new RTCSessionDescription(offer);
      await peerConnection.current.setRemoteDescription(offerDescription);
      const answerDescription = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answerDescription);
      console.log('answer send to peer');
      return answerDescription;
    } catch (error) {
      console.error('Error creating ans:', error);
    }
  };
  const handleIncommingCall = async (data: any) => {
    if (socket) {
      const {fromEmail, offer} = data;
      const ans = await createAns(offer);
      setEventMessage('offer recieved');
      socket.emit('call_accepted', {email_id: fromEmail, ans});
      setRemoteEmailId(fromEmail);
    }
  };
  // --------------------------------------------------------------------------------------

  // --------------------------------------------------------------------------------------
  // when call accepted user Receive the ans of offer
  // set to there remote description
  const handleCallAccepted = async ({ans}: any) => {
    try {
      console.log('answer recived from peer');
      setEventMessage('answer recived from peer');
      const answerDescription = new RTCSessionDescription(ans);
      await peerConnection.current.setRemoteDescription(answerDescription);
    } catch (error) {
      console.error('Error setting setRemoteDescription:', error);
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
          console.log('Local stream added:', _stream);
        } catch (error) {
          console.error('Error accessing media devices.', error);
        }
      };

      const handleRoomJoined = (data: RoomJoinedData) => {
        setRoomJoin(data.room_id);
        startStream();
      };

      socket.on('joined_room', handleRoomJoined);
      setEventMessage('Room joined');

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
            console.log('Received ICE candidate:', candidate);
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
          console.log('Received ICE candidate:', candidate);
          try {
            if (candidate) {
              console.log('Received ICE candidate:', candidate);
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
        console.log('ice candidate sended', event, remoteEmailId);
        if (event.candidate && remoteEmailId) {
          socket.emit('ice_candidate', {
            email_id: remoteEmailId,
            candidate: event.candidate,
          });
        }
      };

      peerConnection.current.ontrack = event => {
        console.log('Track received:', event.streams);
        const [remoteStream] = event.streams;

        if (remoteStream) {
          console.log('Setting remote stream:', remoteStream);
          setRemoteStream(remoteStream);
        }
      };

      peerConnection.current.onconnectionstatechange = () => {
        const connectionState = peerConnection.current.connectionState;
        console.log('Connection State:', connectionState);
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
    if (remoteStream) {
      console.log('Remote stream state updated:', remoteStream.toURL());
    }
  }, [remoteStream]);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'black'}}>
      <View style={styles.container}>
        <Text style={{color: 'white'}}>{remoteEmailId}</Text>
        {stream ? (
          <RTCView
            streamURL={stream?.toURL() || ''}
            style={styles.video}
            objectFit="cover"
            mirror={true}
          />
        ) : (
          <Text style={{color: 'white'}}>No video stream available</Text>
        )}
        <Text style={{fontSize: 14, color: 'white', marginTop: 10}}>
          {EventMessage}..
        </Text>
      </View>

      <View style={{...styles.container, left: 20}}>
        <Text style={{color: 'white'}}>remote screen</Text>
        {remoteStream ? (
          <RTCView
            streamURL={remoteStream?.toURL() || ''}
            style={styles.video}
            objectFit="cover"
            mirror={true}
          />
        ) : (
          <Text style={{color: 'white'}}>No remoteStream stream available</Text>
        )}
      </View>

      <View
        style={{
          width: '100%',
          position: 'absolute',
          bottom: 40,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {!roomJoin && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#888"
              onChangeText={setEmail}
              value={email}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter room ID"
              placeholderTextColor="#888"
              onChangeText={setRoomId}
              value={roomId}
              keyboardType="numeric"
            />
            <Button
              onPress={handleMakeConnection}
              title="call"
              color={'green'}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 20,
    backgroundColor: 'red',
  },
  video: {
    width: 100,
    height: 150,
  },
  inputContainer: {
    padding: 20,
  },
  input: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 10,
    color: 'white',
  },
});

export default App;
