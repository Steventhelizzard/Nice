import { setEmotion } from './emotion.js';
import { sendToLLM, isConfigured } from './llm.js';
import { saveSegment, initStorage } from './storage.js';
import { initSpeech, speakAck, speak } from './speech.js';

// Speech recognition state
const state = {
    wakeWord: 'hey artie',

    recognition: null,
    isListening: false,
    isAwake: false,  // Whether wake word has been detected
    transcript: '',  // Accumulated transcript after wake word

    callbacks: {
        onWakeWord: null,
        onTranscriptUpdate: null,
        onTranscriptComplete: null,
        onProcessingStart: null,
        onProcessingComplete: null,
        onError: null
    }
};

// Normalize text for wake word comparison
function normalizeText(text) {
    return text.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

// Check if the transcript contains the wake word
function checkForWakeWord(transcript) {
    const normalized = normalizeText(transcript);
    return normalized.includes(normalizeText(state.wakeWord));
}

// Extract text after the wake word
function getTextAfterWakeWord(transcript) {
    const normalized = normalizeText(transcript);
    const wakeWordNormalized = normalizeText(state.wakeWord);
    const index = normalized.indexOf(wakeWordNormalized);
    
    if (index === -1) return '';
    
    // Get the portion after the wake word from the original transcript
    const afterWakeWordIndex = index + wakeWordNormalized.length;
    return transcript.slice(afterWakeWordIndex).trim();
}

async function playEmotionSequence(sequence) {
    // Play through each emotion in the sequence
    for (const item of sequence) {
        const { emotion, text } = item;

        // Set the emotion
        setEmotion(emotion);

        // Speak the text and wait for it to finish
        if (text) {
            await speak(text);
        }
    }

    // Return to idle after sequence completes
    setEmotion('idle');
}

async function processTranscript(transcript) {
    console.log(`📤 [LLM] Processing transcript:`, { transcript });

    if (!isConfigured()) {
        console.error('❌ [LLM] API key not configured');
        setEmotion('confused');
        if (state.callbacks.onError) {
            state.callbacks.onError(new Error('LLM API key not configured'));
        }
        return;
    }

    try {
        const result = await sendToLLM(transcript);
        console.log('📥 [LLM] Response received:', result);

        // Save to IndexedDB
        await saveSegment(transcript, result);
        console.log('💾 [STORAGE] Segment saved');

        // Check if result is an array of emotion sequences
        if (Array.isArray(result) && result.length > 0) {
            console.log('🎭 [EMOTION] Playing emotion sequence:', result);
            await playEmotionSequence(result);
        } else {
            console.log('🎭 [EMOTION] No sequence, returning to idle');
            setEmotion('idle');
        }

        if (state.callbacks.onProcessingComplete) {
            state.callbacks.onProcessingComplete(result);
        }

        return result;
    } catch (error) {
        console.error('❌ [LLM] Error processing transcript:', error);
        setEmotion('idle');

        if (state.callbacks.onError) {
            state.callbacks.onError(error);
        }
    }
}

async function handleResult(event) {
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        
        if (result.isFinal) {
            finalTranscript += transcript;
            console.log(`🎤 [FINAL] "${transcript}" (confidence: ${(confidence * 100).toFixed(1)}%)`);
        } else {
            interimTranscript += transcript;
        }
    }
    
    const currentTranscript = finalTranscript || interimTranscript;
    
    // Log live transcript (interim results)
    if (interimTranscript) {
        console.log(`🎤 [INTERIM] "${interimTranscript}"`);
    }
    
    if (!state.isAwake) {
        // Log wake word detection attempt
        console.log(`🎤 [WAKE CHECK] Checking for "${state.wakeWord}" in: "${currentTranscript}"`);
        
        // Check for wake word in the current transcript (use final if available)
        if (finalTranscript && checkForWakeWord(finalTranscript)) {
            // Wake word detected in final transcript - extract command and send immediately
            const command = getTextAfterWakeWord(finalTranscript);
            
            console.log('✅ [WAKE WORD] Detected in final transcript!');
            
            if (command.length > 0) {
                // We have both wake word and command in same utterance
                console.log(`📤 [COMMAND] Sending command: "${command}"`);
                setEmotion('loading');
                
                if (state.callbacks.onWakeWord) {
                    state.callbacks.onWakeWord();
                }
                
                if (state.callbacks.onTranscriptComplete) {
                    state.callbacks.onTranscriptComplete(command);
                }
                
                if (state.callbacks.onProcessingStart) {
                    state.callbacks.onProcessingStart();
                }
                
                await processTranscript(command);
                console.log('🔄 [STATE] Reset - waiting for wake word again');
            } else {
                // Wake word only, wait for next final transcript as the command
                state.isAwake = true;
                state.transcript = '';
                console.log('🎤 [STATE] Wake word detected, waiting for command...');
                setEmotion('listening');

                // Speak acknowledgment
                speakAck();

                if (state.callbacks.onWakeWord) {
                    state.callbacks.onWakeWord();
                }
            }
        } else if (interimTranscript && checkForWakeWord(interimTranscript)) {
            // Wake word detected in interim - show listening state but wait for final
            console.log('🎤 [INTERIM WAKE] Wake word detected in interim, waiting for final...');
            setEmotion('listening');
        }
    } else {
        // We're awake and waiting for a command
        if (finalTranscript) {
            // Got final transcript - this is the command, send it!
            const command = finalTranscript.trim();
            console.log(`📤 [COMMAND] Sending command: "${command}"`);
            
            setEmotion('loading');
            state.isAwake = false;
            state.transcript = '';
            
            if (state.callbacks.onTranscriptComplete) {
                state.callbacks.onTranscriptComplete(command);
            }
            
            if (state.callbacks.onProcessingStart) {
                state.callbacks.onProcessingStart();
            }
            
            await processTranscript(command);
            console.log('🔄 [STATE] Reset - waiting for wake word again');
        } else if (interimTranscript) {
            // Show interim transcript while waiting for final
            console.log(`🎤 [LISTENING] "${interimTranscript}"`);
            
            if (state.callbacks.onTranscriptUpdate) {
                state.callbacks.onTranscriptUpdate('', interimTranscript);
            }
        }
    }
}



