/**
 * 數學冒險樂園 - 主要遊戲邏輯
 * ------------------------------------------------------------
 * 設計目標：
 * 1) 提供兩種模式：加減法闖關、九九乘法。
 * 2) 提供背景音樂、音效、成就徽章與本機排行榜。
 * 3) 純前端靜態網頁，直接開 index.html 就能遊玩。
 */

// ===== 取得畫面元件 =====
const switchModeButton = document.getElementById("switch-mode");
const toggleSoundButton = document.getElementById("toggle-sound");
const toggleBgmButton = document.getElementById("toggle-bgm");
const modeLabel = document.getElementById("mode-label");
const scoreText = document.getElementById("score");
const levelText = document.getElementById("level");
const streakText = document.getElementById("streak");
const starsText = document.getElementById("stars");
const startButton = document.getElementById("start-game");
const nextButton = document.getElementById("next-question");
const resetButton = document.getElementById("reset");
const questionText = document.getElementById("question");
const answerInput = document.getElementById("answer");
const submitButton = document.getElementById("submit-answer");
const feedbackText = document.getElementById("feedback");
const fxLayer = document.getElementById("fx-layer");
const badgeHintText = document.getElementById("badge-hint");
const badgeList = document.getElementById("badge-list");
const playerNameInput = document.getElementById("player-name");
const saveScoreButton = document.getElementById("save-score");
const leaderboardHintText = document.getElementById("leaderboard-hint");
const leaderboardList = document.getElementById("leaderboard-list");

// ===== 可調整的遊戲規則常數 =====
/** 答對時加分分數（建議維持正整數） */
const SCORE_REWARD = 10;
/** 答錯時扣分分數（建議維持正整數，且小於答對加分） */
const SCORE_PENALTY = 2;
/** 每連續答對幾題可獲得 1 顆星星 */
const STAR_STREAK_REQUIREMENT = 3;
/** 排行榜只保留前幾名 */
const LEADERBOARD_LIMIT = 5;

// ===== localStorage Key =====
const LEADERBOARD_STORAGE_KEY = "mathFunKidsLeaderboardV1";
const BADGES_STORAGE_KEY = "mathFunKidsBadgesV1";

// ===== 徽章定義 =====
const BADGE_DEFINITIONS = [
    {
        id: "first_correct",
        icon: "🌱",
        name: "新手啟程",
        description: "第一次答對題目",
        condition: (state) => state.totalCorrect >= 1
    },
    {
        id: "streak_5",
        icon: "🔥",
        name: "連擊高手",
        description: "連續答對 5 題",
        condition: (state) => state.streak >= 5
    },
    {
        id: "star_5",
        icon: "⭐",
        name: "星星收藏家",
        description: "累積 5 顆星星",
        condition: (state) => state.stars >= 5
    },
    {
        id: "level_3",
        icon: "🚀",
        name: "闖關達人",
        description: "加減法升到等級 3",
        condition: (state) => state.addSubCorrectCount >= 12
    },
    {
        id: "multiply_20",
        icon: "🧠",
        name: "乘法小博士",
        description: "九九乘法答對 20 題",
        condition: (state) => state.multiplyCorrectCount >= 20
    },
    {
        id: "score_200",
        icon: "👑",
        name: "高分王者",
        description: "分數達到 200 分",
        condition: (state) => state.score >= 200
    }
];

// ===== 遊戲狀態（集中管理，避免散落） =====
const gameState = {
    // mode: "addSub" = 加減法, "multiply" = 九九乘法
    mode: "addSub",
    score: 0,
    streak: 0,
    stars: 0,
    // addSubCorrectCount 用來驅動加減法難度升級
    addSubCorrectCount: 0,
    multiplyCorrectCount: 0,
    totalCorrect: 0,
    totalWrong: 0,
    currentQuestion: null,
    started: false,
    soundEnabled: true,
    bgmEnabled: true,
    unlockedBadgeIds: new Set()
};

let leaderboardData = [];

// ===== 音效與背景音樂（使用 Web Audio，無需外部音檔） =====
let audioContext = null;
let bgmTimerId = null;
let bgmStepIndex = 0;

