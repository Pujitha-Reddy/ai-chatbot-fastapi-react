import { marked } from 'marked';
import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, session_id: sessionId }),
      });

      const data = await response.json();
      setSessionId(data.session_id);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error: could not reach backend.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const startListening = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert('Voice input is not supported in this browser. Try Chrome.');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => setIsListening(true);
  recognition.onend = () => setIsListening(false);

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
  };

  recognition.onerror = () => setIsListening(false);

  recognition.start();
};

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>AI Chatbot</h2>
        <p>Powered by a locally-run open-source LLM</p>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
  <div key={i} className={`message-row ${msg.role}`}>
    <div className="row-with-avatar">
      {msg.role === 'assistant' && <div className="avatar ai-avatar">AI</div>}
      <div>
        <span className="sender-label">{msg.role === 'user' ? 'You' : 'AI'}</span>
        <div
  className={`bubble ${msg.role}`}
  dangerouslySetInnerHTML={
    msg.role === 'assistant'
      ? { __html: marked.parse(msg.content) }
      : undefined
  }
>
  {msg.role === 'user' ? msg.content : null}
</div>
        <span className="timestamp">{msg.time}</span>
      </div>
      {msg.role === 'user' && <div className="avatar user-avatar">Y</div>}
    </div>
  </div>
))}
        {loading && (
  <div className="row-with-avatar">
    <div className="avatar ai-avatar">AI</div>
    <div className="bubble assistant typing-bubble">
      <span className="dot"></span>
      <span className="dot"></span>
      <span className="dot"></span>
    </div>
  </div>
)}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
  <input
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={handleKeyDown}
    placeholder="Type a message..."
    disabled={loading}
  />
  <button
  onClick={startListening}
  disabled={loading || isListening}
  className={`mic-button ${isListening ? 'listening' : ''}`}
  title="Speak your message"
>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 11a7 7 0 01-14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
</button>
  <button onClick={sendMessage} disabled={loading || !input.trim()}>
    Send
  </button>
</div>
    </div>
  );
}

export default App;