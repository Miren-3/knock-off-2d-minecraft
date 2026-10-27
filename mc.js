//im lowkey too lazy and also this is too small of a project to make comments for

const blockXY = 40;
const main = document.querySelector('main');
const game = main.getBoundingClientRect();
let globalColors = 200;
let run = false;
let before = Math.round(Math.random() * 9);
let timeout = false;
let lastJump = null;

function init() {
    if (run) return;
    run = true;
    createBlocks();
}

function random(mult, round) {
    let min = 3;
    let randomNumber = Math.round(Math.random() * mult);

    if (randomNumber > before) randomNumber = before + 1;
    else if (randomNumber < before) randomNumber = before - 1;
    if (randomNumber <= min) randomNumber = 3;

    before = randomNumber;
    return randomNumber;
}

function randomColor(index) {
    let rgb = globalColors;
    globalColors -= 15;
    if (index === 0) globalColors = 200;
    return `rgb(${rgb},${rgb},${rgb})`;
}

function createBlocks() {
    let maxX = 1480 / blockXY;
    let maxY = 740 / blockXY;
    let height = 0;
    let first = true;
    let xid = 0;
    let yid = 0;

    for (let i = 0; i < Math.floor(maxX); i++) {
        for (let j = random(maxY - 3, true); j >= 0; j--) {
            const block = document.createElement('div');
            block.style = `width: ${blockXY}px; height: ${blockXY}px; position: absolute; left: ${game.left + 1 + blockXY * i}px; bottom: ${window.innerHeight - game.bottom + blockXY * j}px; background-color: ${randomColor(j)}`;
            block.classList.add("block");
            block.setAttribute('xid', xid);
            block.setAttribute('yid', yid);
            block.setAttribute('brokenLVL', 0);
            block.setAttribute('maxLVL', 5);
            document.querySelector('main').appendChild(block);

            if (i === 18 && first) { height = j; first = false; height++; }

            yid++;
        }

        yid = 0;
        xid++;
    }

    createCharacter(height);
}

function createCharacter(h) {

    function findTop(x, y, h) {
        let realH = (740 / blockXY) - h;
        let moveY = 0;

        moveY += (blockXY * --realH);
        return moveY;
    }

    const player = document.createElement('p');
    player.id = "player";
    player.setAttribute('readonly', '');
    player.textContent = "웃";
    player.setAttribute('xPos', 18);

    const x = game.left + game.width / 2 - 16;
    const y = game.top + 2;
    let move = findTop(x, y, h);
    player.style = `margin: 0; padding:0; min-height: 30px; font-size: 30px; width: auto; height: auto; z-index: 2; position: absolute; left: ${x}px; top: ${y + move}px`;

    document.querySelector('main').appendChild(player);

    document.querySelectorAll(".block").forEach(i => i.addEventListener("click", () => breakBlock(i)));
}

function move(dir) {
    const player = document.getElementById("player");
    if (!player) return;

    const currentX = Number(player.getAttribute("xPos"));
    const nextX = currentX + (dir === "left" ? -1 : 1);
    const blocks = [...document.querySelectorAll(`.block[xid="${nextX}"]`)];

    if (!blocks.length) {
        console.error("No blocks in column", nextX);
        return;
    }

    // Find the topmost block in the target column
    const sortedBlocks = blocks.map(block => ({ block, rect: block.getBoundingClientRect() }))
        .sort((a, b) => a.rect.top - b.rect.top);

    const target = sortedBlocks[0];

    // Update vertical position relative to the main container, placing feet on the block
    const parentRect = document.querySelector('main').getBoundingClientRect();
    const newPlayerTop = target.rect.top - parentRect.top;

    //prevents 2 block jumps
    if (lastJump && (lastJump - newPlayerTop >= 2 * blockXY)) return;

    lastJump = newPlayerTop;

    //the + 2 * blockXY comes from the fact that gemini rewrote this code to work,
    //but the player is always 2 blocks higher, so i made it go lower each time
    //and the 10 because the player was a bit in the blocks
    //(too lazy te read the code and figure out a fix)
    player.style.top = `${newPlayerTop - player.getBoundingClientRect().height + 2 * blockXY - 8}px`;

    // Update horizontal position.
    const left = parseFloat(player.style.left);
    player.style.left = `${left + (dir === "left" ? -blockXY : blockXY)}px`;


    player.setAttribute("xPos", nextX);
}

