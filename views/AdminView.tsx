
import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, Users, FileText, Settings, Plus, 
  Map as MapIcon, CheckCircle, AlertTriangle, MessageSquare, 
  Search, Bell, X, Filter, Clock, Briefcase, 
  Printer, TrendingUp, Calendar, DollarSign, Send, UserPlus, Check, XCircle, Pencil, Power, User as UserIcon, Shield, Trash2, Download
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, Tooltip } from 'recharts';
import { User, ServiceOrder, TimeRecord, Ticket, OrderStatus, TicketStatus, Role, ServiceReport } from '../types';
import MapVisualizer from '../components/MapVisualizer';

interface AdminViewProps {
  orders: ServiceOrder[];
  employees: User[];
  timeRecords: TimeRecord[];
  tickets: Ticket[];
  hrRequests: any[];
  reports: ServiceReport[];
  onCreateOrder: (order: ServiceOrder) => void;
  onUpdateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  onReplyTicket: (ticketId: string, message: string) => void;
  onSaveEmployee: (user: Partial<User> & { password?: string }) => void;
}

const Card: React.FC<{ title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }> = ({ title, children, className = "", action }) => (
  <div className={`bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
    {(title || action) && (
      <div className="flex justify-between items-center mb-6">
        {title && <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </div>
);

export const AdminView: React.FC<AdminViewProps> = ({ 
  orders, employees, timeRecords, tickets, hrRequests, reports, 
  onCreateOrder, onUpdateTicketStatus, onReplyTicket, onSaveEmployee 
}) => {
  const [activeTab, setActiveTab] = useState<'dash' | 'orders' | 'users' | 'reports' | 'support' | 'settings'>('dash');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Form States
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE' as Role,
    department: 'Operações',
    position: 'Técnico',
    salary: 0,
    password: '',
    status: 'active' as 'active' | 'idle'
  });

  const [orderForm, setOrderForm] = useState({
    title: '',
    customerName: '',
    address: '',
    description: '',
    assignedToId: '',
    lat: -23.55,
    lng: -46.63
  });

  const stats = useMemo(() => ({
    totalUsers: employees.length,
    activeStaff: employees.filter(e => e.role !== 'CLIENT' && e.status === 'active').length,
    totalClients: employees.filter(e => e.role === 'CLIENT').length,
    pendingOrders: orders.filter(o => o.status === OrderStatus.PENDING).length,
    completedOrders: orders.filter(o => o.status === OrderStatus.COMPLETED).length
  }), [employees, orders]);

  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setEditingUserId(user.id);
      setUserForm({
        name: user.name,
        email: user.email || '',
        role: user.role,
        department: user.department || 'Operações',
        position: user.position || 'Técnico',
        salary: user.salary || 0,
        password: '',
        status: user.status || 'active'
      });
    } else {
      setEditingUserId(null);
      setUserForm({
        name: '',
        email: '',
        role: 'EMPLOYEE',
        department: 'Operações',
        position: 'Técnico',
        salary: 0,
        password: '',
        status: 'active'
      });
    }
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveEmployee({
      id: editingUserId || undefined,
      ...userForm
    });
    setIsUserModalOpen(false);
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrder: ServiceOrder = {
      id: Date.now().toString(),
      ...orderForm,
      status: OrderStatus.PENDING,
      date: new Date().toISOString().split('T')[0]
    };
    onCreateOrder(newOrder);
    setIsOrderModalOpen(false);
  };

  const handleReplySubmit = () => {
    if (selectedTicket && replyMessage) {
      onReplyTicket(selectedTicket.id, replyMessage);
      setReplyMessage('');
      setIsReplyModalOpen(false);
      setSelectedTicket(null);
    }
  };

  const openReplyModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsReplyModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-20 lg:w-72 bg-white border-r border-slate-200 flex flex-col z-30 transition-all duration-300">
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">D</div>
          <div className="hidden lg:block">
            <h1 className="text-slate-900 font-bold text-lg leading-none">Digital</h1>
            <span className="text-[10px] text-blue-600 font-bold tracking-widest uppercase">Equipamentos</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
          {[
            { id: 'dash', icon: LayoutDashboard, label: 'Painel Geral' },
            { id: 'orders', icon: MapIcon, label: 'Gestão de Rotas' },
            { id: 'users', icon: Users, label: 'Gestão de Usuários' },
            { id: 'reports', icon: FileText, label: 'Relatórios & OS' },
            { id: 'support', icon: MessageSquare, label: 'Atendimento' },
            { id: 'settings', icon: Settings, label: 'Configurações' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)} 
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                activeTab === item.id 
                ? 'bg-blue-50 text-blue-600 font-bold' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={22} className={activeTab === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} /> 
              <span className="hidden lg:block text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="px-8 py-6 flex justify-between items-center bg-white border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {activeTab === 'users' ? 'Gestão Unificada de Usuários' : 
             activeTab === 'dash' ? 'SaaS Control Panel' : 
             activeTab === 'orders' ? 'Logística e Rotas' : 
             activeTab === 'reports' ? 'Relatórios e Documentos' : 
             activeTab === 'support' ? 'Centro de Atendimento' : 'Configurações do Sistema'}
          </h2>
          <div className="flex gap-4">
             <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-100 transition"><Search size={18}/></div>
             <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-500 relative cursor-pointer hover:bg-slate-100 transition">
                <Bell size={18}/><span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto px-8 py-8 no-scrollbar">
          {activeTab === 'dash' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-l-4 border-l-blue-500">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Equipe de Campo</p>
                    <h4 className="text-3xl font-black text-slate-800">{stats.activeStaff}</h4>
                    <p className="text-[10px] text-green-500 font-bold mt-2">Profissionais Ativos</p>
                  </Card>
                  <Card className="border-l-4 border-l-purple-500">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Base de Clientes</p>
                    <h4 className="text-3xl font-black text-slate-800">{stats.totalClients}</h4>
                    <p className="text-[10px] text-purple-500 font-bold mt-2">Empresas Cadastradas</p>
                  </Card>
                  <Card className="border-l-4 border-l-amber-500">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">OS Pendentes</p>
                    <h4 className="text-3xl font-black text-slate-800">{stats.pendingOrders}</h4>
                    <p className="text-[10px] text-amber-500 font-bold mt-2">Aguardando Execução</p>
                  </Card>
                  <Card className="border-l-4 border-l-green-500">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Faturamento Estimado</p>
                    <h4 className="text-3xl font-black text-slate-800">R$ 14.5k</h4>
                    <p className="text-[10px] text-green-500 font-bold mt-2">+12% vs mês anterior</p>
                  </Card>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card title="Volume de Atendimento" className="lg:col-span-2">
                     <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={[{n:'Seg',v:10},{n:'Ter',v:25},{n:'Qua',v:18},{n:'Qui',v:32},{n:'Sex',v:28}]}>
                              <defs>
                                 <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                 </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize:12, fill:'#94a3b8'}} />
                              <Tooltip />
                              <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </Card>
                  <Card title="Tickets Recentes">
                     <div className="space-y-4">
                        {tickets.slice(0, 3).map(ticket => (
                           <div key={ticket.id} onClick={() => openReplyModal(ticket)} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3 group hover:bg-white hover:border-blue-200 transition-all cursor-pointer">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors"><MessageSquare size={18}/></div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-sm font-bold text-slate-800 truncate">{ticket.subject}</p>
                                 <p className="text-[10px] text-slate-400 uppercase font-medium">{ticket.clientName}</p>
                              </div>
                           </div>
                        ))}
                        {tickets.length === 0 && <p className="text-center text-slate-400 text-sm py-4 italic">Nenhum ticket aberto.</p>}
                     </div>
                  </Card>
               </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                     <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 shadow-sm">Total: {employees.length}</div>
                     <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl text-sm font-bold text-blue-600 shadow-sm">Ativos: {stats.activeStaff}</div>
                  </div>
                  <button 
                    onClick={() => handleOpenUserModal()} 
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                  >
                    <UserPlus size={18}/> Novo Usuário
                  </button>
               </div>

               <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                     <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                        <tr>
                           <th className="px-8 py-5">Nome / Email</th>
                           <th className="px-8 py-5">Perfil de Acesso</th>
                           <th className="px-8 py-5">Departamento</th>
                           <th className="px-8 py-5 text-center">Status</th>
                           <th className="px-8 py-5 text-right">Ações</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {employees.map(user => (
                           <tr key={user.id} className="hover:bg-slate-50/50 transition group">
                              <td className="px-8 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold overflow-hidden border border-slate-200">
                                       {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                                    </div>
                                    <div>
                                       <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                                       <p className="text-[10px] text-slate-400 font-medium">{user.email}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-4">
                                 <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                                    user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' :
                                    user.role === 'EMPLOYEE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                 }`}>
                                    {user.role === 'ADMIN' ? 'Administrador' : user.role === 'EMPLOYEE' ? 'Equipe de Campo' : 'Cliente'}
                                 </span>
                              </td>
                              <td className="px-8 py-4 text-xs font-semibold text-slate-500">{user.department || 'Externo'}</td>
                              <td className="px-8 py-4 text-center">
                                 <div className={`mx-auto w-2 h-2 rounded-full ${user.status === 'active' || !user.status ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-400'}`}></div>
                              </td>
                              <td className="px-8 py-4 text-right">
                                 <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenUserModal(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Pencil size={16}/></button>
                                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Power size={16}/></button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'orders' && (
             <div className="h-full flex flex-col gap-6 animate-in slide-in-from-right duration-500">
                <div className="flex justify-between items-center">
                   <h3 className="text-lg font-bold text-slate-800">Mapa Logístico de Ordens</h3>
                   <button onClick={() => setIsOrderModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition shadow-lg">
                      <Plus size={18}/> Nova OS
                   </button>
                </div>
                <div className="flex-1 bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl relative min-h-[400px]">
                   <MapVisualizer orders={orders} onNavigate={() => {}} height="h-full" />
                </div>
             </div>
          )}

          {activeTab === 'reports' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {reports.map(report => (
                      <Card key={report.id} className="hover:shadow-xl transition-all border-none shadow-sm">
                         <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                               <FileText size={24} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(report.date).toLocaleDateString()}</span>
                         </div>
                         <h4 className="font-black text-slate-800 text-lg mb-2">OS #{report.id.slice(-4)}</h4>
                         <p className="text-xs text-slate-500 font-bold uppercase mb-4">{report.clientName}</p>
                         <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 border-b border-slate-50 pb-2">
                               <span>Técnico</span>
                               <span className="text-slate-700">{report.technicianName}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 border-b border-slate-50 pb-2">
                               <span>Status</span>
                               <span className="text-green-600">Finalizado</span>
                            </div>
                         </div>
                         <button className="w-full py-3 bg-slate-50 text-slate-700 text-xs font-black rounded-xl hover:bg-slate-100 flex items-center justify-center gap-2 transition-colors">
                            <Download size={14} /> DOWNLOAD PDF
                         </button>
                      </Card>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'support' && (
             <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                         <tr>
                            <th className="px-8 py-5">Assunto / Cliente</th>
                            <th className="px-8 py-5">Data de Abertura</th>
                            <th className="px-8 py-5 text-center">Status</th>
                            <th className="px-8 py-5 text-right">Ações</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {tickets.map(ticket => (
                            <tr key={ticket.id} className="hover:bg-slate-50/50 transition">
                               <td className="px-8 py-5">
                                  <p className="font-bold text-slate-800 text-sm">{ticket.subject}</p>
                                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{ticket.clientName}</p>
                               </td>
                               <td className="px-8 py-5 text-xs font-semibold text-slate-500">
                                  {new Date(ticket.createdAt).toLocaleDateString()}
                               </td>
                               <td className="px-8 py-5 text-center">
                                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${
                                     ticket.status === 'Aberto' ? 'bg-red-100 text-red-600' :
                                     ticket.status === 'Em Análise' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                                  }`}>
                                     {ticket.status}
                                  </span>
                               </td>
                               <td className="px-8 py-5 text-right">
                                  <button onClick={() => openReplyModal(ticket)} className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors">
                                     Responder
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === 'settings' && (
             <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
                <Card title="Configurações da Plataforma">
                   <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <div>
                            <p className="font-bold text-slate-800 text-sm">Notificações por Email</p>
                            <p className="text-xs text-slate-400">Enviar alertas automáticos ao finalizar OS</p>
                         </div>
                         <div className="w-12 h-6 bg-blue-600 rounded-full flex items-center justify-end px-1 cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full"></div>
                         </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <div>
                            <p className="font-bold text-slate-800 text-sm">Backup Automático</p>
                            <p className="text-xs text-slate-400">Sincronização diária com o Back4App Cloud</p>
                         </div>
                         <div className="w-12 h-6 bg-blue-600 rounded-full flex items-center justify-end px-1 cursor-pointer">
                            <div className="w-4 h-4 bg-white rounded-full"></div>
                         </div>
                      </div>
                      <div className="pt-6 border-t border-slate-100">
                         <button className="w-full py-4 bg-red-50 text-red-600 text-xs font-black rounded-2xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                            <Power size={14} /> ENCERRAR TODOS OS TURNOS ATIVOS
                         </button>
                      </div>
                   </div>
                </Card>
             </div>
          )}
        </div>
      </main>

      {/* User Management Modal */}
      {isUserModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-xl text-slate-800 tracking-tight">{editingUserId ? 'Editar Usuário' : 'Novo Usuário SaaS'}</h3>
                  <button onClick={() => setIsUserModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition"><X size={20}/></button>
               </div>
               
               <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil de Acesso</label>
                     <select 
                       value={userForm.role} 
                       onChange={e => setUserForm({...userForm, role: e.target.value as Role})} 
                       className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 focus:border-blue-500 outline-none font-bold text-slate-700"
                     >
                        <option value="ADMIN">Administrador (Gestão SaaS)</option>
                        <option value="EMPLOYEE">Equipe de Campo (Mobile App)</option>
                        <option value="CLIENT">Cliente (Portal do Cliente)</option>
                     </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                        <input required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none focus:border-blue-500" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de Login</label>
                        <input required type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none focus:border-blue-500" />
                     </div>
                  </div>

                  {userForm.role !== 'CLIENT' && (
                    <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-4">
                       <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Informações Administrativas</p>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-400 uppercase">Departamento</label>
                             <input value={userForm.department} onChange={e => setUserForm({...userForm, department: e.target.value})} className="w-full bg-white p-2 rounded-lg border-none outline-none text-sm" />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-400 uppercase">Salário Base</label>
                             <input type="number" value={userForm.salary} onChange={e => setUserForm({...userForm, salary: Number(e.target.value)})} className="w-full bg-white p-2 rounded-lg border-none outline-none text-sm" />
                          </div>
                       </div>
                    </div>
                  )}

                  <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[0.99] transition-all flex justify-center items-center gap-2 mt-4 uppercase text-xs tracking-widest">
                     <CheckCircle size={18}/> {editingUserId ? 'Salvar Alterações' : 'Criar Conta no Back4App'}
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* Reply Ticket Modal */}
      {isReplyModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-black text-xl text-slate-800">Responder Chamado</h3>
                  <p className="text-sm text-slate-500">{selectedTicket.subject}</p>
                </div>
                <button onClick={() => setIsReplyModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition"><X size={20}/></button>
              </div>

              <div className="space-y-4">
                <textarea
                    rows={5}
                    placeholder="Digite sua resposta para o cliente..."
                    className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none focus:border-blue-500 resize-none"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                />
                
                <div className="flex gap-2 justify-end">
                   <button onClick={() => onUpdateTicketStatus(selectedTicket.id, TicketStatus.RESOLVED)} className="px-6 py-3 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 transition">
                      Marcar Resolvido
                   </button>
                   <button onClick={handleReplySubmit} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center gap-2">
                      <Send size={16} /> Enviar Resposta
                   </button>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {isOrderModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-xl text-slate-800">Nova Ordem de Serviço</h3>
                  <button onClick={() => setIsOrderModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition"><X size={20}/></button>
               </div>
               <form onSubmit={handleOrderSubmit} className="space-y-4">
                  <input required placeholder="Título do Serviço" className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none focus:border-blue-500" value={orderForm.title} onChange={e => setOrderForm({...orderForm, title: e.target.value})} />
                  <input required placeholder="Nome do Cliente" className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none focus:border-blue-500" value={orderForm.customerName} onChange={e => setOrderForm({...orderForm, customerName: e.target.value})} />
                  <input required placeholder="Endereço Completo" className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none focus:border-blue-500" value={orderForm.address} onChange={e => setOrderForm({...orderForm, address: e.target.value})} />
                  <textarea placeholder="Descrição técnica" className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none focus:border-blue-500 min-h-[100px]" value={orderForm.description} onChange={e => setOrderForm({...orderForm, description: e.target.value})} />
                  
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Atribuir Técnico</label>
                     <select 
                       required
                       value={orderForm.assignedToId} 
                       onChange={e => setOrderForm({...orderForm, assignedToId: e.target.value})} 
                       className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none font-bold"
                     >
                        <option value="">Selecione um técnico...</option>
                        {employees.filter(e => e.role === 'EMPLOYEE').map(emp => (
                           <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                     </select>
                  </div>

                  <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all mt-4 uppercase text-xs tracking-widest">
                     Gerar Ordem de Serviço
                  </button>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};
