const canvas = document.getElementById("spaceCanvas");
const ctx = canvas.getContext("2d");

// resize canvas na celou obrazovku
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// render loop
function draw() {
  // vyčistit plochu
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // střed (Slunce)
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  ctx.fillStyle = "yellow";
  ctx.beginPath();
  ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
  ctx.fill();

  requestAnimationFrame(draw);
}

draw();