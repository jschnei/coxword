from flask import jsonify, redirect, render_template, request, url_for
from flask.ext.socketio import SocketIO, emit

from collections import defaultdict
import time

from app import app, socketio
import puz_util

fill = defaultdict(lambda: ('', 0))
puzzle = None

@socketio.on('update')
def update_grid(json):
    global fill

    cell = json['cell']
    event = (json['value'], time.time())

    if event[1] > fill[cell][1]:
        fill[cell] = event

    emit('update',  {'cell': cell,
                     'value': fill[cell][0]},
                    broadcast=True)



@socketio.on('log')
def log_message(message):
    print message
    if message['data']=='connect':
        if puzzle:
            emit('update_puzzle', puzzle)
            if fill:
                list_fill = [fill[i][0] for i in xrange(puzzle['size'])]
                emit('update_all', {'data': list_fill})


@app.route('/upload', methods=['POST'])
def upload_file():
    global fill, puzzle
    f = request.files['file']
    if f:
        puzzle = puz_util.load_from_file(f)
        fill.clear()
#        emit('update_puzzle', puzzle, broadcast=True)

    return redirect(url_for('index'))


@app.route('/')
@app.route('/index')
def index():
    return render_template('xword.html')
