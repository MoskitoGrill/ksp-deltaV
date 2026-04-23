const canvas = document.getElementById("spaceCanvas");
const ctx = canvas.getContext("2d");

let selectedPlanet = null;

const baseDvMap = {
  Moho: 7600,
  Eve: 1800,
  Kerbin: 0,
  Duna: 1300,
  Dres: 2200,
  Jool: 2700,
  Eeloo: 3400
};

const planets = [
  {
    name: "Moho",
    orbitRadius: 60,
    realSemiMajorAxis: 5263138304,
    orbitalPeriod: 2215754,
    color: "gray",
    angle: 0.5
  },
  {
    name: "Eve",
    orbitRadius: 100,
    realSemiMajorAxis: 9832684544,
    orbitalPeriod: 5657995,
    color: "purple",
    angle: 2.5
  },
  {
    name: "Kerbin",
    orbitRadius: 140,
    realSemiMajorAxis: 13599840256,
    orbitalPeriod: 9203545,
    color: "blue",
    angle: 0
  },
  {
    name: "Duna",
    orbitRadius: 180,
    realSemiMajorAxis: 20726155264,
    orbitalPeriod: 17315400,
    color: "orange",
    angle: -0.75
  },
  {
    name: "Dres",
    orbitRadius: 220,
    realSemiMajorAxis: 40839348203,
    orbitalPeriod: 47893063,
    color: "sandybrown",
    angle: 1.8
  },
  {
    name: "Jool",
    orbitRadius: 260,
    realSemiMajorAxis: 68773560320,
    orbitalPeriod: 104661432,
    color: "green",
    angle: 1.2
  },
  {
    name: "Eeloo",
    orbitRadius: 320,
    realSemiMajorAxis: 90118820000,
    orbitalPeriod: 156992048,
    color: "white",
    angle: 2.8
  }
];

// resize canvas na celou obrazovku
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();

  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  planets.forEach(planet => {
    const pos = getPlanetPosition(planet, centerX, centerY);

    const dx = mouseX - pos.x;
    const dy = mouseY - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 8) { // klik radius
      selectedPlanet = planet;
      console.log("Vybraná planeta:", planet.name);
    }
  });
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function getPlanetPosition(planet, centerX, centerY) {
  const x = centerX + planet.orbitRadius * Math.cos(planet.angle);
  const y = centerY + planet.orbitRadius * Math.sin(planet.angle);
  return { x, y };
}

function getBaseDvToPlanet(planet) {
  if (!planet) return null;
  return baseDvMap[planet.name] ?? null;
}

// render loop
function draw() {
  // vyčistit plochu
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // střed (Slunce)
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // ☀️ Slunce
  ctx.fillStyle = "yellow";
  ctx.beginPath();
  ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
  ctx.fill();

  // 🟢 ORBITY
  planets.forEach(planet => {
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.arc(centerX, centerY, planet.orbitRadius, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 🔵 PLANETY
  planets.forEach(planet => {
    const pos = getPlanetPosition(planet, centerX, centerY);

    // planeta
    ctx.fillStyle = planet.color;
    ctx.beginPath();
    
    const isSelected = selectedPlanet === planet;

    // větší radius pokud je vybraná
    const radius = isSelected ? 8 : 5;

    // glow efekt
    if (isSelected) {
    ctx.shadowColor = "white";
    ctx.shadowBlur = 10;
    }

    ctx.fillStyle = planet.color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // reset shadow
    ctx.shadowBlur = 0;

    ctx.fill();

    // název
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(planet.name, pos.x + 8, pos.y + 4);
  });

    // informační panel
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.textAlign = "left";

  ctx.fillText("Origin: Kerbin", 20, 30);

  if (selectedPlanet) {
    const dv = getBaseDvToPlanet(selectedPlanet);

    ctx.fillText(`Target: ${selectedPlanet.name}`, 20, 55);

    if (dv !== null) {
      ctx.fillText(`Δv: ${dv} m/s`, 20, 80);
    } else {
      ctx.fillText("Δv: není k dispozici", 20, 80);
    }
  } else {
    ctx.fillText("Target: žádný", 20, 55);
    ctx.fillText("Δv: -", 20, 80);
  }

  requestAnimationFrame(draw);
}

draw();