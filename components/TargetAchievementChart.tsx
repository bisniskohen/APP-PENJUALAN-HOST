import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface TargetChartData {
  name: string;
  Pencapaian: number;
}

interface TargetAchievementChartProps {
  data: TargetChartData[];
}

const TargetAchievementChart: React.FC<TargetAchievementChartProps> = ({ data }) => {
  
  if (data.length === 0) {
    return <div className="text-center text-slate-400 py-10">Tidak ada target yang ditetapkan untuk bulan ini.</div>;
  }

  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text x={x + width / 2} y={y} dy={-4} fill="#f1f5f9" fontSize={12} textAnchor="middle">
        {`${value}%`}
      </text>
    );
  };

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{
            top: 20, right: 30, left: 20, bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" unit="%" domain={[0, 'dataMax + 20']}/>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }}
            cursor={{fill: 'rgba(71, 85, 105, 0.5)'}}
            formatter={(value: number) => [`${value.toLocaleString('id-ID')}%`, 'Pencapaian']}
          />
          <Legend />
          <Bar dataKey="Pencapaian" fill="#0ea5e9">
             <LabelList dataKey="Pencapaian" content={renderCustomizedLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TargetAchievementChart;
