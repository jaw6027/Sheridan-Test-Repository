import {db} from './db.js';
export const emailReady=()=>Boolean(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM&&process.env.PUBLIC_URL&&(process.env.NODE_ENV!=='production'||process.env.PUBLIC_URL.startsWith('https://')));
export const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const publicURL=()=> (process.env.PUBLIC_URL||'http://localhost:3000').replace(/\/$/,'');
export function enqueue(key,email,subject,html){db.prepare('INSERT OR IGNORE INTO mail(mail_key,email,subject,html,created) VALUES(?,?,?,?,?)').run(key,email,subject,html,Date.now());}
let working=false;
export async function flushMail(){
 if(working||!emailReady())return; working=true;
 try {for(const m of db.prepare("SELECT * FROM mail WHERE status='pending' AND next_attempt<=? ORDER BY id LIMIT 20").all(Date.now())) {
 if(!db.prepare("SELECT id FROM mail WHERE id=? AND status='pending'").get(m.id))continue;
 // Resend deduplicates keys for 24 hours. Pause ambiguous old jobs for manual review.
 if(Date.now()-m.created>23*3600000){db.prepare("UPDATE mail SET status='needs-review' WHERE id=?").run(m.id);continue;}
 try {const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':m.mail_key},body:JSON.stringify({from:process.env.EMAIL_FROM,to:[m.email],subject:m.subject,html:m.html}),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('Email provider rejected request');
 const body=await r.json(); if(!body.id)throw Error('No provider receipt');
 db.prepare("UPDATE mail SET status='sent',attempts=attempts+1 WHERE id=?").run(m.id);
 }catch {db.prepare('UPDATE mail SET attempts=attempts+1,next_attempt=? WHERE id=?').run(Date.now()+60000,m.id);}
 }}finally{working=false;}
}
