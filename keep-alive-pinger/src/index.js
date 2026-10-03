export default {
  // 1. Cron Trigger Handler
  async scheduled(event, env, ctx) {
    // waitUntil ensures the worker doesn't stop before the pings complete
    ctx.waitUntil(this.doPings(env));
  },

  // 2. HTTP Handler (for viewing logs)
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Serve the last ping results at the root path
    if (url.pathname === '/') {
      const lastResults = await env.PING_RESULTS.get('LAST_PINGS');
      if (!lastResults) {
        return new Response(JSON.stringify({ message: 'No ping data available yet. Wait 10 minutes for the first cron run.' }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(lastResults, {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response('Not found', { status: 404 });
  },

  // 3. Main Ping Logic
  async doPings(env) {
    const rawUrls = env.PING_URLS || '';
    const urls = rawUrls.split(',').map(u => u.trim()).filter(Boolean);
    
    if (urls.length === 0) {
      console.log('No URLs configured in PING_URLS');
      return;
    }

    const results = [];
    const timestamp = new Date().toISOString();

    for (const url of urls) {
      let result = { url, timestamp };
      const start = Date.now();
      
      try {
        result.status = await this.pingUrlWithRetry(url);
      } catch (error) {
        result.error = error.message;
        result.status = 'failed';
      }
      
      result.responseTimeMs = Date.now() - start;
      results.push(result);
      console.log(`[${timestamp}] Pinged ${url} - Status: ${result.status} in ${result.responseTimeMs}ms`);
    }

    // Save results to Cloudflare KV storage
    await env.PING_RESULTS.put('LAST_PINGS', JSON.stringify({
      lastRun: timestamp,
      results
    }));
  },

  // 4. Helper with 30s timeout and 1 retry
  async pingUrlWithRetry(url, retries = 1) {
    for (let i = 0; i <= retries; i++) {
      try {
        // Render cold starts can be slow, giving it 30 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'KeepAliveWorker/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        // Treat 200-299 as success
        if (response.ok) {
          return response.status;
        }
        
        // If it failed and we have no retries left, return the failed status
        if (i === retries) return response.status;
        
      } catch (error) {
        // If it's a network error/timeout and we're out of retries, throw it
        if (i === retries) throw error;
      }
      
      // Wait 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};
