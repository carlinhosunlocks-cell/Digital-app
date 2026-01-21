
import { User, ServiceOrder, Ticket, Role, ServiceReport, TimeRecord, TicketStatus, OrderStatus } from '../types';
import { MOCK_USERS, INITIAL_ORDERS, INITIAL_TICKETS, INITIAL_REPORTS, INITIAL_TIME_RECORDS } from './mockStore';

/**
 * VERCEL / LOCAL STORAGE API SERVICE
 * 
 * Este serviço substitui o backend do Parse/Back4App por uma persistência local robusta.
 * Os dados são salvos no LocalStorage do navegador, permitindo que a aplicação funcione
 * 100% na Vercel como uma aplicação estática (SPA) com persistência de dados.
 */

const DB_KEYS = {
  USERS: 'digital_db_users_v1',
  ORDERS: 'digital_db_orders_v1',
  TICKETS: 'digital_db_tickets_v1',
  REPORTS: 'digital_db_reports_v1',
  TIME: 'digital_db_time_v1',
  SESSION: 'digital_db_session_v1'
};

// Utilitário para simular latência de rede (UX Realista)
const delay = (ms: number = 600) => new Promise(resolve => setTimeout(resolve, ms));

// Inicialização do Banco de Dados Local
const initDB = () => {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(DB_KEYS.USERS)) {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(MOCK_USERS));
  }
  if (!localStorage.getItem(DB_KEYS.ORDERS)) {
    localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
  }
  if (!localStorage.getItem(DB_KEYS.TICKETS)) {
    localStorage.setItem(DB_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
  }
  if (!localStorage.getItem(DB_KEYS.REPORTS)) {
    localStorage.setItem(DB_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
  }
  if (!localStorage.getItem(DB_KEYS.TIME)) {
    localStorage.setItem(DB_KEYS.TIME, JSON.stringify(INITIAL_TIME_RECORDS));
  }
};

// Executa a inicialização
initDB();

// Helpers Genéricos de CRUD
const getCollection = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveCollection = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const apiService = {
  async login(email: string, pass: string): Promise<User> {
    await delay(800);
    const users = getCollection<User>(DB_KEYS.USERS);
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    // Senha simplificada para demo (qualquer senha funciona se o usuário existir)
    // Para admin, login hardcoded se não existir no banco
    if (!user) {
        if(email === 'admin@admin.com' && pass === '123') {
            const admin = MOCK_USERS.find(u => u.role === 'ADMIN')!;
            return admin;
        }
        throw new Error("Usuário não encontrado.");
    }

    localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(user));
    return user;
  },

  async logout() {
    await delay(200);
    localStorage.removeItem(DB_KEYS.SESSION);
  },

  async getCurrentUser(): Promise<User | null> {
    // Simula verificação de token
    const session = localStorage.getItem(DB_KEYS.SESSION);
    if (!session) return null;
    return JSON.parse(session);
  },

  async getUsers(): Promise<User[]> {
    await delay();
    return getCollection<User>(DB_KEYS.USERS);
  },

  async saveUser(userData: Partial<User> & { password?: string }): Promise<User> {
    await delay();
    const users = getCollection<User>(DB_KEYS.USERS);
    
    if (userData.id) {
      // Update
      const index = users.findIndex(u => u.id === userData.id);
      if (index !== -1) {
        const updatedUser = { ...users[index], ...userData };
        users[index] = updatedUser;
        saveCollection(DB_KEYS.USERS, users);
        
        // Atualiza sessão se for o usuário logado
        const currentUser = await this.getCurrentUser();
        if(currentUser && currentUser.id === updatedUser.id) {
            localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(updatedUser));
        }
        
        return updatedUser;
      }
      throw new Error("Usuário não encontrado para edição.");
    } else {
      // Create
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name || 'Novo Usuário',
        email: userData.email,
        role: userData.role || 'EMPLOYEE',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.name}`,
        department: userData.department,
        position: userData.position,
        salary: userData.salary,
        status: 'active',
        hireDate: new Date().toISOString().split('T')[0]
      };
      users.push(newUser);
      saveCollection(DB_KEYS.USERS, users);
      return newUser;
    }
  },

  async getOrders(): Promise<ServiceOrder[]> {
    await delay(400);
    const orders = getCollection<ServiceOrder>(DB_KEYS.ORDERS);
    // Ordenar por data (mais recente primeiro)
    return orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async saveOrder(orderData: Partial<ServiceOrder>): Promise<ServiceOrder> {
    await delay();
    const orders = getCollection<ServiceOrder>(DB_KEYS.ORDERS);

    if (orderData.id) {
      const index = orders.findIndex(o => o.id === orderData.id);
      if (index !== -1) {
        orders[index] = { ...orders[index], ...orderData };
        saveCollection(DB_KEYS.ORDERS, orders);
        return orders[index];
      }
       // Se tem ID mas não achou, cria (fallback)
    }
    
    const newOrder: ServiceOrder = {
        id: orderData.id || Date.now().toString(),
        title: orderData.title || 'Nova Ordem',
        customerName: orderData.customerName || 'Cliente',
        address: orderData.address || '',
        lat: orderData.lat || -23.5505,
        lng: orderData.lng || -46.6333,
        description: orderData.description || '',
        status: orderData.status || OrderStatus.PENDING,
        assignedToId: orderData.assignedToId || '',
        date: orderData.date || new Date().toISOString()
    };
    
    // Adiciona no início da lista
    orders.unshift(newOrder);
    saveCollection(DB_KEYS.ORDERS, orders);
    return newOrder;
  },

  async getTickets(): Promise<Ticket[]> {
    await delay();
    return getCollection<Ticket>(DB_KEYS.TICKETS).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async saveTicket(ticketData: Partial<Ticket>): Promise<Ticket> {
    await delay();
    const tickets = getCollection<Ticket>(DB_KEYS.TICKETS);

    if (ticketData.id) {
      const index = tickets.findIndex(t => t.id === ticketData.id);
      if (index !== -1) {
        tickets[index] = { ...tickets[index], ...ticketData };
        saveCollection(DB_KEYS.TICKETS, tickets);
        return tickets[index];
      }
    }

    const newTicket: Ticket = {
      id: Date.now().toString(),
      clientId: ticketData.clientId || '',
      clientName: ticketData.clientName || 'Cliente',
      subject: ticketData.subject || 'Assunto',
      description: ticketData.description || '',
      status: TicketStatus.OPEN,
      createdAt: new Date().toISOString(),
      messages: []
    };
    
    tickets.unshift(newTicket);
    saveCollection(DB_KEYS.TICKETS, tickets);
    return newTicket;
  },

  async getReports(): Promise<ServiceReport[]> {
    await delay();
    return getCollection<ServiceReport>(DB_KEYS.REPORTS);
  },

  async saveReport(reportData: Partial<ServiceReport>): Promise<ServiceReport> {
    await delay();
    const reports = getCollection<ServiceReport>(DB_KEYS.REPORTS);
    
    const newReport: ServiceReport = {
        id: Date.now().toString(),
        orderId: reportData.orderId || '',
        clientName: reportData.clientName || '',
        technicianName: reportData.technicianName || '',
        date: reportData.date || new Date().toISOString(),
        startTime: reportData.startTime || '',
        endTime: reportData.endTime || '',
        address: reportData.address || '',
        services: reportData.services || { gate: false, cctv: false, intercom: false, lock: false, preventive: false },
        comments: reportData.comments || '',
        photos: reportData.photos || [],
        signatureName: reportData.signatureName || ''
    };

    reports.push(newReport);
    saveCollection(DB_KEYS.REPORTS, reports);
    return newReport;
  },

  async getTimeRecords(): Promise<TimeRecord[]> {
    await delay();
    return getCollection<TimeRecord>(DB_KEYS.TIME);
  },

  async saveTimeRecord(recordData: Partial<TimeRecord>): Promise<TimeRecord> {
    await delay();
    const records = getCollection<TimeRecord>(DB_KEYS.TIME);
    
    const newRecord: TimeRecord = {
        id: Date.now().toString(),
        employeeId: recordData.employeeId || '',
        employeeName: recordData.employeeName || '',
        type: recordData.type || 'CLOCK_IN',
        timestamp: recordData.timestamp || new Date().toISOString(),
        location: recordData.location || 'GPS Location'
    };

    records.push(newRecord);
    saveCollection(DB_KEYS.TIME, records);
    return newRecord;
  }
};
