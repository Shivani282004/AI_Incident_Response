// index.js
import express from "express"
import mysql from "mysql2"
import cors from "cors"
import axios from "axios"
import dotenv from "dotenv"


dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

let genAI = null
let geminiModel = null

async function initializeGemini() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log("GEMINI_API_KEY not found in environment variables")
      console.log("Please set GEMINI_API_KEY in your .env file")
      return false
    }

    console.log("GEMINI_API_KEY found, initializing...")

    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })


    const testResult = await geminiModel.generateContent("Hello, respond with 'API key working'")
    const testResponse = await testResult.response
    console.log("Gemini API test:", testResponse.text())
    console.log("Gemini AI initialized successfully")
    return true
  } catch (error) {
    console.error("Failed to initialize Gemini AI:", error.message)
    if (error.message.includes("API_KEY_INVALID")) {
      console.log("Your API key appears to be invalid. Please check it at: https://makersuite.google.com/app/apikey")
    }
    return false
  }
}


const geminiReady = await initializeGemini()


const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Shivani@123",
  database: "AIDB",
})

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err)
    throw err
  }
  console.log("MySQL connected!")
})


async function fetchMetrics() {
  try {
    console.log("Fetching metrics from http://127.0.0.1:8001/alerts")
    const response = await axios.get("http://127.0.0.1:8001/alerts", {
      timeout: 5000,
    })
    console.log("Metrics fetched successfully:", response.data?.length || 0, "alerts")
    return response.data
  } catch (error) {
    console.error("Error fetching metrics:", error.message)
    return [
      {
        id: "mock-alert-1",
        title: "Metrics Service Unavailable",
        description: "Unable to fetch real metrics from alerts service",
        severity: "warning",
        status: "active",
        service: "monitoring",
        timestamp: new Date().toISOString(),
      },
    ]
  }
}


async function fetchLogs() {
  try {
    console.log("Fetching logs from Loki")
    const response = await axios.get("http://localhost:8080/loki/api/v1/query_range", {
      params: {
        query: '{job="varlogs"}',
        limit: 100,
      },
      timeout: 5000,
    })
    console.log("Logs fetched successfully")
    return response.data
  } catch (error) {
    console.error("Error fetching logs:", error.message)
    return {
      data: {
        result: [
          {
            stream: { job: "varlogs", level: "error" },
            values: [
              [Date.now().toString(), "ERROR: Loki service unavailable - using mock data"],
              [(Date.now() - 1000).toString(), "WARN: Check Loki connection at localhost:8080"],
            ],
          },
        ],
      },
    }
  }
}


