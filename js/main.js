// js/main.js

let swiperInstance = null;
let sortedGalleryData = [];

// 1. Весільні закріплені фото (Усі оптимізовані скриптом до .jpg)
const pinnedWeddingPhotos = [
    "Фото 72 - 2026-06-18.jpg", "Фото 73 - 2026-06-18.jpg", "Фото 74 - 2026-06-18.jpg",
    "Фото 75 - 2026-06-18.jpg", "Фото 76 - 2026-06-18.jpg", "Фото 77 - 2026-06-18.jpg",
    "Фото 78 - 2026-06-18.jpg", "Фото 79 - 2026-06-18.jpg", "Фото 80 - 2026-06-18.jpg",
    "Фото 81 - 2026-06-18.jpg", "Фото 82 - 2026-06-18.jpg"
];

// Карта квестів: filename -> тип квесту
let activeQuests = {
    "Фото 6 - 2008-06-25.jpg": "puzzle"
};
let unlockedQuests = {};

// Для трекерів стану міні-ігор
let puzzleProgress = {};
let holdTimers = {};

function updateCountdown() {
    const weddingDate = new Date("1998-06-20T00:00:00");
    const now = new Date();
    let diff = now - weddingDate;
    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    let years = now.getFullYear() - weddingDate.getFullYear();
    let months = now.getMonth() - weddingDate.getMonth();
    let days = now.getDate() - weddingDate.getDate();
    if (days < 0) { months--; const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate(); days += prevMonth; }
    if (months < 0) { years--; months += 12; }
    const countdownElement = document.getElementById("countdown");
    if (countdownElement) {
        countdownElement.innerHTML = `
            <div class="time-block"><span>${years}</span> років</div>
            <div class="time-block"><span>${months}</span> місяців</div>
            <div class="time-block"><span>${days}</span> днів</div>
            <div class="time-block"><span>${hours}</span> год : ${minutes} хв : ${seconds} сек</div>
        `;
    }
}

function generateAllQuests() {
    if (typeof galleryData === "undefined") return;

    const available = galleryData.filter(photo =>
        !pinnedWeddingPhotos.includes(photo.filename) && photo.filename !== "Фото 6 - 2008-06-25.jpg"
    );

    const shuffled = [...available].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 15);

    const types = ["scratch", "radar", "shoot", "lock"];
    selected.forEach((photo, i) => {
        const questType = types[i % types.length];
        activeQuests[photo.filename] = questType;
    });
}

function prepareAndRenderGallery() {
    const timelineElement = document.getElementById("timeline");
    const swiperWrapper = document.getElementById("swiper-dynamic-wrapper");
    if (!timelineElement || !swiperWrapper || typeof galleryData === "undefined") return;

    generateAllQuests();

    const weddingPart = galleryData.filter(photo => pinnedWeddingPhotos.includes(photo.filename));
    const archivePart = galleryData
        .filter(photo => !pinnedWeddingPhotos.includes(photo.filename))
        .reverse();

    sortedGalleryData = [...weddingPart, ...archivePart];

    timelineElement.innerHTML = "";
    swiperWrapper.innerHTML = "";

    sortedGalleryData.forEach((photo, index) => {
        const isWedding = pinnedWeddingPhotos.includes(photo.filename);
        const questType = activeQuests[photo.filename];

        // --- АВТОМАТИЧНЕ ВИЗНАЧЕННЯ КЛАСУ ПОВОРOТУ ---
        let rotationClass = "";
        if (photo.filename.startsWith("Фото 51 -")) {
            rotationClass = "rotate-180";
        } else if (
            photo.filename.startsWith("Фото 19 -") ||
            photo.filename.startsWith("Фото 39 -") ||
            photo.filename.startsWith("Фото 41 -") ||
            photo.filename.startsWith("Фото 42 -") ||
            photo.filename.startsWith("Фото 43 -") ||
            photo.filename.startsWith("Фото 49 -") ||
            photo.filename.startsWith("Фото 55 -") ||
            photo.filename.startsWith("Фото 57 -") ||
            photo.filename.startsWith("Фото 58 -")
        ) {
            rotationClass = "rotate-90-right";
        }
        // --------------------------------------------

        // Рендер плитки головної сторінки
        const card = document.createElement("div");
        card.className = isWedding ? "photo-card pinned-wedding-card" : "photo-card";
        card.innerHTML = `
            <div class="photo-link">
                <div class="photo-wrapper">
                    ${isWedding ? '<span class="wedding-badge">👑 Головне</span>' : ''}
                    <img src="images/gallery/${photo.filename}" class="${rotationClass}" alt="Спогад" loading="lazy">
                </div>
            </div>
        `;
        card.addEventListener("click", () => openSlider(index));
        timelineElement.appendChild(card);

        // Рендер слайдів для Swiper
        const swiperSlide = document.createElement("div");
        swiperSlide.className = "swiper-slide";

        if (questType && !unlockedQuests[photo.filename]) {
            swiperSlide.innerHTML = generateQuestHTML(questType, photo.filename, index);
            // Додаємо клас повороту на картинку всередині заблокованого квесту (якщо це не пазл)
            const imgInQuest = swiperSlide.querySelector(".slide-main-img");
            if (imgInQuest && questType !== "puzzle" && rotationClass) {
                imgInQuest.classList.add(rotationClass);
            }
        } else {
            swiperSlide.innerHTML = `
                <div class="slide-frame-container">
                    <img src="images/gallery/${photo.filename}" class="slide-main-img ${rotationClass}" alt="Презентація">
                </div>
            `;
        }
        swiperWrapper.appendChild(swiperSlide);
    });
}

