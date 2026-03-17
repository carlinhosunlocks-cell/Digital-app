
import { 
  User, 
  ServiceOrder, 
  Ticket, 
  Role, 
  ServiceReport, 
  TimeRecord, 
  TicketStatus, 
  OrderStatus, 
  AuditLog, 
  Notification, 
  Subscription, 
  Invoice, 
  InventoryItem, 
  TechnicianStockItem,
  HRRequest
} from '../types';

// Auth State for AWS Migration with localStorage persistence
let currentUser: User | null = null;
try {
  const storedUser = localStorage.getItem('digital_equipamentos_user');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
  }
} catch (e) {
  console.error('Failed to parse stored user', e);
}

const API_URL = '/api';

async function fetchApi(endpoint: string, options?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('API Timeout: O servidor demorou muito para responder.');
    }
    throw error;
  }
}

export const apiService = {
  async loginWithGoogle(email: string, name: string): Promise<User> {
    const users = await this.getUsers();
    let user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      user = {
        id: `google-${Date.now()}`,
        name: name || 'Google User',
        email: email,
        role: 'CLIENT',
        status: 'active'
      };
      await this.saveUser(user);
    }
    
    currentUser = user;
    localStorage.setItem('digital_equipamentos_user', JSON.stringify(user));
    return user;
  },

  async loginWithEmail(email: string, password: string): Promise<User> {
    const users = await this.getUsers();
    const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
      if (user.password && user.password !== password) {
        throw new Error("Senha incorreta.");
      }
      currentUser = user;
      localStorage.setItem('digital_equipamentos_user', JSON.stringify(user));
      return user;
    }

    // Fallback for initial admin setup if database is empty
    if (email === 'admin@admin.com' || email === 'amandamartins8901@gmail.com') {
      const adminUser: User = {
        id: `admin-${Date.now()}`,
        name: 'Administrador',
        email: email,
        password: password,
        role: 'ADMIN',
        status: 'active'
      };
      currentUser = adminUser;
      localStorage.setItem('digital_equipamentos_user', JSON.stringify(adminUser));
      await this.saveUser(adminUser);
      return adminUser;
    }
    
    throw new Error("Usuário não encontrado.");
  },

  async registerWithEmail(userData: Partial<User> & { password?: string }): Promise<User> {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name || userData.email?.split('@')[0] || 'User',
      email: userData.email || '',
      password: userData.password,
      role: userData.role || 'CLIENT',
      status: 'active',
      department: userData.department,
      position: userData.position,
      salary: userData.salary
    };
    currentUser = newUser;
    localStorage.setItem('digital_equipamentos_user', JSON.stringify(newUser));
    await this.saveUser(newUser);
    return newUser;
  },

  async logout() {
    currentUser = null;
    localStorage.removeItem('digital_equipamentos_user');
  },

  async getCurrentUser(uid?: string): Promise<User | null> {
    return currentUser;
  },

  async getUsers(): Promise<User[]> {
    return fetchApi('/users');
  },

  async updateUserLocation(id: string, lat: number, lng: number): Promise<void> {
    const users = await this.getUsers();
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    const updatedUser = { ...user, lat, lng };

    await fetchApi(`/users`, {
      method: 'POST',
      body: JSON.stringify(updatedUser)
    });
  },

  async saveUser(userData: Partial<User> & { password?: string }): Promise<User> {
    let finalData = { ...userData };
    if (userData.id) {
      const users = await this.getUsers();
      const existingUser = users.find(u => u.id === userData.id);
      if (existingUser) {
        finalData = { ...existingUser, ...finalData };
      }
    }
    return fetchApi('/users', {
      method: 'POST',
      body: JSON.stringify(finalData)
    });
  },

  async getOrders(): Promise<ServiceOrder[]> {
    return fetchApi('/orders');
  },

  async saveOrder(orderData: Partial<ServiceOrder>): Promise<ServiceOrder> {
    let finalData = { ...orderData };
    if (orderData.id) {
      const orders = await this.getOrders();
      const existingOrder = orders.find(o => o.id === orderData.id);
      if (existingOrder) {
        finalData = { ...existingOrder, ...orderData };
      }
    }
    return fetchApi('/orders', {
      method: 'POST',
      body: JSON.stringify(finalData)
    });
  },

  async getTickets(): Promise<Ticket[]> {
    return fetchApi('/tickets');
  },

  async saveTicket(ticketData: Partial<Ticket>): Promise<Ticket> {
    let finalData = { ...ticketData };
    if (ticketData.id) {
      const tickets = await this.getTickets();
      const existingTicket = tickets.find(t => t.id === ticketData.id);
      if (existingTicket) {
        finalData = { ...existingTicket, ...ticketData };
      }
    } else {
      finalData.createdAt = new Date().toISOString();
      finalData.messages = [];
    }
    return fetchApi('/tickets', {
      method: 'POST',
      body: JSON.stringify(finalData)
    });
  },

  async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
    const tickets = await this.getTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error("Ticket not found");
    
    const updatedTicket = { ...ticket, status };

    await fetchApi('/tickets', {
      method: 'POST',
      body: JSON.stringify(updatedTicket)
    });
  },

  async replyToTicket(ticketId: string, message: string): Promise<void> {
    const tickets = await this.getTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error("Ticket not found");
    
    const newMessage = {
      id: Date.now().toString(),
      sender: currentUser?.name || 'Admin',
      text: message,
      timestamp: new Date().toISOString()
    };
    
    const updatedTicket = {
      ...ticket,
      messages: [...(ticket.messages || []), newMessage]
    };

    await fetchApi('/tickets', {
      method: 'POST',
      body: JSON.stringify(updatedTicket)
    });
  },

  async getHRRequests(): Promise<HRRequest[]> {
    return fetchApi('/hrRequests');
  },

  async saveHRRequest(requestData: Partial<HRRequest>): Promise<HRRequest> {
    let finalData = { ...requestData };
    if (requestData.id) {
      const requests = await this.getHRRequests();
      const existingRequest = requests.find(r => r.id === requestData.id);
      if (existingRequest) {
        finalData = { ...existingRequest, ...requestData };
      }
    }
    return fetchApi('/hrRequests', {
      method: 'POST',
      body: JSON.stringify(finalData)
    });
  },

  async getReports(): Promise<ServiceReport[]> {
    return fetchApi('/reports');
  },

  async saveReport(reportData: Partial<ServiceReport>): Promise<ServiceReport> {
    let finalData = { ...reportData };
    if (reportData.id) {
      const reports = await this.getReports();
      const existingReport = reports.find(r => r.id === reportData.id);
      if (existingReport) {
        finalData = { ...existingReport, ...reportData };
      }
    }
    return fetchApi('/reports', {
      method: 'POST',
      body: JSON.stringify(finalData)
    });
  },

  async getTimeRecords(): Promise<TimeRecord[]> {
    return fetchApi('/timeRecords');
  },

  async saveTimeRecord(recordData: Partial<TimeRecord>): Promise<TimeRecord> {
    let finalData = { ...recordData };
    if (recordData.id) {
      const records = await this.getTimeRecords();
      const existingRecord = records.find(r => r.id === recordData.id);
      if (existingRecord) {
        finalData = { ...existingRecord, ...recordData };
      }
    }
    return fetchApi('/timeRecords', {
      method: 'POST',
      body: JSON.stringify(finalData)
    });
  },

  async getInventory(): Promise<InventoryItem[]> {
    return fetchApi('/inventory');
  },

  async saveInventoryItem(itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    let finalData = { ...itemData };
    if (itemData.id) {
      const inventory = await this.getInventory();
      const existingItem = inventory.find(i => i.id === itemData.id);
      if (existingItem) {
        finalData = { ...existingItem, ...itemData };
      }
    }
    return fetchApi('/inventory', {
      method: 'POST',
      body: JSON.stringify(finalData)
    });
  },

  async getTechnicianStock(technicianId: string): Promise<TechnicianStockItem[]> {
    return fetchApi('/technicianStock');
  },

  async transferStockToTechnician(itemId: string, technicianId: string, quantity: number): Promise<void> {
    const inventory = await this.getInventory();
    const item = inventory.find(i => i.id === itemId);
    if (!item || item.quantity < quantity) throw new Error("Estoque insuficiente");

    // Update main inventory
    await this.saveInventoryItem({
      ...item,
      quantity: item.quantity - quantity
    });

    // Update technician stock
    const techStock = await fetchApi('/technicianStock');
    const existingStock = techStock.find((s: TechnicianStockItem) => s.technicianId === technicianId && s.itemId === itemId);

    if (existingStock) {
      await fetchApi('/technicianStock', {
        method: 'POST',
        body: JSON.stringify({
          ...existingStock,
          quantity: existingStock.quantity + quantity
        })
      });
    } else {
      await fetchApi('/technicianStock', {
        method: 'POST',
        body: JSON.stringify({
          id: `tech-stock-${Date.now()}`,
          technicianId,
          itemId,
          itemName: item.name,
          quantity
        })
      });
    }
  },

  async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp' | 'actorName'>): Promise<void> {
    await fetchApi('/auditLogs', {
      method: 'POST',
      body: JSON.stringify({
        ...log,
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorName: currentUser?.name || 'Sistema'
      })
    });
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    return fetchApi('/auditLogs');
  },

  async getNotifications(): Promise<Notification[]> {
    return fetchApi('/notifications');
  },

  async markNotificationRead(id: string): Promise<void> {
    const notifications = await this.getNotifications();
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;

    await fetchApi('/notifications', {
      method: 'POST',
      body: JSON.stringify({ ...notification, read: true })
    });
  },

  async getSubscription(): Promise<Subscription | null> {
    return {
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usersLimit: 50,
      storageLimitGB: 100,
      currentUsers: 12,
      currentStorageGB: 45
    } as Subscription;
  },

  async getSettings(): Promise<any> {
    const settings = await fetchApi('/settings');
    return settings.length > 0 ? settings[0] : null;
  },

  async saveSettings(settings: any): Promise<void> {
    await fetchApi('/settings', {
      method: 'POST',
      body: JSON.stringify({ ...settings, id: 'global_settings' })
    });
  },

  async getInvoices(): Promise<Invoice[]> {
    return fetchApi('/invoices');
  },

  // Real-time listeners (Polling)
  subscribeToOrders(role: Role, userId: string, callback: (orders: ServiceOrder[]) => void) {
    this.getOrders().then(callback);
    const interval = setInterval(() => this.getOrders().then(callback), 5000);
    return () => clearInterval(interval);
  },

  subscribeToTickets(role: Role, userId: string, callback: (tickets: Ticket[]) => void) {
    this.getTickets().then(callback);
    const interval = setInterval(() => this.getTickets().then(callback), 5000);
    return () => clearInterval(interval);
  },

  subscribeToUsers(role: Role, callback: (users: User[]) => void) {
    this.getUsers().then(callback);
    const interval = setInterval(() => this.getUsers().then(callback), 10000);
    return () => clearInterval(interval);
  },

  subscribeToReports(role: Role, userId: string, callback: (reports: ServiceReport[]) => void) {
    this.getReports().then(callback);
    const interval = setInterval(() => this.getReports().then(callback), 10000);
    return () => clearInterval(interval);
  },

  subscribeToTimeRecords(role: Role, userId: string, callback: (records: TimeRecord[]) => void) {
    this.getTimeRecords().then(callback);
    const interval = setInterval(() => this.getTimeRecords().then(callback), 10000);
    return () => clearInterval(interval);
  },

  subscribeToInventory(callback: (items: InventoryItem[]) => void) {
    this.getInventory().then(callback);
    const interval = setInterval(() => this.getInventory().then(callback), 10000);
    return () => clearInterval(interval);
  },

  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    this.getNotifications().then(callback);
    const interval = setInterval(() => this.getNotifications().then(callback), 5000);
    return () => clearInterval(interval);
  },

  subscribeToHRRequests(role: Role, userId: string, callback: (requests: HRRequest[]) => void) {
    this.getHRRequests().then(callback);
    const interval = setInterval(() => this.getHRRequests().then(callback), 10000);
    return () => clearInterval(interval);
  },

  async testConnection() {
    try {
      await fetchApi('/settings');
      console.log("AWS Backend Connection Ready");
    } catch (error) {
      console.error("AWS Backend Connection Failed:", error);
    }
  }
};
