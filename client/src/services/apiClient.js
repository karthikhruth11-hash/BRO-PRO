const API_BASE = '/api';
const AUTH_TOKEN = 'wednesday-secret-local-handshake-token-2026';

export async function sendChatMessage(message, persona = 'jarvis') {
  try {
    const groqKey = localStorage.getItem('wednesday_groq_key') || '';
    const openaiKey = localStorage.getItem('wednesday_openai_key') || '';
    const geminiKey = localStorage.getItem('wednesday_gemini_key') || '';

    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wednesday-token': AUTH_TOKEN
      },
      body: JSON.stringify({
        message,
        persona,
        options: {
          clientKeys: { groqKey, openaiKey, geminiKey }
        }
      })
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      response: `Failed to connect to local BRO AI server backend: ${err.message}`,
      provider: 'Offline Client Error'
    };
  }
}

export async function fetchTelemetry() {
  try {
    const res = await fetch(`${API_BASE}/telemetry`, {
      headers: { 'x-wednesday-token': AUTH_TOKEN }
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function fetchMemoryFacts() {
  try {
    const res = await fetch(`${API_BASE}/memory/facts`, {
      headers: { 'x-wednesday-token': AUTH_TOKEN }
    });
    return await res.json();
  } catch (err) {
    return { success: false, facts: [] };
  }
}

export async function deleteMemoryFact(factId) {
  try {
    const res = await fetch(`${API_BASE}/memory/facts/${factId}`, {
      method: 'DELETE',
      headers: { 'x-wednesday-token': AUTH_TOKEN }
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}

export async function clearMemoryFacts() {
  try {
    const res = await fetch(`${API_BASE}/memory/facts`, {
      method: 'DELETE',
      headers: { 'x-wednesday-token': AUTH_TOKEN }
    });
    return await res.json();
  } catch (err) {
    return { success: false };
  }
}
