// ======== SES EFEKTLERİ ========
// İnternet üzerinden çalışan örnek sesler. 
// İstersen bunları indirip yerel dosyalarla (örn: "correct.mp3") değiştirebilirsin.
const gameSounds = {
  correct: new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3"),
  wrong: new Audio("https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3"),
  gameOver: new Audio("https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3")
};

// Ses çalma fonksiyonu (Hata yönetimli)
function playSound(type) {
  if (gameSounds[type]) {
    gameSounds[type].currentTime = 0; // Sesi başa sar
    gameSounds[type].volume = 0.4;    // Ses seviyesi %40
    gameSounds[type].play().catch(e => console.warn("Ses çalınamadı (Tarayıcı izni gerekebilir):", e));
  }
}

// ======== MAP INITIALIZATION ========

const worldBounds = L.latLngBounds([-85, -180], [85, 180]);

const map = L.map("map", {
  worldCopyJump: false,
  maxBounds: worldBounds,
  maxBoundsViscosity: 1.0,
  zoomControl: false,
  boxZoom: false,     // siyah seçim kutusunu kapat
  keyboard: false     // klavye + focus outline kapalı
}).fitBounds(worldBounds);
// Box zoom özelliğini tamamen kapat
map.boxZoom.disable();

// Siyah çerçeveyi tamamen iptal et (focus/outline)
const mapContainer = map.getContainer();
mapContainer.style.outline = "none";
mapContainer.style.boxShadow = "none";
["mousedown", "mouseup", "click", "focus"].forEach(evt => {
  mapContainer.addEventListener(evt, () => {
    mapContainer.style.outline = "none";
    mapContainer.style.boxShadow = "none";
  });
});

L.control.zoom({ position: 'bottomright' }).addTo(map);

const baseLayers = {
  Light: L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    { maxZoom: 6, minZoom: 2, noWrap: true, attribution: "&copy; OpenStreetMap &copy; CARTO" }
  ),
  Dark: L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    { maxZoom: 6, minZoom: 2, noWrap: true, attribution: "&copy; OpenStreetMap &copy; CARTO" }
  )
};

baseLayers.Light.addTo(map);
L.control.layers(baseLayers).addTo(map);

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

// ======== ÜLKE GEOJSON'U ========
const countriesUrl = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";

function countryStyle(feature) {
  return {
    color: "#9ca3af",
    weight: 0.7,
    fillColor: "#fef9c3",
    fillOpacity: 0.7,
    outline: "none"
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
      direction: "center",
      className: "country-label"
    });
  }
}

fetch(countriesUrl)
  .then((res) => res.json())
  .then((data) => {
    countryLayer = L.geoJSON(data, {
      style: countryStyle,
      onEachFeature: onEachCountry
    }).addTo(map);
  })
  .catch((err) => console.error("GeoJSON load error:", err));

// ======== EVENTS DATA ========
const eventsData = [
  { name: "Construction of the Pyramids", difficulty: "Easy", lat: 29.97, lon: 31.13, year: "2500 BC" },
  { name: "Signing of the Magna Carta", difficulty: "Medium", lat: 51.44, lon: -0.57, year: "1215" },
  { name: "Fall of the Berlin Wall", difficulty: "Easy", lat: 52.52, lon: 13.40, year: "1989" },
  { name: "Discovery of Machu Picchu", difficulty: "Medium", lat: -13.16, lon: -72.54, year: "1911" },
  { name: "First Modern Olympic Games", difficulty: "Easy", lat: 37.98, lon: 23.72, year: "1896" },
  { name: "Sinking of the Titanic", difficulty: "Hard", lat: 41.73, lon: -49.94, year: "1912" },
  { name: "Battle of Gallipoli", difficulty: "Medium", lat: 40.33, lon: 26.41, year: "1915" },
  { name: "Declaration of Independence", difficulty: "Easy", lat: 39.95, lon: -75.16, year: "1776" },
  { name: "Taj Mahal Completed", difficulty: "Easy", lat: 27.17, lon: 78.04, year: "1653" },
  { name: "Chernobyl Disaster", difficulty: "Medium", lat: 51.38, lon: 30.09, year: "1986" }
];

// ======== GAME LOGIC ========

let events = eventsData;
const eventNameEl = document.getElementById("eventName");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const difficultyEl = document.getElementById("difficulty");
const feedbackEl = document.getElementById("feedback");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

