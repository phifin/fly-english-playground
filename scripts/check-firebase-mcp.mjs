// Read-only MCP protocol probe. No explicit account/project tool calls, raw
// server logs or network-policy changes. The official server itself uses its
// existing CLI credentials during discovery. Run with the same absolute Node
// executable that Codex will use, from a normal owner terminal when child
// processes are unavailable in the managed agent.
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';

const root=fileURLToPath(new URL('../',import.meta.url));
const launcher=fileURLToPath(new URL('./firebase-mcp.mjs',import.meta.url));
const started=performance.now();
const report={checkedAt:new Date().toISOString(),command:process.execPath,
 node:process.version,transport:'stdio-pipes',passed:false,stages:[],stderrBytes:0,
 nonProtocolLines:0,explicitToolCallsMade:false,stderrMilestones:[],stderrCodes:[]};
const elapsed=()=>Math.round(performance.now()-started);
const stage=(name,extra={})=>report.stages.push({name,elapsedMs:elapsed(),...extra});
let child,timer,buffer='',stderrBuffer='',settled=false,resolveDone,toolsReady=false;
const done=new Promise(resolve=>{resolveDone=resolve;});
function finish(reason){
 if(settled)return;
 settled=true;
 if(reason)report.failure=reason;
 clearTimeout(timer);
 child?.stdin?.end();
 child?.kill();
 resolveDone();
}
function send(message){child.stdin.write(`${JSON.stringify(message)}\n`);}
function receive(message){
 if(message.id===1){
  if(message.error||!message.result?.protocolVersion||!message.result?.capabilities?.tools){finish('initialize-rejected');return;}
  stage('initialize',{protocolVersion:message.result.protocolVersion,server:message.result.serverInfo});
  send({jsonrpc:'2.0',method:'notifications/initialized'});
  send({jsonrpc:'2.0',id:2,method:'tools/list',params:{}});
 }else if(message.id===2){
  if(message.error){report.rpcErrorCode=message.error.code;finish('tools-list-rejected');return;}
  const tools=message.result?.tools;
  if(!Array.isArray(tools)||!tools.length){finish('tools-list-empty');return;}
  if(tools.some(tool=>!tool||typeof tool.name!=='string')){finish('invalid-tool-definitions');return;}
  const names=tools.map(tool=>tool.name).sort();
  stage('tools/list',{count:names.length,names});
  toolsReady=names.includes('firebase_get_environment')&&names.includes('firebase_list_projects');
  if(!toolsReady)finish('required-tools-missing');
 }
}
try{
 child=spawn(process.execPath,[launcher],{cwd:root,stdio:['pipe','pipe','pipe'],windowsHide:true,
  env:{...process.env,ATLAS_FIREBASE_MCP_DIAGNOSTICS:'1'}});
 stage('spawn-requested');
 child.on('error',error=>{report.processError=error.code;finish('process-start-failed');});
 child.on('close',(code,signal)=>{report.exitCode=code;report.signal=signal;if(!settled)finish('process-exited-before-tools');});
 child.stdin.on('error',error=>{if(!settled){report.processError=error.code;finish('stdin-failed');}});
 child.stderr.on('data',chunk=>{
  report.stderrBytes+=chunk.length;
  stderrBuffer=(stderrBuffer+chunk.toString()).slice(-20_000);
  report.stderrCodes=[...new Set(stderrBuffer.match(/\b(?:EACCES|EPERM|ENOENT|ECONNREFUSED|ETIMEDOUT|ENOTFOUND)\b/g)||[])];
  report.stderrMilestones=stderrBuffer.split(/\r?\n/).filter(line=>/^\[atlas-firebase \+\d+ms\] (Locating the installed Firebase CLI|Using Firebase CLI \d+\.\d+\.\d+|Loading the official MCP server with core\/auth discovery|Official MCP module loaded)$/.test(line));
 });
 child.stdout.setEncoding('utf8');
 child.stdout.on('data',chunk=>{
  buffer+=chunk;
  if(buffer.length>2_000_000){finish('oversized-stdout');return;}
  let end;
  while((end=buffer.indexOf('\n'))>=0){
   const line=buffer.slice(0,end).trim();buffer=buffer.slice(end+1);
   if(!line)continue;
   let message;
   try{message=JSON.parse(line);}catch{report.nonProtocolLines++;finish('non-json-stdout');return;}
   if(!message||typeof message!=='object'||message.jsonrpc!=='2.0'){report.nonProtocolLines++;finish('invalid-jsonrpc-stdout');return;}
   receive(message);
   if(settled)return;
  }
  if(toolsReady&&!buffer.trim()){
   report.passed=report.nonProtocolLines===0;
   finish(report.passed?undefined:'invalid-jsonrpc-stdout');
  }
 });
 timer=setTimeout(()=>finish('timeout-before-tools'),120_000);
 send({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'atlas-readonly-startup-check',version:'1.0.0'}}});
}catch(error){report.processError=error.code??error.name;finish('process-start-failed');}
await done;
report.elapsedMs=elapsed();
await mkdir(join(root,'artifacts'),{recursive:true});
await writeFile(join(root,'artifacts/firebase-mcp-check.json'),`${JSON.stringify(report,null,2)}\n`);
console.log(JSON.stringify(report,null,2));
process.exitCode=report.passed?0:1;
