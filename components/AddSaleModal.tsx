import React, { useState, useEffect } from 'react';
// FIX: Use v8-compatible firebase for Timestamp and remove v9 modular imports.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { db } from '../services/firebase';
import { Host, Akun, Sale, Sesi } from '../types';

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  hosts: Host[];
  akun: Akun[];
  saleToEdit: Sale | null;
}

const SaleModal: React.FC<SaleModalProps> = ({ isOpen, onClose, hosts, akun, saleToEdit }) => {
  const [hostId, setHostId] = useState('');
  const [akunId, setAkunId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [sesi, setSesi] = useState<Sesi>('PAGI');
  const [durasi, setDurasi] = useState(0);
  const [omsetAwal, setOmsetAwal] = useState(0);
  const [omsetAkhir, setOmsetAkhir] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = saleToEdit !== null;

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setHostId(saleToEdit.hostId);
            setAkunId(saleToEdit.akunId);
            setSaleDate(new Date(saleToEdit.saleDate.seconds * 1000).toISOString().split('T')[0]);
            setSesi(saleToEdit.sesi);
            setDurasi(saleToEdit.durasi);
            setOmsetAwal(saleToEdit.omsetAwal);
            setOmsetAkhir(saleToEdit.omsetAkhir);
        } else {
            // Reset form for new entry
            setHostId('');
            setAkunId('');
            setSaleDate(new Date().toISOString().split('T')[0]);
            setSesi('PAGI');
            setDurasi(0);
            setOmsetAwal(0);
            setOmsetAkhir(0);
        }
        setError(null);
    }
  }, [isOpen, saleToEdit, isEditing]);

  const handleOmsetChange = (setter: React.Dispatch<React.SetStateAction<number>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10);
    setter(isNaN(numericValue) ? 0 : numericValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!hostId || !akunId || !saleDate || !sesi || durasi <= 0 || omsetAkhir < omsetAwal) {
      setError('Semua field harus diisi dengan benar. Omset akhir tidak boleh kurang dari omset awal.');
      return;
    }

    setIsLoading(true);

    const saleData = {
        hostId,
        akunId,
        // FIX: Use v8-compatible Timestamp.
        saleDate: firebase.firestore.Timestamp.fromDate(new Date(saleDate)),
        sesi,
        durasi,
        omsetAwal,
        omsetAkhir,
    };

    try {
      // FIX: Use v8-compatible syntax for document writes.
      if (isEditing) {
        const saleRef = db.collection('DATA PENJUALAN').doc(saleToEdit.id);
        await saleRef.update(saleData);
      } else {
        await db.collection('DATA PENJUALAN').add(saleData);
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
          <h2 className="text-2xl font-bold text-white">{isEditing ? 'Edit Data Penjualan' : 'Tambah Penjualan Baru'}</h2>
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
                <label htmlFor="akun" className="block text-sm font-medium text-slate-300 mb-1">Akun</label>
                <select id="akun" value={akunId} onChange={e => setAkunId(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="" disabled>Pilih Akun</option>
                    {akun.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
            </div>
            <div>
              <label htmlFor="saleDate" className="block text-sm font-medium text-slate-300 mb-1">Tanggal</label>
              <input type="date" id="saleDate" value={saleDate} onChange={e => setSaleDate(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
             <div>
                <label htmlFor="sesi" className="block text-sm font-medium text-slate-300 mb-1">Sesi</label>
                <select id="sesi" value={sesi} onChange={e => setSesi(e.target.value as Sesi)} required className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="PAGI">Pagi</option>
                    <option value="SIANG">Siang</option>
                    <option value="SORE">Sore</option>
                    <option value="MALAM">Malam</option>
                </select>
            </div>
            <div>
              <label htmlFor="durasi" className="block text-sm font-medium text-slate-300 mb-1">Durasi (menit)</label>
              <input type="number" id="durasi" value={durasi} onChange={e => setDurasi(parseInt(e.target.value, 10))} min="1" required className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div></div>
            <div>
              <label htmlFor="omsetAwal" className="block text-sm font-medium text-slate-300 mb-1">Omset Awal</label>
              <input 
                type="text" 
                inputMode="numeric" 
                id="omsetAwal" 
                value={`Rp ${omsetAwal.toLocaleString('id-ID')}`} 
                onChange={handleOmsetChange(setOmsetAwal)} 
                required 
                className="w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="omsetAkhir" className="block text-sm font-medium text-slate-300 mb-1">Omset Akhir</label>
              <input 
                type="text" 
                inputMode="numeric" 
                id="omsetAkhir" 
                value={`Rp ${omsetAkhir.toLocaleString('id-ID')}`} 
                onChange={handleOmsetChange(setOmsetAkhir)} 
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

export default SaleModal;
