const gameSounds = {
  correct: new Audio("correct.mp3"),
  wrong: new Audio("wrong.mp3"),
  gameOver: new Audio("gameover.mp3"),
  powerup: new Audio("powerup.mp3")
};

function playSound(type) {
  const s = gameSounds[type];
  if (!s) return;
  s.currentTime = 0;
  s.volume = 0.45;
  s.play().catch(() => {});
}

// ======== MAP INITIALIZATION ========

const map = L.map("map", {
  worldCopyJump: true,
  zoomControl: false,
  boxZoom: false,
  keyboard: false
}).setView([20, 0], 2);

map.boxZoom.disable();

const mapContainer = map.getContainer();
mapContainer.style.outline = "none";
mapContainer.style.boxShadow = "none";
["mousedown", "mouseup", "click", "focus"].forEach(evt => {
  mapContainer.addEventListener(evt, () => {
    mapContainer.style.outline = "none";
    mapContainer.style.boxShadow = "none";
  });
});

L.control.zoom({ position: "bottomright" }).addTo(map);

const lightLayer = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
  {
    maxZoom: 6,
    minZoom: 2,
    attribution: "&copy; OpenStreetMap &copy; CARTO"
  }
);
lightLayer.addTo(map);

map.createPane("markersPane");
map.getPane("markersPane").style.zIndex = 650;

let guessMarker = null;
let trueMarker = null;
let lineLayer = null;
let countryLayer = null;

function clearMarkers() {
  if (guessMarker) { map.removeLayer(guessMarker); guessMarker = null; }
  if (trueMarker) { map.removeLayer(trueMarker); trueMarker = null; }
  if (lineLayer) { map.removeLayer(lineLayer); lineLayer = null; }
}

// ======== COUNTRIES GEOJSON ========

const countriesUrl =
  "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";

function countryStyle(feature) {
  return {
    color: "#9ca3af",
    weight: 0.7,
    fillColor: "#fef9c3",
    fillOpacity: 0.7
  };
}

function highlightFeature(e) {
  const layer = e.target;
  layer.setStyle({
    weight: 1.5,
    color: "#4b5563",
    fillColor: "#f97316",
    fillOpacity: 0.85
  });
  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
}

function resetHighlight(e) {
  countryLayer.resetStyle(e.target);
}

function onCountryClick(e) {
  handleGuess(e.latlng);
}

function onEachCountry(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: onCountryClick
  });

  if (feature.properties && feature.properties.name) {
    layer.bindTooltip(feature.properties.name, {
      permanent: false,
      sticky: true,
      direction: "top",
      offset: [0, -10],
      className: "country-label"
    });
  }
}

fetch(countriesUrl)
  .then(res => res.json())
  .then(data => {
    countryLayer = L.geoJSON(data, {
      style: countryStyle,
      onEachFeature: onEachCountry
    }).addTo(map);
  })
  .catch(err => console.error("GeoJSON load error:", err));

// ======== EVENTS DATA ========

