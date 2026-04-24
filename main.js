const canvas = document.getElementById("spaceCanvas");
const ctx = canvas.getContext("2d");

let selectedPlanet = null;
let marginPercent = 40;
let time = 0;

const KSP_SECONDS_PER_MINUTE = 60;
const KSP_MINUTES_PER_HOUR = 60;
const KSP_HOURS_PER_DAY = 6;
const KSP_DAYS_PER_YEAR = 426;

const KSP_SECONDS_PER_HOUR = KSP_SECONDS_PER_MINUTE * KSP_MINUTES_PER_HOUR;
const KSP_SECONDS_PER_DAY = KSP_SECONDS_PER_HOUR * KSP_HOURS_PER_DAY;
const KSP_SECONDS_PER_YEAR = KSP_SECONDS_PER_DAY * KSP_DAYS_PER_YEAR;

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
    baseAngle: 0.5,
    manualAngle: null
  },
  {
    name: "Eve",
    orbitRadius: 100,
    realSemiMajorAxis: 9832684544,
    orbitalPeriod: 5657995,
    color: "purple",
    baseAngle: 2.5,
    manualAngle: null
  },
  {
    name: "Kerbin",
    orbitRadius: 140,
    realSemiMajorAxis: 13599840256,
    orbitalPeriod: 9203545,
    color: "blue",
    baseAngle: 0,
    manualAngle: null
  },
  {
    name: "Duna",
    orbitRadius: 180,
    realSemiMajorAxis: 20726155264,
    orbitalPeriod: 17315400,
    color: "orange",
    baseAngle: -0.75,
    manualAngle: null
  },
  {
    name: "Dres",
    orbitRadius: 220,
    realSemiMajorAxis: 40839348203,
    orbitalPeriod: 47893063,
    color: "sandybrown",
    baseAngle: 1.8,
    manualAngle: null
  },
  {
    name: "Jool",
    orbitRadius: 260,
    realSemiMajorAxis: 68773560320,
    orbitalPeriod: 104661432,
    color: "green",
    baseAngle: 1.2,
    manualAngle: null
  },
  {
    name: "Eeloo",
    orbitRadius: 320,
    realSemiMajorAxis: 90118820000,
    orbitalPeriod: 156992048,
    color: "white",
    baseAngle: 2.8,
    manualAngle: null
  }
];

const marginInput = document.getElementById("marginInput");

marginInput.addEventListener("input", () => {
  const value = Number(marginInput.value);

  if (Number.isFinite(value) && value >= 0) {
    marginPercent = value;
  }
});

const yearInput = document.getElementById("yearInput");
const dayInput = document.getElementById("dayInput");
const hourInput = document.getElementById("hourInput");
const minuteInput = document.getElementById("minuteInput");
const timeBackButton = document.getElementById("timeBackButton");
const timeForwardButton = document.getElementById("timeForwardButton");
const timeLabel = document.getElementById("timeLabel");

let timeHoldInterval = null;
let timeHoldTimeout = null;
let timeHoldSpeed = 1;

function kspDateToSeconds(year, day, hour, minute) {
  const safeYear = Math.max(1, Number(year) || 1);
  const safeDay = Math.min(KSP_DAYS_PER_YEAR, Math.max(1, Number(day) || 1));
  const safeHour = Math.min(KSP_HOURS_PER_DAY - 1, Math.max(0, Number(hour) || 0));
  const safeMinute = Math.min(59, Math.max(0, Number(minute) || 0));

  return (
    (safeYear - 1) * KSP_SECONDS_PER_YEAR +
    (safeDay - 1) * KSP_SECONDS_PER_DAY +
    safeHour * KSP_SECONDS_PER_HOUR +
    safeMinute * KSP_SECONDS_PER_MINUTE
  );
}

function secondsToKspParts(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));

  const year = Math.floor(safeSeconds / KSP_SECONDS_PER_YEAR) + 1;

  const secondsIntoYear = safeSeconds % KSP_SECONDS_PER_YEAR;
  const day = Math.floor(secondsIntoYear / KSP_SECONDS_PER_DAY) + 1;

  const secondsIntoDay = secondsIntoYear % KSP_SECONDS_PER_DAY;
  const hour = Math.floor(secondsIntoDay / KSP_SECONDS_PER_HOUR);

  const secondsIntoHour = secondsIntoDay % KSP_SECONDS_PER_HOUR;
  const minute = Math.floor(secondsIntoHour / KSP_SECONDS_PER_MINUTE);

  return { year, day, hour, minute };
}

function updateTimeUiFromTime() {
  const parts = secondsToKspParts(time);

  yearInput.value = parts.year;
  dayInput.value = parts.day;
  hourInput.value = parts.hour;
  minuteInput.value = parts.minute;

  timeLabel.textContent = formatKspTime(time);
}

function updateTimeFromInputs() {
  clearManualAngles();

  time = kspDateToSeconds(
    yearInput.value,
    dayInput.value,
    hourInput.value,
    minuteInput.value
  );

  updateTimeUiFromTime();
}

function changeTimeByMinutes(minutes) {
  clearManualAngles();

  time = Math.max(0, time + minutes * KSP_SECONDS_PER_MINUTE);
  updateTimeUiFromTime();
}

[yearInput, dayInput, hourInput, minuteInput].forEach(input => {
  input.addEventListener("change", updateTimeFromInputs);
});

function startTimeHold(direction) {
  changeTimeByMinutes(direction * 10);

  timeHoldSpeed = 10;

  timeHoldTimeout = setTimeout(() => {
    timeHoldInterval = setInterval(() => {
      changeTimeByMinutes(direction * timeHoldSpeed);

      if (timeHoldSpeed < 1440) {
        timeHoldSpeed *= 2;
      }
    }, 120);
  }, 350);
}

function stopTimeHold() {
  clearTimeout(timeHoldTimeout);
  clearInterval(timeHoldInterval);

  timeHoldTimeout = null;
  timeHoldInterval = null;
  timeHoldSpeed = 1;
}

timeBackButton.addEventListener("mousedown", () => startTimeHold(-1));
timeForwardButton.addEventListener("mousedown", () => startTimeHold(1));

window.addEventListener("mouseup", stopTimeHold);
window.addEventListener("mouseleave", stopTimeHold);

timeBackButton.addEventListener("touchstart", (event) => {
  event.preventDefault();
  startTimeHold(-1);
});

timeForwardButton.addEventListener("touchstart", (event) => {
  event.preventDefault();
  startTimeHold(1);
});

window.addEventListener("touchend", stopTimeHold);
window.addEventListener("touchcancel", stopTimeHold);

updateTimeUiFromTime();

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

function clearManualAngles() {
  planets.forEach(planet => {
    planet.manualAngle = null;
  });
}

function formatKspTime(totalSeconds) {
  const parts = secondsToKspParts(totalSeconds);
  return `Year ${parts.year}, Day ${parts.day}, ${parts.hour}h ${parts.minute}m`;
}

function getPlanetAngle(planet, time) {
  const kerbin = planets.find(p => p.name === "Kerbin");

    if (planet.manualAngle !== null && planet.manualAngle !== undefined) {
      return planet.manualAngle;
    }
    
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

  ctx.fillText(`Time: ${formatKspTime(time)}`, 20, 155);
  
  const manualCount = planets.filter(planet => planet.manualAngle !== null).length;
  ctx.fillText(`Manual overrides: ${manualCount}`, 20, 180);

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