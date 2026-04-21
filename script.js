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
const turnIndicatorText = document.getElementById("turn-indicator");
const battleLogText = document.getElementById("battle-log");
const battlePanel = document.getElementById("battle-panel");
const heroCard = document.getElementById("hero-card");
const enemyCard = document.getElementById("enemy-card");
const enemyNameText = document.getElementById("enemy-name");
const enemyAvatarText = document.getElementById("enemy-avatar");
const heroHpFill = document.getElementById("hero-hp-fill");
const heroHpText = document.getElementById("hero-hp-text");
const enemyHpFill = document.getElementById("enemy-hp-fill");
const enemyHpText = document.getElementById("enemy-hp-text");
const inventoryList = document.getElementById("inventory-list");
const slotWeapon = document.getElementById("slot-weapon");
const slotArmor = document.getElementById("slot-armor");
const slotRelic = document.getElementById("slot-relic");
const statAttackText = document.getElementById("stat-attack");
const statDefenseText = document.getElementById("stat-defense");
const statMaxHpText = document.getElementById("stat-max-hp");
const statSpeedText = document.getElementById("stat-speed");
const storyTitleText = document.getElementById("story-title");
const storyDescText = document.getElementById("story-desc");
const storyProgressText = document.getElementById("story-progress");
const startButton = document.getElementById("start-game");
const nextButton = document.getElementById("next-question");
const toggleAutoNextButton = document.getElementById("toggle-auto-next");
const resetButton = document.getElementById("reset");
const questionArea = document.getElementById("question-area");
const questionText = document.getElementById("question");
const answerInput = document.getElementById("answer");
const submitButton = document.getElementById("submit-answer");
const touchKeypad = document.getElementById("touch-keypad");
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
/** 排行榜只保留前幾名（本機模式） */
const LEADERBOARD_LIMIT = 5;
/** 線上排行榜顯示前幾名 */
const ONLINE_LEADERBOARD_LIMIT = 20;
/** 自動下一題延遲毫秒 */
const AUTO_NEXT_DELAY_MS = 900;
/** 答案輸入框聚焦後，等待虛擬鍵盤動畫完成再調整可視區 */
const INPUT_FOCUS_SCROLL_DELAY_MS = 120;
/** 題目區可見比例低於此值時，主動捲動到可視範圍 */
const QUESTION_VISIBILITY_THRESHOLD = 0.8;
const TURN_SWITCH_DELAY_MS = 380;
const MIN_PLAYER_DAMAGE = 6;
const PLAYER_DAMAGE_RANDOM_VARIANCE = 5;
const MIN_ENEMY_DAMAGE = 3;
const DEFENSE_REDUCTION_DIVISOR = 2;
const ENEMY_DAMAGE_RANDOM_VARIANCE = 4;
const PLAYER_CRITICAL_CHANCE = 0.2;
const PLAYER_CRITICAL_MULTIPLIER = 1.8;
const ENEMY_CRITICAL_CHANCE = 0.14;
const ENEMY_CRITICAL_MULTIPLIER = 1.6;

// ===== localStorage Key =====
const LEADERBOARD_STORAGE_KEY = "mathFunKidsLeaderboardV1";
const BADGES_STORAGE_KEY = "mathFunKidsBadgesV1";

// ===== 線上排行榜（Firebase Realtime Database）設定 =====
// 請將下方的空字串改成你的 Firebase 資料庫 URL（結尾不加斜線），例如：
//   "https://YOUR-PROJECT-default-rtdb.REGION.firebasedatabase.app"
// 留空 "" 則退回使用本機 localStorage。
const FIREBASE_DB_URL = "";

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

const STORY_CHAPTERS = [
    {
        title: "序章：新手村出發",
        description: "你是數學小勇者，準備離開新手村展開冒險！",
        minCorrect: 0
    },
    {
        title: "第一章：史萊姆草原",
        description: "草原上的史萊姆來襲！答題攻擊，守護村莊！",
        minCorrect: 4
    },
    {
        title: "第二章：巨木迷宮",
        description: "迷宮裡藏著算術機關，破解它們才能前進。",
        minCorrect: 9
    },
    {
        title: "第三章：乘法火山",
        description: "火山魔物會乘法咒語，用正確答案反擊！",
        minCorrect: 15
    },
    {
        title: "最終章：星光神殿",
        description: "你已是數學英雄，繼續挑戰刷新最高分吧！",
        minCorrect: 24
    }
];

