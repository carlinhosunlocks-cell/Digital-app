
import { User, ServiceOrder, Ticket, Role, ServiceReport, TimeRecord, TicketStatus, OrderStatus, AuditLog, Notification, Subscription, Invoice, InventoryItem } from '../types';
import { MOCK_USERS, INITIAL_ORDERS, INITIAL_TICKETS, INITIAL_REPORTS, INITIAL_TIME_RECORDS, INITIAL_AUDIT_LOGS, INITIAL_NOTIFICATIONS, INITIAL_SUBSCRIPTION, INITIAL_INVOICES, INITIAL_INVENTORY } from './mockStore';

const DB_KEYS = {
  USERS: 'digital_db_users_v1',
  ORDERS: 'digital_db_orders_v1',
  TICKETS: 'digital_db_tickets_v1',
  REPORTS: 'digital_db_reports_v1',
  TIME: 'digital_db_time_v1',
  SESSION: 'digital_db_session_v1',
  // SaaS Keys
  AUDIT: 'digital_db_audit_v1',
  NOTIFS: 'digital_db_notifs_v1',
  SUB: 'digital_db_sub_v1',
  INVOICES: 'digital_db_invoices_v1',
  INVENTORY: 'digital_db_inventory_v1'
};

const delay = (ms: number = 600) => new Promise(resolve => setTimeout(resolve, ms));