function generateQuestHTML(type, filename, index) {
    switch(type) {
        case "puzzle":
            return `
                <div class="slide-frame-container puzzle-mode-active" id="quest-track-${index}">
                    <div class="real-puzzle-grid">
                        <div class="puzzle-piece piece-tl mixed" onclick="rotatePiece(this, '${filename}', ${index}, 'tl')"><img src="images/gallery/${filename}"></div>
                        <div class="puzzle-piece piece-tr mixed" onclick="rotatePiece(this, '${filename}', ${index}, 'tr')"><img src="images/gallery/${filename}"></div>
                        <div class="puzzle-piece piece-bl mixed" onclick="rotatePiece(this, '${filename}', ${index}, 'bl')"><img src="images/gallery/${filename}"></div>
                        <div class="puzzle-piece piece-br mixed" onclick="rotatePiece(this, '${filename}', ${index}, 'br')"><img src="images/gallery/${filename}"></div>
                    </div>
                    <div class="puzzle-hint-text">🧩 Клікніть на шматочки, щоб зібрати кадр</div>
                </div>`;

        case "scratch":
            return `
                <div class="slide-frame-container puzzle-mode-active" id="quest-track-${index}">
                    <div class="scratch-layer" onmousemove="scratchMove(this, '${filename}', ${index})" ontouchmove="scratchMove(this, '${filename}', ${index})">
                        <div class="scratch-text">🧼 Потріть екран мишкою або пальцем, щоб проявити фото</div>
                    </div>
                    <img src="images/gallery/${filename}" class="slide-main-img no-pointer">
                </div>`;

        case "radar":
            return `
                <div class="slide-frame-container puzzle-mode-active" id="quest-track-${index}">
                    <div class="radar-lock-overlay">
                        <div class="radar-scanner-circle" onmousedown="startRadarScan('${filename}', ${index})" onmouseup="stopRadarScan('${filename}')" bankrupt="stopRadarScan('${filename}')" ontouchstart="startRadarScan('${filename}', ${index})" ontouchend="stopRadarScan('${filename}')">
                            <span class="finger-icon">🔘</span>
                            <span class="scan-label">Затисніть на 2 сек</span>
                        </div>
                    </div>
                    <img src="images/gallery/${filename}" class="slide-main-img blur-heavy">
                </div>`;

        case "shoot":
            return `
                <div class="slide-frame-container puzzle-mode-active" id="quest-track-${index}">
                    <div class="shoot-targets-container">
                        <div class="target-item item-1" onclick="shootTarget(this, '${filename}', ${index})">🎯</div>
                        <div class="target-item item-2" onclick="shootTarget(this, '${filename}', ${index})">🎯</div>
                        <div class="target-item item-3" onclick="shootTarget(this, '${filename}', ${index})">🎯</div>
                    </div>
                    <img src="images/gallery/${filename}" class="slide-main-img blur-heavy no-pointer">
                </div>`;

        case "lock":
            return `
                <div class="slide-frame-container puzzle-mode-active" id="quest-track-${index}">
                    <div class="digital-lock-overlay">
                        <div class="lock-panel">
                            <div class="lock-hint">Введіть дату вашого весілля:</div>
                            <input type="text" maxlength="10" placeholder="ДД.ММ.РРРР" id="lock-input-${index}" oninput="checkWeddingDateLock(this, '${filename}', ${index})">
                        </div>
                    </div>
                    <img src="images/gallery/${filename}" class="slide-main-img blur-heavy">
                </div>`;
    }
}

