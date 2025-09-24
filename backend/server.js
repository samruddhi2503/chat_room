// server.js
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 8000 });

const rooms = {};        // roomName -> Map(username -> ws)
const roomsHistory = {}; // roomName -> [ message objects ]

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function broadcastActiveUsers(room) {
  const clients = rooms[room] || new Map();
  const users = Array.from(clients.keys());
  const payload = JSON.stringify({ type: "active_users", users });
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  });
}

function broadcastMessageToRoom(room, messageData) {
  const clients = rooms[room] || new Map();
  const payload = JSON.stringify(messageData);
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  });
}

wss.on("connection", (ws, req) => {
  // expected URL: ws://localhost:8000/ws/<room>/<username>
  const path = (req.url || "");
  const match = path.match(/^\/ws\/([^\/]+)\/?([^\/]*)/);
  const room = match ? match[1] : "general";
  const username = (match && match[2]) ? match[2] : `anon_${makeId().slice(0,4)}`;

  // create room if missing
  if (!rooms[room]) rooms[room] = new Map();
  if (!roomsHistory[room]) roomsHistory[room] = [];

  // register client
  rooms[room].set(username, ws);
  console.log(`✅ ${username} joined room="${room}". Active: ${Array.from(rooms[room].keys())}`);

  // send chat history (most servers send newest-last; we keep order oldest->newest)
  try {
    ws.send(JSON.stringify({ type: "history", messages: roomsHistory[room] }));
  } catch (err) {
    console.error("send history error:", err);
  }

  // broadcast updated active users in room
  broadcastActiveUsers(room);

  ws.on("message", (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch (e) { return; }

    // if it's a chat message
    if (data.content) {
      const messageData = {
        type: "message",
        id: data.id || makeId(),
        username: data.username || username,
        content: data.content,
        time: new Date().toISOString(),
        room
      };

      // save to room history (keep capped history)
      roomsHistory[room].push(messageData);
      if (roomsHistory[room].length > 200) roomsHistory[room].shift();

      // broadcast authoritative message to everyone in room
      broadcastMessageToRoom(room, messageData);
    }
  });

  ws.on("close", () => {
    if (rooms[room]) {
      rooms[room].delete(username);
      if (rooms[room].size === 0) {
        delete rooms[room];
        delete roomsHistory[room];
      } else {
        broadcastActiveUsers(room);
      }
    }
    console.log(`❌ ${username} left room="${room}".`);
  });

  ws.on("error", (err) => {
    console.error("ws error:", err);
    if (rooms[room]) {
      rooms[room].delete(username);
      broadcastActiveUsers(room);
    }
  });
});

console.log("WebSocket server running on ws://localhost:8000");
