// UI Variables
var gameScreen;
var score;

// Platform Variables
var platforms; // p5.play sprite group
var platformImageFirst, platformImageMiddle, platformImageLast;

// Player Variables
var player; //p5.play sprite
var playerIdleAnimation, playerRunAnimation, playerJumpAnimation, playerFallAnimation;
var playerGrounded; // boolean
var playerStartX, playerStartY;

// Monster Variables
var monsters; // p5.play sprite group
var monsterWalkAnimation;
var monsterDefeatImage;

// Other Game Object Variables
var collectables;
var collectableImage;
var goal;
var goalImage;

// Physics Variables
const GRAVITY = 0.5;
const DEFAULT_VELOCITY = 5;
const DEFAULT_JUMP_FORCE = -5;
var currentJumpForce;

// Timing and Control Variables
const MAX_JUMP_TIME = 2000; //milliseconds
var currentJumpTime;
var millis, deltaMillis;
var gamePaused;

// This allows the player to press any of the arrow keys (as well as spacebar, just
// in case you wanted to program that eventually) without interfering with the
// browser window.
window.addEventListener("keydown", function(e) {
  var key = e.which || e.keyCode;
  var gameKeys = [32, 37, 38, 39, 40];
  if(gameKeys.indexOf(key) >= 0) {
      e.preventDefault();
  }
});

function preload() {
  // load background image
  backgroundImage = loadImage("assets/img/backgrounds/BG.png");

  // load platform images
  platformImageFirst = loadImage("assets/img/tiles/Tile (14).png");
  platformImageMiddle = loadImage("assets/img/tiles/Tile (15).png");
  platformImageLast = loadImage("assets/img/tiles/Tile (16).png");

  // load player animations
  playerIdleAnimation = loadAnimation("assets/img/kunoichi/Idle__000.png", "assets/img/kunoichi/Idle__009.png");
  playerRunAnimation = loadAnimation("assets/img/kunoichi/Run__000.png", "assets/img/kunoichi/Run__009.png");
  playerJumpAnimation = loadAnimation("assets/img/kunoichi/Jump__004.png");
  playerFallAnimation = loadAnimation("assets/img/kunoichi/Jump__009.png");

  // load monster animations
  monsterWalkAnimation = loadAnimation("assets/img/monster/frame-1.png", "assets/img/monster/frame-10.png");
  monsterDefeatImage = loadImage("assets/img/monster/defeat-frame-3.png");

  // load other game object images
  collectableImage = loadImage("assets/img/kunoichi/Kunai.png");
  goalImage = loadImage("assets/img/objects/Goal.png");
}

function setup() {
  gameScreen = createCanvas(1280, 720);
  gameScreen.parent("#game-screen");
  backgroundImage.resize(width, height);
  playerStartX = 50;
  playerStartY = 300;
  resetGame();
}

function draw() {
  applyGravity();
  checkCollisions();
  updatePlayer();
  updateDisplay();
  drawSprites();
}

// Called when player wins or loses
function resetGame() {
  allSprites.clear();
  buildLevel();
  createPlayer();
  currentJumpForce = DEFAULT_JUMP_FORCE;
  currentJumpTime = MAX_JUMP_TIME;
  playerGrounded = false;
  score = 0;
  gamePaused = false;
  loop();
}

// Called when the game begins.
function buildLevel() {
  // create groups
  platforms = new Group();
  monsters = new Group();
  collectables = new Group();

  // create platforms, monsters, and any other game objects
  // best method is to draw sprites from left to right on the screen
  createPlatform(50, 690, 5);
  createPlatform(850, 645, 3);
  createPlatform(1450, 595, 4);
  createPlatform(2050, 480, 2.5);
  createPlatform(2500, 350, 2);
  createPlatform(2500, 670, 3);
  createPlatform(3000, 525, 2);
  createCollectable(300, 340);
  createCollectable(745, 430);
  createCollectable(1085, 320);
  createCollectable(1232, 430);
  createCollectable(1600, 320);
  createCollectable(1756, 389);
  createMonster(500, 600, 0);
  createMonster(1085, 530, 0);
  createMonster(1730, 470, 0);
  createMonster(1860, 470, 0);
  createMonster(500, 600, -1);
  createMonster(2290, 290, 0);
  createMonster(2800, 300, 0);
  goal = createSprite(3100, 415);
  goal.addImage(goalImage);

}

