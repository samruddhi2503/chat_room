from pydantic import BaseModel
from datetime import datetime

class Message(BaseModel):
    username: str
    content: str
    timestamp: datetime = datetime.utcnow()
    room: str = "general"  # default chat room
