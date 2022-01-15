// Returns a numeric value to an pixeled value
function toPX(value) {
    return value + 'px';
}

// The Disk class
class Disk {
    constructor(element) {
        // The element
        this.box = element;
    }

    // Horizontally aligns the disk to a tower
    alignPos(tower) {
        // Getting the number of the tower
        var towerNum = tower.number;
        // Calculating the middle position from the left of the tower from the tower's number
        var towerPos = (towerNum - 1)*550 + 250;
        // Calculating the position from the left of the disk so that it's aligned
        return toPX(towerPos - parseInt(this.box.style.width)/2);
    } 

    // Moves the disk
    move(numStart, numEnd, state) {
        return new Promise((resolve, reject) => {
            // Getting the starting and ending tower
            var start = Canvas.getTower(numStart), end = Canvas.getTower(numEnd);

            // Calculating the bottom and left position at the middle stage
            var midBottom = toPX(565 - 12.5);
            var midLeft = toPX(250 + (((numStart + numEnd)/2) - 1)*550 - parseInt(this.box.style.width)/2);

            // Getting the direction of the move
            var dir = ((numEnd - numStart) > 0) ? 'forwards' : 'backwards';

            // Setting the animation properties of the move
            this.box.animate([
                {
                    bottom: this.box.style.bottom,
                    left: this.box.style.left,
                    transform: 'rotate(0)',
                    backgroundColor: this.box.style.backgroundColor
                },
                {
                    bottom: '400px',
                    left: this.box.style.left,
                    transform: 'rotate(0)'
                },
                {
                    bottom: midBottom,
                    left: midLeft,
                    transform: (dir === 'forwards') ? 'rotate(90deg)' : 'rotate(-90deg)'
                },
                {
                    bottom: '400px',
                    left: this.alignPos(end),
                    transform: (dir === 'forwards') ? 'rotate(180deg)' : 'rotate(-180deg)'
                },
                {
                    bottom: toPX(end.disksOn*50),
                    left: this.alignPos(end),
                    transform: (dir === 'forwards') ? 'rotate(180deg)' : 'rotate(-180deg)',
                    backgroundColor: (state === 'temp') ? 'green' : 'blue'
                }
            ], {
                duration: Game.moveDuration*1000,
                fill: 'forwards',
                easing: 'linear'
            });

            // Setting the final properties of the disk
            this.box.style.bottom = toPX(end.disksOn*50);
            this.box.style.left = this.alignPos(end);
            this.box.style.backgroundColor = (state === 'temp') ? 'green' : 'blue'

            // Resolving the promise after the move is fully accomplished
            setTimeout(() => {
                // Decrementing and incrementing the number of disks on the starting and ending tower
                start.removeDisk();
                end.addDisk();

                // Incrementing the number of moves
                Game.plusMove();

                resolve();
            }, (Game.moveDuration*1000));
        })
    }
}

// The Tower class
class Tower {
    constructor (n) {
        // The element
        this.box = document.querySelector(`.towers .tower-${n}`);
        // The number of the tower
        this.number = n;
        // The number of disks over the tower
        this.disksOn = 0;
    }

    // Increments the number of disks
    addDisk() {
        this.disksOn++;
    }

    // Decrements the number of disks
    removeDisk() {
        this.disksOn--;
    }
}

// The Canvas object
var Canvas = {
    // The canvas element
    box: document.getElementById('canvas'),

    // The number of disks
    disksNb: 0,

    // The moves counter
    counter: document.getElementById('counter'),

    // The form taking the number of disks
    form: document.getElementsByTagName('form')[0],

    // The disks
    disks: [],

    // The towers
    towers: [
        new Tower(1),
        new Tower(2),
        new Tower(3)
    ],

    // Gets a tower
    getTower(n) {
        return this.towers[n-1];
    },

    // Creates the disks
    createDisks(n) {
        return new Promise((resolve, reject) => {
            // setting the number of disks inside the canvas
            this.disksNb = n;

            // Looping from 1 to n(number of disks)
            var i;
            for (i = 1; i <= n; i++) {
                // Creating the element
                let disk = document.createElement('DIV');
                Canvas.box.appendChild(disk);
                disk.className = 'disk';
                disk.style.backgroundColor = 'yellow';

                // Calculating and setting the width of the disk 
                disk.style.width = (n <= 5) ? toPX(300 - (i-1)*50) : toPX(300 - ((i-1)*250)/n);

                // Positioning the disk upon the canvas
                disk.style.bottom = `calc(100% + ${toPX((i-1)*50)})`;

                // Creating a disk object and pushing it into the disks array
                this.disks.unshift(new Disk(disk));
                
                // Aligning the disk to the first tower
                disk.style.left = this.disks[0].alignPos(this.getTower(1));
            }

            resolve();
        })
    },

    // Drops all the disks to the first tower
    dropDisks() {
        var tower1 = this.getTower(1);

        return new Promise((resolve, reject) => {
            // Looping through the disks
            var i;
            for (i = (this.disks.length-1); i >= 0; i--) {
                let disk = this.disks[i].box;

                // Moving the disk down to the tower
                disk.style.bottom = toPX(tower1.disksOn*50);
    
                // Setting the transition properties of the disk for the dropping move
                disk.style.transitionDuration = '1s';
                disk.style.transitionDelay = `${tower1.disksOn*0.25}s`;

                // Incrementing the number of disks over the first tower
                tower1.addDisk();

                // Resolving the promise when the last disk is fully dropped
                if (i === 0)
                    disk.ontransitionend = () => resolve();
            }
        })
    }
}

// The game object
var Game = {
    // The move duration
    moveDuration: 1,

    // The number of moves
    movesNb: 0,

    // Increments the number of moves
    plusMove: function () {
        Canvas.counter.innerHTML = `${this.movesNb + 1}`;
        this.movesNb++;
    },

    // Gets the number of disks
    getDisksNumber: function () {
        return new Promise(async(resolve, reject) => {
            // Waiting for the form submition to finally create the disks 
            Canvas.form.onsubmit = function (e) {
                e.preventDefault();
                var n = parseInt(document.getElementById('input').value);

                // Creating the disks
                Canvas.createDisks(n);

                // Preparing to hide the form
                Canvas.form.style.transition = '1s ease-out';
                Canvas.form.style.right = '100%';

                // Resolving the promise when the form is fully hidden
                Canvas.form.ontransitionend = function () {
                    resolve();
                }
            }
        })
    },

    // Checks if the moves are finished
    checkFinished: () => (Canvas.disksNb === Canvas.getTower(3).disksOn),

    // Runs the algorithm
    run: function (n, start, temp, end, state) {
        return new Promise(async (resolve, reject) => {
            var move, run;
            if (n === 0)
                move = await Canvas.disks[n].move(start, end, state);
            else {
                run = await this.run(n-1, start, end, temp, 'temp');
                move = await Canvas.disks[n].move(start, end, state);
                run = await this.run(n-1, temp, start, end, 'final');
            }

            resolve();
        })
    }
}

// Starts everything
async function start() {
    await Game.getDisksNumber();
    await Canvas.dropDisks();
    await Game.run(Canvas.disksNb - 1, 1, 2, 3, 'final')
    console.log(Canvas.disks);
}

start();
// 135px