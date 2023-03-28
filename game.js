const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = {
    x: 50,
    y: 0,
    width: 30,
    height: 30,
    speed: 5,
    bullets: [],
    shootCooldown: 0
};

const enemies = [];
const terrain = [];

let gameOver = false;
let spawnEnemyCooldown = 0;
let terrainOffset = 0; // Add a new variable to control terrain shift
const keyState = {};

onkeydown = onkeyup = function (e) {
    keyState[e.key] = e.type === 'keydown';
}

// Function to generate a new terrain value within the slope constraints
function generateNewTerrainValue(lastValue) {
    const maxSlope = Math.tan(Math.PI / 3); // Maximum slope based on 60 degrees
    const minChange = -10 * maxSlope;
    const maxChange = 10 * maxSlope;

    let change = Math.floor(Math.random() * (maxChange - minChange + 1)) + minChange;
    let newValue = lastValue + change;

    // Ensure the new terrain value is within the allowable range
    newValue = Math.min(Math.max(newValue, canvas.height * 0.1), canvas.height * 0.7);

    return newValue;
}

// Pre-generate the terrain
terrain.push(canvas.height * 0.4); // Start with a reasonable height
for (let i = 1; i < canvas.width / 10 + 1; i++) {
    terrain.push(generateNewTerrainValue(terrain[i - 1]));
}

function gameLoop() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameOver) {
        location.reload();
    }

    handleInput();
    updateTerrain();
    updatePlayer();
    updateEnemies();
    updateBullets();
    detectCollisions();

    spawnEnemyCooldown--;

    requestAnimationFrame(gameLoop);
}

function handleInput() {
    if (keyState['ArrowUp']) player.y -= player.speed;
    if (keyState['ArrowDown']) player.y += player.speed;
    if (keyState['ArrowLeft']) player.x -= player.speed;
    if (keyState['ArrowRight']) player.x += player.speed;
    if (keyState[' ']) shoot();
}

function updateTerrain() {
    // Decrement terrainOffset by 1 pixel each frame
    terrainOffset--;

    // Generate a new terrain value and reset terrainOffset when it reaches -10
    if (terrainOffset <= -10) {
        const newTerrainValue = generateNewTerrainValue(terrain[terrain.length - 1]);
        terrain.push(newTerrainValue);
        terrain.shift();
        terrainOffset = 0;
    }

    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let i = 0; i < terrain.length; i++) {
        ctx.lineTo(i * 10 + terrainOffset, canvas.height - terrain[i]);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fillStyle = 'green';
    ctx.fill();
}

function updatePlayer() {
    player.x = Math.max(player.x, 0);
    player.y = Math.max(player.y, 0);
    player.x = Math.min(player.x, canvas.width - player.width);
    player.y = Math.min(player.y, canvas.height - player.height);

    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    player.shootCooldown--;
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.x -= enemy.speed;

        // Make enemies zig-zag towards the player
        const zigzagSpeed = 2;
        if (enemy.y < player.y) {
            enemy.y += zigzagSpeed;
        } else {
            enemy.y -= zigzagSpeed;
        }

        // Draw enemy
        ctx.fillStyle = 'red';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Remove enemy if it moves past the left side of the screen
        if (enemy.x + enemy.width < 0) {
            enemies.splice(i, 1);
        }
    }

    // Spawn new enemy every 60 frames
    if (spawnEnemyCooldown <= 0) {
        const newEnemy = {
            x: canvas.width,
            y: Math.random() * (canvas.height - 30),
            width: 30,
            height: 30,
            speed: 2 + Math.random() * 3
        };
        enemies.push(newEnemy);
        spawnEnemyCooldown = 60;
    }
}

function updateBullets() {
    for (let i = 0; i < player.bullets.length; i++) {
        const bullet = player.bullets[i];
        bullet.x += bullet.speed;

        ctx.fillStyle = 'yellow';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        if (bullet.x > canvas.width) {
            player.bullets.splice(i, 1);
            i--;
        }
    }
}

function shoot() {
    if (player.shootCooldown > 0) return;

    player.bullets.push({
        x: player.x + player.width,
        y: player.y + player.height / 2,
        width: 10,
        height: 5,
        speed: 8
    });

    player.shootCooldown = 10;
}

function detectCollisions() {
    for (let i = 0; i < terrain.length; i++) {
        if (player.x < (i + 1) * 10 && player.x + player.width > i * 10 && canvas.height - terrain[i] < player.y + player.height) {
            gameOver = true;
        }
    }

    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];

        if (collides(player, enemy)) {
            gameOver = true;
        }

        for (let j = 0; j < player.bullets.length; j++) {
            const bullet = player.bullets[j];

            if (collides(bullet, enemy)) {
                enemies.splice(i, 1);
                i--;
                player.bullets.splice(j, 1);
                j--;
                break;
            }
        }
    }
}

function collides(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

gameLoop();