function handleEnd() {
    console.log(`🎤 [EVENT] onend - isListening: ${state.isListening}`);
    
    // Restart recognition if still listening (continuous mode)
    if (state.isListening) {
        console.log('🔄 [RESTART] Restarting speech recognition...');
        try {
            state.recognition.start();
        } catch (error) {
            // Recognition might already be starting
            console.log('🔄 [RESTART] Recognition restart pending...');
        }
    }
}

function handleError(event) {
    console.error(`❌ [EVENT] onerror - ${event.error}`);
    
    // Handle specific errors
    switch (event.error) {
        case 'no-speech':
            // No speech detected - this is normal, just continue
            console.log('⚠️ [ERROR] No speech detected, continuing to listen...');
            break;
        case 'audio-capture':
            console.error('❌ [ERROR] No microphone found or microphone access denied');
            if (state.callbacks.onError) {
                state.callbacks.onError(new Error('Microphone access denied'));
            }
            break;
        case 'not-allowed':
            console.error('❌ [ERROR] Speech recognition permission denied');
            if (state.callbacks.onError) {
                state.callbacks.onError(new Error('Speech recognition permission denied'));
            }
            break;
        case 'network':
            console.error('❌ [ERROR] Network error during speech recognition');
            // Will auto-restart via handleEnd
            break;
        case 'aborted':
            console.log('⚠️ [ERROR] Speech recognition aborted');
            break;
        default:
            console.error(`❌ [ERROR] Unknown error: ${event.error}`);
            if (state.callbacks.onError) {
                state.callbacks.onError(new Error(event.error));
            }
    }
}