// Creates a player sprite and adds animations and a collider to it
function createPlayer() {
  player = createSprite(playerStartX, playerStartY, 0, 0);
  player.addAnimation("idle", playerIdleAnimation).looping = true;
  player.addAnimation("run", playerRunAnimation).looping = true;
  player.addAnimation("jump", playerJumpAnimation).looping = false;
  player.addAnimation("fall", playerFallAnimation).looping = false;
  player.scale = 0.25;
  player.setCollider("rectangle", 0, 0, 250, 490);
  //player.debug = true;
}

// Creates a platform of specified length (len) at x, y.
// Value of len must be >= 2
function createPlatform(x, y, len) {
  var first = createSprite(x, y, 0, 0);
  var last = createSprite(x + ((len - 1) * 128), y, 0, 0);
  first.addToGroup(platforms);
  last.addToGroup(platforms);
  first.addImage(platformImageFirst);
  last.addImage(platformImageLast);
  //first.debug = true;
  //last.debug = true;
  if(len > 2) {
    for(var i = 1; i < len - 1; i++) {
      var middle = createSprite(x + (128 * i), y, 0, 0);
      middle.addToGroup(platforms);
      middle.addImage(platformImageMiddle);

      //middle.debug = true;
    }
  }
}

// Creates a monster sprite and adds animations and a collider to it.
// Also sets the monster's initial velocity.
function createMonster(x, y, velocity) {
  var monster = createSprite(x, y, 0, 0);
  monster.addToGroup(monsters);
  monster.addAnimation("walk", monsterWalkAnimation).loop = true;
  monster.changeAnimation("walk");
  monster.scale = 0.25;
  monster.setCollider("rectangle", 0, 7, 300, 160);
  monster.velocity.x = velocity;
  if(monster.velocity.x <= 0) {
    monster.mirrorX(-1);
  }
  else {
    monster.mirrorX(1);
  }
  //monster.debug = true;
}

// Creates a collectable sprite and adds an image to it.
function createCollectable(x, y) {
  var collectable = createSprite(x, y, 0, 0);
  collectable.addToGroup(collectables);
  collectable.scale = 0.5;
  collectable.addImage(collectableImage);
  //collectable.debug = true;
}

// Applies gravity to player and monsters. Also checks if either of them
// have fallen off the screen. If a player has fallen off the screen, this
// function calls executeLoss(). If a monster falls off the screen, it is
// removed from the game.
function applyGravity() {
    player.velocity.y += GRAVITY;
    if(player.previousPosition.y !== player.position.y) {
      playerGrounded = false;
    }
    if(player.position.y >= height) {
    }
    for(var i = 0; i < monsters.length; i++) {
      monsters[i].velocity.y += GRAVITY;
      if(monsters[i].position.y >= height) {
        monsters[i].remove();
      }
    }
}

// Called in the draw() function. Continuously checks for collisions and overlaps
// between all relevant game objects. Depending on the collision or overlap that
// occurs, a specific callback function is run.
function checkCollisions() {
    player.collide(platforms, platformCollision);
    player.collide(monsters, playerMonsterCollision);
    monsters.collide(platforms, platformCollision);
    player.overlap(collectables, getCollectable);
    player.overlap(goal, executeWin);
}

// Callback function that runs when the player or a monster collides with a
// platform.
function platformCollision(sprite, platform) {
    if(sprite === player && sprite.touching.bottom) {
        sprite.velocity.y = 0;
        playerGrounded = true;
        currentJumpTime = MAX_JUMP_TIME;
        currentJumpForce = DEFAULT_JUMP_FORCE;
    }
    for(var i = 0; i < monsters.length; i++) {
      if(sprite === monsters[i] && sprite.touching.bottom) {
        sprite.velocity.y = 0;
      }
    }
}

// Callback function that runs when the player collides with a monster.
function playerMonsterCollision(player, monster) {
  if(player.touching.bottom) {
 monster.remove();

var defeatedMonster = createSprite(monster.position.x, monster.position.y, 0, 0);
defeatedMonster.addImage(monsterDefeatImage);
defeatedMonster.mirrorX(monster.mirrorX());
defeatedMonster.scale = 0.25;
defeatedMonster.life = 40;
currentJumpTime = MAX_JUMP_TIME;
currentJumpForce = DEFAULT_JUMP_FORCE;
player.velocity.y = currentJumpForce;
millis = new Date();
score++;

   }
   else {
     executeLoss();
   }
}

// Callback function that runs when the player overlaps with a collectable.
function getCollectable(player, collectable) {
 collectable.remove();
 player.score++;
  }

