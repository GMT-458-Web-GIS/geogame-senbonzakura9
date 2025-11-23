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
    gameSounds[type].play().catch(e =>
      console.warn("Ses çalınamadı (Tarayıcı izni gerekebilir):", e)
    );
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

// Zoom kontrolü
L.control.zoom({ position: "bottomright" }).addTo(map);

// ---- SADECE AÇIK (LIGHT) HARİTA KALSIN ----
const lightLayer = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
  {
    maxZoom: 6,
    minZoom: 2,
    noWrap: true,
    attribution: "&copy; OpenStreetMap &copy; CARTO"
  }
);

// Sadece light layer kullanıyoruz, layer switch yok
lightLayer.addTo(map);

map.createPane("markersPane");
map.getPane("markersPane").style.zIndex = 650;

let guessMarker = null;
let trueMarker = null;
let lineLayer = null;
let countryLayer = null;

function clearMarkers() {
  if (guessMarker) {
    map.removeLayer(guessMarker);
    guessMarker = null;
  }
  if (trueMarker) {
    map.removeLayer(trueMarker);
    trueMarker = null;
  }
  if (lineLayer) {
    map.removeLayer(lineLayer);
    lineLayer = null;
  }
}

// ======== ÜLKE GEOJSON'U ========
const countriesUrl =
  "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";

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
  .then(res => res.json())
  .then(data => {
    countryLayer = L.geoJSON(data, {
      style: countryStyle,
      onEachFeature: onEachCountry
    }).addTo(map);
  })
  .catch(err => console.error("GeoJSON load error:", err));

// ======== EVENTS DATA ========
// Titanic çıkarıldı, yerine ekstra karasal eventler eklendi.
const eventsData = [
  // Mevcutlar
  {
    name: "Construction of the Pyramids (Giza)",
    difficulty: "Easy",
    lat: 29.9792,
    lon: 31.1342,
    year: "c. 2500 BC"
  },
  {
    name: "Signing of the Magna Carta",
    difficulty: "Medium",
    lat: 51.4408,
    lon: -0.5596,
    year: "1215"
  },
  {
    name: "Fall of the Berlin Wall",
    difficulty: "Easy",
    lat: 52.5163,
    lon: 13.3777,
    year: "1989"
  },
  {
    name: "Discovery of Machu Picchu",
    difficulty: "Medium",
    lat: -13.1631,
    lon: -72.545,
    year: "1911"
  },
  {
    name: "First Modern Olympic Games (Athens)",
    difficulty: "Easy",
    lat: 37.9838,
    lon: 23.7275,
    year: "1896"
  },
  {
    name: "Battle of Gallipoli",
    difficulty: "Medium",
    lat: 40.215,
    lon: 26.325,
    year: "1915"
  },
  {
    name: "US Declaration of Independence (Philadelphia)",
    difficulty: "Easy",
    lat: 39.9526,
    lon: -75.1652,
    year: "1776"
  },
  {
    name: "Taj Mahal Completed (Agra)",
    difficulty: "Easy",
    lat: 27.1751,
    lon: 78.0421,
    year: "1653"
  },
  {
    name: "Chernobyl Disaster",
    difficulty: "Medium",
    lat: 51.389,
    lon: 30.099,
    year: "1986"
  },

  // Yeni eventler
  {
    name: "Fall of Constantinople",
    difficulty: "Easy",
    lat: 41.0082,
    lon: 28.9784,
    year: "1453"
  },
  {
    name: "French Revolution Begins (Storming of the Bastille)",
    difficulty: "Medium",
    lat: 48.8566,
    lon: 2.3522,
    year: "1789"
  },
  {
    name: "Russian Revolution (October Revolution, Petrograd)",
    difficulty: "Hard",
    lat: 59.9311,
    lon: 30.3609,
    year: "1917"
  },
  {
    name: "Independence of India (New Delhi)",
    difficulty: "Medium",
    lat: 28.6139,
    lon: 77.209,
    year: "1947"
  },
  {
    name: "Meiji Restoration (Tokyo)",
    difficulty: "Hard",
    lat: 35.6762,
    lon: 139.6503,
    year: "1868"
  },
  {
    name: "Unification of Germany (Proclamation at Versailles)",
    difficulty: "Hard",
    lat: 48.8049,
    lon: 2.1204,
    year: "1871"
  },
  {
    name: "Moon Landing Mission Control (Houston)",
    difficulty: "Medium",
    lat: 29.5522,
    lon: -95.097,
    year: "1969"
  },
  {
    name: "Great Fire of London",
    difficulty: "Medium",
    lat: 51.5074,
    lon: -0.1278,
    year: "1666"
  },
  {
    name: "Battle of Waterloo",
    difficulty: "Medium",
    lat: 50.6806,
    lon: 4.4125,
    year: "1815"
  },
  {
    name: "American Civil War Ends (Appomattox Court House)",
    difficulty: "Hard",
    lat: 37.3771,
    lon: -78.7975,
    year: "1865"
  },
  {
    name: "Assassination of Archduke Franz Ferdinand (Sarajevo)",
    difficulty: "Hard",
    lat: 43.8563,
    lon: 18.4131,
    year: "1914"
  },
  {
    name: "Bombing of Hiroshima",
    difficulty: "Medium",
    lat: 34.3853,
    lon: 132.4553,
    year: "1945"
  },
  {
    name: "Bombing of Nagasaki",
    difficulty: "Hard",
    lat: 32.7503,
    lon: 129.8777,
    year: "1945"
  },
  {
    name: "Cuban Missile Crisis (Havana)",
    difficulty: "Medium",
    lat: 23.1136,
    lon: -82.3666,
    year: "1962"
  },
  {
    name: "Rwandan Genocide (Kigali)",
    difficulty: "Hard",
    lat: -1.9579,
    lon: 30.1127,
    year: "1994"
  },
  {
    name: "Nelson Mandela Becomes President (Pretoria)",
    difficulty: "Medium",
    lat: -25.7479,
    lon: 28.2293,
    year: "1994"
  },
  {
    name: "Attack on Pearl Harbor (Honolulu, Oahu)",
    difficulty: "Medium",
    lat: 21.3649,
    lon: -157.9495,
    year: "1941"
  },
  {
    name: "9/11 Attacks (New York City)",
    difficulty: "Medium",
    lat: 40.7115,
    lon: -74.0134,
    year: "2001"
  },
  {
    name: "Proclamation of the Republic of Turkey (Ankara)",
    difficulty: "Easy",
    lat: 39.9334,
    lon: 32.8597,
    year: "1923"
  },
  {
    name: "Chinese Revolution (Proclamation in Beijing)",
    difficulty: "Hard",
    lat: 39.9042,
    lon: 116.4074,
    year: "1949"
  },
  {
    name: "UN Founded (San Francisco Conference)",
    difficulty: "Hard",
    lat: 37.7749,
    lon: -122.4194,
    year: "1945"
  }
];

