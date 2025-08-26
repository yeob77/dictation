import { useState, useEffect, useCallback } from 'react';

interface SpeakOptions {
  lang?: string;
  rate?: number;
}

export const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const synth = window.speechSynthesis;

  const loadVoices = useCallback(() => {
    if (!synth) return;
    const allVoices = synth.getVoices();
    const krVoices = allVoices.filter(voice => voice.lang.startsWith('ko'));

    if (krVoices.length > 0) {
      setVoices(krVoices);
      
      // If no voice is selected yet, or the selected one is no longer available, set a default.
      if (!selectedVoice || !krVoices.some(v => v.name === selectedVoice.name)) {
        const prioritizedVoice =
          krVoices.find(v => v.name.includes('Yuna')) || // A common high-quality voice
          krVoices.find(v => v.name.includes('Google')) ||
          krVoices.find(v => v.default) ||
          krVoices[0];
        setSelectedVoice(prioritizedVoice);
      }
    }
  }, [synth, selectedVoice]);

  useEffect(() => {
    if (!synth) return;

    // Load voices initially and set up the listener for when they change.
    loadVoices();
    // Some browsers load voices asynchronously.
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }

    return () => {
      if(synth.onvoiceschanged !== undefined) {
         synth.onvoiceschanged = null;
      }
      if (synth.speaking) {
        synth.cancel();
      }
    };
  }, [synth, loadVoices]);

  const speak = useCallback((text: string, options: SpeakOptions = {}) => {
    if (synth.speaking) {
      synth.cancel();
    }
    const { lang = 'ko-KR', rate = 1.0 } = options;
    const processedText = text.replace(/ /g, ', ');
    const utterance = new SpeechSynthesisUtterance(processedText);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1;
    
    // Apply the user-selected Korean voice.
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
      // 'canceled' and 'interrupted' are common events when the user interrupts speech
      // (e.g., by clicking next), so we don't treat them as critical errors.
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.error("Speech synthesis error:", e.error);
      }
      setIsSpeaking(false);
    };
    synth.speak(utterance);
  }, [synth, selectedVoice]);

  const handleSelectVoice = (voiceName: string) => {
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
      setSelectedVoice(voice);
    }
  };

  return { speak, isSpeaking, voices, selectedVoice, handleSelectVoice };
};