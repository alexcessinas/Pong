// Global Variables
var DIRECTION = {
  IDLE: 0,
  UP: 1,
  DOWN: 2,
  LEFT: 3,
  RIGHT: 4
};

var rounds = [5, 5, 3, 3, 2];
var colors = ['#1abc9c', '#2ecc71', '#3498db', '#e74c3c', '#9b59b6'];

// L'objet balle (le cube qui rebondit d'avant en arrière)
var Ball = {
  new: function(incrementedSpeed) {
    return {
      width: 18,
      height: 18,
      x: (this.canvas.width / 2) - 9,
      y: (this.canvas.height / 2) - 9,
      moveX: DIRECTION.IDLE,
      moveY: DIRECTION.IDLE,
      speed: incrementedSpeed || 9
    };
  }
};

// L'objet pagaie (Les deux lignes qui montent et descendent)
var Paddle = {
  new: function(side) {
    return {
      width: 18,
      height: 70,
      x: side === 'left' ? 150 : this.canvas.width - 150,
      y: (this.canvas.height / 2) - 35,
      score: 0,
      move: DIRECTION.IDLE,
      speed: 10
    };
  }
};

var Game = {
  initialize: function() {
    this.canvas = document.querySelector('canvas');
    this.context = this.canvas.getContext('2d');

    this.canvas.width = 1400;
    this.canvas.height = 1000;

    this.canvas.style.width = (this.canvas.width / 2) + 'px';
    this.canvas.style.height = (this.canvas.height / 2) + 'px';

    this.player = Paddle.new.call(this, 'left');
    this.paddle = Paddle.new.call(this, 'right');
    this.ball = Ball.new.call(this);

    this.paddle.speed = 8;
    this.running = this.over = false;
    this.turn = this.paddle;
    this.timer = this.round = 0;
    this.color = '#2c3e50';

    Pong.menu();
    Pong.listen();
  },

  endGameMenu: function(text) {
    // Modifier la taille et la couleur de la police du canevas
    Pong.context.font = '50px Courier New';
    Pong.context.fillStyle = this.color;

    // Tracez le rectangle derrière le texte «Appuyez sur n'importe quelle touche pour commencer».
    Pong.context.fillRect(
      Pong.canvas.width / 2 - 350,
      Pong.canvas.height / 2 - 48,
      700,
      100
    );

    // Changez la couleur de la toile;
    Pong.context.fillStyle = '#ffffff';

    // Dessinez le texte du menu de fin de partie («Game Over» et «Winner»)
    Pong.context.fillText(text,
      Pong.canvas.width / 2,
      Pong.canvas.height / 2 + 15
    );

    setTimeout(function() {
      Pong = Object.assign({}, Game);
      Pong.initialize();
    }, 3000);
  },

  menu: function() {
    // Dessinez tous les objets Pong dans leur état actuel
    Pong.draw();

    // Modifier la taille et la couleur de la police du canevas
    this.context.font = '50px Courier New';
    this.context.fillStyle = this.color;

    // Tracez le rectangle derrière le texte «Appuyez sur n'importe quelle touche pour commencer».
    this.context.fillRect(
      this.canvas.width / 2 - 350,
      this.canvas.height / 2 - 48,
      700,
      100
    );

    // Changez la couleur de la toile;
    this.context.fillStyle = '#ffffff';

    // Dessinez le texte `` appuyez sur n'importe quelle touche pour commencer ''
    this.context.fillText('Press any key to begin',
      this.canvas.width / 2,
      this.canvas.height / 2 + 15
    );
  },

  // Mettre à jour tous les objets (déplacer le joueur, pagayer, balle, incrémenter le score, etc.)
  update: function() {
    if (!this.over) {
      // Si la balle entre en collision avec les limites liées - corrigez les coordonnées x et y.
      if (this.ball.x <= 0) Pong._resetTurn.call(this, this.paddle, this.player);
      if (this.ball.x >= this.canvas.width - this.ball.width) Pong._resetTurn.call(this, this.player, this.paddle);
      if (this.ball.y <= 0) this.ball.moveY = DIRECTION.DOWN;
      if (this.ball.y >= this.canvas.height - this.ball.height) this.ball.moveY = DIRECTION.UP;

      // Déplacer le joueur si sa valeur player.move a été mise à jour par un événement clavier
      if (this.player.move === DIRECTION.UP) this.player.y -= this.player.speed;
      else if (this.player.move === DIRECTION.DOWN) this.player.y += this.player.speed;

      // Au nouveau service (début de chaque tour), déplacez le ballon du bon côté
      // et randomiser la direction pour ajouter un défi.
      if (Pong._turnDelayIsOver.call(this) && this.turn) {
        this.ball.moveX = this.turn === this.player ? DIRECTION.LEFT : DIRECTION.RIGHT;
        this.ball.moveY = [DIRECTION.UP, DIRECTION.DOWN][Math.round(Math.random())];
        this.ball.y = Math.floor(Math.random() * this.canvas.height - 200) + 200;
        this.turn = null;
      }

      // Si le joueur entre en collision avec les limites liées, mettez à jour les coordonnées x et y.
      if (this.player.y <= 0) this.player.y = 0;
      else if (this.player.y >= (this.canvas.height - this.player.height)) this.player.y = (this.canvas.height - this.player.height);

      // Déplacer la balle dans la direction voulue en fonction des valeurs moveY et moveX
      if (this.ball.moveY === DIRECTION.UP) this.ball.y -= (this.ball.speed / 1.5);
      else if (this.ball.moveY === DIRECTION.DOWN) this.ball.y += (this.ball.speed / 1.5);
      if (this.ball.moveX === DIRECTION.LEFT) this.ball.x -= this.ball.speed;
      else if (this.ball.moveX === DIRECTION.RIGHT) this.ball.x += this.ball.speed;

      // Palette de poignée (AI) mouvement HAUT et BAS
      if (this.paddle.y > this.ball.y - (this.paddle.height / 2)) {
        if (this.ball.moveX === DIRECTION.RIGHT) this.paddle.y -= this.paddle.speed / 1.5;
        else this.paddle.y -= this.paddle.speed / 4;
      }
      if (this.paddle.y < this.ball.y - (this.paddle.height / 2)) {
        if (this.ball.moveX === DIRECTION.RIGHT) this.paddle.y += this.paddle.speed / 1.5;
        else this.paddle.y += this.paddle.speed / 4;
      }

      // Collision de la poignée de la palette (AI)
      if (this.paddle.y >= this.canvas.height - this.paddle.height) this.paddle.y = this.canvas.height - this.paddle.height;
      else if (this.paddle.y <= 0) this.paddle.y = 0;

      // Gérer les collisions joueur-balle
      if (this.ball.x - this.ball.width <= this.player.x && this.ball.x >= this.player.x - this.player.width) {
        if (this.ball.y <= this.player.y + this.player.height && this.ball.y + this.ball.height >= this.player.y) {
          this.ball.x = (this.player.x + this.ball.width);
          this.ball.moveX = DIRECTION.RIGHT;

        }
      }

      // Poignée collision balle-paddle
      if (this.ball.x - this.ball.width <= this.paddle.x && this.ball.x >= this.paddle.x - this.paddle.width) {
        if (this.ball.y <= this.paddle.y + this.paddle.height && this.ball.y + this.ball.height >= this.paddle.y) {
          this.ball.x = (this.paddle.x - this.ball.width);
          this.ball.moveX = DIRECTION.LEFT;

        }
      }
    }

    // Gérer la transition de fin de cycle
    // Vérifiez si le joueur a gagné le tour.
    if (this.player.score === rounds[this.round]) {
      // Vérifiez s'il reste des tours / niveaux et affichez l'écran de victoire si
      // il n'y a pas.
      if (!rounds[this.round + 1]) {
        this.over = true;
        setTimeout(function() {
          Pong.endGameMenu('Winner!');
        }, 1000);
      } else {
        // S'il y a un autre tour, réinitialisez toutes les valeurs et augmentez le numéro du tour.
        this.color = this._generateRoundColor();
        this.player.score = this.paddle.score = 0;
        this.player.speed += 0.5;
        this.paddle.speed += 1;
        this.ball.speed += 1;
        this.round += 1;
      }
    }
    // Vérifiez si la pagaie / l'IA a gagné la manche.
    else if (this.paddle.score === rounds[this.round]) {
      this.over = true;
      setTimeout(function() {
        Pong.endGameMenu('Game Over!');
      }, 1000);
    }
  },

  // Dessinez les objets sur l'élément canvas
  draw: function() {
    // Dégagez la toile
    this.context.clearRect(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    // Définissez le style de remplissage sur noir
    this.context.fillStyle = this.color;

    // Dessinez l'arrière-plan
    this.context.fillRect(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    // Réglez le style de remplissage sur blanc (pour les pagaies et le ballon)
    this.context.fillStyle = '#ffffff';

    // Dessiner le joueur
    this.context.fillRect(
      this.player.x,
      this.player.y,
      this.player.width,
      this.player.height
    );

    // Dessinez la pagaie
    this.context.fillRect(
      this.paddle.x,
      this.paddle.y,
      this.paddle.width,
      this.paddle.height
    );

    // Dessiner la balle
    if (Pong._turnDelayIsOver.call(this)) {
      this.context.fillRect(
        this.ball.x,
        this.ball.y,
        this.ball.width,
        this.ball.height
      );
    }

    // Dessinez le filet (ligne au milieu)
    this.context.beginPath();
    this.context.setLineDash([7, 15]);
    this.context.moveTo((this.canvas.width / 2), this.canvas.height - 140);
    this.context.lineTo((this.canvas.width / 2), 140);
    this.context.lineWidth = 10;
    this.context.strokeStyle = '#ffffff';
    this.context.stroke();

    // Définissez la police du canevas par défaut et alignez-la au centre
    this.context.font = '100px Courier New';
    this.context.textAlign = 'center';

    // Dessinez le score des joueurs (à gauche)
    this.context.fillText(
      this.player.score.toString(),
      (this.canvas.width / 2) - 300,
      200
    );

    // Dessinez le score des pagaies (à droite)
    this.context.fillText(
      this.paddle.score.toString(),
      (this.canvas.width / 2) + 300,
      200
    );

    // Modifier la taille de la police du texte de la partition centrale
    this.context.font = '30px Courier New';

    // Tirage du score gagnant (centre)
    this.context.fillText(
      'Round ' + (Pong.round + 1),
      (this.canvas.width / 2),
      35
    );

    // Modifier la taille de la police pour la valeur du score central
    this.context.font = '40px Courier';

    // Dessiner le numéro du tour actuel
    this.context.fillText(
      rounds[Pong.round] ? rounds[Pong.round] : rounds[Pong.round - 1],
      (this.canvas.width / 2),
      100
    );
  },

  loop: function() {
    Pong.update();
    Pong.draw();

    // Si le jeu n'est pas terminé, dessinez le cadre suivant.
    if (!Pong.over) requestAnimationFrame(Pong.loop);
  },

  listen: function() {
    document.addEventListener('keydown', function(key) {
      // Gérez la fonction «Appuyez sur n'importe quelle touche pour commencer» et démarrez le jeu.
      if (Pong.running === false) {
        Pong.running = true;
        window.requestAnimationFrame(Pong.loop);
      }

      // Gérer les événements de flèche vers le haut et de touche w
      if (key.keyCode === 38 || key.keyCode === 87) Pong.player.move = DIRECTION.UP;

      // Gérer les événements de flèche vers le bas et s
      if (key.keyCode === 40 || key.keyCode === 83) Pong.player.move = DIRECTION.DOWN;
    });

    // Empêchez le lecteur de bouger lorsqu'il n'y a aucune touche enfoncée.
    document.addEventListener('keyup', function(key) {
      Pong.player.move = DIRECTION.IDLE;
    });
  },

  // Réinitialisez l'emplacement de la balle, le joueur se retourne et définit un délai avant le début du tour suivant.
  _resetTurn: function(victor, loser) {
    this.ball = Ball.new.call(this, this.ball.speed);
    this.turn = loser;
    this.timer = (new Date()).getTime();

    victor.score++;
  },

  // Attendez qu'un délai se soit écoulé après chaque tour.
  _turnDelayIsOver: function() {
    return ((new Date()).getTime() - this.timer >= 1000);
  },

  // Sélectionnez une couleur aléatoire comme arrière-plan de chaque niveau / tour.
  _generateRoundColor: function() {
    var newColor = colors[Math.floor(Math.random() * colors.length)];
    if (newColor === this.color) return Pong._generateRoundColor();
    return newColor;
  }
};

var Pong = Object.assign({}, Game);
Pong.initialize();
