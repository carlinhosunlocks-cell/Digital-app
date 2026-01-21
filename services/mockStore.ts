
import { ServiceOrder, OrderStatus, TimeRecord, Ticket, User, TicketStatus, HRRequest, HRRequestStatus, ServiceReport, AuditLog, Notification, Subscription, Invoice, InventoryItem, TechnicianStockItem } from '../types';

// Mock Data
export const MOCK_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Carlos Silva', 
    email: 'carlos@digital.com', 
    role: 'EMPLOYEE', 
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    department: 'Técnico',
    position: 'Técnico Sênior',
    salary: 4500,
    hireDate: '2022-03-15'
  },
  { 
    id: 'u2', 
    name: 'Ana Souza', 
    email: 'ana@digital.com', 
    role: 'EMPLOYEE', 
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    department: 'Técnico',
    position: 'Técnico Júnior',
    salary: 3200,
    hireDate: '2023-08-10'
  },
  { 
    id: 'admin1', 
    name: 'Roberto Admin', 
    email: 'admin@admin.com', 
    role: 'ADMIN', 
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    department: 'Gestão',
    position: 'Gerente Geral',
    salary: 8000,
    hireDate: '2020-01-01'
  },
  { 
    id: 'client1', 
    name: 'Tech Solutions Ltda', 
    email: 'cliente@tech.com', 
    role: 'CLIENT', 
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' 
  },
];

export const INITIAL_ORDERS: ServiceOrder[] = [
  {
    id: 'so1',
    title: 'Manutenção Preventiva - Servidor',
    customerName: 'Tech Solutions Ltda',
    address: 'Av. Paulista, 1000, São Paulo',
    lat: -23.561684,
    lng: -46.655981,
    description: 'Verificar temperatura e logs do servidor principal.',
    status: OrderStatus.PENDING,
    assignedToId: 'u1',
    date: new Date().toISOString().split('T')[0],
    priority: 'HIGH'
  },
  {
    id: 'so2',
    title: 'Instalação de Rede',
    customerName: 'Café do Ponto',
    address: 'Rua Augusta, 500, São Paulo',
    lat: -23.553177,
    lng: -46.657567,
    description: 'Passagem de cabos Cat6.',
    status: OrderStatus.COMPLETED,
    assignedToId: 'u1',
    date: new Date().toISOString().split('T')[0],
    priority: 'MEDIUM'
  },
  {
    id: 'so3',
    title: 'Reparo de Impressora',
    customerName: 'Escritório Contábil',
    address: 'Rua da Consolação, 1200, São Paulo',
    lat: -23.549231,
    lng: -46.649121,
    description: 'Impressora atolando papel.',
    status: OrderStatus.PENDING,
    assignedToId: 'u2',
    date: new Date().toISOString().split('T')[0],
    priority: 'LOW'
  }
];

export const INITIAL_TIME_RECORDS: TimeRecord[] = [
  { id: 'tr1', employeeId: 'u1', employeeName: 'Carlos Silva', type: 'CLOCK_IN', timestamp: new Date(new Date().setHours(8, 0, 0)).toISOString(), location: 'Escritório' },
  { id: 'tr2', employeeId: 'u2', employeeName: 'Ana Souza', type: 'CLOCK_IN', timestamp: new Date(new Date().setHours(8, 15, 0)).toISOString(), location: 'Escritório' },
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 't1',
    clientId: 'client1',
    clientName: 'Tech Solutions Ltda',
    subject: 'Internet Lenta',
    description: 'A conexão está caindo constantemente.',
    status: TicketStatus.OPEN,
    createdAt: new Date().toISOString(),
    messages: []
  }
];

export const INITIAL_HR_REQUESTS: HRRequest[] = [
  {
    id: 'hr1',
    employeeId: 'u1',
    employeeName: 'Carlos Silva',
    type: 'VACATION',
    startDate: '2023-12-20',
    endDate: '2024-01-05',
    reason: 'Férias anuais programadas.',
    status: HRRequestStatus.PENDING
  },
  {
    id: 'hr2',
    employeeId: 'u2',
    employeeName: 'Ana Souza',
    type: 'SICK_LEAVE',
    startDate: '2023-11-10',
    endDate: '2023-11-12',
    reason: 'Consulta médica e repouso.',
    status: HRRequestStatus.APPROVED
  }
];

