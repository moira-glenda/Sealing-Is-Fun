const verses = [
  {
    number: 14,
    text: "To the angel of the church in Laodicea write: These are the words of the Amen, the faithful and true witness, the ruler of God's creation."
  },
  {
    number: 15,
    text: "I know your deeds, that you are neither cold nor hot. I wish you were either one or the other!"
  },
  {
    number: 16,
    text: "So, because you are lukewarm-neither hot nor cold- I am about to spit you out of my mouth."
  },
  {
    number: 17,
    text: "You say, 'I am rich; I have acquired wealth and do not need a thing.' But you do not realize that you are wretched, pitiful, poor, blind and naked."
  },
  {
    number: 18,
    text: "I counsel you to buy from me gold refined in the fire, so you can become rich; and white clothes to wear, so you can cover your shameful nakedness; and salve to put on your eyes, so you can see."
  },
  {
    number: 19,
    text: "Those whom I love I rebuke and discipline. So be earnest, and repent."
  },
  {
    number: 20,
    text: "Here I am! I stand at the door and knock. If anyone hears my voice and opens the door, I will come in and eat with him, and he with me."
  },
  {
    number: 21,
    text: "To him who overcomes, I will give the right to sit with me on my throne, just as I overcame and sat down with my Father on his throne."
  },
  {
    number: 22,
    text: "He who has an ear, let him hear what the Spirit says to the churches."
  }
];

const modeDescription = {
  missing: "Fill in the missing words from a verse.",
  builder: "Rebuild a verse by selecting words in the correct order.",
  order: "Drag verses into biblical order from 14 to 22."
};

let currentMode = "missing";
let showNumbers = true;

const modeButtons = document.querySelectorAll(".mode-btn");
const gamePanels = {
  missing: document.getElementById("missingGame"),
  builder: document.getElementById("builderGame"),
  order: document.getElementById("orderGame")
};

const modeDescriptionEl = document.getElementById("modeDescription");

// Missing word logic
const missingPromptEl = document.getElementById("missingPrompt");
const missingChoicesEl = document.getElementById("missingChoices");
const missingFeedbackEl = document.getElementById("missingFeedback");
const missingScoreEl = document.getElementById("missingScore");
let missingState = { answer: "", score: 0 };

// Verse builder
const builderVerseRefEl = document.getElementById("builderVerseRef");
const builderTargetEl = document.getElementById("builderTarget");
const builderWordBankEl = document.getElementById("builderWordBank");
const builderFeedbackEl = document.getElementById("builderFeedback");
const builderScoreEl = document.getElementById("builderScore");
let builderState = { verse: null, bankWords: [], selectedWords: [], score: 0 };

