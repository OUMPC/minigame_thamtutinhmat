const express = require('express');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

const dbPath = path.join(__dirname, 'data', 'leaderboard.db');
const db = new sqlite3.Database(dbPath);

app.use(cors()); 
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            score INTEGER NOT NULL,
            level TEXT NOT NULL
        )
    `);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/levels', async (req, res) => {
    const levelsDir = path.join(__dirname, 'data/levels');
    fs.readdir(levelsDir, (err, files) => {
        if (err) {
            res.status(500).json({ error: 'Không tìm thấy map chơi' });
        } else {
            const levelPromises = files.map(file => {
                const levelPath = path.join(levelsDir, file);
                return new Promise((resolve, reject) => {
                    fs.readFile(levelPath, 'utf8', (err, data) => {
                        if (err) {
                            reject('Error reading level');
                        } else {
                            d = JSON.parse(data)
                            d.img_1 = `/images/levels/${d.img_1}`
                            d.img_2 = `/images/levels/${d.img_2}`
                            resolve(d);
                        }
                    });
                });
            });

            Promise.all(levelPromises)
                .then(levels => res.json(levels))
                .catch(error => res.status(500).json({ error }));
        }
    });
});

app.get('/leaderboard', (req, res) => {
    db.all('SELECT name, score, level FROM leaderboard ORDER BY score DESC LIMIT 10', (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Error reading leaderboard' });
        } else {
            res.json(rows);
        }
    });
});

// Update leaderboard
app.post('/leaderboard', (req, res) => {
    const { name, score, level } = req.body;

    db.serialize(() => {
        db.get('SELECT * FROM leaderboard WHERE name = ? AND level = ?', [name, level], (err, row) => {
            if (err) {
                res.status(500).json({ error: 'Error reading leaderboard' });
            } else {
                if (row) {
                    if (score > row.score) {
                        db.run('UPDATE leaderboard SET score = ? WHERE id = ?', [score, row.id], (err) => {
                            if (err) {
                                res.status(500).json({ error: 'Error updating leaderboard' });
                            } else {
                                res.json({ success: true });
                            }
                        });
                    } else {
                        res.json({ success: true });
                    }
                } else {
                    db.run('INSERT INTO leaderboard (name, score, level) VALUES (?, ?, ?)', [name, score, level], (err) => {
                        if (err) {
                            res.status(500).json({ error: 'Error updating leaderboard' });
                        } else {
                            res.json({ success: true });
                        }
                    });
                }
            }
        });
    });
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

