import axios from 'axios';
import { Alert } from '../types';

export const fetchAlerts = async (): Promise<Alert[]> => {
  const response = await axios.get('http://localhost:8001/alerts');
  return response.data;
};