eventNameEl.textContent = "Press Start to play";
feedbackEl.textContent = "Ready to travel in time!";
startBtn.disabled = false;

let score = 0;
let lives = 3;
let timeLeft = 60;
let currentEvent = null;
let timerId = null;
let gameRunning = false;
let canGuess = false;

function updateStatsUI() {
  timerEl.textContent = timeLeft + "s";
  scoreEl.textContent = score;
  livesEl.textContent = "❤️".repeat(lives) + "❌".repeat(3 - lives);
  
  if (timeLeft <= 10) timerEl.style.color = "#ef4444";
  else timerEl.style.color = "#111827";
}

function setEvent(event) {
  currentEvent = event;
  eventNameEl.innerHTML = `${event.name} <br><span style="font-size:0.8rem; color:#666; font-weight:normal;">(${event.year})</span>`;
  difficultyEl.textContent = event.difficulty;
  difficultyEl.style.background = event.difficulty === "Easy" ? "#dcfce7" : event.difficulty === "Medium" ? "#e0f2fe" : "#fee2e2";
}

function getRandomEvent() {
  const idx = Math.floor(Math.random() * events.length);
  return events[idx];
}

function startGame() {
  score = 0;
  lives = 3;
  timeLeft = 60;
  gameRunning = true;
  canGuess = true;

  clearMarkers();
  map.flyTo([20, 0], 2, { duration: 1 });

  updateStatsUI();
  feedbackEl.innerHTML = "Game started! Find the location.";
  
  const ev = getRandomEvent();
  setEvent(ev);

  startBtn.disabled = true;
  restartBtn.disabled = true;

  if (timerId) clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      timeLeft = 0;
      endGame("Time is up!");
    }
    updateStatsUI();
  }, 1000);
}

function endGame(message) {
  gameRunning = false;
  canGuess = false;
  if (timerId) clearInterval(timerId);
  timerId = null;

  playSound("gameOver");

  startBtn.disabled = false;
  restartBtn.disabled = false;

  // Popup göster
  showPopup("Game Over", message + "<br><br>Final Score: <strong>" + score + "</strong>");
}


function handleGuess(latlng) {
  if (!gameRunning || !canGuess || !currentEvent) return;
  canGuess = false; 

  clearMarkers();

  const guessLatLng = L.latLng(latlng.lat, latlng.lng);
  const trueLatLng = L.latLng(currentEvent.lat, currentEvent.lon);
  const distanceMeters = map.distance(guessLatLng, trueLatLng);
  const distanceKm = distanceMeters / 1000;

  guessMarker = L.circleMarker(guessLatLng, {
    radius: 6, color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 0.9, pane: "markersPane"
  }).addTo(map);

  trueMarker = L.circleMarker(trueLatLng, {
    radius: 7, color: "#b91c1c", fillColor: "#ef4444", fillOpacity: 0.95, pane: "markersPane"
  }).addTo(map);

  lineLayer = L.polyline([guessLatLng, trueLatLng], {
    color: "#111827", weight: 2, dashArray: "5, 5", pane: "markersPane"
  }).addTo(map);

  map.flyTo(trueLatLng, 5, { animate: true, duration: 1.5 });

  let points = 0;
  if (distanceKm <= 300) points = 50;
  else if (distanceKm <= 1000) points = 25;
  else if (distanceKm <= 2000) points = 10;
  else if (distanceKm <= 3000) points = 5;

  let lifeLost = false;
  if (distanceKm > 3000) {
    lifeLost = true;
    lives--;
    // HATA SESİ
    playSound("wrong");
  } else {
    timeLeft += 2;
    // DOĞRU SESİ
    playSound("correct");
  }

  score += points;
  updateStatsUI();

  const distText = Math.round(distanceKm).toLocaleString() + " km";
  let feedbackHtml = `
    <div style="margin-bottom:4px;"><strong>${currentEvent.name}</strong></div>
    True location: (${trueLatLng.lat.toFixed(1)}, ${trueLatLng.lng.toFixed(1)}) | 
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
    map.flyTo([20, 0], 2, { duration: 0.8 });
    const ev = getRandomEvent();
    setEvent(ev);
    canGuess = true;
    feedbackEl.textContent = "Next event coming up...";
  }, 3000); 
}

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

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

