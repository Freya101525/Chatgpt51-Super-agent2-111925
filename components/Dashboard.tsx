import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ExecutionLog, FlowerTheme } from '../types';

interface DashboardProps {
  logs: ExecutionLog[];
  theme: FlowerTheme;
}

export const Dashboard: React.FC<DashboardProps> = ({ logs, theme }) => {
  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-2xl bg-white/40 backdrop-blur-sm border-2 border-dashed" style={{ borderColor: theme.primary }}>
        <p className="text-lg opacity-60 font-medium">No execution data available yet.</p>
      </div>
    );
  }

  const tokenData = logs.map(log => ({
    name: log.agentName.length > 10 ? log.agentName.substring(0, 10) + '...' : log.agentName,
    tokens: log.tokens,
    latency: parseFloat(log.latency.toFixed(2))
  }));

  const totalTokens = logs.reduce((acc, curr) => acc + curr.tokens, 0);
  const avgLatency = (logs.reduce((acc, curr) => acc + curr.latency, 0) / logs.length).toFixed(2);

  const COLORS = [theme.primary, theme.secondary, theme.accent, '#8884d8', '#82ca9d'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
      {/* Metrics Cards */}
      <div className="col-span-1 md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-white/60 backdrop-blur shadow-sm border border-white/50">
          <p className="text-sm font-medium opacity-60">Total Executions</p>
          <p className="text-3xl font-bold" style={{ color: theme.accent }}>{logs.length}</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/60 backdrop-blur shadow-sm border border-white/50">
          <p className="text-sm font-medium opacity-60">Total Tokens</p>
          <p className="text-3xl font-bold" style={{ color: theme.accent }}>{totalTokens.toLocaleString()}</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/60 backdrop-blur shadow-sm border border-white/50">
          <p className="text-sm font-medium opacity-60">Avg Latency</p>
          <p className="text-3xl font-bold" style={{ color: theme.accent }}>{avgLatency}s</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/60 backdrop-blur shadow-sm border border-white/50">
          <p className="text-sm font-medium opacity-60">Efficiency Score</p>
          <p className="text-3xl font-bold" style={{ color: theme.accent }}>98%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="h-80 p-4 rounded-2xl bg-white/60 backdrop-blur shadow-sm border border-white/50">
        <h3 className="text-lg font-semibold mb-4 ml-2">Token Usage by Agent</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={tokenData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ccc" vertical={false} />
            <XAxis dataKey="name" tick={{fontSize: 12}} />
            <YAxis />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Bar dataKey="tokens" fill={theme.primary} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-80 p-4 rounded-2xl bg-white/60 backdrop-blur shadow-sm border border-white/50">
        <h3 className="text-lg font-semibold mb-4 ml-2">Latency Distribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={tokenData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="latency"
            >
              {tokenData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};