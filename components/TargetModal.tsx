import React, { useState, useEffect } from 'react';
// FIX: Use v8-compatible firestore methods by removing v9 modular imports.
// import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Target } from '../types';

interface TargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetToEdit: Target | null;
}

const TargetModal: React.FC<TargetModalProps> = ({ isOpen, onClose, targetToEdit }) => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [target, setTarget] = useState(0);
  const [hadiah, setHadiah] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = targetToEdit !== null;

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setMonth(targetToEdit.month);
            setYear(targetToEdit.year);
            setTarget(targetToEdit.target);
            setHadiah(targetToEdit.hadiah || '');
        } else {
            // Reset form for new entry
            setMonth(new Date().getMonth() + 1);
            setYear(new Date().getFullYear());
            setTarget(0);
            setHadiah('');
        }
        setError(null);
    }
  }, [isOpen, targetToEdit, isEditing]);

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
    setTarget(isNaN(numericValue) ? 0 : numericValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (target <= 0 || year < 2020) {
      setError('Semua field harus diisi dengan benar. Target harus lebih besar dari 0.');
      return;
    }

    setIsLoading(true);

    const targetData = {
        month,
        year,
        target,
        hadiah,
    };

    try {
      // FIX: Use v8-compatible syntax for document writes.
      if (isEditing) {
        const targetRef = db.collection('TARGET BULANAN').doc(targetToEdit.id);
        await targetRef.update(targetData);
      } else {
        await db.collection('TARGET BULANAN').add(targetData);
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;
  
  const months = Array.from({length: 12}, (_, i) => ({ value: i + 1, name: new Date(0, i).toLocaleString('id-ID', { month: 'long' }) }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center transition-opacity" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg p-6 m-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{isEditing ? 'Edit Target Bulanan' : 'Tambah Target Baru'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm bg-red-900/20 p-3 rounded-lg">{error}</p>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="month" className="block text-sm font-medium text-slate-300 mb-1">Bulan</label>
                <select id="month" value={month} onChange={e => setMonth(parseInt(e.target.value, 10))} required className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                   {months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="year" className="block text-sm font-medium text-slate-300 mb-1">Tahun</label>
                <input type="number" id="year" value={year} onChange={e => setYear(parseInt(e.target.value, 10))} min="2020" required className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="target" className="block text-sm font-medium text-slate-300 mb-1">Target Omset (Rp)</label>
              <input 
                type="text" 
                inputMode="numeric" 
                id="target" 
                value={target.toLocaleString('id-ID')} 
                onChange={handleTargetChange} 
                required 
                className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="hadiah" className="block text-sm font-medium text-slate-300 mb-1">Catatan Hadiah (Opsional)</label>
              <textarea
                id="hadiah"
                value={hadiah}
                onChange={e => setHadiah(e.target.value)}
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Contoh: Bonus Rp 500.000,-"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button type="button" onClick={onClose} className="bg-slate-600 text-white px-4 py-2 rounded-md mr-2 hover:bg-slate-700">Batal</button>
            <button type="submit" disabled={isLoading} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
              {isLoading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TargetModal;