async function getAIResponse(message, metrics, logs) {
  if (!geminiReady || !geminiModel) {
    return ` **Gemini AI Not Available**

Your message: "${message}"

**Issue:** Gemini API is not properly configured.

**Current Data:**
• Metrics: ${Array.isArray(metrics) ? metrics.length : 0} alerts
• Logs: ${logs?.data?.result?.length || 0} entries

**To fix this:**
1. Get your API key from: https://makersuite.google.com/app/apikey
2. Create a .env file in your project root:
   \`\`\`
   GEMINI_API_KEY=your-actual-api-key-here
   \`\`\`
3. Restart your server
4. Try again!

**Available without AI:**
• View current metrics and logs
• Basic system status
• Manual troubleshooting`
  }

  try {
    const systemContext = `You are an expert AI Incident Response Assistant analyzing real-time system data.

CURRENT SYSTEM METRICS (${Array.isArray(metrics) ? metrics.length : 0} alerts):
${JSON.stringify(metrics, null, 2)}

RECENT SYSTEM LOGS (${logs?.data?.result?.length || 0} entries):
${JSON.stringify(logs, null, 2)}

ANALYSIS INSTRUCTIONS:
- Provide concise, actionable responses (under 250 words)
- Focus on the most critical issues first
- Use bullet points for clarity
- Include specific commands when helpful
- If there are active alerts, prioritize them
- Analyze patterns in logs for insights
- Provide concrete next steps

USER QUESTION: ${message}

Respond as a knowledgeable system administrator who can quickly identify problems and provide solutions.`

    console.log("Sending request to Gemini API...")
    const result = await geminiModel.generateContent(systemContext)
    const response = await result.response
    const aiResponse = response.text()

    console.log("Gemini response received successfully")
    return aiResponse
  } catch (error) {
    console.error("Gemini API error:", error)

    if (error.message.includes("API_KEY_INVALID")) {
      return `**Invalid API Key**

Your Gemini API key is invalid or expired.

**Steps to fix:**
1. Go to https://makersuite.google.com/app/apikey
2. Generate a new API key
3. Update your .env file:
   \`\`\`
   GEMINI_API_KEY=your-new-api-key
   \`\`\`
4. Restart the server

**Current question:** "${message}"
**System status:** ${Array.isArray(metrics) ? metrics.length : 0} alerts, ${logs?.data?.result?.length || 0} log entries`
    }

    if (error.message.includes("quota")) {
      return `**API Quota Exceeded**

You've reached your Gemini API quota limit.

**Options:**
1. Wait for quota reset (usually daily)
2. Upgrade your API plan
3. Use a different API key

**Your question:** "${message}"
**System data available:** ${Array.isArray(metrics) ? metrics.length : 0} alerts, ${logs?.data?.result?.length || 0} logs`
    }

    return ` **Gemini API Error**

Error: ${error.message}

**Your question:** "${message}"
**Available data:** ${Array.isArray(metrics) ? metrics.length : 0} alerts, ${logs?.data?.result?.length || 0} log entries

**Troubleshooting:**
• Check your internet connection
• Verify API key is correct
• Try again in a moment
• Check Gemini API status`
  }
}


app.post("/api/chat", async (req, res) => {
  console.log("\n=== CHAT REQUEST START ===")

  try {
    const { message } = req.body
    console.log("User message:", message)

    if (!message) {
      console.log("No message provided")
      return res.status(400).json({ error: "Message is required" })
    }

 
    console.log("Fetching system data...")
    const startTime = Date.now()

    const [metrics, logs] = await Promise.allSettled([fetchMetrics(), fetchLogs()])

    const metricsData = metrics.status === "fulfilled" ? metrics.value : []
    const logsData = logs.status === "fulfilled" ? logs.value : { data: { result: [] } }

    console.log(`Data fetch completed in ${Date.now() - startTime}ms`)

 
    const aiResponse = await getAIResponse(message, metricsData, logsData)

    const responseData = {
      response: aiResponse,
      timestamp: new Date().toISOString(),
      metrics_count: Array.isArray(metricsData) ? metricsData.length : 0,
      logs_available: logsData?.data?.result?.length || 0,
      data_sources: {
        metrics_status: metrics.status,
        logs_status: logs.status,
        gemini_enabled: geminiReady,
        gemini_model: geminiReady ? "gemini-pro" : null,
      },
    }

    console.log("Chat response prepared successfully")
    console.log("=== CHAT REQUEST END ===\n")

    res.json(responseData)
  } catch (error) {
    console.error("CRITICAL CHAT ERROR:", error)
    console.error("Stack trace:", error.stack)

    res.status(500).json({
      error: "Failed to process chat request",
      details: error.message,
      timestamp: new Date().toISOString(),
      debug_info: {
        error_type: error.constructor.name,
        gemini_available: geminiReady,
      },
    })
  }
})

