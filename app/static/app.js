var processPuzzleData = function(puzzleData){
    var puzzle = {
                height: puzzleData.height,
                width: puzzleData.width,
                grid: [],
                clues: [],
                uid: puzzleData.uid
    };

    // initialize grid

    puzzleData.grid.split('').forEach(function(sq){
        var square = {
            filled: (sq=='.'),
            num: '',
            nextLeft: -1,
            nextRight: -1,
            nextUp: -1,
            nextDown: -1,
            acrossClue: -1,
            downClue: -1,
            circled: false
        };
        puzzle.grid.push(square);
    });

    puzzleData.markup.forEach(function(sq){
        puzzle.grid[sq].circled = true;
    });

    // initialize clues

    puzzleData.clues.across.forEach(function(cl){
        var clue = {
            num: cl.num,
            clue: cl.clue,
            cell: cl.cell,
            endCell: cl.cell+cl.len-1,
            squares: [],
            type: 'across'
        };
        for(var i=0;i<cl.len;i++){
            clue.squares.push(cl.cell+i);

            // set across clue at same time
            puzzle.grid[cl.cell+i].acrossClue = puzzle.clues.length;
        }
        puzzle.clues.push(clue);
    });

    puzzleData.clues.down.forEach(function(cl){
        var clue = {
            num: cl.num,
            clue: cl.clue,
            cell: cl.cell,
            endCell: cl.cell+(cl.len-1)*puzzle.width,
            squares: [],
            type: 'down'
        };
        for(var i=0;i<cl.len;i++){
            clue.squares.push(cl.cell+i*puzzle.width);

            // set down words at same time
            puzzle.grid[cl.cell+i*puzzle.width].downClue = puzzle.clues.length;
        }
        puzzle.clues.push(clue);
    });

    // set grid nums
    puzzle.clues.forEach(function(clue){
        puzzle.grid[clue.cell].num = clue.num;
    });

    // set nextLeft/Right/Up/Down

    for(var i=0;i<puzzle.grid.length;i++){
        if(!puzzle.grid[i].filled){
            var W = puzzle.width;
            var L = puzzle.grid.length;

            // nextRight
            var nxt = i+1;
            if(nxt >= L) nxt-= L;
            while(puzzle.grid[nxt].filled){
                nxt++;
                if(nxt >= L) nxt-= L;
            }
            puzzle.grid[i].nextRight = nxt;

            // nextLeft
            nxt = i-1;
            if(nxt < 0) nxt+= L;
            while(puzzle.grid[nxt].filled){
                nxt--;
                if(nxt < 0) nxt+= L;
            }
            puzzle.grid[i].nextLeft = nxt;

            // nextDown
            nxt = i+W;
            if(nxt >= L) nxt-= L;
            while(puzzle.grid[nxt].filled){
                nxt+=W;
                if(nxt >= L) nxt-=L;
            }
            puzzle.grid[i].nextDown = nxt;

            // nextUp
            nxt = i-W;
            if(nxt < 0) nxt+= L;
            while(puzzle.grid[nxt].filled){
                nxt-=W;
                if(nxt < 0) nxt+= L;
            }
            puzzle.grid[i].nextUp = nxt;
        }
    }


    return puzzle;
}

var createGrid = function(puzzle) {
    var gridDOM = [];
    var table = $('<table>');
    for(var h=0;h<puzzle.height;h++){
        var row = $('<tr>');
        for(var w=0;w<puzzle.width;w++){
            var cell = $('<td>');
            var ind = h*puzzle.width + w;
            if(puzzle.grid[ind].filled){
                cell.addClass('filled');
            }

            cell.data('ind', ind);
            cell.appendTo(row);

            var cellText = $('<div>');
            cellText.addClass('cell-text');

            cellText.appendTo(cell);

            if(puzzle.grid[ind].num){
                var cellnum = $('<div>');
                cellnum.text(puzzle.grid[ind].num);
                cellnum.addClass('cell-number');
                cellnum.appendTo(cell);
            }

            gridDOM.push(cell);

            if(puzzle.grid[ind].circled){
                var cellcircle = $('<div>');
                cellcircle.addClass('circle');
                cellcircle.appendTo(cell);
            }
        }
        row.appendTo(table);
    }
    table.appendTo($('.crossword'));

    return gridDOM;
}

