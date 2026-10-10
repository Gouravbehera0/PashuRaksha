/**
 * PASHURAKSHA (पशुरक्षा) — LOCAL BACKEND SERVER
 * Tagline: "Detect Early. Prevent Outbreaks. Protect Livestock."
 * 
 * Standalone zero-dependency local backend service for development & offline testing.
 * Provides REST endpoints for health checks, risk evaluations, and mock Supabase status.
 */

import http from 'node:http'
import url from 'node:url'

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 54321

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'Content-Type': 'application/json'
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, CORS_HEADERS)
  res.end(JSON.stringify(data, null, 2))
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true)
  const pathname = parsedUrl.pathname

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  // 1. Health check & Root endpoint
  if (pathname === '/' || pathname === '/health' || pathname === '/api/health') {
    sendJson(res, 200, {
      status: 'UP',
      service: 'PashuRaksha Localhost Backend Gateway',
      version: '1.0.0',
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      tagline: 'Detect Early. Prevent Outbreaks. Protect Livestock.',
      subsystems: {
        risk_engine: 'ONLINE (Heuristic Expert Matrix)',
        outbreak_clustering: 'ONLINE (Haversine Spatio-Temporal)',
        iot_telemetry: 'ONLINE (Biometric Fever & Rumen Stream)',
        offline_sync_gateway: 'ONLINE (Idempotency Token Replay)',
        pilot_validation_desk: 'ONLINE (Phase 1 Varanasi District)'
      }
    })
    return
  }

  // 2. Platform Status & Metrics
  if (pathname === '/api/status') {
    sendJson(res, 200, {
      environment: 'localhost',
      database: 'PostgreSQL / Supabase (Local Fallback & In-Memory Store)',
      active_pilot_id: 'PILOT-UP-VARANASI-2026',
      target_district: 'Varanasi (Uttar Pradesh)',
      blocks: ['Kashi Vidyapeeth', 'Harhua', 'Chiraigaon'],
      monitored_villages: 5,
      active_personas: ['demo-farmer', 'demo-vet', 'demo-admin'],
      api_routes: [
        'GET /health',
        'GET /api/status',
        'POST /api/risk/evaluate',
        'GET /api/pilot/summary'
      ]
    })
    return
  }

  // 3. Pilot Summary Dossier
  if (pathname === '/api/pilot/summary') {
    sendJson(res, 200, {
      pilot_id: 'PILOT-UP-VARANASI-2026',
      phase: 'Phase 1 Controlled Supervised Field Pilot',
      readiness_score: 95,
      stages_audited: 11,
      blockers: 0,
      recommendation: 'GO_FOR_CONTROLLED_FIELD_PILOT',
      justification: 'Zero architectural blockers. Risk engine, clustering, and offline sync certified.'
    })
    return
  }

  // 4. Standalone Risk Evaluation Endpoint
  if (pathname === '/api/risk/evaluate' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}')
        const symptoms = payload.symptoms || []
        
        // Explainable rule-based scoring formula:
        let score = 10
        const factors = []

        if (symptoms.includes('high_fever') || symptoms.includes('fever')) {
          score += 25
          factors.push({ name: 'Pyrexia (High Fever)', points: 25, category: 'symptom' })
        }
        if (symptoms.includes('mouth_blisters') || symptoms.includes('vesicles')) {
          score += 30
          factors.push({ name: 'Vesicular Lesions', points: 30, category: 'severity' })
        }
        if (symptoms.includes('excessive_salivation') || symptoms.includes('drooling')) {
          score += 15
          factors.push({ name: 'Excessive Salivation (Stringy Drooling)', points: 15, category: 'contagion' })
        }
        if (symptoms.includes('lameness')) {
          score += 15
          factors.push({ name: 'Pedal Lesions / Lameness', points: 15, category: 'symptom' })
        }

        score = Math.min(100, score)
        const level = score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW'

        sendJson(res, 200, {
          case_id: payload.case_id || 'LOCAL-EVAL-' + Date.now(),
          risk_score: score,
          risk_level: level,
          factors,
          evaluated_at: new Date().toISOString()
        })
      } catch {
        sendJson(res, 400, { error: 'Invalid JSON payload' })
      }
    })
    return
  }

  // 5. Supabase Mock Health Endpoints
  if (pathname.startsWith('/auth/v1') || pathname.startsWith('/rest/v1')) {
    sendJson(res, 200, {
      message: 'PashuRaksha Local Supabase Gateway Stub',
      status: 'active',
      hint: 'To connect a live PostgreSQL instance, execute migrations in supabase/migrations/ with Supabase CLI'
    })
    return
  }

  // 404 Not Found
  sendJson(res, 404, {
    error: 'Endpoint not found',
    available_endpoints: ['/health', '/api/status', '/api/pilot/summary', '/api/risk/evaluate']
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`=======================================================`)
  console.log(`[PashuRaksha] Localhost Backend Server running on http://127.0.0.1:${PORT}`)
  console.log(`[PashuRaksha] Health Check: http://127.0.0.1:${PORT}/health`)
  console.log(`[PashuRaksha] Status API:   http://127.0.0.1:${PORT}/api/status`)
  console.log(`=======================================================`)
})
