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
  const peerConnection = new RTCPeerConnection({
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

  const handleNewUserJoin = async ({email_id}: any) => {
    if (socket) {
      const offer = await createOffer();
      console.log('new USer Arrive ', email_id, offer);
      setEventMessage('new USer Arrive');
      socket.emit('call_user', {email_id, offer});
      setRemoteEmailId(email_id);
    }
  };

  const handleCallAccepted = async ({ans}: any) => {
    try {
      console.log('answer recived from peer');
      setEventMessage('answer recived from peer');
      const answerDescription = new RTCSessionDescription(ans);
      await peerConnection.setRemoteDescription(answerDescription);
    } catch (error) {
      console.error('Error setting setRemoteDescription:', error);
    }
  };

  const handleNegotiation = async () => {
    console.log('negotiationneeded');
    setEventMessage('negotiationneeded');
    if (!socket) return null;
    try {
      const localOffer = await createOffer();
      console.log('negotiation needed', localOffer);
      socket.emit('call_user', {email_id: remoteEmailId, offer: localOffer});
    } catch (error) {
      console.error('Error during negotiation:', error);
      // Handle error appropriately
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

  const handleTrackEvent = (event: any): void => {
    try {
      console.log('remote track event', event);
      setRemoteStream(event.streams[0]);
    } catch (error) {
      console.log('error while setting remote stream', error);
    }
  };

  const createOffer = async () => {
    try {
      const offer = await peerConnection.createOffer({
        mandatory: {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true,
          VoiceActivityDetection: true,
        },
      });
      await peerConnection.setLocalDescription(offer);
      console.log('offer send to peer');
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      // Handle error appropriately
    }
  };

  const createAns = async (offer: any) => {
    try {
      console.log('offer recived to peer', offer);
      const offerDescription = new RTCSessionDescription(offer);
      await peerConnection.setRemoteDescription(offerDescription);
      const answerDescription = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answerDescription);
      console.log('answer send to peer');
      return answerDescription;
    } catch (error) {
      console.error('Error creating ans:', error);
    }
  };

  useEffect(() => {
    if (socket) {
      const handleRoomJoined = (data: RoomJoinedData) => {
        console.log('Joined room:', data);
        setRoomJoin(data.room_id);
      };

      socket.on('joined_room', handleRoomJoined);
      setEventMessage('Room joined');
      // Clean up on unmount
      return () => {
        socket.off('joined_room', handleRoomJoined);
        socket.disconnect(); // Ensure proper disconnection
      };
    }
  }, [socket]);

  useEffect(() => {
    if (roomJoin) {
      const startStream = async () => {
        try {
          const _stream = await mediaDevices.getUserMedia({
            video: {
              facingMode: 'user',
            },
            audio: true,
          });

          _stream
            .getTracks()
            .forEach(track => peerConnection.addTrack(track, _stream));

          setStream(_stream);
        } catch (error) {
          console.error('Error accessing media devices.', error);
        }
      };

      startStream();
    }
  }, [roomJoin]);

  useEffect(() => {
    if (socket) {
      socket.on('user_joined', handleNewUserJoin);
      socket.on('incomming_call', handleIncommingCall);
      socket.on('call_accepted', handleCallAccepted);

      return () => {
        socket.off('user_joined', handleNewUserJoin);
        socket.off('incomming_call', handleIncommingCall);
        socket.off('call_accepted', handleCallAccepted);
      };
    }
  }, [socket]);

  useEffect(() => {
    peerConnection.addEventListener('negotiationneeded', handleNegotiation);

    return () => {
      peerConnection.removeEventListener(
        'negotiationneeded',
        handleNegotiation,
      );
    };
  }, [peerConnection, handleNegotiation]);

  useEffect(() => {
    peerConnection.addEventListener('connectionstatechange', event => {
      switch (peerConnection.connectionState) {
        case 'closed':
          // You can handle the call being disconnected here.
          console.log('call get disconnected');

          break;
      }
    });
  }, [peerConnection]);

  useEffect(() => {
    try {
      peerConnection.addEventListener('track', handleTrackEvent);
      return () => {
        peerConnection.removeEventListener('track', handleTrackEvent);
      };
    } catch (error) {
      console.error('Error setting up track event listener:', error);
      // Handle error appropriately
    }
  }, [peerConnection, handleTrackEvent]);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'black'}}>
      <View style={styles.container}>
        {stream ? (
          <RTCView
            streamURL={stream.toURL()}
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

      {remoteStream ? (
        <RTCView
          objectFit={'cover'}
          style={{
            flex: 1,
            backgroundColor: '#050A0E',
            margin: 20,
            marginTop: 250,
            zIndex: 0,
          }}
          streamURL={remoteStream.toURL()}
          // streamURL={stream.toURL()}
        />
      ) : null}
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
    zIndex: 10,
    borderRadius: 20,
    backgroundColor: 'red',
  },
  video: {
    width: 100,
    height: 150,
    zIndex: 10,
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