// Order cards
const cardsEl = document.getElementById("cards");
const orderFeedbackEl = document.getElementById("orderFeedback");
let orderCards = [...verses];
let dragSource = null;

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffleList(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function sanitizeWord(word) {
  return word.toLowerCase().replace(/[^a-z']/gi, "");
}

function setMode(mode) {
  currentMode = mode;
  modeButtons.forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
  Object.entries(gamePanels).forEach(([key, panel]) => {
    panel.classList.toggle("hidden", key !== mode);
  });
  modeDescriptionEl.textContent = modeDescription[mode];
}

function setFeedback(el, message, type = "") {
  el.textContent = message;
  el.classList.remove("ok", "bad");
  if (type) {
    el.classList.add(type);
  }
}

function createMissingPuzzle() {
  const verse = randomItem(verses);
  const words = verse.text.split(/\s+/);
  const candidates = words.filter((word) => sanitizeWord(word).length > 3);

  if (candidates.length < 1) {
    createMissingPuzzle();
    return;
  }

  const answerWord = randomItem(candidates);
  const answer = sanitizeWord(answerWord);

  const displayText = verse.text.replace(answerWord, "____");

  const distractors = shuffleList(
    verses
      .flatMap((v) => v.text.split(/\s+/))
      .filter((word) => {
        const cleaned = sanitizeWord(word);
        return cleaned.length > 3 && cleaned !== answer;
      })
  )
    .slice(0, 3)
    .map(sanitizeWord);

  const choices = shuffleList([answer, ...distractors]);

  missingState.answer = answer;

  missingPromptEl.innerHTML = `<strong>Verse ${verse.number}:</strong> ${displayText}`;
  missingChoicesEl.innerHTML = "";

  choices.forEach((choice) => {
    const button = document.createElement("button");
    button.textContent = choice;
    button.addEventListener("click", () => {
      if (choice === missingState.answer) {
        missingState.score += 1;
        missingScoreEl.textContent = String(missingState.score);
        setFeedback(missingFeedbackEl, "Correct! Great memory.", "ok");
      } else {
        setFeedback(missingFeedbackEl, `Not quite. Correct word: ${missingState.answer}.`, "bad");
      }
    });
    missingChoicesEl.appendChild(button);
  });

  setFeedback(missingFeedbackEl, "");
}

function createBuilderRound() {
  const verse = randomItem(verses);
  const words = verse.text
    .replace(/[.,;:!?]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  builderState.verse = verse;
  builderState.selectedWords = [];
  builderState.bankWords = shuffleList(words.map((word, index) => ({ id: `${word}-${index}`, word })));

  builderVerseRefEl.textContent = `Build verse ${verse.number}`;
  setFeedback(builderFeedbackEl, "");
  renderBuilderZones();
}

function renderBuilderZones() {
  builderTargetEl.innerHTML = "";
  builderWordBankEl.innerHTML = "";

  builderState.selectedWords.forEach((token, index) => {
    const button = document.createElement("button");
    button.className = "token";
    button.textContent = token.word;
    button.title = "Tap to remove";
    button.addEventListener("click", () => {
      builderState.bankWords.push(token);
      builderState.selectedWords.splice(index, 1);
      renderBuilderZones();
    });
    builderTargetEl.appendChild(button);
  });

  builderState.bankWords.forEach((token, index) => {
    const button = document.createElement("button");
    button.className = "token";
    button.textContent = token.word;
    button.addEventListener("click", () => {
      builderState.selectedWords.push(token);
      builderState.bankWords.splice(index, 1);
      renderBuilderZones();
    });
    builderWordBankEl.appendChild(button);
  });
}

function checkBuilderAnswer() {
  if (!builderState.verse) return;

  const expected = builderState.verse.text
    .replace(/[.,;:!?]/g, "")
    .split(/\s+/)
    .map((word) => word.toLowerCase());

  const actual = builderState.selectedWords.map((token) => token.word.toLowerCase());

  if (expected.length !== actual.length) {
    setFeedback(builderFeedbackEl, "Keep going—use every word in the bank.", "bad");
    return;
  }

  const isCorrect = expected.every((word, index) => word === actual[index]);

  if (isCorrect) {
    builderState.score += 1;
    builderScoreEl.textContent = String(builderState.score);
    setFeedback(builderFeedbackEl, "Perfect build!", "ok");
  } else {
    setFeedback(builderFeedbackEl, "Order is close, but not correct yet.", "bad");
  }
}

function resetBuilderSelection() {
  builderState.bankWords = [...builderState.bankWords, ...builderState.selectedWords];
  builderState.selectedWords = [];
  renderBuilderZones();
  setFeedback(builderFeedbackEl, "Selection cleared.");
}

function renderOrderCards() {
  cardsEl.innerHTML = "";

  orderCards.forEach((verse, idx) => {
    const li = document.createElement("li");
    li.className = "card";
    li.draggable = true;
    li.dataset.index = String(idx);
    li.innerHTML = `
      ${showNumbers ? `<span class="verse-num">${verse.number}</span>` : ""}
      <span>${verse.text}</span>
    `;

    li.addEventListener("dragstart", (event) => {
      dragSource = Number(event.currentTarget.dataset.index);
      event.currentTarget.classList.add("dragging");
    });

    li.addEventListener("dragover", (event) => event.preventDefault());

    li.addEventListener("drop", (event) => {
      event.preventDefault();
      const target = Number(event.currentTarget.dataset.index);
      if (dragSource === null || dragSource === target) return;
      const moved = orderCards.splice(dragSource, 1)[0];
      orderCards.splice(target, 0, moved);
      dragSource = null;
      renderOrderCards();
    });

    li.addEventListener("dragend", (event) => {
      event.currentTarget.classList.remove("dragging");
    });

    cardsEl.appendChild(li);
  });
}

function checkOrder() {
  const correct = orderCards.every((verse, index) => verse.number === 14 + index);
  if (correct) {
    setFeedback(orderFeedbackEl, "Excellent! Every card is in the right order.", "ok");
  } else {
    setFeedback(orderFeedbackEl, "Not quite yet. Keep arranging the cards.", "bad");
  }
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

document.getElementById("nextMissingBtn").addEventListener("click", createMissingPuzzle);

document.getElementById("newBuilderBtn").addEventListener("click", createBuilderRound);
document.getElementById("checkBuilderBtn").addEventListener("click", checkBuilderAnswer);
document.getElementById("resetBuilderBtn").addEventListener("click", resetBuilderSelection);

document.getElementById("shuffleBtn").addEventListener("click", () => {
  orderCards = shuffleList(orderCards);
  renderOrderCards();
  setFeedback(orderFeedbackEl, "Cards shuffled.");
});

document.getElementById("resetOrderBtn").addEventListener("click", () => {
  orderCards = [...verses];
  renderOrderCards();
  setFeedback(orderFeedbackEl, "Order reset to 14 → 22.");
});

document.getElementById("toggleNumbersBtn").addEventListener("click", () => {
  showNumbers = !showNumbers;
  renderOrderCards();
});

document.getElementById("checkOrderBtn").addEventListener("click", checkOrder);

createMissingPuzzle();
createBuilderRound();
orderCards = shuffleList(orderCards);
renderOrderCards();
setMode("missing");
