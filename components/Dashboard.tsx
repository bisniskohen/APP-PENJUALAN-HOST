

import React, { useState, useEffect, useMemo, useRef } from 'react';
// FIX: Use v8-compatible auth method
// import { signOut } from 'firebase/auth';
// FIX: Use v8-compatible firestore methods by removing v9 modular imports.
// import { collection, onSnapshot, query, orderBy, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User, Sale, Host, Akun, Target } from '../types';
import AddSaleModal from './AddSaleModal';
import SalesChart from './SalesChart';
import SalesTable from './SalesTable';
import StatCard from './StatCard';
import Spinner from './Spinner';
import HostManagement from './HostManagement';
import AccountManagement from './AccountManagement';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import TargetManagement from './TargetManagement';
import TargetModal from './TargetModal';
import TargetAchievementChart from './TargetAchievementChart';
import HostSalesSummaryTable from './HostSalesSummaryTable';
import AccountSalesSummaryTable from './AccountSalesSummaryTable';


declare const jspdf: any;

interface DashboardProps {
  user: User;
}

type Page = 'penjualan' | 'target' | 'master';

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [akun, setAkun] = useState<Akun[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState<Page>('penjualan');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State for Sales CRUD
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleToEdit, setSaleToEdit] = useState<Sale | null>(null);
  const [isConfirmSaleDeleteOpen, setIsConfirmSaleDeleteOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  // State for Target CRUD
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetToEdit, setTargetToEdit] = useState<Target | null>(null);
  const [isConfirmTargetDeleteOpen, setIsConfirmTargetDeleteOpen] = useState(false);
  const [targetToDelete, setTargetToDelete] = useState<Target | null>(null);

  // State for Export dropdown
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // State for Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedHostId, setSelectedHostId] = useState('');
  const [selectedAkunId, setSelectedAkunId] = useState('');

  // State for UI toggles
  const [isSalesTableExpanded, setIsSalesTableExpanded] = useState(true);

  // State for bulk actions
  const [selectedSaleIds, setSelectedSaleIds] = useState<Set<string>>(new Set());
  const [isConfirmBulkDeleteOpen, setIsConfirmBulkDeleteOpen] = useState(false);


  useEffect(() => {
    setLoading(true);
    // FIX: Use v8-compatible syntax for Firestore queries.
    const unsubscribeHosts = db.collection('HOST').orderBy('name').onSnapshot((querySnapshot) => {
        const hostsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Host));
        setHosts(hostsData);
    }, (error) => {
        console.error("Error fetching hosts: ", error);
    });

    // FIX: Use v8-compatible syntax for Firestore queries.
    const unsubscribeAkun = db.collection('AKUN').orderBy('name').onSnapshot((querySnapshot) => {
        const akunData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Akun));
        setAkun(akunData);
    }, (error) => {
        console.error("Error fetching accounts: ", error);
    });

    // FIX: Use v8-compatible syntax for Firestore queries.
    const unsubscribeSales = db.collection('DATA PENJUALAN').orderBy('saleDate', 'desc').onSnapshot((querySnapshot) => {
        const salesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
        setSales(salesData);
        setLoading(false); // Set loading to false after main data is fetched
    }, (error) => {
        console.error("Error fetching sales: ", error);
        setLoading(false);
    });
    
    // FIX: Use v8-compatible syntax for Firestore queries.
    // FIX: Removed server-side orderBy to prevent index error. Sorting is now done on the client.
    const unsubscribeTargets = db.collection('TARGET BULANAN').onSnapshot((querySnapshot) => {
        const targetsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Target));
        targetsData.sort((a, b) => {
            if (a.year !== b.year) {
                return b.year - a.year;
            }
            return b.month - a.month;
        });
        setTargets(targetsData);
    }, (error) => {
        console.error("Error fetching targets: ", error);
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
        unsubscribeHosts();
        unsubscribeAkun();
        unsubscribeSales();
        unsubscribeTargets();
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredSales = useMemo(() => {
    const hostMap = new Map(hosts.map(h => [h.id, h.name]));
    const akunMap = new Map(akun.map(a => [a.id, a.name]));

    return sales
      .filter(sale => {
        if (!sale.saleDate || !sale.saleDate.seconds) return false; // Guard against incomplete data
        const saleDate = new Date(sale.saleDate.seconds * 1000);
        const start = startDate ? new Date(startDate) : null;
        if(start) start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        if (start && saleDate < start) return false;
        if (end && saleDate > end) return false;
        if (selectedHostId && sale.hostId !== selectedHostId) return false;
        if (selectedAkunId && sale.akunId !== selectedAkunId) return false;
        
        return true;
      })
      .map(sale => ({
        ...sale,
        hostName: hostMap.get(sale.hostId) || 'N/A',
        akunName: akunMap.get(sale.akunId) || 'N/A',
      }));
  }, [sales, hosts, akun, startDate, endDate, selectedHostId, selectedAkunId]);
    
  const { totalOmset, totalSesi, hostTerbaik, rataRataOmsetHarian } = useMemo(() => {
    if (filteredSales.length === 0) {
      return { totalOmset: 0, totalSesi: 0, hostTerbaik: '-', rataRataOmsetHarian: 0 };
    }
    const totalOmset = filteredSales.reduce((acc, sale) => acc + (sale.omsetAkhir - sale.omsetAwal), 0);
    const totalSesi = filteredSales.length;
    
    const omsetPerHost: { [key: string]: number } = {};
    filteredSales.forEach(sale => {
        if (!omsetPerHost[sale.hostName]) omsetPerHost[sale.hostName] = 0;
        omsetPerHost[sale.hostName] += (sale.omsetAkhir - sale.omsetAwal);
    });

    let bestHost = '-';
    let maxOmset = 0;
    for (const hostName in omsetPerHost) {
        if (omsetPerHost[hostName] > maxOmset) {
            maxOmset = omsetPerHost[hostName];
            bestHost = hostName;
        }
    }
    
    const uniqueDays = new Set(filteredSales.map(sale => new Date(sale.saleDate.seconds * 1000).toDateString()));
    const numberOfDays = uniqueDays.size > 0 ? uniqueDays.size : 1; // Avoid division by zero
    const rataRataOmsetHarian = totalOmset / numberOfDays;
    
    return { totalOmset, totalSesi, hostTerbaik: bestHost, rataRataOmsetHarian };
  }, [filteredSales]);

  // For Target Achievement Chart
  const targetChartData = useMemo(() => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const currentTarget = targets.find(t => t.month === currentMonth && t.year === currentYear);

    if (!currentTarget) return [];

    const totalOmsetBulanIni = sales
      .filter(sale => {
        const saleDate = new Date(sale.saleDate.seconds * 1000);
        return saleDate.getMonth() + 1 === currentMonth && saleDate.getFullYear() === currentYear;
      })
      .reduce((acc, sale) => acc + (sale.omsetAkhir - sale.omsetAwal), 0);

    const achievementPercentage = currentTarget.target > 0 ? (totalOmsetBulanIni / currentTarget.target) * 100 : 0;

    return [{
        name: `Target ${new Date(currentYear, currentMonth - 1).toLocaleString('id-ID', { month: 'long' })}`,
        Pencapaian: Math.round(achievementPercentage * 100) / 100, // round to 2 decimal places
    }];
  }, [sales, targets]);
    
  // For Host & Account Summary Tables
  const { hostSummaryData, accountSummaryData } = useMemo(() => {
      const hostSummary: { [id: string]: { hostName: string, totalSessions: number, totalNetTurnover: number, totalDuration: number, workDays: Set<string> } } = {};
      const accountSummary: { [id: string]: { akunName: string, totalSessions: number, totalNetTurnover: number, totalDuration: number } } = {};

      filteredSales.forEach(sale => {
          const saleDateStr = new Date(sale.saleDate.seconds * 1000).toISOString().split('T')[0];
          // Host Summary
          if (!hostSummary[sale.hostId]) {
              hostSummary[sale.hostId] = { hostName: sale.hostName, totalSessions: 0, totalNetTurnover: 0, totalDuration: 0, workDays: new Set() };
          }
          hostSummary[sale.hostId].totalSessions += 1;
          hostSummary[sale.hostId].totalNetTurnover += (sale.omsetAkhir - sale.omsetAwal);
          hostSummary[sale.hostId].totalDuration += sale.durasi;
          hostSummary[sale.hostId].workDays.add(saleDateStr);

          // Account Summary
          if (!accountSummary[sale.akunId]) {
              accountSummary[sale.akunId] = { akunName: sale.akunName, totalSessions: 0, totalNetTurnover: 0, totalDuration: 0 };
          }
          accountSummary[sale.akunId].totalSessions += 1;
          accountSummary[sale.akunId].totalNetTurnover += (sale.omsetAkhir - sale.omsetAwal);
          accountSummary[sale.akunId].totalDuration += sale.durasi;
      });
      
      const hostSummaryData = Object.entries(hostSummary).map(([hostId, data]) => {
          const totalJamKerja = data.totalDuration / 60;
          
          return {
              hostId,
              ...data,
              averageTurnover: data.totalSessions > 0 ? data.totalNetTurnover / data.totalSessions : 0,
              totalJamKerja,
          };
      }).sort((a,b) => b.totalNetTurnover - a.totalNetTurnover);

      const accountSummaryData = Object.entries(accountSummary).map(([akunId, data]) => ({
          akunId,
          ...data,
          averageTurnover: data.totalSessions > 0 ? data.totalNetTurnover / data.totalSessions : 0,
      })).sort((a,b) => b.totalNetTurnover - a.totalNetTurnover);

      return { hostSummaryData, accountSummaryData };
  }, [filteredSales]);

  const selectedHostName = useMemo(() => {
    if (!selectedHostId) return null;
    return hosts.find(h => h.id === selectedHostId)?.name;
  }, [selectedHostId, hosts]);

  const selectedAkunName = useMemo(() => {
    if (!selectedAkunId) return null;
    return akun.find(a => a.id === selectedAkunId)?.name;
  }, [selectedAkunId, akun]);

  const salesDetailHeader = useMemo(() => {
    const filtersActive = selectedHostId || selectedAkunId;
    let title = "Detail Semua Penjualan";
    let subtitle = null;

    if (filtersActive) {
        const parts = [];
        if (selectedHostName) parts.push(`Host: ${selectedHostName}`);
        if (selectedAkunName) parts.push(`Akun: ${selectedAkunName}`);
        subtitle = <span className="text-sm text-slate-400 ml-2 font-normal truncate">| {parts.join(' - ')}</span>;
    } else {
        subtitle = <span className="text-sm text-slate-400 ml-4 font-normal">(Gunakan filter di atas untuk menyaring data)</span>;
    }

    return (
        <div className="flex items-center">
            <h3 className="text-lg font-medium leading-6 text-white whitespace-nowrap">{title}</h3>
            {subtitle}
        </div>
    );
  }, [selectedHostId, selectedAkunId, selectedHostName, selectedAkunName]);

  // FIX: Use auth.signOut() (v8 compat) instead of signOut(auth) (v9 modular)
  const handleLogout = () => auth.signOut();

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedHostId('');
    setSelectedAkunId('');
    setSelectedSaleIds(new Set());
  };

  // Handlers for Sales CRUD
  const handleAddSale = () => { setSaleToEdit(null); setIsSaleModalOpen(true); };
  const handleEditSale = (sale: Sale) => { setSaleToEdit(sale); setIsSaleModalOpen(true); };
  const handleConfirmDeleteSale = (sale: Sale) => { setSaleToDelete(sale); setIsConfirmSaleDeleteOpen(true); };
  const handleDeleteSale = async () => {
      if (saleToDelete) {
          // FIX: Use v8-compatible syntax for deleting a document.
          await db.collection('DATA PENJUALAN').doc(saleToDelete.id).delete();
          setIsConfirmSaleDeleteOpen(false);
          setSaleToDelete(null);
      }
  };
  
    // Handlers for selection
  const handleSelectSale = (saleId: string) => {
    setSelectedSaleIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(saleId)) {
        newSelected.delete(saleId);
      } else {
        newSelected.add(saleId);
      }
      return newSelected;
    });
  };

  const handleSelectAllSales = () => {
    if (selectedSaleIds.size === filteredSales.length) {
      setSelectedSaleIds(new Set());
    } else {
      setSelectedSaleIds(new Set(filteredSales.map(sale => sale.id)));
    }
  };

  // Handlers for Bulk Delete
  const handleConfirmBulkDelete = () => {
    if(selectedSaleIds.size > 0) {
        setIsConfirmBulkDeleteOpen(true);
    }
  };

  const handleBulkDeleteSales = async () => {
    if (selectedSaleIds.size === 0) return;

    // FIX: Use v8-compatible syntax for batch writes.
    const batch = db.batch();
    selectedSaleIds.forEach(id => {
        const saleRef = db.collection('DATA PENJUALAN').doc(id);
        batch.delete(saleRef);
    });
    
    await batch.commit();
    setIsConfirmBulkDeleteOpen(false);
    setSelectedSaleIds(new Set());
  };

  // Handlers for Target CRUD
  const handleAddTarget = () => { setTargetToEdit(null); setIsTargetModalOpen(true); };
  const handleEditTarget = (target: Target) => { setTargetToEdit(target); setIsTargetModalOpen(true); };
  const handleConfirmDeleteTarget = (target: Target) => { setTargetToDelete(target); setIsConfirmTargetDeleteOpen(true); };
  const handleDeleteTarget = async () => {
      if (targetToDelete) {
          // FIX: Use v8-compatible syntax for deleting a document.
          await db.collection('TARGET BULANAN').doc(targetToDelete.id).delete();
          setIsConfirmTargetDeleteOpen(false);
          setTargetToDelete(null);
      }
  };

  const handleExportToPDF = () => {
    const doc = new jspdf.jsPDF();
    const tableData = filteredSales.map(sale => [
        sale.hostName,
        sale.akunName,
        new Date(sale.saleDate.seconds * 1000).toLocaleDateString('id-ID'),
        sale.sesi,
        `${sale.durasi} menit`,
        (sale.omsetAkhir - sale.omsetAwal).toLocaleString('id-ID')
    ]);

    doc.autoTable({
        head: [['Host', 'Akun', 'Tanggal', 'Sesi', 'Durasi', 'Omset Bersih']],
        body: tableData,
    });
    doc.save('laporan_penjualan.pdf');
    setIsExportMenuOpen(false);
  };
    
  const handleExportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Host,Akun,Tanggal,Sesi,Durasi,Omset Awal,Omset Akhir,Omset Bersih\n";
    filteredSales.forEach(sale => {
        const row = [
            sale.hostName,
            sale.akunName,
            new Date(sale.saleDate.seconds * 1000).toLocaleDateString('id-ID'),
            sale.sesi,
            sale.durasi,
            sale.omsetAwal,
            sale.omsetAkhir,
            sale.omsetAkhir - sale.omsetAwal
        ].join(",");
        csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "laporan_penjualan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const renderContent = () => {
    switch(activePage) {
      case 'penjualan':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Omset Bersih" value={`Rp ${totalOmset.toLocaleString('id-ID')}`} />
                <StatCard title="Total Sesi Live" value={totalSesi.toLocaleString('id-ID')} />
                <StatCard title="Rata-rata Omset / Hari" value={`Rp ${rataRataOmsetHarian.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} />
                <StatCard title="Host Performa Terbaik" value={hostTerbaik} />
            </div>
            
            <div className="mt-8 p-6 bg-slate-800/50 rounded-xl shadow-lg">
                <h3 className="text-lg font-medium leading-6 text-white mb-4">Filter Data Penjualan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    <select value={selectedHostId} onChange={e => setSelectedHostId(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="">Semua Host</option>
                        {hosts.map(host => <option key={host.id} value={host.id}>{host.name}</option>)}
                    </select>
                    <select value={selectedAkunId} onChange={e => setSelectedAkunId(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="">Semua Akun</option>
                        {akun.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    <button onClick={resetFilters} className="bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700">Reset Filter</button>
                </div>
            </div>

            <div className="mt-8 p-6 bg-slate-800/50 rounded-xl shadow-lg">
                <h3 className="text-lg font-medium leading-6 text-white mb-4">Grafik Omset per Host</h3>
                <SalesChart sales={filteredSales} hosts={hosts} />
            </div>
            
            <HostSalesSummaryTable summaryData={hostSummaryData} salesData={filteredSales} />
            <AccountSalesSummaryTable summaryData={accountSummaryData} />

            <div className="mt-8">
              <div className="bg-slate-800/50 rounded-xl shadow-lg">
                <button
                  onClick={() => setIsSalesTableExpanded(!isSalesTableExpanded)}
                  className="w-full text-left p-4 flex justify-between items-center rounded-t-xl bg-slate-800 hover:bg-slate-700/50 transition-colors"
                >
                  {salesDetailHeader}
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-slate-400 transition-transform duration-300 ${isSalesTableExpanded ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isSalesTableExpanded && (
                  <div className="p-6">
                    <SalesTable
                      sales={filteredSales}
                      onEdit={handleEditSale}
                      onDelete={handleConfirmDeleteSale}
                      isCollapsible={true}
                      selectedIds={selectedSaleIds}
                      onSelectOne={handleSelectSale}
                      onSelectAll={handleSelectAllSales}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        );
      case 'target':
        return (
            <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="p-6 bg-slate-800/50 rounded-xl shadow-lg">
                        <h3 className="text-lg font-medium leading-6 text-white mb-4">Pencapaian Target Bulan Ini</h3>
                        <TargetAchievementChart data={targetChartData} />
                    </div>
                     <TargetManagement
                        targets={targets}
                        onAdd={handleAddTarget}
                        onEdit={handleEditTarget}
                        onDelete={handleConfirmDeleteTarget}
                    />
                </div>
            </>
        );
      case 'master':
        return (
          <div className="flex flex-col gap-8">
            <HostManagement hosts={hosts} />
            <AccountManagement akun={akun} />
          </div>
        );
      default:
        return null;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="bg-slate-800/50 backdrop-blur-sm shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="font-bold text-xl text-white">Dasbor Penjualan</span>
            </div>
            <nav className="hidden md:flex md:space-x-4">
              <button onClick={() => setActivePage('penjualan')} className={`px-3 py-2 rounded-md text-sm font-medium ${activePage === 'penjualan' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Data Penjualan</button>
              <button onClick={() => setActivePage('target')} className={`px-3 py-2 rounded-md text-sm font-medium ${activePage === 'target' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Target</button>
              <button onClick={() => setActivePage('master')} className={`px-3 py-2 rounded-md text-sm font-medium ${activePage === 'master' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Data Master</button>
            </nav>
            <div className="flex items-center">
                {/* Desktop Logout Button */}
                <button onClick={handleLogout} className="hidden md:block ml-4 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white">Keluar</button>
                
                {/* Mobile Hamburger Button */}
                <div className="md:hidden ml-1">
                    <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    type="button"
                    className="p-2 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    aria-controls="mobile-menu"
                    aria-expanded={isMobileMenuOpen}
                    >
                    <span className="sr-only">Buka menu utama</span>
                    {isMobileMenuOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                    </button>
                </div>
            </div>
          </div>
        </div>
        {/* Mobile Menu Panel */}
        {isMobileMenuOpen && (
            <div className="md:hidden bg-slate-800" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <button onClick={() => { setActivePage('penjualan'); setIsMobileMenuOpen(false); }} className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${activePage === 'penjualan' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Data Penjualan</button>
                <button onClick={() => { setActivePage('target'); setIsMobileMenuOpen(false); }} className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${activePage === 'target' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Target</button>
                <button onClick={() => { setActivePage('master'); setIsMobileMenuOpen(false); }} className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${activePage === 'master' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>Data Master</button>
            </div>
            <div className="pt-3 pb-3 border-t border-slate-700">
                <div className="px-2">
                    <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:bg-slate-700 hover:text-white">Keluar</button>
                </div>
            </div>
            </div>
        )}
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white capitalize">{activePage === 'master' ? 'Data Master' : activePage}</h1>
            {activePage === 'penjualan' && (
              <div className="flex items-center space-x-2">
                 {selectedSaleIds.size > 0 && (
                    <button
                        onClick={handleConfirmBulkDelete}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 flex items-center transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus ({selectedSaleIds.size})
                    </button>
                )}
                <div className="relative" ref={exportMenuRef}>
                    <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-300 flex items-center">
                        Ekspor Data
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    {isExportMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-md shadow-lg z-50">
                            <button onClick={handleExportToPDF} className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-600">Ekspor ke PDF</button>
                            <button onClick={handleExportToCSV} className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-600">Ekspor ke CSV</button>
                        </div>
                    )}
                </div>
                <button
                  onClick={handleAddSale}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300"
                >
                  + Tambah Data
                </button>
              </div>
            )}
        </div>
        {renderContent()}
      </main>
      
      <AddSaleModal 
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        hosts={hosts}
        akun={akun}
        saleToEdit={saleToEdit}
      />
      <ConfirmDeleteModal
        isOpen={isConfirmSaleDeleteOpen}
        onClose={() => setIsConfirmSaleDeleteOpen(false)}
        onConfirm={handleDeleteSale}
        title="Hapus Data Penjualan"
        message="Apakah Anda yakin ingin menghapus data penjualan ini? Tindakan ini tidak dapat diurungkan."
      />
       <ConfirmDeleteModal
        isOpen={isConfirmBulkDeleteOpen}
        onClose={() => setIsConfirmBulkDeleteOpen(false)}
        onConfirm={handleBulkDeleteSales}
        title={`Hapus ${selectedSaleIds.size} Data Penjualan`}
        message="Apakah Anda yakin ingin menghapus semua data penjualan yang dipilih? Tindakan ini tidak dapat diurungkan."
      />
      <TargetModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        targetToEdit={targetToEdit}
      />
      <ConfirmDeleteModal
        isOpen={isConfirmTargetDeleteOpen}
        onClose={() => setIsConfirmTargetDeleteOpen(false)}
        onConfirm={handleDeleteTarget}
        title="Hapus Target"
        message="Apakah Anda yakin ingin menghapus target ini?"
      />

    </div>
  );
};

export default Dashboard;