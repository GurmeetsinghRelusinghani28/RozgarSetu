import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bot, Briefcase, IndianRupee, MapPin, Mic, Send, Square, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import BottomNav from '@/components/BottomNav';

interface JobItem {
  _id: string;
  projectTitle: string;
  location: string;
  wage: number;
  contractorId?: {
    name?: string;
    company?: string;
  };
  facilities?: {
    food?: boolean;
    accommodation?: boolean;
    insurance?: boolean;
    pf?: boolean;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  jobs?: JobItem[];
}

const RozgarMitra = () => {
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'नमस्ते, मैं Rozgar Mitra हूं। आप मुझे शहर, काम और सुविधा बताइए, मैं सही नौकरी ढूंढ दूंगा।',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const appendMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const sendQuery = async (text: string) => {
    if (!text.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/worker-login');
      return;
    }

    appendMessage({ id: `${Date.now()}-user`, role: 'user', text });
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(
        'http://localhost:5001/api/ai/rozgar-mitra',
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      appendMessage({
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        text: res.data.reply || 'माफ कीजिए, जवाब नहीं मिल पाया।',
        jobs: res.data.jobs || [],
      });
    } catch (error: any) {
      appendMessage({
        id: `${Date.now()}-error`,
        role: 'assistant',
        text: error.response?.data?.message || 'Rozgar Mitra could not find jobs right now.',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendAudio = async (blob: Blob) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/worker-login');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const extension = blob.type.includes('mp4') ? 'mp4' : 'webm';
      formData.append('audio', blob, `rozgar-mitra.${extension}`);

      const res = await axios.post('http://localhost:5001/api/ai/rozgar-mitra', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      appendMessage({
        id: `${Date.now()}-user-audio`,
        role: 'user',
        text: res.data.query || 'Voice query',
      });
      appendMessage({
        id: `${Date.now()}-assistant-audio`,
        role: 'assistant',
        text: res.data.reply || 'माफ कीजिए, जवाब नहीं मिल पाया।',
        jobs: res.data.jobs || [],
      });
    } catch (error: any) {
      appendMessage({
        id: `${Date.now()}-audio-error`,
        role: 'assistant',
        text: error.response?.data?.message || 'Failed to process voice query.',
      });
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Voice recording is not supported in this browser.');
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      sendAudio(blob);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    recorder.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const applyToJob = async (projectId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/worker-login');
      return;
    }

    setApplyingId(projectId);
    try {
      await axios.post(
        `http://localhost:5001/api/projects/${projectId}/apply`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Applied successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to apply for job');
    } finally {
      setApplyingId(null);
    }
  };

  const renderJobCard = (job: JobItem) => {
    const facilities = job.facilities || {};
    const contractor = job.contractorId?.company || job.contractorId?.name || 'Contractor';

    return (
      <Card key={job._id} className="mt-3 rounded-xl border-border bg-background">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-foreground">{job.projectTitle}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{contractor}</p>
            </div>
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {job.location}
            </span>
            <span className="flex items-center gap-1 font-semibold text-primary">
              <IndianRupee className="h-4 w-4" /> {job.wage}/day
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {facilities.food && <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Food</span>}
            {facilities.accommodation && <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">Stay</span>}
            {facilities.insurance && <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700">Insurance</span>}
          </div>
          <Button
            onClick={() => applyToJob(job._id)}
            disabled={applyingId === job._id}
            className="mt-4 h-10 w-full rounded-xl"
          >
            {applyingId === job._id ? 'Applying...' : 'Apply'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="border-b border-border bg-primary px-6 pb-5 pt-8 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/15">
            <Bot className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Rozgar Mitra</h1>
            <p className="text-sm text-primary-foreground/80">AI job assistant</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                    isUser
                      ? 'rounded-br-md bg-primary text-primary-foreground'
                      : 'rounded-bl-md border border-border bg-card text-card-foreground'
                  }`}
                >
                  {!isUser && (
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-foreground">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Rozgar Mitra
                    </div>
                  )}
                  <p className="whitespace-pre-line">{message.text}</p>
                </div>
                {message.jobs?.map(renderJobCard)}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Rozgar Mitra सोच रहा है...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-background p-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="जैसे: मुझे गाजियाबाद में पेंटर का काम चाहिए जिसमें भोजन भी मिले"
            className="min-h-[48px] flex-1 resize-none rounded-2xl"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendQuery(input);
              }
            }}
          />
          <Button
            type="button"
            variant={isRecording ? 'destructive' : 'outline'}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading}
            className="h-12 w-12 rounded-2xl p-0"
          >
            {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Button
            type="button"
            onClick={() => sendQuery(input)}
            disabled={!input.trim() || loading}
            className="h-12 w-12 rounded-2xl p-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <BottomNav type="worker" active="mitra" />
    </div>
  );
};

export default RozgarMitra;