async function initSpeechRecognition(options = {}) {
    // Initialize storage
    await initStorage();
    console.log('💾 [STORAGE] IndexedDB initialized');

    // Initialize text-to-speech
    initSpeech();

    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.error('🎤 SpeechRecognition API not supported in this browser');
        if (options.onError) {
            options.onError(new Error('SpeechRecognition API not supported'));
        }
        return false;
    }

    // Configure state with options
    state.wakeWord = options.wakeWord || 'hey artie';
    
    state.callbacks.onWakeWord = options.onWakeWord || null;
    state.callbacks.onTranscriptUpdate = options.onTranscriptUpdate || null;
    state.callbacks.onTranscriptComplete = options.onTranscriptComplete || null;
    state.callbacks.onProcessingStart = options.onProcessingStart || null;
    state.callbacks.onProcessingComplete = options.onProcessingComplete || null;
    state.callbacks.onError = options.onError || null;
    
    // Create recognition instance
    state.recognition = new SpeechRecognition();
    
    // Configure recognition
    state.recognition.continuous = true;  // Keep listening continuously
    state.recognition.interimResults = true;  // Get results as user speaks
    state.recognition.lang = options.lang || 'en-US';
    state.recognition.maxAlternatives = 1;
    
    // Set up event handlers
    state.recognition.onresult = handleResult;
    
    state.recognition.onspeechstart = () => {
        console.log('🎤 [EVENT] onspeechstart - Speech detected');
        if (!state.isAwake) {
            // Show we're detecting sound but waiting for wake word
            setEmotion('idle');
        }
    };
    
    state.recognition.onspeechend = () => {
        console.log('🎤 [EVENT] onspeechend - Speech ended');
        // No longer using this for command detection - we use [FINAL] results instead
    };
    
    state.recognition.onstart = () => {
        console.log('🎤 [EVENT] onstart - Speech recognition started');
        console.log(`🎤 [CONFIG] lang: ${state.recognition.lang}, continuous: ${state.recognition.continuous}, interimResults: ${state.recognition.interimResults}`);
        setEmotion('sleeping');  // Sleeping until wake word
    };
    
    state.recognition.onend = handleEnd;
    state.recognition.onerror = handleError;
    
    state.recognition.onaudiostart = () => {
        console.log('🎤 [EVENT] onaudiostart - Audio capture started');
    };
    
    state.recognition.onaudioend = () => {
        console.log('🎤 [EVENT] onaudioend - Audio capture ended');
    };
    
    state.recognition.onsoundstart = () => {
        console.log('🎤 [EVENT] onsoundstart - Sound detected');
    };
    
    state.recognition.onsoundend = () => {
        console.log('🎤 [EVENT] onsoundend - Sound ended');
    };
    
    // Start listening
    try {
        state.recognition.start();
        state.isListening = true;
        console.log('═══════════════════════════════════════════════════════');
        console.log(`🎤 [INIT] Speech recognition initialized`);
        console.log(`🎤 [INIT] Waiting for wake word: "${state.wakeWord}"`);
        console.log(`🎤 [INIT] Using direct LLM API (no backend)`);
        console.log('═══════════════════════════════════════════════════════');
        return true;
    } catch (error) {
        console.error('❌ [INIT] Failed to start speech recognition:', error);
        if (state.callbacks.onError) {
            state.callbacks.onError(error);
        }
        return false;
    }
}

function stopSpeechRecognition() {
    console.log('🛑 [STOP] Stopping speech recognition...');
    state.isListening = false;
    state.isAwake = false;
    state.transcript = '';
    
    if (state.recognition) {
        state.recognition.stop();
        state.recognition = null;
    }
    
    console.log('🛑 [STOP] Speech recognition stopped');
}

function setWakeWord(newWakeWord) {
    state.wakeWord = newWakeWord;
    console.log(`🎤 Wake word changed to: "${newWakeWord}"`);
}

function isAwake() {
    return state.isAwake;
}

// Re-export LLM config functions for easy access
export { saveConfig, getConfig, isConfigured } from './llm.js';
export { getAllSegments, clearAllSegments } from './storage.js';

// Export with backwards-compatible names
export {
    initSpeechRecognition as initAudioListener,
    stopSpeechRecognition as stopAudioListener,
    setWakeWord,
    isAwake
};
