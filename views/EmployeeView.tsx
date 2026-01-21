import React, { useState } from 'react';
import { MapPin, Clock, Check, Navigation, Menu, FileText, Camera, PenTool, Calendar, X, ChevronRight, Upload, CheckCircle } from 'lucide-react';
import { User, ServiceOrder, TimeRecord, OrderStatus, ServiceReport } from '../types';
import MapVisualizer from '../components/MapVisualizer';

interface EmployeeViewProps {
  currentUser: User;
  orders: ServiceOrder[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onClockAction: (type: 'CLOCK_IN' | 'CLOCK_OUT') => void;
  timeRecords: TimeRecord[];
  onCreateReport: (report: ServiceReport) => void;
}

export const EmployeeView: React.FC<EmployeeViewProps> = ({ currentUser, orders, onUpdateOrderStatus, onClockAction, timeRecords, onCreateReport }) => {
  const [activeTab, setActiveTab] = useState<'route' | 'clock' | 'report'>('route');
  const [selectedOrderForReport, setSelectedOrderForReport] = useState<ServiceOrder | null>(null);
  
  // Report Form State
  const [reportForm, setReportForm] = useState({
    gate: false,
    cctv: false,
    intercom: false,
    lock: false,
    preventive: false,
    startTime: '',
    endTime: '',
    comments: '',
    signature: ''
  });

  const myOrders = orders.filter(o => o.assignedToId === currentUser.id);
  const todaysRecords = timeRecords.filter(r => r.employeeId === currentUser.id && new Date(r.timestamp).toDateString() === new Date().toDateString());
  const isClockedIn = todaysRecords.length > 0 && todaysRecords[todaysRecords.length - 1].type === 'CLOCK_IN';

  const handleNavigate = (order: ServiceOrder) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${order.lat},${order.lng}`;
    window.open(url, '_blank');
  };

  const handleSubmitReport = () => {
    if (!selectedOrderForReport) return;
    
    const newReport: ServiceReport = {
      id: Date.now().toString(),
      orderId: selectedOrderForReport.id,
      clientName: selectedOrderForReport.customerName,
      technicianName: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      address: selectedOrderForReport.address,
      startTime: reportForm.startTime || '08:00',
      endTime: reportForm.endTime || '10:00',
      services: {
        gate: reportForm.gate,
        cctv: reportForm.cctv,
        intercom: reportForm.intercom,
        lock: reportForm.lock,
        preventive: reportForm.preventive
      },
      comments: reportForm.comments,
      photos: [
        'https://images.unsplash.com/photo-1558494949-ef526b0042a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
      ], // Simulating photo upload
      signatureName: reportForm.signature || 'Cliente'
    };
    
    onCreateReport(newReport);
    setReportForm({ gate: false, cctv: false, intercom: false, lock: false, preventive: false, startTime: '', endTime: '', comments: '', signature: '' });
    setSelectedOrderForReport(null);
    setActiveTab('route');
  };

  return (
    <div className="flex flex-col h-screen bg-black max-w-md mx-auto shadow-2xl relative overflow-hidden font-sans text-slate-100">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-20%] w-[120%] h-[50%] bg-blue-900/40 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-[-10%] right-[-20%] w-[120%] h-[50%] bg-purple-900/40 rounded-full blur-[100px]"></div>
      </div>

      {/* Dynamic Header */}
      <header className="pt-14 pb-6 px-6 z-10 flex justify-between items-center bg-transparent backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
           <div className="relative">
             <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-blue-400 to-purple-500">
                <img src={currentUser.avatar} alt="User" className="w-full h-full rounded-full object-cover border-2 border-black"/>
             </div>
             <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${isClockedIn ? 'bg-green-500' : 'bg-red-500'}`}></div>
           </div>
           <div>
             <h1 className="text-sm font-bold text-white leading-none mb-1">Olá, {currentUser.name.split(' ')[0]}</h1>
             <p className="text-[10px] text-white/50 uppercase tracking-wide">Digital Field App</p>
           </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 active:scale-95 transition">
           <Menu size={20} className="text-white"/>
        </button>
      </header>