app.post("/api/test-gemini", async (req, res) => {
  try {
    if (!geminiReady || !geminiModel) {
      return res.json({
        status: "not_configured",
        message: "Gemini API not configured",
        api_key_set: !!process.env.GEMINI_API_KEY,
        instructions: "Set GEMINI_API_KEY in .env file and restart server",
      })
    }

    const testMessage = req.body.message || "Hello, please respond with a brief system status summary."

    console.log("Testing Gemini API with message:", testMessage)

    const result = await geminiModel.generateContent(testMessage)
    const response = await result.response
    const text = response.text()

    res.json({
      status: "working",
      test_message: testMessage,
      gemini_response: text,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Gemini test failed:", error)
    res.status(500).json({
      status: "error",
      error: error.message,
      api_key_set: !!process.env.GEMINI_API_KEY,
      suggestions: [
        "Check your API key at https://makersuite.google.com/app/apikey",
        "Verify internet connection",
        "Check API quota limits",
      ],
    })
  }
})

app.get("/api/debug", async (req, res) => {
  console.log("Debug endpoint called")

  try {
    const [metricsResult, logsResult] = await Promise.allSettled([fetchMetrics(), fetchLogs()])

    res.json({
      timestamp: new Date().toISOString(),
      gemini_available: geminiReady,
      gemini_api_key_set: !!process.env.GEMINI_API_KEY,
      gemini_api_key_length: process.env.GEMINI_API_KEY?.length || 0,
      data_sources: {
        metrics: {
          status: metricsResult.status,
          count: metricsResult.status === "fulfilled" ? metricsResult.value?.length : 0,
          error: metricsResult.status === "rejected" ? metricsResult.reason.message : null,
        },
        logs: {
          status: logsResult.status,
          count: logsResult.status === "fulfilled" ? logsResult.value?.data?.result?.length : 0,
          error: logsResult.status === "rejected" ? logsResult.reason.message : null,
        },
      },
    })
  } catch (error) {
    res.status(500).json({
      error: "Debug endpoint failed",
      details: error.message,
    })
  }
})

app.get("/api/system-status", async (req, res) => {
  try {
    const [metrics, logs] = await Promise.allSettled([fetchMetrics(), fetchLogs()])

    res.json({
      metrics: metrics.status === "fulfilled" ? metrics.value : [],
      logs: logs.status === "fulfilled" ? logs.value : { data: { result: [] } },
      timestamp: new Date().toISOString(),
      status: "healthy",
      data_sources: {
        metrics_status: metrics.status,
        logs_status: logs.status,
      },
    })
  } catch (error) {
    console.error("Error fetching system status:", error)
    res.status(500).json({
      error: "Failed to fetch system status",
      details: error.message,
    })
  }
})


app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working!",
    timestamp: new Date().toISOString(),
    gemini_available: geminiReady,
    env_check: {
      gemini_api_key: !!process.env.GEMINI_API_KEY,
      gemini_api_key_length: process.env.GEMINI_API_KEY?.length || 0,
      node_env: process.env.NODE_ENV || "development",
    },
  })
})

app.get("/api/logs", async (req, res) => {
  try {
    const logs = await fetchLogs()
    res.json(logs)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logs" })
  }
})

app.post("/api/incidents", (req, res) => {
  console.log("=== NEW INCIDENT REQUEST ===")
  console.log("Request body:", JSON.stringify(req.body, null, 2))

  const { title, description, severity, status, assignee, action } = req.body

  if (!title || !description) {
    console.log("Missing required incident fields")
    return res.status(400).json({
      error: "Missing required incident fields",
      required: ["title", "description"],
      received: {
        title: !!title,
        description: !!description,
      },
    })
  }

  if (!action || !action.title || !action.description) {
    console.log("Missing required action fields")
    return res.status(400).json({
      error: "Missing required action fields",
      required: ["action.title", "action.description"],
      received: {
        action: !!action,
        actionTitle: action?.title,
        actionDescription: action?.description,
      },
    })
  }

  const incidentId = `incident-${Date.now()}`

  const incidentData = {
    id: incidentId,
    title: title.trim(),
    description: description.trim(),
    severity: severity || "medium",
    status: status || "open",
    assignee: assignee?.trim() || "unassigned",
  }

  console.log("Validated incident data:", incidentData)

  const incidentQuery = `
    INSERT INTO incidents (id, title, description, severity, status, assignee)
    VALUES (?, ?, ?, ?, ?, ?)
  `

  db.query(
    incidentQuery,
    [
      incidentData.id,
      incidentData.title,
      incidentData.description,
      incidentData.severity,
      incidentData.status,
      incidentData.assignee,
    ],
    (err, incidentResult) => {
      if (err) {
        console.error(" Database error saving incident:", err)
        return res.status(500).json({
          error: "Database error saving incident",
          details: err.message,
          sqlState: err.sqlState,
          code: err.code,
        })
      }

      console.log("Incident saved successfully")

      const actionData = {
        incident_id: incidentId,
        title: action.title.trim(),
        description: action.description.trim(),
        command: action.command ? action.command.trim() : null,
      }

      console.log(" Validated action data:", actionData)

      const actionQuery = `
        INSERT INTO actions (incident_id, title, description, command)
        VALUES (?, ?, ?, ?)
      `

      db.query(
        actionQuery,
        [actionData.incident_id, actionData.title, actionData.description, actionData.command],
        async (err, actionResult) => {
          if (err) {
            console.error(" Database error saving action:", err)
            return res.status(500).json({
              error: "Database error saving action",
              details: err.message,
              sqlState: err.sqlState,
              code: err.code,
            })
          }

          console.log(" Action saved successfully")

          try {
            console.log(" Refreshing vector store...")
            await axios.post("http://localhost:8001/api/refresh-vector-store")
            console.log(" Vector store refreshed successfully")
          } catch (vectorError) {
            console.error(" Failed to refresh vector store:", vectorError.message)
          }

          console.log(" Incident creation completed successfully")
          res.status(201).json({
            message: "Incident and action saved successfully!",
            incident_id: incidentId,
            action_id: actionResult.insertId,
            data: {
              incident: incidentData,
              action: actionData,
            },
          })
        },
      )
    },
  )
})

