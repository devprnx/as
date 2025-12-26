// ============================================
// GLOBAL STATE & CONFIGURATION
// ============================================

const gameState = {
    chaptersCompleted: JSON.parse(localStorage.getItem('chaptersCompleted')) || [],
    heartsFound: JSON.parse(localStorage.getItem('heartsFound')) || [],
    starsClicked: 0,
    soundEnabled: true,
    totalChapters: 9,
    totalHearts: 15
};

// Chapter dependencies (what needs to be completed to unlock)
const chapterDependencies = {
    'childhood': [],
    'texts': ['childhood'],
    'hola': ['texts'],
    'night': ['hola'],
    'diary': ['night'],
    'timeline': ['diary'],
    'album': ['timeline'],
    'salonighar': ['album'],
    'newyear': ['salonighar']
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    setupEventListeners();
    updateProgress();
    checkUnlocks();
    
    // Add floating particles
    createFloatingHearts();
    
    // Start background music from 18 seconds
    const bgm = document.getElementById('bgm');
    const bgm2 = document.getElementById('bgm2');
    
    if (bgm && bgm2) {
        bgm.currentTime = 18;
        bgm.volume = 0.3;
        bgm2.volume = 0.3;
        
        // Play second song when first song ends
        bgm.addEventListener('ended', () => {
            bgm2.play();
        });
        
        bgm.play().catch(err => {
            console.log('Autoplay prevented. User interaction required.');
        });
    }
});

function initializeGame() {
    console.log('🎮 Game initialized');
    console.log('📊 Chapters completed:', gameState.chaptersCompleted);
    console.log('💕 Hearts found:', gameState.heartsFound.length);
    
    // Update hearts counter
    updateHeartsCounter();
    
    // Mark completed chapters
    gameState.chaptersCompleted.forEach(chapter => {
        const obj = document.getElementById(`obj-${chapter}`);
        if (obj) {
            obj.classList.remove('locked');
            obj.classList.add('completed');
        }
    });
    
    // Mark collected hearts
    gameState.heartsFound.forEach(heartId => {
        const heart = document.querySelector(`[data-heart="${heartId}"]`);
        if (heart) {
            heart.classList.add('collected');
        }
    });
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Object clicks
    document.querySelectorAll('.object-item').forEach(obj => {
        obj.addEventListener('click', handleObjectClick);
    });
    
    // Hidden hearts
    document.querySelectorAll('.hidden-heart').forEach(heart => {
        heart.addEventListener('click', handleHeartClick);
    });
    
    // Easter egg stars
    document.querySelectorAll('.star-easter-egg').forEach(star => {
        star.addEventListener('click', handleStarClick);
    });
    
    // Sound toggle
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', toggleSound);
    }
}

// ============================================
// CHAPTER NAVIGATION & UNLOCKING
// ============================================

function handleObjectClick(e) {
    const obj = e.currentTarget;
    const chapter = obj.dataset.chapter;
    
    // Check if locked
    if (obj.classList.contains('locked')) {
        playSound('locked');
        showNotification('🔒 Complete the previous chapter first!');
        obj.style.animation = 'shake 0.5s';
        setTimeout(() => obj.style.animation = '', 500);
        return;
    }
    
    // Play click sound
    playSound('click');
    
    // Navigate to chapter
    navigateToChapter(chapter);
}

function navigateToChapter(chapter) {
    // Store current chapter in session
    sessionStorage.setItem('currentChapter', chapter);
    
    // Navigate to chapter page
    window.location.href = `chapters/${chapter}.html`;
}

function checkUnlocks() {
    Object.keys(chapterDependencies).forEach(chapter => {
        const dependencies = chapterDependencies[chapter];
        const allCompleted = dependencies.every(dep => 
            gameState.chaptersCompleted.includes(dep)
        );
        
        const obj = document.getElementById(`obj-${chapter}`);
        if (obj && allCompleted && !gameState.chaptersCompleted.includes(chapter)) {
            obj.classList.remove('locked');
            
            // Add unlock animation
            setTimeout(() => {
                obj.style.animation = 'zoomIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                playSound('unlock');
                showNotification(`✨ ${chapter.toUpperCase()} chapter unlocked!`);
            }, 300);
        }
    });
}

