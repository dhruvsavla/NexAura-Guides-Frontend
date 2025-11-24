// src/components/ChatWidget.js
import React, { useState } from "react";
import axios from "axios";
import "./ChatWidget.css";

export default function ChatWidget({ captureFrame }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input) return;

    const imageBase64 = captureFrame();
    if (!imageBase64) {
      alert("Screen not available for capture!");
      return;
    }

    const newMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      const res = await axios.post("http://127.0.0.1:8000/api/analyze_live", {
        image_base64: imageBase64,
        question: input,
      });

      let cleaned = res.data.result.text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      const reply = { role: "bot", text: parsed.steps?.join("\n") || "No steps found." };
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "bot", text: "Error analyzing screen." }]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <div className={`chat-widget ${open ? "open" : ""}`}>
      <div className="chat-header" onClick={() => setOpen(!open)}>
        💬 Screen Copilot
      </div>

      {open && (
        <div className="chat-body">
          <div className="messages">
            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.role}`}>
                {msg.text}
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something about your screen..."
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? "..." : "Send"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
