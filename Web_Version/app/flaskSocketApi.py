import json
from flask_socketio import *
from flask import Flask
from flask import jsonify
from flask import Flask
from app.newInputProcessor import *
from app.main import *
from flask_cors import CORS , cross_origin
import eventlet

eventlet.monkey_patch()
app = Flask(__name__, static_folder='../build/',    static_url_path='')
CORS(app)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins = "*", always_connect = True)

@app.route("/")
def hello():
    return app.send_static_file('index.html')

@app.errorhandler(404)
def not_found(e):
    return app.send_static_file('index.html')

@socketio.on('connect')
def connected():
    print(connected)

@socketio.on('disconnect')
def disconnected():
    print('disconnected')

@socketio.on('pong')
def pingReceived(msg):
    print(msg)
    print('pinging back')
    emit('pong', {'message' : int(msg)})
    return None

@socketio.on('message')
def playerMoved(msg):
    print('hello move updated')
    arg = msg
    args = processInputs(arg)
    res = startProcessing(args)
    q, fdisp, y = myMainfunc(res)
    qAndQdot = y[:, :10]
    emit("message", {'message': fdisp.tolist(), 'q': qAndQdot.tolist()})
    return None

if __name__ == "__main__":
    socketio.run(app, debug = True)