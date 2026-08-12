// Text-to-Speech using browser SpeechSynthesis API

let preferredVoice = null;
let voicesLoaded = false;

// Acknowledgment phrases for wake word
const ACK_PHRASES = [
    'hmm?',
    'yes?',
    "what's up?",
    'yeah?',
    'listening',
    'go ahead',
    'mm-hmm?',
    "what's that?",
    'hey'
];

function loadVoices() {
    const voices = speechSynthesis.getVoices();

    if (voices.length === 0) {
        return false;
    }

    // Try to find "Junior" voice
    preferredVoice = voices.find(v => v.name.toLowerCase().includes('eddy') && v.lang.includes('US'));

    // Fallback to any English voice if Junior not found
    if (!preferredVoice) {
        preferredVoice = voices.find(v => v.lang.startsWith('en'));
    }

    if (preferredVoice) {
        console.log(`🔊 [TTS] Using voice: ${preferredVoice.name}`);
    } else {
        console.log('🔊 [TTS] Using default voice');
    }

    voicesLoaded = true;
    return true;
}

export function initSpeech() {
    if (!('speechSynthesis' in window)) {
        console.error('🔊 [TTS] SpeechSynthesis not supported');
        return false;
    }

    // Voices may load asynchronously
    if (!loadVoices()) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }

    console.log('🔊 [TTS] Speech synthesis initialized');
    return true;
}

export function speak(text, options = {}) {
    if (!('speechSynthesis' in window)) {
        console.error('🔊 [TTS] SpeechSynthesis not supported');
        return Promise.reject(new Error('SpeechSynthesis not supported'));
    }

    return new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(text);

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.25;
        utterance.volume = options.volume || 1.0;

        utterance.onend = () => {
            console.log(`🔊 [TTS] Finished: "${text}"`);
            resolve();
        };

        utterance.onerror = (event) => {
            console.error('🔊 [TTS] Error:', event.error);
            reject(new Error(event.error));
        };

        console.log(`🔊 [TTS] Speaking: "${text}"`);
        speechSynthesis.speak(utterance);
    });
}

export function speakAck() {
    const phrase = ACK_PHRASES[Math.floor(Math.random() * ACK_PHRASES.length)];
    return speak(phrase);
}

export function stopSpeaking() {
    speechSynthesis.cancel();
}