var createClues = function(puzzle){
    var cluesDOM = [];

    puzzle.clues.forEach(function(clue) {
        var entry = $('<li>');
        entry.text(clue.num + '. ' + clue.clue);
        entry.data('ind', cluesDOM.length);
        if(clue.type == 'across'){
            entry.appendTo($('.across-clues'));
        }else if(clue.type == 'down'){
            entry.appendTo($('.down-clues'));
        }
        cluesDOM.push(entry);
    });

    $('#across-container').height($('#main').height()/2 - 40);
    $('#down-container').height($('#main').height()/2 - 40);

    $('.headline').width($('.crossword').width());

    return cluesDOM;
}

var resetPuzzle = function(){
    $('.headline').empty();
    $('.crossword').empty();
    $('.across-clues').empty();
    $('.down-clues').empty();
}


var main = function() {
    var isPuzzle;

    var puzzle;
    var gridDOM;
    var cluesDOM;
    var gridTextDOM;

    var curCell;
    var curClue;
    var curDir;

    var autoscrollUI = true;

    var navigateTo = function(nextCell) {
        if(puzzle.grid[nextCell].filled) return;

        gridDOM[curCell].removeClass('current');
        gridDOM[nextCell].addClass('current');

        curCell = nextCell;

        updateCurrentClue();
    };

    var updateCurrentClue = function(){
        if(curClue!=-1){
            cluesDOM[curClue].removeClass('current-clue');
            puzzle.clues[curClue].squares.forEach(function(cellInd){
                gridDOM[cellInd].removeClass('current-clue');
            });
        }

        var dirLetter = '';
        if(curDir==='across'){
           curClue = puzzle.grid[curCell].acrossClue;
           dirLetter = 'A';
        }else if(curDir==='down'){
           curClue = puzzle.grid[curCell].downClue;
           dirLetter = 'D';
        }

        if(curClue!=-1){
            $('.headline').text(puzzle.clues[curClue].num +
                dirLetter + '. ' + puzzle.clues[curClue].clue);
            $('.headline').quickfit({min: 20, max:40});
            cluesDOM[curClue].addClass('current-clue');
            puzzle.clues[curClue].squares.forEach(function(cellInd){
                gridDOM[cellInd].addClass('current-clue');
            });

            if(autoscrollUI){
                if(puzzle.clues[curClue].type==='across'){
                    $('#across-container').scrollTo(cluesDOM[curClue]);
                }else if(puzzle.clues[curClue].type==='down'){
                    $('#down-container').scrollTo(cluesDOM[curClue]);
                }
            }
        }
    };

    var changeDir = function(dir){
        curDir = dir;
        updateCurrentClue();
    };

    var getNextCell = function(cell){
        if(curDir==='across'){
            return puzzle.grid[cell].nextRight;
        }else if(curDir==='down'){
            return puzzle.grid[cell].nextDown;
        }
    };

    var navigateForward = function(){
        navigateTo(getNextCell(curCell));
    };

    var getPrevCell = function(cell){
        if(curDir==='across'){
            return puzzle.grid[cell].nextLeft;
        }else if(curDir==='down'){
            return puzzle.grid[cell].nextUp;
        }
    }

    var navigateBackward = function(){
        navigateTo(getPrevCell(curCell));
    };
    
    var firstBlank = function(){
        var cell = puzzle.clues[curClue].cell;
        do {
            if(gridTextDOM[cell].text().length === 0){
                return cell;
            }
            cell = getNextCell(cell);
        } while(cell!==puzzle.clues[curClue].endCell);
        return -1;
    }
    
    var getInputCell = function(overwrite){
        var endCell = puzzle.clues[curClue].endCell;
        
        if(overwrite){
            if(curCell != endCell){
                return getNextCell(curCell);
            }else{
                return endCell;
            }
        }else{
            var fb = firstBlank();
            if(!$('#skip-filled').prop('checked')){
                if(curCell !== endCell){
                    return getNextCell(curCell);
                }else if($('#move-to-blank').prop('checked') && fb!==-1){
                    return fb;
                }else if($('#move-at-end').prop('checked')){
                    return getNextCell(curCell);
                }
                return curCell;
            }
            
            var cell = curCell;
            while(gridTextDOM[cell].text().length > 0){
                if(cell === endCell){
                    if($('#move-to-blank').prop('checked') && fb!==-1){
                        return fb;
                    }else if(!$('#move-at-end').prop('checked')){
                        return endCell;
                    }
                }
                
                cell = getNextCell(cell);
                if(cell === curCell) return curCell;
            }
            return cell;
        }
    }

    var navigateToClue = function(clue){
        changeDir(puzzle.clues[clue].type);
        navigateTo(puzzle.clues[clue].cell);
    };

    var greyOutClue = function(clue){
        if(clue===-1) return;
        if(!$('#grey-out').prop('checked')) return;

        var filled = true;
        puzzle.clues[clue].squares.forEach(function(sq){
            if(gridTextDOM[sq].text().length === 0) filled = false;
        });

        cluesDOM[clue].toggleClass('complete', filled);
    };

    var updateCell = function(value){
        $('.current .cell-text').text(value);

        greyOutClue(puzzle.grid[curCell].acrossClue);
        greyOutClue(puzzle.grid[curCell].downClue);

        socket.emit('update', {cell: curCell,
                                value: value,
                                uid: puzzle.uid,
                                room: room});
    };

    var setAlert = function(alertString){
        $('.alert').show();
        $('.alert').text(alertString);
    };

    $('#grey-out').on('click', function(){
        if($(this).prop('checked')){
            for(var i=0;i<puzzle.clues.length;i++){
                greyOutClue(i);
            }
        }else{
            for(var i=0;i<puzzle.clues.length;i++){
                cluesDOM[i].removeClass('complete');
            }
        }
    });

    $('.option-select').on('click', function(){
        $('.option-list').toggle();
    });

    $('.upload-select').on('click', function(){
        $('.upload-list').toggle();
    });

    $('.crossword').on('click', 'td', function(){
        if(!isPuzzle) return;

        var nextCell = $(this).data('ind');
        if(nextCell === curCell){
            // if click on already highlighted square,
            // try to change direction
            if(curDir === 'across' && puzzle.grid[curCell].downClue!==-1){
                changeDir('down');
            }else if(curDir === 'down' && puzzle.grid[curCell].acrossClue!==-1){
                changeDir('across');
            }
        }else{
            navigateTo(nextCell);
        }
    });

    $('.clues').on('click', 'li', function(){
        if(!isPuzzle) return;

        autoscrollUI = false; // disable autoscroll
        navigateToClue($(this).data('ind'));
        autoscrollUI = true; // reenable autoscroll
    });

    $(document).keydown(function(event){
        if(!isPuzzle) return;

        var keyCode = event.which;

        if(keyCode>=65 && keyCode<=90){
            if(event.ctrlKey) return;

            var overwrite = (gridTextDOM[curCell].text()!=='');
            updateCell(String.fromCharCode(keyCode));
            
            navigateTo(getInputCell(overwrite));
        }else{
            switch(keyCode){
                case 8: // backspace
                    event.preventDefault();
                    if($('.current .cell-text').text() === ''){
                        // if empty, move back first
                        navigateBackward();
                    }

                    updateCell('');

                    break;

                case 9: // tab
                case 13: // enter
                    event.preventDefault();

                    var nextClue;
                    if(event.shiftKey){
                        nextClue = (curClue - 1)%(puzzle.clues.length);
                        if(nextClue < 0) nextClue += puzzle.clues.length;
                    }else{
                        nextClue = (curClue + 1)%(puzzle.clues.length);
                    }

                    navigateToClue(nextClue);

                    break;

                case 32: // space
                    event.preventDefault();
                    updateCell('');

                    navigateForward();

                    break;

                case 35: // end
                    event.preventDefault();

                    navigateTo(puzzle.clues[curClue].endCell);
                    break;

                case 36: // home
                    event.preventDefault();

                    navigateTo(puzzle.clues[curClue].cell);
                    break;

                case 37: // left
                    event.preventDefault();
                    if(curDir==='across' || puzzle.grid[curCell].acrossClue==-1){
                        navigateTo(puzzle.grid[curCell].nextLeft);
                    }else{
                        changeDir('across');
                        if($('#move-change-dir').prop('checked')){
                            navigateTo(puzzle.grid[curCell].nextLeft);
                        }
                    }
                    break;

                case 38: // up
                    event.preventDefault();
                    if(curDir==='down'  || puzzle.grid[curCell].downClue==-1){
                        navigateTo(puzzle.grid[curCell].nextUp);
                    }else{
                        changeDir('down');
                        if($('#move-change-dir').prop('checked')){
                            navigateTo(puzzle.grid[curCell].nextUp);
                        }
                    }
                    break;

                case 39: // right
                    event.preventDefault();
                    if(curDir==='across'  || puzzle.grid[curCell].acrossClue==-1){
                        navigateTo(puzzle.grid[curCell].nextRight);
                    }else{
                        changeDir('across');
                        if($('#move-change-dir').prop('checked')){
                            navigateTo(puzzle.grid[curCell].nextRight);
                        }
                    }
                    break;

                case 40: // down
                    event.preventDefault();
                    if(curDir==='down' || puzzle.grid[curCell].downClue==-1){
                        navigateTo(puzzle.grid[curCell].nextDown);
                    }else{
                        changeDir('down');
                        if($('#move-change-dir').prop('checked')){
                            navigateTo(puzzle.grid[curCell].nextDown);
                        }
                    }
                    break;

                case 46: // delete
                    event.preventDefault();
                    updateCell('');
                    break;

                default:
                    break;
            }
        }
    });

    var initialize = function(puzzleData){
        resetPuzzle();

        if(!$.isEmptyObject(puzzleData)){
            puzzle = processPuzzleData(puzzleData);
            isPuzzle = true;

            gridDOM = createGrid(puzzle);
            cluesDOM = createClues(puzzle);
            gridTextDOM = gridDOM.map(function(cell){return cell.find('.cell-text');});

            curCell = puzzle.clues[0].cell;
            curClue = 0;
            curDir = 'across';

            gridDOM[curCell].addClass('current');
            updateCurrentClue();
        }else{
            $('.puzzle-active').hide();
            isPuzzle = false;
        }
    };

    //socket.io initialization
    var socket = io.connect('http://' + document.domain + ':' + location.port);
    var room = location.pathname;
    

    socket.on('connect', function() {
        socket.emit('init', {room: room});
    });

    socket.on('update', function(msg) {
        if(!isPuzzle) return;
        if(msg['uid']!==puzzle.uid){
            setAlert('Puzzle out of date; please refresh page');
            return;
        }

        var cell = msg['cell'];
        var value = msg['value'];

        gridTextDOM[cell].text(value);

        greyOutClue(puzzle.grid[cell].acrossClue);
        greyOutClue(puzzle.grid[cell].downClue);

        if(msg['solved']){
            setAlert('Good job! You solved the puzzle!');
        }
    });

    socket.on('update_all', function(msg) {
        if(!isPuzzle) return;

        if(msg['uid']!==puzzle.uid){
            setAlert('Puzzle out of date; please refresh page.');
            return;
        }

        for(var i=0;i<gridDOM.length;i++){
            gridTextDOM[i].text(msg.data[i]);
        }

        for(var i=0;i<puzzle.clues.length;i++){
            greyOutClue(i);
        }

        if(msg['solved']){
            setAlert('Good job! You solved the puzzle!');
        }
    });

    socket.on('update_puzzle', function(puzzleData) {
        initialize(puzzleData);
    });

    socket.on('error', function(message) {
        switch(message.code){
            case 'REFR':
                setAlert('Puzzle out of date; please refresh page');
                break;

            default:
                break;
        }
    });
};

$(document).ready(main);
