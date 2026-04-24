const canvas = document.getElementById("spaceCanvas");
const ctx = canvas.getContext("2d");

let selectedPlanet = null;
let selectedTargetType = "planet";
let selectedOrigin = "Kerbin";
let marginPercent = 40;
let time = 0;
let draggedPlanet = null;
let isDraggingPlanet = false;
let moveWholeSystem = false;
let dragStartTime = 0;
let dragStartAngle = 0;
let lastDragAngle = 0;
let accumulatedDragDeltaAngle = 0;
let dragStartPlanetAngles = new Map();

const KSP_SECONDS_PER_MINUTE = 60;
const KSP_MINUTES_PER_HOUR = 60;
const KSP_HOURS_PER_DAY = 6;
const KSP_DAYS_PER_YEAR = 426;

const KSP_SECONDS_PER_HOUR = KSP_SECONDS_PER_MINUTE * KSP_MINUTES_PER_HOUR;
const KSP_SECONDS_PER_DAY = KSP_SECONDS_PER_HOUR * KSP_HOURS_PER_DAY;
const KSP_SECONDS_PER_YEAR = KSP_SECONDS_PER_DAY * KSP_DAYS_PER_YEAR;

const dvMatrix = {
  Moho: {
    Eve: 20188,
    Kerbin: 5768,
    Duna: 9702,
    Dres: 8918,
    Jool: 12285,
    Eeloo: 10864
  },
  Eve: {
    Moho: 20188,
    Kerbin: 14644,
    Duna: 18578,
    Dres: 17794,
    Jool: 21161,
    Eeloo: 19740
  },
  Kerbin: {
    Kerbol: 36070,
    Moho: 8350,
    Eve: 5830,
    Duna: 5110,
    Dres: 6650,
    Jool: 8310,
    Eeloo: 7600
  },
  Duna: {
    Moho: 9702,
    Eve: 18578,
    Kerbin: 4158,
    Dres: 7308,
    Jool: 10675,
    Eeloo: 9254
  },
  Dres: {
    Moho: 8918,
    Eve: 17794,
    Kerbin: 3374,
    Duna: 7308,
    Jool: 9891,
    Eeloo: 8470
  },
  Jool: {
    Moho: 12285,
    Eve: 21161,
    Kerbin: 6741,
    Duna: 10675,
    Dres: 9891,
    Eeloo: 11837
  },
  Eeloo: {
    Moho: 10864,
    Eve: 19740,
    Kerbin: 5320,
    Duna: 9254,
    Dres: 8470,
    Jool: 11837
  }
};

const baseDvMap = {
  Kerbol: 36070,
  Moho: 8350,
  Eve: 5830,
  Kerbin: 0,
  Duna: 5110,
  Dres: 6650,
  Jool: 8310,
  Eeloo: 7600
};

const transferAngleMap = {
  Moho: {
    transferAngle: 108.2,
    returnAngle: 76
  },
  Eve: {
    transferAngle: -54.1,
    returnAngle: 36.1
  },
  Duna: {
    transferAngle: 44.4,
    returnAngle: -75.2
  },
  Dres: {
    transferAngle: 82.1,
    returnAngle: 30.3
  },
  Jool: {
    transferAngle: 96.6,
    returnAngle: -48.7
  },
  Eeloo: {
    transferAngle: 101,
    returnAngle: -80
  }
};

