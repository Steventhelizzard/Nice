import { init as idleInit, cleanup as idleCleanup } from '../emotions/idle.js';
import { init as loadingInit, cleanup as loadingCleanup } from '../emotions/loading.js';
import { init as listeningInit, cleanup as listeningCleanup } from '../emotions/listening.js';
import { init as happyInit, cleanup as happyCleanup } from '../emotions/happy.js';
import { init as sadInit, cleanup as sadCleanup } from '../emotions/sad.js';
import { init as workingInit, cleanup as workingCleanup } from '../emotions/working.js';
import { init as confusedInit, cleanup as confusedCleanup } from '../emotions/confused.js';
import { init as sleepingInit, cleanup as sleepingCleanup } from '../emotions/sleeping.js';

// Centralized animation state
const animationState = {
    currentEmotion: null,
    timers: new Set(),
    intervals: new Set()
};

// Emotion registry with init and cleanup functions
const emotions = {
    idle: { init: idleInit, cleanup: idleCleanup },
    loading: { init: loadingInit, cleanup: loadingCleanup },
    listening: { init: listeningInit, cleanup: listeningCleanup },
    happy: { init: happyInit, cleanup: happyCleanup },
    sad: { init: sadInit, cleanup: sadCleanup },
    working: { init: workingInit, cleanup: workingCleanup },
    confused: { init: confusedInit, cleanup: confusedCleanup },
    sleeping: { init: sleepingInit, cleanup: sleepingCleanup }
};

// Centralized timer management - all timers go through here
function addTimeout(callback, delay) {
    const id = setTimeout(() => {
        animationState.timers.delete(id);
        callback();
    }, delay);
    animationState.timers.add(id);
    return id;
}

function addInterval(callback, delay) {
    const id = setInterval(callback, delay);
    animationState.intervals.add(id);
    return id;
}

function clearAllTimers() {
    // Clear all tracked timeouts
    for (const id of animationState.timers) {
        clearTimeout(id);
    }
    animationState.timers.clear();

    // Clear all tracked intervals
    for (const id of animationState.intervals) {
        clearInterval(id);
    }
    animationState.intervals.clear();
}

function cleanupCurrentEmotion() {
    // Clear all centrally tracked timers
    clearAllTimers();

    // Call the current emotion's cleanup if it exists
    if (animationState.currentEmotion && emotions[animationState.currentEmotion]) {
        emotions[animationState.currentEmotion].cleanup();
    }

    // Remove any lingering transient CSS classes from eyes
    const leftEye = document.querySelector('.left-eye');
    const rightEye = document.querySelector('.right-eye');
    if (leftEye) {
        leftEye.classList.remove('rolling', 'peeking', 'blink', 'happy-blink');
    }
    if (rightEye) {
        rightEye.classList.remove('rolling', 'peeking', 'blink', 'happy-blink');
    }

    // Hide cheeks by default - emotions that want them opt back in via setFaceShape
    const leftCheek = document.querySelector('.left-cheek');
    const rightCheek = document.querySelector('.right-cheek');
    if (leftCheek) leftCheek.classList.remove('visible');
    if (rightCheek) rightCheek.classList.remove('visible');
}

function setEmotion(emotionString) {
    // Don't re-init if already on this emotion
    if (animationState.currentEmotion === emotionString) {
        return;
    }

    // Cleanup previous emotion first
    cleanupCurrentEmotion();

    // Update face element classes
    const faceElement = document.getElementById('face');
    if (faceElement) {
        faceElement.className = '';
        faceElement.classList.add(`emotion-${emotionString}`);
    }

    // Initialize new emotion
    if (emotions[emotionString]) {
        animationState.currentEmotion = emotionString;
        emotions[emotionString].init();
    } else {
        console.warn(`Emotion "${emotionString}" not recognized.`);
        animationState.currentEmotion = null;
    }

    document.dispatchEvent(new CustomEvent('EmotionChanged', { detail: emotionString }));
}

export { setEmotion, addTimeout, addInterval };
