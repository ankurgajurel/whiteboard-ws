"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";

interface VideoStreamProps {
  isHost: boolean;
  roomId: string;
  socket: Socket;
}

export function VideoStream({ isHost, roomId, socket }: VideoStreamProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    console.log("VideoStream: Starting connection, isHost:", isHost);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnectionRef.current = pc;

    pc.onconnectionstatechange = () => {
      console.log("Connection state changed:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setIsConnecting(false);
        setError(null);
      } else if (pc.connectionState === "failed") {
        setError("Connection failed. Please try refreshing the page.");
      }
    };

    pc.onsignalingstatechange = () => {
      console.log("Signaling state:", pc.signalingState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", pc.iceConnectionState);
    };

    let cleanupStream: (() => void) | undefined;

    const setupMediaStream = async () => {
      try {
        console.log("Requesting camera access...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        console.log("Camera access granted");
        localStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => {
          console.log("Adding track to peer connection:", track.kind);
          if (localStreamRef.current) {
            pc.addTrack(track, localStreamRef.current);
          }
        });

        return () => {
          console.log("Stopping all tracks");
          stream.getTracks().forEach((track) => track.stop());
        };
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError(
          err instanceof Error ? err.message : "Failed to access camera"
        );
        return undefined;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate");
        socket.emit("ice-candidate", event.candidate, roomId);
      }
    };

    pc.ontrack = (event) => {
      console.log("Received track:", event.streams[0]);
      if (videoRef.current && event.streams[0]) {
        console.log("Setting remote video stream");
        videoRef.current.srcObject = event.streams[0];
        videoRef.current.onloadedmetadata = () => {
          console.log("Remote video metadata loaded");
          setIsConnecting(false);
        };
      }
    };

    const handleUserConnected = async () => {
      if (isHost && pc.connectionState !== "closed") {
        try {
          console.log("Host: Creating offer for new user");
          const offer = await pc.createOffer({
            offerToReceiveVideo: true,
          });
          console.log("Created offer:", offer);
          await pc.setLocalDescription(offer);
          console.log("Set local description, sending offer");
          socket.emit("offer", offer, roomId);
        } catch (err) {
          console.error("Error creating offer:", err);
          setError("Failed to create connection offer");
        }
      }
    };

    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
      if (!isHost && pc.connectionState !== "closed") {
        try {
          console.log("Viewer: Received offer, setting remote description");
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          console.log("Created answer");
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          console.log("Set local description, sending answer");
          socket.emit("answer", answer, roomId);
        } catch (err) {
          console.error("Error handling offer:", err);
          setError("Failed to handle connection offer");
        }
      }
    };

    const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
      if (
        isHost &&
        pc.connectionState !== "closed" &&
        pc.signalingState !== "stable"
      ) {
        try {
          console.log("Host: Setting remote description from answer");
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error("Error setting remote description:", err);
          setError("Failed to establish connection");
        }
      }
    };

    const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
      try {
        if (pc.remoteDescription) {
          console.log("Adding ICE candidate");
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          console.log("Skipping ICE candidate: no remote description");
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    };

    socket.on("user-connected", handleUserConnected);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    if (isHost) {
      console.log("Initializing host media stream");
      setupMediaStream().then((cleanup) => {
        cleanupStream = cleanup;
      });
    }

    console.log("Joining room:", roomId);
    socket.emit("join-room", roomId);

    return () => {
      console.log("Cleaning up video connection");
      setIsConnecting(true);

      if (cleanupStream) {
        cleanupStream();
      }

      if (pc.connectionState !== "closed") {
        pc.close();
      }

      socket.off("user-connected", handleUserConnected);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [isHost, roomId, socket]);

  return (
    <div className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-lg overflow-hidden shadow-lg">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-75 text-white text-sm p-2 text-center">
          {error}
        </div>
      )}
      {isConnecting && !error && !isHost && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
          Connecting...
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isHost}
        className="w-full h-full object-cover"
        onLoadedMetadata={() => {
          console.log("Video metadata loaded:", {
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight,
            readyState: videoRef.current?.readyState,
            paused: videoRef.current?.paused,
            currentSrc: videoRef.current?.currentSrc,
            srcObject: videoRef.current?.srcObject,
          });
        }}
        onPlay={() => console.log("Video started playing")}
        onPause={() => console.log("Video paused")}
        onError={(e) => {
          console.error("Video error:", (e.target as HTMLVideoElement).error);
          setError("Video playback error");
        }}
      />
    </div>
  );
}
