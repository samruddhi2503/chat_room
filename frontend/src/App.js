
import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import Bubbles from "./Bubbles";
import AutumnOutline from "./AutumnOutline.png";

import vintage1 from "./vintage1.jpg";
import vintage2 from "./vintage2.jpg";
import vintage3 from "./vintage3.jpg";
import scenery1 from "./scenery1.jpg";
import scenery2 from "./scenery2.jpg";
import scenery3 from "./scenery3.jpg";

const getQueryParam = (param) =>
  new URLSearchParams(window.location.search).get(param) || "";

function App() {
  const [username, setUsername] = useState(getQueryParam("username"));
  const [room, setRoom] = useState(getQueryParam("room") || "general");
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showActiveUsersInDashboard, setShowActiveUsersInDashboard] =
    useState(false);
  const [showWallpaperOptions, setShowWallpaperOptions] = useState(false);
  const [chatWallpaper, setChatWallpaper] = useState("");

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

 
  const solidColors = ["#ced1a5c1", "#9abcd0ff", "#8481bed3", "#c3f1ccb8"];
  const vintageWallpapers = [vintage1, vintage2, vintage3];
  const sceneryWallpapers = [scenery1, scenery2, scenery3];

  const applyWallpaper = (wall) => {
    setChatWallpaper(wall);
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
        const fixed = (Array.isArray(data.messages) ? data.messages : []).map(m => ({
          ...m,
          time: m.time || new Date().toISOString()
        }));
        setMessages(fixed.sort((a, b) => new Date(a.time) - new Date(b.time)));
      } 
      else if (data.type === "message") {
        const msg = { ...data, time: data.time || new Date().toISOString() };
        setMessages((prev) => {
          if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg].sort((a, b) => new Date(a.time) - new Date(b.time));
        });
      } 
      else if (data.type === "active_users") {
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

    const now = new Date().toISOString();
    ws.current.send(JSON.stringify({ username, content: input, time: now }));

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
          <div className="chat-header">
            <h2 className="chat-title">Group Chat — {room}</h2>

            <div className="dashboard">
              <button className="dashboard-toggle" onClick={() => setShowDashboard(v => !v)}>☰</button>

              {showDashboard && (
                <div className="dashboard-menu">
                  <button onClick={() => setShowActiveUsersInDashboard(v => !v)}>👥 Active Users</button>
                  {showActiveUsersInDashboard && (
                    <ul className="active-users-list">
                      {activeUsers.length ? activeUsers.map(u => <li key={u}>{u}</li>) : <li>No active users</li>}
                    </ul>
                  )}

                  <button onClick={createNewRoom}>🆕 New Chat Room</button>
                  <button onClick={() => setShowWallpaperOptions(v => !v)}>🎨 Change Wallpaper</button>

                  {showWallpaperOptions && (
                    <div className="wallpaper-options">
                      <div>
                        <h4>Solid Colors</h4>
                        <div className="wallpaper-list">
                          {solidColors.map(color => (
                            <div
                              key={color}
                              className="wallpaper-item"
                              style={{ backgroundColor: color }}
                              onClick={() => applyWallpaper(color)}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4>Vintage</h4>
                        <div className="wallpaper-list">
                          {vintageWallpapers.map(img => (
                            <img key={img} src={img} className="wallpaper-item" onClick={() => applyWallpaper(img)} alt="vintage" />
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4>Scenery</h4>
                        <div className="wallpaper-list">
                          {sceneryWallpapers.map(img => (
                            <img key={img} src={img} className="wallpaper-item" onClick={() => applyWallpaper(img)} alt="scenery" />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="messages-box" style={{
            background: chatWallpaper
              ? chatWallpaper.startsWith("#")
                ? chatWallpaper
                : `url(${chatWallpaper}) center/cover no-repeat`
              : "#f0f2f5"
          }}>
            {messages
              .sort((a, b) => new Date(a.time) - new Date(b.time))
              .map((msg, idx) => {
              const isOwn = msg.username === username;
              const bgColor = isOwn ? "#dcf8c6" : getUserColor(msg.username || "anon");
              return (
                <div
                  key={msg.id || idx}
                  className={`message ${isOwn ? "own" : ""}`}
                  style={{ backgroundColor: bgColor }}
                >
                  {!isOwn && <div className="message-user">{msg.username}</div>}
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
