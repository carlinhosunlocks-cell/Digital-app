import React, { useState } from 'react';
import { MessageSquare, ChevronLeft, ChevronRight, Send, CheckCircle, ArrowRight, Star, Shield, Cpu, FileText, Download } from 'lucide-react';
import { Ticket, User, ChatMessage, ServiceReport } from '../types';
import { getGeminiChatResponse } from '../services/geminiService';

interface ClientViewProps {
  currentUser: User;
  tickets: Ticket[];
  reports: ServiceReport[];
  onCreateTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'messages'>) => void;
}

const SERVICES_SLIDES = [
  { id: 1, title: 'Infraestrutura de Redes', img: 'https://images.unsplash.com/photo-1558494949-ef526b0042a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', desc: 'Cabeamento estruturado e configuração de servidores.' },
  { id: 2, title: 'Manutenção de Hardware', img: 'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', desc: 'Reparo especializado para equipamentos críticos.' },
  { id: 3, title: 'Segurança Digital', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', desc: 'Monitoramento e proteção contra ameaças.' },
];

export const ClientView: React.FC<ClientViewProps> = ({ currentUser, tickets, reports, onCreateTicket }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'support' | 'reports'>('home');
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Ticket Form State
  const [subject, setSubject] = useState('');
  const [desc, setDesc] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { id: '1', sender: 'bot', text: `Olá, ${currentUser.name.split(' ')[0]}! Sou o assistente virtual da Digital Equipamentos. Como posso ajudar você hoje?`, timestamp: new Date().toISOString() }
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleNextSlide = () => setCurrentSlide((prev) => (prev + 1) % SERVICES_SLIDES.length);
  const handlePrevSlide = () => setCurrentSlide((prev) => (prev - 1 + SERVICES_SLIDES.length) % SERVICES_SLIDES.length);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateTicket({
      clientId: currentUser.id,
      clientName: currentUser.name,
      subject,
      description: desc,
      status: 'Aberto' as any
    });
    setSubject('');
    setDesc('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: chatInput, timestamp: new Date().toISOString() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    const botResponseText = await getGeminiChatResponse(chatHistory, chatInput);
    const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'bot', text: botResponseText, timestamp: new Date().toISOString() };
    setChatHistory(prev => [...prev, botMsg]);
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans selection:bg-black selection:text-white">
      {/* Modern Minimal Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-bold text-xl">D</div>
             <span className="text-xl font-bold text-black tracking-tight">Digital<span className="text-gray-400">Equipamentos</span></span>
          </div>
          <div className="flex space-x-2 bg-gray-100/50 p-1.5 rounded-full backdrop-blur-md">
            {[
              { id: 'home', label: 'Início' },
              { id: 'support', label: 'Chamados' },
              { id: 'reports', label: 'Meus Relatórios' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeTab === tab.id 
                  ? 'bg-white text-black shadow-md shadow-gray-200' 
                  : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
             <div className="text-right">
                <p className="text-sm font-bold">{currentUser.name}</p>
                <p className="text-xs text-gray-500">Cliente Corporativo</p>
             </div>
             {currentUser.avatar ? (
                <img src={currentUser.avatar} alt="Profile" className="w-10 h-10 rounded-full border border-gray-200" />
             ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">{currentUser.name.charAt(0)}</div>
             )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto pt-20">
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="relative h-[600px] w-full overflow-hidden">
               <div className="absolute inset-0">
                  <img src={SERVICES_SLIDES[currentSlide].img} alt="Hero" className="w-full h-full object-cover transition-transform duration-[2000ms] hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
               </div>
               
               <div className="absolute inset-0 max-w-7xl mx-auto px-6 flex flex-col justify-center text-white">
                  <span className="text-white/60 font-bold tracking-[0.2em] uppercase mb-4 text-sm border border-white/20 inline-block w-fit px-4 py-1 rounded-full backdrop-blur-md">Soluções Corporativas</span>
                  <h1 className="text-5xl md:text-8xl font-bold mb-8 max-w-4xl leading-[0.9] tracking-tighter">{SERVICES_SLIDES[currentSlide].title}</h1>
                  <p className="text-xl text-gray-200 max-w-xl mb-10 leading-relaxed font-light">{SERVICES_SLIDES[currentSlide].desc}</p>
                  
                  <div className="flex gap-4">
                     <button onClick={() => setActiveTab('support')} className="bg-white text-black px-10 py-5 rounded-full font-bold flex items-center gap-3 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-white/20">
                        Abrir Chamado <ArrowRight size={20} />
                     </button>
                     <div className="flex gap-2 items-center ml-8">
                        <button onClick={handlePrevSlide} className="w-14 h-14 rounded-full border border-white/20 hover:bg-white hover:text-black flex items-center justify-center transition duration-300"><ChevronLeft /></button>
                        <button onClick={handleNextSlide} className="w-14 h-14 rounded-full border border-white/20 hover:bg-white hover:text-black flex items-center justify-center transition duration-300"><ChevronRight /></button>
                     </div>
                  </div>
               </div>
            </div>

            {/* Features Grid */}
            <div className="max-w-7xl mx-auto px-6 py-24">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {[
                     { icon: Cpu, title: "Alta Performance", desc: "Equipamentos de última geração e manutenção preventiva.", color: "bg-blue-50 text-blue-600" },
                     { icon: Shield, title: "Segurança Total", desc: "Protocolos rigorosos de segurança e backup.", color: "bg-green-50 text-green-600" },
                     { icon: Star, title: "Suporte Premium", desc: "Atendimento 24/7 com IA integrada e técnicos certificados.", color: "bg-purple-50 text-purple-600" }
                  ].map((feat, i) => (
                     <div key={i} className="p-8 rounded-[2rem] bg-gray-50 hover:bg-white hover:shadow-2xl hover:shadow-gray-200 transition-all duration-500 group border border-transparent hover:border-gray-100">
                        <div className={`w-16 h-16 ${feat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                           <feat.icon size={32} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-slate-900 tracking-tight">{feat.title}</h3>
                        <p className="text-gray-500 leading-relaxed">{feat.desc}</p>
                     </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="max-w-6xl mx-auto p-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid md:grid-cols-2 gap-8 h-[calc(100vh-140px)]">
               {/* Left: New Ticket */}
               <div className="bg-gray-50 rounded-[2.5rem] p-10 flex flex-col justify-center">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Precisa de Ajuda?</h2>
                  <p className="text-gray-500 mb-8">Abra um chamado e nossa equipe responderá em breve.</p>
                  
                  {showSuccess && (
                     <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-2xl flex items-center gap-3 animate-pulse">
                        <CheckCircle size={20} /> Solicitação enviada com sucesso!
                     </div>
                  )}

                  <form onSubmit={handleSubmitTicket} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Assunto</label>
                        <input required value={subject} onChange={e => setSubject(e.target.value)} type="text" className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-gray-200 outline-none transition text-lg" placeholder="Ex: Servidor Offline" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider ml-1">Detalhes</label>
                        <textarea required value={desc} onChange={e => setDesc(e.target.value)} rows={4} className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-gray-200 outline-none transition resize-none text-lg" placeholder="Descreva o problema..." />
                     </div>
                     <button type="submit" className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg hover:scale-[0.98] transition-transform shadow-xl">
                        Enviar Solicitação
                     </button>
                  </form>
               </div>

               {/* Right: AI Chat */}
               <div className="bg-white border border-gray-100 shadow-2xl shadow-gray-200/50 rounded-[2.5rem] overflow-hidden flex flex-col relative">
                  <div className="p-6 bg-white/80 backdrop-blur-md border-b border-gray-100 absolute top-0 w-full z-10 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white">
                           <MessageSquare size={20} />
                        </div>
                        <div>
                           <h3 className="font-bold">Assistente Virtual</h3>
                           <p className="text-xs text-green-500 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 p-6 pt-24 overflow-y-auto space-y-4 bg-gray-50">
                     {chatHistory.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                              msg.sender === 'user' 
                              ? 'bg-black text-white rounded-br-none' 
                              : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                           }`}>
                              {msg.text}
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="p-4 bg-white border-t border-gray-100">
                     <div className="flex gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200">
                        <input 
                           type="text" 
                           value={chatInput} 
                           onChange={e => setChatInput(e.target.value)}
                           onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                           className="flex-1 bg-transparent p-3 outline-none text-gray-800 placeholder-gray-400"
                           placeholder="Digite sua dúvida..."
                        />
                        <button onClick={handleSendMessage} className="bg-black text-white p-3 rounded-xl hover:bg-gray-800 transition shadow-lg">
                           <Send size={20} />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
           <div className="max-w-5xl mx-auto p-8">
              <div className="mb-10 text-center">
                 <h2 className="text-4xl font-bold text-slate-900 tracking-tighter mb-4">Relatórios Técnicos</h2>
                 <p className="text-gray-500 max-w-lg mx-auto">Acesse todos os documentos, ordens de serviço finalizadas e laudos técnicos emitidos para sua empresa.</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {reports.map(report => (
                    <div key={report.id} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/40 hover:-translate-y-2 transition-transform duration-300 group">
                       <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-red-500 group-hover:text-white transition-colors">
                          <FileText size={28} />
                       </div>
                       <h3 className="text-xl font-bold text-slate-900 mb-2">Ordem de Serviço #{report.id.slice(-4)}</h3>
                       <p className="text-gray-400 text-sm mb-6">{new Date(report.date).toLocaleDateString()} • {report.technicianName}</p>
                       
                       <div className="space-y-3 mb-8">
                          <div className="flex justify-between text-sm border-b border-gray-50 pb-2">
                             <span className="text-gray-500">Serviço</span>
                             <span className="font-bold text-gray-800">Manutenção</span>
                          </div>
                          <div className="flex justify-between text-sm border-b border-gray-50 pb-2">
                             <span className="text-gray-500">Status</span>
                             <span className="font-bold text-green-600 bg-green-50 px-2 rounded">Concluído</span>
                          </div>
                       </div>

                       <button className="w-full py-4 rounded-xl border-2 border-gray-100 font-bold text-gray-600 flex items-center justify-center gap-2 group-hover:border-black group-hover:bg-black group-hover:text-white transition-all cursor-not-allowed" title="Apenas visualização na demo">
                          <Download size={18} /> Baixar PDF
                       </button>
                    </div>
                 ))}
                 {reports.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                       <p className="text-gray-400 text-xl font-medium">Nenhum relatório disponível no momento.</p>
                    </div>
                 )}
              </div>
           </div>
        )}
      </main>
    </div>
  );
};