window.rotatePiece = function(element, filename, slideIndex, position) {
    if (!element.classList.contains("mixed")) return;
    element.classList.remove("mixed");
    element.style.transform = "rotate(0deg)";
    if (!puzzleProgress[filename]) puzzleProgress[filename] = { tl: false, tr: false, bl: false, br: false };
    puzzleProgress[filename][position] = true;
    const prog = puzzleProgress[filename];
    if (prog.tl && prog.tr && prog.bl && prog.br) { completeQuest(filename, slideIndex); }
};

window.scratchMove = function(element, filename, slideIndex) {
    if (!element.opacityCounter) element.opacityCounter = 100;
    element.opacityCounter -= 0.8;
    element.style.opacity = element.opacityCounter / 100;
    if (element.opacityCounter <= 15) { element.remove(); completeQuest(filename, slideIndex); }
};

window.startRadarScan = function(filename, slideIndex) {
    const label = event.currentTarget.querySelector(".scan-label");
    if (label) label.textContent = "Сканування...";
    holdTimers[filename] = setTimeout(() => { completeQuest(filename, slideIndex); }, 2000);
};
window.stopRadarScan = function(filename) {
    clearTimeout(holdTimers[filename]);
    const label = event.currentTarget.querySelector(".scan-label");
    if (label) label.textContent = "Затисніть на 2 сек";
};

window.shootTarget = function(element, filename, slideIndex) {
    element.style.transform = "scale(0)";
    setTimeout(() => element.remove(), 200);
    const container = document.getElementById(`quest-track-${slideIndex}`);
    if (container && container.querySelectorAll(".target-item").length <= 1) { completeQuest(filename, slideIndex); }
};

window.checkWeddingDateLock = function(inputEl, filename, slideIndex) {
    let value = inputEl.value.replace(/\D/g, '');
    if (value.length > 2 && value.length <= 4) {
        inputEl.value = value.slice(0, 2) + '.' + value.slice(2);
    } else if (value.length > 4) {
        inputEl.value = value.slice(0, 2) + '.' + value.slice(2, 4) + '.' + value.slice(4, 8);
    }
    if (inputEl.value === "20.06.1998") {
        inputEl.blur();
        completeQuest(filename, slideIndex);
    }
};

function completeQuest(filename, slideIndex) {
    unlockedQuests[filename] = true;
    const container = document.getElementById(`quest-track-${slideIndex}`);
    if (container) {
        container.className = "slide-frame-container";
        container.innerHTML = `<img src="images/gallery/${filename}" class="slide-main-img" alt="Презентація">`;
    }
    triggerScreenFlash();
    triggerWeaponLaserFire();
}

function openSlider(index) {
    document.getElementById("custom-slider-overlay").classList.add("active");
    document.body.style.overflow = "hidden";
    if (!swiperInstance) {
        swiperInstance = new Swiper(".mySwiper", {
            effect: "flip", grabCursor: true, speed: 600,
            flipEffect: { slideShadows: true, limitRotation: true },
            pagination: { el: ".swiper-pagination", type: "fraction" },
            navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
            keyboard: { enabled: true }
        });
        swiperInstance.on("slideChange", () => { runHollywoodShow(); });
    }
    swiperInstance.slideTo(index, 0);
    runHollywoodShow();
}

function runHollywoodShow() {
    if (!swiperInstance || sortedGalleryData.length === 0) return;
    const currentIdx = swiperInstance.activeIndex;
    const currentPhoto = sortedGalleryData[currentIdx];
    const overlay = document.getElementById("custom-slider-overlay");
    const globalBlurBg = document.getElementById("global-slider-blur-bg");
    if (globalBlurBg && currentPhoto) {
        globalBlurBg.style.backgroundImage = `url('images/gallery/${currentPhoto.filename}')`;
    }
    const oldEffects = document.querySelectorAll(".action-effect-layer");
    oldEffects.forEach(el => el.remove());

    if (activeQuests[currentPhoto.filename] && !unlockedQuests[currentPhoto.filename]) { return; }

    const sceneType = currentIdx % 4;
    const effectNode = document.createElement("div");
    effectNode.className = "action-effect-layer";
    switch(sceneType) {
        case 0: effectNode.classList.add("effect-screen-shatter"); break;
        case 1: effectNode.classList.add("effect-machine-gun-fire"); break;
        case 2: effectNode.classList.add("effect-tactical-explosion"); break;
        case 3: effectNode.classList.add("effect-golden-rain-rich"); break;
    }
    overlay.appendChild(effectNode);
    if (typeof confetti !== "undefined") { confetti({ particleCount: 30, spread: 40, origin: { y: 0.75 } }); }
    setTimeout(() => { effectNode.remove(); }, 1000);
}

