export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { device_id, log_date, flow, mood, sleep, symptoms, bedtime, waketime, sleep_hours, cycle_day, cycle_phase, calendar_events } = req.body;

  if (!device_id || !log_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/daily_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        device_id,
        log_date,
        flow,
        mood,
        sleep,
        symptoms,
        bedtime,
        waketime,
        sleep_hours,
        cycle_day,
        cycle_phase,
        calendar_events,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(500).json({ error });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}