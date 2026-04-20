/**
 * 數學冒險樂園 - 主要遊戲邏輯
 * ------------------------------------------------------------
 * 設計目標：
 * 1) 提供兩種模式：加減法闖關、九九乘法。
 * 2) 加減法依照國小 1~3 年級概念循序漸進：
 *    - 等級 1：1 位數加減法
 *    - 等級 2：2 位數加減法
 *    - 等級 3：3 位數加減法
 * 3) 純前端靜態網頁，直接開 index.html 就能遊玩。
 */

// ===== 取得畫面元件 =====
const switchModeButton = document.getElementById("switch-mode");
const toggleSoundButton = document.getElementById("toggle-sound");
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

// ===== 可調整的遊戲規則常數 =====
// 答對時加分分數（建議維持正整數）
const SCORE_REWARD = 10;
// 答錯時扣分分數（建議維持正整數，且小於答對加分）
const SCORE_PENALTY = 2;
// 每連續答對幾題可獲得 1 顆星星
const STAR_STREAK_REQUIREMENT = 3;

// ===== 遊戲狀態（集中管理，避免散落） =====
const gameState = {
    // mode: "addSub" = 加減法, "multiply" = 九九乘法
    mode: "addSub",
    score: 0,
    streak: 0,
    stars: 0,
    // addSubCorrectCount 用來驅動加減法難度升級
    addSubCorrectCount: 0,
    currentQuestion: null,
    started: false,
    soundEnabled: true
};

// ===== 音效系統（使用 Web Audio，無需外部音檔） =====
let audioContext = null;

/**
 * 在首次互動後初始化 AudioContext。
 * 這樣可以避免瀏覽器自動播放限制導致音效被擋下。
 */
function initAudioContext() {
    if (audioContext) {
        return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
        return;
    }
    audioContext = new AudioContextClass();
}

/**
 * 播放單一音符（很短的提示音）
 */
function playTone(frequency, durationSec, type = "sine", delaySec = 0) {
    if (!gameState.soundEnabled || !audioContext) {
        return;
    }

    const startAt = audioContext.currentTime + delaySec;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.0001, startAt);
    gainNode.gain.exponentialRampToValueAtTime(0.12, startAt + 0.01);
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
        playTone(660, 0.12, "triangle");
        playTone(880, 0.16, "triangle", 0.08);
        return;
    }

    if (effectType === "wrong") {
        playTone(220, 0.18, "sawtooth");
        playTone(165, 0.2, "sawtooth", 0.09);
        return;
    }

    if (effectType === "levelUp") {
        playTone(523.25, 0.12, "square");
        playTone(659.25, 0.12, "square", 0.08);
        playTone(783.99, 0.2, "square", 0.16);
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
 * 維持在課綱核心範圍，讓孩子反覆熟悉乘法表。
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
 * 依照目前模式建立新題目
 */
function createQuestionByMode() {
    return gameState.mode === "addSub" ? createAddSubQuestion() : createMultiplyQuestion();
}

/**
 * 更新分數、等級、連續答對顯示
 */
function renderStatus() {
    scoreText.textContent = String(gameState.score);
    levelText.textContent = String(getDisplayLevel());
    streakText.textContent = String(gameState.streak);
    starsText.textContent = String(gameState.stars);
}

/**
 * 更新模式文字與切換按鈕文案
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
 * 更新音效開關按鈕文案
 */
function renderSoundButton() {
    toggleSoundButton.textContent = gameState.soundEnabled ? "🔊 音效：開" : "🔈 音效：關";
}

/**
 * 顯示星星爆發小動畫，增強獎勵感
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
 * 升級時讓等級數字閃動，讓孩子感受到「闖關成功」
 */
function playLevelUpAnimation() {
    levelText.classList.remove("level-up-flash");
    // 觸發重排，確保同一個 class 可重複播放動畫
    void levelText.offsetWidth;
    levelText.classList.add("level-up-flash");
}

/**
 * 產生下一題並顯示
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
 * 檢查作答結果並更新狀態
 * - 答對：分數 +SCORE_REWARD、連續答對 +1
 * - 答錯：分數 -SCORE_PENALTY（最低不低於 0）、連續答對歸零
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
        gameState.score += SCORE_REWARD;
        gameState.streak += 1;
        if (gameState.mode === "addSub") {
            gameState.addSubCorrectCount += 1;
        }
        const currentLevel = getDisplayLevel();

        // 每連續答對 STAR_STREAK_REQUIREMENT 題給 1 顆星星
        if (gameState.streak % STAR_STREAK_REQUIREMENT === 0) {
            gameState.stars += 1;
            popStarAnimation();
        }

        if (gameState.mode === "addSub" && currentLevel > previousLevel) {
            playLevelUpAnimation();
            playSoundEffect("levelUp");
            feedbackText.textContent = `🎉 升級成功！你來到等級 ${currentLevel}！`;
        } else {
            playSoundEffect("correct");
            feedbackText.textContent = "✅ 答對了！很棒，繼續挑戰下一題！";
        }

        if (gameState.streak % STAR_STREAK_REQUIREMENT === 0) {
            feedbackText.textContent += " 獲得 1 顆星星⭐";
        }
    } else {
        gameState.score = Math.max(0, gameState.score - SCORE_PENALTY);
        gameState.streak = 0;
        playSoundEffect("wrong");
        feedbackText.textContent = `❌ 再試一次！正確答案是 ${gameState.currentQuestion.answer}`;
    }

    renderStatus();
}

/**
 * 重設進度：回到初始狀態
 */
function resetProgress() {
    gameState.score = 0;
    gameState.streak = 0;
    gameState.stars = 0;
    gameState.addSubCorrectCount = 0;
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
 * 切換音效開關
 */
function toggleSound() {
    // 若使用者開啟音效，先嘗試初始化音效系統
    initAudioContext();
    gameState.soundEnabled = !gameState.soundEnabled;
    renderSoundButton();
    feedbackText.textContent = gameState.soundEnabled ? "音效已開啟 🔊" : "音效已關閉 🔈";
}

/**
 * 開始遊戲
 */
function startGame() {
    initAudioContext();
    gameState.started = true;
    feedbackText.textContent = "遊戲開始！加油！";
    generateAndShowQuestion();
}

// ===== 事件綁定 =====
switchModeButton.addEventListener("click", toggleMode);
toggleSoundButton.addEventListener("click", toggleSound);
startButton.addEventListener("click", startGame);
nextButton.addEventListener("click", generateAndShowQuestion);
submitButton.addEventListener("click", submitAnswer);
resetButton.addEventListener("click", resetProgress);

// 按 Enter 也能快速送出答案，提升操作流暢度
answerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        submitAnswer();
    }
});

// ===== 初始渲染 =====
renderMode();
renderSoundButton();
renderStatus();
