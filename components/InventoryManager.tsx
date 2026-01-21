
import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { Package, Search, AlertTriangle, Plus, Filter, Edit2, Trash2, TrendingDown } from 'lucide-react';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onSaveItem: (item: Partial<InventoryItem>) => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ inventory, onSaveItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem>>({});

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem({});
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveItem(editingItem);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
       <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 flex-1">
             <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                   type="text" 
                   placeholder="Buscar por nome, SKU..." 
                   className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 w-64 transition"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="flex gap-2">
                <button className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-50 rounded-lg hover:bg-slate-100 border border-slate-200 flex items-center gap-1">
                    <Filter size={14}/> Filtros
                </button>
             </div>
          </div>
          <button onClick={handleAddNew} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-black transition shadow-lg">
             <Plus size={16}/> Novo Item
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between">
             <div>
                <p className="text-xs font-bold text-blue-400 uppercase">Valor Total em Estoque</p>
                <p className="text-2xl font-black text-blue-700">R$ {inventory.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</p>
             </div>
             <Package className="text-blue-300" size={32}/>
          </div>
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center justify-between">
             <div>
                <p className="text-xs font-bold text-amber-400 uppercase">Itens Críticos</p>
                <p className="text-2xl font-black text-amber-700">{inventory.filter(i => i.quantity <= i.minQuantity).length}</p>
             </div>
             <AlertTriangle className="text-amber-300" size={32}/>
          </div>
       </div>

       <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm relative">
          <div className="absolute inset-0 overflow-auto no-scrollbar">
            <table className="w-full text-left">
               <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-widest sticky top-0 z-10">
                  <tr>
                     <th className="px-6 py-4">SKU / Item</th>
                     <th className="px-6 py-4">Categoria</th>
                     <th className="px-6 py-4 text-center">Qtd. Atual</th>
                     <th className="px-6 py-4 text-center">Status</th>
                     <th className="px-6 py-4 text-right">Valor Unit.</th>
                     <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredInventory.map(item => (
                     <tr key={item.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                           <p className="font-bold text-slate-800">{item.name}</p>
                           <p className="text-[10px] font-mono text-slate-400">{item.sku}</p>
                        </td>
                        <td className="px-6 py-4">
                           <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">{item.category}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">
                           {item.quantity} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                           {item.quantity <= item.minQuantity ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-bold uppercase">
                                 <TrendingDown size={10}/> Baixo Estoque
                              </span>
                           ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-bold uppercase">
                                 Normal
                              </span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-600">
                           R$ {item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 size={16}/></button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
          </div>
       </div>

       {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
             <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
                <h3 className="text-xl font-bold mb-6 text-slate-800">{editingItem.id ? 'Editar Item' : 'Novo Item no Estoque'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Nome do Item</label>
                        <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">SKU</label>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500" value={editingItem.sku || ''} onChange={e => setEditingItem({...editingItem, sku: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Categoria</label>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500" value={editingItem.category || ''} onChange={e => setEditingItem({...editingItem, category: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Preço (R$)</label>
                        <input type="number" step="0.01" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500" value={editingItem.price || ''} onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Unidade</label>
                        <input className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500" value={editingItem.unit || ''} onChange={e => setEditingItem({...editingItem, unit: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Quantidade Atual</label>
                        <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500" value={editingItem.quantity || ''} onChange={e => setEditingItem({...editingItem, quantity: parseInt(e.target.value)})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Mínimo (Alerta)</label>
                        <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500" value={editingItem.minQuantity || ''} onChange={e => setEditingItem({...editingItem, minQuantity: parseInt(e.target.value)})} />
                      </div>
                   </div>
                   <div className="flex gap-2 mt-6">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
                      <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">Salvar Item</button>
                   </div>
                </form>
             </div>
          </div>
       )}
    </div>
  );
};

export default InventoryManager;