/**
 * 敵人章節設定，會依照玩家答對進度逐步切換。
 * - name: 敵人名稱（含表情）
 * - avatar: 戰場顯示圖示
 * - maxHp: 敵人最大 HP
 * - attack: 敵人攻擊力基礎值
 * - narrative: 劇情面板中的當前敵人敘事
 */
const ENEMY_STAGES = [
    { name: "👾 史萊姆斥候", avatar: "🟢", maxHp: 60, attack: 8, narrative: "草原邊緣出現第一波史萊姆！" },
    { name: "🌲 巨木守衛", avatar: "🌳", maxHp: 86, attack: 11, narrative: "巨木迷宮守衛揮舞樹根阻擋去路。" },
    { name: "🌋 火山魔像", avatar: "🪨", maxHp: 118, attack: 14, narrative: "乘法火山噴發，魔像吸收岩漿力量。" },
    { name: "✨ 星殿幻獸", avatar: "🦄", maxHp: 150, attack: 17, narrative: "星光神殿的幻獸正在考驗你的計算力！" }
];

const BASE_PLAYER_STATS = {
    attack: 10,
    defense: 3,
    maxHp: 100,
    speed: 5
};

const EQUIPMENT_ITEMS = [
    { id: "wood_sword", icon: "🗡️", name: "練習木劍", slot: "weapon", bonus: { attack: 4 } },
    { id: "magic_book", icon: "📘", name: "計算魔導書", slot: "weapon", bonus: { attack: 2, speed: 2 } },
    { id: "leather_armor", icon: "🦺", name: "皮甲背心", slot: "armor", bonus: { defense: 3, maxHp: 12 } },
    { id: "guardian_shield", icon: "🛡️", name: "守護小盾", slot: "armor", bonus: { defense: 4 } },
    { id: "star_charm", icon: "✨", name: "星星護符", slot: "relic", bonus: { maxHp: 16 } },
    { id: "wind_boots", icon: "👟", name: "疾風鞋", slot: "relic", bonus: { speed: 3, attack: 1 } }
];

const SLOT_DISPLAY_NAMES = {
    weapon: "武器",
    armor: "護甲",
    relic: "飾品"
};

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
    autoNextEnabled: true,
    soundEnabled: true,
    bgmEnabled: true,
    unlockedBadgeIds: new Set(),
    turn: "player",
    enemyStageIndex: 0,
    currentEnemy: ENEMY_STAGES[0],
    enemyHp: ENEMY_STAGES[0].maxHp,
    playerStats: { ...BASE_PLAYER_STATS },
    playerHp: BASE_PLAYER_STATS.maxHp,
    equipped: {
        weapon: null,
        armor: null,
        relic: null
    }
};

let leaderboardData = [];
let autoNextTimerId = null;

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
 * 更新自動下一題按鈕文案。
 */
function renderAutoNextButton() {
    toggleAutoNextButton.textContent = gameState.autoNextEnabled ? "⏭️ 自動下一題：開" : "⏸️ 自動下一題：關";
}

/**
 * 根據答對總數取得目前劇情章節。
 */
function getCurrentStoryChapter() {
    for (let index = STORY_CHAPTERS.length - 1; index >= 0; index -= 1) {
        if (gameState.totalCorrect >= STORY_CHAPTERS[index].minCorrect) {
            return {
                chapter: STORY_CHAPTERS[index],
                chapterIndex: index
            };
        }
    }

    return {
        chapter: STORY_CHAPTERS[0],
        chapterIndex: 0
    };
}

/**
 * 渲染 RPG 劇情面板。
 */
function renderStory() {
    const { chapter, chapterIndex } = getCurrentStoryChapter();
    const enemy = gameState.currentEnemy;
    storyTitleText.textContent = chapter.title;
    storyDescText.textContent = `${chapter.description} ${enemy.narrative}`;

    const nextChapter = STORY_CHAPTERS[chapterIndex + 1];
    if (!nextChapter) {
        storyProgressText.textContent = "任務進度：已通關主線！持續答題挑戰傳說分數。";
        return;
    }

    const remaining = Math.max(0, nextChapter.minCorrect - gameState.totalCorrect);
    storyProgressText.textContent = `任務進度：再答對 ${remaining} 題可前往${nextChapter.title.replace("：", " ")}，目前對戰 ${enemy.name}`;
}

