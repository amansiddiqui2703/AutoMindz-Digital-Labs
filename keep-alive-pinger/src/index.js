export default {
  // 1. Cron Trigger Handler (Runs every 5 minutes)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(this.doPings(env));
  },

  // 2. HTTP Handler (for viewing logs / manual ping test)
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Serve the last ping results or trigger an immediate test ping
    if (url.pathname === '/') {
      let lastResults = null;
      if (env.PING_RESULTS) {
        try {
          lastResults = await env.PING_RESULTS.get('LAST_PINGS');
        } catch {
          /* ignore KV errors */
        }
      }

      if (!lastResults) {
        return new Response(JSON.stringify({ 
          status: 'ok',
          message: 'Pinger is active! Running every 5 minutes.',
          pingUrls: env.PING_URLS || 'Not configured'
        }, null, 2), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(lastResults, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/ping-now') {
      const results = await this.doPings(env);
      return new Response(JSON.stringify(results, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Not found', { status: 404 });
  },

  // 3. Main Ping Logic
  async doPings(env) {
    const rawUrls = env.PING_URLS || 'https://new-outreach-system.onrender.com/health';
    const urls = rawUrls.split(',').map(u => u.trim()).filter(Boolean);
    
    if (urls.length === 0) {
      console.log('No URLs configured in PING_URLS');
      return [];
    }

    const results = [];
    const timestamp = new Date().toISOString();

    for (const targetUrl of urls) {
      let result = { url: targetUrl, timestamp };
      const start = Date.now();
      
      try {
        result.status = await this.pingUrlWithRetry(targetUrl);
      } catch (error) {
        result.error = error.message;
        result.status = 'failed';
      }
      
      result.responseTimeMs = Date.now() - start;
      results.push(result);
      console.log(`[${timestamp}] Pinged ${targetUrl} - Status: ${result.status} in ${result.responseTimeMs}ms`);
    }

    // Save results to Cloudflare KV storage if available
    if (env.PING_RESULTS) {
      try {
        await env.PING_RESULTS.put('LAST_PINGS', JSON.stringify({
          lastRun: timestamp,
          results
        }));
      } catch (err) {
        console.warn('KV storage write warning:', err.message);
      }
    }

    return results;
  },

  // 4. Helper with 30s timeout and 1 retry
  async pingUrlWithRetry(url, retries = 1) {
    for (let i = 0; i <= retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'AutoMindz-KeepAlive-Robot/2.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return response.status;
        }
        
        if (i === retries) return response.status;
        
      } catch (error) {
        if (i === retries) throw error;
      }
      
      // Wait 2 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};
