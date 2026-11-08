"use strict";

const STORE_KEY = "kotryna-birthday-rpg-v5";
const MUSIC_FLAG = "kotryna-start-song";
const VIDEO_PEOPLE = [
  { name: "Dad", file: "dad.mp4", icon: "👨" },
  { name: "Mom", file: "mom.mp4", icon: "💗" },
  { name: "Sister", file: "sister.mp4", icon: "🌸" },
  { name: "Marija", file: "marija.mp4", icon: "✨" },
  { name: "Tėja", file: "teja.mp4", icon: "🌙" },
  { name: "Grandma", file: "grandma.mp4", icon: "🌼" },
  { name: "Indraja", file: "indraja.mp4", icon: "💫" }
];
// To add another video, add another object above with a filename in the same folder.

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
    notify("✦ Achievement unlocked! +100 stars");
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
        <div>${["✦", "🐾", "☽"][index]}</div>
        <small>${["Starfall", "Cat Café", "Rune Match"][index]}</small>
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

  const updateButton = () => {
    toggle.textContent = audio.paused ? "▶" : "Ⅱ";
    toggle.setAttribute("aria-label", audio.paused ? "Play music" : "Pause music");
  };

  const playSong = () => {
    audio.play().then(updateButton).catch(() => {
      notify("Tap ▶ to start the birthday song ♪");
    });
  };

  toggle.addEventListener("click", () => {
    if (audio.paused) {
      playSong();
    } else {
      audio.pause();
      updateButton();
    }
  });

  audio.addEventListener("play", updateButton);
  audio.addEventListener("pause", updateButton);

  if (sessionStorage.getItem(MUSIC_FLAG) === "yes") {
    sessionStorage.removeItem(MUSIC_FLAG);
    playSong();
  }
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
        <span class="video-avatar">${person.icon}</span>
        <div>
          <small>MESSAGE ${String(index + 1).padStart(2, "0")}</small>
          <strong>${person.name}</strong>
          <span class="video-status">A message waiting for you</span>
        </div>
      </div>
      <button class="game-button secondary video-trigger" type="button">✉ OPEN MESSAGE</button>
      <div class="video-holder"></div>
    `;

    const button = article.querySelector(".video-trigger");
    button.addEventListener("click", () => {
      if (article.querySelector("video")) return;
      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.src = person.file;
      video.addEventListener("error", () => {
        article.querySelector(".video-status").textContent = `Waiting for ${person.file}`;
      });
      article.querySelector(".video-holder").append(video);
      button.remove();
      video.play().catch(() => {});
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
        stop("✦ Starfall complete! You caught all ten stars.");
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
    start.textContent = "REPLAY STARFALL ↻";
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
      if (time <= 0) stop("Time is up! Try once more, traveler.");
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
        dialogue.textContent = "Mew! That's fun, but I'm craving fish! 🐟";
        return;
      }
      fish = Math.min(3, fish + 1);
      countLabel.textContent = fish;
      dialogue.textContent = fish >= 3
        ? "PURRR! You've won the Cat Guardian's friendship! 💛"
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

function init() {
  updateProgress();
  initStoryLink();
  initPhotos();
  initMusic();
  initVideos();
  initTrials();
}

document.addEventListener("DOMContentLoaded", init);