export const INITIAL_REPORTS: ServiceReport[] = [
  {
    id: 'rep1',
    orderId: 'so2',
    clientName: 'Café do Ponto',
    technicianName: 'Carlos Silva',
    date: '2023-10-15',
    startTime: '14:00',
    endTime: '16:00',
    address: 'Rua Augusta, 500, São Paulo',
    services: {
      gate: false,
      cctv: true,
      intercom: false,
      lock: false,
      preventive: true
    },
    comments: 'Instalação de rede concluída. Cabos testados e certificados. Câmeras verificadas.',
    photos: [
      'https://images.unsplash.com/photo-1558494949-ef526b0042a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
    ],
    signatureName: 'Roberto Gerente',
    partsUsed: [
      { itemId: 'iv1', itemName: 'Cabo de Rede CAT6', quantity: 30 }
    ]
  }
];

// SAAS INITIAL DATA

export const INITIAL_INVENTORY: InventoryItem[] = [
    { id: 'iv1', name: 'Cabo de Rede CAT6', sku: 'CAB-001', category: 'Cabeamento', quantity: 150, minQuantity: 50, price: 2.50, unit: 'metros', lastUpdated: new Date().toISOString() },
    { id: 'iv2', name: 'Roteador Wi-Fi 6', sku: 'NET-002', category: 'Equipamentos', quantity: 12, minQuantity: 5, price: 350.00, unit: 'un', lastUpdated: new Date().toISOString() },
    { id: 'iv3', name: 'Conector RJ45', sku: 'CON-003', category: 'Acessórios', quantity: 500, minQuantity: 100, price: 0.50, unit: 'un', lastUpdated: new Date().toISOString() },
    { id: 'iv4', name: 'Câmera IP 1080p', sku: 'SEC-004', category: 'Segurança', quantity: 8, minQuantity: 10, price: 180.00, unit: 'un', lastUpdated: new Date().toISOString() },
];

export const INITIAL_TECH_STOCK: TechnicianStockItem[] = [
    { id: 'ts1', technicianId: 'u1', itemId: 'iv1', itemName: 'Cabo de Rede CAT6', quantity: 20, lastUpdated: new Date().toISOString() },
    { id: 'ts2', technicianId: 'u1', itemId: 'iv3', itemName: 'Conector RJ45', quantity: 50, lastUpdated: new Date().toISOString() },
    { id: 'ts3', technicianId: 'u2', itemId: 'iv2', itemName: 'Roteador Wi-Fi 6', quantity: 1, lastUpdated: new Date().toISOString() },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'al1', action: 'SYSTEM_INIT', actorName: 'System', details: 'Plataforma inicializada com sucesso', timestamp: new Date(Date.now() - 10000000).toISOString(), severity: 'INFO' },
  { id: 'al2', action: 'USER_LOGIN', actorName: 'Roberto Admin', details: 'Login efetuado via IP 192.168.1.1', timestamp: new Date(Date.now() - 3600000).toISOString(), severity: 'INFO' },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Pagamento Confirmado', message: 'A fatura de Outubro foi processada.', type: 'success', read: false, timestamp: new Date().toISOString() },
  { id: 'n2', title: 'Alerta de Estoque', message: 'Câmera IP 1080p está abaixo do mínimo.', type: 'warning', read: false, timestamp: new Date(Date.now() - 86400000).toISOString() },
];

export const INITIAL_SUBSCRIPTION: Subscription = {
  plan: 'PROFESSIONAL',
  status: 'ACTIVE',
  nextBillingDate: new Date(Date.now() + 2592000000).toISOString(), // +30 days
  usersLimit: 10,
  storageLimitGB: 50,
  currentUsers: 4,
  currentStorageGB: 12.5
};

export const INITIAL_INVOICES: Invoice[] = [
  { id: 'inv-001', date: '2023-10-01', amount: 299.90, status: 'PAID', pdfUrl: '#' },
  { id: 'inv-002', date: '2023-11-01', amount: 299.90, status: 'PAID', pdfUrl: '#' },
  { id: 'inv-003', date: '2023-12-01', amount: 299.90, status: 'PENDING', pdfUrl: '#' },
];
