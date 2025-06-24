import axios from 'axios';
import { LogEntry } from '../types';

export const fetchLogsFromLoki = async (): Promise<LogEntry[]> => {
  const response = await axios.get('http://localhost:8080/loki/api/v1/query_range', {
    params: {
      query: '{job="varlogs"}',
      limit: 100,
      direction: 'backward',
    },
  });

  const results = response.data?.data?.result;
  if (!results) {
    console.error('Unexpected Loki response structure:', response.data);
    return [];
  }

  const logs: LogEntry[] = [];

  for (const stream of results) {
    const streamLabels = stream.stream;

    for (const [timestamp, line] of stream.values) {
      logs.push({
        id: `${streamLabels.job}-${timestamp}`,
        timestamp: new Date(Number(timestamp / 1e6)).toISOString(),
        level: detectLogLevel(line),
        service: streamLabels.job,
        message: line,
        metadata: streamLabels,
      });
    }
  }

  return logs;
};

const detectLogLevel = (line: string): LogEntry['level'] => {
  const lower = line.toLowerCase();
  if (lower.includes('error')) return 'error';
  if (lower.includes('warn')) return 'warn';
  if (lower.includes('info')) return 'info';
  if (lower.includes('debug')) return 'debug';
  return 'info';
};
