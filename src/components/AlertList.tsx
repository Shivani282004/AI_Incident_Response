// components/AlertList.tsx
import React, { useEffect, useState } from 'react';
import AlertCard from './AlertCard';
import { Alert } from '../types';

interface AlertListProps {
  onAlertClick?: (alert: Alert) => void;
}

const AlertList: React.FC<AlertListProps> = ({ onAlertClick }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8001/alerts')  
      .then(res => res.json())
      .then((data: Alert[]) => setAlerts(data))
      .catch(err => console.error('Failed to fetch alerts', err));
  }, []);

  return (
    <div className="space-y-3">
      {alerts.length === 0 ? (
        <div className="text-gray-400 text-sm">No alerts available.</div>
      ) : (
        alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} onClick={onAlertClick} />

        ))
      )}
    </div>
  );
};

export default AlertList;