function markChapterComplete(chapter) {
    if (!gameState.chaptersCompleted.includes(chapter)) {
        gameState.chaptersCompleted.push(chapter);
        localStorage.setItem('chaptersCompleted', JSON.stringify(gameState.chaptersCompleted));
        updateProgress();
        checkUnlocks();
    }
}

// Expose function for chapter pages to call
window.markChapterComplete = markChapterComplete;

// ============================================
// MEMORY HUNT (HIDDEN HEARTS)
// ============================================

function handleHeartClick(e) {
    e.stopPropagation();
    
    const heart = e.currentTarget;
    const heartId = heart.dataset.heart;
    
    if (gameState.heartsFound.includes(heartId)) {
        return;
    }
    
    // Collect heart
    gameState.heartsFound.push(heartId);
    localStorage.setItem('heartsFound', JSON.stringify(gameState.heartsFound));
    
    heart.classList.add('collected');
    
    // Play collect sound
    playSound('heart');
    
    // Create floating heart animation
    createFloatingHeart(e.clientX, e.clientY);
    
    // Update counter
    updateHeartsCounter();
    
    // Check if all hearts collected
    if (gameState.heartsFound.length >= gameState.totalHearts) {
        setTimeout(() => {
            showSecretMessage();
        }, 1000);
    } else {
        showNotification(`💕 Heart collected! ${gameState.heartsFound.length}/${gameState.totalHearts}`);
    }
}

function updateHeartsCounter() {
    const counter = document.getElementById('hearts-found');
    if (counter) {
        counter.textContent = gameState.heartsFound.length;
        
        // Pulse animation
        counter.parentElement.style.animation = 'none';
        setTimeout(() => {
            counter.parentElement.style.animation = 'pulse 0.5s';
        }, 10);
    }
}

function showSecretMessage() {
    const overlay = document.getElementById('secret-overlay');
    if (overlay) {
        overlay.classList.add('active');
        playSound('success');
        createConfetti();
    }
}

