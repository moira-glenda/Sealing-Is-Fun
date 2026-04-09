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
  missing: "Fill in around five missing words per verse from Revelation 3:14–22.",
  builder: "Rebuild a verse by arranging 5-word phrase cards in the correct order.",
  order: "Drag full verse cards into biblical order from 14 to 22."
};

let currentMode = "missing";

const modeButtons = document.querySelectorAll(".mode-btn");
const gamePanels = {
  missing: document.getElementById("missingGame"),
  builder: document.getElementById("builderGame"),
  order: document.getElementById("orderGame")
};

const modeDescriptionEl = document.getElementById("modeDescription");

// Missing word logic
const missingProgressEl = document.getElementById("missingProgress");
const missingPromptEl = document.getElementById("missingPrompt");
const missingChoicesEl = document.getElementById("missingChoices");
const missingFeedbackEl = document.getElementById("missingFeedback");
const missingScoreEl = document.getElementById("missingScore");
const nextMissingBtn = document.getElementById("nextMissingBtn");
let missingState = {
  score: 0,
  verseIndex: 0,
  blankIndex: 0,
  blankWordIndexes: [],
  answer: "",
  answered: false,
  completed: false
};

// Verse builder
const builderVerseRefEl = document.getElementById("builderVerseRef");
const builderTargetEl = document.getElementById("builderTarget");
const builderWordBankEl = document.getElementById("builderWordBank");
const builderFeedbackEl = document.getElementById("builderFeedback");
const builderScoreEl = document.getElementById("builderScore");
let builderState = { verse: null, bankChunks: [], selectedChunks: [], score: 0 };

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

function getMissingWordIndexesForVerse(verseText) {
  const words = verseText.split(/\s+/);
  const priorityIndexes = [];

  words.forEach((word, index) => {
    if (sanitizeWord(word).length >= 4) {
      priorityIndexes.push(index);
    }
  });

  const chosen = [];
  const step = Math.max(1, Math.floor(priorityIndexes.length / 5));

  for (let i = 0; i < priorityIndexes.length && chosen.length < 5; i += step) {
    chosen.push(priorityIndexes[i]);
  }

  while (chosen.length < Math.min(5, priorityIndexes.length)) {
    const randomIndex = randomItem(priorityIndexes);
    if (!chosen.includes(randomIndex)) {
      chosen.push(randomIndex);
    }
  }

  return chosen.sort((a, b) => a - b);
}

function renderCurrentMissingPrompt() {
  if (missingState.completed) {
    missingProgressEl.textContent = "Completed: Revelation 3:14–22";
    missingPromptEl.innerHTML = "You finished all verses and missing words. Great work!";
    missingChoicesEl.innerHTML = "";
    nextMissingBtn.disabled = true;
    return;
  }

  const verse = verses[missingState.verseIndex];
  const words = verse.text.split(/\s+/);
  const blankWordIndex = missingState.blankWordIndexes[missingState.blankIndex];
  const originalWord = words[blankWordIndex];

  missingState.answer = sanitizeWord(originalWord);

  words[blankWordIndex] = "____";
  const displayText = words.join(" ");

  const distractors = shuffleList(
    verses
      .flatMap((v) => v.text.split(/\s+/))
      .filter((word) => {
        const cleaned = sanitizeWord(word);
        return cleaned.length >= 4 && cleaned !== missingState.answer;
      })
  )
    .slice(0, 3)
    .map(sanitizeWord);

  const choices = shuffleList([missingState.answer, ...distractors]);

  missingProgressEl.textContent = `Verse ${verse.number} • Missing word ${missingState.blankIndex + 1} of ${missingState.blankWordIndexes.length}`;
  missingPromptEl.innerHTML = `<strong>Revelation 3:${verse.number}</strong> — ${displayText}`;

  missingChoicesEl.innerHTML = "";
  choices.forEach((choice) => {
    const button = document.createElement("button");
    button.textContent = choice;
    button.disabled = missingState.answered;
    button.addEventListener("click", () => handleMissingGuess(choice));
    missingChoicesEl.appendChild(button);
  });

  nextMissingBtn.disabled = !missingState.answered;
}

function startMissingVerse(verseIndex) {
  missingState.verseIndex = verseIndex;
  missingState.blankIndex = 0;
  missingState.blankWordIndexes = getMissingWordIndexesForVerse(verses[verseIndex].text);
  missingState.answered = false;
  setFeedback(missingFeedbackEl, "");
  renderCurrentMissingPrompt();
}