/**
 * 根據總答對數，決定目前敵人章節索引。
 */
function getEnemyStageIndexByProgress() {
    if (gameState.totalCorrect >= 24) {
        return 3;
    }
    if (gameState.totalCorrect >= 15) {
        return 2;
    }
    if (gameState.totalCorrect >= 9) {
        return 1;
    }
    return 0;
}

/**
 * 計算角色最終數值（基礎 + 裝備加成）。
 */
function calculatePlayerStats() {
    const stats = { ...BASE_PLAYER_STATS };
    Object.values(gameState.equipped).forEach((itemId) => {
        if (!itemId) {
            return;
        }
        const item = EQUIPMENT_ITEMS.find((equipment) => equipment.id === itemId);
        if (!item) {
            return;
        }
        stats.attack += item.bonus.attack || 0;
        stats.defense += item.bonus.defense || 0;
        stats.maxHp += item.bonus.maxHp || 0;
        stats.speed += item.bonus.speed || 0;
    });
    return stats;
}

/**
 * 將拖曳中的裝備放到裝備欄，並套用數值變化。
 */
function equipItem(itemId, targetSlot) {
    const item = EQUIPMENT_ITEMS.find((equipment) => equipment.id === itemId);
    if (!item) {
        return false;
    }
    if (item.slot !== targetSlot) {
        feedbackText.textContent = `這件裝備只能放在「${SLOT_DISPLAY_NAMES[item.slot]}欄」。`;
        return false;
    }

    gameState.equipped[targetSlot] = itemId;
    gameState.playerStats = calculatePlayerStats();
    if (gameState.playerHp > gameState.playerStats.maxHp) {
        gameState.playerHp = gameState.playerStats.maxHp;
    }
    renderEquipment();
    renderBattle();
    feedbackText.textContent = `已裝備 ${item.icon}${item.name}，角色數值已更新！`;
    return true;
}

/**
 * 卸下指定欄位裝備。
 */
function unequipSlot(slotName) {
    if (!gameState.equipped[slotName]) {
        return;
    }
    gameState.equipped[slotName] = null;
    gameState.playerStats = calculatePlayerStats();
    if (gameState.playerHp > gameState.playerStats.maxHp) {
        gameState.playerHp = gameState.playerStats.maxHp;
    }
    renderEquipment();
    renderBattle();
    feedbackText.textContent = "已卸下裝備。";
}

/**
 * 將回合狀態渲染到畫面。
 */
function renderTurn() {
    turnIndicatorText.textContent = gameState.turn === "player" ? "回合狀態：玩家回合（請答題發動攻擊）" : "回合狀態：敵人回合（準備反擊）";
    if (battlePanel) {
        battlePanel.classList.toggle("player-turn", gameState.turn === "player");
        battlePanel.classList.toggle("enemy-turn", gameState.turn === "enemy");
    }
}

/**
 * 渲染戰鬥畫面資訊（敵人名稱、HP、玩家 HP）。
 */
function renderBattle() {
    const heroPercent = Math.max(0, (gameState.playerHp / gameState.playerStats.maxHp) * 100);
    const enemyPercent = Math.max(0, (gameState.enemyHp / gameState.currentEnemy.maxHp) * 100);
    heroHpFill.style.width = `${heroPercent}%`;
    enemyHpFill.style.width = `${enemyPercent}%`;
    heroHpText.textContent = `HP ${gameState.playerHp} / ${gameState.playerStats.maxHp}`;
    enemyHpText.textContent = `HP ${gameState.enemyHp} / ${gameState.currentEnemy.maxHp}`;
    enemyNameText.textContent = gameState.currentEnemy.name;
    enemyAvatarText.textContent = gameState.currentEnemy.avatar;
    renderTurn();
}

/**
 * 渲染裝備區與最終數值。
 */