const BGM_STEP_INTERVAL_MS = 320;
const BGM_MELODY = [
    { freq: 261.63, duration: 0.22 }, // C4
    { freq: 329.63, duration: 0.22 }, // E4
    { freq: 392.0, duration: 0.22 }, // G4
    { freq: 523.25, duration: 0.28 }, // C5
    { freq: 392.0, duration: 0.2 },
    { freq: 329.63, duration: 0.2 },
    { freq: 261.63, duration: 0.22 },
    { freq: 0, duration: 0.18 }
];

/**
 * 在首次互動後初始化 AudioContext。
 * 這樣可以避免瀏覽器自動播放限制導致音效被擋下。
 */
function initAudioContext() {
    if (audioContext) {
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }
        return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
        return;
    }

    audioContext = new AudioContextClass();
    if (gameState.bgmEnabled) {
        startBgmLoop();
    }
}

/**
 * 播放單一音符。
 */
function playTone(frequency, durationSec, options = {}) {
    if (!audioContext || frequency <= 0) {
        return;
    }

    const {
        type = "sine",
        delaySec = 0,
        volume = 0.12
    } = options;

    const startAt = audioContext.currentTime + delaySec;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + durationSec);
}

/**
 * 播放遊戲事件音效
 * - correct：答對
 * - wrong：答錯
 * - levelUp：升級
 */
function playSoundEffect(effectType) {
    if (!gameState.soundEnabled || !audioContext) {
        return;
    }

    if (effectType === "correct") {
        playTone(660, 0.12, { type: "triangle" });
        playTone(880, 0.16, { type: "triangle", delaySec: 0.08 });
        return;
    }

    if (effectType === "wrong") {
        playTone(220, 0.18, { type: "sawtooth" });
        playTone(165, 0.2, { type: "sawtooth", delaySec: 0.09 });
        return;
    }

    if (effectType === "levelUp") {
        playTone(523.25, 0.12, { type: "square" });
        playTone(659.25, 0.12, { type: "square", delaySec: 0.08 });
        playTone(783.99, 0.2, { type: "square", delaySec: 0.16 });
    }
}

/**
 * 播放一個背景音樂節拍。
 */
function playBgmStep() {
    if (!gameState.bgmEnabled || !audioContext) {
        return;
    }

    const note = BGM_MELODY[bgmStepIndex % BGM_MELODY.length];
    bgmStepIndex += 1;

    if (note.freq > 0) {
        playTone(note.freq, note.duration, {
            type: "triangle",
            volume: 0.035
        });
    }
}

/**
 * 開始背景音樂循環。
 */
function startBgmLoop() {
    if (!audioContext || bgmTimerId !== null) {
        return;
    }

    playBgmStep();
    bgmTimerId = window.setInterval(playBgmStep, BGM_STEP_INTERVAL_MS);
}

/**
 * 停止背景音樂循環。
 */
function stopBgmLoop() {
    if (bgmTimerId !== null) {
        window.clearInterval(bgmTimerId);
        bgmTimerId = null;
    }
}

/**
 * 根據答對題數決定加減法等級
 * 規則說明：
 * - 0~4 題答對：等級 1（1 位數）
 * - 5~11 題答對：等級 2（2 位數）
 * - 12 題以上：等級 3（3 位數）
 */
function getAddSubLevel() {
    if (gameState.addSubCorrectCount >= 12) {
        return 3;
    }
    if (gameState.addSubCorrectCount >= 5) {
        return 2;
    }
    return 1;
}

/**
 * 取得目前畫面要顯示的等級
 * - 在加減法模式時：顯示 1~3 難度等級
 * - 在九九乘法模式時：固定顯示 1（基礎乘法練習）
 */
function getDisplayLevel() {
    return gameState.mode === "addSub" ? getAddSubLevel() : 1;
}

/**
 * 產生指定位數範圍內的隨機整數
 * digits = 1 -> 1~9
 * digits = 2 -> 10~99
 * digits = 3 -> 100~999
 */
