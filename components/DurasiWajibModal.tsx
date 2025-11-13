import React, { useState, useEffect } from 'react';
// FIX: Use v8-compatible firestore methods by removing v9 modular imports.
// import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { DurasiWajib } from '../types';

interface DurasiWajibModalProps {
  isOpen: boolean;
  onClose: () => void;
  durasiWajibToEdit: DurasiWajib | null;
}

const DurasiWajibModal: React.FC<DurasiWajibModalProps> = ({ isOpen, onClose, durasiWajibToEdit }) => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [durasiHarian, setDurasiHarian] = useState(8);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = durasiWajibToEdit !== null;

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setMonth(durasiWajibToEdit.month);
            setYear(durasiWajibToEdit.year);
            setDurasiHarian(durasiWajibToEdit.durasiHarian);
        } else {
            // Reset form for new entry
            setMonth(new Date().getMonth() + 1);
            setYear(new Date().getFullYear());
            setDurasiHarian(8);
        }
        setError(null);
    }
  }, [isOpen, durasiWajibToEdit, isEditing]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (durasiHarian <= 0 || year < 2020) {
      setError('Harap isi semua field dengan benar. Durasi harus lebih besar dari 0.');
      return;
    }

    setIsLoading(true);

    const durasiData = {
        month,
        year,
        durasiHarian,
    };

    try {
      // FIX: Use v8-compatible syntax for document writes.
      if (isEditing) {
        const durasiRef = db.collection('DURASI WAJIB').doc(durasiWajibToEdit.id);
        await durasiRef.update(durasiData);
      } else {
        await db.collection('DURASI WAJIB').add(durasiData);
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
          <h2 className="text-2xl font-bold text-white">{isEditing ? 'Edit Durasi Wajib' : 'Tambah Durasi Wajib Baru'}</h2>
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
              <label htmlFor="durasiHarian" className="block text-sm font-medium text-slate-300 mb-1">Durasi Harian Wajib (Jam)</label>
              <input 
                type="number" 
                id="durasiHarian" 
                value={durasiHarian}
                onChange={e => setDurasiHarian(parseInt(e.target.value, 10))}
                min="1"
                required 
                className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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

export default DurasiWajibModal;
