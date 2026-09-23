import type { Express } from 'express';

import { buildGebcoProxyUrl, buildPostalProxyUrl } from '../proxySecurity';

type PublicCachedGetFetch = (url: string, options?: RequestInit, timeoutMs?: number, retries?: number) => Promise<any>;

export type ExternalProxyRouteDependencies = {
  publicCachedGetFetch: PublicCachedGetFetch;
};

export function registerExternalProxyRoutes(
  app: Express,
  { publicCachedGetFetch }: ExternalProxyRouteDependencies,
) {
  app.get('/api/gebco', async (req, res) => {
    const gebcoUrl = buildGebcoProxyUrl(req.query as Record<string, unknown>);
    if (gebcoUrl.ok === false) {
      return res.status(400).json({ error: gebcoUrl.error });
    }

    try {
      const response = await publicCachedGetFetch(gebcoUrl.url);

      if (!response.ok) {
        return res.status(response.status).send('GEBCO fetch failed');
      }

      const contentType = response.headers.get('content-type');
      if (contentType) res.setHeader('Content-Type', contentType);

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error('GEBCO Proxy Error:', error);
      res.status(500).send('GEBCO Proxy Internal Error');
    }
  });

  app.get('/api/br-viacep/:cep', async (req, res) => {
    const { cep } = req.params;
    const url = buildPostalProxyUrl('br-viacep', { cep });
    if (url.ok === false) return res.status(400).json({ error: url.error });

    try {
      const response = await publicCachedGetFetch(url.url);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
      res.status(response.status).json({ error: 'CEP not found' });
    } catch (error) {
      console.error('ViaCEP API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/in-pincode/:pincode', async (req, res) => {
    const { pincode } = req.params;
    const url = buildPostalProxyUrl('in-pincode', { pincode });
    if (url.ok === false) return res.status(400).json({ error: url.error });

    try {
      const response = await publicCachedGetFetch(url.url);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
      res.status(response.status).json({ error: 'Pincode not found' });
    } catch (error) {
      console.error('Pincode API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/zippopotam/:country/:postcode', async (req, res) => {
    const { country, postcode } = req.params;
    const url = buildPostalProxyUrl('zippopotam', { country, postcode });
    if (url.ok === false) return res.status(400).json({ error: url.error });

    try {
      const response = await publicCachedGetFetch(url.url);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
      res.status(response.status).json({ error: 'Postcode not found' });
    } catch (error) {
      console.error('Zippopotam API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/hk-als/lookup', async (req, res) => {
    const { q, lat, lon } = req.query;
    try {
      let url = 'https://www.als.ogcio.gov.hk/lookup';
      if (q) {
        url += `?q=${encodeURIComponent(q as string)}`;
      } else if (lat && lon) {
        url += `?lat=${lat}&long=${lon}`;
      } else {
        return res.status(400).json({ error: 'Missing q or lat/lon' });
      }

      const response = await publicCachedGetFetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
      res.status(response.status).json({ error: 'HK ALS lookup failed' });
    } catch (error) {
      console.error('HK ALS Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/plusmode/:action', async (req, res) => {
    const { action } = req.params;
    const { lat, lon, code } = req.query;

    try {
      const { OpenLocationCode } = await import('open-location-code');
      const olc = new OpenLocationCode();

      if (action === 'encode') {
        if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon' });
        const plusCode = olc.encode(parseFloat(lat as string), parseFloat(lon as string));
        return res.json({ plusCode });
      }

      if (action === 'decode') {
        if (!code) return res.status(400).json({ error: 'Missing code' });
        const area = olc.decode(code as string);
        return res.json(area);
      }

      res.status(404).json({ error: 'Action not found' });
    } catch (error) {
      console.error('PlusCode API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/uk-postcode/:postcode', async (req, res) => {
    const { postcode } = req.params;
    const url = buildPostalProxyUrl('uk-postcode', { postcode });
    if (url.ok === false) return res.status(400).json({ error: url.error });

    try {
      const response = await publicCachedGetFetch(url.url);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
      res.status(response.status).json({ error: 'Postcode not found' });
    } catch (error) {
      console.error('Postcodes.io API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/nordic/weather', async (req, res) => {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    try {
      const response = await publicCachedGetFetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`);

      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
      res.status(response.status).json({ error: 'Weather data not found' });
    } catch (error) {
      console.error('Met.no API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
