

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
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

  // State for UI toggles
  const [isSalesTableExpanded, setIsSalesTableExpanded] = useState(true);

  useEffect(() => {
    const hostQuery = query(collection(db, 'HOST'), orderBy('name'));
    const unsubscribeHosts = onSnapshot(hostQuery, (querySnapshot) => {
        const hostList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Host));
        setHosts(hostList);
    });

    const akunQuery = query(collection(db, 'AKUN'), orderBy('name'));
    const unsubscribeAkun = onSnapshot(akunQuery, (querySnapshot) => {
        const akunList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Akun));
        setAkun(akunList);
    });

    const targetQuery = query(collection(db, 'TARGET BULANAN'));
    const unsubscribeTargets = onSnapshot(targetQuery, (querySnapshot) => {
        const targetList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Target));
        
        targetList.sort((a, b) => {
          if (a.year !== b.year) {
            return b.year - a.year;
          }
          return b.month - a.month;
        });

        setTargets(targetList);
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
        unsubscribeTargets();
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (hosts.length === 0 || akun.length === 0) {
      if(hosts.length > 0 && akun.length > 0) { 
        setLoading(false);
      }
    }

    const salesQuery = query(collection(db, 'DATA PENJUALAN'), orderBy('saleDate', 'desc'));
    const unsubscribeSales = onSnapshot(salesQuery, (querySnapshot) => {
      const salesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const host = hosts.find(h => h.id === data.hostId);
        const account = akun.find(a => a.id === data.akunId);
        return { 
          id: doc.id,
          ...data,
          hostName: host ? host.name : 'Host Dihapus',
          akunName: account ? account.name : 'Akun Dihapus',
        } as Sale;
      });
      setSales(salesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching sales data: ", error);
      setLoading(false);
    });

    return () => {
        unsubscribeSales();
    }
  }, [hosts, akun]);

  const salesFilteredByDate = useMemo(() => {
    if (!startDate && !endDate) {
      return sales;
    }
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    return sales.filter(sale => {
      const saleDate = sale.saleDate.toDate();
      if (start && end) {
        return saleDate >= start && saleDate <= end;
      }
      if (start) {
        return saleDate >= start;
      }
      if (end) {
        return saleDate <= end;
      }
      return true;
    });
  }, [sales, startDate, endDate]);

  const filteredSales = useMemo(() => {
    if (!selectedHostId) {
        return salesFilteredByDate;
    }
    return salesFilteredByDate.filter(sale => sale.hostId === selectedHostId);
  }, [salesFilteredByDate, selectedHostId]);

  const hostSalesSummary = useMemo(() => {
    const summary: { [key: string]: { hostName: string, totalSessions: number, totalNetTurnover: number, totalDuration: number } } = {};

    salesFilteredByDate.forEach(sale => {
        if (!sale.hostId || !sale.hostName) return;

        if (!summary[sale.hostId]) {
            summary[sale.hostId] = {
                hostName: sale.hostName,
                totalSessions: 0,
                totalNetTurnover: 0,
                totalDuration: 0,
            };
        }
        
        summary[sale.hostId].totalSessions += 1;
        summary[sale.hostId].totalNetTurnover += (sale.omsetAkhir - sale.omsetAwal);
        summary[sale.hostId].totalDuration += sale.durasi;
    });

    return Object.keys(summary).map(hostId => {
        const data = summary[hostId];
        const averageTurnover = data.totalSessions > 0 ? data.totalNetTurnover / data.totalSessions : 0;
        return {
            hostId,
            hostName: data.hostName,
            totalSessions: data.totalSessions,
            totalNetTurnover: data.totalNetTurnover,
            totalDuration: data.totalDuration,
            averageTurnover,
        };
    }).sort((a, b) => b.totalNetTurnover - a.totalNetTurnover);
  }, [salesFilteredByDate]);

   const accountSalesSummary = useMemo(() => {
    const summary: { [key: string]: { akunName: string, totalSessions: number, totalNetTurnover: number, totalDuration: number } } = {};

    salesFilteredByDate.forEach(sale => {
        if (!sale.akunId || !sale.akunName) return;

        if (!summary[sale.akunId]) {
            summary[sale.akunId] = {
                akunName: sale.akunName,
                totalSessions: 0,
                totalNetTurnover: 0,
                totalDuration: 0,
            };
        }
        
        summary[sale.akunId].totalSessions += 1;
        summary[sale.akunId].totalNetTurnover += (sale.omsetAkhir - sale.omsetAwal);
        summary[sale.akunId].totalDuration += sale.durasi;
    });

    return Object.keys(summary).map(akunId => {
        const data = summary[akunId];
        const averageTurnover = data.totalSessions > 0 ? data.totalNetTurnover / data.totalSessions : 0;
        return {
            akunId,
            akunName: data.akunName,
            totalSessions: data.totalSessions,
            totalNetTurnover: data.totalNetTurnover,
            totalDuration: data.totalDuration,
            averageTurnover,
        };
    }).sort((a, b) => b.totalNetTurnover - a.totalNetTurnover);
  }, [salesFilteredByDate]);

  const { totalRevenue, totalSales, averageSale } = useMemo(() => {
    const totalRevenue = filteredSales.reduce((acc, sale) => acc + (sale.omsetAkhir - sale.omsetAwal), 0);
    const totalSales = filteredSales.length;
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;
    return { totalRevenue, totalSales, averageSale };
  }, [filteredSales]);

  const { targetChartData, currentTarget } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const currentTarget = targets.find(t => t.month === currentMonth && t.year === currentYear);

    if (!currentTarget || currentTarget.target <= 0) {
      return { targetChartData: [], currentTarget: null };
    }

    const revenueByHost: { [key: string]: number } = {};
    sales
      .filter(sale => {
        const saleDate = new Date(sale.saleDate.seconds * 1000);
        return saleDate.getMonth() + 1 === currentMonth && saleDate.getFullYear() === currentYear;
      })
      .forEach(sale => {
        if (!revenueByHost[sale.hostId]) {
          revenueByHost[sale.hostId] = 0;
        }
        revenueByHost[sale.hostId] += (sale.omsetAkhir - sale.omsetAwal);
      });

    const chartData = hosts
      .map(host => {
        const totalRevenue = revenueByHost[host.id] || 0;
        const pencapaian = (totalRevenue / currentTarget.target) * 100;
        return {
          name: host.name,
          Pencapaian: parseFloat(pencapaian.toFixed(2)),
        };
      });
      
    return { targetChartData: chartData, currentTarget };
  }, [sales, targets, hosts]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Host", "Akun", "Tanggal", "Sesi", "Durasi (menit)", "Omset Awal", "Omset Akhir", "Omset Bersih"];
    const csvRows = [headers.join(',')];
    
    filteredSales.forEach(sale => {
        const omsetBersih = sale.omsetAkhir - sale.omsetAwal;
        const saleDate = new Date(sale.saleDate.seconds * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const row = [
            `"${sale.hostName?.replace(/"/g, '""')}"`,
            `"${sale.akunName?.replace(/"/g, '""')}"`,
            saleDate,
            sale.sesi,
            sale.durasi,
            sale.omsetAwal,
            sale.omsetAkhir,
            omsetBersih
        ];
        csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_penjualan_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  const handleExportPDF = () => {
      const doc = new jspdf.jsPDF();
      const date = new Date();
      const formattedDate = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      
      doc.setFontSize(18);
      doc.text("Laporan Data Penjualan", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Tanggal Laporan: ${formattedDate}`, 14, 29);
      
      const tableColumn = ["Host", "Akun", "Tanggal", "Sesi", "Durasi", "Omset Bersih"];
      const tableRows: any[] = [];

      filteredSales.forEach(sale => {
        const omsetBersih = sale.omsetAkhir - sale.omsetAwal;
        const saleData = [
          sale.hostName,
          sale.akunName,
          new Date(sale.saleDate.seconds * 1000).toLocaleDateString('id-ID'),
          sale.sesi,
          `${sale.durasi} menit`,
          `Rp ${omsetBersih.toLocaleString('id-ID')}`
        ];
        tableRows.push(saleData);
      });

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo color
        styles: { font: 'helvetica', fontSize: 10 },
      });
      
      const pageCount = doc.internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, {align: 'center'});
      }
      
      const fileNameDate = new Date().toISOString().split('T')[0];
      doc.save(`laporan_penjualan_${fileNameDate}.pdf`);
      setIsExportMenuOpen(false);
  };

  // --- Sales CRUD Handlers ---
  const handleOpenSaleModal = (sale: Sale | null = null) => {
    setSaleToEdit(sale);
    setIsSaleModalOpen(true);
  };
  const handleCloseSaleModal = () => { setIsSaleModalOpen(false); setSaleToEdit(null); };
  const handleOpenConfirmDeleteSale = (sale: Sale) => { setSaleToDelete(sale); setIsConfirmSaleDeleteOpen(true); };
  const handleCloseConfirmDeleteSale = () => { setSaleToDelete(null); setIsConfirmSaleDeleteOpen(false); };
  const handleDeleteSale = async () => {
    if (!saleToDelete) return;
    try {
        await deleteDoc(doc(db, 'DATA PENJUALAN', saleToDelete.id));
        handleCloseConfirmDeleteSale();
    } catch (error) { console.error("Error deleting sale: ", error); }
  };

  // --- Target CRUD Handlers ---
  const handleOpenTargetModal = (target: Target | null = null) => {
    setTargetToEdit(target);
    setIsTargetModalOpen(true);
  };
  const handleCloseTargetModal = () => { setIsTargetModalOpen(false); setTargetToEdit(null); };
  const handleOpenConfirmDeleteTarget = (target: Target) => { setTargetToDelete(target); setIsConfirmTargetDeleteOpen(true); };
  const handleCloseConfirmDeleteTarget = () => { setTargetToDelete(null); setIsConfirmTargetDeleteOpen(false); };
  const handleDeleteTarget = async () => {
    if (!targetToDelete) return;
    try {
        await deleteDoc(doc(db, 'TARGET BULANAN', targetToDelete.id));
        handleCloseConfirmDeleteTarget();
    } catch (error) { console.error("Error deleting target: ", error); }
  };

  const NavButton: React.FC<{ page: Page; label: string }> = ({ page, label }) => (
    <button
      onClick={() => setActivePage(page)}
      className={`${
        activePage === page
          ? 'border-indigo-500 text-indigo-400'
          : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
    >
      {label}
    </button>
  );

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center h-64"><Spinner/></div>;
    }

    switch (activePage) {
      case 'penjualan':
        return (
          <>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold">Ringkasan Penjualan</h2>
              <div className="flex items-center space-x-2">
                 <div className="relative" ref={exportMenuRef}>
                  <button
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className="px-4 py-2.5 text-sm font-medium text-white bg-slate-700 rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-4 focus:ring-slate-500 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Ekspor
                  </button>
                  {isExportMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-slate-800 ring-1 ring-black ring-opacity-5 z-30">
                      <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <button onClick={handleExportCSV} className="w-full text-left block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700" role="menuitem">
                          Ekspor ke CSV
                        </button>
                        <button onClick={handleExportPDF} className="w-full text-left block px-4 py-2 text-sm text-slate-200 hover:bg-slate-700" role="menuitem">
                          Ekspor ke PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleOpenSaleModal()}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300"
                >
                  + Tambah Penjualan
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-6 bg-slate-800/50 p-4 rounded-xl">
              <label className="text-sm font-medium text-slate-300">Filter Tanggal:</label>
              <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
              <span className="text-slate-400">-</span>
              <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  disabled={!startDate}
                  className="bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:opacity-50"
              />
              <div className="flex items-center gap-2">
                <label htmlFor="hostFilter" className="text-sm font-medium text-slate-300">Host:</label>
                <select
                    id="hostFilter"
                    value={selectedHostId}
                    onChange={(e) => setSelectedHostId(e.target.value)}
                    className="bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                >
                    <option value="">Semua Host</option>
                    {hosts.map(host => <option key={host.id} value={host.id}>{host.name}</option>)}
                </select>
              </div>
              {(startDate || endDate || selectedHostId) && (
                  <button
                      onClick={() => { setStartDate(''); setEndDate(''); setSelectedHostId(''); }}
                      className="px-4 py-2 text-sm font-medium text-white bg-slate-600 rounded-lg hover:bg-slate-500 focus:outline-none flex items-center"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reset Filter
                  </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard title="Total Omset Bersih" value={`Rp ${totalRevenue.toLocaleString('id-ID')}`} />
              <StatCard title="Total Sesi Penjualan" value={totalSales.toString()} />
              <StatCard title="Rata-rata Omset / Sesi" value={`Rp ${averageSale.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} />
            </div>

            <HostSalesSummaryTable summaryData={hostSalesSummary} salesData={salesFilteredByDate} />
            
            <AccountSalesSummaryTable summaryData={accountSalesSummary} />

            {!selectedHostId && (
              <div className="mt-8 bg-slate-800/50 p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-medium leading-6 text-white mb-4">Omset per Host</h3>
                <SalesChart sales={filteredSales} hosts={hosts} />
              </div>
            )}
            
            <div className="mt-8">
              <div
                onClick={() => setIsSalesTableExpanded(!isSalesTableExpanded)}
                className={`flex justify-between items-center p-4 bg-slate-800/50 cursor-pointer hover:bg-slate-800 ${isSalesTableExpanded ? 'rounded-t-lg' : 'rounded-lg'}`}
              >
                <h3 className="text-lg font-medium leading-6 text-white">
                  {selectedHostId ? `Detail Penjualan: ${hosts.find(h => h.id === selectedHostId)?.name}` : 'Detail Semua Penjualan'}
                </h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${isSalesTableExpanded ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {isSalesTableExpanded && (
                <SalesTable sales={filteredSales} onEdit={handleOpenSaleModal} onDelete={handleOpenConfirmDeleteSale} isCollapsible />
              )}
            </div>
          </>
        );
      case 'target':
        return (
          <>
            <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-medium leading-6 text-white mb-4">Pencapaian Target Host (Bulan Ini)</h3>
              {currentTarget ? (
                <div className="mb-6 bg-slate-800 border border-teal-500/30 p-4 rounded-lg text-center">
                    <p className="text-sm text-slate-400">Target Bulan {new Date(currentTarget.year, currentTarget.month - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</p>
                    <p className="text-3xl font-bold text-white mt-1">Rp {currentTarget.target.toLocaleString('id-ID')}</p>
                    {currentTarget.hadiah && (
                        <p className="mt-2 text-sm text-teal-300"><span className="font-semibold">Hadiah:</span> {currentTarget.hadiah}</p>
                    )}
                </div>
              ) : (
                 <div className="mb-6 bg-slate-800 border border-slate-700 p-4 rounded-lg text-center">
                    <p className="text-slate-400">Belum ada target yang ditetapkan untuk bulan ini.</p>
                 </div>
              )}
              <TargetAchievementChart data={targetChartData} />
            </div>
            <div className="mt-8">
              <TargetManagement targets={targets} onAdd={() => handleOpenTargetModal(null)} onEdit={handleOpenTargetModal} onDelete={handleOpenConfirmDeleteTarget} />
            </div>
          </>
        );
      case 'master':
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <HostManagement hosts={hosts} />
                <AccountManagement akun={akun} />
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="bg-slate-800/50 backdrop-blur-sm shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-white">Dasbor Penjualan</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-300 hidden sm:block">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-red-500"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
           <div className="border-b border-slate-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <NavButton page="penjualan" label="Data Penjualan" />
                    <NavButton page="target" label="Target Bulanan" />
                    <NavButton page="master" label="Data Master" />
                </nav>
            </div>
            <div className="py-6">
              {renderContent()}
            </div>
        </div>
      </main>

      <AddSaleModal isOpen={isSaleModalOpen} onClose={handleCloseSaleModal} hosts={hosts} akun={akun} saleToEdit={saleToEdit} />
      <ConfirmDeleteModal
        isOpen={isConfirmSaleDeleteOpen}
        onClose={handleCloseConfirmDeleteSale}
        onConfirm={handleDeleteSale}
        title="Hapus Data Penjualan"
        message={`Apakah Anda yakin ingin menghapus data penjualan ini? Tindakan ini tidak dapat diurungkan.`}
      />
      <TargetModal 
        isOpen={isTargetModalOpen}
        onClose={handleCloseTargetModal}
        targetToEdit={targetToEdit}
      />
      <ConfirmDeleteModal
        isOpen={isConfirmTargetDeleteOpen}
        onClose={handleCloseConfirmDeleteTarget}
        onConfirm={handleDeleteTarget}
        title="Hapus Target Bulanan"
        message={`Apakah Anda yakin ingin menghapus target ini? Tindakan ini tidak dapat diurungkan.`}
      />
    </div>
  );
};

export default Dashboard;