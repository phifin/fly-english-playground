// Verification-only build in an isolated artifact directory. NEVER deploy this candidate.
import {mkdir,readFile,writeFile,readdir,lstat} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {build} from './build.mjs';
import {startServer} from './serve.mjs';
import {isPublicRelative} from './public-files.mjs';

const root=resolve('.'),destination=resolve('artifacts/platform-candidate-source');
if(!destination.startsWith(root+ '\\artifacts\\')&&!destination.startsWith(root+'/artifacts/'))throw Error('Unsafe preview destination');
const candidate=JSON.parse(await readFile('data/staging/platform-foundation-v1.json','utf8'));
if(candidate.schemaVersion!==1||candidate.batchId!=='platform-foundation-v1')throw Error('Unexpected candidate');
async function copy(path){
 const source=join(root,path),info=await lstat(source);if(info.isSymbolicLink())throw Error('No preview symlinks');
 if(info.isDirectory()){for(const entry of await readdir(source))await copy(path+'/'+entry);return;}
 if(!isPublicRelative(path))throw Error('Unexpected preview input '+path);
 const target=join(destination,path);await mkdir(dirname(target),{recursive:true});await writeFile(target,await readFile(source));
}
await mkdir(destination,{recursive:true});
for(const path of ['index.html','observatory.html','atlas.css','styles.css','public-config.js','sw.js','src','assets','data/published'])await copy(path);
await writeFile(join(destination,'package.json'),'{"type":"module"}\n');
// This artifact copy has no acceptance receipt and is never put in the repository's published folder.
await writeFile(join(destination,'data/published/platform.json'),JSON.stringify(candidate,null,2)+'\n');
const report=await build({sourceRoot:destination});
await writeFile('artifacts/platform-candidate-report.json',JSON.stringify({...report,contentStatus:'UNACCEPTED — mechanical UI verification only',deployable:false},null,2));
if(process.argv.includes('--serve')){
 const server=await startServer({directory:join(destination,'dist')});
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
