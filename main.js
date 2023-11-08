// Initialize the canvas
let gameOver = false;
let score = 0;
const reLoadDelay = 400; // reloading of player weapon delay (between each shot)
let lastShotTime = 0; // Initialize the last shot time
const backgroundScrollSpeed = 1; // Adjust the scrolling speed as needed
let backgroundOffsetY = 0;
const explosionDelay = 350; // in ms

// alien speeds:
const maxSpeed = 3.5;
const minSpeed = 0.5;

const pixelFont = new FontFace('PixelFont', 'url(./PressStart2P-vaV7.ttf)');
pixelFont.load().then((font) => {
  document.fonts.add(font);
});

const backgroundImage = new Image();
backgroundImage.src = './starbg.png';

const playerImage = new Image();
playerImage.src = './Spaceship_Asset.png';
const playerFrames = [
  { x: 64, y: 0, width: 64, height: 64 },
  { x: 128, y: 0, width: 64, height: 64 },
];
let currentPlayerFrameIndex = 0;

const alienImage = new Image();
alienImage.src = './SpaceWarfareSheet.png';
const alienFrames = [
  { x: 64, y: 31, width: 32, height: 31 }, // primary alien (0)
  { x: 30, y: 0, width: 32, height: 31 },
];

const explosionSpritesheet = new Image();
explosionSpritesheet.src = './SpaceWarfareSheet.png';
const explosion = {
  x: 0,
  y: 0,
  currentFrame: 0,
  active: false,
};
const explosionFrames = [
  { x:  0, y: 93, width: 32, height: 31 },
  { x: 32, y: 93, width: 32, height: 31 },
  { x: 64, y: 93, width: 32, height: 31 },
];


const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Define player's spaceship
const player = {
  x: canvas.width / 2,
  y: canvas.height - 70,
  width: 64,
  height: 64,
  speed: 5,
  thrusterDelay: 100, // in ms
  destroyed: false,
};

const bullets = [];
const enemies = [];

//
// update the player's score (on screen)
//
function updateScore() {
  ctx.fillStyle = "white";
  ctx.font = "20px PixelFont";
  ctx.fillText("Score: " + score, 10, 30);
}


//
// check for collisions between player and aliens
//
function checkPlayerAlienCollision() {
  const collisionYModifier = 30; // higher is alien more "in" to player sprite / deeper collision
  const collisionXModifier = 0; // higher is alien more "in" to player sprite / deeper collision
  for (let i = 0; i < enemies.length; i++) {
    if (
      player.x < enemies[i].x + (enemies[i].width - collisionXModifier) &&
      player.x + player.width > enemies[i].x &&
      player.y < enemies[i].y + (enemies[i].height - collisionYModifier) &&
      player.y + player.height > enemies[i].y
    ) {
      explosion.x = player.x;
      explosion.y = player.y;
      explosion.active = true;

      player.destroyed = true;
      gameOver = true;
      //checkGameOverStatus();
      return;
    }
  }
}

//
// can the player shoot?  check for weapon problems
//
function canPlayerShoot() {
  const currentTime = Date.now();
  return canShoot || currentTime - lastShotTime >= shotCooldown;
}

//
// background image assembly
//
function scrollBackground() {
  backgroundOffsetY += backgroundScrollSpeed;

  // If the offset reaches the height of the background image, reset it
  if (backgroundOffsetY >= backgroundImage.height) {
    backgroundOffsetY = 0;
  }
}
function drawBackground() {
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const pattern = ctx.createPattern(backgroundImage, 'repeat');
  ctx.fillStyle = pattern;
  ctx.translate(0, backgroundOffsetY);
  ctx.fillRect(0, -backgroundOffsetY, canvas.width, canvas.height);
  ctx.translate(0, -backgroundOffsetY);
  //ctx.fillRect(0, 0, canvas.width, canvas.height);
}

//
// clear Canvas when required
//
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

//
// restartGame 
//
function restartGame() {
  score = 0;
  gameOver = false;
  enemies.length = 0;
  bullets.length = 0;
  let backgroundOffsetY = 0;
  player.destroyed = false;
  clearCanvas();
  gameLoop();
}

//
// check for GameOver status (& display final message)
//
function checkGameOverStatus() {
  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px PixelFont";
    const gameOverMan = "Game Over";
    let textWidth = ctx.measureText(gameOverMan).width;
    ctx.fillText(gameOverMan, (canvas.width - textWidth) / 2, canvas.height / 2);

    ctx.fillStyle = "orange";
    ctx.font = "24px PixelFont";
    const restart = "ENTER to try again";
    textWidth = ctx.measureText(restart).width;
    ctx.fillText(restart, (canvas.width - textWidth) / 2, (canvas.height / 2) + 50);

    // save score to localstorage
    if (score > parseInt(localStorage.getItem('highScore')) || !localStorage.getItem('highScore')) {
      localStorage.setItem('highScore', score);
    }

    // TODO - Display final score & restart button
    return true; // true is gameOver
  }
}