function randomByDigits(digits) {
    const min = digits === 1 ? 1 : 10 ** (digits - 1);
    const max = (10 ** digits) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 產生加減法題目
 * 為避免低年級挫折，減法題固定保證答案不為負數（a >= b）。
 */
function createAddSubQuestion() {
    const level = getAddSubLevel();
    const operator = Math.random() < 0.5 ? "+" : "-";
    let a = randomByDigits(level);
    let b = randomByDigits(level);

    if (operator === "-" && a < b) {
        const temp = a;
        a = b;
        b = temp;
    }

    const answer = operator === "+" ? a + b : a - b;
    return {
        text: `${a} ${operator} ${b} = ?`,
        answer
    };
}

/**
 * 產生九九乘法題目（1~9）
 */
function createMultiplyQuestion() {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;

    return {
        text: `${a} × ${b} = ?`,
        answer: a * b
    };
}

/**
 * 依照目前模式建立新題目。
 */
function createQuestionByMode() {
    return gameState.mode === "addSub" ? createAddSubQuestion() : createMultiplyQuestion();
}

/**
 * 更新分數、等級、連續答對與星星顯示。
 */
function renderStatus() {
    scoreText.textContent = String(gameState.score);
    levelText.textContent = String(getDisplayLevel());
    streakText.textContent = String(gameState.streak);
    starsText.textContent = String(gameState.stars);
}

/**
 * 更新模式文字與切換按鈕文案。
 */
function renderMode() {
    if (gameState.mode === "addSub") {
        modeLabel.textContent = "加減法闖關（1~3 位數）";
        switchModeButton.textContent = "切換到九九乘法";
    } else {
        modeLabel.textContent = "九九乘法練習（1~9）";
        switchModeButton.textContent = "切換到加減法闖關";
    }
}

/**
 * 更新音效開關按鈕文案。
 */
function renderSoundButton() {
    toggleSoundButton.textContent = gameState.soundEnabled ? "🔊 音效：開" : "🔈 音效：關";
}

/**
 * 更新背景音樂開關按鈕文案。
 */
function renderBgmButton() {
    toggleBgmButton.textContent = gameState.bgmEnabled ? "🎵 背景音樂：開" : "🎵 背景音樂：關";
}

/**
 * 顯示星星爆發小動畫，增強獎勵感。
 */
function popStarAnimation() {
    const vectors = [
        { x: "-80px", y: "-30px" },
        { x: "-25px", y: "-65px" },
        { x: "35px", y: "-60px" },
        { x: "90px", y: "-28px" }
    ];

    vectors.forEach((vector) => {
        const star = document.createElement("span");
        star.className = "pop-star";
        star.textContent = "⭐";
        star.style.left = "50%";
        star.style.top = "-8px";
        star.style.setProperty("--x", vector.x);
        star.style.setProperty("--y", vector.y);
        fxLayer.appendChild(star);
        star.addEventListener("animationend", () => {
            star.remove();
        });
    });
}

/**
 * 升級時讓等級數字閃動。
 */
function playLevelUpAnimation() {
    levelText.classList.remove("level-up-flash");
    void levelText.offsetWidth;
    levelText.classList.add("level-up-flash");
}

/**
 * 載入本機排行榜。
 */
function loadLeaderboard() {
    try {
        const raw = window.localStorage.getItem(LEADERBOARD_STORAGE_KEY);
        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .filter((item) => item && typeof item.name === "string" && Number.isFinite(item.score))
            .slice(0, LEADERBOARD_LIMIT);
    } catch (error) {
        return [];
    }
}

/**
 * 儲存本機排行榜。
 */
function saveLeaderboard() {
    try {
        window.localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(leaderboardData));
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * 載入已解鎖徽章。
 */
function loadBadgeProgress() {
    try {
        const raw = window.localStorage.getItem(BADGES_STORAGE_KEY);
        if (!raw) {
            return;
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return;
        }

        const validIds = new Set(BADGE_DEFINITIONS.map((badge) => badge.id));
        parsed.forEach((id) => {
            if (typeof id === "string" && validIds.has(id)) {
                gameState.unlockedBadgeIds.add(id);
            }
        });
    } catch (error) {
        // 忽略讀取錯誤
    }
}

/**
 * 儲存已解鎖徽章。
 */
function saveBadgeProgress() {
    try {
        window.localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(Array.from(gameState.unlockedBadgeIds)));
    } catch (error) {
        // 忽略儲存錯誤
    }
}

/**
 * 渲染徽章列表。
 */
function renderBadges() {
    badgeList.innerHTML = "";

    BADGE_DEFINITIONS.forEach((badge) => {
        const unlocked = gameState.unlockedBadgeIds.has(badge.id);
        const item = document.createElement("li");
        item.className = unlocked ? "badge-item unlocked" : "badge-item";

        const badgeName = document.createElement("p");
        badgeName.className = "badge-name";
        badgeName.textContent = `${unlocked ? badge.icon : "🔒"} ${badge.name}`;

        const badgeDesc = document.createElement("p");
        badgeDesc.className = "badge-desc";
        badgeDesc.textContent = badge.description;

        item.appendChild(badgeName);
        item.appendChild(badgeDesc);
        badgeList.appendChild(item);
    });

    badgeHintText.textContent = `已解鎖 ${gameState.unlockedBadgeIds.size} / ${BADGE_DEFINITIONS.length} 枚徽章`;
}

/**
 * 檢查是否有新徽章達成。
 */
function checkAndUnlockBadges() {
    const unlockedNames = [];

    BADGE_DEFINITIONS.forEach((badge) => {
        if (!gameState.unlockedBadgeIds.has(badge.id) && badge.condition(gameState)) {
            gameState.unlockedBadgeIds.add(badge.id);
            unlockedNames.push(`${badge.icon}${badge.name}`);
        }
    });

    if (unlockedNames.length > 0) {
        saveBadgeProgress();
        renderBadges();
    }

    return unlockedNames;
}

/**
 * 渲染排行榜。
 */
function renderLeaderboard() {
    leaderboardList.innerHTML = "";

    if (leaderboardData.length === 0) {
        const empty = document.createElement("li");
        empty.textContent = "目前尚無紀錄，快來儲存第一筆成績！";
        leaderboardList.appendChild(empty);
        return;
    }

    leaderboardData.forEach((entry) => {
        const item = document.createElement("li");
        const dateText = new Date(entry.timestamp).toLocaleDateString("zh-TW");
        item.textContent = `${entry.name}｜${entry.score} 分｜${entry.stars} ⭐｜${entry.modeLabel}｜${dateText}`;
        leaderboardList.appendChild(item);
    });
}

/**
 * 儲存目前分數到排行榜（localStorage）。
 */
function saveCurrentScore() {
    const playerName = playerNameInput.value.trim();
    if (playerName === "") {
        leaderboardHintText.textContent = "請先輸入玩家名稱再儲存分數。";
        return;
    }

    const entry = {
        name: playerName,
        score: gameState.score,
        stars: gameState.stars,
        modeLabel: gameState.mode === "addSub" ? "加減法" : "九九乘法",
        timestamp: Date.now()
    };

    leaderboardData.push(entry);
    leaderboardData.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        if (b.stars !== a.stars) {
            return b.stars - a.stars;
        }
        return a.timestamp - b.timestamp;
    });
    leaderboardData = leaderboardData.slice(0, LEADERBOARD_LIMIT);

    if (saveLeaderboard()) {
        leaderboardHintText.textContent = "排行榜已更新並儲存在此瀏覽器！";
    } else {
        leaderboardHintText.textContent = "儲存失敗：瀏覽器可能禁止 localStorage。";
    }

    renderLeaderboard();
}

