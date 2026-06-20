// Serverless JSON → SQL CREATE TABLE generator
// POST /api/sql-generator
// Body: { sample: object, tableName?: string }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { sample, tableName = 'generated_table' } = req.body || {};
    if (!sample || typeof sample !== 'object') return res.status(400).json({ error: 'sample object required' });

    // Simple type inference: string, integer, float, boolean, timestamp, json
    const inferType = (val) => {
      if (val === null) return 'TEXT';
      if (Array.isArray(val) || typeof val === 'object') return 'JSONB';
      if (typeof val === 'boolean') return 'BOOLEAN';
      if (typeof val === 'number') {
        return Number.isInteger(val) ? 'INTEGER' : 'FLOAT';
      }
      // naive date detection
      if (typeof val === 'string') {
        const t = Date.parse(val);
        if (!isNaN(t) && val.length >= 8) return 'TIMESTAMP';
        if (val.length > 255) return 'TEXT';
        return 'VARCHAR(255)';
      }
      return 'TEXT';
    };

    const columns = Object.keys(sample).map(key => {
      const type = inferType(sample[key]);
      return `  "${key}" ${type}`;
    }).join(',\n');

    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n  id SERIAL PRIMARY KEY,\n${columns}\n);`;

    res.json({ sql });
  } catch (err) {
    console.error('sql-generator error', err);
    res.status(500).json({ error: 'internal_error' });
  }
}
