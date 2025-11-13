import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
}

export interface Host {
  id: string;
  name: string;
  durasiHarianWajib: number;
}

export interface Akun {
  id:string;
  name: string;
}

export type Sesi = 'PAGI' | 'SIANG' | 'SORE' | 'MALAM';

export interface Sale {
  id: string;
  hostId: string;
  hostName?: string; 
  akunId: string;
  akunName?: string;
  omsetAwal: number;
  omsetAkhir: number;
  sesi: Sesi;
  durasi: number; // in minutes
  saleDate: Timestamp;
}

export interface Target {
  id: string;
  target: number;
  month: number; // 1-12
  year: number;
  hadiah: string;
}

export interface PenguranganJamKerja {
    id: string;
    hostId: string;
    hostName?: string;
    tanggal: Timestamp;
    jumlahJam: number;
    keterangan: string;
}

// FIX: Add and export the missing 'DurasiWajib' interface.
export interface DurasiWajib {
  id: string;
  month: number;
  year: number;
  durasiHarian: number;
}