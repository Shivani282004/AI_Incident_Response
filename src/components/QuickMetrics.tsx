import { useEffect, useState } from "react";
import axios from "axios";

export default function KeyMetrics() {
  const [memory, setMemory] = useState(0); 
  const [cpu, setCpu] = useState<number | null>(null); 
  const [netIn, setNetIn] = useState<number | null>(null); 
  const [netOut, setNetOut] = useState<number | null>(null); 

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get("http://localhost:8001/alerts");
        const alerts = response.data;

        for (const alert of alerts) {
          if (alert.metrics.memory !== null) {
            const used = 100 - (alert.metrics.memory / 16) * 100;
            setMemory(Math.min(100, Math.round(used)));
          }
          if (alert.metrics.cpu !== null) {
            setCpu(alert.metrics.cpu);
          }
          if (alert.metrics.netIn !== null) {
            setNetIn(alert.metrics.netIn);
          }
          if (alert.metrics.netOut !== null) {
            setNetOut(alert.metrics.netOut);
          }
        }
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">Key Metrics</h2>
      <div className="grid grid-cols-2 gap-3">
        
        <MetricCard label="Memory Usage" value={`${memory}%`} percent={memory} color="bg-red-400" />

        
        <MetricCard
          label="CPU Usage"
          value={cpu !== null ? `${cpu.toFixed(2)}%` : "N/A"}
          percent={cpu !== null ? Math.min(100, cpu) : 0}
          color="bg-yellow-400"
        />


<MetricCard
  label="Network In"
  value={netIn !== null ? `${netIn.toFixed(2)} MB/s` : "N/A"}
  percent={netIn !== null ? Math.min(100, (netIn / 5000) * 100) : 0}
  color="bg-blue-400"
/>


<MetricCard
  label="Network Out"
  value={netOut !== null ? `${netOut.toFixed(2)} MB/s` : "N/A"}
  percent={netOut !== null ? Math.min(100, (netOut / 5000) * 100) : 0}
  color="bg-green-400"
/>


      </div>
    </div>
  );
}

function MetricCard({ label, value, percent, color }: { label: string; value: string; percent: number; color: string }) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}
