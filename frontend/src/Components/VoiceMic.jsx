import React from "react";

/**
 * VoiceMic
 * - Start/stop beep (Web Audio API)
 * - Web Speech API (SpeechRecognition) STT with interim captions
 * - Calls onSend(finalTranscript)
 */
export default function VoiceMic({ onSend }) {
  const [recording, setRecording] = React.useState(false);
  const [interim, setInterim] = React.useState("");
  const recRef = React.useRef(null);

  // ---- Beep utility (works on Chrome/Edge/Safari)
  async function playBeep(freq = 880, ms = 150, gainVal = 0.25) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      // Some browsers create a suspended context; resume after user gesture.
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = gainVal;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t0 = ctx.currentTime;
      osc.start(t0);
      osc.stop(t0 + ms / 1000);
      osc.onended = () => ctx.close();
    } catch (err) {
      // Non-blocking if audio fails (muted tab, policy, etc.)
      console.warn("Beep failed:", err);
    }
  }

  // ---- Web Speech setup
  React.useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (e) => {
      let interimTxt = "", finalTxt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTxt += txt;
        else interimTxt += txt;
      }
      setInterim(interimTxt);
      if (onSend && finalText.trim()) {
        onSend(finalText.trim(), { fromMic: true });
      }
    };

    rec.onerror = () => setRecording(false);
    rec.onend = async () => {
      setRecording(false);
      // Optional end beep (lower tone)
      await playBeep(660, 120, 0.2);
    };

    recRef.current = rec;
  }, [onSend]);

  // ---- Start/stop toggle
  async function onMicClick() {
    const r = recRef.current;
    if (!r) {
      alert("SpeechRecognition not supported. Use Chrome/Edge.");
      return;
    }

    if (recording) {
      // Stop listening
      r.stop();
      return;
    }

    // Start listening (play start beep first)
    await playBeep(880, 150, 0.25);
    setRecording(true);
    setInterim("");
    r.start();
  }

  return (
    <div className="voice-mic" aria-label="Voice input" style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={onMicClick}
        aria-label={recording ? "Stop voice input" : "Start voice input"}
        aria-pressed={recording}
        title={recording ? "Stop voice input" : "Start voice input"}
        style={{
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          cursor: "pointer",
          background: recording ? "#c05619" : "#c05619", // fixed hex
          color: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
        }}
      >
        {/* SVG mic icon (not emoji) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zm-5 9a1 1 0 001-1v-2h-2v2a1 1 0 001 1z" />
        </svg>
      </button>

      {recording && (
        <span
          aria-live="polite"
          style={{ fontSize: 12, opacity: 0.8 }}
        >
          {interim ? `${interim} …` : "Listening…"}
        </span>
      )}
    </div>
  );
}