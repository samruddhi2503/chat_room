from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from controllers.messagecontroller import save_message, get_last_messages
from models.message import Message

router = APIRouter()
connections: list[WebSocket] = []
active_users: set[str] = set()


@router.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await websocket.accept()
    connections.append(websocket)
    active_users.add(username)
    print(f"✅ {username} connected. Active users: {list(active_users)}")

    last_messages = get_last_messages("general")
    await websocket.send_json({"type": "history", "messages": last_messages})
    print(f"📚 Sent last {len(last_messages)} messages to {username}")

    try:
        while True:
         
            data = await websocket.receive_json()
            print(f"📨 Received from {username}: {data}") 

            msg = Message(username=username, content=data["content"], room="general")
            save_message(msg)
            print(f"💾 Saved message: {msg.content}")

         
            disconnected = []
            for connection in connections:
                try:
                    await connection.send_json({
                        "type": "message",
                        "username": username,
                        "content": data["content"]
                    })
                    print(f"📤 Broadcasted '{data['content']}' to a client")
                except Exception as e:
                    print(f"❌ Error sending to client: {e}")
                    disconnected.append(connection)

            for conn in disconnected:
                if conn in connections:
                    connections.remove(conn)
                    print(f"⚠️ Removed disconnected client")

    except WebSocketDisconnect:
        connections.remove(websocket)
        active_users.remove(username)
        print(f"❌ {username} disconnected. Active users: {list(active_users)}")