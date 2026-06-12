let BACKEND_URL = 'http://localhost:8000';

export function setBackendUrl(url) {
  if (!url) return;
  // Clean URL: trim spaces and remove trailing slash
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  // Ensure it has protocol
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'http://' + cleanUrl;
  }
  BACKEND_URL = cleanUrl;
}

export function getBackendUrl() {
  return BACKEND_URL;
}

async function request(endpoint, options = {}) {
  const url = `${BACKEND_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      // Handle Pydantic Validation Errors (422)
      if (response.status === 422) {
        const errorData = await response.json();
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const messages = errorData.detail.map(err => {
            const field = err.loc && err.loc.length > 1 ? err.loc.slice(1).join('.') : '';
            return field ? `${field}: ${err.msg}` : err.msg;
          });
          throw new Error(messages.join('\n'));
        }
      }
      
      // Handle other HTTP errors
      let errMsg = `Request failed with status ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.message) errMsg = errJson.message;
        else if (errJson.detail) errMsg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      } catch (_) {
        // Fallback to text if not json
        try {
          const errText = await response.text();
          if (errText) errMsg = errText.slice(0, 100);
        } catch (_) {}
      }
      throw new Error(errMsg);
    }

    // Return JSON if present
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return { success: true };
  } catch (error) {
    if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('Network request failed'))) {
      throw new Error(`Failed to connect to backend at ${BACKEND_URL}. Please verify the backend is running and the URL is correct.`);
    }
    throw error;
  }
}

export async function submitBenchmark(submission, concurrentUsers = 10, totalRequests = 50) {
  return await request(`/submit?concurrent_users=${concurrentUsers}&total_requests=${totalRequests}`, {
    method: 'POST',
    body: JSON.stringify(submission),
  });
}

export async function getBenchmarkResult(resultId) {
  return await request(`/results/${resultId}`);
}

export async function listBenchmarkResults(limit = 50) {
  return await request(`/results?limit=${limit}`);
}

export async function getLeaderboard(limit = 20) {
  return await request(`/leaderboard?limit=${limit}`);
}

export async function deleteBenchmarkResult(resultId) {
  return await request(`/results/${resultId}`, {
    method: 'DELETE',
  });
}

export async function testConnection() {
  const url = `${BACKEND_URL}/`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (_) {
    return false;
  }
}