const initDB = () => {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(DB_KEYS.USERS)) localStorage.setItem(DB_KEYS.USERS, JSON.stringify(MOCK_USERS));
  if (!localStorage.getItem(DB_KEYS.ORDERS)) localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
  if (!localStorage.getItem(DB_KEYS.TICKETS)) localStorage.setItem(DB_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
  if (!localStorage.getItem(DB_KEYS.REPORTS)) localStorage.setItem(DB_KEYS.REPORTS, JSON.stringify(INITIAL_REPORTS));
  if (!localStorage.getItem(DB_KEYS.TIME)) localStorage.setItem(DB_KEYS.TIME, JSON.stringify(INITIAL_TIME_RECORDS));
  
  // Init SaaS Data
  if (!localStorage.getItem(DB_KEYS.AUDIT)) localStorage.setItem(DB_KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT_LOGS));
  if (!localStorage.getItem(DB_KEYS.NOTIFS)) localStorage.setItem(DB_KEYS.NOTIFS, JSON.stringify(INITIAL_NOTIFICATIONS));
  if (!localStorage.getItem(DB_KEYS.SUB)) localStorage.setItem(DB_KEYS.SUB, JSON.stringify(INITIAL_SUBSCRIPTION));
  if (!localStorage.getItem(DB_KEYS.INVOICES)) localStorage.setItem(DB_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
  if (!localStorage.getItem(DB_KEYS.INVENTORY)) localStorage.setItem(DB_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
};

initDB();

const getCollection = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveCollection = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const createAuditLog = (action: string, details: string, severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO') => {
    const logs = getCollection<AuditLog>(DB_KEYS.AUDIT);
    const sessionStr = localStorage.getItem(DB_KEYS.SESSION);
    const actorName = sessionStr ? JSON.parse(sessionStr).name : 'Sistema';

    const newLog: AuditLog = {
        id: Date.now().toString(),
        action,
        actorName,
        details,
        severity,
        timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    saveCollection(DB_KEYS.AUDIT, logs);
};

const createNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const notifs = getCollection<Notification>(DB_KEYS.NOTIFS);
    const newNotif: Notification = {
        id: Date.now().toString(),
        title,
        message,
        type,
        read: false,
        timestamp: new Date().toISOString()
    };
    notifs.unshift(newNotif);
    saveCollection(DB_KEYS.NOTIFS, notifs);
};

export const apiService = {
  async login(email: string, pass: string): Promise<User> {
    await delay(800);
    const users = getCollection<User>(DB_KEYS.USERS);
    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
        if(email === 'admin@admin.com' && pass === '123') {
            const admin = MOCK_USERS.find(u => u.role === 'ADMIN')!;
            localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(admin));
            createAuditLog('LOGIN', `Login de Administrador: ${email}`);
            return admin;
        }
        throw new Error("Usuário não encontrado.");
    }

    localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(user));
    createAuditLog('LOGIN', `Usuário logado: ${user.name}`);
    return user;
  },

  async logout() {
    createAuditLog('LOGOUT', 'Usuário desconectado');
    await delay(200);
    localStorage.removeItem(DB_KEYS.SESSION);
  },

  async getCurrentUser(): Promise<User | null> {
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
      const index = users.findIndex(u => u.id === userData.id);
      if (index !== -1) {
        const updatedUser = { ...users[index], ...userData };
        users[index] = updatedUser;
        saveCollection(DB_KEYS.USERS, users);
        createAuditLog('UPDATE_USER', `Usuário atualizado: ${updatedUser.name}`);
        
        const currentUser = await this.getCurrentUser();
        if(currentUser && currentUser.id === updatedUser.id) {
            localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(updatedUser));
        }
        return updatedUser;
      }
      throw new Error("Usuário não encontrado.");
    } else {
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
      createAuditLog('CREATE_USER', `Novo usuário criado: ${newUser.name}`, 'WARNING');
      createNotification('Novo Usuário', `${newUser.name} foi adicionado à equipe.`, 'success');
      return newUser;
    }
  },

  async getOrders(): Promise<ServiceOrder[]> {
    await delay(400);
    const orders = getCollection<ServiceOrder>(DB_KEYS.ORDERS);
    return orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async saveOrder(orderData: Partial<ServiceOrder>): Promise<ServiceOrder> {
    await delay();
    const orders = getCollection<ServiceOrder>(DB_KEYS.ORDERS);

    if (orderData.id) {
      const index = orders.findIndex(o => o.id === orderData.id);
      if (index !== -1) {
        const oldStatus = orders[index].status;
        orders[index] = { ...orders[index], ...orderData };
        saveCollection(DB_KEYS.ORDERS, orders);
        
        if (orderData.status && orderData.status !== oldStatus) {
            createAuditLog('UPDATE_ORDER_STATUS', `OS #${orders[index].id} alterada para ${orderData.status}`);
            if (orderData.status === OrderStatus.COMPLETED) {
                createNotification('Ordem Concluída', `OS #${orders[index].id} foi finalizada.`, 'success');
            }
        } else {
            createAuditLog('UPDATE_ORDER', `OS #${orders[index].id} atualizada`);
        }
        return orders[index];
      }
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
        date: orderData.date || new Date().toISOString(),
        priority: orderData.priority || 'MEDIUM'
    };
    
    orders.unshift(newOrder);
    saveCollection(DB_KEYS.ORDERS, orders);
    createAuditLog('CREATE_ORDER', `Nova OS criada: ${newOrder.title}`);
    createNotification('Nova Demanda', `OS #${newOrder.id} criada para ${newOrder.customerName}`, 'info');
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
        if (ticketData.status === TicketStatus.RESOLVED) {
            createAuditLog('RESOLVE_TICKET', `Ticket #${tickets[index].id} resolvido`);
        }
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
    createAuditLog('CREATE_TICKET', `Novo ticket de ${newTicket.clientName}: ${newTicket.subject}`);
    createNotification('Suporte', `Novo chamado aberto por ${newTicket.clientName}`, 'warning');
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
    createAuditLog('CREATE_REPORT', `Relatório gerado para OS ${newReport.orderId}`);
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
    createAuditLog('TIME_RECORD', `${newRecord.employeeName} registrou ${newRecord.type}`);
    return newRecord;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
      await delay(300);
      return getCollection<AuditLog>(DB_KEYS.AUDIT);
  },

  async getNotifications(): Promise<Notification[]> {
      return getCollection<Notification>(DB_KEYS.NOTIFS);
  },

  async markNotificationRead(id: string): Promise<void> {
      const notifs = getCollection<Notification>(DB_KEYS.NOTIFS);
      const index = notifs.findIndex(n => n.id === id);
      if (index !== -1) {
          notifs[index].read = true;
          saveCollection(DB_KEYS.NOTIFS, notifs);
      }
  },

  async getSubscription(): Promise<Subscription> {
      await delay(400);
      const sub = localStorage.getItem(DB_KEYS.SUB);
      return sub ? JSON.parse(sub) : INITIAL_SUBSCRIPTION;
  },

  async getInvoices(): Promise<Invoice[]> {
      await delay(400);
      return getCollection<Invoice>(DB_KEYS.INVOICES);
  },

  async getInventory(): Promise<InventoryItem[]> {
      await delay(400);
      return getCollection<InventoryItem>(DB_KEYS.INVENTORY);
  },

  async saveInventoryItem(itemData: Partial<InventoryItem>): Promise<InventoryItem> {
      await delay();
      const items = getCollection<InventoryItem>(DB_KEYS.INVENTORY);
      
      if (itemData.id) {
          const index = items.findIndex(i => i.id === itemData.id);
          if (index !== -1) {
              items[index] = { ...items[index], ...itemData, lastUpdated: new Date().toISOString() };
              saveCollection(DB_KEYS.INVENTORY, items);
              createAuditLog('UPDATE_INVENTORY', `Item atualizado: ${items[index].name}`);
              return items[index];
          }
      }

      const newItem: InventoryItem = {
          id: Date.now().toString(),
          name: itemData.name || 'Novo Item',
          sku: itemData.sku || 'SKU-000',
          category: itemData.category || 'Geral',
          quantity: itemData.quantity || 0,
          minQuantity: itemData.minQuantity || 0,
          price: itemData.price || 0,
          unit: itemData.unit || 'un',
          lastUpdated: new Date().toISOString()
      };
      items.push(newItem);
      saveCollection(DB_KEYS.INVENTORY, items);
      createAuditLog('ADD_INVENTORY', `Item adicionado: ${newItem.name}`);
      return newItem;
  }
};
