import { useCallback, useEffect, useRef, useState } from "react";

export function useVoice() {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  useEffect(() => () => {
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
  }, []);

  const listen = useCallback((locale, onResult, onError) => {
    if (!SpeechRecognition) {
      onError?.("Speech recognition is not supported by this browser. Try Chrome or Edge.");
      return;
    }
    recognitionRef.current?.abort();
    const recognition = new SpeechRecognition();
    recognition.lang = locale;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => onError?.(`Voice recognition stopped: ${event.error}`);
    recognition.onresult = (event) => onResult(event.results[0][0].transcript);
    recognitionRef.current = recognition;
    recognition.start();
  }, [SpeechRecognition]);

  const stopListening = useCallback(() => recognitionRef.current?.stop(), []);

  const speak = useCallback((text, locale) => {
    if (!window.speechSynthesis || !text) return false;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    const voices = window.speechSynthesis.getVoices();
    const languageRoot = locale.split("-")[0].toLowerCase();
    const voice = voices.find((item) => item.lang.toLowerCase() === locale.toLowerCase())
      || voices.find((item) => item.lang.toLowerCase().startsWith(languageRoot));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.94;
    utterance.pitch = 1.03;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    return true;
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { listening, speaking, listen, stopListening, speak, stopSpeaking, speechRecognitionSupported: Boolean(SpeechRecognition) };
}
