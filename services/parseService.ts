
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
  signInWithPopup
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
  TechnicianStockItem 
} from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
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
      throw new Error("Falha na autenticação com o Google.");
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
      if (orderData.id) {
        const orderRef = doc(db, 'orders', orderData.id);
        const data = { ...orderData };
        delete data.id;
        await updateDoc(orderRef, data);
        return { ...orderData } as ServiceOrder;
      } else {
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        return { id: docRef.id, ...orderData } as ServiceOrder;
      }
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
      if (ticketData.id) {
        const ticketRef = doc(db, 'tickets', ticketData.id);
        const data = { ...ticketData };
        delete data.id;
        await updateDoc(ticketRef, data);
        return { ...ticketData } as Ticket;
      } else {
        const docRef = await addDoc(collection(db, 'tickets'), {
          ...ticketData,
          createdAt: new Date().toISOString(),
          status: TicketStatus.OPEN,
          messages: []
        });
        return { id: docRef.id, ...ticketData } as Ticket;
      }
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
      return { id: docRef.id, ...recordData } as TimeRecord;
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
      if (itemData.id) {
        const itemRef = doc(db, 'inventory', itemData.id);
        const data = { ...itemData, lastUpdated: new Date().toISOString() };
        delete data.id;
        await updateDoc(itemRef, data);
        return { ...itemData } as InventoryItem;
      } else {
        const docRef = await addDoc(collection(db, 'inventory'), {
          ...itemData,
          lastUpdated: new Date().toISOString()
        });
        return { id: docRef.id, ...itemData } as InventoryItem;
      }
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
  subscribeToOrders(callback: (orders: ServiceOrder[]) => void) {
    const q = query(collection(db, 'orders'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceOrder)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));
  },

  subscribeToTickets(callback: (tickets: Ticket[]) => void) {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'tickets'));
  },

  subscribeToUsers(callback: (users: User[]) => void) {
    const q = query(collection(db, 'users'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
  },

  subscribeToReports(callback: (reports: ServiceReport[]) => void) {
    const q = query(collection(db, 'reports'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceReport)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'reports'));
  },

  subscribeToTimeRecords(callback: (records: TimeRecord[]) => void) {
    const q = query(collection(db, 'timeRecords'), orderBy('timestamp', 'desc'));
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

  subscribeToNotifications(callback: (notifications: Notification[]) => void) {
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));
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