function renderEquipment() {
    const equippedIds = new Set(Object.values(gameState.equipped).filter(Boolean));
    const inventoryItems = EQUIPMENT_ITEMS.filter((item) => !equippedIds.has(item.id));

    inventoryList.innerHTML = "";
    inventoryItems.forEach((item) => {
        const itemNode = document.createElement("div");
        itemNode.className = "equip-item";
        itemNode.draggable = true;
        itemNode.dataset.itemId = item.id;
        itemNode.textContent = `${item.icon} ${item.name}`;

        const meta = document.createElement("small");
        const bonusText = [
            item.bonus.attack ? `攻+${item.bonus.attack}` : "",
            item.bonus.defense ? `防+${item.bonus.defense}` : "",
            item.bonus.maxHp ? `HP+${item.bonus.maxHp}` : "",
            item.bonus.speed ? `速+${item.bonus.speed}` : ""
        ].filter(Boolean).join(" / ");
        meta.textContent = bonusText;
        itemNode.appendChild(meta);
        inventoryList.appendChild(itemNode);
    });

    const slotMap = {
        weapon: slotWeapon,
        armor: slotArmor,
        relic: slotRelic
    };
    Object.entries(slotMap).forEach(([slotName, slotNode]) => {
        const itemId = gameState.equipped[slotName];
        slotNode.innerHTML = "";
        if (!itemId) {
            slotNode.textContent = `${SLOT_DISPLAY_NAMES[slotName]}欄`;
            return;
        }

        const item = EQUIPMENT_ITEMS.find((equipment) => equipment.id === itemId);
        if (!item) {
            slotNode.textContent = "裝備異常，請重拖曳";
            return;
        }

        const itemNode = document.createElement("div");
        itemNode.className = "equip-item";
        itemNode.draggable = true;
        itemNode.dataset.itemId = item.id;
        itemNode.dataset.fromSlot = slotName;
        itemNode.textContent = `${item.icon} ${item.name}`;
        slotNode.appendChild(itemNode);
    });

    statAttackText.textContent = String(gameState.playerStats.attack);
    statDefenseText.textContent = String(gameState.playerStats.defense);
    statMaxHpText.textContent = String(gameState.playerStats.maxHp);
    statSpeedText.textContent = String(gameState.playerStats.speed);
}

/**
 * 切換敵人（依劇情進度更新）。
 */
function syncEnemyByProgress() {
    const targetIndex = getEnemyStageIndexByProgress();
    if (targetIndex !== gameState.enemyStageIndex && gameState.enemyHp <= 0) {
        gameState.enemyStageIndex = targetIndex;
        gameState.currentEnemy = ENEMY_STAGES[targetIndex];
        gameState.enemyHp = gameState.currentEnemy.maxHp;
        battleLogText.textContent = `新敵人登場：${gameState.currentEnemy.name}！`;
    } else if (!gameState.currentEnemy) {
        gameState.enemyStageIndex = targetIndex;
        gameState.currentEnemy = ENEMY_STAGES[targetIndex];
        gameState.enemyHp = gameState.currentEnemy.maxHp;
    }
}

/**
 * 播放攻擊與受擊動畫。
 */
function playBattleAnimation(attackerNode, targetNode) {
    attackerNode.classList.remove("attacking");
    targetNode.classList.remove("hit");
    void attackerNode.offsetWidth;
    attackerNode.classList.add("attacking");
    targetNode.classList.add("hit");
    window.setTimeout(() => {
        attackerNode.classList.remove("attacking");
        targetNode.classList.remove("hit");
    }, 320);
}

/**
 * 戰鬥衝擊特效：讓戰鬥區短暫震動，提升打擊感。
 */
function triggerBattleImpact() {
    if (!battlePanel) {
        return;
    }
    battlePanel.classList.remove("impact");
    void battlePanel.offsetWidth;
    battlePanel.classList.add("impact");
    window.setTimeout(() => {
        battlePanel.classList.remove("impact");
    }, 280);
}

/**
 * 計算玩家本回合傷害：
 * 基礎攻擊 + 隨機波動 + 等級補正，並套用最低傷害保底。
 */
function calculatePlayerDamage() {
    const baseDamage = Math.max(
        MIN_PLAYER_DAMAGE,
        gameState.playerStats.attack + Math.floor(Math.random() * PLAYER_DAMAGE_RANDOM_VARIANCE) + getDisplayLevel()
    );
    const isCritical = Math.random() < PLAYER_CRITICAL_CHANCE;
    const damage = isCritical ? Math.round(baseDamage * PLAYER_CRITICAL_MULTIPLIER) : baseDamage;
    return { damage, isCritical };
}

