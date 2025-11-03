import React from "react";
/**
 * VoiceMic (Task 2 - Voice Input)
 * - Beep before recording (Web Audio API)
 * - Web Speech API (SpeechRecognition) -> speech → text
 * - Shows interim caption while speaking
 * - Calls props.onSend(finalTranscript) when user finishes
 *
 * Props:
 *   onSend: (text: string) => void   // required (hook into your existing chat)
 */


export default function VoiceMic({ onSend }) {
  const [recording, setRecording] = React.useState(false);
  const [interim, setInterim] = React.useState("");
  const recRef = React.useRef(null);

  // Short beep (UX cue)
  async function beep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        ctx.close();
      }, 160);
    } catch {}
  }

  // Setup Web Speech API
  React.useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false; // stop after pause

    rec.onresult = (e) => {
      let interimTxt = "", finalTxt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTxt += txt;
        else interimTxt += txt;
      }
      setInterim(interimTxt);
      if (finalTxt.trim()) {
        setInterim("");
        onSend?.(finalTxt.trim()); // hand off to your chat flow
      }
    };

    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);

    recRef.current = rec;
  }, [onSend]);

  async function onMicClick() {
    await beep();
    setRecording(true);
    setInterim("");
    if (recRef.current) recRef.current.start();
    else {
      alert("SpeechRecognition not supported. Use Chrome/Edge, or add a server STT fallback.");
      setRecording(false);
    }
  }

  return (
    <div className="voice-mic" aria-label="Voice input" style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={onMicClick}
        aria-label="Start voice input"
        aria-pressed={recording}
        title="Start voice input"
        style={{
          borderRadius: "50%",
          width: 40, height: 40,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "none",
          cursor: "pointer",
          background: recording ? "#c05619f" : "#c05619f",
          color: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
        }}
      >
        
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zm-5 9a1 1 0 001-1v-2h-2v2a1 1 0 001 1z"/>
        </svg>
      </button>

      {recording && interim && (
        <span aria-live="polite" style={{ fontSize: 12, opacity: 0.8 }}>
          {interim} …
        </span>
      )}
    </div>
  );
}