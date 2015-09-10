from flask import jsonify, redirect, render_template, request, url_for
from flask.ext.socketio import SocketIO, emit, join_room, leave_room

from collections import defaultdict
import time

from app import app, socketio
import puz_util

#TODO: make a class for storing puzzle state
room_puzzles = dict()

@socketio.on('update')
def update_grid(json):
    room = json['room']
    if room not in room_puzzles:
        return

    puzzle, fill = room_puzzles[room]

    if not puzzle:
        return

    if json['uid'] != puzzle['uid']:
        emit('error', {'code': 'REFR'})
        print 'ERROR!', 'json', json['uid'], 'flask', puzzle['uid']
        return

    cell = json['cell']
    event = (json['value'], time.time())

    if event[1] > fill[cell][1]:
        fill[cell] = event

    emit('update',  {'cell': cell,
                     'value': fill[cell][0],
                     'solved': puz_util.check_solution(puzzle, fill),
                     'uid': puzzle['uid']},
                    room=room)


@socketio.on('init')
def initialize(message):
    print message

    room = message['room']
    join_room(room)

    if room in room_puzzles:
        puzzle, fill = room_puzzles[room]
        if puzzle:
            print 'UID:', puzzle['uid']
            emit('update_puzzle', puzzle)

            list_fill = [fill[i][0] for i in xrange(puzzle['size'])]
            emit('update_all', {'data': list_fill,
                                'solved': puz_util.check_solution(puzzle, fill),
                                'uid': puzzle['uid']})
    else:
        room_puzzles[room] = (None, defaultdict(lambda: ('', 0)))


@app.route('/', defaults={'path': ''}, methods=['GET', 'POST'])
@app.route('/<path:path>', methods=['GET', 'POST'])
def index(path):
    if request.method == 'GET':
        return render_template('xword.html')
    elif request.method == 'POST':
        print 'post worked!'
        f = request.files['file']
        if f:
            puzzle = puz_util.load_from_file(f)
            fill = defaultdict(lambda: ('', 0))
            room_puzzles['/'+path] = (puzzle, fill)

        return redirect('/%s' % path)
