"use strict";

const STORE_KEY = "kotryna-adventure-xviii-v17";
const MUSIC_FLAG = "kotryna-start-song";
const VIDEO_PEOPLE = [
  { name: "Mom", file: "mom.mp4", icon: "✧" },
  { name: "Sister", file: "sister.mp4", icon: "✧" },
  { name: "Dad", file: "dad.mp4", icon: "✧" },
  { name: "Grandma", file: "grandma.mp4", icon: "✧" },
  { name: "Uncle", file: "uncle.mp4", icon: "✧" },
  { name: "Aunt", file: "aunt.mp4", icon: "✧" },
  {name: "Cousins",file: "cousins.mp4",icon: "✧"},
  { name: "Indraja and Augustas", file: "indraja.mp4", icon: "✧" },
  { name: "Marija", file: "marija.mp4", icon: "✧" },
  { name: "Tėja", file: "teja.mp4", icon: "✧" }
];
// To add another video, add another object above with a filename in the same folder.


// Original interface tones, synthesized locally; no external sound files.
let soundContext = null;
let soundsEnabled = true;
function uiSound(kind = "click") {
  if (!soundsEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    soundContext = soundContext || new AudioCtx();
    if (soundContext.state === "suspended") soundContext.resume();
    const now = soundContext.currentTime;
    const notes = kind === "reward" ? [523.25, 659.25, 783.99] : [660];
    notes.forEach((frequency, index) => {
      const oscillator = soundContext.createOscillator();
      const volume = soundContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      volume.gain.setValueAtTime(0.0001, now + index * 0.085);
      volume.gain.exponentialRampToValueAtTime(0.025, now + index * 0.085 + 0.012);
      volume.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.085 + 0.16);
      oscillator.connect(volume).connect(soundContext.destination);
      oscillator.start(now + index * 0.085);
      oscillator.stop(now + index * 0.085 + 0.17);
    });
  } catch (error) {
    // Sound effects are optional; the rest of the game remains usable.
  }
}

function initInterfaceSounds() {
  document.addEventListener("click", event => {
    const control = event.target.closest("button, .map-pin, .region-card, .nav-item");
    if (control && !control.matches("#musicToggle")) uiSound("click");
  });
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
  } catch (error) {
    return {};
  }
}

const progress = loadProgress();

function saveProgress() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(progress));
  } catch (error) {
    // Site remains playable when storage is disabled.
  }
}

function unlock(key) {
  if (!progress[key]) {
    progress[key] = true;
    saveProgress();
    notify("✦ Achievement unlocked!");
    uiSound("reward");
  }
  updateProgress();
}

function notify(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timeout);
  notify.timeout = setTimeout(() => toast.classList.remove("show"), 2400);
}

function updateProgress() {
  const keys = ["stars", "cat", "runes"];
  const completed = keys.filter(key => progress[key]).length;
  const starTotal = document.querySelector("#starTotal");
  const questsProgress = document.querySelector("#questsProgress");
  const questsFill = document.querySelector("#questsFill");
  const rewards = document.querySelector("#rewards");
  const claim = document.querySelector("#claimReward");

  if (starTotal) starTotal.textContent = completed * 100;
  if (questsProgress) questsProgress.textContent = `${completed} / 3`;
  if (questsFill) questsFill.style.width = `${(completed / 3) * 100}%`;

  if (rewards) {
    rewards.innerHTML = keys.map((key, index) => `
      <div class="reward ${progress[key] ? "earned" : ""}">
        <div>${["✦", "🐾", "◆"][index]}</div>
        <small>${["Jade Sigils", "Guardian", "Runes"][index]}</small>
      </div>
    `).join("");
  }

  if (claim) {
    claim.classList.toggle("locked", completed !== 3);
    claim.textContent = completed === 3
      ? "★ CLAIM LEGENDARY REWARD ➜"
      : `🔒 COMPLETE THREE TRIALS (${completed}/3)`;
  }
}

function initPhotos() {
  const timeline = document.querySelector("#photoTimeline");
  if (!timeline) return;

  for (let age = 1; age <= 18; age++) {
    const card = document.createElement("article");
    card.className = "photo-card";
    card.innerHTML = `
      <div class="photo-top">
        <small>✧ STORY CHAPTER ${String(age).padStart(2, "0")}</small>
        <span>${age} / 18</span>
      </div>
      <div class="photo-frame">
        <img src="photo-age${age}.jpeg" alt="Kotryna at age ${age}" loading="${age < 3 ? "eager" : "lazy"}">
        <div class="photo-missing hidden">
          <span>◈</span>
          Add <code>photo-age${age}.jpeg</code> to this folder
        </div>
      </div>
      <h2>Age ${age}</h2>
      <p>✦ A CHAPTER OF YOUR STORY ✦</p>
    `;

    const photo = card.querySelector("img");
    const placeholder = card.querySelector(".photo-missing");
    const extensions = ["jpeg", "jpg", "png", "webp", "JPG", "JPEG"];
    let attempted = 0;
    photo.addEventListener("error", () => {
      attempted += 1;
      if (attempted < extensions.length) {
        photo.src = `photo-age${age}.${extensions[attempted]}`;
      } else {
        photo.classList.add("hidden");
        placeholder.classList.remove("hidden");
      }
    });

    timeline.append(card);
  }
}

