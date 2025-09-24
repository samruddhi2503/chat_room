// App.js
import React, { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [username, setUsername] = useState("");
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState("general");
  const [messages, setMessages] = useState([]); // messages for current room (oldest->newest)
  const [input, setInput] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);
  const [showActiveUsers, setShowActiveUsers] = useState(false);

  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  // helper for deterministic keys/colors
  const userColors = useRef({});
  const getRandomColor = (user) => `hsl(${Math.floor(Math.abs(hashCode(user)) % 360)}, 70%, 85%)`;
  function hashCode(str = "") {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return h;
  }
  const getUserColor = (user) => {
    if (!userColors.current[user]) userColors.current[user] = getRandomColor(user);
    return userColors.current[user];
  };

  // join room: closes any previous ws, opens new one to given room
  const joinRoom = (roomName = "general") => {
    if (!username) return alert("Enter a username first");

    // close old
    if (ws.current) {
      try { ws.current.close(); } catch (e) {}
      ws.current = null;
    }

    setRoom(roomName);
    setMessages([]);      // clear UI while history arrives
    setActiveUsers([]);
    setShowActiveUsers(false);

    const socketUrl = `ws://127.0.0.1:8000/ws/${roomName}/${encodeURIComponent(username)}`;
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => {
      setConnected(true);
      console.log("Connected to", socketUrl);
    };

    ws.current.onmessage = (ev) => {
      let data;
      try { data = JSON.parse(ev.data); } catch (e) { console.warn("invalid json", ev.data); return; }

      if (data.type === "history") {
        // replace messages with server history (expected oldest->newest)
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      } else if (data.type === "message") {
        // append authoritative message (server created time & id)
        setMessages((prev) => {
          // simple dedupe by id (avoid accidental duplicates)
          if (data.id && prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
      } else if (data.type === "active_users") {
        setActiveUsers(Array.isArray(data.users) ? data.users : []);
      }
    };

    ws.current.onclose = () => {
      setConnected(false);
      console.log("Socket closed");
    };

    ws.current.onerror = (err) => {
      console.error("WebSocket error:", err);
      // do not setConnected(false) here — onclose will follow
    };
  };

  // send message — do NOT add locally; wait for server broadcast
  const sendMessage = () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not open");
      return;
    }
    if (!input) return;

    const payload = {
      // don't send time or id — server will canonicalize them
      username,
      content: input
    };
    ws.current.send(JSON.stringify(payload));
    setInput("");
  };

  // scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // helper to format time safely
  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return ""; // invalid
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // create a new room (unique) and join it
  const createNewRoom = () => {
    const roomName = "room_" + Date.now().toString(36);
    joinRoom(roomName);
  };

  return (
    <div className="app-bg">
      {!connected ? (
        <div className="login-container">
          <h1 className="login-title">Join Chat</h1>
          <div className="input-container">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
            />
            <label>Username</label>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="join-btn" onClick={() => joinRoom("general")}>
              Join General
            </button>
            <button className="join-btn" onClick={createNewRoom}>
              New Chat Room
            </button>
          </div>
        </div>
      ) : (
        <div className="chat-container">
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12}}>
            <h2 className="chat-title">Group Chat — {room}</h2>

            <div>
              <button className="dashboard-btn" onClick={() => setShowActiveUsers(v => !v)}>
                Active Users
              </button>
              <button className="dashboard-btn" onClick={createNewRoom} style={{marginLeft:8}}>
                New Chat Room
              </button>
            </div>
          </div>

          {showActiveUsers && (
            <div className="active-users-list">
              <strong>Active users:</strong>
              <div style={{marginTop:8}}>
                {activeUsers.length ? activeUsers.map(u => <div key={u}>{u}</div>) : <div>No active users</div>}
              </div>
            </div>
          )}

          <div className="messages-box">
            {messages.map((msg, idx) => {
              const isOwn = msg.username === username;
              const bgColor = isOwn ? "#dcf8c6" : getUserColor(msg.username || "anon");
              return (
                <div key={msg.id || idx} className={`message ${isOwn ? "own" : ""}`} style={{ backgroundColor: bgColor }}>
                  {!isOwn && <b>{msg.username}: </b>}
                  <div className="message-content">{msg.content}</div>
                  <div className="message-time">{formatTime(msg.time)}</div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-send">
            <input
              type="text"
              value={input}
              placeholder="Type a message..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="send-btn" onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
