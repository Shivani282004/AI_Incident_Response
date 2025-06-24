import React from 'react';
import { AlertTriangle, Clock, Server, TrendingUp } from 'lucide-react';
import { Alert } from '../types';

interface AlertCardProps {
  alert: Alert;
  onClick?: (alert: Alert) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onClick }) => {
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-500/10';
      case 'warning':
        return 'border-orange-500 bg-orange-500/10';
      case 'info':
        return 'border-blue-500 bg-blue-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-red-400 bg-red-400/20';
      case 'acknowledged':
        return 'text-orange-400 bg-orange-400/20';
      case 'resolved':
        return 'text-green-400 bg-green-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const formatTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    }
    return `${minutes}m ago`;
  };

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${getSeverityStyles(alert.severity)}`}
      onClick={() => onClick?.(alert)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-5 h-5 ${alert.severity === 'critical' ? 'text-red-400' : alert.severity === 'warning' ? 'text-orange-400' : 'text-blue-400'}`} />
          <h3 className="font-semibold text-white text-sm">{alert.title}</h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(alert.status)}`}>
          {alert.status.toUpperCase()}
        </span>
      </div>

      <p className="text-gray-300 text-sm mb-3 leading-relaxed">{alert.description}</p>

      <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Server className="w-3 h-3" />
          <span>{alert.service}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{formatTime(alert.timestamp)}</span>
        </div>
      </div>

      {alert.metrics && (
        <div className="grid grid-cols-2 gap-2">
          {alert.metrics.cpu && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-blue-400" />
              <span className="text-gray-400">CPU:</span>
              <span className="text-white font-medium">{alert.metrics.cpu}%</span>
            </div>
          )}
          {alert.metrics.memory && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-purple-400" />
              <span className="text-gray-400">Memory:</span>
              <span className={`font-medium ${alert.metrics.memory > 80 ? 'text-red-400' : 'text-white'}`}>
                {alert.metrics.memory}%
              </span>
            </div>
          )}
          {alert.metrics.latency && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-gray-400">Latency:</span>
              <span className="text-white font-medium">{alert.metrics.latency}ms</span>
            </div>
          )}
          {alert.metrics.errorRate && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-red-400" />
              <span className="text-gray-400">Errors:</span>
              <span className="text-white font-medium">{(alert.metrics.errorRate * 100).toFixed(2)}%</span>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1 mt-3">
        {alert.labels.map((label, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AlertCard;