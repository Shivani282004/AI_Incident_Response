import React, { useEffect, useState } from 'react';
import axios from 'axios';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  timestamp: string;
  service: string;
  metrics?: {
    cpu?: number;
    memory?: number;
    latency?: number;
    errorRate?: number;
    netIn?: number;
    netOut?: number;
  };
  labels: string[];
}

export interface MetricData {
  timestamp: string;
  value: number;
}

interface MetricsChartProps {
  title: string;
  data: MetricData[];
  unit: string;
  color: string;
  threshold?: number;
}

const Chart: React.FC<MetricsChartProps> = ({ title, data, unit, color, threshold }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  const currentValue = data[data.length - 1]?.value || 0;
  const previousValue = data[data.length - 2]?.value || 0;
  const trend = currentValue - previousValue;

  const format = (v: number) =>
    unit === '%' ? `${v.toFixed(1)}%` : unit === 'ms' ? `${Math.round(v)}ms` : `${v.toFixed(2)}${unit}`;

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h3 className="text-white font-semibold text-sm mb-2">{title}</h3>
      <div className="text-xl text-white font-bold mb-2">{format(currentValue)}</div>
      {threshold && <div className="text-xs text-gray-400 mb-1">Threshold: {format(threshold)}</div>}

      <svg viewBox="0 0 100 100" className="w-full h-20">
        {threshold && (
          <line
            x1="0"
            y1={100 - ((threshold - minValue) / range) * 100}
            x2="100"
            y2={100 - ((threshold - minValue) / range) * 100}
            stroke="red"
            strokeWidth="0.5"
            strokeDasharray="2,2"
            opacity="0.7"
          />
        )}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={data.map((point, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((point.value - minValue) / range) * 100;
            return `${x},${y}`;
          }).join(' ')}
        />
      </svg>
    </div>
  );
};

const getUnit = (key: string) => {
  if (key.includes('cpu')) return '%';
  if (key.includes('memory')) return 'GB';
  if (key.includes('net')) return 'B/s';
  if (key.includes('latency')) return 'ms';
  if (key.includes('error')) return '/s';
  return '';
};

const getColor = (key: string) => {
  const colorMap: Record<string, string> = {
    cpu: '#3b82f6',
    memory: '#ef4444',
    netIn: '#10b981',
    netOut: '#f59e0b',
    latency: '#8b5cf6',
    errorRate: '#f472b6',
  };
  return colorMap[key] || '#a78bfa';
};

const getThreshold = (key: string) => {
  const map: Record<string, number> = {
    cpu: 80,
    memory: 90,
    netIn: 100,
    netOut: 100,
    latency: 1000,
    errorRate: 0.01,
  };
  return map[key];
};

const MetricsChart: React.FC = () => {
  const [metricSeries, setMetricSeries] = useState<Record<string, MetricData[]>>({});

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await axios.get<Alert[]>('http://localhost:8001/alerts');
        const timestamp = new Date().toISOString();
        const updated: Record<string, MetricData[]> = { ...metricSeries };

        res.data.forEach(alert => {
          if (alert.status === 'active' && alert.metrics) {
            Object.entries(alert.metrics).forEach(([key, value]) => {
              if (value != null) {
                if (!updated[key]) updated[key] = [];
                updated[key] = [...updated[key].slice(-19), { timestamp, value }];
              }
            });
          }
        });

        setMetricSeries(updated);
      } catch (e) {
        console.error('Failed to fetch alerts', e);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [metricSeries]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Object.entries(metricSeries).map(([key, data]) => (
        <Chart
          key={key}
          title={
            key
              ? key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())
              : ''
          }
          data={data}
          unit={getUnit(key)}
          color={getColor(key)}
          threshold={getThreshold(key)}
        />
      ))}
    </div>
  );
};

export default MetricsChart;
