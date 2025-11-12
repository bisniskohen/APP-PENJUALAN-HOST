import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sale, Host } from '../types';

interface SalesChartProps {
  sales: Sale[];
  hosts: Host[];
}

const SalesChart: React.FC<SalesChartProps> = ({ sales, hosts }) => {
  const chartData = useMemo(() => {
    if (!sales.length || !hosts.length) return [];

    const salesByHost: { [key: string]: number } = {};
    
    hosts.forEach(host => {
        salesByHost[host.id] = 0;
    });

    sales.forEach(sale => {
      if (salesByHost[sale.hostId] !== undefined) {
        salesByHost[sale.hostId] += (sale.omsetAkhir - sale.omsetAwal);
      }
    });

    return hosts.map(host => ({
      name: host.name,
      Omset: salesByHost[host.id] || 0,
    }));
  }, [sales, hosts]);
  
  if (chartData.length === 0) {
    return <div className="text-center text-slate-400 py-10">Tidak ada data penjualan untuk ditampilkan di grafik.</div>;
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{
            top: 5, right: 30, left: 20, bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" tickFormatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }}
            cursor={{fill: 'rgba(71, 85, 105, 0.5)'}}
            formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
          />
          <Legend />
          <Bar dataKey="Omset" fill="#4f46e5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;