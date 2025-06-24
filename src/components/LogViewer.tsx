import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';
import { LogEntry } from '../types/index';
import { fetchLogsFromLoki } from '../types/logService'; 

const LogViewer: React.FC = () => {

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedService, setSelectedService] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await fetchLogsFromLoki();
        setLogs(result);
      } catch (error) {
        console.error('Failed to fetch logs', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    const matchesService = selectedService === 'all' || log.service === selectedService;
    return matchesSearch && matchesLevel && matchesService;
  });

  const getLevelStyles = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-400 bg-red-400/20';
      case 'warn':
        return 'text-orange-400 bg-orange-400/20';
      case 'info':
        return 'text-blue-400 bg-blue-400/20';
      case 'debug':
        return 'text-gray-400 bg-gray-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const services = [...new Set(logs.map(log => log.service))];

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Application Logs</h2>
          <div className="flex gap-2">
            <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4 text-gray-300" />
            </button>
            <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
              <Download className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="error">Error</option>
            <option value="warn">Warning</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>

          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Services</option>
            {services.map(service => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-400">Loading...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-4 text-center text-gray-400">No logs found matching the current filters.</div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-750 transition-colors font-mono text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-gray-400 whitespace-nowrap">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getLevelStyles(log.level)}`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="text-blue-400 whitespace-nowrap">
                    [{log.service}]
                  </span>
                  <span className="text-gray-300 flex-1 leading-relaxed">
                    {log.message}
                  </span>
                </div>

                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-2 ml-20 pl-4 border-l border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {Object.entries(log.metadata).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="text-gray-400">{key}:</span>
                          <span className="text-gray-300">{JSON.stringify(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogViewer;
