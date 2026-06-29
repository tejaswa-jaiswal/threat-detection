import asyncio
import cv2
import json
import websockets
from sqlalchemy import select

from db.database import AsyncSessionLocal
from db.schemas import User

from core.security import create_access_token

async def test_ws():
    # 1. get a user ID to generate token
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).limit(1))
        user = result.scalars().first()
        if user is None:
            print("No users found in database.")
            return
        user_id = user.id

    token = create_access_token(str(user_id), "admin")
    
    # 2. connect to websocket
    url = f"ws://localhost:8000/ws/detect?token={token}"
    async with websockets.connect(url, subprotocols=["jwt"]) as ws:
        # send start
        await ws.send(json.dumps({"type": "start", "video_name": "test_video"}))
        
        # expect started
        resp = await ws.recv()
        print("Received start resp:", resp)
        
        # 3. read an image (e.g. from data/ or just a black frame with a gun?)
        import numpy as np
        img = np.zeros((100, 100, 3), dtype=np.uint8)
        _, buf = cv2.imencode(".jpg", img)
        blob = buf.tobytes()
        
        await ws.send(blob)
        print("Sent frame, waiting for reply...")
        
        try:
            # We might receive the annotated JPEG back first, then an error if it crashed afterwards.
            reply = await ws.recv()
            if isinstance(reply, bytes):
                print("Received annotated JPEG, length:", len(reply))
            else:
                print("Received JSON:", reply)
            
            # Wait for disconnect
            print("Waiting for next message...")
            reply2 = await ws.recv()
            print("Received next:", reply2)
        except websockets.exceptions.ConnectionClosed as e:
            print("Connection closed:", e)

if __name__ == "__main__":
    asyncio.run(test_ws())

