const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

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
    const leaderboardPath = path.join(__dirname, 'data/leaderboard.json');
    fs.readFile(leaderboardPath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).json({ error: 'Error reading leaderboard' });
        } else {
            res.json(JSON.parse(data));
        }
    });
});

// Update leaderboard
app.post('/leaderboard', async (req, res) => {
    const leaderboardPath = path.join(__dirname, 'data/leaderboard.json');
    const { name, score, level } = req.body;

    try {
        let data = await fs.promises.readFile(leaderboardPath, 'utf8');
        let leaderboard = JSON.parse(data);

        const existingEntry = leaderboard.find(entry => entry.name === name && entry.level === level);
        if (existingEntry) {
            if (score > existingEntry.score) {
                existingEntry.score = score;
            }
        } else {
            leaderboard.push({ name, score, level });
        }
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 10); // Keep top 10

        await fs.promises.writeFile(leaderboardPath, JSON.stringify(leaderboard));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error updating leaderboard' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});