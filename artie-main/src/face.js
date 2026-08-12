const state = {
    face: '(◕‿◕)',
    isInteracting: false,
    timers: {
        blink: null,
        rollEyes: null,
        lookOver: null,
        loading: null
    }
};

function setFace(newFace) {
    const element = document.getElementById('face')
    const classMap = {
        0: 'cheek left-cheek',
        1: 'eye left-eye',
        2: 'mouth left-mouth',
        3: 'mouth right-mouth',
        4: 'eye right-eye',
        5: 'cheek right-cheek',
    }

    if (element) {
        element.innerHTML = newFace
            .split('')
            .map((char, index) => {
                const className = classMap[index] || '';
                return `<div class="${className}">${char}</div>`;
            })
            .join('')
    }
}

function swapEyes(newEyeChar, duration = 350) {
    if (state.isInteracting) return;

    state.isInteracting = true;
    const leftEye = document.querySelector('.left-eye');
    const rightEye = document.querySelector('.right-eye');
    
    const originalLeft = leftEye.textContent;
    const originalRight = rightEye.textContent;
    
    leftEye.textContent = newEyeChar;
    rightEye.textContent = newEyeChar;
    
    setTimeout(() => {
        leftEye.textContent = originalLeft;
        rightEye.textContent = originalRight;
        state.isInteracting = false;
    }, duration);
}

function rollEyes() {
    if (state.isInteracting) return;
    
    state.isInteracting = true;
    const faceElement = document.getElementById('face');
    
    faceElement.classList.add('roll-eyes');
    
    setTimeout(() => {
        faceElement.classList.remove('roll-eyes');
        state.isInteracting = false;
    }, 2000);
}

function scheduleNextBlink() {
    const delay = Math.random() * 5000 + 1000;
    
    state.timers.blink = setTimeout(() => {
        swapEyes('-');
        scheduleNextBlink();
    }, delay);
}

function scheduleNextRollEyes() {
    const delay = Math.random() * 10000 + 5000;
    
    state.timers.rollEyes = setTimeout(() => {
        rollEyes();
        scheduleNextRollEyes();
    }, delay);
}

function scheduleNextLookOver() {
    const delay = Math.random() * 5000 + 1000;
    
    state.timers.lookOver = setTimeout(() => {
        swapEyes('⚆', 750);
        scheduleNextLookOver();
    }, delay);
}

function clearAllTimers() {
    // Clear all existing timers
    Object.keys(state.timers).forEach(key => {
        if (state.timers[key]) {
            clearTimeout(state.timers[key]);
            clearInterval(state.timers[key]);
            state.timers[key] = null;
        }
    });
}

function restoreAnimations() {
    // Restart the animations that were active before loading
    scheduleNextBlink();
    scheduleNextRollEyes();
    state.isInteracting = false;
}

function scheduleLoadingAnimation(duration = 5000) {
    // Clear all existing animations
    clearAllTimers();
    
    state.isInteracting = true;
    const pattern = ["⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏", "⠋"];
    let index = 0;

    // Start the loading animation
    state.timers.loading = setInterval(() => {
        setFace('(' + pattern[index] + '_ʖ' + pattern[index] + ')');
        index = (index + 1) % pattern.length;
    }, 150);

    // Stop loading after the specified duration and restore animations
    setTimeout(() => {
        clearInterval(state.timers.loading);
        state.timers.loading = null;
        setFace('(◕_ʖ◕)');
        restoreAnimations();
    }, duration);
}

export { 
    setFace, 
    scheduleNextBlink, 
    scheduleNextRollEyes, 
    scheduleNextLookOver,
    scheduleLoadingAnimation
}