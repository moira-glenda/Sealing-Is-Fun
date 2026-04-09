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
  missing: "Drag answer chips into missing word slots for each verse.",
  builder: "Rebuild a verse by arranging phrase cards in the correct order.",
  order: "Drag full verse cards into biblical order."
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
  blankWordIndexes: [],
  correctAnswers: [],
  assignments: [],
  bankChoices: [],
  completed: false,
  solvedCurrentVerse: false
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

function getMissingWordIndexesForVerse(verseText, count = 6) {
  const words = verseText.split(/\s+/);
  const priorityIndexes = [];

  words.forEach((word, index) => {
    if (sanitizeWord(word).length >= 4) {
      priorityIndexes.push(index);
    }
  });

  const targetCount = Math.min(count, priorityIndexes.length);
  const chosen = [];
  const step = Math.max(1, Math.floor(priorityIndexes.length / targetCount));

  for (let i = 0; i < priorityIndexes.length && chosen.length < targetCount; i += step) {
    chosen.push(priorityIndexes[i]);
  }

  while (chosen.length < targetCount) {
    const randomIndex = randomItem(priorityIndexes);
    if (!chosen.includes(randomIndex)) {
      chosen.push(randomIndex);
    }
  }

  return chosen.sort((a, b) => a - b);
}

function getConfusingDistractors(answerSet) {
  const allWords = verses
    .flatMap((v) => v.text.split(/\s+/).map(sanitizeWord))
    .filter((word) => word.length >= 4 && !answerSet.has(word));

  const distractors = [];

  missingState.correctAnswers.forEach((answer) => {
    const candidates = allWords.filter((word) => {
      const startsSame = word[0] === answer[0];
      const closeLength = Math.abs(word.length - answer.length) <= 2;
      return startsSame || closeLength;
    });

    const picked = candidates.find((word) => !distractors.includes(word));
    if (picked) {
      distractors.push(picked);
    }
  });

  while (distractors.length < 6 && allWords.length) {
    const candidate = randomItem(allWords);
    if (!distractors.includes(candidate)) {
      distractors.push(candidate);
    }
  }

  return distractors.slice(0, 6);
}

function evaluateMissingVerse() {
  const allFilled = missingState.assignments.every((word) => Boolean(word));

  if (!allFilled) {
    missingState.solvedCurrentVerse = false;
    nextMissingBtn.disabled = true;
    return;
  }

  const isCorrect = missingState.assignments.every((word, index) => {
    return sanitizeWord(word) === missingState.correctAnswers[index];
  });

  if (isCorrect) {
    if (!missingState.solvedCurrentVerse) {
      missingState.score += missingState.correctAnswers.length;
      missingScoreEl.textContent = String(missingState.score);
    }

    missingState.solvedCurrentVerse = true;
    nextMissingBtn.disabled = false;
    setFeedback(missingFeedbackEl, "Perfect! All 6 missing words are correct. Tap next verse.", "ok");
  } else {
    missingState.solvedCurrentVerse = false;
    nextMissingBtn.disabled = true;
    setFeedback(missingFeedbackEl, "Some words are misplaced. Drag words to new slots until all are correct.", "bad");
  }
}

function renderCurrentMissingPrompt() {
  if (missingState.completed) {
    missingProgressEl.textContent = "Completed: Revelation 3:14–22";
    missingPromptEl.innerHTML = "You finished all verses and drag-and-drop words. Great work!";
    missingChoicesEl.innerHTML = "";
    nextMissingBtn.disabled = true;
    return;
  }

  const verse = verses[missingState.verseIndex];
  const words = verse.text.split(/\s+/);

  missingState.blankWordIndexes.forEach((wordIndex, slotIndex) => {
    const assigned = missingState.assignments[slotIndex];
    const slotText = assigned || "drop";
    words[wordIndex] = `<span class="blank-slot" data-slot-index="${slotIndex}">${slotText}</span>`;
  });

  missingProgressEl.textContent = `Verse ${verse.number} • Place all 6 missing words`;
  missingPromptEl.innerHTML = `<strong>Revelation 3:${verse.number}</strong> — ${words.join(" ")}`;

  missingPromptEl.querySelectorAll(".blank-slot").forEach((slot) => {
    slot.addEventListener("dragover", (event) => {
      event.preventDefault();
      slot.classList.add("drag-over");
    });

    slot.addEventListener("dragleave", () => {
      slot.classList.remove("drag-over");
    });

    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      slot.classList.remove("drag-over");
      const word = event.dataTransfer.getData("text/plain");
      if (!word) return;

      const slotIndex = Number(slot.dataset.slotIndex);
      assignMissingWordToSlot(word, slotIndex);
    });

    slot.addEventListener("click", () => {
      const slotIndex = Number(slot.dataset.slotIndex);
      const assignedWord = missingState.assignments[slotIndex];
      if (!assignedWord) return;
      missingState.assignments[slotIndex] = "";
      missingState.bankChoices.push(assignedWord);
      renderCurrentMissingPrompt();
      evaluateMissingVerse();
    });
  });

  missingChoicesEl.innerHTML = "";
  missingState.bankChoices.forEach((choice, index) => {
    const token = document.createElement("button");
    token.className = "choice-chip";
    token.draggable = true;
    token.textContent = choice;
    token.dataset.choiceIndex = String(index);

    token.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", choice);
    });

    token.addEventListener("click", () => {
      const firstEmptySlot = missingState.assignments.findIndex((word) => !word);
      if (firstEmptySlot !== -1) {
        assignMissingWordToSlot(choice, firstEmptySlot);
      }
    });

    missingChoicesEl.appendChild(token);
  });
}

function assignMissingWordToSlot(word, slotIndex) {
  const bankIndex = missingState.bankChoices.indexOf(word);
  if (bankIndex === -1) return;

  const currentWordInSlot = missingState.assignments[slotIndex];
  if (currentWordInSlot) {
    missingState.bankChoices.push(currentWordInSlot);
  }

  missingState.assignments[slotIndex] = word;
  missingState.bankChoices.splice(bankIndex, 1);

  renderCurrentMissingPrompt();
  evaluateMissingVerse();
}

function startMissingVerse(verseIndex) {
  missingState.verseIndex = verseIndex;
  missingState.blankWordIndexes = getMissingWordIndexesForVerse(verses[verseIndex].text, 6);

  const words = verses[verseIndex].text.split(/\s+/);
  missingState.correctAnswers = missingState.blankWordIndexes.map((wordIndex) => sanitizeWord(words[wordIndex]));
  missingState.assignments = Array(missingState.blankWordIndexes.length).fill("");

  const answerSet = new Set(missingState.correctAnswers);
  const distractors = getConfusingDistractors(answerSet);
  missingState.bankChoices = shuffleList([...missingState.correctAnswers, ...distractors]).slice(0, 12);

  missingState.solvedCurrentVerse = false;
  nextMissingBtn.disabled = true;
  setFeedback(missingFeedbackEl, "Drag each answer chip into the right blank. Tap a filled blank to remove it.");
  renderCurrentMissingPrompt();
}

function moveToNextMissingWord() {
  if (missingState.completed || !missingState.solvedCurrentVerse) {
    return;
  }

  const atEndOfPassage = missingState.verseIndex >= verses.length - 1;

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
