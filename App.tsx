
import React, { useState, useEffect, useCallback } from 'react';
import { AdminView } from './views/AdminView';
import { EmployeeView } from './views/EmployeeView';
import { ClientView } from './views/ClientView';
import { apiService } from './services/parseService';
import { Role, User, ServiceOrder, Ticket, OrderStatus, ServiceReport, TicketStatus, TimeRecord } from './types';
import { ArrowRight, Lock, Mail, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const ToastContainer: React.FC<{ toasts: {id: string, message: string, type: 'success' | 'error'}[] }> = ({ toasts }) => (
  <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
    {toasts.map(toast => (
      <div key={toast.id} className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right-10 fade-in duration-500 ${
        toast.type === 'success' 
        ? 'bg-white/80 border-green-200/50 text-green-700' 
        : 'bg-white/80 border-red-200/50 text-red-700'
      }`}>
        <div className={`p-1 rounded-full ${toast.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
        </div>
        <span className="text-sm font-semibold">{toast.message}</span>
      </div>
    ))}
  </div>
);

const LoginScreen: React.FC<{ onLogin: (email: string, pass: string) => void; error: string | null; loading: boolean }> = ({ onLogin, error, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0">
         <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-blue-600/20 rounded-full blur-[150px] animate-pulse"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/20 rounded-full blur-[150px] animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-[400px] z-10 px-6">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-lg">
            <span className="text-4xl font-bold text-white">D</span>
          </div>
          
          <h2 className="text-2xl font-semibold text-white mb-1">Digital Equipamentos</h2>
          <p className="text-white/50 text-sm mb-8 text-center">Login Unificado • Vercel Edition</p>

          <div className="bg-white/5 p-3 rounded-xl w-full mb-6 text-[10px] text-white/50">
             <p className="font-bold mb-1">Acesso (Demo Persistente):</p>
             <p>Admin: admin@admin.com / 123</p>
             <p>Técnico: carlos@digital.com / 123</p>
             <p>Cliente: cliente@tech.com / 123</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/20 text-red-200 rounded-xl text-xs flex items-center gap-2 border border-red-500/30 w-full justify-center">
               <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="group relative">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"><Mail size={18} /></div>
               <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-white/30 transition-all text-sm" placeholder="Seu e-mail" />
            </div>
            <div className="group relative">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"><Lock size={18} /></div>
               <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-white/30 transition-all text-sm" placeholder="Sua senha" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50">
               {loading ? <Loader2 className="animate-spin" size={20} /> : <>Entrar no Sistema <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toasts, setToasts] = useState<{id: string, message: string, type: 'success' | 'error'}[]>([]);

  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [reports, setReports] = useState<ServiceReport[]>([]);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      const [ord, tkt, emp, rep, rec] = await Promise.all([
        apiService.getOrders(),
        apiService.getTickets(),
        apiService.getUsers(),
        apiService.getReports(),
        apiService.getTimeRecords()
      ]);
      setOrders(ord);
      setTickets(tkt);
      setUsers(emp);
      setReports(rep);
      setTimeRecords(rec);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const user = await apiService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          await loadAllData();
        }
      } catch (e) {
        console.error("Erro na sessão:", e);
      } finally {
        setInitialLoading(false);
      }
    }
    init();
  }, [loadAllData]);

  const handleLoginAttempt = async (email: string, pass: string) => {
    setLoading(true);
    setLoginError(null);
    try {
      const user = await apiService.login(email, pass);
      setCurrentUser(user);
      await loadAllData();
      addToast(`Bem-vindo, ${user.name}!`);
    } catch (e: any) {
      setLoginError("Credenciais inválidas ou erro de sistema.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (userData: Partial<User> & { password?: string }) => {
    try {
      await apiService.saveUser(userData);
      await loadAllData();
      addToast(userData.id ? "Perfil atualizado!" : "Novo usuário cadastrado!");
    } catch (e: any) {
      addToast("Erro ao salvar usuário.", "error");
    }
  };

  const handleCreateOrder = async (order: ServiceOrder) => {
    try {
      await apiService.saveOrder(order);
      await loadAllData();
      addToast("Ordem de serviço gerada!");
    } catch (e) {
      addToast("Erro ao criar ordem.", "error");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await apiService.saveOrder({ id: orderId, status });
      await loadAllData();
      addToast("Status atualizado!");
    } catch (e) {
      addToast("Erro na atualização.", "error");
    }
  };

  const handleCreateReport = async (report: ServiceReport) => {
    try {
      await apiService.saveReport(report);
      await apiService.saveOrder({ id: report.orderId, status: OrderStatus.COMPLETED });
      await loadAllData();
      addToast("Relatório técnico finalizado!");
    } catch (e) {
      addToast("Erro ao salvar relatório.", "error");
    }
  };

  const handleClockAction = async (type: 'CLOCK_IN' | 'CLOCK_OUT') => {
    if (!currentUser) return;
    try {
      await apiService.saveTimeRecord({
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        type,
        timestamp: new Date().toISOString(),
        location: 'Localização GPS'
      });
      await loadAllData();
      addToast(type === 'CLOCK_IN' ? "Turno iniciado!" : "Turno encerrado.");
    } catch (e) {
      addToast("Erro ao registrar ponto.", "error");
    }
  };

  const handleReplyTicket = async (ticketId: string, message: string) => {
    try {
      // Simulação: em um app real, adicionaríamos ao array de mensagens
      addToast("Resposta enviada!");
      await loadAllData();
    } catch (e) {
      addToast("Erro ao responder.", "error");
    }
  };

  if (initialLoading) {
    return <div className="h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={48} /></div>;
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLoginAttempt} error={loginError} loading={loading} />;
  }

  return (
    <div className="font-sans antialiased text-slate-900 h-screen overflow-hidden bg-slate-50">
      <ToastContainer toasts={toasts} />
      
      {currentUser.role === 'ADMIN' && (
        <AdminView 
          orders={orders} 
          employees={users} 
          timeRecords={timeRecords} 
          tickets={tickets}
          hrRequests={[]} 
          reports={reports}
          onCreateOrder={handleCreateOrder}
          onUpdateTicketStatus={async (id, s) => { await apiService.saveTicket({id, status: s}); loadAllData(); }}
          onReplyTicket={handleReplyTicket}
          onSaveEmployee={handleSaveUser}
        />
      )}

      {currentUser.role === 'EMPLOYEE' && (
        <EmployeeView 
          currentUser={currentUser}
          orders={orders}
          timeRecords={timeRecords}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onClockAction={handleClockAction}
          onCreateReport={handleCreateReport}
        />
      )}

      {currentUser.role === 'CLIENT' && (
        <ClientView 
          currentUser={currentUser}
          tickets={tickets}
          reports={reports} 
          onCreateTicket={async (t) => { await apiService.saveTicket(t); loadAllData(); }}
        />
      )}
    </div>
  );
}

export default App;
