
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
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
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
      // Note: In a real production system, you would verify a hashed password here.
      // For this migration, we are trusting the email if it exists in the database.
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
        role: 'ADMIN',
        status: 'active'
      };
      currentUser = adminUser;
      localStorage.setItem('digital_equipamentos_user', JSON.stringify(adminUser));
      await this.saveUser(adminUser);
      return adminUser;
    }
    
    throw new Error("Usuário não encontrado ou senha incorreta.");
  },

  async registerWithEmail(userData: Partial<User> & { password?: string }): Promise<User> {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name || userData.email?.split('@')[0] || 'User',
      email: userData.email || '',
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
    await fetchApi(`/users`, {
      method: 'POST',
      body: JSON.stringify({ id, lat, lng })
    });
  },

  async saveUser(userData: Partial<User> & { password?: string }): Promise<User> {
    const data = { ...userData };
    delete data.password;
    return fetchApi('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getOrders(): Promise<ServiceOrder[]> {
    return fetchApi('/orders');
  },

  async saveOrder(orderData: Partial<ServiceOrder>): Promise<ServiceOrder> {
    return fetchApi('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  async getTickets(): Promise<Ticket[]> {
    return fetchApi('/tickets');
  },

  async saveTicket(ticketData: Partial<Ticket>): Promise<Ticket> {
    return fetchApi('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    });
  },

  async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
    await fetchApi('/tickets', {
      method: 'POST',
      body: JSON.stringify({ id: ticketId, status })
    });
  },

  async replyToTicket(ticketId: string, message: string): Promise<void> {
    // Simplified for mock
    await fetchApi('/tickets', {
      method: 'POST',
      body: JSON.stringify({ id: ticketId, message })
    });
  },

  async getHRRequests(): Promise<HRRequest[]> {
    return fetchApi('/hrRequests');
  },

  async saveHRRequest(requestData: Partial<HRRequest>): Promise<HRRequest> {
    return fetchApi('/hrRequests', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
  },

  async getReports(): Promise<ServiceReport[]> {
    return fetchApi('/reports');
  },

  async saveReport(reportData: Partial<ServiceReport>): Promise<ServiceReport> {
    return fetchApi('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  },

  async getTimeRecords(): Promise<TimeRecord[]> {
    return fetchApi('/timeRecords');
  },

  async saveTimeRecord(recordData: Partial<TimeRecord>): Promise<TimeRecord> {
    return fetchApi('/timeRecords', {
      method: 'POST',
      body: JSON.stringify(recordData)
    });
  },

  async getInventory(): Promise<InventoryItem[]> {
    return fetchApi('/inventory');
  },

  async saveInventoryItem(itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    return fetchApi('/inventory', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  },

  async getTechnicianStock(technicianId: string): Promise<TechnicianStockItem[]> {
    return fetchApi('/technicianStock');
  },

  async transferStockToTechnician(itemId: string, technicianId: string, quantity: number): Promise<void> {
    await fetchApi('/technicianStock', {
      method: 'POST',
      body: JSON.stringify({ itemId, technicianId, quantity })
    });
  },

  async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp' | 'actorName'>): Promise<void> {
    await fetchApi('/auditLogs', {
      method: 'POST',
      body: JSON.stringify(log)
    });
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    return fetchApi('/auditLogs');
  },

  async getNotifications(): Promise<Notification[]> {
    return fetchApi('/notifications');
  },

  async markNotificationRead(id: string): Promise<void> {
    await fetchApi('/notifications', {
      method: 'POST',
      body: JSON.stringify({ id, read: true })
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

  // Mock Real-time listeners (Polling or initial fetch)
  subscribeToOrders(role: Role, userId: string, callback: (orders: ServiceOrder[]) => void) {
    this.getOrders().then(callback);
    return () => {};
  },

  subscribeToTickets(role: Role, userId: string, callback: (tickets: Ticket[]) => void) {
    this.getTickets().then(callback);
    return () => {};
  },

  subscribeToUsers(role: Role, callback: (users: User[]) => void) {
    this.getUsers().then(callback);
    return () => {};
  },

  subscribeToReports(role: Role, userId: string, callback: (reports: ServiceReport[]) => void) {
    this.getReports().then(callback);
    return () => {};
  },

  subscribeToTimeRecords(role: Role, userId: string, callback: (records: TimeRecord[]) => void) {
    this.getTimeRecords().then(callback);
    return () => {};
  },

  subscribeToInventory(callback: (items: InventoryItem[]) => void) {
    this.getInventory().then(callback);
    return () => {};
  },

  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    this.getNotifications().then(callback);
    return () => {};
  },

  subscribeToHRRequests(role: Role, userId: string, callback: (requests: HRRequest[]) => void) {
    this.getHRRequests().then(callback);
    return () => {};
  },

  async testConnection() {
    console.log("AWS Backend Connection Ready");
  }
};