/**
 * 產生下一題並顯示。
 */
function generateAndShowQuestion() {
    if (!gameState.started) {
        feedbackText.textContent = "請先按「開始遊戲」！";
        return;
    }

    gameState.currentQuestion = createQuestionByMode();
    questionText.textContent = gameState.currentQuestion.text;
    answerInput.value = "";
    answerInput.focus();
    feedbackText.textContent = "請輸入答案後按「提交答案」。";
    renderStatus();
}

/**
 * 檢查作答結果並更新狀態。
 */
function submitAnswer() {
    if (!gameState.started || !gameState.currentQuestion) {
        feedbackText.textContent = "請先開始遊戲並產生題目。";
        return;
    }

    if (answerInput.value.trim() === "") {
        feedbackText.textContent = "請先輸入答案！";
        return;
    }

    const userAnswer = Number(answerInput.value);
    if (Number.isNaN(userAnswer)) {
        feedbackText.textContent = "請輸入有效的數字！";
        return;
    }
    if (!Number.isInteger(userAnswer)) {
        feedbackText.textContent = "請輸入整數答案（不能有小數）！";
        return;
    }

    const isCorrect = userAnswer === gameState.currentQuestion.answer;

    if (isCorrect) {
        const previousLevel = getDisplayLevel();
        const messageList = [];

        gameState.score += SCORE_REWARD;
        gameState.streak += 1;
        gameState.totalCorrect += 1;

        if (gameState.mode === "addSub") {
            gameState.addSubCorrectCount += 1;
        } else {
            gameState.multiplyCorrectCount += 1;
        }

        const currentLevel = getDisplayLevel();
        const gotStar = gameState.streak % STAR_STREAK_REQUIREMENT === 0;

        if (gotStar) {
            gameState.stars += 1;
            popStarAnimation();
        }

        if (gameState.mode === "addSub" && currentLevel > previousLevel) {
            playLevelUpAnimation();
            playSoundEffect("levelUp");
            messageList.push(`🎉 升級成功！你來到等級 ${currentLevel}！`);
        } else {
            playSoundEffect("correct");
            messageList.push("✅ 答對了！很棒，繼續挑戰下一題！");
        }

        if (gotStar) {
            messageList.push("獲得 1 顆星星⭐");
        }

        const newBadges = checkAndUnlockBadges();
        if (newBadges.length > 0) {
            messageList.push(`🏅 新解鎖徽章：${newBadges.join("、")}`);
        }

        feedbackText.textContent = messageList.join(" ");
    } else {
        gameState.score = Math.max(0, gameState.score - SCORE_PENALTY);
        gameState.streak = 0;
        gameState.totalWrong += 1;
        playSoundEffect("wrong");
        feedbackText.textContent = `❌ 再試一次！正確答案是 ${gameState.currentQuestion.answer}`;
    }

    renderStatus();
}

