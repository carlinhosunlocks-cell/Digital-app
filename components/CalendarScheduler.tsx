
import React from 'react';
import { ServiceOrder, User } from '../types';
import { ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';

interface CalendarSchedulerProps {
  orders: ServiceOrder[];
  employees: User[];
  onDateChange: (date: Date) => void;
}

const CalendarScheduler: React.FC<CalendarSchedulerProps> = ({ orders, employees, onDateChange }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  // Generate hours 8am to 6pm
  const hours = Array.from({ length: 11 }, (_, i) => i + 8);
  const technicians = employees.filter(e => e.role === 'EMPLOYEE');

  const getOrderAtTime = (techId: string, hour: number) => {
    // Mock simulation: Assign orders randomly to slots based on hash of ID for demo consistency
    // In real app, check order.date and estimated duration
    return orders.find(o => 
       o.assignedToId === techId && 
       new Date(o.date).toDateString() === currentDate.toDateString() &&
       (parseInt(o.id.slice(-1), 16) % 11) + 8 === hour
    );
  };

  const nextDay = () => {
     const next = new Date(currentDate);
     next.setDate(currentDate.getDate() + 1);
     setCurrentDate(next);
     onDateChange(next);
  };

  const prevDay = () => {
     const prev = new Date(currentDate);
     prev.setDate(currentDate.getDate() - 1);
     setCurrentDate(prev);
     onDateChange(prev);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-full">
       <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-4">
             <h3 className="font-bold text-slate-800 text-lg">Agenda Diária</h3>
             <span className="text-slate-500 text-sm border-l border-slate-300 pl-4 capitalize">
                {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
             </span>
          </div>
          <div className="flex gap-2">
             <button onClick={prevDay} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition"><ChevronLeft size={18}/></button>
             <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Hoje</button>
             <button onClick={nextDay} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition"><ChevronRight size={18}/></button>
          </div>
       </div>

       <div className="flex-1 overflow-auto no-scrollbar">
          <div className="min-w-[800px]">
             {/* Header Techs */}
             <div className="flex border-b border-slate-200">
                <div className="w-20 shrink-0 bg-slate-50 border-r border-slate-200 p-3 text-xs font-bold text-slate-400 text-center">HORA</div>
                {technicians.map(tech => (
                   <div key={tech.id} className="flex-1 p-3 border-r border-slate-200 text-center min-w-[150px]">
                      <div className="font-bold text-slate-700 text-sm truncate">{tech.name}</div>
                      <div className="text-[10px] text-slate-400">{tech.position || 'Técnico'}</div>
                   </div>
                ))}
             </div>

             {/* Grid */}
             {hours.map(hour => (
                <div key={hour} className="flex border-b border-slate-100 h-24 hover:bg-slate-50/50 transition">
                   <div className="w-20 shrink-0 bg-slate-50/30 border-r border-slate-200 p-2 text-xs font-bold text-slate-400 text-center flex flex-col justify-center">
                      {hour}:00
                   </div>
                   {technicians.map(tech => {
                      const order = getOrderAtTime(tech.id, hour);
                      return (
                         <div key={`${tech.id}-${hour}`} className="flex-1 border-r border-slate-100 p-1 relative">
                            {order ? (
                               <div className={`w-full h-full rounded-lg p-2 text-xs border cursor-pointer hover:shadow-md transition flex flex-col justify-between ${
                                  order.status === 'Concluído' ? 'bg-green-50 border-green-200 text-green-700' :
                                  order.priority === 'HIGH' ? 'bg-red-50 border-red-200 text-red-700' :
                                  'bg-blue-50 border-blue-200 text-blue-700'
                               }`}>
                                  <span className="font-bold truncate">{order.title}</span>
                                  <span className="text-[10px] opacity-80 truncate">{order.customerName}</span>
                                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">{order.status}</span>
                               </div>
                            ) : (
                               <div className="w-full h-full hover:bg-blue-50/30 transition cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100">
                                  <PlusButton />
                               </div>
                            )}
                         </div>
                      );
                   })}
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

const PlusButton = () => (
    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
        <span className="text-lg leading-none mb-0.5">+</span>
    </div>
);

export default CalendarScheduler;
