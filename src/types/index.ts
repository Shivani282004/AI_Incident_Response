
export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  assignee: string;
  createdAt: string;
  resolvedAt?: string;
  timeline: IncidentEvent[];
  recommendations: Recommendation[];
  similarIncidents: string[];
}

export interface IncidentEvent {
  id: string;
  timestamp: string;
  type: 'created' | 'updated' | 'comment' | 'action' | 'resolved';
  user: string;
  description: string;
}

export interface Recommendation {
  id: string;
  type: 'root_cause' | 'remediation' | 'monitoring' | 'prevention';
  title: string;
  description: string;
  confidence: number;
  actions: RecommendationAction[];
  source: 'ai_analysis' | 'similar_incident' | 'runbook';
}

export interface RecommendationAction {
  id: string;
  type: 'command' | 'api_call' | 'manual' | 'notification';
  title: string;
  description: string;
  command?: string;
  automated: boolean;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  attachments?: {
    type: 'alert' | 'log' | 'metric' | 'runbook';
    data: any;
  }[];
}

export interface MetricData {
  timestamp: string;
  value: number;
}

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
    load1?: number;
  };
  labels: string[];
}


export interface ServiceMetrics {
  service: string;
  cpu: MetricData[];
  memory: MetricData[];
  latency: MetricData[];
  errorRate: MetricData[];
}

export interface SemanticSearchResult {
  id: string
  incident_id: string
  title: string
  description: string
  command: string
  similarity_score: number
  confidence?: string
}

export interface SemanticSearchRequest {
  title: string
  description: string
  top_k: number
}

// types/index.ts

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug' | string;
  service: string;
  message: string;
  metadata?: Record<string, any>;
}
