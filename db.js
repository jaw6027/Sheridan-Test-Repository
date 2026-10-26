import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import path from 'node:path';
export const dataDir=path.resolve(process.env.DATA_DIR||'./data');
mkdirSync(path.join(dataDir,'uploads'),{recursive:true,mode:0o700});
chmodSync(dataDir,0o700);
export const db=new DatabaseSync(path.join(dataDir,'site.sqlite'));
chmodSync(path.join(dataDir,'site.sqlite'),0o600);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1), brand TEXT, bio TEXT, instagram TEXT, pinterest TEXT, featured INTEGER);
CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE, title TEXT, description TEXT, steps TEXT DEFAULT '', color TEXT, style TEXT, occasion TEXT, published INTEGER DEFAULT 0, published_at TEXT, sample INTEGER DEFAULT 0, affiliate INTEGER DEFAULT 0, notified INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS photos(id INTEGER PRIMARY KEY,post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,url TEXT,alt TEXT,position INTEGER);
CREATE TABLE IF NOT EXISTS supplies(id INTEGER PRIMARY KEY,post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,name TEXT,brand TEXT,shade TEXT,notes TEXT,url TEXT);
CREATE TABLE IF NOT EXISTS subscribers(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE,token TEXT UNIQUE,confirmed INTEGER DEFAULT 0,created TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS mail(id INTEGER PRIMARY KEY,mail_key TEXT UNIQUE,email TEXT,subject TEXT,html TEXT,status TEXT DEFAULT 'pending',attempts INTEGER DEFAULT 0,created INTEGER, next_attempt INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS sessions(sid TEXT PRIMARY KEY,value TEXT,expires INTEGER);
`);
if(!db.prepare('SELECT id FROM settings').get()) {
db.prepare('INSERT INTO settings VALUES(1,?,?,?,?,NULL)').run('Plum & Polish','A little color. A little creativity. A space to collect the tiny details that make a manicure feel like you. This is a sample biography—make it yours in the dashboard.','','');
const seeds=[['Velvet plum & a touch of gold','Rich plum tones, delicate gold accents, and a little everyday magic.','Plum','Minimal','Evening','plum'],['A softer shade of spring','Blush pink meets playful botanical lines.','Pink','Floral','Everyday','blush'],['Your daily dose of golden hour','Warm cream with a sunny, sculptural accent.','Cream','Abstract','Holiday','cream'],['Something blue, something bold','A fresh take on blue with clean graphic details.','Blue','French','Wedding','blue']];
for(const [i,[title,description,color,style,occasion,art]] of seeds.entries()) {
 const r=db.prepare('INSERT INTO posts(slug,title,description,color,style,occasion,published,published_at,sample) VALUES(?,?,?,?,?,?,1,?,1)').run('sample-'+art,title,description,color,style,occasion,new Date(Date.now()-i*86400000*3).toISOString());
 db.prepare('INSERT INTO photos(post_id,url,alt,position) VALUES(?,?,?,0)').run(Number(r.lastInsertRowid),'/art-'+art+'.svg','Sample illustration of '+color.toLowerCase()+' nail art; not a photograph of owner work');
}
db.prepare('UPDATE settings SET featured=1').run();
}
export const settings=()=>db.prepare('SELECT * FROM settings WHERE id=1').get();
export function hydrate(p){if(!p)return p; return {...p,photos:db.prepare('SELECT * FROM photos WHERE post_id=? ORDER BY position,id').all(p.id),supplies:db.prepare('SELECT * FROM supplies WHERE post_id=? ORDER BY id').all(p.id)};}
export const getPost=id=>hydrate(db.prepare('SELECT * FROM posts WHERE id=?').get(id));
