"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Copy, ThumbsUp, ThumbsDown, AlertCircle, Activity, Bug, Key } from "lucide-react"

interface ChatMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: string
  metadata?: {
    metrics_count?: number
    logs_available?: number
    data_sources?: any
  }
}

interface ChatInterfaceProps {
  apiEndpoint?: string
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ apiEndpoint = "http://localhost:8000/api/chat" }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "ai",
      content:
        "**Welcome to AI Incident Response Assistant!**\n\n🤖 I'm powered by Google's Gemini AI and have access to:\n• Real-time system metrics\n• Live log analysis\n• Intelligent troubleshooting\n\n**Quick Start:**\n• Ask: 'What's the system status?'\n• Try: 'Are there any critical alerts?'\n• Or: 'Analyze recent errors'\n\n🔧 If you see mock responses, click the 'Test Gemini' button to check your API configuration.",
      timestamp: new Date().toISOString(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    testConnectivity()
  }, [])

  const testConnectivity = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/test")
      const data = await response.json()
      setDebugInfo(data)
      console.log("API Test Result:", data)
    } catch (error) {
      console.error(" API Test Failed:", error)
      setDebugInfo({ error: "API connection failed" })
    }
  }


  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: inputValue,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      console.log("Sending message:", inputValue)

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputValue,
        }),
      })

      console.log("Response status:", response.status)
      const data = await response.json()
      console.log("Response data:", data)

      if (response.ok) {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: "ai",
          content: data.response,
          timestamp: data.timestamp,
          metadata: {
            metrics_count: data.metrics_count,
            logs_available: data.logs_available,
            data_sources: data.data_sources,
          },
        }

        setMessages((prev) => [...prev, aiMessage])
      } else {
        throw new Error(data.error || `HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("Chat error:", error)

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: "ai",
        content: `**Communication Error**

${error instanceof Error ? error.message : "Unknown error"}

**Quick Fixes:**
1. Check if server is running: http://localhost:8000/api/test
2. Test Gemini API using the button below
3. Run debug check to identify issues
4. Verify all services are running

**If this persists:**
• Check server terminal for detailed logs
• Verify network connectivity
• Ensure API keys are properly configured`,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const handleQuickAction = (action: string) => {
    setInputValue(action)
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col max-w-10xl mx-auto">
     
      <div className="p-4 border-b border-gray-700 ">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">AI Incident Copilot</h2>
            <p className="text-sm text-gray-400">
              Powered by Gemini AI • API: {debugInfo?.error ? "❌ Failed" : "✅ Connected"} • Gemini:{" "}
              {debugInfo?.gemini_available ? "✅ Ready" : "❌ Not configured"}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            
            
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${debugInfo?.error ? "bg-red-400" : "bg-green-400 animate-pulse"}`}
              ></div>
              <span className={`text-xs font-medium ${debugInfo?.error ? "text-red-400" : "text-green-400"}`}>
                {debugInfo?.error ? "ERROR" : "LIVE"}
              </span>
            </div>
          </div>
        </div>
      </div>

      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[600px] hide-scrollbar scrollbar-none">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            {message.type === "ai" && (
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div className={`max-w-[80%] ${message.type === "user" ? "order-1" : ""}`}>
              <div
                className={`p-3 rounded-2xl ${
                  message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-100"
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>

                {message.metadata && (
                  <div className="mt-2 pt-2 border-t border-gray-600 flex items-center gap-4 text-xs text-gray-300">
                    {message.metadata.metrics_count !== undefined && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>{message.metadata.metrics_count} metrics</span>
                      </div>
                    )}
                    {message.metadata.logs_available !== undefined && (
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>{message.metadata.logs_available} logs</span>
                      </div>
                    )}
                    {message.metadata.data_sources && (
                      <div className="text-xs">
                        M:{message.metadata.data_sources.metrics_status === "fulfilled" ? "✅" : "❌"}
                        L:{message.metadata.data_sources.logs_status === "fulfilled" ? "✅" : "❌"}
                        AI:{message.metadata.data_sources.gemini_enabled ? "✅" : "❌"}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <span>{formatTimestamp(message.timestamp)}</span>
                {message.type === "ai" && (
                  <>
                    <button
                      onClick={() => copyToClipboard(message.content)}
                      className="hover:text-gray-300 transition-colors"
                      title="Copy response"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button className="hover:text-green-400 transition-colors" title="Good response">
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button className="hover:text-red-400 transition-colors" title="Poor response">
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {message.type === "user" && (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-700 p-3 rounded-2xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about system status, analyze alerts, investigate logs, or get troubleshooting help..."
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={1}
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>

        
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            onClick={() => handleQuickAction("What's the current system status?")}
            className="text-xs text-gray-400 hover:text-gray-300 px-2 py-1 bg-gray-700 rounded transition-colors"
          >
            System Status
          </button>
          <button
            onClick={() => handleQuickAction("Are there any critical alerts I should know about?")}
            className="text-xs text-gray-400 hover:text-gray-300 px-2 py-1 bg-gray-700 rounded transition-colors"
          >
            Critical Alerts
          </button>
          <button
            onClick={() => handleQuickAction("Analyze recent error logs and identify patterns")}
            className="text-xs text-gray-400 hover:text-gray-300 px-2 py-1 bg-gray-700 rounded transition-colors"
          >
            Analyze Logs
          </button>
          <button
            onClick={() => handleQuickAction("What performance issues do you see in the metrics?")}
            className="text-xs text-gray-400 hover:text-gray-300 px-2 py-1 bg-gray-700 rounded transition-colors"
          >
            Performance Issues
          </button>
          
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
