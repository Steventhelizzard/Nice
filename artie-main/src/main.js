import './style.css'
import { setEmotion } from './utils/emotion'
import { initAudioListener, saveConfig, getConfig, isConfigured, getAllSegments, clearAllSegments } from './utils/listener.js'

document.querySelector('#app').innerHTML = `
  <div>
  <div id="face"></div>
  </div>
`

setEmotion('working');

document.addEventListener('EmotionChanged', (event) => {
  console.log('Emotion changed to:', event.detail);
});

// Expose config functions globally for easy access from browser console
window.artie = {
  setApiKey: (apiKey) => {
    saveConfig({ apiKey });
    console.log('API key saved. Artie is ready!');
  },
  setModel: (model) => {
    saveConfig({ model });
    console.log(`Model set to: ${model}`);
  },
  getConfig: () => {
    const config = getConfig();
    return { ...config, apiKey: config.apiKey ? '***configured***' : 'not set' };
  },
  getSegments: getAllSegments,
  clearSegments: clearAllSegments,
  isConfigured
};

// Check if API key is configured
if (!isConfigured()) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('⚠️  OpenAI API key not configured!');
  console.log('Run this in your browser console:');
  console.log('  artie.setApiKey("your-openai-api-key")');
  console.log('═══════════════════════════════════════════════════════');
}

// Initialize audio listener
initAudioListener({
  onProcessingStart: () => {
    console.log('⚙️  Processing audio...');
  },

  onProcessingComplete: (result) => {
    console.log('✅ Processing complete:', result);
  },

  onError: (error) => {
    console.error('❌ Audio error:', error);
  }
});