const eventsData = [
  { name: "Construction of the Pyramids (Giza)", difficulty: "Easy", lat: 29.9792, lon: 31.1342, year: "c. 2500 BC" },
  { name: "Signing of the Magna Carta", difficulty: "Medium", lat: 51.4408, lon: -0.5596, year: "1215" },
  { name: "Fall of the Berlin Wall", difficulty: "Easy", lat: 52.5163, lon: 13.3777, year: "1989" },
  { name: "Discovery of Machu Picchu", difficulty: "Medium", lat: -13.1631, lon: -72.545, year: "1911" },
  { name: "First Modern Olympic Games (Athens)", difficulty: "Easy", lat: 37.9838, lon: 23.7275, year: "1896" },
  { name: "Battle of Gallipoli", difficulty: "Medium", lat: 40.215, lon: 26.325, year: "1915" },
  { name: "US Declaration of Independence (Philadelphia)", difficulty: "Easy", lat: 39.9526, lon: -75.1652, year: "1776" },
  { name: "Taj Mahal Completed (Agra)", difficulty: "Easy", lat: 27.1751, lon: 78.0421, year: "1653" },
  { name: "Chernobyl Disaster", difficulty: "Medium", lat: 51.389, lon: 30.099, year: "1986" },
  { name: "Fall of Constantinople", difficulty: "Easy", lat: 41.0082, lon: 28.9784, year: "1453" },
  { name: "Russian October Revolution (Petrograd)", difficulty: "Hard", lat: 59.9311, lon: 30.3609, year: "1917" },
  { name: "Meiji Restoration (Tokyo)", difficulty: "Hard", lat: 35.6762, lon: 139.6503, year: "1868" },
  { name: "Moon Landing – Mission Control (Houston)", difficulty: "Medium", lat: 29.5522, lon: -95.097, year: "1969" },
  { name: "Great Fire of London", difficulty: "Medium", lat: 51.5074, lon: -0.1278, year: "1666" },
  { name: "Battle of Waterloo", difficulty: "Medium", lat: 50.6806, lon: 4.4125, year: "1815" },
  { name: "American Civil War Ends (Appomattox)", difficulty: "Hard", lat: 37.3771, lon: -78.7975, year: "1865" },
  { name: "Assassination of Archduke Franz Ferdinand (Sarajevo)", difficulty: "Hard", lat: 43.8563, lon: 18.4131, year: "1914" },
  { name: "Bombing of Hiroshima", difficulty: "Medium", lat: 34.3853, lon: 132.4553, year: "1945" },
  { name: "Bombing of Nagasaki", difficulty: "Hard", lat: 32.7503, lon: 129.8777, year: "1945" },
  { name: "Cuban Missile Crisis (Havana)", difficulty: "Medium", lat: 23.1136, lon: -82.3666, year: "1962" },
  { name: "Rwandan Genocide (Kigali)", difficulty: "Hard", lat: -1.9579, lon: 30.1127, year: "1994" },
  { name: "Nelson Mandela Becomes President (Pretoria)", difficulty: "Medium", lat: -25.7479, lon: 28.2293, year: "1994" },
  { name: "Attack on Pearl Harbor (Oahu)", difficulty: "Medium", lat: 21.3649, lon: -157.9495, year: "1941" },
  { name: "9/11 Attacks ", difficulty: "Medium", lat: 40.7115, lon: -74.0134, year: "2001" },
  { name: "Proclamation of the Republic of Turkey (Ankara)", difficulty: "Easy", lat: 39.9334, lon: 32.8597, year: "1923" },
  { name: "UN Founded (San Francisco Conference)", difficulty: "Hard", lat: 37.7749, lon: -122.4194, year: "1945" },
  { name: "Boston Tea Party (Boston)", difficulty: "Medium", lat: 42.3601, lon: -71.0589, year: "1773" },
  { name: "Berlin Airlift Begins (Berlin)", difficulty: "Medium", lat: 52.5200, lon: 13.4050, year: "1948" },
  { name: "Sinking of the Lusitania (Near Ireland)", difficulty: "Hard", lat: 51.25, lon: -8.33, year: "1915" },
  { name: "Discovery of Penicillin (London)", difficulty: "Easy", lat: 51.521, lon: -0.134, year: "1928" },
  { name: "Black Death Reaches Europe (Sicily)", difficulty: "Hard", lat: 37.5999, lon: 14.0154, year: "1347" },
  { name: "Mongol Siege of Baghdad", difficulty: "Hard", lat: 33.3152, lon: 44.3661, year: "1258" },
  { name: "Nelson Mandela Released (Cape Town)", difficulty: "Easy", lat: -33.9249, lon: 18.4241, year: "1990" },
  { name: "Great Chicago Fire", difficulty: "Medium", lat: 41.8781, lon: -87.6298, year: "1871" },
  { name: "Apollo 13 Splashdown (South Pacific)", difficulty: "Hard", lat: -21.6, lon: -165.0, year: "1970" }
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let eventQueue = [];

// ======== GAME STATE & DOM ========

const eventNameEl = document.getElementById("eventName");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const difficultyEl = document.getElementById("difficulty");
const feedbackEl = document.getElementById("feedback");
const startBtn = document.getElementById("startBtn");
const skipBtn = document.getElementById("skipBtn");
const timeBoostBtn = document.getElementById("timeBoostBtn");
const pointsFloatEl = document.getElementById("pointsFloat");

eventNameEl.textContent = "Press Start to play";
feedbackEl.textContent = "Ready to travel in time!";
startBtn.disabled = false;
startBtn.textContent = "Start";

let score = 0;
let lives = 3;
let timeLeft = 90; // 90 saniye
let currentEvent = null;
let timerId = null;
let gameRunning = false;
let canGuess = false;

// power-up state
let skipAvailable = false;
let timeBoostAvailable = false;

// accuracy stats
let totalGuesses = 0;
let totalDistanceKm = 0;
let closeGuesses = 0; // örn. <= 1000 km

function updateStatsUI() {
  timerEl.textContent = timeLeft + "s";
  document.getElementById("mapTimer").textContent = timeLeft + "s";
  scoreEl.textContent = score;
  livesEl.textContent = "❤️".repeat(lives) + "❌".repeat(3 - lives);

  if (timeLeft <= 10) {
    timerEl.classList.add("timer-low");
    mapContainer.classList.add("map-flash");
  } else {
    timerEl.classList.remove("timer-low");
    mapContainer.classList.remove("map-flash");
  }
}

function animateEvent() {
  eventNameEl.classList.remove("event-animate");
  void eventNameEl.offsetWidth;
  eventNameEl.classList.add("event-animate");
}

function animateScore() {
  scoreEl.classList.remove("score-pulse");
  void scoreEl.offsetWidth;
  scoreEl.classList.add("score-pulse");
}

function animateLivesHit() {
  livesEl.classList.remove("lives-hit");
  void livesEl.offsetWidth;
  livesEl.classList.add("lives-hit");
}

function showPointsFloat(points) {
  if (points <= 0) return;
  pointsFloatEl.textContent = "+" + points;
  pointsFloatEl.classList.remove("show");
  void pointsFloatEl.offsetWidth;
  pointsFloatEl.classList.add("show");
}

function setEvent(event) {
  currentEvent = event;
  eventNameEl.innerHTML =
    `${event.name} <br><span style="font-size:0.8rem; color:#666; font-weight:normal;">(${event.year})</span>`;

  difficultyEl.textContent = event.difficulty;
  difficultyEl.style.background =
    event.difficulty === "Easy"
      ? "#dcfce7"
      : event.difficulty === "Medium"
      ? "#e0f2fe"
      : "#fee2e2";

  animateEvent();
}

function getNextEvent() {
  if (eventQueue.length === 0) {
    eventQueue = shuffleArray(eventsData);
  }
  return eventQueue.shift();
}

// ======== GAME FLOW ========

function startGame() {
  // Power-up'lar reset
  skipAvailable = true;
  timeBoostAvailable = true;
  skipBtn.disabled = false;
  timeBoostBtn.disabled = false;

  // Accuracy reset
  totalGuesses = 0;
  totalDistanceKm = 0;
  closeGuesses = 0;

  // State reset
  eventQueue = shuffleArray(eventsData);
  score = 0;
  lives = 3;
  timeLeft = 90;
  gameRunning = true;
  canGuess = true;

  clearMarkers();
  map.flyTo([20, 0], 2.3, { duration: 1.2, easeLinearity: 0.18 });

  updateStatsUI();
  feedbackEl.innerHTML = "Game started! Find the location.";

  const ev = getNextEvent();
  setEvent(ev);

  startBtn.disabled = true;
  startBtn.textContent = "Playing...";
}

function endGame(message) {
  gameRunning = false;
  canGuess = false;
  if (timerId) clearInterval(timerId);
  timerId = null;

  playSound("gameOver");

  startBtn.disabled = false;
  startBtn.textContent = "Play Again";

  skipBtn.disabled = true;
  timeBoostBtn.disabled = true;

  // accuracy stats
  let avgError = totalGuesses ? (totalDistanceKm / totalGuesses) : 0;
  let accuracyPct = totalGuesses ? Math.round((closeGuesses / totalGuesses) * 100) : 0;

  const extraStats = `
    <br><br>
    <strong>Final Score:</strong> ${score}
    <br>
    <strong>Questions Answered:</strong> ${totalGuesses}
    <br>
    <strong>Average Distance:</strong> ${avgError.toFixed(0)} km
    <br>
    <strong>Accuracy (≤ 1000 km):</strong> ${accuracyPct}%
  `;

  showPopup("Game Over", message + extraStats);
}

// ======== POWER-UPS ========

function useSkip() {
  if (!gameRunning || !canGuess || !skipAvailable) return;
  skipAvailable = false;
  skipBtn.disabled = true;

  playSound("powerup");

  clearMarkers();
  feedbackEl.textContent = "Event skipped! New one is coming...";

  setTimeout(() => {
    if (!gameRunning) return;
    const ev = getNextEvent();
    setEvent(ev);
    canGuess = true;
  }, 700);
}

function useTimeBoost() {
  if (!gameRunning || !timeBoostAvailable) return;
  timeBoostAvailable = false;
  timeBoostBtn.disabled = true;

  timeLeft += 10;
  playSound("powerup");
  updateStatsUI();
}

// ======== GUESS HANDLING ========

function handleGuess(latlng) {
  if (!gameRunning || !canGuess || !currentEvent) return;
  canGuess = false;

  clearMarkers();

  const guessLatLng = L.latLng(latlng.lat, latlng.lng);
  const trueLatLng = L.latLng(currentEvent.lat, currentEvent.lon);
  const distanceMeters = map.distance(guessLatLng, trueLatLng);
  const distanceKm = distanceMeters / 1000;

  // accuracy tracking
  totalGuesses++;
  totalDistanceKm += distanceKm;
  if (distanceKm <= 1000) {
    closeGuesses++;
  }

  guessMarker = L.circleMarker(guessLatLng, {
    radius: 6,
    color: "#1d4ed8",
    fillColor: "#3b82f6",
    fillOpacity: 0.9,
    pane: "markersPane"
  }).addTo(map);

  trueMarker = L.circleMarker(trueLatLng, {
    radius: 7,
    color: "#b91c1c",
    fillColor: "#ef4444",
    fillOpacity: 0.95,
    pane: "markersPane"
  }).addTo(map);

  lineLayer = L.polyline([guessLatLng, trueLatLng], {
    color: "#111827",
    weight: 2,
    dashArray: "5, 5",
    pane: "markersPane"
  }).addTo(map);

  // Daha smooth zoom
  map.flyTo(trueLatLng, 5, {
    animate: true,
    duration: 1.8,
    easeLinearity: 0.15
  });

  let points = 0;
  let lifeLost = false;

  if (distanceKm <= 300) {
    points = 50;
  } else if (distanceKm <= 500) {
    points = 40;
  } else if (distanceKm <= 1500) {
    points = 20;
  } else if (distanceKm <= 2000) {
    points = 5;
  } else {
    lifeLost = true;
    lives--;
  }

  if (lifeLost) {
    playSound("wrong");
    animateLivesHit();
  } else {
    timeLeft += 2;
    playSound("correct");
  }

  score += points;
  animateScore();
  showPointsFloat(points);
  updateStatsUI();

  const distText = Math.round(distanceKm).toLocaleString() + " km";
  let feedbackHtml = `
    <div style="margin-bottom:4px;"><strong>${currentEvent.name}</strong></div>
    True location: (${trueLatLng.lat.toFixed(1)}, ${trueLatLng.lng.toFixed(
    1
  )}) | 
    Diff: <strong>${distText}</strong> | 
    Points: <span style="color:#10b981; font-weight:bold;">+${points}</span>
  `;

  if (lifeLost) {
    feedbackHtml += `<br><span style="color:#ef4444; font-weight:bold;">Too far! Lost a life.</span>`;
  }

  feedbackEl.innerHTML = feedbackHtml;

  if (lives <= 0) {
    endGame("You ran out of lives.");
    return;
  }

  setTimeout(() => {
    if (!gameRunning) return;
    clearMarkers();
    map.flyTo([20, 0], 2.3, { duration: 1, easeLinearity: 0.2 });
    const ev = getNextEvent();
    setEvent(ev);
    canGuess = true;
    feedbackEl.textContent = "Next event coming up...";
  }, 3000);
}

// ======== EVENT LISTENERS ========

startBtn.addEventListener("click", () => {
  // Her oyuna yeni timer kur
  if (timerId) clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      timeLeft = 0;
      endGame("Time is up!");
    }
    updateStatsUI();
  }, 1000);

  startGame();
});

skipBtn.addEventListener("click", useSkip);
timeBoostBtn.addEventListener("click", useTimeBoost);

updateStatsUI();

// ===== POPUP SYSTEM =====
const popup = document.getElementById("gameOverPopup");
const popupTitle = document.getElementById("popupTitle");
const popupMessage = document.getElementById("popupMessage");
const popupCloseBtn = document.getElementById("popupCloseBtn");

function showPopup(title, message) {
  popupTitle.innerHTML = title;
  popupMessage.innerHTML = message;
  popup.classList.remove("hidden");
}

popupCloseBtn.addEventListener("click", () => {
  popup.classList.add("hidden");
});
