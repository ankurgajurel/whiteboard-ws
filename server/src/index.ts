import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin:
      process.env.CLIENT_URL || "https://a78a-119-82-94-223.ngrok-free.app",
    methods: ["GET", "POST"],
  },
});

interface Room {
  host: string;
  shapes: any[];
  viewers: Set<string>;
  connections: number;
}

const rooms = new Map<string, Room>();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  let currentRoom: string | null = null;

  socket.on("join-room", (roomId) => {
    currentRoom = roomId;
    socket.join(roomId);

    if (!rooms.has(roomId)) {
      console.log(`Creating new room ${roomId} with host ${socket.id}`);
      rooms.set(roomId, {
        host: socket.id,
        shapes: [],
        viewers: new Set(),
        connections: 1,
      });
    } else {
      const room = rooms.get(roomId)!;
      room.viewers.add(socket.id);
      room.connections++;
      console.log(
        `User ${socket.id} joined room ${roomId}. Total connections: ${room.connections}`
      );
    }

    socket.to(roomId).emit("user-connected");
  });

  socket.on("offer", (offer, roomId) => {
    console.log(`Offer from ${socket.id} in room ${roomId}`);
    socket.to(roomId).emit("offer", offer);
  });

  socket.on("answer", (answer, roomId) => {
    console.log(`Answer from ${socket.id} in room ${roomId}`);
    socket.to(roomId).emit("answer", answer);
  });

  socket.on("ice-candidate", (candidate, roomId) => {
    console.log(`ICE candidate from ${socket.id} in room ${roomId}`);
    socket.to(roomId).emit("ice-candidate", candidate);
  });

  socket.on("draw", ({ roomId, shape }) => {
    const room = rooms.get(roomId);
    if (room && room.host === socket.id) {
      room.shapes.push(shape);
      socket.to(roomId).emit("draw", shape);
    }
  });

  socket.on("clear", (roomId) => {
    const room = rooms.get(roomId);
    if (room && room.host === socket.id) {
      room.shapes = [];
      socket.to(roomId).emit("clear");
    }
  });

  socket.on("sync-request", (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      socket.emit("sync", room.shapes);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    if (currentRoom) {
      const room = rooms.get(currentRoom);
      if (room) {
        room.connections--;
        console.log(
          `User ${socket.id} left room ${currentRoom}. Remaining connections: ${room.connections}`
        );

        if (room.host === socket.id) {
          console.log(
            `Host disconnected from room ${currentRoom}, cleaning up`
          );
          rooms.delete(currentRoom);
          io.to(currentRoom).emit("host-disconnected");
        } else {
          room.viewers.delete(socket.id);

          if (room.connections <= 0) {
            console.log(`Room ${currentRoom} is empty, cleaning up`);
            rooms.delete(currentRoom);
          }
        }
      }
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
