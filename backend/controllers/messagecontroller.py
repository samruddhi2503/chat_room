from config.db import messages_collection
from models.message import Message
from datetime import datetime

def save_message(message: Message):
    messages_collection.insert_one({
        "username": message.username,
        "content": message.content,
        "timestamp": message.timestamp,
        "room": message.room
    })
def get_last_messages(room: str, limit: int = 20):
    messages = messages_collection.find({"room": room}).sort("timestamp", -1).limit(limit)
    messages_list = []
    for m in messages:
        messages_list.append({
            "username": m["username"],
            "content": m["content"],
            "timestamp": str(m["timestamp"]),  
            "room": m["room"]
        })
    return messages_list[::-1]
