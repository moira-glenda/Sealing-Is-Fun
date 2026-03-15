const STORAGE_KEY = "revelation-progress";
const STOP_WORDS = new Set([
  "the", "and", "or", "to", "of", "in", "a", "an", "is", "it", "for", "on", "at", "as", "by", "with", "from", "that", "this", "be", "are", "was", "were", "has", "had", "have", "will", "shall", "you", "your", "their", "they", "he", "she", "we", "i", "his", "her", "them", "who", "what", "when", "where", "how", "not"
]);

const DISTRACTORS = {
  place: ["Jerusalem", "Babylon", "Ephesus", "Smyrna", "Pergamum", "Laodicea"],
  person: ["John", "Peter", "Paul", "David", "Moses", "Elijah"],
  object: ["scroll", "lampstand", "trumpet", "crown", "altar", "sword"],
  concept: ["faith", "glory", "judgment", "mercy", "kingdom", "victory"]
};

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveVerseComplete(chapter, verse) {
  const progress = getProgress();
  const key = `${chapter}:${verse}`;
  progress[key] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function chapterProgress(chapter) {
  const progress = getProgress();
  const chapterData = getChapterData(chapter);
  const total = chapterData?.verses.length || 0;
  const done = chapterData?.verses.filter((v) => progress[`${chapter}:${v.verse}`]).length || 0;
  return { done, total };
}

function params() {
  return new URLSearchParams(window.location.search);
}

function onChaptersPage() {
  const root = document.getElementById("chapters-grid");
  if (!root) return;

  revelationData.forEach((chapterData) => {
    const { done, total } = chapterProgress(chapterData.chapter);
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <h3>Chapter ${chapterData.chapter}</h3>
      <p>${done}/${total} verses mastered</p>
      <a class="btn btn-primary" href="chapter.html?chapter=${chapterData.chapter}">Open Chapter</a>
    `;
    root.appendChild(card);
  });
}

function onChapterPage() {
  const root = document.getElementById("verses-grid");
  const title = document.getElementById("chapter-title");
  if (!root || !title) return;

  const chapter = Number(params().get("chapter") || 1);
  const chapterData = getChapterData(chapter);
  if (!chapterData) {
    title.textContent = "Chapter not found";
    return;
  }

  title.textContent = `Revelation Chapter ${chapter}`;

  chapterData.verses.forEach((verseData) => {
    const card = document.createElement("article");
    card.className = "verse-card";
    card.innerHTML = `
      <h3>${verseData.ref}</h3>
      <p>${previewText(verseData.text)}</p>
      <a class="btn btn-primary" href="verse.html?chapter=${chapter}&verse=${verseData.verse}">Practice Verse</a>
    `;
    root.appendChild(card);
  });
}

function previewText(text) {
  if (text.length <= 110) return text;
  return `${text.slice(0, 110)}...`;
}

function tokenize(text) {
  return text
    .replace(/[“”"']/g, "")
    .split(/(\s+)/)
    .filter(Boolean);
}

function cleanWord(word) {
  return word.toLowerCase().replace(/[^a-z0-9]/gi, "");
}

function inferCategory(word) {
  if (/^[A-Z][a-z]+/.test(word)) return "person";
  if (["city", "temple", "island", "earth", "heaven"].includes(cleanWord(word))) return "place";
  if (["scroll", "sword", "crown", "altar", "lampstand", "trumpet"].includes(cleanWord(word))) return "object";
  return "concept";
}

function pickMeaningfulWords(text, max = 3) {
  const words = text.split(/\s+/).map((w) => w.trim()).filter(Boolean);
  const candidates = words.filter((word) => {
    const cleaned = cleanWord(word);
    return cleaned.length > 4 && !STOP_WORDS.has(cleaned);
  });

  const unique = [...new Set(candidates)];
  return unique.slice(0, Math.min(max, unique.length));
}

function chunkVerse(text) {
  const chunks = text
    .split(/(?<=[,;:.!?])\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length >= 2) return chunks;

  const words = text.split(/\s+/);
  const size = Math.max(3, Math.ceil(words.length / 3));
  const rebuilt = [];
  for (let i = 0; i < words.length; i += size) {
    rebuilt.push(words.slice(i, i + size).join(" "));
  }
  return rebuilt;
}

function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function onVersePage() {
  const refNode = document.getElementById("verse-ref");
  const textNode = document.getElementById("verse-text");
  const tabsNode = document.getElementById("mode-tabs");
  const contentNode = document.getElementById("mode-content");
  const backLink = document.getElementById("back-to-chapter");
  if (!refNode || !textNode || !tabsNode || !contentNode || !backLink) return;

  const chapter = Number(params().get("chapter") || 1);
  const verse = Number(params().get("verse") || 1);
  const verseData = getVerseData(chapter, verse);

  if (!verseData) {
    refNode.textContent = "Verse not found";
    return;
  }

  backLink.href = `chapter.html?chapter=${chapter}`;
  refNode.textContent = `${verseData.ref} (NIV)`;
  textNode.textContent = verseData.text;

  const state = {
    chapter,
    verse,
    verseData,
    unlocked: 0,
    completed: [false, false, false, false],
  };

  const modes = [
    { key: "missing", label: "Missing Word Quiz", render: renderMissingQuiz },
    { key: "builder", label: "Verse Builder", render: renderBuilder },
    { key: "order", label: "Order the Verse", render: renderOrder },
    { key: "review", label: "Review / Read", render: renderReview }
  ];

  function refreshTabs(activeIndex) {
    tabsNode.innerHTML = "";
    modes.forEach((mode, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `tab-btn ${idx === activeIndex ? "active" : ""}`;
      const isLocked = idx > state.unlocked;
      btn.disabled = isLocked;
      btn.textContent = `${idx + 1}. ${mode.label}${state.completed[idx] ? " ✓" : ""}`;
      btn.addEventListener("click", () => mountMode(idx));
      tabsNode.appendChild(btn);
    });
  }

  function markComplete(index) {
    state.completed[index] = true;
    state.unlocked = Math.max(state.unlocked, index + 1);
    if (state.completed.every(Boolean)) {
      saveVerseComplete(chapter, verse);
    }
  }

  function mountMode(index) {
    refreshTabs(index);
    contentNode.innerHTML = "";
    modes[index].render(contentNode, verseData.text, () => {
      markComplete(index);
      refreshTabs(index);
      if (index < modes.length - 1) {
        mountMode(index + 1);
      }
    });
  }

  mountMode(0);
}

function renderMissingQuiz(root, text, onPass) {
  const chosenWords = pickMeaningfulWords(text, 3);

  if (chosenWords.length === 0) {
    root.innerHTML = `<p>Provide licensed NIV verse text in data.js to play this mode.</p>`;
    const btn = document.createElement("button");
    btn.className = "btn btn-primary";
    btn.textContent = "Mark as Reviewed";
    btn.onclick = onPass;
    root.appendChild(btn);
    return;
  }

  const answers = [];
  let modified = text;

  chosenWords.forEach((word, i) => {
    const slot = `____(${i + 1})____`;
    modified = modified.replace(word, slot);
    answers.push({ slot, word });
  });

  const wrap = document.createElement("div");
  wrap.innerHTML = `<p class="exercise-text">${modified}</p>`;

  const userAnswers = {};

  answers.forEach(({ slot, word }, idx) => {
    const cat = inferCategory(word);
    const opts = shuffled([word, ...DISTRACTORS[cat].filter((d) => d !== word).slice(0, 3)]);

    const group = document.createElement("div");
    group.className = "quiz-group";
    group.innerHTML = `<p><strong>Blank ${idx + 1}</strong></p>`;

    opts.forEach((opt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-option";
      b.textContent = opt;
      b.onclick = () => {
        userAnswers[slot] = opt;
        [...group.querySelectorAll(".btn-option")].forEach((node) => node.classList.remove("selected"));
        b.classList.add("selected");
      };
      group.appendChild(b);
    });

    wrap.appendChild(group);
  });

  const status = document.createElement("p");
  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary";
  checkBtn.textContent = "Check Answers";
  checkBtn.onclick = () => {
    const done = answers.every((a) => userAnswers[a.slot]);
    if (!done) {
      status.textContent = "Please fill all blanks first.";
      return;
    }

    const ok = answers.every((a) => userAnswers[a.slot] === a.word);
    if (ok) {
      status.textContent = "Great job! Moving to Verse Builder.";
      onPass();
    } else {
      status.textContent = "Not quite. Try again with the same verse.";
      wrap.querySelectorAll(".btn-option").forEach((btn) => btn.classList.remove("selected"));
      Object.keys(userAnswers).forEach((k) => delete userAnswers[k]);
    }
  };

  wrap.appendChild(checkBtn);
  wrap.appendChild(status);
  root.appendChild(wrap);
}

function renderBuilder(root, text, onPass) {
  const words = pickMeaningfulWords(text, 4);
  if (!words.length) {
    root.innerHTML = `<p>Provide licensed NIV verse text in data.js to play this mode.</p>`;
    const btn = document.createElement("button");
    btn.className = "btn btn-primary";
    btn.textContent = "Continue";
    btn.onclick = onPass;
    root.appendChild(btn);
    return;
  }

  let masked = text;
  words.forEach((w, idx) => {
    masked = masked.replace(w, `[${idx + 1}]`);
  });

  const slots = Array(words.length).fill(null);
  const choices = shuffled(words);

  const textNode = document.createElement("p");
  textNode.className = "exercise-text";
  textNode.textContent = masked;

  const slotsNode = document.createElement("div");
  slotsNode.className = "slots";

  function redrawSlots() {
    slotsNode.innerHTML = "";
    slots.forEach((val, idx) => {
      const s = document.createElement("button");
      s.type = "button";
      s.className = "slot";
      s.textContent = val || `Blank ${idx + 1}`;
      s.onclick = () => {
        if (val) {
          choices.push(val);
          slots[idx] = null;
          redrawChoices();
          redrawSlots();
        }
      };
      slotsNode.appendChild(s);
    });
  }

  const choiceNode = document.createElement("div");
  choiceNode.className = "choices";

  function redrawChoices() {
    choiceNode.innerHTML = "";
    choices.forEach((choice, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-option";
      b.textContent = choice;
      b.onclick = () => {
        const target = slots.findIndex((s) => s === null);
        if (target === -1) return;
        slots[target] = choice;
        choices.splice(idx, 1);
        redrawChoices();
        redrawSlots();
      };
      choiceNode.appendChild(b);
    });
  }

  const status = document.createElement("p");
  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary";
  checkBtn.textContent = "Check Build";

  checkBtn.onclick = () => {
    if (slots.some((s) => !s)) {
      status.textContent = "Fill every blank before checking.";
      return;
    }
    const correct = slots.every((s, idx) => s === words[idx]);
    if (correct) {
      status.textContent = "Excellent! Moving to Order the Verse.";
      onPass();
    } else {
      status.textContent = "Incorrect. Resetting all blanks. Build again.";
      for (let i = 0; i < slots.length; i += 1) {
        if (slots[i]) choices.push(slots[i]);
        slots[i] = null;
      }
      redrawChoices();
      redrawSlots();
    }
  };

  redrawChoices();
  redrawSlots();
  root.append(textNode, slotsNode, choiceNode, checkBtn, status);
}

function renderOrder(root, text, onPass) {
  let chunks = chunkVerse(text);
  let bank = shuffled(chunks);
  let arranged = [];

  const bankNode = document.createElement("div");
  bankNode.className = "choices";
  const arrangedNode = document.createElement("div");
  arrangedNode.className = "slots";

  function redraw() {
    bankNode.innerHTML = "";
    arrangedNode.innerHTML = "";

    arranged.forEach((chunk, idx) => {
      const b = document.createElement("button");
      b.className = "slot";
      b.textContent = chunk;
      b.onclick = () => {
        bank.push(chunk);
        arranged.splice(idx, 1);
        redraw();
      };
      arrangedNode.appendChild(b);
    });

    bank.forEach((chunk, idx) => {
      const b = document.createElement("button");
      b.className = "btn btn-option";
      b.textContent = chunk;
      b.onclick = () => {
        arranged.push(chunk);
        bank.splice(idx, 1);
        redraw();
      };
      bankNode.appendChild(b);
    });
  }

  const status = document.createElement("p");
  const checkBtn = document.createElement("button");
  checkBtn.className = "btn btn-primary";
  checkBtn.textContent = "Check Order";
  checkBtn.onclick = () => {
    if (arranged.length !== chunks.length) {
      status.textContent = "Place all chunks first.";
      return;
    }

    const ok = arranged.every((chunk, idx) => chunk === chunks[idx]);
    if (ok) {
      status.textContent = "Perfect order! Review mode unlocked.";
      onPass();
    } else {
      status.textContent = "Wrong order. Resetting and reshuffling.";
      arranged = [];
      bank = shuffled(chunks);
      redraw();
    }
  };

  redraw();
  root.append(arrangedNode, bankNode, checkBtn, status);
}

function renderReview(root, text, onPass) {
  const p = document.createElement("p");
  p.className = "verse-text";
  p.textContent = text;

  let hidden = false;
  const toggle = document.createElement("button");
  toggle.className = "btn btn-option";
  toggle.textContent = "Hide / Reveal";
  toggle.onclick = () => {
    hidden = !hidden;
    p.textContent = hidden ? "████████████████" : text;
  };

  const done = document.createElement("button");
  done.className = "btn btn-primary";
  done.textContent = "Mark Verse Mastered";
  done.onclick = () => {
    onPass();
    done.disabled = true;
    done.textContent = "Verse Mastered ✓";
  };

  root.append(p, toggle, done);
}

onChaptersPage();
onChapterPage();
onVersePage();