// ======== YARDIMCI: EVENT KARIŞTIRMA & SIRAYLA SORMA ========

// Fisher-Yates shuffle
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Oyun başına bir event kuyruğu: aynı oyun içinde tekrar yok
let eventQueue = [];

// ======== GAME LOGIC ========

const eventNameEl = document.getElementById("eventName");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const difficultyEl = document.getElementById("difficulty");
const feedbackEl = document.getElementById("feedback");
const startBtn = document.getElementById("startBtn");

eventNameEl.textContent = "Press Start to play";
feedbackEl.textContent = "Ready to travel in time!";
startBtn.disabled = false;
startBtn.textContent = "Start"; // ilk yazı

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
  difficultyEl.style.background =
    event.difficulty === "Easy"
      ? "#dcfce7"
      : event.difficulty === "Medium"
      ? "#e0f2fe"
      : "#fee2e2";
}

// Her yeni soruda sıradaki event'i al
function getNextEvent() {
  if (eventQueue.length === 0) {
    // Tüm eventler tüketildiyse yeniden karıştır (olması çok zor ama koruma olsun)
    eventQueue = shuffleArray(eventsData);
  }
  return eventQueue.shift();
}

function startGame() {
  // Oyun başına event kuyruğunu karıştırıp sıfırla
  eventQueue = shuffleArray(eventsData);

  // Her yeni oyun için state reset
  score = 0;
  lives = 3;
  timeLeft = 60;
  gameRunning = true;
  canGuess = true;

  clearMarkers();
  map.flyTo([20, 0], 2, { duration: 1 });

  updateStatsUI();
  feedbackEl.innerHTML = "Game started! Find the location.";

  const ev = getNextEvent();
  setEvent(ev);

  // Oyun sırasında buton pasif (tek buton)
  startBtn.disabled = true;

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

  // Oyun bitince buton tekrar aktif ve yazısı "Play Again" oluyor
  startBtn.disabled = false;
  startBtn.textContent = "Play Again";

  // Popup göster
  showPopup(
    "Game Over",
    message + "<br><br>Final Score: <strong>" + score + "</strong>"
  );
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
    // DAHA İYİ HİSSETTİREN DOĞRU SESİ
    playSound("correct");
  }

  score += points;
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
    map.flyTo([20, 0], 2, { duration: 0.8 });
    const ev = getNextEvent();
    setEvent(ev);
    canGuess = true;
    feedbackEl.textContent = "Next event coming up...";
  }, 3000);
}

// Tek buton; hem ilk Start hem de sonraki Play Again için
startBtn.addEventListener("click", startGame);

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
