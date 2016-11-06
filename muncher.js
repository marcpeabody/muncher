var game = new Phaser.Game(640, 480, Phaser.CANVAS, 'game');

var PhaserGame = function (game) {
};

PhaserGame.prototype = {

    init: function () {
      // this.scoreLeft = 0;
      // this.scoreLeftText = null;
      // this.scoreRight = 0;
      // this.scoreRightText = null;
      this.physics.startSystem(Phaser.Physics.ARCADE);
      this.grid = null;
    },

    preload: function () {
        game.load.spritesheet('muncher', 'mummy.png', 37, 45, 18);
    },

    create: function () {
      this.grid = new Grid(6, 5, 2, 2, 90, 70);
      // this.scoreLeftText = game.add.text(0, 0, this.scoreLeft, {font: "72px Arial", fill: "blue"});
      // this.scoreRightText = game.add.text(game.width, 0, this.scoreRight, {font: "72px Arial", fill: "red", align: "right"});
      // this.scoreRightText.x = Math.floor(game.width - this.scoreRightText.width);
      //this.scoreRightText.setTextBounds(16, 16, 200, 40);
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

      game.input.keyboard.addKeyCapture([ Phaser.Keyboard.LEFT,
                                          Phaser.Keyboard.RIGHT,
                                          Phaser.Keyboard.UP,
                                          Phaser.Keyboard.DOWN,
                                          Phaser.Keyboard.SPACEBAR ]);
    },

    update: function () {
      this.grid.tryMove(this.cursors);
      this.grid.tryGobble(this.spaceKey);
    },

    render: function () {
    }

};

game.state.add('Game', PhaserGame, true);



var Grid = function (columnCount, rowCount, startingX, startingY, gridCellSizeX, gridCellSizeY) {
  this.updateScore(0);
  this.adjustX = 40;
  this.adjustY = 60;
  this.gridCellSizeX = gridCellSizeX || (game.width / columnCount);
  this.gridCellSizeY = gridCellSizeY || (game.height / rowCount);
  this.inputHalted = false;
  this.gobbleHalted = false;
  this.columnCount = columnCount;
  this.rowCount = rowCount;
  this.startingX = startingX;
  this.startingY = startingY;
  this.resetHero();
  this.drawCellBorders();
  this.fillCellsWithNoms();
};