/**
 * 計算敵人反擊傷害：
 * 敵人攻擊力 - 玩家防禦減傷 + 隨機波動，並套用最低傷害保底。
 */
function calculateEnemyDamage() {
    const baseDamage = Math.max(
        MIN_ENEMY_DAMAGE,
        gameState.currentEnemy.attack - Math.floor(gameState.playerStats.defense / DEFENSE_REDUCTION_DIVISOR) + Math.floor(Math.random() * ENEMY_DAMAGE_RANDOM_VARIANCE)
    );
    const isCritical = Math.random() < ENEMY_CRITICAL_CHANCE;
    const damage = isCritical ? Math.round(baseDamage * ENEMY_CRITICAL_MULTIPLIER) : baseDamage;
    return { damage, isCritical };
}

/**
 * 擊敗敵人後，計算下一個敵人章節索引。
 * 會在「目前章節 + 1」與「依答對進度解鎖章節」之間取較大值，再限制到最大章節。
 */
function resolveNextEnemyStageIndex() {
    const progressStageIndex = getEnemyStageIndexByProgress();
    const advancedStageIndex = gameState.enemyStageIndex + 1;
    const desiredStageIndex = Math.max(advancedStageIndex, progressStageIndex);
    return Math.min(ENEMY_STAGES.length - 1, desiredStageIndex);
}

/**
 * 清除自動下一題計時器。
 */
function clearAutoNextTimer() {
    if (autoNextTimerId !== null) {
        window.clearTimeout(autoNextTimerId);
        autoNextTimerId = null;
    }
}

/**
 * 排程自動進入下一題。
 */
function scheduleAutoNextQuestion() {
    if (!gameState.autoNextEnabled || !gameState.started) {
        return;
    }

    clearAutoNextTimer();
    autoNextTimerId = window.setTimeout(() => {
        autoNextTimerId = null;
        generateAndShowQuestion();
    }, AUTO_NEXT_DELAY_MS);
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
 * 將一筆分數加入本機排行榜，排序後取前 LEADERBOARD_LIMIT 筆並更新 UI。
 * @param {{ name: string, score: number, stars: number, modeLabel: string, timestamp: number }} entry
 */
function saveToLocalLeaderboard(entry) {
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
        leaderboardHintText.textContent = "已儲存到本機排行榜（未設定線上資料庫）。";
    } else {
        leaderboardHintText.textContent = "儲存失敗：瀏覽器可能禁止 localStorage。";
    }

    renderLeaderboard();
}

/**
 * 從 Firebase Realtime Database 拉取線上排行榜（前 20 筆，依分數排序）。
 * 回傳陣列，失敗時回傳 null。
 */
