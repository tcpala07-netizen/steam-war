const express = require('express');
const session = require('express-session');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const fs = require('fs');
const app = express();

app.use(session({
    secret: 'gizli-anahtar-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new SteamStrategy({
    returnURL: 'http://localhost:3000/auth/steam/return',
    realm: 'http://localhost:3000/',
    apiKey: '24121CDBF34E94186493DD8F1883C746'
}, (identifier, profile, done) => {
    return done(null, profile);
}));

const dbFile = 'database.json';
if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({ kullanicilar: [] }, null, 2));
}

function getUsers() {
    const data = fs.readFileSync(dbFile);
    return JSON.parse(data);
}

function saveUsers(users) {
    fs.writeFileSync(dbFile, JSON.stringify({ kullanicilar: users }, null, 2));
}

function getOrCreateUser(steamId, name) {
    let users = getUsers().kullanicilar;
    let user = users.find(u => u.steamId === steamId);
    if (!user) {
        user = { steamId, name, bakiye: 0 };
        users.push(user);
        saveUsers(users);
    }
    return user;
}

app.get('/', (req, res) => {
    if (!req.user) {
        return res.send('<h1>Steam Açık Artırma</h1><a href="/auth/steam">Steam ile Giriş Yap</a>');
    }
    const userData = getOrCreateUser(req.user.id, req.user.displayName);
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Ana Sayfa</title></head>
        <body style="font-family:Arial;text-align:center;">
            <h1>Merhaba ${req.user.displayName}</h1>
            <p>💰 Bakiyeniz: <strong>${userData.bakiye} TL</strong></p>
            <p>🆔 Steam ID: ${req.user.id}</p>
            <a href="/logout">🚪 Çıkış Yap</a>
        </body>
        </html>
    `);
});

app.get('/auth/steam', passport.authenticate('steam'));
app.get('/auth/steam/return', 
    passport.authenticate('steam', { failureRedirect: '/' }),
    (req, res) => { res.redirect('/'); }
);

app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Sunucu çalışıyor: http://localhost:${PORT}`));