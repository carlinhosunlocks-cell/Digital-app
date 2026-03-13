import React, { useState, useEffect, useCallback } from 'react';
import { 
  LogOut, 
  Lock, 
  Mail, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { auth } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { apiService } from './services/parseService';
import { User, ServiceOrder, Ticket, TimeRecord, ServiceReport, OrderStatus, TicketStatus } from './types';
import { AdminView } from './views/AdminView';
import { EmployeeView } from './views/EmployeeView';
import { ClientView } from './views/ClientView';

// --- Error Boundary Component ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = `Erro de Permissão: ${parsed.operationType} em ${parsed.path}`;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-red-100 max-w-md w-full text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Ops! Algo deu errado</h2>
            <p className="text-slate-600 mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Toast Component ---
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right duration-300 ${
      type === 'success' ? 'bg-white border-green-100 text-green-800' : 'bg-white border-red-100 text-red-800'
    }`}>
      {type === 'success' ? <CheckCircle2 className="text-green-500" size={20} /> : <AlertCircle className="text-red-500" size={20} />}
      <p className="text-sm font-bold">{message}</p>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);

  // Data States
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [reports, setReports] = useState<ServiceReport[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userData = await apiService.getCurrentUser(firebaseUser.uid);
          if (userData) {
            setCurrentUser(userData);
          } else {
            await auth.signOut();
            setCurrentUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setInitialLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Subscriptions
  useEffect(() => {
    if (!currentUser) return;

    const unsubOrders = apiService.subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders);
    });

    const unsubTickets = apiService.subscribeToTickets((updatedTickets) => {
      setTickets(updatedTickets);
    });

    return () => {
      unsubOrders();
      unsubTickets();
    };
  }, [currentUser]);

  // Load Static Data
  const loadAllData = useCallback(async () => {
    if (!currentUser) return;
    setDataLoading(true);
    try {
      const [usersData, reportsData, timeData] = await Promise.all([
        apiService.getUsers(),
        apiService.getReports(),
        apiService.getTimeRecords()
      ]);
      setEmployees(usersData);
      setReports(reportsData);
      setTimeRecords(timeData);
    } catch (error) {
      console.error("Error loading data:", error);
      addToast("Erro ao carregar dados do servidor", "error");
    } finally {
      setDataLoading(false);
    }
  }, [currentUser, addToast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (e.target as any).email.value;
    const password = (e.target as any).password.value;
    
    try {
      setInitialLoading(true);
      await apiService.login(email, password);
      addToast("Bem-vindo de volta!");
    } catch (error: any) {
      addToast(error.message || "Falha no login", "error");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      setCurrentUser(null);
      addToast("Sessão encerrada");
    } catch (error) {
      addToast("Erro ao sair", "error");
    }
  };

  const handleCreateOrder = async (order: ServiceOrder) => {
    try {
      await apiService.saveOrder(order);
      addToast("Ordem de serviço criada!");
    } catch (error) {
      addToast("Erro ao criar OS", "error");
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      await apiService.updateTicketStatus(ticketId, status);
      addToast("Status do ticket atualizado");
    } catch (error) {
      addToast("Erro ao atualizar ticket", "error");
    }
  };

  const handleReplyTicket = async (ticketId: string, message: string) => {
    try {
      await apiService.replyToTicket(ticketId, message);
      addToast("Resposta enviada");
    } catch (error) {
      addToast("Erro ao enviar resposta", "error");
    }
  };

  const handleSaveEmployee = async (user: Partial<User> & { password?: string }) => {
    try {
      await apiService.saveUser(user);
      await loadAllData();
      addToast("Usuário salvo com sucesso");
    } catch (error) {
      addToast("Erro ao salvar usuário", "error");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await apiService.saveOrder({ id: orderId, status });
      addToast("Status da OS atualizado");
    } catch (error) {
      addToast("Erro ao atualizar OS", "error");
    }
  };

  const handleClockAction = async (type: 'CLOCK_IN' | 'CLOCK_OUT') => {
    try {
      await apiService.saveTimeRecord({
        employeeId: currentUser?.id || '',
        type,
        timestamp: new Date().toISOString(),
        location: 'Localização via GPS'
      });
      await loadAllData();
      addToast(type === 'CLOCK_IN' ? "Entrada registrada" : "Saída registrada");
    } catch (error) {
      addToast("Erro ao registrar ponto", "error");
    }
  };

  const handleCreateReport = async (report: ServiceReport) => {
    try {
      await apiService.saveReport(report);
      await loadAllData();
      addToast("Relatório técnico enviado!");
    } catch (error) {
      addToast("Erro ao enviar relatório", "error");
    }
  };

  const handleCreateTicket = async (ticket: Omit<Ticket, 'id' | 'createdAt' | 'messages'>) => {
    try {
      await apiService.saveTicket(ticket as any);
      addToast("Ticket aberto com sucesso!");
    } catch (error) {
      addToast("Erro ao abrir ticket", "error");
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Digital Equipamentos</p>
        <p className="text-[10px] text-slate-600 mt-2">Carregando plataforma segura...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-blue-200 mb-6">D</div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Digital Equipamentos</h1>
            <p className="text-slate-400 font-medium mt-2">Acesse sua conta corporativa</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  name="email"
                  type="email" 
                  required 
                  className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl outline-none focus:border-blue-500 transition font-medium"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  name="password"
                  type="password" 
                  required 
                  className="w-full bg-slate-50 border border-slate-100 p-4 pl-12 rounded-2xl outline-none focus:border-blue-500 transition font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[0.99] transition-all flex justify-center items-center gap-2 uppercase text-xs tracking-widest"
            >
              Entrar no Sistema
            </button>
          </form>

          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <p className="text-[10px] text-slate-400 font-bold uppercase text-center mb-2">Acesso Rápido (Demo - Senha: 123456)</p>
             <div className="flex justify-center gap-4 text-[10px] font-black text-blue-600">
                <span>admin@admin.com</span>
                <span>tech@tech.com</span>
                <span>cliente@cliente.com</span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen">
        {currentUser.role === 'ADMIN' && (
          <AdminView 
            orders={orders}
            employees={employees}
            timeRecords={timeRecords}
            tickets={tickets}
            hrRequests={[]}
            reports={reports}
            onCreateOrder={handleCreateOrder}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onReplyTicket={handleReplyTicket}
            onSaveEmployee={handleSaveEmployee}
            onRefresh={loadAllData}
            addToast={addToast}
          />
        )}

        {currentUser.role === 'EMPLOYEE' && (
          <EmployeeView 
            currentUser={currentUser}
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onClockAction={handleClockAction}
            timeRecords={timeRecords}
            onCreateReport={handleCreateReport}
          />
        )}

        {currentUser.role === 'CLIENT' && (
          <ClientView 
            currentUser={currentUser}
            tickets={tickets}
            reports={reports}
            onCreateTicket={handleCreateTicket}
          />
        )}

        {/* Global Logout Button */}
        <button 
          onClick={handleLogout}
          className="fixed top-6 right-6 z-[60] p-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition shadow-sm"
          title="Sair"
        >
          <LogOut size={20} />
        </button>

        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            message={toast.message} 
            type={toast.type} 
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </div>
    </ErrorBoundary>
  );
};

export default App;
