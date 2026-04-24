const canvas = document.getElementById("spaceCanvas");
const ctx = canvas.getContext("2d");

let selectedPlanet = null;
let marginPercent = 40;
let time = 0;

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
    baseAngle: 0.5
  },
  {
    name: "Eve",
    orbitRadius: 100,
    realSemiMajorAxis: 9832684544,
    orbitalPeriod: 5657995,
    color: "purple",
    baseAngle: 2.5
  },
  {
    name: "Kerbin",
    orbitRadius: 140,
    realSemiMajorAxis: 13599840256,
    orbitalPeriod: 9203545,
    color: "blue",
    baseAngle: 0
  },
  {
    name: "Duna",
    orbitRadius: 180,
    realSemiMajorAxis: 20726155264,
    orbitalPeriod: 17315400,
    color: "orange",
    baseAngle: -0.75
  },
  {
    name: "Dres",
    orbitRadius: 220,
    realSemiMajorAxis: 40839348203,
    orbitalPeriod: 47893063,
    color: "sandybrown",
    baseAngle: 1.8
  },
  {
    name: "Jool",
    orbitRadius: 260,
    realSemiMajorAxis: 68773560320,
    orbitalPeriod: 104661432,
    color: "green",
    baseAngle: 1.2
  },
  {
    name: "Eeloo",
    orbitRadius: 320,
    realSemiMajorAxis: 90118820000,
    orbitalPeriod: 156992048,
    color: "white",
    baseAngle: 2.8
  }
];

const marginInput = document.getElementById("marginInput");

marginInput.addEventListener("input", () => {
  const value = Number(marginInput.value);

  if (Number.isFinite(value) && value >= 0) {
    marginPercent = value;
  }
});

const timeInput = document.getElementById("timeInput");
const timeLabel = document.getElementById("timeLabel");

timeInput.addEventListener("input", () => {
  time = Number(timeInput.value);
  timeLabel.textContent = `${time.toLocaleString()} s`;
});

timeLabel.textContent = `${time.toLocaleString()} s`;

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
  const angle = getPlanetAngle(planet, time);
  const x = centerX + planet.orbitRadius * Math.cos(angle);
  const y = centerY + planet.orbitRadius * Math.sin(angle);
  return { x, y };
}

function getBaseDvToPlanet(planet) {
  if (!planet) return null;
  return baseDvMap[planet.name] ?? null;
}

function applyMargin(baseDv, marginPercent) {
  if (baseDv === null || baseDv === undefined) return null;
  return Math.round(baseDv * (1 + marginPercent / 100));
}

function normalizeAngle(angle) {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}

function getPlanetAngle(planet, time) {
  const kerbin = planets.find(p => p.name === "Kerbin");

  if (!planet.orbitalPeriod || !kerbin?.orbitalPeriod) {
    return planet.baseAngle ?? 0;
  }

  if (planet.name === "Kerbin") {
    return 0;
  }

  const planetProgress = (time / planet.orbitalPeriod) * Math.PI * 2;
  const kerbinProgress = (time / kerbin.orbitalPeriod) * Math.PI * 2;

  return normalizeAngle((planet.baseAngle ?? 0) + planetProgress - kerbinProgress);
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

  ctx.fillText(`Time: ${time.toLocaleString()} s`, 20, 155);
  
  if (selectedPlanet) {
    const baseDv = getBaseDvToPlanet(selectedPlanet);
    const finalDv = applyMargin(baseDv, marginPercent);

    ctx.fillText(`Target: ${selectedPlanet.name}`, 20, 55);

    if (baseDv !== null) {
      ctx.fillText(`Base Δv: ${baseDv} m/s`, 20, 80);
      ctx.fillText(`Margin: ${marginPercent}%`, 20, 105);
      ctx.fillText(`Total Δv: ${finalDv} m/s`, 20, 130);
    } else {
      ctx.fillText("Δv: není k dispozici", 20, 80);
    }
  } else {
    ctx.fillText("Target: žádný", 20, 55);
    ctx.fillText("Base Δv: -", 20, 80);
    ctx.fillText(`Margin: ${marginPercent}%`, 20, 105);
    ctx.fillText("Total Δv: -", 20, 130);
  }

  requestAnimationFrame(draw);
}

draw();