export type Role = 'ADMIN' | 'EMPLOYEE' | 'CLIENT';

export enum OrderStatus {
  PENDING = 'Pendente',
  IN_PROGRESS = 'Em Rota',
  COMPLETED = 'Concluído',
  CANCELED = 'Cancelado'
}

export enum TicketStatus {
  OPEN = 'Aberto',
  IN_PROGRESS = 'Em Análise',
  RESOLVED = 'Resolvido'
}

export enum HRRequestStatus {
  PENDING = 'Pendente',
  APPROVED = 'Aprovado',
  REJECTED = 'Rejeitado'
}

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
  email?: string;
  status?: 'active' | 'idle';
  department?: string;
  position?: string;
  salary?: number;
  hireDate?: string;
}

export interface ServiceOrder {
  id: string;
  title: string;
  customerName: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  status: OrderStatus;
  assignedToId: string; // Employee ID
  date: string;
}

export interface TimeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'CLOCK_IN' | 'CLOCK_OUT';
  timestamp: string;
  location?: string;
}

export interface Ticket {
  id: string;
  clientId: string;
  clientName: string;
  subject: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'admin';
  text: string;
  timestamp: string;
}

export interface HRRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'VACATION' | 'SICK_LEAVE' | 'PERSONAL';
  startDate: string;
  endDate: string;
  reason: string;
  status: HRRequestStatus;
}

export interface ServiceReport {
  id: string;
  orderId: string;
  clientName: string;
  technicianName: string;
  date: string;
  startTime: string;
  endTime: string;
  address: string;
  services: {
    gate: boolean;
    cctv: boolean;
    intercom: boolean;
    lock: boolean;
    preventive: boolean;
  };
  comments: string;
  photos: string[]; // URLs
  signatureName: string;
}