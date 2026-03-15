const REVELATION_VERSE_COUNTS = [
  20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19,
  17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21
];

/**
 * IMPORTANT:
 * - To use exact NIV text, provide licensed text below by ref.
 * - Keep the key format as "chapter:verse" (example: "3:7").
 */
const NIV_TEXT_BY_REF = {
  // "1:1": "The revelation from Jesus Christ...",
};

const revelationData = REVELATION_VERSE_COUNTS.map((count, chapterIndex) => {
  const chapter = chapterIndex + 1;
  const verses = Array.from({ length: count }, (_, verseIndex) => {
    const verse = verseIndex + 1;
    const key = `${chapter}:${verse}`;
    const text = NIV_TEXT_BY_REF[key] || `[Add licensed NIV text for Revelation ${chapter}:${verse}]`;

    return {
      verse,
      ref: `Revelation ${chapter}:${verse}`,
      text,
    };
  });

  return { chapter, verses };
});

function getChapterData(chapterNumber) {
  return revelationData.find((chapter) => chapter.chapter === chapterNumber);
}

function getVerseData(chapterNumber, verseNumber) {
  const chapter = getChapterData(chapterNumber);
  if (!chapter) return null;
  return chapter.verses.find((verse) => verse.verse === verseNumber) || null;
}
