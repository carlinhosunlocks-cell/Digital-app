
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { db, auth } from '../firebase';
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

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const apiService = {
  async loginWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }

      // If user doc doesn't exist but auth does
      const newUser: User = {
        id: userCredential.user.uid,
        name: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'User',
        email: userCredential.user.email || '',
        role: 'CLIENT', // Default role for Google Sign In
        status: 'active',
        avatar: userCredential.user.photoURL || undefined
      };
      await this.saveUser(newUser);
      return newUser;
    } catch (error: any) {
      console.error("Google Login Error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error("O provedor Google não está habilitado no console do Firebase.");
      }
      throw new Error("Falha na autenticação com o Google.");
    }
  },

  async loginWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }

      // Fallback for admin@admin.com if doc doesn't exist yet but auth worked
      if (email === 'admin@admin.com' || email === 'amandamartins8901@gmail.com') {
        const adminUser: User = {
          id: userCredential.user.uid,
          name: 'Administrador',
          email: email,
          role: 'ADMIN',
          status: 'active'
        };
        await this.saveUser(adminUser);
        return adminUser;
      }

      throw new Error("Usuário autenticado mas perfil não encontrado.");
    } catch (error: any) {
      console.error("Email Login Error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error("Login com Email/Senha não está habilitado no Firebase. Habilite no console.");
      }
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error("E-mail ou senha incorretos.");
      }
      throw new Error("Falha ao entrar com e-mail.");
    }
  },

  async registerWithEmail(userData: Partial<User> & { password?: string }): Promise<User> {
    try {
      if (!userData.email || !userData.password) throw new Error("Email e senha são obrigatórios");
      
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      
      const newUser: User = {
        id: userCredential.user.uid,
        name: userData.name || userData.email.split('@')[0],
        email: userData.email,
        role: userData.role || 'CLIENT',
        status: 'active',
        department: userData.department,
        position: userData.position,
        salary: userData.salary
      };

      await this.saveUser(newUser);
      return newUser;
    } catch (error: any) {
      console.error("Registration Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("Este e-mail já está em uso.");
      }
      throw new Error("Falha ao criar usuário.");
    }
  },

  async logout() {
    await signOut(auth);
  },

  async getCurrentUser(uid?: string): Promise<User | null> {
    const targetUid = uid || auth.currentUser?.uid;
    if (!targetUid) return null;
    try {
      const userDoc = await getDoc(doc(db, 'users', targetUid));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${targetUid}`);
      return null;
    }
  },

  async getUsers(): Promise<User[]> {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      return [];
    }
  },

  async saveUser(userData: Partial<User> & { password?: string }): Promise<User> {
    try {
      const id = userData.id || auth.currentUser?.uid;
      if (!id) throw new Error("User ID missing");

      const userRef = doc(db, 'users', id);
      const data = { ...userData };
      delete data.password;
      delete data.id;

      await setDoc(userRef, data, { merge: true });
      
      await this.createAuditLog({
        action: userData.id ? 'UPDATE_USER' : 'CREATE_USER',
        details: `Usuário ${userData.name || id} salvo.`,
        severity: 'INFO'
      });

      return { id, ...data } as User;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
      throw error;
    }
  },

  async getOrders(): Promise<ServiceOrder[]> {
    try {
      const q = query(collection(db, 'orders'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceOrder));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      return [];
    }
  },

  async saveOrder(orderData: Partial<ServiceOrder>): Promise<ServiceOrder> {
    try {
      let result: ServiceOrder;
      if (orderData.id) {
        const orderRef = doc(db, 'orders', orderData.id);
        const data = { ...orderData };
        delete data.id;
        await updateDoc(orderRef, data);
        result = { ...orderData } as ServiceOrder;
      } else {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        result = { id: docRef.id, ...orderData } as ServiceOrder;
      }

      await this.createAuditLog({
        action: orderData.id ? 'UPDATE_ORDER' : 'CREATE_ORDER',
        details: `OS ${result.id} - ${result.title}`,
        severity: 'INFO'
      });

      return result;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders');
      throw error;
    }
  },

  async getTickets(): Promise<Ticket[]> {
    try {
      const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'tickets');
      return [];
    }
  },

  async saveTicket(ticketData: Partial<Ticket>): Promise<Ticket> {
    try {
      let result: Ticket;
      if (ticketData.id) {
        const ticketRef = doc(db, 'tickets', ticketData.id);
        const data = { ...ticketData };
        delete data.id;
        await updateDoc(ticketRef, data);
        result = { ...ticketData } as Ticket;
      } else {
        const docRef = await addDoc(collection(db, 'tickets'), {
          ...ticketData,
          createdAt: new Date().toISOString(),
          status: TicketStatus.OPEN,
          messages: []
        });
        result = { id: docRef.id, ...ticketData } as Ticket;
      }

      await this.createAuditLog({
        action: ticketData.id ? 'UPDATE_TICKET' : 'CREATE_TICKET',
        details: `Ticket ${result.id} - ${result.subject}`,
        severity: 'INFO'
      });

      return result;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'tickets');
      throw error;
    }
  },

  async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      await updateDoc(ticketRef, { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tickets/${ticketId}`);
    }
  },

  async replyToTicket(ticketId: string, message: string): Promise<void> {
    try {
      const ticketRef = doc(db, 'tickets', ticketId);
      const ticketDoc = await getDoc(ticketRef);
      if (ticketDoc.exists()) {
        const messages = ticketDoc.data().messages || [];
        messages.push({
          id: Date.now().toString(),
          sender: 'admin',
          text: message,
          timestamp: new Date().toISOString()
        });
        await updateDoc(ticketRef, { messages, status: TicketStatus.IN_PROGRESS });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tickets/${ticketId}`);
    }
  },

  async getHRRequests(): Promise<HRRequest[]> {
    try {
      const q = query(collection(db, 'hrRequests'), orderBy('startDate', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HRRequest));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'hrRequests');
      return [];
    }
  },

  async saveHRRequest(requestData: Partial<HRRequest>): Promise<HRRequest> {
    try {
      let result: HRRequest;
      if (requestData.id) {
        const ref = doc(db, 'hrRequests', requestData.id);
        const data = { ...requestData };
        delete data.id;
        await updateDoc(ref, data);
        result = { ...requestData } as HRRequest;
      } else {
        const docRef = await addDoc(collection(db, 'hrRequests'), requestData);
        result = { id: docRef.id, ...requestData } as HRRequest;
      }

      await this.createAuditLog({
        action: requestData.id ? 'UPDATE_HR_REQUEST' : 'CREATE_HR_REQUEST',
        details: `Solicitação RH ${result.id} - ${result.type}`,
        severity: 'INFO'
      });

      return result;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'hrRequests');
      throw error;
    }
  },

  async getReports(): Promise<ServiceReport[]> {
    try {
      const snapshot = await getDocs(collection(db, 'reports'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceReport));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'reports');
      return [];
    }
  },

  async saveReport(reportData: Partial<ServiceReport>): Promise<ServiceReport> {
    try {
      const docRef = await addDoc(collection(db, 'reports'), {
        ...reportData,
        date: new Date().toISOString()
      });
      return { id: docRef.id, ...reportData } as ServiceReport;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reports');
      throw error;
    }
  },

  async getTimeRecords(): Promise<TimeRecord[]> {
    try {
      const snapshot = await getDocs(collection(db, 'timeRecords'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeRecord));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'timeRecords');
      return [];
    }
  },

  async saveTimeRecord(recordData: Partial<TimeRecord>): Promise<TimeRecord> {
    try {
      const docRef = await addDoc(collection(db, 'timeRecords'), {
        ...recordData,
        timestamp: new Date().toISOString()
      });
      const result = { id: docRef.id, ...recordData } as TimeRecord;
      
      await this.createAuditLog({
        action: 'CREATE_TIME_RECORD',
        details: `Ponto ${result.id} - ${result.type}`,
        severity: 'INFO'
      });

      return result;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'timeRecords');
      throw error;
    }
  },

  async getInventory(): Promise<InventoryItem[]> {
    try {
      const snapshot = await getDocs(collection(db, 'inventory'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'inventory');
      return [];
    }
  },

  async saveInventoryItem(itemData: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      let result: InventoryItem;
      if (itemData.id) {
        const itemRef = doc(db, 'inventory', itemData.id);
        const data = { ...itemData, lastUpdated: new Date().toISOString() };
        delete data.id;
        await updateDoc(itemRef, data);
        result = { ...itemData } as InventoryItem;
      } else {
        const docRef = await addDoc(collection(db, 'inventory'), {
          ...itemData,
          lastUpdated: new Date().toISOString()
        });
        result = { id: docRef.id, ...itemData } as InventoryItem;
      }

      await this.createAuditLog({
        action: itemData.id ? 'UPDATE_INVENTORY' : 'CREATE_INVENTORY',
        details: `Item ${result.id} - ${result.name}`,
        severity: 'INFO'
      });

      return result;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'inventory');
      throw error;
    }
  },

  async getTechnicianStock(technicianId: string): Promise<TechnicianStockItem[]> {
    try {
      const q = query(collection(db, 'technicianStock'), where('technicianId', '==', technicianId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TechnicianStockItem));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'technicianStock');
      return [];
    }
  },

  async transferStockToTechnician(itemId: string, technicianId: string, quantity: number): Promise<void> {
    try {
      // 1. Update main inventory
      const itemRef = doc(db, 'inventory', itemId);
      const itemDoc = await getDoc(itemRef);
      if (!itemDoc.exists()) throw new Error("Item not found");
      
      const currentQty = itemDoc.data().quantity || 0;
      if (currentQty < quantity) throw new Error("Insufficient stock");
      
      await updateDoc(itemRef, { quantity: currentQty - quantity });

      // 2. Update technician stock
      const q = query(collection(db, 'technicianStock'), where('technicianId', '==', technicianId), where('itemId', '==', itemId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const stockDoc = snapshot.docs[0];
        await updateDoc(doc(db, 'technicianStock', stockDoc.id), {
          quantity: stockDoc.data().quantity + quantity,
          lastUpdated: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'technicianStock'), {
          technicianId,
          itemId,
          itemName: itemDoc.data().name,
          quantity,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'technicianStock');
    }
  },

  async createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp' | 'actorName'>): Promise<void> {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        ...log,
        actorName: auth.currentUser?.displayName || auth.currentUser?.email || 'System',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
    }
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'auditLogs');
      return [];
    }
  },

  async getNotifications(): Promise<Notification[]> {
    try {
      const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
      return [];
    }
  },

  async markNotificationRead(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  },

  async getSubscription(): Promise<Subscription | null> {
    try {
      const snapshot = await getDocs(collection(db, 'subscription'));
      if (!snapshot.empty) {
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
      }
      return {
        plan: 'PROFESSIONAL',
        status: 'ACTIVE',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usersLimit: 50,
        storageLimitGB: 100,
        currentUsers: 12,
        currentStorageGB: 45
      } as Subscription;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'subscription');
      return null;
    }
  },

  async getInvoices(): Promise<Invoice[]> {
    try {
      const snapshot = await getDocs(collection(db, 'invoices'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'invoices');
      return [];
    }
  },

  // Real-time listeners
  subscribeToOrders(role: Role, userId: string, callback: (orders: ServiceOrder[]) => void) {
    let q;
    if (role === 'ADMIN') {
      q = query(collection(db, 'orders'), orderBy('date', 'desc'));
    } else if (role === 'EMPLOYEE') {
      q = query(collection(db, 'orders'), where('assignedToId', '==', userId), orderBy('date', 'desc'));
    } else {
      q = query(collection(db, 'orders'), where('clientId', '==', userId), orderBy('date', 'desc'));
    }
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceOrder)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));
  },

  subscribeToTickets(role: Role, userId: string, callback: (tickets: Ticket[]) => void) {
    let q;
    if (role === 'ADMIN') {
      q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'tickets'), where('clientId', '==', userId), orderBy('createdAt', 'desc'));
    }
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tickets'));
  },

  subscribeToUsers(role: Role, callback: (users: User[]) => void) {
    // Only admins can see all users, but employees might need to see others for assignment?
    // Actually, rules say: allow read: if isAdmin() || (isAuthenticated() && resource.id == request.auth.uid);
    // So employees can't list all users.
    if (role !== 'ADMIN') return () => {}; 
    
    const q = query(collection(db, 'users'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
  },

  subscribeToReports(role: Role, userId: string, callback: (reports: ServiceReport[]) => void) {
    let q;
    if (role === 'ADMIN') {
      q = query(collection(db, 'reports'), orderBy('date', 'desc'));
    } else if (role === 'EMPLOYEE') {
      q = query(collection(db, 'reports'), where('technicianId', '==', userId), orderBy('date', 'desc'));
    } else {
      q = query(collection(db, 'reports'), where('clientId', '==', userId), orderBy('date', 'desc'));
    }
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceReport)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'reports'));
  },

  subscribeToTimeRecords(role: Role, userId: string, callback: (records: TimeRecord[]) => void) {
    let q;
    if (role === 'ADMIN') {
      q = query(collection(db, 'timeRecords'), orderBy('timestamp', 'desc'));
    } else {
      q = query(collection(db, 'timeRecords'), where('employeeId', '==', userId), orderBy('timestamp', 'desc'));
    }
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeRecord)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'timeRecords'));
  },

  subscribeToInventory(callback: (items: InventoryItem[]) => void) {
    const q = query(collection(db, 'inventory'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'inventory'));
  },

  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));
  },

  subscribeToHRRequests(role: Role, userId: string, callback: (requests: HRRequest[]) => void) {
    let q;
    if (role === 'ADMIN') {
      q = query(collection(db, 'hrRequests'), orderBy('startDate', 'desc'));
    } else {
      q = query(collection(db, 'hrRequests'), where('employeeId', '==', userId), orderBy('startDate', 'desc'));
    }
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HRRequest)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'hrRequests'));
  },

  async testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if(error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    }
  }
};