// Updates the player's position and current animation by calling
// all of the relevant "check" functions below.
function updatePlayer() {
  console.log("Player x: " + player.position.x + " Player y: " + player.position.y);
  checkIdle();
  checkFalling();
  checkJumping();
  checkMovingLeftRight();
}

// Check if the player is idle. If neither left nor right are being pressed and the
// player is grounded, set player's animation to "idle", and change her
// x velocity to 0.
function checkIdle() {
  if(!keyIsDown(LEFT_ARROW) && !keyIsDown(RIGHT_ARROW) && playerGrounded) {
    player.changeAnimation("idle");
    player.velocity.x = 0;
  }
}

// Check if the player is falling. If she is not grounded and her y velocity is
// greater than 0, then set her animation to "fall".
function checkFalling() {
  if(!playerGrounded && player.velocity.y > 0) {
    player.changeAnimation("fall");
  }
}

// Check if the player is jumping. First, if her y velocity is less than 0, set
// her animation to "jump". Then, handle if the player is holding down the up arrow
// key, which should allow her to jump higher so long as currentJumpTime is greater
// than 0.
function checkJumping() {
  if(player.velocity.y < 0) {
    player.changeAnimation("jump");
    if(keyIsDown(UP_ARROW) && currentJumpTime > 0) {
      player.velocity.y = currentJumpForce;
      deltaMillis = new Date();
      currentJumpTime -= deltaMillis - millis;
    }
  }
}

// Check if the player is moving left or right. If so, move the player character
// left or right according to DEFAULT_VELOCITY. Also be sure to mirror the
// player's sprite left or right to avoid "moonwalking".
function checkMovingLeftRight() {
    if(keyIsDown(LEFT_ARROW) && !keyIsDown(RIGHT_ARROW)) {
        player.mirrorX(-1);
        if(playerGrounded) {
            player.changeAnimation("run");
        }
        player.velocity.x = -DEFAULT_VELOCITY;
    }
    else if(keyIsDown(RIGHT_ARROW) && !keyIsDown(LEFT_ARROW)) {
        player.mirrorX(1);
        if(playerGrounded) {
            player.changeAnimation("run");
        }
        player.velocity.x = DEFAULT_VELOCITY;
    }
}

// Check if the player has pressed the up arrow key. If the player is grounded
// this should initiate the jump sequence, which can be extended by holding down
// the up arrow key (see checkJumping() above).
function keyPressed() {
  if(keyCode === UP_ARROW && playerGrounded) {
    playerGrounded = false;
    player.velocity.y = currentJumpForce;
    millis = new Date();
  }
}

// Check if the player has released the up arrow key. If the player's y velocity
// is < 0 (that is, she is currently moving "up" on the canvas), then this will
// immediately set currentJumpTime to 0, causing her to begin falling.
function keyReleased() {
  if(keyCode === UP_ARROW && player.velocity.y < 0) {
    currentJumpTime = 0;
  }
}

// Check if the player has typed the "p" key, which pauses the game. We use
// keyTyped() for this because it is not case sensitive (whereas keyPressed() is).
// Therefore, the player can press "P" or "p" and the game will be paused either way.
function keyTyped() {

}

// Called in the draw() loop. Constantly refreshes the canvas, including static
// images, the score display. Also sets the camera's x position to the player's x
// position, so that the camera "follows" the player horiztonally.
// Note that the camera should be turned off before setting the static images and the
// score display, and turned on afterwards. This allows p5.play to get set their
// positions relative to the camera once the camera has turned back on.
function updateDisplay() {
  // clear the screen
  background(0, 0, 0);

  // briefly turn camera off before setting any static images or text
  camera.off()

  // set the background image
  image(backgroundImage, 0, 0);

  // update score HUD
  textSize(32);
  fill(255);
  text("Score: " + score, 30, 50);

  // turn camera back on
  camera.on();
  camera.position.x = player.position.x;

  for(var i = 0; i < collectables.length; i++) {
    collectables[i].rotation += 5;
  }
}

// Called when the player has won the game (e.g., reached the goal at the end).
// Anything can happen here, but the most important thing is that we call resetGame()
// after a short delay.
function executeWin() {
  noLoop();
  setTimeout(resetGame, 1000);

}

// Called when the player has lost the game (e.g., fallen off a cliff or touched
// a monster). Anything can happen here, but the most important thing is that we
// call resetGame() after a short delay.
function executeLoss() {
noLoop();
setTimeout(resetGame, 1000);
}
