import React from 'react';
import { LogEntry } from '../types/index';

interface LogListProps {
  logs: LogEntry[];
  title: string;
}

const LogList: React.FC<LogListProps> = ({ logs, title }) => {
  return (
    <div className="p-4 text-white">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {logs.length === 0 ? (
        <div>No logs found.</div>
      ) : (
        <ul className="space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="bg-gray-800 p-2 rounded">
              <div className="text-sm text-gray-400">{log.timestamp}</div>
              <div className="text-base">{log.message}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LogList;
