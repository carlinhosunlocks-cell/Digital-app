
import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Check, Navigation, Menu, FileText, Camera, PenTool, Calendar, X, ChevronRight, Upload, CheckCircle, Package, Minus, Plus, Bell, Briefcase } from 'lucide-react';
import { User, ServiceOrder, TimeRecord, OrderStatus, ServiceReport, TechnicianStockItem, Notification, HRRequest, HRRequestStatus } from '../types';
import MapVisualizer from '../components/MapVisualizer';
import { apiService } from '../services/parseService';

interface EmployeeViewProps {
  currentUser: User;
  orders: ServiceOrder[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onClockAction: (type: 'CLOCK_IN' | 'CLOCK_OUT') => void;
  timeRecords: TimeRecord[];
  notifications: Notification[];
  hrRequests: HRRequest[];
  onCreateReport: (report: ServiceReport) => void;
  onCreateHRRequest: (request: Partial<HRRequest>) => void;
}

export const EmployeeView: React.FC<EmployeeViewProps> = ({ currentUser, orders, onUpdateOrderStatus, onClockAction, timeRecords, notifications, hrRequests, onCreateReport, onCreateHRRequest }) => {
  const [activeTab, setActiveTab] = useState<'route' | 'clock' | 'report' | 'stock' | 'hr'>('route');
  const [selectedOrderForReport, setSelectedOrderForReport] = useState<ServiceOrder | null>(null);
  const [myStock, setMyStock] = useState<TechnicianStockItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  
  // Load stock
  useEffect(() => {
      const fetchStock = async () => {
          if (currentUser.id) {
            const stock = await apiService.getTechnicianStock(currentUser.id);
            setMyStock(stock);
          }
      };
      if (activeTab === 'stock' || activeTab === 'report') {
          fetchStock();
      }
  }, [activeTab, currentUser.id]);

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

  const [usedParts, setUsedParts] = useState<{itemId: string, itemName: string, quantity: number}[]>([]);
  const [partSelection, setPartSelection] = useState({ itemId: '', quantity: 1 });
  
  // HR Form State
  const [hrForm, setHrForm] = useState({
    type: 'VACATION' as 'VACATION' | 'SICK_LEAVE' | 'REIMBURSEMENT' | 'OTHER',
    startDate: '',
    endDate: '',
    reason: '',
    amount: 0
  });
  const [isHRModalOpen, setIsHRModalOpen] = useState(false);

  const myOrders = orders.filter(o => o.assignedToId === currentUser.id);
  const todaysRecords = timeRecords.filter(r => r.employeeId === currentUser.id && new Date(r.timestamp).toDateString() === new Date().toDateString());
  const isClockedIn = todaysRecords.length > 0 && todaysRecords[todaysRecords.length - 1].type === 'CLOCK_IN';

  const handleNavigate = (order: ServiceOrder) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${order.lat},${order.lng}`;
    window.open(url, '_blank');
  };

  const handleAddPart = () => {
      if (!partSelection.itemId || partSelection.quantity <= 0) return;
      const stockItem = myStock.find(s => s.itemId === partSelection.itemId);
      if (!stockItem) return;

      if (partSelection.quantity > stockItem.quantity) {
          alert('Quantidade indisponível no seu estoque.');
          return;
      }

      setUsedParts([...usedParts, { 
          itemId: partSelection.itemId, 
          itemName: stockItem.itemName, 
          quantity: partSelection.quantity 
      }]);
      setPartSelection({ itemId: '', quantity: 1 });
  };

  const handleRemovePart = (index: number) => {
      const newParts = [...usedParts];
      newParts.splice(index, 1);
      setUsedParts(newParts);
  };

  const handleHRSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateHRRequest({
        ...hrForm,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        status: HRRequestStatus.PENDING
    });
    setIsHRModalOpen(false);
    setHrForm({
        type: 'VACATION',
        startDate: '',
        endDate: '',
        reason: '',
        amount: 0
    });
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
      ], 
      signatureName: reportForm.signature || 'Cliente',
      partsUsed: usedParts
    };
    
    onCreateReport(newReport);
    setReportForm({ gate: false, cctv: false, intercom: false, lock: false, preventive: false, startTime: '', endTime: '', comments: '', signature: '' });
    setUsedParts([]);
    setSelectedOrderForReport(null);
    setActiveTab('route');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string) => {
      await apiService.markNotificationRead(id);
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
        <div className="relative">
          <button 
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 active:scale-95 transition"
          >
             <Bell size={20} className="text-white"/>
             {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-black"></span>}
          </button>
          
          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50">
                <div className="p-4 border-b border-white/10 bg-slate-800/50">
                  <h3 className="font-bold text-white text-sm">Notificações</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">Nenhuma notificação.</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} onClick={() => handleMarkRead(n.id)} className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition ${!n.read ? 'bg-blue-900/20' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${n.type === 'error' ? 'bg-red-500' : n.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                          <span className="text-xs font-bold text-white">{n.title}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-auto px-4 pb-28 scroll-smooth z-10 no-scrollbar" onClick={() => setShowNotifMenu(false)}>
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

        {/* STOCK TAB */}
        {activeTab === 'stock' && (
            <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center px-2">
                    <h2 className="text-xl font-bold text-white">Meu Estoque</h2>
                    <div className="bg-white/10 p-2 rounded-xl text-xs text-white/70">
                        {myStock.length} Itens
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {myStock.map(item => (
                        <div key={item.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                                    <Package size={24}/>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">{item.itemName}</h4>
                                    <p className="text-xs text-white/50">Atualizado em: {new Date(item.lastUpdated).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-2xl font-bold text-white">{item.quantity}</span>
                                <span className="text-[10px] text-white/40 uppercase">Quantidade</span>
                            </div>
                        </div>
                    ))}
                    {myStock.length === 0 && (
                        <div className="text-center py-10 text-white/30 border border-dashed border-white/10 rounded-2xl">
                            Você não possui materiais atribuídos.
                        </div>
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

        {/* HR TAB */}
        {activeTab === 'hr' && (
            <div className="space-y-6 animate-in fade-in duration-300 h-full overflow-auto no-scrollbar pb-24">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black text-white tracking-tight">Recursos Humanos</h2>
                    <button 
                        onClick={() => setIsHRModalOpen(true)}
                        className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-900/50"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <p className="text-xs text-white/40 uppercase font-bold tracking-widest pl-1">Minhas Solicitações</p>
                    {hrRequests.map(request => (
                        <div key={request.id} className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-white">{request.type === 'VACATION' ? 'Férias' : request.type === 'SICK_LEAVE' ? 'Atestado Médico' : request.type === 'REIMBURSEMENT' ? 'Reembolso' : 'Outro'}</h4>
                                    <p className="text-[10px] text-white/40 uppercase font-medium tracking-tight">
                                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                                    request.status === HRRequestStatus.PENDING ? 'bg-amber-500/20 text-amber-500' :
                                    request.status === HRRequestStatus.APPROVED ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                }`}>
                                    {request.status === HRRequestStatus.PENDING ? 'Pendente' : request.status === HRRequestStatus.APPROVED ? 'Aprovado' : 'Rejeitado'}
                                </span>
                            </div>
                            {request.reason && <p className="text-xs text-white/60 italic mb-2">"{request.reason}"</p>}
                            {request.amount > 0 && <p className="text-sm font-bold text-blue-400">R$ {request.amount.toFixed(2)}</p>}
                        </div>
                    ))}
                    {hrRequests.length === 0 && (
                        <div className="text-center py-12 border border-dashed border-white/10 rounded-3xl">
                            <Briefcase size={32} className="text-white/10 mx-auto mb-3" />
                            <p className="text-white/30 text-sm italic">Nenhuma solicitação enviada.</p>
                        </div>
                    )}
                </div>

                {/* HR Request Modal */}
                {isHRModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-slate-900 w-full max-w-lg rounded-[2.5rem] border border-white/10 p-8 animate-in slide-in-from-bottom duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-white">Nova Solicitação</h3>
                                <button onClick={() => setIsHRModalOpen(false)} className="p-2 bg-white/5 rounded-full text-white/50"><X size={20}/></button>
                            </div>

                            <form onSubmit={handleHRSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Tipo de Pedido</label>
                                    <select 
                                        value={hrForm.type}
                                        onChange={e => setHrForm({...hrForm, type: e.target.value as any})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500"
                                    >
                                        <option value="VACATION">Férias</option>
                                        <option value="SICK_LEAVE">Atestado / Folga</option>
                                        <option value="REIMBURSEMENT">Reembolso de Despesas</option>
                                        <option value="OTHER">Outros Assuntos</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Data Início</label>
                                        <input 
                                            type="date" 
                                            required
                                            value={hrForm.startDate}
                                            onChange={e => setHrForm({...hrForm, startDate: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Data Fim</label>
                                        <input 
                                            type="date" 
                                            required
                                            value={hrForm.endDate}
                                            onChange={e => setHrForm({...hrForm, endDate: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none"
                                        />
                                    </div>
                                </div>

                                {hrForm.type === 'REIMBURSEMENT' && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Valor do Reembolso</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            value={hrForm.amount}
                                            onChange={e => setHrForm({...hrForm, amount: Number(e.target.value)})}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none"
                                            placeholder="0,00"
                                        />
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Justificativa / Detalhes</label>
                                    <textarea 
                                        rows={3}
                                        value={hrForm.reason}
                                        onChange={e => setHrForm({...hrForm, reason: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none resize-none"
                                        placeholder="Descreva o motivo da solicitação..."
                                    />
                                </div>

                                <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-900/50 hover:bg-blue-500 transition-all uppercase text-xs tracking-widest mt-4">
                                    Enviar para o RH
                                </button>
                            </form>
                        </div>
                    </div>
                )}
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
                                reportForm[item.id as keyof typeof reportForm] ? 'bg-blue-600 border-blue-600' : 'border-white/30'
                             }`}>
                                <input 
                                  type="checkbox" 
                                  className="hidden"
                                  // @ts-ignore
                                  checked={reportForm[item.id as keyof typeof reportForm]}
                                  // @ts-ignore
                                  onChange={e => setReportForm({...reportForm, [item.id]: e.target.checked})}
                                />
                                {/* @ts-ignore */}
                                {reportForm[item.id as keyof typeof reportForm] && <Check size={14} className="text-white" />}
                             </div>
                          </label>
                       ))}
                    </div>

                    {/* Parts Used Section */}
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <p className="text-xs text-white/40 uppercase font-bold mb-3">Materiais Utilizados</p>
                        
                        <div className="flex gap-2 mb-4">
                            <select 
                                className="flex-1 bg-white/10 rounded-xl p-3 text-white text-sm outline-none border border-white/10"
                                value={partSelection.itemId}
                                onChange={e => setPartSelection({...partSelection, itemId: e.target.value})}
                            >
                                <option value="">Selecionar Material...</option>
                                {myStock.map(item => (
                                    <option key={item.itemId} value={item.itemId}>{item.itemName} (Disp: {item.quantity})</option>
                                ))}
                            </select>
                            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-2">
                                <button onClick={() => setPartSelection({...partSelection, quantity: Math.max(1, partSelection.quantity - 1)})}><Minus size={14}/></button>
                                <span className="w-6 text-center text-sm font-bold">{partSelection.quantity}</span>
                                <button onClick={() => setPartSelection({...partSelection, quantity: partSelection.quantity + 1})}><Plus size={14}/></button>
                            </div>
                            <button onClick={handleAddPart} className="bg-blue-600 p-3 rounded-xl"><Plus size={18}/></button>
                        </div>

                        {usedParts.length > 0 && (
                            <div className="space-y-2">
                                {usedParts.map((part, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                                        <span className="text-sm">{part.quantity}x {part.itemName}</span>
                                        <button onClick={() => handleRemovePart(idx)} className="text-red-400 p-1"><X size={14}/></button>
                                    </div>
                                ))}
                            </div>
                        )}
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
            { id: 'stock', icon: Package, label: 'Estoque' },
            { id: 'hr', icon: Briefcase, label: 'RH' },
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
