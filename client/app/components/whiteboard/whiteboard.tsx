"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { io, Socket } from "socket.io-client";
import {
  Point,
  Shape,
  WhiteboardProps,
  DrawingTool,
} from "@/app/types/whiteboard";
import { Toolbar } from "./toolbar";
import { VideoStream } from "./video-stream";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function Whiteboard({ roomId, isHost = false }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [selectedTool, setSelectedTool] = useState<DrawingTool>("freehand");
  const [selectedColor, setSelectedColor] = useState<string>("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPointRef = useRef<Point | null>(null);

  useEffect(() => {
    console.log("Initializing socket connection to:", SOCKET_URL);

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected successfully");
      setIsConnected(true);
      setError(null);
      socket.emit("sync-request", roomId);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError(`Connection error: ${err.message}`);
      setIsConnected(false);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    socket.on("sync", (serverShapes: Shape[]) => {
      console.log("Received sync data:", serverShapes);
      setShapes(serverShapes);
    });

    socket.on("draw", (shape: Shape) => {
      console.log("Received draw event:", shape);
      setShapes((prev) => [...prev, shape]);
    });

    socket.on("clear", () => {
      console.log("Received clear event");
      setShapes([]);
    });

    socket.on("host-disconnected", () => {
      console.log("Host disconnected");
      if (!isHost) {
        alert("Host has disconnected");
        window.location.href = "/";
      }
    });

    socket.connect();

    return () => {
      console.log("Cleaning up socket connection");
      socket.disconnect();
    };
  }, [roomId, isHost]);

  const drawShape = useCallback(
    (ctx: CanvasRenderingContext2D, shape: Shape) => {
      ctx.beginPath();
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (shape.points.length === 0) return;

      const [start, ...points] = shape.points;
      ctx.moveTo(start.x, start.y);

      if (shape.type === "freehand") {
        points.forEach((point) => ctx.lineTo(point.x, point.y));
      } else if (shape.type === "line" && points.length > 0) {
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      } else if (shape.type === "rectangle" && points.length > 0) {
        const end = points[points.length - 1];
        ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (shape.type === "circle" && points.length > 0) {
        const end = points[points.length - 1];
        const radius = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
      }

      ctx.stroke();
    },
    []
  );

  const drawShapes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    shapes.forEach((shape) => drawShape(ctx, shape));

    if (currentShape) {
      drawShape(ctx, currentShape);
    }
  }, [shapes, currentShape, drawShape]);

  useEffect(() => {
    drawShapes();
  }, [shapes, currentShape, drawShapes]);

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");

      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isHost) return;

      const point = getCanvasPoint(e);
      startPointRef.current = point;

      const newShape: Shape = {
        id: uuidv4(),
        type: selectedTool,
        points: [point],
        color: selectedColor,
        strokeWidth,
      };

      setCurrentShape(newShape);
      setIsDrawing(true);
    },
    [isHost, selectedTool, selectedColor, strokeWidth, getCanvasPoint]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !isHost || !currentShape) return;

      const point = getCanvasPoint(e);

      if (selectedTool === "freehand") {
        setCurrentShape((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            points: [...prev.points, point],
          };
        });
      } else {
        setCurrentShape((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            points: [prev.points[0], point],
          };
        });
      }
    },
    [isDrawing, isHost, currentShape, selectedTool, getCanvasPoint]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing || !currentShape || !socketRef.current) return;

    socketRef.current.emit("draw", {
      roomId,
      shape: currentShape,
    });

    setShapes((prev) => [...prev, currentShape]);
    setCurrentShape(null);
    setIsDrawing(false);
    startPointRef.current = null;
  }, [isDrawing, currentShape, roomId]);

  const clearCanvas = useCallback(() => {
    if (!isHost || !socketRef.current) return;

    socketRef.current.emit("clear", roomId);
    setShapes([]);
  }, [isHost, roomId]);

  return (
    <div className="relative w-full h-screen bg-gray-100 flex items-center justify-center">
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-lg">
          {error}
        </div>
      )}
      {isHost && (
        <Toolbar
          selectedTool={selectedTool}
          selectedColor={selectedColor}
          strokeWidth={strokeWidth}
          onToolChange={setSelectedTool}
          onColorChange={setSelectedColor}
          onStrokeWidthChange={setStrokeWidth}
          onClear={clearCanvas}
        />
      )}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="bg-white shadow-lg"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      {isConnected && socketRef.current && (
        <VideoStream
          isHost={isHost}
          roomId={roomId}
          socket={socketRef.current}
        />
      )}
    </div>
  );
}
