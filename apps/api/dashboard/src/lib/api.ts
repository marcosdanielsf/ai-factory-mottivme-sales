const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface TestAgentRequest {
  agent_id: string
  test_cases?: string[]
}

export async function testAgent(agentId: string) {
  const response = await fetch(`${API_URL}/api/test-agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId })
  })
  return response.json()
}

export async function getAgentTests(agentId: string, page = 1, perPage = 20) {
  const response = await fetch(`${API_URL}/api/agent/${agentId}/tests?page=${page}&per_page=${perPage}`)
  return response.json()
}

export async function healthCheck() {
  const response = await fetch(`${API_URL}/health`)
  return response.json()
}