function initMusic() {
  const audio = document.querySelector("#birthdayAudio");
  const toggle = document.querySelector("#musicToggle");
  if (!audio || !toggle) return;

  audio.loop = true;
  audio.volume = 0.65;
  let pending = true;
  const updateButton = () => {
    toggle.textContent = audio.paused ? "▶" : "Ⅱ";
    toggle.setAttribute("aria-label", audio.paused ? "Play music" : "Pause music");
  };

  function tryPlay() {
    if (!pending) return;
    const result = audio.play();
    if (result && typeof result.then === "function") {
      result.then(() => {
        pending = false;
        updateButton();
        removeFallback();
      }).catch(() => {
        updateButton();
        const hint = document.querySelector("#musicHint");
        if (hint) hint.textContent = "Tap anywhere to enable the soundtrack ♪";
      });
    }
  }

  function onFirstInteraction() {
    tryPlay();
  }

  function removeFallback() {
    document.removeEventListener("pointerdown", onFirstInteraction);
    document.removeEventListener("keydown", onFirstInteraction);
  }

  document.addEventListener("pointerdown", onFirstInteraction);
  document.addEventListener("keydown", onFirstInteraction);

  toggle.addEventListener("click", () => {
    if (audio.paused) {
      pending = true;
      tryPlay();
    } else {
      pending = false;
      audio.pause();
      removeFallback();
      updateButton();
    }
  });

  audio.addEventListener("play", updateButton);
  audio.addEventListener("pause", updateButton);
  // Browser autoplay policies may reject sound before any user interaction.
  // An attempted autoplay followed by one-tap fallback is the most reliable option.
  tryPlay();
}

function initStoryLink() {
  document.querySelectorAll("[data-start-story]").forEach(link => {
    link.addEventListener("click", () => {
      sessionStorage.setItem(MUSIC_FLAG, "yes");
    });
  });
}

function initVideos() {
  const list = document.querySelector("#videoList");
  if (!list) return;

  VIDEO_PEOPLE.forEach((person, index) => {
    const article = document.createElement("article");
    article.className = "video-card";
    article.innerHTML = `
      <div class="video-top">
        <span class="video-avatar" aria-hidden="true">✦</span>
        <div>
          <small>VOICE ARCHIVE · ${String(index + 1).padStart(2, "0")}</small>
          <strong>${person.name}</strong>
          <span class="video-status">Birthday message for Kotryna</span>
        </div>
      </div>
      <div class="video-holder">
        <video controls playsinline preload="none" aria-label="Birthday message from ${person.name}">
          <source src="${person.file}" type="video/mp4">
          Your browser does not support video playback.
        </video>
      </div>
      <small class="video-file-note">${person.file}</small>
    `;

    const video = article.querySelector("video");
    video.addEventListener("play", () => {
      document.querySelectorAll("#videoList video").forEach(other => {
        if (other !== video) other.pause();
      });
      const soundtrack = document.querySelector("#birthdayAudio");
      if (soundtrack) soundtrack.pause();
    });
    video.addEventListener("error", () => {
      article.querySelector(".video-status").textContent =
        `Place ${person.file} in the same folder as the HTML files`;
    });
    list.append(article);
  });
}

let starTimer = null;
let starSpawn = null;

