const { sendContactEmail } = require('../lib/contact-email');

module.exports = async function contactHandler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    const result = await sendContactEmail(req.body);
    return res.status(200).json({ ok: true, id: result.id || null });
  } catch (error) {
    if (error.code === 'missing_fields' || error.code === 'invalid_email') {
      return res.status(400).json({ error: error.code });
    }

    console.error('Contact email failed:', error.code || error.message);
    return res.status(500).json({ error: 'send_failed' });
  }
};
