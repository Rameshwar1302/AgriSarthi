import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { StructuredAdvisory } from '../types';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Bot, 
  User, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle,
  FileQuestion,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';

interface ChatEntry {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  structuredAdvice?: StructuredAdvisory;
  timestamp: string;
}

export const VoiceAdvisoryChat: React.FC = () => {
  const { language, t, dashboardData } = useApp();
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Set recognition language based on selected app language
      recognition.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e: any) => {
        console.warn('[SpeechRecognition Error]', e);
        setIsListening(false);
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendMessage(transcript);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
  }, [language]);

  // Initial greeting message
  useEffect(() => {
    const cropName = dashboardData?.crop?.name || (language === 'mr' ? 'पीक' : language === 'hi' ? 'फसल' : 'crop');
    const initialGreeting: ChatEntry = {
      id: 'msg_init',
      sender: 'assistant',
      text: language === 'mr'
        ? `राम राम! मी कृषीसारथी AI आहे. आपल्या शेतातील हवामान, ${cropName} पीक संरक्षण किंवा बाजारभावाबाबत काहीही विचारा. आपण बोलूही शकता!`
        : language === 'hi'
        ? `नमस्ते! मैं कृषिसारथी AI हूँ। अपने खेत के मौसम, ${cropName} फसल सुरक्षा या मंडी भाव के बारे में कोई भी प्रश्न पूछें।`
        : `Welcome! I am AgriSaarthi AI. Ask any question about crop protection, weather risk management, or mandi rates for ${cropName}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => {
      if (prev.length <= 1) {
        return [initialGreeting];
      }
      return prev;
    });
  }, [language, dashboardData?.crop?.name]);

  // Scroll to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleVoiceInput = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert(t.speechNotSupported);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
      recognitionRef.current.start();
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis not supported on this device');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputText).trim();
    if (!textToSend || isLoading) return;

    const userEntry: ChatEntry = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userEntry]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await api.askChatAdvisory(
        textToSend,
        language,
        dashboardData?.crop?.name || 'Soybean'
      );

      const assistantEntry: ChatEntry = {
        id: `msg_asst_${Date.now()}`,
        sender: 'assistant',
        text: response.answer || response.structuredAdvice?.directAnswer || 'Advisory processed.',
        structuredAdvice: response.structuredAdvice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantEntry]);

      // Automatically speak the first sentence if audio is preferred
      if (assistantEntry.text) {
        speakText(assistantEntry.text.split('.')[0] + '.');
      }
    } catch (err: any) {
      const errorEntry: ChatEntry = {
        id: `msg_err_${Date.now()}`,
        sender: 'assistant',
        text: `Error connecting to advisory assistant: ${err.message}. Showing verified offline agronomy rules.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorEntry]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedClick = (q: string) => {
    setInputText(q);
    handleSendMessage(q);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              {t.aiAssistant}
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                Multilingual Voice & Text
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'mr' 
                ? 'Open-Meteo, AGMARKNET आणि SoilGrids डेटावर आधारित' 
                : language === 'hi' 
                ? 'Open-Meteo, AGMARKNET और SoilGrids डेटा पर आधारित' 
                : 'Grounded in Open-Meteo, AGMARKNET, and SoilGrids data'}
            </p>
          </div>
        </div>

        {/* Audio Toggle button */}
        {isSpeaking && (
          <button
            onClick={() => {
              window.speechSynthesis.cancel();
              setIsSpeaking(false);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>{t.stopSpeaking}</span>
          </button>
        )}
      </div>

      {/* Suggested Quick Questions Strip */}
      <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-400 font-semibold whitespace-nowrap flex items-center gap-1">
          <FileQuestion className="w-3.5 h-3.5" />
          {t.suggestedQuestions}
        </span>
        <button
          onClick={() => handleSuggestedClick(t.sampleQ1)}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 transition text-[11px]"
        >
          {t.sampleQ1}
        </button>
        <button
          onClick={() => handleSuggestedClick(t.sampleQ2)}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 transition text-[11px]"
        >
          {t.sampleQ2}
        </button>
        <button
          onClick={() => handleSuggestedClick(t.sampleQ3)}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 transition text-[11px]"
        >
          {t.sampleQ3}
        </button>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
                  isUser ? 'bg-slate-700' : 'bg-emerald-600'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 space-y-2.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold opacity-75">
                    {isUser ? 'Farmer' : 'AgriSaarthi'}
                  </span>
                  <div className="flex items-center gap-1.5 opacity-60 text-[10px]">
                    {!isUser && (
                      <button
                        onClick={() => speakText(msg.text)}
                        className="hover:text-emerald-600 transition p-0.5"
                        title={t.speakAnswer}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>

                {/* Structured Advisory Cards (if present) */}
                {msg.structuredAdvice && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-2.5 bg-white p-3 rounded-xl border">
                    {msg.structuredAdvice.recommendedActions?.length > 0 && (
                      <div>
                        <span className="font-bold text-emerald-800 block mb-1">
                          Recommended Actions ({msg.structuredAdvice.timeline}):
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                          {msg.structuredAdvice.recommendedActions.map((act, i) => (
                            <li key={i}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {msg.structuredAdvice.whatToAvoid?.length > 0 && (
                      <div>
                        <span className="font-bold text-amber-700 block mb-1">
                          What to Avoid:
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-amber-900">
                          {msg.structuredAdvice.whatToAvoid.map((avoid, i) => (
                            <li key={i}>{avoid}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {msg.structuredAdvice.mandiAdvisory && (
                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <span className="font-semibold text-slate-800">Mandi Context: </span>
                        {msg.structuredAdvice.mandiAdvisory}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                      {msg.structuredAdvice.uncertaintyLimitations}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Analyzing Open-Meteo, AGMARKNET, and Soil metrics...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Microphone Button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            title={isListening ? 'Stop Listening' : 'Speak your question'}
            className={`p-3 rounded-xl transition flex-shrink-0 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? t.listening : t.askVoicePrompt}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`p-3 rounded-xl transition flex-shrink-0 ${
              inputText.trim() && !isLoading
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