function breakBlock(block) {
    let currentBrokenLVL = Number(block.getAttribute('brokenLVL'));
    if (!block) return;

    const player = document.getElementById("player");
    const playerPos = player.getBoundingClientRect();
    const blockPos = block.getBoundingClientRect();
    const mult = 15;

    //PYTHAGORAS!!!!!
    if (!(currentBrokenLVL >= Number(block.getAttribute('maxLVL')))) {
        if (Math.sqrt(((playerPos.x + playerPos.width / 2) - (blockPos.x + blockPos.width / 2)) ** 2 + ((playerPos.y - playerPos.height / 2) - (blockPos.y - blockPos.height / 2)) ** 2) <= blockXY * 2) {
            const newColors = [];

            //wowowow very complicated ik ik
            let currentColors = block.style.backgroundColor.split("(")[1].replace(")", "").replaceAll(" ", "").split(",");
            currentColors = currentColors.map(el => parseInt(el));
            newColors.push(currentColors[0] += mult);
            newColors.push(currentColors[1] -= mult);
            newColors.push(currentColors[2] -= mult);

            const newBGColor = `rgb(${newColors[0]},${newColors[1]},${newColors[2]})`;

            block.style.backgroundColor = newBGColor;
            block.setAttribute('brokenLVL', ++currentBrokenLVL);
        } else console.info('too far');
    } else {
        block.remove();

        if (Math.abs(playerPos.x - blockPos.x) <= 10) {
            const tempTop = Number(player.style.top.replace("px", ""));
            player.style.top = tempTop + blockXY + "px";
        }
    }
}

function dragItem(place) {

}

function placeBlock(pos) {
    if (!run) return;

    const player = document.getElementById("player");
    const playerPos = player.getBoundingClientRect();
    const x = pos.x;
    const y = pos.y;

    //Snap to the block grid
    const gridX = Math.floor(x / blockXY);
    const gridY = Math.floor(y / blockXY);

    //Don't place blocks outside main
    if (x < game.x || y < game.y || x > game.width || y > game.height || (Math.abs(playerPos.x - x) < blockXY)) return;

    //Don't place a block where one already exists
    if (document.querySelector(`.block[xid="${gridX}"][yid="${gridY}"]`)) return;

    const left = gridX * blockXY - 0.5;
    const top = gridY * blockXY + 16.5;

    const block = document.createElement('div');
    block.style = `width: ${blockXY}px; height: ${blockXY}px; position: absolute; left: ${left}px; top: ${top}px; background-color: rgb(50,255,50)`;
    block.classList.add("block");
    block.setAttribute('xid', gridX);
    //block.setAttribute('yid', gridY);
    block.setAttribute('brokenLVL', 0);
    block.setAttribute('maxLVL', 5);

    main.appendChild(block);
    block.addEventListener("click", () => breakBlock(block));
}

document.querySelector('button').onclick = () => init();
window.addEventListener('resize', () => location.reload());
window.addEventListener('keydown', e => {
    if (!run || timeout) return;

    timeout = true;
    setTimeout(() => timeout = false, 170);

    switch (e.key.toLowerCase()) {
        case "ArrowLeft":
        case "q":
        case "a":
            move('left');
            return;
        case "ArrowRight":
        case "d":
            move('right');
            return;
        case "ArrowUp":
            move('up');
            return;
        case "ArrowDown":
            move('down');
            return;
        default:
            console.info('bruh');
    }
});
document.querySelectorAll("li").forEach(el => el.addEventListener("click", dragItem(el)));
document.addEventListener("mousedown", e => {
    if (e.button === 0) {
        //Left mouse click

    } else if (e.button === 2) {
        //Right mouse click
        placeBlock(e);
    }

    e.preventDefault();
})