      <main className="flex-1 overflow-auto px-4 pb-28 scroll-smooth z-10 no-scrollbar">
        {activeTab === 'route' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            {/* Widget GPS */}
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group">
              <MapVisualizer orders={myOrders} onNavigate={handleNavigate} height="h-56" className="bg-slate-900" />
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex justify-between items-center">
                 <div>
                    <p className="text-[10px] text-white/60 uppercase font-bold">Próximo Destino</p>
                    <p className="text-sm font-bold text-white truncate max-w-[150px]">
                      {myOrders.find(o => o.status !== 'Concluído')?.address || 'Sem rotas ativas'}
                    </p>
                 </div>
                 <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center animate-pulse">
                    <Navigation size={14} className="text-white fill-current"/>
                 </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end px-2">
                 <h2 className="text-lg font-bold text-white">Missões do Dia</h2>
                 <span className="text-xs text-white/40">{myOrders.length} total</span>
              </div>
              
              {myOrders.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-white/30 border border-dashed border-white/10 rounded-3xl">
                   <CheckCircle size={40} className="mb-4 opacity-50"/>
                   <p>Nenhuma ordem pendente</p>
                </div>
              ) : (
                myOrders.map(order => (
                  <div key={order.id} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-[1.5rem] p-5 active:scale-[0.98] transition-all">
                    <div className="flex justify-between items-start mb-3">
                       <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.status === 'Concluído' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 
                          order.status === 'Em Rota' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        }`}>
                          {order.status}
                        </span>
                        <button 
                           onClick={() => { setSelectedOrderForReport(order); setActiveTab('report'); }}
                           className="text-white/40 hover:text-white p-2 -mr-2 -mt-2"
                        >
                           <FileText size={18}/>
                        </button>
                    </div>
                    
                    <h3 className="font-bold text-lg text-white mb-1">{order.customerName}</h3>
                    <p className="text-sm text-white/60 mb-4 flex items-center gap-1.5">
                       <MapPin size={14} className="text-blue-400"/> {order.address}
                    </p>
                    
                    <div className="bg-black/20 p-3 rounded-xl mb-4 border border-white/5">
                       <p className="text-xs text-white/70 italic">"{order.description}"</p>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleNavigate(order)}
                        className="flex-1 bg-white text-black py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-200 transition"
                      >
                        <Navigation size={14} /> NAVEGAR
                      </button>
                      {order.status !== 'Concluído' && (
                        <button 
                          onClick={() => onUpdateOrderStatus(order.id, OrderStatus.COMPLETED)}
                          className="flex-1 bg-green-500/20 text-green-400 border border-green-500/30 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-500/30 transition"
                        >
                          <Check size={14} /> CONCLUIR
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CLOCK IN TAB */}
        {activeTab === 'clock' && (
          <div className="flex flex-col items-center justify-center h-full space-y-10 animate-in fade-in zoom-in duration-300">
             <div className="relative group">
                <div className={`absolute inset-0 rounded-full blur-[60px] opacity-40 transition-colors duration-1000 ${isClockedIn ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <button
                  onClick={() => onClockAction(isClockedIn ? 'CLOCK_OUT' : 'CLOCK_IN')}
                  className={`relative w-64 h-64 rounded-full flex flex-col items-center justify-center border-4 backdrop-blur-xl transition-all active:scale-95 shadow-2xl ${
                     isClockedIn 
                     ? 'bg-black/40 border-green-500/50 text-green-400' 
                     : 'bg-black/40 border-red-500/50 text-red-400'
                  }`}
                >
                  <Clock size={48} className="mb-4" strokeWidth={1.5} />
                  <span className="text-2xl font-black tracking-tighter">{isClockedIn ? 'EM TURNO' : 'OFFLINE'}</span>
                  <span className="text-xs uppercase tracking-widest mt-2 opacity-60">Toque para alterar</span>
                </button>
             </div>

             <div className="w-full bg-white/5 backdrop-blur-md rounded-[2rem] p-6 border border-white/10">
               <h3 className="font-bold text-white/80 mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={14} /> Histórico Hoje
               </h3>
               <div className="space-y-4">
                  {todaysRecords.map((record, i) => (
                    <div key={record.id} className="flex items-center gap-4 group">
                       <div className="flex flex-col items-center gap-1">
                          <div className={`w-3 h-3 rounded-full ${record.type === 'CLOCK_IN' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
                          {i !== todaysRecords.length -1 && <div className="w-0.5 h-6 bg-white/10"></div>}
                       </div>
                       <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/5">
                          <div className="flex justify-between items-center">
                             <span className="font-bold text-sm text-white">{record.type === 'CLOCK_IN' ? 'Entrada' : 'Saída'}</span>
                             <span className="font-mono text-xs text-white/50">{new Date(record.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-[10px] text-white/40 mt-1 truncate">{record.location}</p>
                       </div>
                    </div>
                  ))}
                  {todaysRecords.length === 0 && <p className="text-white/30 text-sm text-center italic">Sem registros ainda.</p>}
               </div>
             </div>
          </div>
        )}

        {/* REPORT TAB */}
        {activeTab === 'report' && (
           <div className="animate-in slide-in-from-bottom duration-500 bg-black min-h-full">
              {!selectedOrderForReport ? (
                 <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-20">
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
                       <FileText size={32} className="text-white/50"/>
                    </div>
                    <h3 className="text-xl font-bold text-white">Selecione uma Ordem</h3>
                    <p className="text-white/50 max-w-[200px]">Volte para a rota e clique no ícone de documento em uma ordem.</p>
                    <button onClick={() => setActiveTab('route')} className="px-8 py-3 bg-blue-600 rounded-full text-white font-bold text-sm">Voltar para Rota</button>
                 </div>
              ) : (
                 <div className="space-y-6 pb-10">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                       <h2 className="text-lg font-bold text-white mb-1">Relatório Técnico</h2>
                       <p className="text-sm text-white/50">{selectedOrderForReport.customerName}</p>
                    </div>

                    {/* Checklist */}
                    <div className="space-y-3">
                       <p className="text-xs text-white/40 uppercase font-bold pl-2">Checklist de Sistemas</p>
                       {[
                          { id: 'gate', label: 'Portão Automático' },
                          { id: 'cctv', label: 'Sistema CFTV' },
                          { id: 'intercom', label: 'Interfonia' },
                          { id: 'lock', label: 'Fechaduras Eletroímã' },
                          { id: 'preventive', label: 'Manutenção Preventiva' },
                       ].map((item) => (
                          <label key={item.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl active:bg-white/10 transition">
                             <span className="text-sm font-medium text-white">{item.label}</span>
                             <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                // @ts-ignore
                                reportForm[item.id] ? 'bg-blue-600 border-blue-600' : 'border-white/30'
                             }`}>
                                <input 
                                  type="checkbox" 
                                  className="hidden"
                                  // @ts-ignore
                                  checked={reportForm[item.id]}
                                  // @ts-ignore
                                  onChange={e => setReportForm({...reportForm, [item.id]: e.target.checked})}
                                />
                                {/* @ts-ignore */}
                                {reportForm[item.id] && <Check size={14} className="text-white" />}
                             </div>
                          </label>
                       ))}
                    </div>

                    {/* Times */}
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs text-white/40 uppercase font-bold pl-2 mb-2 block">Início</label>
                          <input 
                             type="time" 
                             className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-center focus:outline-none focus:border-blue-500"
                             value={reportForm.startTime}
                             onChange={e => setReportForm({...reportForm, startTime: e.target.value})}
                          />
                       </div>
                       <div>
                          <label className="text-xs text-white/40 uppercase font-bold pl-2 mb-2 block">Fim</label>
                          <input 
                             type="time" 
                             className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-center focus:outline-none focus:border-blue-500"
                             value={reportForm.endTime}
                             onChange={e => setReportForm({...reportForm, endTime: e.target.value})}
                          />
                       </div>
                    </div>

                    {/* Photos Simulation */}
                    <div>
                       <p className="text-xs text-white/40 uppercase font-bold pl-2 mb-2">Fotos do Serviço</p>
                       <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                          <button className="w-20 h-20 shrink-0 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 hover:text-white hover:border-white transition">
                             <Camera size={20} />
                             <span className="text-[10px] mt-1">Add</span>
                          </button>
                          {[1,2].map(i => (
                             <div key={i} className="w-20 h-20 shrink-0 rounded-xl bg-gray-800 relative overflow-hidden border border-white/10">
                                <img src={`https://picsum.photos/200?random=${i}`} alt="" className="w-full h-full object-cover opacity-70"/>
                                <div className="absolute top-1 right-1 bg-black/50 rounded-full p-1"><Check size={10} className="text-green-400"/></div>
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Comments */}
                    <div>
                       <label className="text-xs text-white/40 uppercase font-bold pl-2 mb-2 block">Observações</label>
                       <textarea 
                          rows={3}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-blue-500"
                          placeholder="Detalhes técnicos..."
                          value={reportForm.comments}
                          onChange={e => setReportForm({...reportForm, comments: e.target.value})}
                       />
                    </div>

                    {/* Signature */}
                    <div>
                       <label className="text-xs text-white/40 uppercase font-bold pl-2 mb-2 block">Assinatura do Responsável</label>
                       <div className="bg-white rounded-2xl p-4">
                          <div className="h-24 border-b border-dashed border-gray-300 flex items-end justify-center pb-2 mb-2">
                             {reportForm.signature ? <span className="font-handwriting text-2xl text-black">{reportForm.signature}</span> : <span className="text-gray-300 text-xs">Assine aqui</span>}
                          </div>
                          <input 
                             type="text" 
                             placeholder="Digite o nome para assinar"
                             className="w-full bg-gray-100 rounded-lg p-2 text-black text-sm outline-none"
                             value={reportForm.signature}
                             onChange={e => setReportForm({...reportForm, signature: e.target.value})}
                          />
                       </div>
                    </div>

                    <button 
                       onClick={handleSubmitReport}
                       className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                       <FileText size={20} /> FINALIZAR RELATÓRIO
                    </button>
                    
                    <button onClick={() => setSelectedOrderForReport(null)} className="w-full text-white/40 text-sm py-2">Cancelar</button>
                 </div>
              )}
           </div>
        )}
      </main>

      {/* Floating Dock Navigation */}
      <nav className="fixed bottom-6 left-6 right-6 z-50">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-2 flex justify-between items-center shadow-2xl">
          {[
            { id: 'route', icon: Navigation, label: 'Rota' },
            { id: 'clock', icon: Clock, label: 'Ponto' },
            { id: 'report', icon: FileText, label: 'Relatório' }
          ].map(item => (
            <button 
              key={item.id}
              // @ts-ignore
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-[1.5rem] transition-all duration-300 relative overflow-hidden ${
                activeTab === item.id 
                ? 'text-black bg-white shadow-lg' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={22} strokeWidth={2.5} />
              {activeTab === item.id && <span className="text-[10px] font-bold">{item.label}</span>}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};