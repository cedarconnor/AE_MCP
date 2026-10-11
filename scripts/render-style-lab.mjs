// Native, editable demonstrations of the six bundled design profiles.
// Dry-run by default. --execute requires an EMPTY AE project and writes a unique
// artifact directory. Never replay this script after an ambiguous IPC timeout.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import '../dist/operations/index.js';
import {getOp} from '../dist/registry.js';
import {validateOpArgs} from '../dist/opschema.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=async p=>JSON.parse(await readFile(path.join(root,p),'utf8'));
const profiles=(await read('skills/after-effects-motion-design/references/profiles.json')).profiles;
const defaults=Object.fromEntries((await read('skills/after-effects-motion-design/references/parameters.json')).parameters.map(p=>[p.key,p.default]));
const hex=s=>s.slice(1).match(/../g).map(v=>parseInt(v,16)/255);
const W=1280,H=720,FPS=30,D=8;
const tr=p=>['ADBE Transform Group',p];
const plans=[];
for(const [index,profile] of profiles.entries()){
 const t={...defaults,...profile.overrides},comp=`STYLE ${index+1} - ${profile.id}`,ops=[];
 const add=(operation,args)=>ops.push({operation,args:{comp,...args}});
 const key=(layer,property,values,interp='ease')=>add('keyframe.apply',{layer,property,replace:true,spatialTangents:'linear',keys:values.map(([frame,value])=>({time:frame/FPS,value,interp,...(interp==='linear'?{}:{inSpeed:0,outSpeed:0,inInfluence:frame>=218?25:t['motion.entryInInfluence'],outInfluence:frame>=218?70:t['motion.entryOutInfluence']})}))});
 const fade=(name,start=8,end=218)=>key(name,tr('ADBE Opacity'),[[start,0],[start+t['timing.entrance'],100],[end,100],[end+t['timing.exit'],0]]);
 const move=(name,pos,start=8,end=218,playful=false)=>{
  const travel=t['motion.travel']*H,entry=t['timing.entrance'];
  const values=playful?[[start,[pos[0],pos[1]+travel]],[start+t['motion.anticipation'],[pos[0],pos[1]+travel*1.06]],[start+entry,[pos[0],pos[1]-travel*t['motion.overshoot']/100]],[start+entry+t['motion.settle'],pos]]:[[start,[pos[0],pos[1]+travel]],[start+entry,pos]];
  key(name,tr('ADBE Position'),[...values,[end,pos],[end+t['timing.exit'],[pos[0],pos[1]-travel]]]);
  if(playful)key(name,tr('ADBE Opacity'),[[Math.max(0,start-4),0],[start,100],[end,100],[end+t['timing.exit'],0]]);
  else fade(name,start,end);
  if(playful){key(name,tr('ADBE Scale'),[[start,[94,94]],[start+entry,[101,101]],[start+entry+t['motion.settle'],[100,100]]]);key(name,tr('ADBE Rotate Z'),[[start,-3],[start+entry,0.4],[start+entry+t['motion.settle'],0]]);}
 };
 const text=(name,copy,pos,size,color='text',font='ArialMT',start=8,align='left',playful=false)=>{
  add('layer.create_text',{name,text:copy});
  add('text.set_style',{layer:name,font,fontSize:size,fillColor:hex(t[`color.${color}`]),tracking:t['type.tracking'],autoLeading:false,leading:size*1.12,justification:align});
  add('layer.set_anchor',{layer:name,preset:align==='center'?'center':'centerLeft'});
  add('transform.set',{layer:name,position:pos});move(name,pos,start,218,playful);
 };
 const shape=(name,pos,size,color='accent',kind='rect',stroke=false)=>{
  add('layer.create_shape',{name});add('shape.add_group',{layer:name,name:'Geometry'});
  add(kind==='ellipse'?'shape.add_ellipse':'shape.add_rect',{layer:name,groupIndex:1,size,...(kind==='rect'?{roundness:t['shape.cornerRadius']*H}:{})});
  add(stroke?'shape.add_stroke':'shape.add_fill',{layer:name,groupIndex:1,color:hex(t[`color.${color}`]),...(stroke?{width:2}:{})});
  add('transform.set',{layer:name,position:pos});
 };
 add('comp.create',{name:comp,width:W,height:H,fps:FPS,duration:D,bgColor:hex(t['color.ground'])});delete ops[0].args.comp;
 add('layer.create_solid',{name:'Ground - opaque and stationary',color:hex(t['color.ground'])});
 add('comp.set_props',{props:{motionBlur:t['finish.motionBlur'],shutterAngle:t['finish.shutterAngle']}});
 // Small navigation labels enter quietly, then remain still through the hold.
 text('Series label',`FIELD NOTES   /   ${String(index+1).padStart(2,'0')}`, [80,64],16,'muted','ArialMT',0);
 text('Style label',profile.name.toUpperCase(),[80,654],16,'muted','ArialMT',0);
 text('Format label','NATIVE MOTION   /   08 SEC',[1200,654],14,'muted','ArialMT',0,'left');
 add('layer.set_anchor',{layer:'Format label',preset:'centerRight',time:3});
 // The changed anchor compensated position; reset the final keyed positions.
 move('Format label',[1200,654],0);
 if(profile.id==='editorial-calm'){
  shape('Accent disc',[1010,330],[250,250],'accent','ellipse');move('Accent disc',[1010,330],10);
  shape('Fine rule',[410,462],[660,2],'muted');fade('Fine rule',22);
  text('Title first','Make room',[80,275],76,'text','ArialMT',8);
  text('Title second','for meaning.',[80,362],76,'text','ArialMT',12);
  text('Supporting thought','Space, rhythm, and one clear idea.',[80,513],25,'muted','ArialMT',24);
  text('Disc annotation','01',[1010,330],60,'ground','ArialMT',18,'center');
 }else if(profile.id==='product-precise'){
  shape('Card shadow',[914,361],[470,390],'ground');
  add('property.set',{layer:'Card shadow',property:['ADBE Root Vectors Group','ADBE Vector Group','ADBE Vectors Group','ADBE Vector Graphic - Fill','ADBE Vector Fill Color'],value:[0,0,0,1]});
  move('Card shadow',[914,361],8);
  // A simple displaced native silhouette: no effect/plugin dependency.
  key('Card shadow',tr('ADBE Opacity'),[[8,0],[22,12],[218,12],[227,0]]);
  shape('Product panel',[906,350],[470,390],'surface');move('Product panel',[906,350],8);
  shape('Status pill',[1040,221],[112,34],'accent');move('Status pill',[1040,221],72);
  shape('Progress track',[905,421],[370,12],'ground');fade('Progress track',25);
  shape('Progress fill',[720,421],[370,12],'accent');add('layer.set_anchor',{layer:'Progress fill',preset:'centerLeft'});add('transform.set',{layer:'Progress fill',position:[720,421]});
  key('Progress fill',tr('ADBE Scale'),[[30,[0,100]],[70,[100,100]]],'linear');fade('Progress fill',24);
  text('Title first','Less friction.',[80,287],58,'text','Arial-BoldMT',8);
  text('Title second','More flow.',[80,355],58,'text','Arial-BoldMT',10);
  text('Supporting thought','From idea to ready.',[80,440],25,'muted','ArialMT',18);
  text('Panel title','PROJECT / ORBIT',[720,220],19,'text','Arial-BoldMT',16);
  text('Status text','READY',[1040,221],13,'ground','Arial-BoldMT',72,'center');
  text('Panel metric','Stay in sync.',[720,324],34,'text','ArialMT',24);
  text('Panel detail','One workspace. Everything connected.',[720,370],18,'muted','ArialMT',28);
  text('Panel footer','SYNC COMPLETE',[720,480],15,'accent','ArialMT',72);
 }else if(profile.id==='kinetic-bold'){
  shape('Hero disc',[1000,348],[370,370],'accent','ellipse');move('Hero disc',[1000,348],9);
  shape('Underline',[301,572],[440,12],'accent');fade('Underline',24);
  text('Title first','MAKE',[80,215],122,'text','Arial-Black',8);
  text('Title second','YOUR',[80,353],122,'text','Arial-Black',11);
  text('Title third','MOVE.',[80,491],122,'text','Arial-Black',14);
  text('Disc mark','GO',[1000,348],95,'ground','Arial-Black',18,'center');
 }else if(profile.id==='playful-tactile'){
  shape('Back tile',[987,326],[270,270],'surface');move('Back tile',[987,326],8,218,true);
  shape('Circle toy',[979,288],[202,202],'accent','ellipse');move('Circle toy',[979,288],13,218,true);
  shape('Base tile',[999,436],[300,72],'text');move('Base tile',[999,436],18,218,true);
  text('Title first','Good things',[80,287],58,'text','ArialRoundedMTBold',8,'left',true);
  text('Title second','are taking shape.',[80,359],58,'text','ArialRoundedMTBold',12,'left',true);
  text('Supporting thought','A little bounce. A clear destination.',[80,455],24,'muted','ArialMT',25);
  text('Toy label','HELLO!',[999,436],25,'ground','ArialRoundedMTBold',18,'center',true);
 }else if(profile.id==='technical-data'){
  text('Title','A clearer picture.',[80,190],64,'text','Arial-BoldMT',8);
  text('Metric','72%',[80,344],100,'accent','Arial-BoldMT',18);
  text('Metric description','Completion at phase 03',[80,438],24,'text','ArialMT',28);
  text('Data qualifier','Illustrative data / common 0–100% scale',[80,485],18,'muted','ArialMT',30);
  for(const [i,value] of [42,58,72].entries()){
   const y=300+i*86;
   text(`Phase ${i}`,`0${i+1}`,[640,y],20,'muted','ArialMT',16+i*6);
   shape(`Track ${i}`,[880,y],[340,18],'surface');fade(`Track ${i}`,12);
   shape(`Bar ${i}`,[710,y],[340*value/100,18],'accent');add('layer.set_anchor',{layer:`Bar ${i}`,preset:'centerLeft'});add('transform.set',{layer:`Bar ${i}`,position:[710,y]});
   key(`Bar ${i}`,tr('ADBE Scale'),[[30+i*6,[0,100]],[60+i*6,[100,100]]],'linear');fade(`Bar ${i}`,14);
   text(`Value ${i}`,`${value}%`,[1090,y],23,'text','Arial-BoldMT',62+i*6);
  }
  text('Axis minimum','0',[710,532],16,'muted','ArialMT',18);text('Axis maximum','100%',[1030,532],16,'muted','ArialMT',18);
 }else{
  for(const [i,z] of [300,0,-240].entries()){
   const name=`Depth portal ${i}`;
   shape(name,[640,360],[[1120,570],[850,420],[620,260]][i],i===1?'accent':'surface','rect',true);
   add('transform.set',{layer:name,threeDLayer:true,position:[640,360,z]});fade(name,8+i*5);
  }
  text('Title first','BEYOND',[640,310],58,'text','ArialMT',14,'center');
  text('Title second','THE SURFACE',[640,388],58,'text','ArialMT',19,'center');
  text('Supporting thought','A STUDY IN DEPTH',[640,470],17,'accent','ArialMT',33,'center');
  // Native 3D title plane, deliberately no shallow focus to preserve reading.
  for(const name of ['Title first','Title second','Supporting thought'])add('layer.set_props',{layer:name,props:{threeDLayer:true}});
  add('layer.create_camera',{name:'Camera - restrained push'});
  add('property.set',{layer:'Camera - restrained push',property:['ADBE Camera Options Group','ADBE Camera Zoom'],value:1800});
  add('property.set',{layer:'Camera - restrained push',property:tr('ADBE Point of Interest'),value:[640,360,0]});
  key('Camera - restrained push',tr('ADBE Position'),[[0,[655,360,-1800]],[105,[640,360,-1755]],[239,[640,360,-1755]]]);
 }
 if(t['finish.motionBlur'])add('layer.set_props',{layer:'all',props:{motionBlur:true}});
 plans.push({profile:profile.id,comp,tokens:t,overrides:{format:[W,H,FPS,D],fonts:'Role-specific installed Arial variants',layout:'Bespoke six-style study',cinematicCameraTravel:'45 px over a 1800 px scene depth'},ops});
}

