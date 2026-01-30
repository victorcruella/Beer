const { Client } = require('pg');

export default async function handler(req, res) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 2. GUARDAR PUNTUACIÓN (POST)
    if (req.method === 'POST') {
      // Recibimos también 'daily' desde el frontend
      const { username, score, daily } = req.body;

      // CAMBIO 1: Guardamos 'daily' y actualizamos la fecha a HOY (CURRENT_DATE)
      const query = `
        INSERT INTO ranking (username, score, daily, last_updated) 
        VALUES ($1, $2, $3, CURRENT_DATE) 
        ON CONFLICT (username) 
        DO UPDATE SET score = $2, daily = $3, last_updated = CURRENT_DATE
      `;
      
      await client.query(query, [username, score, daily]);
      await client.end();
      return res.status(200).json({ message: "Guardado" });
    }
    
    // 3. LEER RANKING (GET)
    if (req.method === 'GET') {
      // CAMBIO 2: Truco de Magia SQL.
      // Le decimos: "Si la fecha guardada es de hoy, devuélveme el 'daily'.
      // Si la fecha es vieja (ayer u otro día), devuélveme 0".
      const query = `
        SELECT 
          username, 
          score, 
          CASE WHEN last_updated = CURRENT_DATE THEN daily ELSE 0 END as daily 
        FROM ranking 
        ORDER BY score DESC 
        LIMIT 50
      `;

      const result = await client.query(query);
      await client.end();
      
      res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
      return res.status(200).json(result.rows);
    }

    await client.end();
    return res.status(405).json({ error: "Method Not Allowed" });

  } catch (error) {
    console.error('Error DB:', error);
    try { await client.end(); } catch (e) {}
    return res.status(500).json({ error: "Error servidor: " + error.message });
  }
}