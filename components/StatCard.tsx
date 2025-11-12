
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm overflow-hidden shadow-lg rounded-xl">
      <div className="p-5">
        <dl>
          <dt className="text-sm font-medium text-slate-400 truncate">{title}</dt>
          <dd className="mt-1 text-3xl font-semibold text-white">{value}</dd>
        </dl>
      </div>
    </div>
  );
};

export default StatCard;