//
// animate any explosions
//
function animateExplosion() {
  if (explosion.active) {
    const frame = explosionFrames[explosion.currentFrame];
    ctx.drawImage(
      explosionSpritesheet,
      frame.x, frame.y, frame.width, frame.height,
      explosion.x, explosion.y, frame.width, frame.height
    );

    explosion.currentFrame++;

    // Check if the animation is complete
    if (explosion.currentFrame >= explosionFrames.length) {
      explosion.active = false;
      explosion.currentFrame = 0;
    } else {
      setTimeout(animateExplosion, explosionDelay);
    }
  }
}


//
// Primary Game loop
//
// TODO remove any code so we just have function calls
function gameLoop() {
  if (checkGameOverStatus()) return; // true is gameover
  clearCanvas();
  
  scrollBackground();
  drawBackground();

  // Move the player
  if (rightKey && player.x < canvas.width - player.width) {
    player.x += player.speed;
  }
  if (leftKey && player.x > 0) {
    player.x -= player.speed;
  }

  // Draw the player
  // ctx.fillStyle = "white";
  // ctx.fillRect(player.x, player.y, player.width, player.height);
  const playerFrame = playerFrames[currentPlayerFrameIndex];

  if(!player.destroyed) {
    ctx.drawImage(playerImage, playerFrame.x, playerFrame.y, playerFrame.width, playerFrame.height, player.x, player.y, player.width, player.height);
  }

  // animate thruster
  setTimeout(() => {
    currentPlayerFrameIndex ++;
    if(currentPlayerFrameIndex > 1) {
      currentPlayerFrameIndex = 0;
    }
  }, player.thrusterDelay);

  

  // Move and draw bullets
  for (let i = 0; i < bullets.length; i++) {
    bullets[i].y -= 5;
    ctx.fillStyle = "yellow";
    ctx.fillRect(bullets[i].x, bullets[i].y, 3, 10);

    // Remove bullets when they go off-screen
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
      i--;
    }
  }

  // Create new enemies at random intervals
  if (Math.random() < 0.02) {
    const enemy = {
      x: Math.random() * (canvas.width - 30),
      y: 0,
      width: 30,
      height: 30,
      speed: Math.random() * (maxSpeed - minSpeed) + minSpeed,
    };
    enemies.push(enemy);
  }

  // Move and draw enemies
  let currentAlienFrameIndex = 0;
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].y += enemies[i].speed;
    
    const alienFrame = alienFrames[currentAlienFrameIndex];
    ctx.drawImage(alienImage, alienFrame.x, alienFrame.y, alienFrame.width, alienFrame.height, enemies[i].x, enemies[i].y, enemies[i].width, enemies[i].height);

    // Remove enemies if they reach the bottom
    if (enemies[i].y > canvas.height) {
      enemies.splice(i, 1);
      i--;
    }
  }

  // Detect collisions between bullets and enemies
  for (let i = 0; i < bullets.length; i++) {
    for (let j = 0; j < enemies.length; j++) {
      if (
        bullets[i] &&
        enemies[j] &&
        bullets[i].x < enemies[j].x + enemies[j].width &&
        bullets[i].x + 3 > enemies[j].x &&
        bullets[i].y < enemies[j].y + enemies[j].height &&
        bullets[i].y + 10 > enemies[j].y
      ) {
        explosion.x = enemies[j].x;
        explosion.y = enemies[j].y;
        explosion.active = true;

        bullets.splice(i, 1);
        enemies.splice(j, 1);
        i--;
        j--;
        score +=1;
      }
    }
  }
  
  
  // Check if an enemy gets past the player
  for (let i = 0; i < enemies.length; i++) {
    if (enemies[i].y + enemies[i].height > canvas.height) {
      // An enemy passed the player
      enemies.splice(i, 1);
      i--;
      score -= 1; // Decrease the score by 1
    }
  }
  
  checkPlayerAlienCollision();
  updateScore();
  animateExplosion();
  
  requestAnimationFrame(gameLoop);
} 
// end of gameLoop



// Keyboard input handling
let rightKey = false;
let leftKey = false;

window.addEventListener("keydown", function (event) {
  if (event.key === "ArrowRight") rightKey = true;
  if (event.key === "ArrowLeft") leftKey = true;
  if (event.key === " " && Date.now() - lastShotTime >= reLoadDelay) {
    // Spacebar to fire bullets
    bullets.push({ x: player.x + player.width / 2 - 2, y: player.y });
    lastShotTime = Date.now();
  }
  if (event.key === 'Enter') {
    restartGame();
  }
});

window.addEventListener("keyup", function (event) {
  if (event.key === "ArrowRight") rightKey = false;
  if (event.key === "ArrowLeft") leftKey = false;
});

// Start the game loop
gameLoop();