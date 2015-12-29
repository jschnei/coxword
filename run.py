#!flask/bin/python
from app import app, socketio
socketio.run(app)
