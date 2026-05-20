import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE_URL = 'http://localhost:5001/api';
const HOST_URL = 'http://localhost:5001';

const ChatScreen = () => {
  const { jobId, workerId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const socketRef = useRef<Socket | null>(null);

  // We decode our contractor user id from the token or profile if needed.
  // Assuming token can get our identity, but for chat we can just send it.
  // For simplicity, we decode JWT in real app, here we will fetch profile.

  const [contractorId, setContractorId] = useState<string | null>(null);

  useEffect(() => {
    const initChat = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/user-type');
        return;
      }

      // Fetch own profile to get contractorId
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setContractorId(res.data.user._id);
      } catch (err) {
        console.error("Failed to load profile", err);
      }

      // Fetch chat history
      try {
        const resHistory = await axios.get(`${API_BASE_URL}/chat/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(resHistory.data.messages || []);
      } catch (err) {
        console.error('Error fetching history:', err);
      }
    };
    
    initChat();

    // Socket Setup
    const socket = io(HOST_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', { jobId });
    });

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [jobId, navigate]);

  const sendMessage = () => {
    if (!inputText.trim() || !socketRef.current || !contractorId) return;

    const newMsg = {
      senderId: contractorId,
      receiverId: workerId,
      jobId,
      message: inputText.trim(),
    };

    socketRef.current.emit('send_message', newMsg);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="bg-primary px-6 py-4 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground">
          <ArrowLeft className="h-6 w-6" /> Back
        </button>
        <h1 className="text-xl font-bold text-primary-foreground ml-auto">Chat with Worker</h1>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === contractorId;
          return (
            <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                  isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-surface p-4 border-t flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 rounded-full border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20"
        />
        <Button onClick={sendMessage} size="icon" className="h-12 w-12 rounded-full">
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatScreen;