const planets = [
  {
    name: "Moho",
    orbitRadius: 60,
    realSemiMajorAxis: 5263138304,
    orbitalPeriod: 2215754,
    color: "gray",
    baseAngle: 1.4835,
    manualAngle: null
  },
  {
    name: "Eve",
    orbitRadius: 100,
    realSemiMajorAxis: 9832684544,
    orbitalPeriod: 5657995,
    color: "purple",
    baseAngle: 0.2618,
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
    baseAngle: 2.3649,
    manualAngle: null
  },
  {
    name: "Dres",
    orbitRadius: 220,
    realSemiMajorAxis: 40839348203,
    orbitalPeriod: 47893063,
    color: "sandybrown",
    baseAngle: 0.1745,
    manualAngle: null
  },
  {
    name: "Jool",
    orbitRadius: 260,
    realSemiMajorAxis: 68773560320,
    orbitalPeriod: 104661432,
    color: "green",
    baseAngle: -2.1347,
    manualAngle: null
  },
  {
    name: "Eeloo",
    orbitRadius: 320,
    realSemiMajorAxis: 90118820000,
    orbitalPeriod: 156992048,
    color: "white",
    baseAngle: -0.8727,
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
const resetDayOneButton = document.getElementById("resetDayOneButton");
const originSelect = document.getElementById("originSelect");

originSelect.addEventListener("change", () => {
  selectedOrigin = originSelect.value;
});

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

resetDayOneButton.addEventListener("click", () => {
  clearManualAngles();
  time = 0;
  updateTimeUiFromTime();
});

const moveWholeSystemInput = document.getElementById("moveWholeSystemInput");

moveWholeSystemInput.addEventListener("change", () => {
  moveWholeSystem = moveWholeSystemInput.checked;
});

// resize canvas na celou obrazovku
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

canvas.addEventListener("mousedown", (event) => {
  if (event.button !== 0) return; // jen levé tlačítko

  const mouse = getMousePosition(event);

  if (isPointOnKerbol(mouse.x, mouse.y)) {
    selectedPlanet = null;
    selectedTargetType = "kerbol";
    console.log("Vybraný target: Kerbol");
    return;
  }

  const planet = findPlanetAtPosition(mouse.x, mouse.y);

  if (!planet) return;

  selectedTargetType = "planet";
  selectedPlanet = planet;

  // Kerbin jde vybrat jako cíl, ale zatím ho netaháme
  if (planet.name === "Kerbin") {
    console.log("Vybraný target:", planet.name);
    return;
  }

  draggedPlanet = planet;
  isDraggingPlanet = true;
  dragStartTime = time;
  dragStartAngle = getPlanetAngle(planet, time);
  lastDragAngle = dragStartAngle;
  accumulatedDragDeltaAngle = 0;

  dragStartPlanetAngles = new Map();

  planets.forEach(p => {
    dragStartPlanetAngles.set(p.name, getPlanetAngle(p, time));
  });

  console.log("Vybraná planeta:", planet.name);
});

canvas.addEventListener("mousemove", (event) => {
  if (!isDraggingPlanet || !draggedPlanet) return;

  const mouse = getMousePosition(event);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const newAngle = getAngleFromPoint(mouse.x, mouse.y, centerX, centerY);

  let deltaAngleStep = newAngle - lastDragAngle;

  if (deltaAngleStep > Math.PI) deltaAngleStep -= Math.PI * 2;
  if (deltaAngleStep < -Math.PI) deltaAngleStep += Math.PI * 2;

  if (moveWholeSystem) {
    const draggedRelativeSpeed = getRelativeAngularSpeedToKerbin(draggedPlanet);

    if (draggedRelativeSpeed !== 0) {
      accumulatedDragDeltaAngle += deltaAngleStep;

      const deltaTime = accumulatedDragDeltaAngle / draggedRelativeSpeed;

      if (!hasManualOverrides()) {
        time = Math.max(0, dragStartTime + deltaTime);
        updateTimeUiFromTime();
      } else {
        planets.forEach(planet => {
          if (planet.name === "Kerbin") return;

          const startAngle = dragStartPlanetAngles.get(planet.name);
          const planetRelativeSpeed = getRelativeAngularSpeedToKerbin(planet);

          planet.manualAngle = normalizeAngle(startAngle + planetRelativeSpeed * deltaTime);
        });
      }
    }
  } else {
    draggedPlanet.manualAngle = newAngle;
  }

  lastDragAngle = newAngle;
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();

  const mouse = getMousePosition(event);

  if (isPointOnKerbol(mouse.x, mouse.y)) {
    console.log("Kerbol cannot be set as origin.");
    return;
  }

  const planet = findPlanetAtPosition(mouse.x, mouse.y);

  if (planet) {
    setOrigin(planet.name);
    console.log("Origin =", planet.name);
  }
});

window.addEventListener("mouseup", () => {
  isDraggingPlanet = false;
  draggedPlanet = null;
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function getPlanetPosition(planet, centerX, centerY) {
  const angle = getPlanetAngle(planet, time);
  const x = centerX + planet.orbitRadius * Math.cos(angle);
  const y = centerY + planet.orbitRadius * Math.sin(angle);
  return { x, y };
}

function getMousePosition(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function getAngleFromPoint(x, y, centerX, centerY) {
  return normalizeAngle(Math.atan2(y - centerY, x - centerX));
}

function findPlanetAtPosition(x, y) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  for (const planet of planets) {
    const pos = getPlanetPosition(planet, centerX, centerY);

    const dx = x - pos.x;
    const dy = y - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 10) {
      return planet;
    }
  }

  return null;
}

function isPointOnKerbol(x, y) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const dx = x - centerX;
  const dy = y - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < 14;
}

function getBaseDvToTarget(targetName) {
  if (!targetName) return null;

  if (selectedOrigin === targetName) {
    return 0;
  }

  return dvMatrix[selectedOrigin]?.[targetName] ?? null;
}

function getBaseDvToPlanet(planet) {
  if (!planet) return null;
  return getBaseDvToTarget(planet.name);
}

function applyMargin(baseDv, marginPercent) {
  if (baseDv === null || baseDv === undefined) return null;
  return Math.round(baseDv * (1 + marginPercent / 100));
}

function normalizeAngle(angle) {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

function radToDeg(radians) {
  return radians * 180 / Math.PI;
}

function normalizeDegrees(degrees) {
  return ((degrees % 360) + 360) % 360;
}

function getCurrentPhaseAngle(targetPlanet) {
  if (!targetPlanet || selectedOrigin === "Kerbol") {
    return null;
  }

  const originPlanet = getPlanetByName(selectedOrigin);

  if (!originPlanet || originPlanet.name === targetPlanet.name) {
    return null;
  }

  const targetAngle = getPlanetAngle(targetPlanet, time);
  const originAngle = getPlanetAngle(originPlanet, time);

  const phaseRad = angleDifference(targetAngle, originAngle);
  return radToDeg(phaseRad);
}

function getCurrentDvEstimate(planet) {
  const baseDv = getBaseDvToPlanet(planet);
  const idealPhase = getIdealTransferAngle(selectedOrigin, planet?.name);

  if (baseDv === null || idealPhase === null) {
    return null;
  }

  const currentPhase = getCurrentPhaseAngle(planet);

  if (currentPhase === null) {
    return null;
  }

  const error = Math.abs(angleDifference(
    degToRad(currentPhase),
    degToRad(idealPhase)
  ));

  const errorDeg = Math.abs(radToDeg(error));

  // Jednoduchá heuristika:
  // 0° chyba = 0% navíc
  // 90° chyba = cca +80%
  // 180° chyba = cca +160%
  const penaltyMultiplier = 1 + (errorDeg / 90) * 0.8;

  return {
    baseDv,
    currentPhase,
    idealPhase,
    errorDeg,
    estimatedDv: Math.round(baseDv * penaltyMultiplier)
  };
}

function findNextTransferWindow(planet) {
  if (!planet || planet.name === selectedOrigin || selectedOrigin === "Kerbol") {
    return null;
  }

  const idealPhase = getIdealTransferAngle(selectedOrigin, planet.name);

  if (idealPhase === null) {
    return null;
  }

  const currentPhase = getCurrentPhaseAngle(planet);

  if (currentPhase === null) {
    return null;
  }

  const currentPhaseRad = degToRad(currentPhase);
  const idealPhaseRad = degToRad(idealPhase);

  const relativeSpeed = getRelativeAngularSpeedBetween(selectedOrigin, planet.name);

  if (relativeSpeed === 0) {
    return null;
  }

  let deltaAngle = angleDifference(idealPhaseRad, currentPhaseRad);
  let timeToWindow = deltaAngle / relativeSpeed;

  const synodicPeriod = (Math.PI * 2) / Math.abs(relativeSpeed);

  while (timeToWindow < 0) {
    timeToWindow += synodicPeriod;
  }

  const windowTime = time + timeToWindow;
  const baseDv = getBaseDvToPlanet(planet);

  return {
    time: windowTime,
    timeFromNow: timeToWindow,
    errorDeg: 0,
    dv: baseDv
  };
}

function clearManualAngles() {
  planets.forEach(planet => {
    planet.manualAngle = null;
  });
}

function setOrigin(originName) {
  selectedOrigin = originName;
  originSelect.value = originName;
}

function formatKspTime(totalSeconds) {
  const parts = secondsToKspParts(totalSeconds);
  return `Year ${parts.year}, Day ${parts.day}, ${parts.hour}h ${parts.minute}m`;
}

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));

  const years = Math.floor(safeSeconds / KSP_SECONDS_PER_YEAR);
  const secondsAfterYears = safeSeconds % KSP_SECONDS_PER_YEAR;

  const days = Math.floor(secondsAfterYears / KSP_SECONDS_PER_DAY);
  const secondsAfterDays = secondsAfterYears % KSP_SECONDS_PER_DAY;

  const hours = Math.floor(secondsAfterDays / KSP_SECONDS_PER_HOUR);
  const minutes = Math.floor((secondsAfterDays % KSP_SECONDS_PER_HOUR) / KSP_SECONDS_PER_MINUTE);

  if (years > 0) return `${years}y ${days}d ${hours}h ${minutes}m`;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getPlanetAngle(planet, time) {
  if (planet.manualAngle !== null && planet.manualAngle !== undefined) {
    return planet.manualAngle;
  }

  return getTimeBasedPlanetAngle(planet, time);
}

function getTimeBasedPlanetAngle(planet, timeValue) {
  const kerbin = planets.find(p => p.name === "Kerbin");

  if (!planet.orbitalPeriod || !kerbin?.orbitalPeriod) {
    return planet.baseAngle ?? 0;
  }

  if (planet.name === "Kerbin") {
    return 0;
  }

  const planetProgress = (timeValue / planet.orbitalPeriod) * Math.PI * 2;
  const kerbinProgress = (timeValue / kerbin.orbitalPeriod) * Math.PI * 2;

  return normalizeAngle((planet.baseAngle ?? 0) + planetProgress - kerbinProgress);
}

function angleDifference(a, b) {
  const diff = normalizeAngle(a - b);
  return diff > Math.PI ? diff - Math.PI * 2 : diff;
}

function getRelativeAngularSpeedToKerbin(planet) {
  const kerbin = planets.find(p => p.name === "Kerbin");

  if (!planet.orbitalPeriod || !kerbin?.orbitalPeriod || planet.name === "Kerbin") {
    return 0;
  }

  const planetAngularSpeed = (Math.PI * 2) / planet.orbitalPeriod;
  const kerbinAngularSpeed = (Math.PI * 2) / kerbin.orbitalPeriod;

  return planetAngularSpeed - kerbinAngularSpeed;
}

function getRelativeAngularSpeedBetween(originName, targetName) {
  const origin = getPlanetByName(originName);
  const target = getPlanetByName(targetName);

  if (!origin || !target || origin.name === target.name) {
    return 0;
  }

  if (!origin.orbitalPeriod || !target.orbitalPeriod) {
    return 0;
  }

  const originAngularSpeed = (Math.PI * 2) / origin.orbitalPeriod;
  const targetAngularSpeed = (Math.PI * 2) / target.orbitalPeriod;

  return targetAngularSpeed - originAngularSpeed;
}

function getTimeFromDragDelta(planet, newAngle) {
  const relativeSpeed = getRelativeAngularSpeedToKerbin(planet);

  if (relativeSpeed === 0) {
    return time;
  }

  const deltaAngle = angleDifference(newAngle, dragStartAngle);
  const deltaTime = deltaAngle / relativeSpeed;

  return Math.max(0, dragStartTime + deltaTime);
}

function hasManualOverrides() {
  return planets.some(planet => planet.manualAngle !== null);
}

function getPlanetByName(name) {
  return planets.find(planet => planet.name === name) ?? null;
}

function getIdealTransferAngle(originName, targetName) {
  if (originName === "Kerbol" || targetName === "Kerbol") {
    return null;
  }

  // Pokud máme ručně zadaný Kerbin -> target úhel z mapy, použijeme ho
  if (originName === "Kerbin" && transferAngleMap[targetName]) {
    return transferAngleMap[targetName].transferAngle;
  }

  const origin = getPlanetByName(originName);
  const target = getPlanetByName(targetName);

  if (!origin || !target || origin.name === target.name) {
    return null;
  }

  const r1 = origin.realSemiMajorAxis;
  const r2 = target.realSemiMajorAxis;

  if (!r1 || !r2 || !origin.orbitalPeriod || !target.orbitalPeriod) {
    return null;
  }

  // Hohmann approximation
  const transferSemiMajorAxis = (r1 + r2) / 2;

  // Keplerovo měřítko přes origin orbitu
  const transferOrbitPeriod =
    origin.orbitalPeriod * Math.pow(transferSemiMajorAxis / r1, 1.5);

  const transferTime = transferOrbitPeriod / 2;

  const targetAngularSpeed = (Math.PI * 2) / target.orbitalPeriod;

  const idealAngleRad = Math.PI - targetAngularSpeed * transferTime;

  return radToDeg(angleDifference(idealAngleRad, 0));
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
  const isKerbolOrigin = selectedOrigin === "Kerbol";
  const isKerbolSelected = selectedTargetType === "kerbol";

  if (isKerbolOrigin) {
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 16, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (isKerbolSelected) {
    ctx.shadowColor = "yellow";
    ctx.shadowBlur = 15;
  }

  ctx.fillStyle = "yellow";
  ctx.beginPath();
  ctx.arc(centerX, centerY, isKerbolSelected ? 14 : 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

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
    const hasManualAngle = planet.manualAngle !== null;
    const radius = isSelected ? 8 : hasManualAngle ? 7 : 5;
    const isOrigin = selectedOrigin === planet.name;

    // glow efekt
    if (isSelected) {
    ctx.shadowColor = "white";
    ctx.shadowBlur = 10;
    }

    if (isOrigin) {
      ctx.strokeStyle = "cyan";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
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

  ctx.fillText(`Origin: ${selectedOrigin}`, 20, 30);

  ctx.fillText(`Time: ${formatKspTime(time)}`, 20, 155);
  
  const manualCount = planets.filter(planet => planet.manualAngle !== null).length;
  ctx.fillText(`Manual overrides: ${manualCount}`, 20, 180);
  ctx.fillText(`Move whole system: ${moveWholeSystem ? "ON" : "OFF"}`, 20, 205);

  if (selectedTargetType === "kerbol") {
    const baseDv = selectedOrigin === "Kerbin" ? getBaseDvToTarget("Kerbol") : null;
    const finalDv = applyMargin(baseDv, marginPercent);

    ctx.fillText("Target: Kerbol", 20, 55);

    if (baseDv !== null) {
      ctx.fillText(`Ideal Δv: ${baseDv} m/s`, 20, 80);
      ctx.fillText("Now Δv: same as ideal", 20, 105);
      ctx.fillText(`Total + margin: ${finalDv} m/s`, 20, 130);
    } else {
      ctx.fillText("Ideal Δv: no data", 20, 80);
      ctx.fillText("Now Δv: no data", 20, 105);
      ctx.fillText("Total + margin: -", 20, 130);
    }

    ctx.fillText("Phase: -", 20, 230);
    ctx.fillText("Ideal: -", 20, 255);
    ctx.fillText("Error: -", 20, 280);
    ctx.fillText("Window: not applicable", 20, 315);
  } else if (selectedPlanet) {
    const dvEstimate = getCurrentDvEstimate(selectedPlanet);

    ctx.fillText(`Target: ${selectedPlanet.name}`, 20, 55);

    if (dvEstimate) {
      const finalDv = applyMargin(dvEstimate.estimatedDv, marginPercent);

      ctx.fillText(`Ideal Δv: ${dvEstimate.baseDv} m/s`, 20, 80);
      ctx.fillText(`Now Δv: ${dvEstimate.estimatedDv} m/s`, 20, 105);
      ctx.fillText(`Total + margin: ${finalDv} m/s`, 20, 130);

      ctx.fillText(`Phase: ${dvEstimate.currentPhase.toFixed(1)}°`, 20, 230);
      ctx.fillText(`Ideal: ${dvEstimate.idealPhase.toFixed(1)}°`, 20, 255);
      ctx.fillText(`Error: ${dvEstimate.errorDeg.toFixed(1)}°`, 20, 280);

      const windowEstimate = findNextTransferWindow(selectedPlanet);

      if (windowEstimate) {
        const windowDvWithMargin = applyMargin(windowEstimate.dv, marginPercent);

        ctx.fillText(`Window in: ${formatDuration(windowEstimate.timeFromNow)}`, 20, 315);
        ctx.fillText(`Window time: ${formatKspTime(windowEstimate.time)}`, 20, 340);
        ctx.fillText(`Window error: ${windowEstimate.errorDeg.toFixed(1)}°`, 20, 365);
        ctx.fillText(`Window Δv + margin: ${windowDvWithMargin} m/s`, 20, 390);
      }
    } else {
      const baseDv = getBaseDvToPlanet(selectedPlanet);
      const finalDv = applyMargin(baseDv, marginPercent);

      ctx.fillText(`Ideal Δv: ${baseDv ?? "-"} m/s`, 20, 80);
      ctx.fillText("Now Δv: není k dispozici", 20, 105);
      ctx.fillText(`Total + margin: ${finalDv ?? "-"} m/s`, 20, 130);
    }
  } else {
    ctx.fillText("Target: žádný", 20, 55);
    ctx.fillText("Ideal Δv: -", 20, 80);
    ctx.fillText("Now Δv: -", 20, 105);
    ctx.fillText("Total + margin: -", 20, 130);
  }

  requestAnimationFrame(draw);
}

draw();