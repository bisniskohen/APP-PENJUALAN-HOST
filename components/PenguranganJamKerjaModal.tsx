import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { PenguranganJamKerja, Host } from '../types';

interface PenguranganJamKerjaModalProps {
  isOpen: boolean;
  onClose: () => void;
  penguranganToEdit: PenguranganJamKerja | null;
  hosts: Host[];
}

const PenguranganJamKerjaModal: React.FC<PenguranganJamKerjaModalProps> = ({ isOpen, onClose, penguranganToEdit, hosts }) => {
  const [hostId, setHostId] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jumlahJam, setJumlahJam] = useState(1);
  const [keterangan, setKeterangan] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = penguranganToEdit !== null;

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setHostId(penguranganToEdit.hostId);
            setTanggal(new Date(penguranganToEdit.tanggal.seconds * 1000).toISOString().split('T')[0]);
            setJumlahJam(penguranganToEdit.jumlahJam);
            setKeterangan(penguranganToEdit.keterangan);
        } else {
            // Reset form for new entry
            setHostId('');
            setTanggal(new Date().toISOString().split('T')[0]);
            setJumlahJam(1);
            setKeterangan('');
        }
        setError(null);
    }
  }, [isOpen, penguranganToEdit, isEditing]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!hostId || !tanggal || jumlahJam <= 0 || !keterangan.trim()) {
      setError('Harap isi semua field dengan benar. Jumlah jam harus lebih besar dari 0.');
      return;
    }

    setIsLoading(true);

    const penguranganData = {
        hostId,
        tanggal: Timestamp.fromDate(new Date(tanggal)),
        jumlahJam,
        keterangan,
    };

    try {
      if (isEditing) {
        const penguranganRef = doc(db, 'PENGURANGAN_JAM_KERJA', penguranganToEdit.id);
        await updateDoc(penguranganRef, penguranganData);
      } else {
        await addDoc(collection(db, 'PENGURANGAN_JAM_KERJA'), penguranganData);
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center transition-opacity" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg p-6 m-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">{isEditing ? 'Edit Pengurangan Jam' : 'Tambah Pengurangan Jam Kerja'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm bg-red-900/20 p-3 rounded-lg">{error}</p>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label htmlFor="host" className="block text-sm font-medium text-slate-300 mb-1">Host</label>
              <select id="host" value={hostId} onChange={e => setHostId(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                <option value="" disabled>Pilih Host</option>
                {hosts.map(host => <option key={host.id} value={host.id}>{host.name}</option>)}
              </select>
            </div>
             <div>
                <label htmlFor="tanggal" className="block text-sm font-medium text-slate-300 mb-1">Tanggal</label>
                <input type="date" id="tanggal" value={tanggal} onChange={e => setTanggal(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
          </div>
           <div>
              <label htmlFor="jumlahJam" className="block text-sm font-medium text-slate-300 mb-1">Jumlah Pengurangan (Jam)</label>
              <input 
                type="number" 
                id="jumlahJam" 
                value={jumlahJam}
                onChange={e => setJumlahJam(parseFloat(e.target.value) || 0)}
                min="0.5"
                step="0.5"
                required 
                className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="keterangan" className="block text-sm font-medium text-slate-300 mb-1">Keterangan</label>
              <textarea
                id="keterangan"
                value={keterangan}
                onChange={e => setKeterangan(e.target.value)}
                rows={3}
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Contoh: Meeting evaluasi bulanan"
              />
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

export default PenguranganJamKerjaModal;
