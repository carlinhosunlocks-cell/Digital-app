import { ServiceOrder, OrderStatus, TimeRecord, Ticket, User, TicketStatus, HRRequest, HRRequestStatus, ServiceReport } from '../types';

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
    signatureName: 'Roberto Gerente'
  }
];