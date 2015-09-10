import puz
import json

def check_solution(puzzle, fill):
    blank_dot = lambda s: s if len(s) > 0 else '.'
    fill_str = ''.join([blank_dot(fill[i][0]) for i in xrange(puzzle['size'])])

    return (fill_str == puzzle['solution'])

def load_from_file(f):
    try:
        print 'GOT HERE'

        puzzle = puz.load(f.read())
        pcnum = puzzle.clue_numbering()

        psolution = ''
        if puzzle.solution_state==puz.SolutionState.Unlocked:
            psolution = puzzle.solution

        print psolution

        puzobj = {'height': pcnum.height,
                'width': pcnum.width,
                'size': pcnum.height*pcnum.width,
                'grid': pcnum.grid,
                'clues': {
                    'across': pcnum.across,
                    'down': pcnum.down
                    },
                'markup': puzzle.markup().get_markup_squares(),
                'solution': psolution
                }

        uid = hash(json.dumps(puzobj, sort_keys=True))
        puzobj['uid'] = str(uid)

        return puzobj

    except:
        print "Unexpected error:", sys.exc_info()[0]


