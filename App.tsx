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
import { User, ServiceOrder, Ticket, TimeRecord, ServiceReport, OrderStatus, TicketStatus, Notification, HRRequest } from './types';
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
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);

  // Data States
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [hrRequests, setHrRequests] = useState<HRRequest[]>([]);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
    // Test connection on boot
    apiService.testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userData = await apiService.getCurrentUser(firebaseUser.uid);
          if (userData) {
            setCurrentUser(userData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
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

    const unsubOrders = apiService.subscribeToOrders(currentUser.role, currentUser.id, (updatedOrders) => {
      setOrders(updatedOrders);
    });

    const unsubTickets = apiService.subscribeToTickets(currentUser.role, currentUser.id, (updatedTickets) => {
      setTickets(updatedTickets);
    });

    const unsubUsers = apiService.subscribeToUsers(currentUser.role, (updatedUsers) => {
      setEmployees(updatedUsers);
    });

    const unsubReports = apiService.subscribeToReports(currentUser.role, currentUser.id, (updatedReports) => {
      setReports(updatedReports);
    });

    const unsubTimeRecords = apiService.subscribeToTimeRecords(currentUser.role, currentUser.id, (updatedRecords) => {
      setTimeRecords(updatedRecords);
    });

    const unsubNotifications = apiService.subscribeToNotifications(currentUser.id, (updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    const unsubHR = apiService.subscribeToHRRequests(currentUser.role, currentUser.id, (updatedRequests) => {
      setHrRequests(updatedRequests);
    });

    return () => {
      unsubOrders();
      unsubTickets();
      unsubUsers();
      unsubReports();
      unsubTimeRecords();
      unsubNotifications();
      unsubHR();
    };
  }, [currentUser]);

  // Handlers
  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      const user = await apiService.loginWithGoogle();
      setCurrentUser(user);
      addToast("Bem-vindo de volta!");
    } catch (error: any) {
      addToast(error.message || "Falha no login com Google", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast("Preencha todos os campos", "error");
      return;
    }

    try {
      setAuthLoading(true);
      let user;
      try {
        user = await apiService.loginWithEmail(email, password);
      } catch (loginError: any) {
        // Auto-register admin if it's the first time
        if (email === 'admin@admin.com' && password === 'admin') {
          try {
            user = await apiService.registerWithEmail({
              email: 'admin@admin.com',
              password: 'admin',
              name: 'Administrador Master',
              role: 'ADMIN'
            });
          } catch (regError) {
            throw loginError; // If registration also fails, throw original login error
          }
        } else {
          throw loginError;
        }
      }
      
      setCurrentUser(user);
      addToast("Bem-vindo de volta!");
    } catch (error: any) {
      addToast(error.message || "Falha no login", "error");
    } finally {
      setAuthLoading(false);
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
      if (!user.id && user.password) {
        // New user with password -> Register in Auth
        await apiService.registerWithEmail(user);
      } else {
        // Existing user or user without password (e.g. Google) -> Just update profile
        await apiService.saveUser(user);
      }
      addToast("Usuário salvo com sucesso");
    } catch (error: any) {
      addToast(error.message || "Erro ao salvar usuário", "error");
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
      addToast(type === 'CLOCK_IN' ? "Entrada registrada" : "Saída registrada");
    } catch (error) {
      addToast("Erro ao registrar ponto", "error");
    }
  };

  const handleCreateReport = async (report: ServiceReport) => {
    try {
      await apiService.saveReport(report);
      addToast("Relatório técnico enviado!");
    } catch (error) {
      addToast("Erro ao enviar relatório", "error");
    }
  };

  const handleCreateHRRequest = async (request: Partial<HRRequest>) => {
    try {
      await apiService.saveHRRequest(request);
      addToast("Solicitação de RH enviada!");
    } catch (error) {
      addToast("Erro ao enviar solicitação", "error");
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

          {!showEmailLogin ? (
            <div className="space-y-4">
              <button
                onClick={() => setShowEmailLogin(true)}
                className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[0.99] transition-all flex justify-center items-center gap-3 uppercase text-xs tracking-widest"
              >
                <Mail size={18} />
                Entrar com E-mail
              </button>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-slate-100"></div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ou</span>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="w-full py-5 bg-white border-2 border-slate-100 text-slate-700 font-black rounded-2xl shadow-xl shadow-slate-100 hover:bg-slate-50 hover:border-slate-200 hover:scale-[0.99] transition-all flex justify-center items-center gap-3 uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? <Loader2 className="animate-spin" size={18} /> : (
                  <>
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                  </>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@digital.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none text-slate-700 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none text-slate-700 font-medium"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-[0.99] transition-all flex justify-center items-center gap-3 uppercase text-xs tracking-widest disabled:opacity-50"
              >
                {authLoading ? <Loader2 className="animate-spin" size={18} /> : (
                  <>
                    Entrar na Plataforma
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowEmailLogin(false)}
                className="w-full py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition"
              >
                Voltar para opções
              </button>
            </form>
          )}

          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
             <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Acesso Restrito</p>
             <p className="text-xs text-slate-500">Esta é uma plataforma privada. O acesso não autorizado é monitorado.</p>
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
            hrRequests={hrRequests}
            reports={reports}
            notifications={notifications}
            currentUser={currentUser}
            onCreateOrder={handleCreateOrder}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onReplyTicket={handleReplyTicket}
            onSaveEmployee={handleSaveEmployee}
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
            notifications={notifications}
            onCreateReport={handleCreateReport}
            hrRequests={hrRequests}
            onCreateHRRequest={handleCreateHRRequest}
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