function closeSecret() {
    const overlay = document.getElementById('secret-overlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

window.closeSecret = closeSecret;

// ============================================
// EASTER EGG - STAR CLICKS
// ============================================

function handleStarClick(e) {
    const star = e.currentTarget;
    gameState.starsClicked++;
    
    star.style.animation = 'spin 0.5s';
    playSound('star');
    
    if (gameState.starsClicked === 5) {
        showNotification('⭐ All stars clicked! You found the easter egg! ✨');
        createStarBurst();
        
        // Add bonus hearts
        for (let i = 9; i <= 15; i++) {
            if (!gameState.heartsFound.includes(i.toString())) {
                gameState.heartsFound.push(i.toString());
            }
        }
        localStorage.setItem('heartsFound', JSON.stringify(gameState.heartsFound));
        updateHeartsCounter();
    }
    
    setTimeout(() => {
        star.style.animation = '';
    }, 500);
}

// ============================================
// PROGRESS TRACKING
// ============================================

function updateProgress() {
    const progress = (gameState.chaptersCompleted.length / gameState.totalChapters) * 100;
    const progressFill = document.getElementById('progress-fill');
    const progressPercent = document.getElementById('progress-percent');
    
    if (progressFill) {
        progressFill.style.width = progress + '%';
    }
    
    if (progressPercent) {
        progressPercent.textContent = Math.round(progress);
    }
    
    // Check if journey complete
    if (progress === 100 && !localStorage.getItem('journeyCompleted')) {
        localStorage.setItem('journeyCompleted', 'true');
        setTimeout(() => {
            showJourneyComplete();
        }, 1000);
    }
}

function showJourneyComplete() {
    // Create completion overlay
    const overlay = document.createElement('div');
    overlay.className = 'journey-complete-overlay';
    overlay.innerHTML = `
        <div class="journey-complete-card">
            <h1 class="journey-title">🎊 Journey Complete! 🎊</h1>
            
            <div class="journey-stats">
                <div class="stat-item">
                    <div class="stat-number">9</div>
                    <div class="stat-label">Chapters Explored</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${gameState.heartsFound.length}</div>
                    <div class="stat-label">Hearts Found</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">∞</div>
                    <div class="stat-label">Memories Created</div>
                </div>
            </div>

            <div class="journey-message">
                <p class="message-line">From the first click to this moment...</p>
                <p class="message-line">You've explored every chapter of our story 💖</p>
                <p class="message-line special">Archana & Saloni - A friendship that's forever! ✨</p>
            </div>

            <div class="final-quote">
                <p>"Some journeys end, but our story... it's just beginning."</p>
                <p class="quote-author">~ Happy New Year 2026! 🎆 ~</p>
            </div>

            <div class="journey-buttons">
                <button onclick="replayJourney()" class="journey-btn replay-btn">
                    🔄 Replay Journey
                </button>
                <button onclick="closeJourneyComplete()" class="journey-btn continue-btn">
                    ✨ Continue Exploring
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Trigger animations
    setTimeout(() => {
        overlay.classList.add('active');
        playCompletionMelody();
        createMassiveFireworks();
    }, 100);
}

function closeJourneyComplete() {
    const overlay = document.querySelector('.journey-complete-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 500);
    }
}

function replayJourney() {
    if (confirm('This will reset all progress and start the journey from beginning. Are you sure?')) {
        localStorage.clear();
        location.reload();
    }
}

function playCompletionMelody() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const melody = [
        523, 587, 659, 698, 784, 880, 988, 1047,  // Ascending
        1047, 988, 880, 784, 698, 659, 587, 523,  // Descending
        1047, 1047, 1175, 1047, 880, 784          // Victory phrase
    ];
    
    melody.forEach((freq, i) => {
        setTimeout(() => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(audioContext.destination);
            
            osc.frequency.setValueAtTime(freq, audioContext.currentTime);
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0.15, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + 0.5);
        }, i * 180);
    });
}

function createMassiveFireworks() {
    const container = document.createElement('div');
    container.className = 'massive-fireworks';
    document.body.appendChild(container);
    
    const emojis = ['🎆', '🎇', '✨', '💫', '⭐', '🌟', '💖', '💕', '🎉', '🎊'];
    
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const firework = document.createElement('div');
            firework.className = 'mega-firework';
            firework.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            firework.style.left = Math.random() * 100 + '%';
            firework.style.top = Math.random() * 100 + '%';
            firework.style.fontSize = (Math.random() * 3 + 1.5) + 'rem';
            firework.style.animationDelay = Math.random() * 0.5 + 's';
            
            container.appendChild(firework);
            
            setTimeout(() => firework.remove(), 3000);
        }, i * 50);
    }
    
    setTimeout(() => container.remove(), 8000);
}

window.closeJourneyComplete = closeJourneyComplete;
window.replayJourney = replayJourney;

// ============================================
// SOUND SYSTEM
// ============================================

function playSound(type) {
    if (!gameState.soundEnabled) return;
    
    // Using Web Audio API to create simple sounds
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const sounds = {
        'click': { freq: 800, duration: 0.1 },
        'unlock': { freq: 1200, duration: 0.3 },
        'locked': { freq: 300, duration: 0.2 },
        'heart': { freq: 1000, duration: 0.15 },
        'star': { freq: 1500, duration: 0.2 },
        'success': { freq: 1400, duration: 0.5 }
    };
    
    const sound = sounds[type] || sounds.click;
    
    oscillator.frequency.setValueAtTime(sound.freq, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + sound.duration);
}

function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    const toggle = document.getElementById('sound-toggle');
    
    if (toggle) {
        toggle.classList.toggle('muted');
        showNotification(gameState.soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF');
    }
}

// ============================================
// VISUAL EFFECTS
// ============================================

function createFloatingHeart(x, y) {
    const heart = document.createElement('div');
    heart.textContent = '💕';
    heart.style.position = 'fixed';
    heart.style.left = x + 'px';
    heart.style.top = y + 'px';
    heart.style.fontSize = '3rem';
    heart.style.pointerEvents = 'none';
    heart.style.zIndex = '9999';
    heart.style.animation = 'floatUp 2s ease-out forwards';
    
    document.body.appendChild(heart);
    
    setTimeout(() => heart.remove(), 2000);
}

function createFloatingHearts() {
    setInterval(() => {
        const heart = document.createElement('div');
        heart.textContent = ['💕', '💖', '💗', '💝'][Math.floor(Math.random() * 4)];
        heart.style.position = 'fixed';
        heart.style.left = Math.random() * 100 + 'vw';
        heart.style.top = '110vh';
        heart.style.fontSize = (Math.random() * 2 + 1) + 'rem';
        heart.style.opacity = '0.3';
        heart.style.pointerEvents = 'none';
        heart.style.zIndex = '1';
        heart.style.animation = `floatUpSlow ${Math.random() * 10 + 10}s linear forwards`;
        
        document.body.appendChild(heart);
        
        setTimeout(() => heart.remove(), 20000);
    }, 3000);
}

function createConfetti() {
    const colors = ['#ffd1dc', '#e0b0ff', '#b0e0e6', '#fff4ba', '#ffdab9'];
    const emojis = ['🎉', '✨', '💖', '🎊', '⭐'];
    
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-50px';
            confetti.style.fontSize = (Math.random() * 2 + 1) + 'rem';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '10000';
            confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 5000);
        }, i * 30);
    }
}

function createStarBurst() {
    for (let i = 0; i < 20; i++) {
        const star = document.createElement('div');
        star.textContent = '⭐';
        star.style.position = 'fixed';
        star.style.left = '50%';
        star.style.top = '50%';
        star.style.fontSize = '2rem';
        star.style.pointerEvents = 'none';
        star.style.zIndex = '10000';
        
        const angle = (i / 20) * Math.PI * 2;
        const distance = 200;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        star.style.animation = `burst${i} 1s ease-out forwards`;
        
        const keyframes = `
            @keyframes burst${i} {
                to {
                    transform: translate(${x}px, ${y}px) scale(0);
                    opacity: 0;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = keyframes;
        document.head.appendChild(styleSheet);
        
        document.body.appendChild(star);
        
        setTimeout(() => {
            star.remove();
            styleSheet.remove();
        }, 1000);
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '50%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.background = 'rgba(255, 255, 255, 0.95)';
    notification.style.padding = '20px 40px';
    notification.style.borderRadius = '20px';
    notification.style.fontSize = '1.3rem';
    notification.style.fontWeight = '600';
    notification.style.color = '#b76e79';
    notification.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
    notification.style.zIndex = '10001';
    notification.style.animation = 'zoomIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'zoomOut 0.5s ease-in forwards';
        setTimeout(() => notification.remove(), 500);
    }, 2500);
}

// ============================================
// ADDITIONAL ANIMATIONS (CSS injected via JS)
// ============================================

const additionalStyles = `
    @keyframes floatUp {
        to {
            transform: translateY(-200px);
            opacity: 0;
        }
    }
    
    @keyframes floatUpSlow {
        to {
            transform: translateY(-110vh);
            opacity: 0;
        }
    }
    
    @keyframes fall {
        to {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    
    @keyframes spin {
        to { transform: rotate(360deg) scale(1.5); }
    }
    
    @keyframes zoomOut {
        to {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
        }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// ============================================
// UTILITY FUNCTIONS
// ============================================

function resetProgress() {
    if (confirm('Reset all progress? This cannot be undone!')) {
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
    }
}

window.resetProgress = resetProgress;

console.log('💖 Friendship Explorer initialized!');
console.log('🎮 Use window.resetProgress() to reset all progress');
