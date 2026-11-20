const get = (id) => document.getElementById(id);
const sentence = get("sentence");
const advance = get("advance");
const english = get("english");
const translation = get("translation");
let questions;
let index;
let correctCount;
let stage;

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function createTest() {
  const groups = new Map();
  for (const line of questionBank.trim().split(/\r?\n/)) {
    const [topic, template, english, reason] = line.split("|");
    const [, before, correct, incorrect, after] = template.match(/^(.*)\{([^/]+)\/([^}]+)\}(.*)$/);
    if (!groups.has(topic)) groups.set(topic, []);
    groups.get(topic).push({ before, correct, incorrect, after, english, reason });
  }
  const items = [];
  for (const group of groups.values()) {
    shuffle(group).forEach((item, i) => {
      items.push({ ...item, isTrue: i < group.length / 2 });
    });
  }
  return shuffle(items);
}

function showQuestion(focus) {
  const question = questions[index];
  const verb = document.createElement("strong");
  verb.textContent = question.isTrue ? question.correct : question.incorrect;
  sentence.lang = "es";
  sentence.replaceChildren(question.before, verb, question.after);
  get("position").textContent = `Question ${index + 1} of ${questions.length}`;
  get("choices").hidden = false;
  for (const id of ["result", "explanation", "translation", "english", "advance"]) get(id).hidden = true;
  english.textContent = "Show English";
  english.setAttribute("aria-expanded", "false");
  stage = "answer";
  if (focus) sentence.focus();
}

function updateScore(answered) {
  get("score").textContent = `Score ${correctCount}/${answered}`;
  get("progress").value = answered;
}

function start(focus = false) {
  questions = createTest();
  index = 0;
  correctCount = 0;
  updateScore(0);
  showQuestion(focus);
}

function answer(choice) {
  if (stage !== "answer") return;
  const question = questions[index];
  const right = choice === question.isTrue;
  if (right) correctCount++;
  updateScore(index + 1);
  const result = get("result");
  result.className = right ? "right" : "wrong";
  result.textContent = right ? "Right!" : "Wrong.";
  result.hidden = false;
  get("choices").hidden = true;
  if (!right) {
    const correctedVerb = document.createElement("strong");
    correctedVerb.textContent = question.correct;
    get("correction").replaceChildren(question.before, correctedVerb, question.after);
    get("reason").textContent = question.reason;
    get("explanation").hidden = false;
    translation.textContent = question.english;
    english.hidden = false;
  }
  stage = "next";
  advance.textContent = index + 1 === questions.length ? "See final score" : "Next question";
  advance.hidden = false;
  result.focus({ preventScroll: true });
  result.scrollIntoView({ block: "start" });
}

get("true").addEventListener("click", () => answer(true));
get("false").addEventListener("click", () => answer(false));
english.addEventListener("click", () => {
  translation.hidden = !translation.hidden;
  english.textContent = translation.hidden ? "Show English" : "Hide English";
  english.setAttribute("aria-expanded", String(!translation.hidden));
});
advance.addEventListener("click", () => {
  switch (stage) {
    case "next":
      index++;
      if (index < questions.length) {
        showQuestion(true);
        break;
      }
      sentence.lang = "en";
      sentence.textContent = "Test complete";
      get("position").textContent = "100 questions answered";
      get("result").className = "";
      get("result").textContent = `You got ${correctCount} out of ${questions.length} correct.`;
      get("explanation").hidden = true;
      translation.hidden = true;
      english.hidden = true;
      advance.textContent = "Start a new test";
      stage = "restart";
      sentence.focus();
      break;
    case "restart":
      start(true);
  }
});

start();
