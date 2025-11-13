import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// FIX: Use v8-compatible Timestamp type.
export type Timestamp = firebase.firestore.Timestamp;


export interface User {
  uid: string;
  email: string | null;
}

export interface Host {
  id: string;
  name: string;
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

// FIX: Add and export the missing 'DurasiWajib' interface.
export interface DurasiWajib {
  id: string;
  month: number;
  year: number;
  durasiHarian: number;
}

// FIX: Add and export the missing 'PenguranganJamKerja' interface.
export interface PenguranganJamKerja {
  id: string;
  hostId: string;
  hostName?: string;
  tanggal: Timestamp;
  jumlahJam: number;
  keterangan: string;
}
