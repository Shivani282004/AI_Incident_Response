"use client"

import type React from "react"
import { useState } from "react"
import { Search, Brain, Copy, AlertCircle, CheckCircle, Loader2 } from "lucide-react"

interface SemanticSearchResult {
  id: string
  incident_id: string
  title: string
  description: string
  command: string
  similarity_score: number
  confidence?: string
}

interface SemanticSearchCardProps {
  apiEndpoint?: string
}

const SemanticSearchCard: React.FC<SemanticSearchCardProps> = ({
  apiEndpoint = "http://localhost:8000/api/semantic-search",
}) => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [topK, setTopK] = useState(5)
  const [results, setResults] = useState<SemanticSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getConfidenceColor = (score: number) => {
    if (score > 0.7) return "text-green-400 bg-green-400/10 border-green-400"
    if (score > 0.4) return "text-yellow-400 bg-yellow-400/10 border-yellow-400"
    if (score > 0.25) return "text-orange-400 bg-orange-400/10 border-orange-400"
    return "text-red-400 bg-red-400/10 border-red-400"
  }

  const getConfidenceLabel = (score: number) => {
    if (score > 0.7) return "High"
    if (score > 0.4) return "Medium"
    if (score > 0.25) return "Low"
    return "Very Low"
  }

  const handleSearch = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Please provide both title and description")
      return
    }

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          top_k: topK,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResults(data)

      if (data.length === 0) {
        setError("No similar solutions found. Try using more specific keywords or lowering the similarity threshold.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch results")
    } finally {
      setLoading(false)
    }
  }

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSearch()
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">AI-Powered Solution Search</h2>
      </div>

     
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
            Issue Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., High CPU Usage, Memory Leak, Network Issues"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
            Issue Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe the problem in detail... e.g., Server experiencing slow response times and high processor utilization"
            rows={3}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex items-center gap-4">
          <div>
            <label htmlFor="topK" className="block text-sm font-medium text-gray-300 mb-2">
              Number of Solutions
            </label>
            <select
              id="topK"
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>1 </option>
              <option value={2}>2 </option>
              <option value={3}>3 </option>
              <option value={4}>4 </option>
              <option value={5}>5 </option>
              <option value={6}>6 </option>
              <option value={7}>7 </option>
              <option value={8}>8 </option>
              <option value={9}>9 </option>
              <option value={10}>10 </option>
            </select>
          </div>

          <div className="flex-1 flex justify-end items-end">
            <button
              onClick={handleSearch}
              disabled={loading || !title.trim() || !description.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Find Solutions
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400">💡 Tip: Press Ctrl+Enter to search quickly</p>
      </div>

      
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Found {results.length} Similar Solution{results.length !== 1 ? "s" : ""}
            </h3>
            <span className="text-sm text-gray-400">Sorted by relevance</span>
          </div>

          {results.map((result, index) => (
            <div key={result.id} className="bg-gray-900 rounded-lg border border-gray-600 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-bold rounded-full">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-white font-semibold">{result.title}</h4>
                    <p className="text-xs text-gray-400">
                      ID: {result.id} | Incident: {result.incident_id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(result.similarity_score)}`}
                  >
                    {getConfidenceLabel(result.similarity_score)}
                  </div>
                  <span className="text-xs text-gray-400">{Math.round(result.similarity_score * 100)}% match</span>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-4 leading-relaxed">{result.description}</p>

              {result.command && (
                <div className="bg-black rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-medium">Command to Execute:</span>
                    <button
                      onClick={() => copyCommand(result.command)}
                      className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-xs"
                      title="Copy command"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                  <code className="text-green-400 text-sm font-mono block break-all">{result.command}</code>
                </div>
              )}

              {result.similarity_score > 0.7 && (
                <div className="mt-3 flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  Highly recommended solution
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      
      {!loading && !error && results.length === 0 && title && description && (
        <div className="text-center py-8 text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Enter your issue details above and click "Find Solutions" to get AI-powered recommendations.</p>
        </div>
      )}
    </div>
  )
}

export default SemanticSearchCard
