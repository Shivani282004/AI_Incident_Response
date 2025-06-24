import React, { useState, useEffect } from 'react';
import { AlertTriangle, Brain, Activity, MessageCircle, FileText, Settings, Bell, RefreshCw } from 'lucide-react';
import AlertCard from './components/AlertCard';
import QuickMetrics from './components/QuickMetrics';
import ChatInterface from './components/ChatInterface';
import IncidentTimeline from './components/IncidentTimeline';
import LogViewer from './components/LogViewer';
import MetricsChart from './components/MetricsChart';
import SemanticSearchCard from './components/semantic-search-card';
import axios from 'axios';
import { Alert, ChatMessage, Incident } from './types';


type TabType = 'overview' | 'logs' | 'metrics' | 'incident' | 'chat';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview'); 
const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

 
 useEffect(() => {
  if (!isAutoRefresh) return;

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('http://localhost:8001/alerts');
      setAlerts(response.data);
    } catch (err) {
      console.error("Error fetching alerts:", err);
    }
  };

  fetchAlerts();
  const interval = setInterval(fetchAlerts, 10000);
  return () => clearInterval(interval);
}, [isAutoRefresh]);

  const handleSendMessage = (message: string) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

   
    setTimeout(() => {
      const aiResponses = [
        "I'm analyzing the current logs and metrics. Based on the patterns, this appears to be related to the memory leak we identified earlier. I recommend scaling up the service instances immediately.",
        "I've found 3 similar incidents in our historical data with 89% similarity. The most effective resolution was restarting the affected pods and applying the memory optimization patch.",
        "Current incident severity suggests immediate escalation. I've prepared kubectl commands for emergency remediation and notified the on-call engineer.",
        "Analysis complete. Root cause identified as connection pool exhaustion in the database layer. I recommend increasing the pool size and implementing connection timeouts."
      ];

      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        type: 'ai',
        content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        timestamp: new Date().toISOString()
      };

    }, 2000);
  };

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    if (alert.severity === 'critical') {
      setActiveTab('incident');
    }
  };

  const handleExecuteAction = (actionId: string) => {
    console.log(`Executing action: ${actionId}`);
    
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'overview': return <Activity className="w-4 h-4" />;
      case 'logs': return <FileText className="w-4 h-4" />;
      case 'metrics': return <Activity className="w-4 h-4" />;
      case 'incident': return <AlertTriangle className="w-4 h-4" />;
      case 'chat': return <MessageCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActiveAlertCount = () => alerts.filter(alert => alert.status === 'active').length;
  const getCriticalAlertCount = () => alerts.filter(alert => alert.severity === 'critical' && alert.status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
     
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AI Incident Response Copilot</h1>
                <p className="text-sm text-gray-400">Production Environment Monitoring</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">{getCriticalAlertCount()} Critical</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                <Bell className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-orange-400">{getActiveAlertCount()} Active</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`p-2 rounded-lg transition-colors ${isAutoRefresh ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}
              >
                <RefreshCw className={`w-4 h-4 ${isAutoRefresh ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <Settings className="w-4 h-4 text-gray-300" />
              </button>
            </div>
          </div>
        </div>

        
        <nav className="flex gap-1 mt-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'logs', label: 'Logs' },
            { id: 'metrics', label: 'Metrics' },
            { id: 'incident', label: 'Incident' },
            { id: 'chat', label: 'AI Copilot' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {getTabIcon(tab.id as TabType)}
              <span className="font-medium">{tab.label}</span>
              {tab.id === 'chat'  && (
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              )}
            </button>
          ))}
        </nav>
      </header>

     
      <main className="p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
            <div className="lg:col-span-1 space-y-6" style={{marginLeft: '2rem'}}>
              <div style={{marginLeft: '2rem'}}>
                <h2 className="text-lg font-semibold text-white mb-4">Active Alerts</h2>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <AlertCard 
                      key={alert.id} 
                      alert={alert} 
                      onClick={handleAlertClick}
                    />
                  ))}
                </div>
              </div>

            
              <QuickMetrics />
            </div>

           
            <div className="lg:col-span-2 space-y-6">
              {(
                <div style={{marginTop: '4rem',marginLeft: '2rem'}}>
                  <IncidentTimeline />
                </div>
              )}

                <div className="min-h-screen bg-gray-900 p-4">
      <div className="container mx-auto py-8 mr-auto">
        <SemanticSearchCard />
      </div>
    </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            <LogViewer />
          </div>
        )}

        {activeTab === 'metrics' && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <MetricsChart />
  </div>
)}




        {activeTab === 'incident'  && (
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <div className="xl:col-span-2">
      <IncidentTimeline  />
    </div>

    <div className="min-h-screen bg-gray-900 p-4">
      <div className="container mx-auto py-8">
        <SemanticSearchCard />
      </div>
    </div>

  </div>
)}


        {activeTab === 'chat' && (
          <div className="min-h-screen bg-gray-900 p-4">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">AI Incident Management</h1>
          <p className="text-gray-400">Real-time system monitoring with AI-powered analysis</p>
        </div>
        <ChatInterface />
      </div>
    </div>
        )}
      </main>
    </div>
  );
}

export default App;