function handleMissingGuess(choice) {
  if (missingState.answered || missingState.completed) {
    return;
  }

  if (choice === missingState.answer) {
    missingState.score += 1;
    missingScoreEl.textContent = String(missingState.score);
    missingState.answered = true;
    nextMissingBtn.disabled = false;
    setFeedback(missingFeedbackEl, "Correct! Tap next for the next missing word.", "ok");
  } else {
    setFeedback(missingFeedbackEl, `Not quite. Try again.`, "bad");
  }
}

function moveToNextMissingWord() {
  if (missingState.completed || !missingState.answered) {
    return;
  }

  const atEndOfVerse = missingState.blankIndex >= missingState.blankWordIndexes.length - 1;
  const atEndOfPassage = missingState.verseIndex >= verses.length - 1;

  if (!atEndOfVerse) {
    missingState.blankIndex += 1;
    missingState.answered = false;
    setFeedback(missingFeedbackEl, "");
    renderCurrentMissingPrompt();
    return;
  }

  if (!atEndOfPassage) {
    startMissingVerse(missingState.verseIndex + 1);
    return;
  }

  missingState.completed = true;
  setFeedback(missingFeedbackEl, "Amazing! You reached Revelation 3:22.", "ok");
  renderCurrentMissingPrompt();
}

function buildPhraseChunks(verseText, chunkSize = 5) {
  const words = verseText
    .replace(/[.,;:!?]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }

  return chunks;
}

function createBuilderRound() {
  const verse = randomItem(verses);
  const chunks = buildPhraseChunks(verse.text, 5);

  builderState.verse = verse;
  builderState.selectedChunks = [];
  builderState.bankChunks = shuffleList(chunks.map((chunk, index) => ({ id: `chunk-${index}`, chunk })));

  builderVerseRefEl.textContent = `Build Revelation 3:${verse.number} using phrase cards (~5 words each)`;
  setFeedback(builderFeedbackEl, "");
  renderBuilderZones();
}

function renderBuilderZones() {
  builderTargetEl.innerHTML = "";
  builderWordBankEl.innerHTML = "";

  builderState.selectedChunks.forEach((token, index) => {
    const button = document.createElement("button");
    button.className = "token phrase-token";
    button.textContent = token.chunk;
    button.title = "Tap to remove";
    button.addEventListener("click", () => {
      builderState.bankChunks.push(token);
      builderState.selectedChunks.splice(index, 1);
      renderBuilderZones();
    });
    builderTargetEl.appendChild(button);
  });

  builderState.bankChunks.forEach((token, index) => {
    const button = document.createElement("button");
    button.className = "token phrase-token";
    button.textContent = token.chunk;
    button.addEventListener("click", () => {
      builderState.selectedChunks.push(token);
      builderState.bankChunks.splice(index, 1);
      renderBuilderZones();
    });
    builderWordBankEl.appendChild(button);
  });
}

function checkBuilderAnswer() {
  if (!builderState.verse) return;

  const expected = buildPhraseChunks(builderState.verse.text, 5).map((chunk) => chunk.toLowerCase());
  const actual = builderState.selectedChunks.map((token) => token.chunk.toLowerCase());

  if (expected.length !== actual.length) {
    setFeedback(builderFeedbackEl, "Keep going—use every phrase card in the bank.", "bad");
    return;
  }

  const isCorrect = expected.every((chunk, index) => chunk === actual[index]);

  if (isCorrect) {
    builderState.score += 1;
    builderScoreEl.textContent = String(builderState.score);
    setFeedback(builderFeedbackEl, "Perfect build!", "ok");
  } else {
    setFeedback(builderFeedbackEl, "Phrase order is close, but not correct yet.", "bad");
  }
}

function resetBuilderSelection() {
  builderState.bankChunks = [...builderState.bankChunks, ...builderState.selectedChunks];
  builderState.selectedChunks = [];
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
    li.innerHTML = `<span>${verse.text}</span>`;

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
    setFeedback(orderFeedbackEl, "Excellent! Every verse sentence is in the right order.", "ok");
  } else {
    setFeedback(orderFeedbackEl, "Not quite yet. Keep arranging the cards.", "bad");
  }
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

nextMissingBtn.addEventListener("click", moveToNextMissingWord);

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
  setFeedback(orderFeedbackEl, "Cards reset.");
});

document.getElementById("checkOrderBtn").addEventListener("click", checkOrder);

startMissingVerse(0);
createBuilderRound();
orderCards = shuffleList(orderCards);
renderOrderCards();
setMode("missing");