async function fetchLeaderboardOnline() {
    try {
        const url = `${FIREBASE_DB_URL}/leaderboard.json?orderBy="score"&limitToLast=${ONLINE_LEADERBOARD_LIMIT}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!data) {
            return [];
        }

        return Object.values(data)
            .filter((item) => item && typeof item.name === "string" && Number.isFinite(item.score))
            .sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                if (b.stars !== a.stars) {
                    return b.stars - a.stars;
                }
                return a.timestamp - b.timestamp;
            })
            .slice(0, ONLINE_LEADERBOARD_LIMIT);
    } catch (error) {
        return null;
    }
}

/**
 * 將一筆分數寫入 Firebase Realtime Database。
 */
async function saveScoreOnline(entry) {
    const url = `${FIREBASE_DB_URL}/leaderboard.json`;
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry)
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
}

/**
 * 重新從 Firebase 載入排行榜並渲染。
 */
async function refreshOnlineLeaderboard() {
    leaderboardHintText.textContent = "線上排行榜載入中…";
    const data = await fetchLeaderboardOnline();
    if (data !== null) {
        leaderboardData = data;
        renderLeaderboard();
        leaderboardHintText.textContent = `線上排行榜（共 ${leaderboardData.length} 筆）`;
    } else {
        leaderboardHintText.textContent = "⚠️ 線上排行榜暫時無法連線。";
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
 * 儲存目前分數到排行榜（線上 Firebase 優先，無設定時降級為本機）。
 */
async function saveCurrentScore() {
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

    if (FIREBASE_DB_URL) {
        saveScoreButton.disabled = true;
        leaderboardHintText.textContent = "儲存中…";
        try {
            await saveScoreOnline(entry);
            leaderboardHintText.textContent = "✅ 已儲存到線上排行榜！重新載入中…";
            await refreshOnlineLeaderboard();
        } catch (error) {
            leaderboardHintText.textContent = "⚠️ 線上儲存失敗，已改存至本機。";
            saveToLocalLeaderboard(entry);
        } finally {
            saveScoreButton.disabled = false;
        }
    } else {
        saveToLocalLeaderboard(entry);
    }
}

/**
 * 確保題目區在目前視窗範圍內，避免在小螢幕操作時看不到題目。
 */
function ensureQuestionAreaVisible() {
    if (!questionArea) {
        return;
    }

    const rect = questionArea.getBoundingClientRect();
    const viewportHeight = window.innerHeight ?? document.documentElement.clientHeight;
    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, viewportHeight);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibleRatio = rect.height > 0 ? visibleHeight / rect.height : 0;
    const isMostlyOutsideViewport = visibleRatio < QUESTION_VISIBILITY_THRESHOLD;

    if (isMostlyOutsideViewport) {
        questionArea.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}

/**
 * 產生下一題並顯示。
 */
function generateAndShowQuestion() {
    if (!gameState.started) {
        feedbackText.textContent = "請先按「開始遊戲」！";
        return;
    }

    clearAutoNextTimer();
    gameState.turn = "player";
    gameState.currentQuestion = createQuestionByMode();
    questionText.textContent = gameState.currentQuestion.text;
    answerInput.value = "";
    answerInput.focus();
    setTimeout(ensureQuestionAreaVisible, INPUT_FOCUS_SCROLL_DELAY_MS);
    feedbackText.textContent = "請輸入答案後按「提交答案」。";
    renderStatus();
    renderBattle();
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

    // 立即清除題目，防止在自動下一題 delay 期間重複按 Enter 刷分
    const question = gameState.currentQuestion;
    gameState.currentQuestion = null;

    const isCorrect = userAnswer === question.answer;
    const messageList = [];

    if (isCorrect) {
        const previousLevel = getDisplayLevel();

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

        gameState.turn = "player";
        playBattleAnimation(heroCard, enemyCard);
        const { damage: playerDamage, isCritical: playerCritical } = calculatePlayerDamage();
        triggerBattleImpact();
        gameState.enemyHp = Math.max(0, gameState.enemyHp - playerDamage);
        battleLogText.textContent = playerCritical ? `⚡ 暴擊！你造成 ${playerDamage} 點重創！` : `你造成 ${playerDamage} 點傷害！`;

        if (gameState.mode === "addSub" && currentLevel > previousLevel) {
            playLevelUpAnimation();
            playSoundEffect("levelUp");
            messageList.push(`🎉 升級成功！你來到等級 ${currentLevel}！`);
        } else {
            playSoundEffect("correct");
            messageList.push(playerCritical
                ? `✅ 答對了！暴擊命中，對 ${gameState.currentEnemy.name} 造成 ${playerDamage} 點重創！`
                : `✅ 答對了！你對 ${gameState.currentEnemy.name} 造成 ${playerDamage} 點傷害！`);
        }

        if (gameState.enemyHp <= 0) {
            messageList.push(`💥 你擊敗了 ${gameState.currentEnemy.name}！`);
            gameState.enemyStageIndex = resolveNextEnemyStageIndex();
            gameState.currentEnemy = ENEMY_STAGES[gameState.enemyStageIndex];
            gameState.enemyHp = gameState.currentEnemy.maxHp;
            battleLogText.textContent = `新敵人登場：${gameState.currentEnemy.name}！`;
            messageList.push(`🆕 ${gameState.currentEnemy.name} 登場，準備下一輪對戰！`);
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
        gameState.turn = "enemy";
        renderTurn();
        playBattleAnimation(enemyCard, heroCard);

        const { damage: enemyDamage, isCritical: enemyCritical } = calculateEnemyDamage();
        triggerBattleImpact();
        gameState.playerHp = Math.max(0, gameState.playerHp - enemyDamage);
        battleLogText.textContent = enemyCritical
            ? `${gameState.currentEnemy.name} 使出重擊，造成 ${enemyDamage} 點傷害！`
            : `${gameState.currentEnemy.name} 反擊造成 ${enemyDamage} 點傷害！`;

        playSoundEffect("wrong");
        messageList.push(`❌ 答錯了！正確答案是 ${question.answer}`);
        messageList.push(enemyCritical ? `受到重擊 ${enemyDamage} 點傷害。` : `受到 ${enemyDamage} 點傷害。`);
        if (gameState.playerHp <= 0) {
            gameState.started = false;
            clearAutoNextTimer();
            messageList.push("☠️ 勇者倒下了，請按「開始遊戲」重新出發！");
        }
        feedbackText.textContent = messageList.join(" ");
        window.setTimeout(() => {
            if (gameState.playerHp > 0) {
                gameState.turn = "player";
                renderTurn();
            }
        }, TURN_SWITCH_DELAY_MS);
    }

    syncEnemyByProgress();
    renderStatus();
    renderStory();
    renderBattle();
    scheduleAutoNextQuestion();
}

/**
 * 重設進度：回到初始狀態。
 */
function resetProgress() {
    clearAutoNextTimer();
    gameState.score = 0;
    gameState.streak = 0;
    gameState.stars = 0;
    gameState.addSubCorrectCount = 0;
    gameState.multiplyCorrectCount = 0;
    gameState.totalCorrect = 0;
    gameState.totalWrong = 0;
    gameState.currentQuestion = null;
    gameState.started = false;
    gameState.turn = "player";
    gameState.enemyStageIndex = 0;
    gameState.currentEnemy = ENEMY_STAGES[0];
    gameState.enemyHp = gameState.currentEnemy.maxHp;
    gameState.playerStats = calculatePlayerStats();
    gameState.playerHp = gameState.playerStats.maxHp;

    questionText.textContent = "按下「開始遊戲」後會出題";
    answerInput.value = "";
    feedbackText.textContent = "進度已重設，準備好再開始！";
    battleLogText.textContent = "戰鬥已重置，準備再次挑戰。";
    renderStatus();
    renderStory();
    renderBattle();
    renderEquipment();
}

/**
 * 切換模式：
 * - 只切換遊戲種類，不重置總分
 * - 清空當前題目並請玩家開始新回合
 */
function toggleMode() {
    clearAutoNextTimer();
    gameState.mode = gameState.mode === "addSub" ? "multiply" : "addSub";
    gameState.streak = 0;
    gameState.currentQuestion = null;
    gameState.started = false;
    gameState.turn = "player";
    gameState.playerStats = calculatePlayerStats();
    gameState.playerHp = gameState.playerStats.maxHp;
    gameState.enemyStageIndex = getEnemyStageIndexByProgress();
    gameState.currentEnemy = ENEMY_STAGES[gameState.enemyStageIndex];
    gameState.enemyHp = gameState.currentEnemy.maxHp;

    questionText.textContent = "模式已切換，按下「開始遊戲」開始新挑戰";
    answerInput.value = "";
    feedbackText.textContent = "新模式準備完成！";
    battleLogText.textContent = `目前戰場：${gameState.currentEnemy.name}`;
    renderMode();
    renderStatus();
    renderStory();
    renderBattle();
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
 * 切換自動下一題開關。
 */
function toggleAutoNext() {
    gameState.autoNextEnabled = !gameState.autoNextEnabled;
    if (!gameState.autoNextEnabled) {
        clearAutoNextTimer();
    }
    renderAutoNextButton();
    feedbackText.textContent = gameState.autoNextEnabled ? "已開啟自動下一題 ⏭️" : "已關閉自動下一題 ⏸️";
}

/**
 * 初始化觸控數字鍵盤。
 */
function setupTouchKeypad() {
    if (!touchKeypad) {
        return;
    }

    touchKeypad.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) {
            return;
        }

        const key = target.dataset.key;
        if (!key) {
            return;
        }

        if (key === "clear") {
            answerInput.value = "";
            answerInput.focus();
            return;
        }

        if (key === "backspace") {
            answerInput.value = answerInput.value.slice(0, -1);
            answerInput.focus();
            return;
        }

        answerInput.value += key;
        answerInput.focus();
    });
}

/**
 * 初始化裝備拖曳互動。
 */
function setupEquipmentDragDrop() {
    const dropZones = [inventoryList, slotWeapon, slotArmor, slotRelic];

    document.addEventListener("dragstart", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement) || !target.classList.contains("equip-item")) {
            return;
        }

        const payload = {
            itemId: target.dataset.itemId || "",
            fromSlot: target.dataset.fromSlot || ""
        };
        event.dataTransfer?.setData("text/plain", JSON.stringify(payload));
    });

    dropZones.forEach((zone) => {
        zone.addEventListener("dragover", (event) => {
            event.preventDefault();
            zone.classList.add("drag-over");
        });

        zone.addEventListener("dragleave", () => {
            zone.classList.remove("drag-over");
        });

        zone.addEventListener("drop", (event) => {
            event.preventDefault();
            zone.classList.remove("drag-over");
            const raw = event.dataTransfer?.getData("text/plain");
            if (!raw) {
                return;
            }

            let payload;
            try {
                payload = JSON.parse(raw);
            } catch (error) {
                return;
            }

            const itemId = typeof payload.itemId === "string" ? payload.itemId : "";
            const fromSlot = typeof payload.fromSlot === "string" ? payload.fromSlot : "";

            if (!itemId) {
                return;
            }

            if (zone === inventoryList) {
                if (fromSlot) {
                    unequipSlot(fromSlot);
                }
                return;
            }

            const targetSlot = zone.dataset.slot;
            if (!targetSlot) {
                return;
            }
            if (fromSlot === targetSlot) {
                feedbackText.textContent = `這件裝備已在「${SLOT_DISPLAY_NAMES[targetSlot]}欄」。`;
                return;
            }
            equipItem(itemId, targetSlot);
        });
    });
}

/**
 * 開始遊戲。
 */
function startGame() {
    initAudioContext();
    if (gameState.bgmEnabled) {
        startBgmLoop();
    }

    gameState.playerStats = calculatePlayerStats();
    if (gameState.playerHp <= 0 || gameState.playerHp > gameState.playerStats.maxHp) {
        gameState.playerHp = gameState.playerStats.maxHp;
    }
    if (gameState.enemyHp <= 0) {
        gameState.enemyStageIndex = getEnemyStageIndexByProgress();
        gameState.currentEnemy = ENEMY_STAGES[gameState.enemyStageIndex];
        gameState.enemyHp = gameState.currentEnemy.maxHp;
    }
    gameState.turn = "player";
    gameState.started = true;
    feedbackText.textContent = "遊戲開始！加油！";
    battleLogText.textContent = `遭遇 ${gameState.currentEnemy.name}，請開始答題攻擊！`;
    renderEquipment();
    renderBattle();
    generateAndShowQuestion();
}

// ===== 事件綁定 =====
switchModeButton.addEventListener("click", toggleMode);
toggleSoundButton.addEventListener("click", toggleSound);
toggleBgmButton.addEventListener("click", toggleBgm);
toggleAutoNextButton.addEventListener("click", toggleAutoNext);
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

answerInput.addEventListener("focus", () => {
    setTimeout(ensureQuestionAreaVisible, INPUT_FOCUS_SCROLL_DELAY_MS);
});

// 玩家名稱輸入框按 Enter 可直接儲存分數
playerNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        saveCurrentScore();
    }
});

// ===== 初始渲染 =====
loadBadgeProgress();
gameState.playerStats = calculatePlayerStats();
gameState.playerHp = gameState.playerStats.maxHp;
gameState.enemyStageIndex = getEnemyStageIndexByProgress();
gameState.currentEnemy = ENEMY_STAGES[gameState.enemyStageIndex];
gameState.enemyHp = gameState.currentEnemy.maxHp;
renderMode();
renderSoundButton();
renderBgmButton();
renderAutoNextButton();
renderStatus();
renderStory();
renderBattle();
renderEquipment();
renderBadges();

// 依設定決定使用線上排行榜或本機排行榜
if (FIREBASE_DB_URL) {
    renderLeaderboard();
    refreshOnlineLeaderboard();
} else {
    leaderboardData = loadLeaderboard();
    renderLeaderboard();
}

setupTouchKeypad();
setupEquipmentDragDrop();
