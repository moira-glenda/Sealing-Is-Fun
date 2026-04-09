const verses = [
  {
    number: 14,
    text: `"To the angel of the church in Laodicea write: These are the words of the Amen, the faithful and true witness, the ruler of God's creation.`
  },
  {
    number: 15,
    text: `I know your deeds, that you are neither cold nor hot. I wish you were either one or the other!`
  },
  {
    number: 16,
    text: `So, because you are lukewarm-neither hot nor cold- I am about to spit you out of my mouth.`
  },
  {
    number: 17,
    text: `You say, 'I am rich; I have acquired wealth and do not need a thing.' But you do not realize that you are wretched, pitiful, poor, blind and naked.`
  },
  {
    number: 18,
    text: `I counsel you to buy from me gold refined in the fire, so you can become rich; and white clothes to wear, so you can cover your shameful nakedness; and salve to put on your eyes, so you can see.`
  },
  {
    number: 19,
    text: `Those whom I love I rebuke and discipline. So be earnest, and repent.`
  },
  {
    number: 20,
    text: `Here I am! I stand at the door and knock. If anyone hears my voice and opens the door, I will come in and eat with him, and he with me.`
  },
  {
    number: 21,
    text: `To him who overcomes, I will give the right to sit with me on my throne, just as I overcame and sat down with my Father on his throne.`
  },
  {
    number: 22,
    text: `He who has an ear, let him hear what the Spirit says to the churches."`
  }
];

let cards = [...verses];
let showNumbers = true;
let lightningInterval = null;
let remaining = 10;
const players = [];

const cardsEl = document.getElementById("cards");
const drawnCardEl = document.getElementById("drawnCard");
const timerTextEl = document.getElementById("timerText");
const playersEl = document.getElementById("players");

function renderCards() {
  cardsEl.innerHTML = "";
  cards.forEach((verse, idx) => {
    const li = document.createElement("li");
    li.className = "card";
    li.draggable = true;
    li.dataset.index = idx;
    li.innerHTML = `
      ${showNumbers ? `<span class="verse-num">${verse.number}</span>` : ""}
      <span>${verse.text}</span>
    `;

    li.addEventListener("dblclick", () => li.classList.toggle("done"));
    li.addEventListener("dragstart", dragStart);
    li.addEventListener("dragover", dragOver);
    li.addEventListener("drop", drop);
    li.addEventListener("dragend", dragEnd);
    cardsEl.appendChild(li);
  });
}

let dragSource = null;
function dragStart(e) {
  dragSource = Number(e.currentTarget.dataset.index);
  e.currentTarget.classList.add("dragging");
}

function dragOver(e) {
  e.preventDefault();
}

function drop(e) {
  e.preventDefault();
  const target = Number(e.currentTarget.dataset.index);
  if (dragSource === null || dragSource === target) return;
  const moved = cards.splice(dragSource, 1)[0];
  cards.splice(target, 0, moved);
  dragSource = null;
  renderCards();
}

function dragEnd(e) {
  e.currentTarget.classList.remove("dragging");
}

function shuffle() {
  cards = [...cards].sort(() => Math.random() - 0.5);
  renderCards();
}

function resetOrder() {
  cards = [...verses];
  renderCards();
}

function drawRandomVerse() {
  const random = cards[Math.floor(Math.random() * cards.length)];
  drawnCardEl.innerHTML = `${showNumbers ? `<strong>Verse ${random.number}:</strong> ` : ""}${random.text}`;
}

function updateTimer() {
  timerTextEl.textContent = `${remaining}s`;
}

function startLightning() {
  clearInterval(lightningInterval);
  remaining = 10;
  updateTimer();
  lightningInterval = setInterval(() => {
    remaining -= 1;
    updateTimer();
    if (remaining <= 0) {
      clearInterval(lightningInterval);
      timerTextEl.textContent = "Time!";
    }
  }, 1000);
}

function stopLightning() {
  clearInterval(lightningInterval);
  timerTextEl.textContent = "Off";
}

function renderPlayers() {
  playersEl.innerHTML = "";
  players.forEach((p, i) => {
    const li = document.createElement("li");
    li.className = "player";
    li.innerHTML = `
      <span>${p.name}: <strong>${p.score}</strong></span>
      <span class="player-controls">
        <button data-i="${i}" data-delta="1">+1</button>
        <button data-i="${i}" data-delta="2">+2</button>
        <button data-i="${i}" data-delta="3">+3</button>
      </span>
    `;
    playersEl.appendChild(li);
  });
}

playersEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const idx = Number(btn.dataset.i);
  const delta = Number(btn.dataset.delta);
  players[idx].score += delta;
  renderPlayers();
});

document.getElementById("shuffleBtn").addEventListener("click", shuffle);
document.getElementById("resetOrderBtn").addEventListener("click", resetOrder);
document.getElementById("drawBtn").addEventListener("click", drawRandomVerse);
document.getElementById("toggleNumbersBtn").addEventListener("click", () => {
  showNumbers = !showNumbers;
  renderCards();
});
document.getElementById("lightningBtn").addEventListener("click", startLightning);
document.getElementById("stopTimerBtn").addEventListener("click", stopLightning);
document.getElementById("addPlayerBtn").addEventListener("click", () => {
  const input = document.getElementById("playerName");
  const name = input.value.trim();
  if (!name) return;
  players.push({ name, score: 0 });
  input.value = "";
  renderPlayers();
});

renderCards();