function initStarfall() {
  const arena = document.querySelector("#starArena");
  const start = document.querySelector("#startStars");
  if (!arena || !start) return;

  let score = 0;
  let time = 20;

  function showStar() {
    arena.querySelectorAll(".falling-star").forEach(el => el.remove());
    const star = document.createElement("button");
    star.type = "button";
    star.className = "falling-star";
    star.setAttribute("aria-label", "Catch star");
    star.textContent = "✦";
    star.style.left = `${Math.random() * Math.max(0, arena.clientWidth - 62)}px`;
    star.style.top = `${Math.random() * Math.max(0, arena.clientHeight - 62)}px`;
    star.addEventListener("click", () => {
      score++;
      document.querySelector("#catchCount").textContent = score;
      if (score >= 10) {
        stop("✦ Jade Sigil Hunt complete! You caught all ten sigils.");
        unlock("stars");
      } else {
        showStar();
      }
    });
    arena.append(star);
  }

  function stop(message) {
    clearInterval(starTimer);
    clearInterval(starSpawn);
    starTimer = null;
    starSpawn = null;
    arena.innerHTML = `<div class="arena-hint">${message}</div>`;
    start.disabled = false;
    start.textContent = "REPLAY SIGIL HUNT ↻";
  }

  start.addEventListener("click", () => {
    clearInterval(starTimer);
    clearInterval(starSpawn);
    score = 0;
    time = 20;
    document.querySelector("#catchCount").textContent = score;
    document.querySelector("#catchTimer").textContent = time;
    arena.innerHTML = "";
    start.disabled = true;
    start.textContent = "HUNT IN PROGRESS…";
    showStar();
    starSpawn = setInterval(showStar, 1200);
    starTimer = setInterval(() => {
      time--;
      document.querySelector("#catchTimer").textContent = time;
      if (time <= 0) stop("Time is up! Try once more.");
    }, 1000);
  });
}

function initCatCafe() {
  const dialogue = document.querySelector("#catDialogue");
  const countLabel = document.querySelector("#treatCount");
  if (!dialogue || !countLabel) return;
  let fish = 0;
  document.querySelectorAll("[data-treat]").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.treat !== "fish") {
        dialogue.textContent = "Mew… not that one. The guardian is waiting for fish. 🐟";
        return;
      }
      fish = Math.min(3, fish + 1);
      countLabel.textContent = fish;
      dialogue.textContent = fish >= 3
        ? "PURRR! The guardian badge is yours. 💛"
        : `Purr… ${3 - fish} more fish, please! 🐟`;
      if (fish >= 3) unlock("cat");
    });
  });
}

function initRunes() {
  const grid = document.querySelector("#runeGrid");
  if (!grid) return;
  let opened = [];
  let locked = false;
  let matched = 0;
  let moves = 0;
  let turnTimeout = null;
  const symbols = ["☀", "☾", "✿", "✦"];

  function render() {
    clearTimeout(turnTimeout);
    opened = [];
    locked = false;
    matched = 0;
    moves = 0;
    document.querySelector("#pairCount").textContent = matched;
    document.querySelector("#moveCount").textContent = moves;
    grid.innerHTML = "";
    const tiles = [...symbols, ...symbols].sort(() => Math.random() - .5);
    tiles.forEach(symbol => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "rune-tile";
      button.textContent = "✧";
      button.setAttribute("aria-label", "Reveal rune");
      button.dataset.symbol = symbol;
      button.addEventListener("click", () => {
        if (locked || button.disabled || opened.includes(button)) return;
        button.classList.add("open");
        button.textContent = symbol;
        opened.push(button);
        if (opened.length !== 2) return;
        moves++;
        document.querySelector("#moveCount").textContent = moves;
        const [first, second] = opened;
        if (first.dataset.symbol === second.dataset.symbol) {
          first.classList.add("matched");
          second.classList.add("matched");
          first.disabled = true;
          second.disabled = true;
          matched++;
          document.querySelector("#pairCount").textContent = matched;
          opened = [];
          if (matched === 4) unlock("runes");
        } else {
          locked = true;
          turnTimeout = setTimeout(() => {
            first.classList.remove("open");
            second.classList.remove("open");
            first.textContent = "✧";
            second.textContent = "✧";
            opened = [];
            locked = false;
          }, 800);
        }
      });
      grid.append(button);
    });
  }

  document.querySelector("#restartRunes").addEventListener("click", render);
  render();
}

function initTrials() {
  const tabs = [...document.querySelectorAll(".quest-tab")];
  if (!tabs.length) return;
  const panels = { stars: "trialStars", cat: "trialCat", runes: "trialRunes" };
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(other => {
        const active = other === tab;
        other.classList.toggle("active", active);
        other.setAttribute("aria-selected", active ? "true" : "false");
      });
      Object.entries(panels).forEach(([key, id]) => {
        document.getElementById(id).classList.toggle("hidden", key !== tab.dataset.trial);
      });
    });
  });
  initStarfall();
  initCatCafe();
  initRunes();
}

function initNavigation() {
  const toggle = document.querySelector("#menuToggle");
  const nav = document.querySelector("#topNav");
  if (!toggle || !nav) return;

  // Horizontal game menu remains visible on mobile.
  // This button scrolls the current section into view.
  toggle.addEventListener("click", () => {
    nav.scrollIntoView({ behavior: "smooth", block: "nearest" });
    toggle.setAttribute("aria-expanded", "true");
  });
}

function init() {
  initNavigation();
  initInterfaceSounds();
  updateProgress();
  initStoryLink();
  initPhotos();
  initMusic();
  initVideos();
  initTrials();
}

document.addEventListener("DOMContentLoaded", init);
