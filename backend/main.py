from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import httpx
import mysql.connector
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import json
import os

PROMETHEUS_URL = "http://localhost:9090"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


model = SentenceTransformer('all-MiniLM-L6-v2')


DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "Shivani@123",
    "database": "AIDB"
}

class Metrics(BaseModel):
    memory: Optional[float] = None
    cpu: Optional[float] = None
    load1: Optional[float] = None
    netIn: Optional[float] = None
    netOut: Optional[float] = None

class Alert(BaseModel):
    id: str
    title: str
    description: str
    severity: str
    status: str
    service: str
    timestamp: str
    metrics: Metrics
    labels: List[str]

class SemanticSearchRequest(BaseModel):
    title: str
    description: str
    top_k: Optional[int] = 5

class ActionResponse(BaseModel):
    id: str
    incident_id: str
    title: str
    description: str
    command: str
    similarity_score: float
    confidence: Optional[str] = None

class VectorStore:
    def __init__(self):
        self.embeddings = []
        self.actions = []
        self.action_texts = []
    
    def add_action(self, action_data: Dict[str, Any], embedding: np.ndarray):
        self.actions.append(action_data)
        self.embeddings.append(embedding)
        self.action_texts.append(f"{action_data['title']} {action_data['description']}")
    
    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> List[Dict[str, Any]]:
        if not self.embeddings:
            return []
        
        embeddings_matrix = np.array(self.embeddings)
        similarities = cosine_similarity([query_embedding], embeddings_matrix)[0]
        
        
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            action = self.actions[idx].copy()
            action['similarity_score'] = float(similarities[idx])
            results.append(action)
        
        return results
    
    def clear(self):
        self.embeddings = []
        self.actions = []
        self.action_texts = []


vector_store = VectorStore()

def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

def load_actions_to_vector_store():
    """Load all actions from database and create embeddings"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM actions")
        actions = cursor.fetchall()
        
        vector_store.clear()
        
        for action in actions:
            
            text = f"{action['title']} {action['description']}"
            embedding = model.encode(text)
            
            vector_store.add_action({
                'id': str(action.get('id', '')),
                'incident_id': action['incident_id'],
                'title': action['title'],
                'description': action['description'],
                'command': action['command']
            }, embedding)
        
        cursor.close()
        conn.close()
        
        print(f"Loaded {len(actions)} actions into vector store")
        
    except Exception as e:
        print(f"Error loading actions to vector store: {e}")

async def query_prometheus(metric: str) -> Optional[float]:
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{PROMETHEUS_URL}/api/v1/query", params={"query": metric})
            data = resp.json()
            if data["status"] == "success" and data["data"]["result"]:
                return float(data["data"]["result"][0]["value"][1])
        except Exception as e:
            print(f"Error querying Prometheus: {e}")
    return None

@app.on_event("startup")
async def startup_event():
    """Load actions into vector store on startup"""
    load_actions_to_vector_store()

@app.get("/alerts", response_model=List[Alert])
async def get_alerts():
    print("hi ,got get request")
    mem = await query_prometheus('node_memory_MemAvailable_bytes')
    cpu = await query_prometheus('100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100)')
    net_in = await query_prometheus('rate(node_network_receive_bytes_total[2m])')
    net_out = await query_prometheus('rate(node_network_transmit_bytes_total[2m])')
    
    print("Network in:", net_in)
    print("Network out:", net_out)
    print("mem:", mem)
    print("cpu:", cpu)
    
    alerts: List[Alert] = []

    
    if mem is not None and mem < 200 * 1024**3:  
        alerts.append(Alert(
            id="alert-mem",
            title="Low Memory",
            description="Available memory below 20GB",
            severity="critical",
            status="active",
            service="host.docker.internal",
            timestamp=datetime.utcnow().isoformat(),
            metrics=Metrics(memory=round(mem / (1024**3), 2)),
            labels=["memory"]
        ))

    
    if cpu is not None and cpu > 0.00000001:
        alerts.append(Alert(
            id="alert-cpu",
            title="High CPU Usage",
            description="CPU utilization above 0.00001%",
            severity="critical",
            status="active",
            service="host.docker.internal",
            timestamp=datetime.utcnow().isoformat(),
            metrics=Metrics(cpu=round(cpu, 2)),
            labels=["cpu"]
        ))

    
    if net_in is not None and net_in > 30.0:  
        alerts.append(Alert(
            id="alert-net-in",
            title="High Network Inbound",
            description="Inbound throughput above 1 MB/s",
            severity="warning",
            status="active",
            service="host.docker.internal",
            timestamp=datetime.utcnow().isoformat(),
            metrics=Metrics(netIn=round(net_in, 2)),
            labels=["network", "inbound"]
        ))

    
    if net_out is not None and net_out > 50.0:  
        alerts.append(Alert(
            id="alert-net-out",
            title="High Network Outbound",
            description="Outbound throughput above 1 MB/s",
            severity="info",
            status="active",
            service="host.docker.internal",
            timestamp=datetime.utcnow().isoformat(),
            metrics=Metrics(netOut=round(net_out, 2)),
            labels=["network", "outbound"]
        ))

    return alerts

@app.post("/api/semantic-search", response_model=List[ActionResponse])
async def semantic_search(request: SemanticSearchRequest):
    """
    Find semantically similar actions based on title and description
    """
    try:
        
        query_text = f"{request.title} {request.description}"
        query_embedding = model.encode(query_text)
        similar_actions = vector_store.search(query_embedding, top_k=request.top_k)
        similarity_threshold = 0.25  
        filtered_actions = [action for action in similar_actions if action['similarity_score'] > similarity_threshold]
        
        if not filtered_actions:
            return [] 
        
        
        results = []
        for action in filtered_actions:
            
            if action['similarity_score'] > 0.7:
                confidence = "high"
            elif action['similarity_score'] > 0.4:
                confidence = "medium"
            elif action['similarity_score'] > 0.25:
                confidence = "low"
            else:
                confidence = "very_low"
            
            results.append(ActionResponse(
                id=action['id'],
                incident_id=action['incident_id'],
                title=action['title'],
                description=action['description'],
                command=action['command'],
                similarity_score=action['similarity_score'],
                confidence=confidence 
            ))
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing semantic search: {str(e)}")

@app.post("/api/refresh-vector-store")
async def refresh_vector_store():
    """
    Refresh the vector store with latest actions from database
    """
    try:
        load_actions_to_vector_store()
        return {"message": f"Vector store refreshed with {len(vector_store.actions)} actions"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error refreshing vector store: {str(e)}")

@app.get("/api/vector-store-stats")
async def get_vector_store_stats():
    """
    Get statistics about the vector store
    """
    return {
        "total_actions": len(vector_store.actions),
        "embedding_dimension": len(vector_store.embeddings[0]) if vector_store.embeddings else 0,
        "model_name": "all-MiniLM-L6-v2"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