const dir=path.join(root,'artifacts','styles-'+new Date().toISOString().replace(/[:.]/g,'-'));
for(const plan of plans)for(const entry of plan.ops){
 const op=getOp(entry.operation);assert(op,entry.operation);
 const validated=validateOpArgs(op,entry.args);assert(validated.ok,JSON.stringify(validated));
 op.toJsx(validated.value);
}
await mkdir(dir,{recursive:true});
await writeFile(path.join(dir,'plans.json'),JSON.stringify(plans,null,2));
console.log('ARTIFACT_DIRECTORY='+dir);
if(!process.argv.includes('--execute')){console.log('Dry run: six native operation plans written; AE unchanged.');process.exit(0);}
const c=new Client({name:'six-style-native-lab',version:'1.0.0'}),evidence={directory:dir,calls:[],compositions:[],status:'running'};
const persist=()=>writeFile(path.join(dir,'evidence.json'),JSON.stringify(evidence,null,2));
async function call(name,args={}){
 console.log(name,args.operation??'');
 const r=await c.callTool({name,arguments:args},undefined,{timeout:600000});
 const d=r.structuredContent??r;evidence.calls.push({name,args,isError:!!r.isError,data:d});await persist();
 assert(!r.isError&&d.ok!==false&&d.result?.ok!==false,JSON.stringify(d));
 return d.result??d;
}
try{
 await c.connect(new StdioClientTransport({command:process.execPath,args:[path.join(root,'dist/index.js')],stderr:'pipe'}));
 const before=await call('ae_project_info');
 assert(before.numItems===0,'Refusing to build in a populated project. Preserve it and open an empty project first.');
 evidence.host=await call('ae_version_info');
 const fonts=await call('ae_do',{operation:'font.list',args:{familyContains:'Arial',limit:100}});
 for(const font of ['ArialMT','Arial-BoldMT','Arial-Black','ArialRoundedMTBold'])assert(fonts.fonts.some(f=>f.postScriptName===font),`Required font unavailable: ${font}`);
 for(const plan of plans){
  const built=await call('ae_do',{operation:'batch.run',args:{ops:plan.ops,stopOnError:true},timeoutMs:180000});
  const compId=built.results[0].id;
  assert(compId>0,'Expected native comp ID');
  const review=await call('ae_motion_review',{compId,times:[0,0.3,0.6,1,1.5,3,5,7.3],directory:dir,notes:`Native ${plan.profile} first pass; needs visual and sequence review.`});
  const audit=await call('ae_motion_audit',{compId});
  evidence.compositions.push({profile:plan.profile,compId,review,audit});await persist();
 }
 evidence.project=path.join(dir,'Six-Styles.aep');await call('ae_save_project',{path:evidence.project});
 for(const [i,comp] of evidence.compositions.entries()){
  const queued=await call('ae_do',{operation:'render.add_to_queue',args:{comp:comp.compId}});
  if(i===0){
   evidence.templates=await call('ae_do',{operation:'render.list_templates',args:{}});
   assert(evidence.templates.outputTemplates.includes('H.264 - Match Render Settings - 15 Mbps'),'Host lacks the validated H.264 output template; project saved, configure output explicitly.');
  }
  comp.movie=path.join(dir,comp.profile+'.mp4');
  await call('ae_do',{operation:'render.set_output',args:{queueIndex:queued.queueIndex,renderTemplate:'Best Settings',outputTemplate:'H.264 - Match Render Settings - 15 Mbps',outputPath:comp.movie,timeSpanStart:0,timeSpanDuration:D}});
 }
 await call('ae_do',{operation:'render.start',args:{},timeoutMs:540000});
 evidence.render=await call('ae_do',{operation:'render.status',args:{}});
 assert(evidence.render.items.length===6&&evidence.render.items.every(i=>i.status==='DONE'),'Inspect render.status: incomplete movie output.');
 await call('ae_save_project',{path:evidence.project});
 evidence.status='rendered_needs_visual_review';await persist();
 console.log(JSON.stringify({directory:dir,project:evidence.project,compositions:evidence.compositions.map(x=>({profile:x.profile,compId:x.compId,reviewPath:x.review.reviewPath}))},null,2));
}catch(e){evidence.status='failed';evidence.error=e.message;await persist();console.error(e);process.exitCode=1;}
finally{await c.close();}
