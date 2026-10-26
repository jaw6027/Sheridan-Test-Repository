import { randomBytes, scryptSync } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import readline from 'node:readline/promises';
const rl=readline.createInterface({input:process.stdin,output:process.stdout});
console.log('Choose a private owner password (at least 12 characters). Input is visible in this terminal.');
const password=await rl.question('Password: '); rl.close();
if(password.length<12) throw Error('Use at least 12 characters.');
let env=''; try { env=readFileSync('.env','utf8'); } catch {}
const salt=randomBytes(16).toString('hex');
const values={OWNER_PASSWORD_HASH:`${salt}:${scryptSync(password,salt,64).toString('hex')}`};
if(!/^SESSION_SECRET=.+$/m.test(env)) values.SESSION_SECRET=randomBytes(48).toString('hex');
for(const [k,v] of Object.entries(values)) {env=env.replace(new RegExp(`^${k}=.*\\n?`,'m'),''); env+=`\n${k}=${v}\n`;}
writeFileSync('.env',env,{mode:0o600}); console.log('Owner login configured. Restart the app, then visit /owner/login.');
