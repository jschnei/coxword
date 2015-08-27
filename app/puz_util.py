import puz
import json

def load_from_file(f):
#    print 'GOT HERE!'
    try:
        puzzle = puz.load(f.read())
        pcnum = puzzle.clue_numbering()

        puzobj = {'height': pcnum.height,
                'width': pcnum.width,
                'size': pcnum.height*pcnum.width,
                'grid': pcnum.grid,
                'clues': {
                    'across': pcnum.across,
                    'down': pcnum.down
                    },
                'markup': puzzle.markup().get_markup_squares()
                }

        uid = hash(json.dumps(puzobj, sort_keys=True))
        puzobj['uid'] = str(uid)

        print puzobj['uid']

        return puzobj

    except:
        print "Unexpected error:", sys.exc_info()[0]