app.get("/api/incidents", (req, res) => {
  const query = `
    SELECT 
      i.*,
      a.id as action_id, 
      a.title as action_title, 
      a.description as action_description, 
      a.command as action_command,
      a.created_at as action_created_at
    FROM incidents i
    LEFT JOIN actions a ON i.id = a.incident_id
    ORDER BY i.created_at DESC
  `

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching incidents:", err)
      return res.status(500).json({
        error: "Error fetching incidents",
        details: err.message,
      })
    }
    res.json(results)
  })
})

app.get("/api/actions", (req, res) => {
  const query = "SELECT * FROM actions ORDER BY created_at DESC"

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching actions:", err)
      return res.status(500).json({
        error: "Error fetching actions",
        details: err.message,
      })
    }
    res.json(results)
  })
})

app.post("/api/semantic-search", async (req, res) => {
  try {
    const response = await axios.post("http://localhost:8001/api/semantic-search", req.body)
    res.json(response.data)
  } catch (error) {
    console.error("Semantic search error:", error.message)
    if (error.response) {
      res.status(error.response.status).json({
        error: "Semantic search failed",
        details: error.response.data,
      })
    } else {
      res.status(500).json({
        error: "Failed to connect to semantic search service",
      })
    }
  }
})

app.get("/api/test-db", (req, res) => {
  db.query("SELECT 1 as test, NOW() as timestamp", (err, results) => {
    if (err) {
      return res.status(500).json({
        error: "Database connection failed",
        details: err.message,
      })
    }
    res.json({
      message: "Database connection successful",
      results,
      timestamp: new Date().toISOString(),
    })
  })
})

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "connected",
      server: "running",
    },
  })
})

app.listen(8000, () => {
  console.log(" Server running on http://localhost:8000")
  console.log(
    "  - Gemini API Key:",
    process.env.GEMINI_API_KEY ? `Set (${process.env.GEMINI_API_KEY.length} chars)` : "Missing",
  )
  console.log("  - Gemini Available:", geminiReady ? "Ready" : " Not configured")
  console.log("")
  console.log(" Next Steps:")
  if (!process.env.GEMINI_API_KEY) {
    console.log("  1. Get API key: https://makersuite.google.com/app/apikey")
    console.log("  2. Create .env file with: GEMINI_API_KEY=your-key-here")
    console.log("  3. Restart server")
  } else if (!geminiReady) {
    console.log("  1. Check your API key is valid")
    console.log("  2. Verify internet connection")
    console.log("  3. Restart server")
  } else {
    console.log("  All systems ready! Try the chat interface.")
  }
})
