import { WebSocket } from 'ws';

export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'freehand';
  points: Point[];
  color: string;
  strokeWidth: number;
}

export interface WhiteboardState {
  shapes: Shape[];
}

export type MessageType = 'draw' | 'clear' | 'sync' | 'video-offer' | 'video-answer' | 'ice-candidate';

export interface WhiteboardMessage {
  type: MessageType;
  payload: Shape | Shape[] | RTCSessionDescriptionInit | RTCIceCandidateInit | null;
  roomId: string;
}

export interface Room {
  id: string;
  host: WebSocket;
  viewers: WebSocket[];
  state: WhiteboardState;
} 