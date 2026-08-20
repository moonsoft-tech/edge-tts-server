const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const DEFAULT_VOICE = 'fil-PH-AngeloNeural';

module.exports = async function handler(req, res) {
  // Allow the Capacitor WebView / any origin to call this endpoint.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body || {};
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const voice = typeof body.voice === 'string' && body.voice.trim() ? body.voice.trim() : DEFAULT_VOICE;

    if (!text) {
      res.status(400).json({ error: 'Missing "text" in request body' });
      return;
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = await tts.toStream(text);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');

    audioStream.on('data', (chunk) => res.write(chunk));
    audioStream.on('end', () => res.end());
    audioStream.on('error', (err) => {
      console.error('Edge TTS stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'TTS stream failed' });
      } else {
        res.end();
      }
    });
  } catch (err) {
    console.error('Edge TTS error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'TTS failed' });
    }
  }
};
