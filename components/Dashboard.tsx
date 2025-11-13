
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { User, Sale, Host, Akun, Target, PenguranganJamKerja } from '../types';
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
import PenguranganJamKerjaManagement from './PenguranganJamKerjaManagement';
import PenguranganJamKerjaModal from './PenguranganJamKerjaModal';


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
  const [penguranganJamKerja, setPenguranganJamKerja] = useState<PenguranganJamKerja[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState<Page>('penjualan');
  
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

  // State for Pengurangan Jam Kerja CRUD
  const [isPenguranganModalOpen, setIsPenguranganModalOpen] = useState(false);
  const [penguranganToEdit, setPenguranganToEdit] = useState<PenguranganJamKerja | null>(null);
  const [isConfirmPenguranganDeleteOpen, setIsConfirmPenguranganDeleteOpen] = useState(false);
  const [penguranganToDelete, setPenguranganToDelete] = useState<PenguranganJamKerja | null>(null);

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

  useEffect(() => {
    setLoading(true);
    const qHosts = query(collection(db, 'HOST'), orderBy('name'));
    const unsubscribeHosts = onSnapshot(qHosts, (querySnapshot) => {
        const hostsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Host));
        setHosts(hostsData);
    }, (error) => {
        console.error("Error fetching hosts: ", error);
    });

    const qAkun = query(collection(db, 'AKUN'), orderBy('name'));
    const unsubscribeAkun = onSnapshot(qAkun, (querySnapshot) => {
        const akunData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Akun));
        setAkun(akunData);
    }, (error) => {
        console.error("Error fetching accounts: ", error);
    });

    const qSales = query(collection(db, 'DATA PENJUALAN'), orderBy('saleDate', 'desc'));
    const unsubscribeSales = onSnapshot(qSales, (querySnapshot) => {
        const salesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
        setSales(salesData);
        setLoading(false); // Set loading to false after main data is fetched
    }, (error) => {
        console.error("Error fetching sales: ", error);
        setLoading(false);
    });
    
    const qTargets = query(collection(db, 'TARGET BULANAN'), orderBy('year', 'desc'), orderBy('month', 'desc'));
    const unsubscribeTargets = onSnapshot(qTargets, (querySnapshot) => {
        const targetsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Target));
        setTargets(targetsData);
    }, (error) => {
        console.error("Error fetching targets: ", error);
    });

    const qPengurangan = query(collection(db, 'PENGURANGAN_JAM_KERJA'), orderBy('tanggal', 'desc'));
    const unsubscribePengurangan = onSnapshot(qPengurangan, (querySnapshot) => {
        const penguranganData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PenguranganJamKerja));
        setPenguranganJamKerja(penguranganData);
    }, (error) => {
        console.error("Error fetching work hour deductions: ", error);
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
        unsubscribePengurangan();
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const penguranganJamKerjaWithHostName = useMemo(() => {
    const hostMap = new Map(hosts.map(h => [h.id, h.name]));
    return penguranganJamKerja.map(p => ({
        ...p,
        hostName: hostMap.get(p.hostId) || 'N/A'
    }));
  }, [penguranganJamKerja, hosts]);

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
    
  const { totalOmset, totalSesi, hostTerbaik, rataRataOmset } = useMemo(() => {
    if (filteredSales.length === 0) {
      return { totalOmset: 0, totalSesi: 0, hostTerbaik: '-', rataRataOmset: 0 };
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
    
    const rataRataOmset = totalSesi > 0 ? totalOmset / totalSesi : 0;
    
    return { totalOmset, totalSesi, hostTerbaik: bestHost, rataRataOmset };
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
          
          const hostData = hosts.find(h => h.id === hostId);
          const durasiWajibHarian = hostData?.durasiHarianWajib || 0;
          const totalJamWajibBruto = durasiWajibHarian * data.workDays.size;

          const totalPengurangan = penguranganJamKerja
              .filter(p => p.hostId === hostId && data.workDays.has(new Date(p.tanggal.seconds * 1000).toISOString().split('T')[0]))
              .reduce((acc, curr) => acc + curr.jumlahJam, 0);

          const totalJamWajibNetto = totalJamWajibBruto - totalPengurangan;
          const totalLembur = totalJamKerja - totalJamWajibNetto;

          return {
              hostId,
              ...data,
              averageTurnover: data.totalSessions > 0 ? data.totalNetTurnover / data.totalSessions : 0,
              totalJamKerja,
              totalJamWajib: totalJamWajibNetto,
              totalLembur: Math.max(0, totalLembur),
          };
      }).sort((a,b) => b.totalNetTurnover - a.totalNetTurnover);

      const accountSummaryData = Object.entries(accountSummary).map(([akunId, data]) => ({
          akunId,
          ...data,
          averageTurnover: data.totalSessions > 0 ? data.totalNetTurnover / data.totalSessions : 0,
      })).sort((a,b) => b.totalNetTurnover - a.totalNetTurnover);

      return { hostSummaryData, accountSummaryData };
  }, [filteredSales, hosts, penguranganJamKerja]);

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

  const handleLogout = () => signOut(auth);

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedHostId('');
    setSelectedAkunId('');
  };

  // Handlers for Sales CRUD
  const handleAddSale = () => { setSaleToEdit(null); setIsSaleModalOpen(true); };
  const handleEditSale = (sale: Sale) => { setSaleToEdit(sale); setIsSaleModalOpen(true); };
  const handleConfirmDeleteSale = (sale: Sale) => { setSaleToDelete(sale); setIsConfirmSaleDeleteOpen(true); };
  const handleDeleteSale = async () => {
      if (saleToDelete) {
          await deleteDoc(doc(db, 'DATA PENJUALAN', saleToDelete.id));
          setIsConfirmSaleDeleteOpen(false);
          setSaleToDelete(null);
      }
  };

  // Handlers for Target CRUD
  const handleAddTarget = () => { setTargetToEdit(null); setIsTargetModalOpen(true); };
  const handleEditTarget = (target: Target) => { setTargetToEdit(target); setIsTargetModalOpen(true); };
  const handleConfirmDeleteTarget = (target: Target) => { setTargetToDelete(target); setIsConfirmTargetDeleteOpen(true); };
  const handleDeleteTarget = async () => {
      if (targetToDelete) {
          await deleteDoc(doc(db, 'TARGET BULANAN', targetToDelete.id));
          setIsConfirmTargetDeleteOpen(false);
          setTargetToDelete(null);
      }
  };

  // Handlers for Pengurangan Jam Kerja CRUD
  const handleAddPengurangan = () => { setPenguranganToEdit(null); setIsPenguranganModalOpen(true); };
  const handleEditPengurangan = (p: PenguranganJamKerja) => { setPenguranganToEdit(p); setIsPenguranganModalOpen(true); };
  const handleConfirmDeletePengurangan = (p: PenguranganJamKerja) => { setPenguranganToDelete(p); setIsConfirmPenguranganDeleteOpen(true); };
  const handleDeletePengurangan = async () => {
      if (penguranganToDelete) {
          await deleteDoc(doc(db, 'PENGURANGAN_JAM_KERJA', penguranganToDelete.id));
          setIsConfirmPenguranganDeleteOpen(false);
          setPenguranganToDelete(null);
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
                <StatCard title="Rata-rata Omset / Sesi" value={`Rp ${rataRataOmset.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} />
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
            
            <HostSalesSummaryTable summaryData={hostSummaryData} salesData={filteredSales} penguranganData={penguranganJamKerja} />
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
            <PenguranganJamKerjaManagement 
                penguranganList={penguranganJamKerjaWithHostName} 
                hosts={hosts}
                onAdd={handleAddPengurangan}
                onEdit={handleEditPengurangan}
                onDelete={handleConfirmDeletePengurangan}
            />
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
              <button onClick={handleLogout} className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white">Keluar</button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white capitalize">{activePage === 'master' ? 'Data Master' : activePage}</h1>
            {activePage === 'penjualan' && (
              <div className="flex items-center space-x-2">
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
      <PenguranganJamKerjaModal
        isOpen={isPenguranganModalOpen}
        onClose={() => setIsPenguranganModalOpen(false)}
        penguranganToEdit={penguranganToEdit}
        hosts={hosts}
      />
      <ConfirmDeleteModal
        isOpen={isConfirmPenguranganDeleteOpen}
        onClose={() => setIsConfirmPenguranganDeleteOpen(false)}
        onConfirm={handleDeletePengurangan}
        title="Hapus Pengurangan Jam Kerja"
        message={`Apakah Anda yakin ingin menghapus catatan pengurangan ini untuk host ${penguranganToDelete?.hostName}?`}
      />

    </div>
  );
};

export default Dashboard;