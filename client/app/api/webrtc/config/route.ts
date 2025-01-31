import { NextResponse } from "next/server";

const TURN_SERVER_USERNAME = "webrtc";
const TURN_SERVER_CREDENTIAL = "webrtc123";

export async function GET() {
  const timestamp = new Date().getTime();
  const ttl = 24 * 3600;
  const username = `${timestamp}:${TURN_SERVER_USERNAME}`;

  const iceServers = {
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
      {
        urls: [
          "turn:your-turn-server.com:3478?transport=tcp",
          "turn:your-turn-server.com:3478?transport=udp",
          "turns:your-turn-server.com:5349?transport=tcp",
        ],
        username: username,
        credential: TURN_SERVER_CREDENTIAL,
      },
    ],
    iceCandidatePoolSize: 10,
  };

  return NextResponse.json(iceServers);
}
