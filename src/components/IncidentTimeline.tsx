"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AlertTriangle, Save, Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface IncidentData {
  title: string
  description: string
  severity: string
  status: string
  assignee: string
}

interface ActionData {
  title: string
  description: string
  command: string
}

const IncidentTimeline = () => {
  const [incident, setIncident] = useState<IncidentData>({
    title: "",
    description: "",
    severity: "critical",
    status: "open", 
    assignee: "",
  })

  const [action, setAction] = useState<ActionData>({
    title: "",
    description: "",
    command: "",
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

   
    if (!incident.title.trim() || !incident.description.trim()) {
      setError("Title and description are required")
      setLoading(false)
      return
    }

    if (!action.title.trim() || !action.description.trim()) {
      setError("Action title and description are required")
      setLoading(false)
      return
    }

    const payload = {
      ...incident,
      action: {
        title: action.title.trim(),
        description: action.description.trim(),
        command: action.command.trim() || null,
      },
    }

    try {
      console.log("Sending payload:", payload)

      const response = await fetch("http://localhost:8000/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (response.ok) {
        
        setIncident({
          title: "",
          description: "",
          severity: "critical",
          status: "open",
          assignee: "",
        })
        setAction({
          title: "",
          description: "",
          command: "",
        })
        setSuccess(true)
        console.log("Incident created successfully:", result)
      } else {
       
        setError(result.error || `Server error: ${response.status}`)
        console.error("API Error:", result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error occurred")
      console.error("Network Error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 text-white p-6 rounded-lg border border-gray-700 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-6 h-6 text-orange-400" />
        <h2 className="text-xl font-semibold">Create New Incident</h2>
      </div>

      
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="text-green-400 font-medium">Incident submitted successfully!</span>
        </div>
      )}

      
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white border-b border-gray-600 pb-2">Incident Details</h3>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g., High CPU Usage Alert"
              className="w-full bg-gray-700 border border-gray-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={incident.title}
              onChange={(e) => setIncident({ ...incident, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              placeholder="Describe the incident in detail..."
              className="w-full bg-gray-700 border border-gray-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              value={incident.description}
              onChange={(e) => setIncident({ ...incident, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-gray-300 mb-2">
                Severity
              </label>
              <select
                id="severity"
                value={incident.severity}
                onChange={(e) => setIncident({ ...incident, severity: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                id="status"
                value={incident.status}
                onChange={(e) => setIncident({ ...incident, status: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="assignee" className="block text-sm font-medium text-gray-300 mb-2">
              Assignee
            </label>
            <input
              id="assignee"
              type="text"
              placeholder="e.g., admin, john.doe"
              className="w-full bg-gray-700 border border-gray-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={incident.assignee}
              onChange={(e) => setIncident({ ...incident, assignee: e.target.value })}
            />
          </div>
        </div>

        
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white border-b border-gray-600 pb-2">Resolution Action</h3>

          <div>
            <label htmlFor="actionTitle" className="block text-sm font-medium text-gray-300 mb-2">
              Action Title *
            </label>
            <input
              id="actionTitle"
              type="text"
              placeholder="e.g., Restart Application Service"
              className="w-full bg-gray-700 border border-gray-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={action.title}
              onChange={(e) => setAction({ ...action, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="actionDescription" className="block text-sm font-medium text-gray-300 mb-2">
              Action Description *
            </label>
            <textarea
              id="actionDescription"
              placeholder="Describe what this action does..."
              className="w-full bg-gray-700 border border-gray-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              value={action.description}
              onChange={(e) => setAction({ ...action, description: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="actionCommand" className="block text-sm font-medium text-gray-300 mb-2">
              Command (Optional)
            </label>
            <input
              id="actionCommand"
              type="text"
              placeholder="e.g., sudo systemctl restart myapp"
              className="w-full bg-gray-700 border border-gray-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              value={action.command}
              onChange={(e) => setAction({ ...action, command: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg text-white font-medium transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting Incident...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Submit Incident
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default IncidentTimeline
