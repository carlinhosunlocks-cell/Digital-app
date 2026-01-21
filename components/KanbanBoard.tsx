
import React from 'react';
import { ServiceOrder, OrderStatus } from '../types';
import { MapPin, User, Clock, MoreHorizontal } from 'lucide-react';

interface KanbanBoardProps {
  orders: ServiceOrder[];
  onStatusChange: (id: string, newStatus: OrderStatus) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ orders, onStatusChange }) => {
  const columns = [
    { id: OrderStatus.PENDING, title: 'A Fazer', color: 'bg-slate-100 border-slate-200' },
    { id: OrderStatus.IN_PROGRESS, title: 'Em Execução', color: 'bg-blue-50 border-blue-100' },
    { id: OrderStatus.COMPLETED, title: 'Concluído', color: 'bg-green-50 border-green-100' },
    { id: OrderStatus.CANCELED, title: 'Cancelado', color: 'bg-red-50 border-red-100' },
  ];

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 h-full min-w-full">
      {columns.map(col => {
        const colOrders = orders.filter(o => o.status === col.id);
        return (
          <div key={col.id} className={`flex-1 min-w-[300px] rounded-2xl p-4 border ${col.color} flex flex-col h-full`}>
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-700">{col.title}</h3>
               <span className="bg-white/50 px-2 py-1 rounded-md text-xs font-bold text-slate-500">{colOrders.length}</span>
            </div>
            
            <div className="space-y-3 overflow-y-auto pr-2 no-scrollbar flex-1">
              {colOrders.map(order => (
                <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition group relative">
                   <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                        order.priority === 'HIGH' ? 'bg-red-100 text-red-600' : 
                        order.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                      }`}>{order.priority || 'NORMAL'}</span>
                      <button className="text-slate-300 hover:text-slate-600"><MoreHorizontal size={16}/></button>
                   </div>
                   <h4 className="font-bold text-slate-800 text-sm mb-1">{order.title}</h4>
                   <p className="text-xs text-slate-500 mb-3 truncate">{order.customerName}</p>
                   
                   <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-3">
                      <MapPin size={12}/> <span className="truncate">{order.address}</span>
                   </div>

                   <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                      <div className="flex -space-x-2">
                         <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                            <User size={12}/>
                         </div>
                      </div>
                      <select 
                        value={order.status}
                        onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                        className="text-[10px] bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none cursor-pointer hover:bg-slate-100"
                      >
                         <option value={OrderStatus.PENDING}>Pendente</option>
                         <option value={OrderStatus.IN_PROGRESS}>Em Rota</option>
                         <option value={OrderStatus.COMPLETED}>Concluído</option>
                         <option value={OrderStatus.CANCELED}>Cancelado</option>
                      </select>
                   </div>
                </div>
              ))}
              {colOrders.length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-300/50 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                   Vazio
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
