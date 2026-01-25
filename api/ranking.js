const { Client } = require('pg');

export default async function handler(req, res) {
  // 1. Configurar conexión a la base de datos
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

// 2. GUARDAR PUNTUACIÓN (POST)
    if (req.method === 'POST') {
      const { username, score } = req.body;

      // CAMBIO IMPORTANTE: Quitamos "GREATEST" para permitir restar y resetear
      const query = `
        INSERT INTO ranking (username, score) 
        VALUES ($1, $2) 
        ON CONFLICT (username) 
        DO UPDATE SET score = $2
      `;
      
      await client.query(query, [username, score]);
      await client.end();
      return res.status(200).json({ message: "Guardado" });
    }
    
    // 3. LEER RANKING (GET)
    if (req.method === 'GET') {
      const result = await client.query('SELECT * FROM ranking ORDER BY score DESC LIMIT 50');
      await client.end();
      // Cache-Control para no saturar la DB (opcional)
      res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');
      return res.status(200).json(result.rows);
    }

    // Si no es GET ni POST
    await client.end();
    return res.status(405).json({ error: "Method Not Allowed" });

  } catch (error) {
    console.error('Error DB:', error);
    try { await client.end(); } catch (e) {} // Cerrar si sigue abierta
    return res.status(500).json({ error: "Error servidor: " + error.message });
  }
}