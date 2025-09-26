# Chat App Project

A full-stack **chat application** with frontend and backend functionality, built with React, Node.js, and FastAPI. Users can send and receive messages in real-time, with features like instant timestamps, chat wallpapers, multiple chat rooms, and message history.

---

## Features

- Real-time chat functionality
- Instant timestamps for all messages
- Multiple users can chat simultaneously
- Users can change chat wallpaper
- Create new chat rooms dynamically
- New users can view the last 20 messages in a chat room
- Clean and interactive UI
- Separate frontend and backend structure
- Fully version-controlled with Git

---

## Project Structure

project-root/
│
├── backend/ 
│ ├── server.js
│ ├── package.json
│ ├── main.py
│ ├── requirements.txt
│ └── ...
│
├── frontend/ # React frontend
│ ├── src/
│ │ ├── App.js
│ │ ├── components/
│ │ └── ...
│ ├── package.json
│ └── ...
│
├── .gitignore


---

### 1. Node.js role in chat app
Handles real-time messaging using Socket.IO or WebSockets.

Manages multiple users chatting simultaneously.

Provides fast, event-driven server for the frontend.

Example: sending messages instantly to all users in a room.

### 2. FastAPI role in chat app
Handles REST APIs, like:

User authentication (login/signup)

Fetching previous messages from a database

Creating chat rooms or managing settings

Provides automatic validation, async support, and API documentation.

Example: when a new user joins, FastAPI serves the last 20 messages from the database.

---

## Installation

### Backend 
(Start Node.js in one terminal)
cd backend
node server.js  
(For FastAPI)
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

### Frontend
cd frontend
npm install
npm start
# Runs the frontend React app on http://localhost:3000


---

