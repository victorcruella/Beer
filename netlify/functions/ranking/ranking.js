const { Client } = require('pg');

exports.handler = async (event, context) => {
  // CAMBIO AQUÍ: Añadimos || process.env.NETLIFY_DATABASE_URL por si acaso
  const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {    
    await client.connect();

    // 1. GUARDAR PUNTUACIÓN (POST)
    if (event.httpMethod === 'POST') {
      const { username, score } = JSON.parse(event.body);
      
      // Si el usuario existe, actualiza su puntuación solo si es mayor
      // Si no existe, lo crea.
      const query = `
        INSERT INTO ranking (username, score) 
        VALUES ($1, $2) 
        ON CONFLICT (username) 
        DO UPDATE SET score = GREATEST(ranking.score, $2)
      `;
      
      await client.query(query, [username, score]);
      await client.end();
      return { statusCode: 200, body: JSON.stringify({ message: "Guardado" }) };
    }

    // 2. LEER RANKING (GET)
    if (event.httpMethod === 'GET') {
      // Devuelve el Top 50 ordenado por puntuación
      const result = await client.query('SELECT * FROM ranking ORDER BY score DESC LIMIT 50');
      await client.end();
      return { 
        statusCode: 200, 
        body: JSON.stringify(result.rows) 
      };
    }

    return { statusCode: 405, body: "Method Not Allowed" };

  } catch (error) {
    console.error('Error DB:', error);
    await client.end();
    return { statusCode: 500, body: "Error servidor: " + error.message };
  }
};