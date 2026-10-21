// Development-only launcher for the installed official Firebase MCP server.
// Avoids npx metadata downloads and keeps debug logs inside the writable project.
// It does not read credentials, alter proxy settings, or change security policy.
import {createRequire} from 'node:module';
import {readdir,readFile,access,mkdir} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {homedir} from 'node:os';

const root=fileURLToPath(new URL('../',import.meta.url));
const started=Date.now();
const diagnostic=message=>{if(process.env.ATLAS_FIREBASE_MCP_DIAGNOSTICS==='1')process.stderr.write(`[atlas-firebase +${Date.now()-started}ms] ${message}\n`);};
diagnostic('Locating the installed Firebase CLI');
const candidates=[];
const roaming=process.env.APPDATA||(process.platform==='win32'?join(homedir(),'AppData/Roaming'):undefined);
const local=process.env.LOCALAPPDATA||(process.platform==='win32'?join(homedir(),'AppData/Local'):undefined);
if(roaming)candidates.push(join(roaming,'npm/node_modules/firebase-tools'));
candidates.push(join(dirname(process.execPath),'node_modules/firebase-tools'));
if(local){
 const cache=join(local,'npm-cache/_npx');
 try{for(const entry of await readdir(cache,{withFileTypes:true}))if(entry.isDirectory())candidates.push(join(cache,entry.name,'node_modules/firebase-tools'));}
 catch(error){if(error.code!=='ENOENT')throw error;}
}
try{candidates.push(dirname(createRequire(import.meta.url).resolve('firebase-tools/package.json')));}catch{/* Optional local/global installation. */}
const installed=[];
for(const directory of new Set(candidates)){
 try{
  const pkg=JSON.parse(await readFile(join(directory,'package.json'),'utf8'));
  const version=/^(\d+)\.(\d+)\.(\d+)$/.exec(pkg.version??'');
  if(pkg.name!=='firebase-tools'||!version||Number(version[1])<15)continue;
  const entry=join(directory,'lib/bin/firebase.js');await access(entry);
  installed.push({entry,version:version.slice(1).map(Number)});
 }catch(error){if(!['ENOENT','ENOTDIR'].includes(error.code))throw error;}
}
installed.sort((a,b)=>b.version[0]-a.version[0]||b.version[1]-a.version[1]||b.version[2]-a.version[2]);
if(!installed.length)throw new Error('Install the official Firebase CLI in your normal terminal first: npx -y firebase-tools@latest --version');
diagnostic(`Using Firebase CLI ${installed[0].version.join('.')}`);
await mkdir(join(root,'artifacts'),{recursive:true});
process.env.FIREBASE_DEBUG_PATH=resolve(root,'artifacts/firebase-mcp.log');
process.env.IS_FIREBASE_MCP='true';
// CLI 15.34 also fetches remote OneMCP definitions for the firestore feature.
// Keep initial discovery local; add --only core,auth,firestore explicitly only
// once that remote endpoint is reachable. Core includes rules/project tools.
process.argv=[process.execPath,installed[0].entry,'mcp','--dir',join(root,'cloud'),'--only','core,auth',...process.argv.slice(2)];
diagnostic('Loading the official MCP server with core/auth discovery');
createRequire(import.meta.url)(installed[0].entry);
diagnostic('Official MCP module loaded');