Grid.prototype = {
  resetHero: function() {
    this.currentX = this.startingX;
    this.currentY = this.startingY;
    var x = this.currentXPixel(),
        y = this.currentYPixel();
    if (!this.muncher) {
      this.muncher = game.add.sprite(x, y, 'muncher');
      this.muncher.anchor.set(0.5);
      //this.muncher.scale.set(6);
      this.muncher.smoothed = false;

      this.muncher.animations.add('walk');
      this.muncher.animations.play('walk', 15, true);
    } else {
      this.muncher.x = x;
      this.muncher.y = y;
    }
  },
  currentXPixel: function() {
    return this.calculateXPixelCenter(this.currentX);
  },
  currentYPixel: function() {
    return this.calculateYPixelCenter(this.currentY);
  },
  calculateXPixel: function(columnGridIndex) {
    return this.adjustX + (columnGridIndex * this.gridCellSizeX);
  },
  calculateYPixel: function(rowGridIndex) {
    return this.adjustY + (rowGridIndex * this.gridCellSizeY);
  },
  calculateXPixelCenter: function(columnGridIndex) {
    return this.calculateXPixel(columnGridIndex) + (this.gridCellSizeX / 2);
  },
  calculateYPixelCenter: function(rowGridIndex) {
    return this.calculateYPixel(rowGridIndex) + (this.gridCellSizeY / 2);
  },
  tryGobble: function(gobbleKey) {
    var currentNom = this.noms[this.currentX][this.currentY];
    if (!this.gobbleHalted && gobbleKey.isDown && currentNom && currentNom.text.text) {
      this.gobbleHalted = true;
      var eatenValue = parseInt(currentNom.text.text);
      if (eatenValue % 2 === 0) {
        this.addToScore(eatenValue);
      } else {
        this.subtractFromScore(eatenValue);
      }
      currentNom.text.setText('');
      game.time.events.add(Phaser.Timer.QUARTER * 1, function() {
        this.gobbleHalted = false;
      }, this);
      if (this.winCondition()) {
        this.fillCellsWithNoms();
        this.currentX = this.startingX || 0;
        this.currentY = this.startingY || 0;
        this.muncher.position.x = this.currentXPixel();
        this.muncher.position.y = this.currentYPixel();
      }
    }
  },
  winCondition: function() {
    var isEven = function(nom) {
      return nom && nom.value % 2 === 0 && nom.text.text;
    }
    for (var y=0; y<this.noms.length; y++) {
      for (var x=0; x<this.noms[y].length; x++) {
        if (isEven(this.noms[y][x])) {
          return false;
        }
      }
    }
    return true;
  },
  addToScore: function(addTo) {
    this.updateScore(this.score + addTo);
  },
  subtractFromScore: function(subtractFrom) {
    this.updateScore(this.score - subtractFrom);
  },
  updateScore: function(newScore) {
    this.score = newScore;

    if (this.scoreText) {
      this.scoreText.setText("Score: " + this.score);
    } else {
      this.scoreText = game.add.text(100, 20, "Score: " + this.score, {font: "16px Arial", fill: "white"});
    }
  },
  tryMove: function(cursors) {
      if (!this.inputHalted) {
        if (cursors.left.isDown && this.currentX > 0) {
          this.currentX -= 1;
          this.tweenMove();
        }
        else if (cursors.right.isDown && this.currentX < this.columnCount-1) {
          this.currentX += 1;
          this.tweenMove();
        }
        else if (cursors.up.isDown && this.currentY > 0) {
          this.currentY -= 1;
          this.tweenMove();
        }
        else if (cursors.down.isDown && this.currentY < this.rowCount-1) {
          this.currentY += 1;
          this.tweenMove();
        }
      }
  },
  delayGobble: function(time) {
    time = time || Phaser.Timer.QUARTER * 1;
    this.gobbleHalted = true;
    game.time.events.add(time, function() {
      this.gobbleHalted = false;
    }, this);
  },

  tweenMove: function(toPositionX, toPositionY) {
    var toPosition = {x: this.currentXPixel(), y: this.currentYPixel()}
    this.inputHalted = true;
    this.gobbleHalted = true;
    // this.delayGobble();
    var move = game.add.tween(this.muncher);
    move.to(toPosition, 300).onComplete.add(function(){
      this.inputHalted = false;
      this.gobbleHalted = false;
    }.bind(this), this);
    move.start();
  },

  drawCellBorders: function() {
    var graphics = game.add.graphics(0, 0);
    graphics.lineStyle(2, 0x0000FF, 1);
    for (var column=0; column < this.columnCount; column++) {
      for (var row=0; row < this.rowCount; row++) {
        graphics.drawRect(this.calculateXPixel(column), this.calculateYPixel(row), this.gridCellSizeX, this.gridCellSizeY);
      }
    }
  },
  fillCellsWithNoms: function() {
    this.clearExistingNoms();
    var number = 1;
    for (var column=0; column < this.columnCount; column++) {
      this.noms[column] = [];
      for (var row=0; row < this.rowCount; row++) {
        number = Math.ceil(Math.random() * 30)
        this.noms[column][row] = new Nommable(number, this.calculateXPixelCenter(column), this.calculateYPixelCenter(row));
        // number += 1;
      }
    }
  },
  clearExistingNoms: function() {
    var nom;
    if (this.noms) {
      for (var y=0; y<this.noms.length; y++) {
        for (var x=0; x<this.noms[y].length; x++) {
          nom = this.noms[y][x];
          if (nom) {
            nom.text.destroy();
          }
        }
      }
    }
    this.noms = [];
  }
}

var Nommable = function (value, x, y) {
  this.value = value;
  this.text = game.add.text(x, y, value, {font: "16px Arial", fill: "white"});
};
