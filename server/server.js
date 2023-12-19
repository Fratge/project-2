const express = require('express');
const mysql = require('mysql');
const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());

// Connecter à MySQL
const db = mysql.createConnection({
    host: 'dev.timmatane.ca',
    port: 3306,
    user: 'tim_grosss',
    password: 'pNdwFAAFgD',
    database: 'tim_grosss',
});

db.connect((err) => {
    if (err) { throw err; }
    console.log('Connecté à MySQL');
});

// Créer une route pour récupérer des données
app.get('/jeu_temps', (req, res) => {
    let sql = 'SELECT DISTINCT jeu_fg_joueur, jeu_score_temps FROM jeu_temps ORDER BY jeu_score_temps ASC';
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

app.post('/insert_time', (req, res) => {
    const { playerName, time } = req.body;
    let sql = `INSERT INTO jeu_temps (jeu_fg_joueur, jeu_score_temps) VALUES (?, ?)`;
    db.query(sql, [playerName, time], (err, result) => {
      if (err) throw err;
      res.send('Score inséré avec succès');
    });
  });

// Démarrer le serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});