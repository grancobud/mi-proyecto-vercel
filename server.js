// server.js

const express = require('express');
const { google } = require('googleapis');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON (incorporado en Express)
app.use(express.json());

// Configura el acceso a Google Sheets usando una cuenta de servicio
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json', // Nombre de tu archivo de credenciales JSON
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

// ID de tu planilla de Google Sheets
const SPREADSHEET_ID = '1MzsexkLYOOjXRshdVfy0n1q7O4BE_Ewm-2r3LK0_QyI';

/**
 * Función para insertar datos en la hoja "Sala 1"
 * Se asume que la fila de encabezados es la 5 y que los títulos de columna coinciden con las claves del objeto "datos"
 */
async function insertarDatos(datos) {
  try {
    // Obtener el cliente autenticado
    const client = await auth.getClient();
    const sheetsApi = google.sheets({ version: 'v4', auth: client });
    
    // Obtener los encabezados de la fila 5
    const rangeEncabezados = 'Sala 1!A5:Z5';
    const getRes = await sheetsApi.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: rangeEncabezados,
    });
    let encabezados = getRes.data.values ? getRes.data.values[0] : [];
    
    // Construir la nueva fila en el orden de los encabezados
    const filaNueva = encabezados.map(header => datos[header] || '');
    
    // Insertar la nueva fila al final de la hoja
    await sheetsApi.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sala 1!A:Z',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [filaNueva] }
    });
  } catch (error) {
    throw new Error(`Error al insertar datos: ${error.message}`);
  }
}

// Endpoint para actualizar la hoja con datos enviados en formato JSON
app.post('/update-sheet', async (req, res) => {
  try {
    const datos = req.body;
    if (!datos || Object.keys(datos).length === 0) {
      return res.status(400).json({ error: 'No se han recibido datos.' });
    }
    await insertarDatos(datos);
    res.status(200).json({ message: 'Datos actualizados correctamente.' });
  } catch (error) {
    console.error('Error en /update-sheet:', error);
    res.status(500).json({ error: error.toString() });
  }
});

// Endpoint de prueba para verificar que el servidor funciona
app.get('/', (req, res) => {
  res.send("Servidor del Plugin activo");
});

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