/**
 * 重設進度：回到初始狀態。
 */
function resetProgress() {
    gameState.score = 0;
    gameState.streak = 0;
    gameState.stars = 0;
    gameState.addSubCorrectCount = 0;
    gameState.multiplyCorrectCount = 0;
    gameState.totalCorrect = 0;
    gameState.totalWrong = 0;
    gameState.currentQuestion = null;
    gameState.started = false;

    questionText.textContent = "按下「開始遊戲」後會出題";
    answerInput.value = "";
    feedbackText.textContent = "進度已重設，準備好再開始！";
    renderStatus();
}

/**
 * 切換模式：
 * - 只切換遊戲種類，不重置總分
 * - 清空當前題目並請玩家開始新回合
 */
function toggleMode() {
    gameState.mode = gameState.mode === "addSub" ? "multiply" : "addSub";
    gameState.streak = 0;
    gameState.currentQuestion = null;
    gameState.started = false;

    questionText.textContent = "模式已切換，按下「開始遊戲」開始新挑戰";
    answerInput.value = "";
    feedbackText.textContent = "新模式準備完成！";
    renderMode();
    renderStatus();
}

/**
 * 切換音效開關。
 */
function toggleSound() {
    initAudioContext();
    gameState.soundEnabled = !gameState.soundEnabled;
    renderSoundButton();
    feedbackText.textContent = gameState.soundEnabled ? "音效已開啟 🔊" : "音效已關閉 🔈";
}

/**
 * 切換背景音樂開關。
 */
function toggleBgm() {
    initAudioContext();
    gameState.bgmEnabled = !gameState.bgmEnabled;

    if (gameState.bgmEnabled) {
        startBgmLoop();
    } else {
        stopBgmLoop();
    }

    renderBgmButton();
    feedbackText.textContent = gameState.bgmEnabled ? "背景音樂已開啟 🎵" : "背景音樂已關閉 🎵";
}

/**
 * 開始遊戲。
 */
function startGame() {
    initAudioContext();
    if (gameState.bgmEnabled) {
        startBgmLoop();
    }

    gameState.started = true;
    feedbackText.textContent = "遊戲開始！加油！";
    generateAndShowQuestion();
}

// ===== 事件綁定 =====
switchModeButton.addEventListener("click", toggleMode);
toggleSoundButton.addEventListener("click", toggleSound);
toggleBgmButton.addEventListener("click", toggleBgm);
startButton.addEventListener("click", startGame);
nextButton.addEventListener("click", generateAndShowQuestion);
submitButton.addEventListener("click", submitAnswer);
resetButton.addEventListener("click", resetProgress);
saveScoreButton.addEventListener("click", saveCurrentScore);

// 按 Enter 也能快速送出答案
answerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        submitAnswer();
    }
});

// 玩家名稱輸入框按 Enter 可直接儲存分數
playerNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        saveCurrentScore();
    }
});

// ===== 初始渲染 =====
leaderboardData = loadLeaderboard();
loadBadgeProgress();
renderMode();
renderSoundButton();
renderBgmButton();
renderStatus();
renderBadges();
renderLeaderboard();