function triggerScreenFlash() {
    const overlay = document.getElementById("custom-slider-overlay");
    const flash = document.createElement("div");
    flash.className = "action-effect-layer effect-screen-shatter";
    overlay.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
}

function triggerWeaponLaserFire() {
    if (typeof confetti === "undefined") return;
    let bursts = 0;
    const interval = setInterval(() => {
        if (bursts > 3) { clearInterval(interval); return; }
        confetti({ particleCount: 35, angle: 60, spread: 40, origin: { x: 0, y: 0.8 }, colors: ['#ff3300', '#ffcc00'] });
        confetti({ particleCount: 35, angle: 120, spread: 40, origin: { x: 1, y: 0.8 }, colors: ['#ff3300', '#ffcc00'] });
        bursts++;
    }, 100);
}

function closeSlider() {
    document.getElementById("custom-slider-overlay").classList.remove("active");
    document.body.style.overflow = "auto";
    const oldEffects = document.querySelectorAll(".action-effect-layer");
    oldEffects.forEach(el => el.remove());
}

// ПАДАЮЧІ СЕРДЕЧКА, ЗІРОЧКИ ТА ІМЕНА БАТЬКІВ
function createFallingHearts() {
    const mainContainer = document.getElementById("falling-hearts-container");
    const sliderOverlay = document.getElementById("custom-slider-overlay");
    if (!mainContainer || !sliderOverlay) return;

    // Додали імена батьків у потік падаючих елементів!
    const items = ['❤️', '✨', '🌸', '💖', 'Людмила', 'Андрій'];

    setInterval(() => {
        const item = document.createElement("div");
        item.className = "falling-item";
        const selected = items[Math.floor(Math.random() * items.length)];
        item.textContent = selected;

        // Якщо це текст-ім'я, стилізуємо його красивіше
        if (selected === 'Людмила' || selected === 'Андрій') {
            item.style.color = '#ffcc00';
            item.style.fontWeight = 'bold';
            item.style.textShadow = '0 0 8px rgba(255, 204, 0, 0.6)';
            item.style.fontSize = "14px";
        } else {
            item.style.fontSize = Math.random() * 14 + 12 + "px";
        }

        item.style.left = Math.random() * 100 + "vw";
        item.style.animationDuration = Math.random() * 5 + 5 + "s"; // трохи плавніше падіння
        item.style.opacity = Math.random() * 0.35 + 0.2;

        if (sliderOverlay.classList.contains("active")) {
            item.style.zIndex = "10004"; sliderOverlay.appendChild(item);
        } else {
            item.style.zIndex = "1"; mainContainer.appendChild(item);
        }
        setTimeout(() => { item.remove(); }, 9000);
    }, 550);
}

const playlist = [
    { title: "Мелодія кохання", src: "music/track1.mp3" },
    { title: "Теплий вечір", src: "music/track2.mp3" },
    { title: "Акустична гітара", src: "music/track3.mp3" }
];
let currentTrackIndex = 0; let isPlaying = false;

function initMusicPlayer() {
    const audio = document.getElementById("bg-audio");
    const toggleBtn = document.getElementById("music-toggle");
    const nextBtn = document.getElementById("music-next");
    const trackTitle = document.getElementById("track-title");
    if (!audio) return;
    function loadTrack(index) { audio.src = playlist[index].src; trackTitle.textContent = playlist[index].title; audio.load(); }
    loadTrack(currentTrackIndex);
    function playMusic() {
        audio.play().then(() => { isPlaying = true; toggleBtn.innerHTML = "⏸️ Звук: ON"; toggleBtn.style.background = "#82947a"; }).catch(err => {});
    }
    function pauseMusic() { audio.pause(); isPlaying = false; toggleBtn.innerHTML = "🎵 Звук: OFF"; toggleBtn.style.background = "#4a3e3d"; }
    toggleBtn.addEventListener("click", (e) => { e.stopPropagation(); if (isPlaying) pauseMusic(); else playMusic(); });
    nextBtn.addEventListener("click", (e) => { e.stopPropagation(); currentTrackIndex = (currentTrackIndex + 1) % playlist.length; loadTrack(currentTrackIndex); playMusic(); });
    document.addEventListener("click", () => { if (!isPlaying) playMusic(); }, { once: true });
}

document.addEventListener("DOMContentLoaded", () => {
    prepareAndRenderGallery();
    initMusicPlayer();
    createFallingHearts();
    updateCountdown();
    setInterval(updateCountdown, 1000);
});

