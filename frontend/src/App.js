// src/App.js
import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import Bubbles from "./Bubbles";
import AutumnOutline from "./AutumnOutline.png";

const getQueryParam = (param) => new URLSearchParams(window.location.search).get(param) || "";

function App() {
  const [username, setUsername] = useState(getQueryParam("username"));
  const [room, setRoom] = useState(getQueryParam("room") || "general");
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showActiveUsersInDashboard, setShowActiveUsersInDashboard] = useState(false);

  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const userColors = useRef({});
  const getRandomColor = (user) =>
    `hsl(${Math.floor(Math.abs(hashCode(user)) % 360)}, 70%, 85%)`;

  function hashCode(str = "") {
    let h = 0;
    for (let i = 0; i < str.length; i++)
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return h;
  }

  const getUserColor = (user) => {
    if (!userColors.current[user]) userColors.current[user] = getRandomColor(user);
    return userColors.current[user];
  };

  const joinRoom = (roomName = "general", usernameParam = username, fetchHistory = true) => {
    if (!usernameParam) return alert("Enter a username first");

    if (ws.current) {
      try { ws.current.close(); } catch (e) {}
      ws.current = null;
    }

    setRoom(roomName);
    setMessages([]);
    setActiveUsers([]);
    setShowActiveUsersInDashboard(false);

    const socketUrl = `ws://127.0.0.1:8000/ws/${encodeURIComponent(usernameParam)}`;
    ws.current = new WebSocket(socketUrl);

    ws.current.onopen = () => setConnected(true);

    ws.current.onmessage = (ev) => {
      let data;
      try { data = JSON.parse(ev.data); } catch (e) { return; }

      if (data.type === "history" && fetchHistory) {
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      } else if (data.type === "message") {
        setMessages((prev) => {
          if (data.id && prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      } else if (data.type === "active_users") {
        setActiveUsers(Array.isArray(data.users) ? data.users : []);
      }
    };

    ws.current.onclose = () => setConnected(false);
    ws.current.onerror = (err) => console.error("WebSocket error:", err);
  };

  const createNewRoom = () => {
    if (!username) return alert("Enter a username first");
    const roomName = "room_" + Math.random().toString(36).substr(2, 6);
    const url = `${window.location.origin}?username=${encodeURIComponent(username)}&room=${encodeURIComponent(roomName)}&new=true`;
    window.open(url, "_blank");
  };

  const sendMessage = () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    if (!input) return;
    ws.current.send(JSON.stringify({ username, content: input }));
    setInput("");
  };

  useEffect(() => {
    const isNewRoom = getQueryParam("new") === "true";
    if (username) joinRoom(room, username, !isNewRoom);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="app-bg">
      <img src={AutumnOutline} alt="Autumn Outline" className="outline-img" />
      <Bubbles count={50} />

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
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button className="join-btn" onClick={() => joinRoom("general")}>Join General</button>
            <button className="join-btn" onClick={createNewRoom}>New Chat Room</button>
          </div>
        </div>
      ) : (
        <div className="chat-container">
          {/* Header with dashboard toggle */}
          <div className="chat-header">
            <h2 className="chat-title">Group Chat — {room}</h2>

            <div className="dashboard">
              <button
                className="dashboard-toggle"
                onClick={() => setShowDashboard(v => !v)}
              >
                ☰
              </button>

              {showDashboard && (
                <div className="dashboard-menu">
                  <div>
                    <button
                      onClick={() => setShowActiveUsersInDashboard(v => !v)}
                    >
                      👥 Active Users
                    </button>
                    {showActiveUsersInDashboard && (
                      <ul style={{ paddingLeft: 15, marginTop: 5 }}>
                        {activeUsers.length ? activeUsers.map(u => <li key={u}>{u}</li>) : <li>No active users</li>}
                      </ul>
                    )}
                  </div>
                  <button onClick={createNewRoom}>🆕 New Chat Room</button>
                  <button onClick={() => alert("Wallpaper change coming soon!")}>🎨 Change Wallpaper</button>
                </div>
              )}
            </div>
          </div>

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
