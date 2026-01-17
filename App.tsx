import React, { useState, useRef, useEffect } from 'react';
import { Sender, Message, BabyProfile } from './types';
import { INITIAL_MESSAGE, QUICK_PROMPTS, SYSTEM_INSTRUCTION } from './constants';
import { sendMessageStream, resetChat, initChat } from './services/geminiService';
import ChatBubble from './components/ChatBubble';
import { SendIcon, HeartIcon, TrashIcon, SettingsIcon, XMarkIcon, BabyIcon, SparklesIcon } from './components/Icons';

const MODELS = [
  { 
    id: 'gemini-3-flash-preview', 
    name: 'Gemini 3 Flash', 
    desc: '速度快，响应敏捷（推荐）' 
  },
  { 
    id: 'gemini-3-pro-preview', 
    name: 'Gemini 3 Pro', 
    desc: '推理能力强，适合复杂问题' 
  }
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: Sender.Bot,
      text: INITIAL_MESSAGE,
      timestamp: Date.now(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'prompt'>('profile');
  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_INSTRUCTION);
  const [currentModel, setCurrentModel] = useState('gemini-3-flash-preview');
  const [babyProfile, setBabyProfile] = useState<BabyProfile>({
    name: '',
    date: '',
    gender: 'unknown',
    notes: ''
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Helper to generate context string from profile
  const getProfileContextString = (profile: BabyProfile) => {
    // If empty profile, return empty string
    if (!profile.name && !profile.date && !profile.notes && profile.gender === 'unknown') return "";
    
    let ctx = "【当前用户（宝妈/孕妈）提供的背景信息】\n请在回答时参考以下信息，提供更针对性的建议：\n";
    if (profile.name) ctx += `- 宝宝/胎儿昵称：${profile.name}\n`;
    if (profile.date) ctx += `- 预产期或出生日期：${profile.date}\n`;
    if (profile.gender && profile.gender !== 'unknown') ctx += `- 性别：${profile.gender === 'boy' ? '男宝' : '女宝'}\n`;
    if (profile.notes) ctx += `- 特殊情况/备注：${profile.notes}\n`;
    
    return ctx;
  };

  // Initialize chat on mount
  useEffect(() => {
    const fullInstruction = systemPrompt + "\n\n" + getProfileContextString(babyProfile);
    initChat(fullInstruction, currentModel);
  }, []); // Run once on mount

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;

    const userMsgId = Date.now().toString();
    const newUserMessage: Message = {
      id: userMsgId,
      role: Sender.User,
      text: text.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsSending(true);

    // Create a placeholder for the bot response
    const botMsgId = (Date.now() + 1).toString();
    const newBotMessage: Message = {
      id: botMsgId,
      role: Sender.Bot,
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, newBotMessage]);

    try {
      const stream = sendMessageStream(newUserMessage.text);
      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === botMsgId 
              ? { ...msg, text: fullResponse } 
              : msg
          )
        );
      }

      // Finish streaming
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMsgId 
            ? { ...msg, isStreaming: false } 
            : msg
        )
      );

    } catch (error) {
      console.error("Failed to send message", error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === botMsgId 
            ? { ...msg, text: "哎呀，网络好像有点小问题，请稍后再试一下吧。", isStreaming: false } 
            : msg
        )
      );
    } finally {
      setIsSending(false);
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
      // Re-focus input for desktop mainly
      if (window.innerWidth > 768) {
        inputRef.current?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const handleClearChat = () => {
    if (confirm("确定要清空聊天记录吗？")) {
        // When clearing, we re-init chat using current settings
        const fullInstruction = systemPrompt + "\n\n" + getProfileContextString(babyProfile);
        initChat(fullInstruction, currentModel);
        setMessages([{
            id: Date.now().toString(),
            role: Sender.Bot,
            text: INITIAL_MESSAGE,
            timestamp: Date.now(),
        }]);
    }
  };

  const handleSaveSettings = () => {
    // Combine base prompt with profile data
    const fullInstruction = systemPrompt + "\n\n" + getProfileContextString(babyProfile);
    initChat(fullInstruction, currentModel);
    setShowSettings(false);
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-white shadow-xl relative overflow-hidden">
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-200 via-rose-100 to-rose-200 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-full text-soft-primary shadow-sm">
            <HeartIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">兜知道</h1>
            <p className="text-xs text-gray-600 font-medium">你的私人育婴师</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-500 hover:text-rose-500 hover:bg-white/50 rounded-full transition-colors"
            title="设置"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={handleClearChat}
            className="p-2 text-gray-500 hover:text-rose-500 hover:bg-white/50 rounded-full transition-colors"
            title="清空聊天"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">设置</h2>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'profile' 
                    ? 'border-rose-400 text-rose-500' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                我的宝宝
              </button>
              <button 
                onClick={() => setActiveTab('prompt')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'prompt' 
                    ? 'border-rose-400 text-rose-500' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                AI 设定
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      宝宝/胎儿 昵称
                    </label>
                    <input 
                      type="text"
                      value={babyProfile.name}
                      onChange={(e) => setBabyProfile({...babyProfile, name: e.target.value})}
                      className="w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:border-rose-400 focus:ring-1 focus:ring-rose-200 outline-none bg-gray-50"
                      placeholder="例如：小汤圆"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      预产期 或 出生日期
                    </label>
                    <input 
                      type="date"
                      value={babyProfile.date}
                      onChange={(e) => setBabyProfile({...babyProfile, date: e.target.value})}
                      className="w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:border-rose-400 focus:ring-1 focus:ring-rose-200 outline-none bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      性别
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="gender" 
                          checked={babyProfile.gender === 'boy'}
                          onChange={() => setBabyProfile({...babyProfile, gender: 'boy'})}
                          className="w-4 h-4 text-rose-500 border-gray-300 focus:ring-rose-400" 
                        />
                        <span className="text-sm text-gray-700">男宝</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="gender" 
                          checked={babyProfile.gender === 'girl'}
                          onChange={() => setBabyProfile({...babyProfile, gender: 'girl'})}
                          className="w-4 h-4 text-rose-500 border-gray-300 focus:ring-rose-400" 
                        />
                        <span className="text-sm text-gray-700">女宝</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="gender" 
                          checked={babyProfile.gender === 'unknown'}
                          onChange={() => setBabyProfile({...babyProfile, gender: 'unknown'})}
                          className="w-4 h-4 text-rose-500 border-gray-300 focus:ring-rose-400" 
                        />
                        <span className="text-sm text-gray-700">未知/保密</span>
                      </label>
                    </div>
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      特殊情况 / 备注
                    </label>
                    <textarea 
                      value={babyProfile.notes}
                      onChange={(e) => setBabyProfile({...babyProfile, notes: e.target.value})}
                      rows={3}
                      className="w-full p-2.5 text-sm border border-gray-200 rounded-xl focus:border-rose-400 focus:ring-1 focus:ring-rose-200 outline-none bg-gray-50 resize-none"
                      placeholder="例如：过敏史、早产、双胞胎等..."
                    />
                  </div>
                </div>
              )}

              {/* Prompt Tab */}
              {activeTab === 'prompt' && (
                <div className="space-y-4">
                   {/* Model Selection */}
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择 AI 模型
                    </label>
                    <div className="space-y-2">
                      {MODELS.map((model) => (
                        <div 
                          key={model.id}
                          onClick={() => setCurrentModel(model.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            currentModel === model.id 
                              ? 'border-rose-400 bg-rose-50 ring-1 ring-rose-200' 
                              : 'border-gray-200 bg-white hover:border-rose-200'
                          }`}
                        >
                          <div>
                            <div className={`text-sm font-bold ${currentModel === model.id ? 'text-rose-600' : 'text-gray-700'}`}>
                              {model.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{model.desc}</div>
                          </div>
                          {currentModel === model.id && (
                            <div className="text-rose-500">
                               <SparklesIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      角色设定 (Prompt)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      修改助手的语气、角色设定或回复风格。
                    </p>
                    <textarea 
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="w-full h-32 p-3 text-sm border border-gray-200 rounded-xl focus:border-rose-400 focus:ring-1 focus:ring-rose-200 outline-none resize-none leading-relaxed text-gray-700 bg-gray-50"
                      placeholder="请输入提示词..."
                    />
                    <div className="flex justify-end mt-1">
                      <button 
                        onClick={() => setSystemPrompt(SYSTEM_INSTRUCTION)}
                        className="text-xs text-rose-500 hover:text-rose-600 underline py-1"
                      >
                        恢复默认提示词
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3">
               <button 
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSaveSettings}
                className="flex-1 py-2.5 px-4 rounded-xl bg-soft-primary text-white text-sm font-medium shadow-md hover:bg-rose-600 transition-all active:scale-95"
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 bg-slate-50 scrollbar-hide">
        <div className="flex flex-col gap-2 pb-4">
          
          {/* Introduction / Quick Prompts (Only show if few messages) */}
          {messages.length < 3 && (
            <div className="mb-8 mt-2">
              <p className="text-center text-gray-500 text-sm mb-4">您可以试着问我...</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handleSendMessage(prompt.prompt)}
                    disabled={isSending}
                    className="text-left p-3 bg-white border border-rose-100 rounded-xl shadow-sm hover:shadow-md hover:border-rose-300 transition-all active:scale-[0.98] group"
                  >
                    <span className="block text-xs font-bold text-rose-400 mb-1 uppercase tracking-wider">{prompt.label}</span>
                    <span className="block text-sm text-gray-700 group-hover:text-gray-900 line-clamp-2">{prompt.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Disclaimer */}
      <div className="bg-slate-50 px-4 py-1 text-center">
        <p className="text-[10px] text-gray-400">
          ⚠️ 本应用仅供参考，不提供专业医疗诊断建议。
        </p>
      </div>

      {/* Input Area */}
      <footer className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-3xl border border-gray-200 focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100 transition-all shadow-sm">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入您的问题..."
            className="w-full bg-transparent border-none text-gray-700 placeholder-gray-400 focus:ring-0 resize-none max-h-32 py-3 px-3"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isSending}
            className={`p-3 rounded-full mb-1 transition-all duration-200 
              ${!inputValue.trim() || isSending 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-soft-primary text-white shadow-md hover:bg-rose-600 active:scale-90'}`}
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
