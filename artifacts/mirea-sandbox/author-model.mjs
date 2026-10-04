import fs from 'node:fs';
const here=new URL('./',import.meta.url);
const model=JSON.parse(fs.readFileSync(new URL('source-model.json',here),'utf8'));
const aspect=1.5;
// Hand-annotated visible-source centre lines, not automatic semantic segmentation.
const definitions=[
 ['bang-left-outer','瀏海左外束','hair',[[.509,.104],[.483,.136],[.489,.177]],.013,.02],
 ['bang-left-middle','瀏海左中束','hair',[[.522,.103],[.505,.135],[.526,.166]],.014,.018],
 ['bang-left-inner','瀏海左內束','hair',[[.534,.102],[.529,.129],[.548,.163]],.012,.018],
 ['bang-center','瀏海中央束','hair',[[.547,.103],[.548,.132],[.57,.159]],.011,.018],
 ['bang-right-middle','瀏海右中束','hair',[[.565,.107],[.585,.132],[.598,.152]],.013,.018],
 ['bang-right-outer','瀏海右外束','hair',[[.592,.111],[.608,.138],[.616,.178]],.011,.02],
 ['lock-left','左側長髮','hair',[[.488,.158],[.505,.245],[.484,.323]],.012,.055],
 ['lock-right','右側長髮','hair',[[.641,.173],[.662,.244],[.731,.291]],.014,.055],
 ['hair-left-upper','左後髮上段','hair',[[.422,.282],[.325,.332],[.242,.418]],.045,.045],
 ['hair-left-curl','左外側髮尾','hair',[[.281,.39],[.184,.447],[.163,.522]],.049,.045],
 ['hair-right-upper','右後髮上段','hair',[[.719,.282],[.826,.32],[.911,.398]],.044,.045],
 ['hair-right-curl','右外側髮尾','hair',[[.884,.372],[.935,.452],[.876,.528]],.051,.045],
 ['sleeve-left','左袖薄紗','cloth',[[.403,.284],[.379,.326],[.41,.355]],.033,.065],
 ['sleeve-right','右袖薄紗','cloth',[[.687,.311],[.705,.349],[.69,.379]],.031,.06],
 ['skirt-left-upper','左上裙片','cloth',[[.54,.356],[.455,.394],[.381,.442]],.061,.04],
 ['skirt-right-upper','右上裙片','cloth',[[.608,.361],[.675,.399],[.725,.444]],.052,.04],
 ['hem-left','左裙緣蕾絲','cloth',[[.465,.438],[.426,.484],[.357,.508]],.045,.055],
 ['hem-right','右裙緣蕾絲','cloth',[[.632,.435],[.672,.485],[.737,.515]],.041,.05],
 ['umbrella-tail-left','水母傘左飄帶','ribbon',[[.182,.157],[.116,.285],[.083,.434]],.049,.029],
 ['umbrella-tail-middle','水母傘中飄帶','ribbon',[[.303,.161],[.234,.276],[.195,.412]],.045,.032],
 ['umbrella-tail-right','水母傘右飄帶','ribbon',[[.412,.151],[.369,.24],[.342,.326]],.031,.035],
 ['dress-tail-left','裙後左長飄帶','ribbon',[[.289,.566],[.261,.729],[.319,.923]],.058,.027],
 ['dress-tail-right','裙後右長飄帶','ribbon',[[.773,.567],[.798,.752],[.758,.899]],.052,.028],
 ['neck-pendant','胸前寶石吊飾','accessory',[[.580,.225],[.582,.239],[.584,.253]],.025,.065],
];
function tube(points,width) {
 const left=[],right=[];
 for(let i=0;i<points.length;i++) {
  const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dy=(b[1]-a[1])*aspect,length=Math.hypot(dx,dy);
  const nx=-dy/length*width,ny=dx/length*width/aspect;
  const clamp=v=>Math.max(0,Math.min(1,v));
  left.push([clamp(points[i][0]+nx),clamp(points[i][1]+ny)]);
  right.push([clamp(points[i][0]-nx),clamp(points[i][1]-ny)]);
 }
 return [...left,...right.reverse()];
}
model.id='mirea-neck-rig';model.hair=[];model.accessories=[];
model.parts=definitions.map(([id,name,kind,points,width,rotation],i)=>({
 id,name,kind,polygon:tube(points,width),root:points[0],tip:points.at(-1),
 feather:width*.72,rotation:rotation*(kind==='ribbon'?.5:kind==='hair'?.55:.8),stiffness:kind==='ribbon'?.013:kind==='hair'?.018:kind==='cloth'?.032:.045,
 damping:kind==='ribbon'?.96:kind==='hair'?.95:.93,phase:i*.79,wind:kind==='ribbon'?1.15:kind==='hair'?.85:.65,
 follow:kind==='hair'?1.1:kind==='ribbon'?1.25:.75,
 followY:(points.at(-1)[0]<points[0][0]?1:-1)*(kind==='ribbon'?.65:kind==='hair'?.55:.22),
}));
model.pins.find(p=>p.name==='head-root').x=.57;
model.pins.find(p=>p.name==='head-root').y=.213;
// Source-aligned attachment links; fixed anchors retain the reviewed motion.
for(const [name,parent] of Object.entries({
 'umbrella-grip':'waist','umbrella-canopy':'umbrella-grip','feet-anchor':'waist','resting-hand':'waist',
})) model.pins.find(pin=>pin.name===name).parent=parent;
const canopy=[[.167,.164],[.169,.125],[.204,.085],[.259,.047],[.303,.019],[.349,.004],[.414,.006],[.487,.022],[.532,.035],[.549,.055],[.524,.065],[.512,.081],[.471,.092],[.424,.113],[.382,.141],[.326,.16],[.274,.172],[.219,.175]];
const shaft=[[.342,.088],[.36,.093],[.462,.247],[.491,.303],[.479,.31],[.443,.256]];
const grip=[[.431,.233],[.455,.236],[.477,.254],[.477,.277],[.46,.291],[.435,.281],[.426,.258]];
const head=[[.444,.14],[.455,.106],[.473,.086],[.5,.078],[.513,.061],[.539,.06],[.553,.071],[.592,.074],[.632,.092],[.658,.105],[.68,.139],[.685,.186],[.636,.215],[.531,.214],[.475,.205],[.444,.178]];
const face=[[.509,.162],[.523,.145],[.549,.158],[.572,.159],[.587,.14],[.61,.144],[.621,.161],[.613,.182],[.601,.198],[.574,.211],[.556,.209],[.532,.197],[.51,.182],[.499,.168]];
const neck=[[.541,.204],[.593,.204],[.601,.228],[.59,.238],[.555,.237],[.537,.222]];
model.pose.headFollow={rotation:.028,translation:[.004,.0025],region:head,feather:.06,neck:{polygon:neck,base:[.576,.237],feather:.025}};
model.pose.headHorizontal=[.065,.115];model.pose.headWarpBounds=[.07,.214];model.pose.headBounds=[.214,.27];
model.faceClearance=[[.562,.18,.061,.026]];
model.face={eyes:[
 {id:'left',center:[.524,.167],radius:[.0215,.00782],iris:[.525,.1673],irisRadius:[.0078,.0058],travel:[.003,.00065],angle:-.29,sclera:[.98,.955,.99]},
 {id:'right',center:[.584,.156],radius:[.0215,.00782],iris:[.585,.1558],irisRadius:[.0078,.0058],travel:[.003,.00065],angle:-.29,sclera:[.98,.955,.99]},
]};
model.motion={sway:.32,speed:.62,hair:0,accessories:0,follow:1,parts:1,layers:1};
model.tracking={response:.0735,damping:.694,maxVelocity:3.14,bodyFollow:.25,translation:[.07,.046667]};
model.surfaceRegions=[
 {id:'umbrella-canopy-rigid',mode:'rigid',polygon:canopy,feather:.12,anchor:'umbrella-grip',rotation:'body'},
 {id:'umbrella-shaft-rigid',mode:'rigid',polygon:shaft,feather:.12,anchor:'umbrella-grip',rotation:'body'},
 {id:'holding-hand-rigid',mode:'rigid',polygon:grip,feather:.10,anchor:'umbrella-grip',rotation:'body'},
];
const info={sha256:'6382f74df8b5dcfa4f85cb2120c7260021236c02b478eef0724171e79ffaba05',width:1024,height:1536};
const regions=model.parts.map((p,i)=>({id:p.id,role:p.id.startsWith('bang-')?'bangs':p.kind,root:p.root,tip:p.tip,chain:definitions[i][3],polygon:p.polygon,
 deformation:Object.fromEntries(['feather','rotation','stiffness','damping','phase','wind','follow','followY'].map(k=>[k,p[k]]))}));
const limbRegions=[
 {id:'shoulder-left',role:'shoulder',polygon:[[.469,.224],[.483,.218],[.501,.22],[.514,.235],[.506,.261],[.491,.276],[.474,.263],[.461,.244]]},
 {id:'shoulder-right',role:'shoulder',polygon:[[.641,.243],[.657,.239],[.677,.247],[.687,.271],[.693,.294],[.676,.302],[.659,.28],[.64,.256]]},
 {id:'holding-thumb',role:'finger',parent:'holding-hand-rigid',polygon:[[.437,.251],[.449,.249],[.462,.261],[.462,.277],[.449,.272],[.432,.26]]},
 {id:'holding-fingers',role:'finger',parent:'holding-hand-rigid',polygon:[[.433,.233],[.45,.235],[.466,.247],[.471,.263],[.456,.266],[.433,.257],[.43,.245]]},
 {id:'upper-arm-left',role:'upper-arm',polygon:[[.451,.227],[.481,.233],[.478,.27],[.448,.338],[.42,.371],[.402,.362],[.427,.297]]},
 {id:'forearm-left',role:'forearm',parent:'upper-arm-left',polygon:[[.431,.269],[.459,.27],[.451,.324],[.441,.369],[.421,.377],[.4,.36],[.408,.326]]},
 {id:'upper-arm-right',role:'upper-arm',polygon:[[.677,.324],[.708,.339],[.739,.405],[.732,.45],[.709,.434],[.696,.398]]},
 {id:'forearm-right',role:'forearm',parent:'upper-arm-right',polygon:[[.714,.421],[.742,.431],[.765,.492],[.783,.519],[.778,.55],[.756,.553],[.742,.511],[.724,.472]]},
 {id:'thigh-left',role:'thigh',polygon:[[.432,.493],[.53,.492],[.56,.544],[.578,.6],[.58,.637],[.532,.64],[.52,.607],[.48,.566],[.45,.54]]},
 {id:'knee-left',role:'knee',parent:'thigh-left',polygon:[[.532,.623],[.58,.623],[.578,.657],[.551,.691],[.513,.682],[.532,.65]]},
 {id:'shin-left',role:'shin',parent:'knee-left',polygon:[[.513,.674],[.553,.686],[.53,.736],[.518,.797],[.509,.827],[.478,.83],[.462,.791],[.458,.739],[.478,.704]]},
 {id:'thigh-right',role:'thigh',polygon:[[.55,.516],[.627,.524],[.652,.56],[.634,.609],[.605,.639],[.58,.639],[.573,.591],[.559,.553]]},
 {id:'knee-right',role:'knee',parent:'thigh-right',polygon:[[.578,.622],[.613,.626],[.612,.661],[.595,.695],[.566,.687],[.575,.65]]},
 {id:'shin-right',role:'shin',parent:'knee-right',polygon:[[.591,.67],[.617,.69],[.622,.743],[.606,.8],[.572,.855],[.553,.884],[.511,.876],[.531,.819],[.552,.755],[.572,.704]]},
 {id:'ankle-left',role:'ankle',parent:'shin-left',polygon:[[.476,.815],[.516,.824],[.517,.846],[.476,.853],[.465,.838]]},
 {id:'heel-left',role:'heel',parent:'ankle-left',polygon:[[.469,.844],[.513,.846],[.515,.884],[.514,.91],[.48,.925],[.452,.904],[.44,.881]]},
 {id:'toe-left',role:'toe',parent:'heel-left',polygon:[[.451,.892],[.48,.903],[.519,.913],[.516,.929],[.495,.94],[.468,.929],[.442,.91]]},
 {id:'ankle-right',role:'ankle',parent:'shin-right',polygon:[[.529,.86],[.57,.873],[.566,.896],[.515,.89]]},
 {id:'heel-right',role:'heel',parent:'ankle-right',polygon:[[.517,.887],[.565,.897],[.56,.938],[.545,.965],[.496,.958],[.489,.925]]},
 {id:'toe-right',role:'toe',parent:'heel-right',polygon:[[.489,.951],[.547,.953],[.544,.98],[.514,.998],[.481,.99],[.474,.97]]},
];
// One shared lower-body transform preserves both crossed legs and shoe proportions.
// Include the overlap and negative space; only feather OUTSIDE visible anatomy.
const lowerBody=[[.418,.474],[.665,.474],[.674,.569],[.644,.74],[.585,.896],[.585,1],[.47,1],[.422,.912],[.438,.742],[.497,.65],[.424,.551]];
model.surfaceRegions.push({id:'lower-body-rigid',mode:'rigid',polygon:lowerBody,feather:.065,anchor:'waist',rotation:'body'});
// Visible torso/shoulders and the held arm share the prop transform. No elbow stretching.
const torso=[[.4,.36],[.403,.315],[.423,.272],[.446,.221],[.525,.216],[.625,.224],[.673,.24],[.707,.316],[.682,.332],[.654,.372],[.523,.382],[.474,.288],[.449,.371],[.423,.385]];
model.surfaceRegions.push({id:'upper-body-rigid',mode:'rigid',polygon:torso,feather:.08,anchor:'umbrella-grip',rotation:'body'});
const freeArm=[[.677,.324],[.708,.339],[.739,.405],[.742,.431],[.765,.492],[.783,.519],[.778,.55],[.756,.553],[.724,.472],[.696,.398]];
model.pointerGroups=[
 {id:'upper-follow',name:'頭部・肩膀・身體・持傘接點',pivot:[.58,.41],translation:[.008,.004],rotation:.014,response:105,
 regions:[{polygon:[[0,0],[1,0],[1,.465],[0,.465]],feather:.09},{polygon:freeArm,feather:.08}]},
 {id:'pelvis-follow',name:'骨盆・交叉雙腿・鞋子',pivot:[.56,.52],translation:[.004,.003],rotation:.006,response:220,
 regions:[{polygon:lowerBody,feather:.09}]},
];
// The free arm keeps a small independent follow-through, outside the held-prop chain.
const limbMotion=[
 ['arm-right-follow','右手臂跟隨',[[.677,.324],[.708,.339],[.739,.405],[.742,.431],[.765,.492],[.783,.519],[.778,.55],[.756,.553],[.724,.472],[.696,.398]],[.687,.329],[.765,.54],.028,.017],
];
for(const [i,[id,name,polygon,root,tip,feather,rotation]] of limbMotion.entries()) {
 const part={id,name,kind:'accessory',polygon,root,tip,feather,rotation,stiffness:.027-i*.003,damping:.92+i*.01,phase:i*1.3,wind:.12,follow:2,followY:i%2?-.8:.8};
 part.exclusions=[grip,shaft,torso];
 model.parts.push(part);
 regions.push({id,role:'accessory',parent:'body',polygon,root,tip,deformation:Object.fromEntries(['feather','rotation','stiffness','damping','phase','wind','follow','followY'].map(k=>[k,part[k]]))});
}
regions.push(
 {id:'head',role:'head',polygon:head},
 {id:'face',role:'face',parent:'head',polygon:face},
 {id:'neck',role:'neck',polygon:neck,root:[.576,.237],tip:[.57,.213]},
 {id:'headpiece',role:'accessory',parent:'head',polygon:[[.456,.126],[.477,.093],[.508,.078],[.516,.062],[.546,.058],[.554,.074],[.59,.073],[.631,.091],[.657,.11],[.658,.151],[.626,.148],[.615,.122],[.598,.105],[.548,.09],[.509,.096],[.484,.126],[.467,.17],[.452,.155]]},
 {id:'body',role:'body',polygon:[[.523,.23],[.638,.23],[.688,.287],[.65,.362],[.537,.37],[.489,.294]]},
 ...limbRegions,
 ...model.surfaceRegions.map(r=>({id:r.id,role:r.id==='holding-hand-rigid'?'hand':r.id==='lower-body-rigid'?'leg':r.id==='upper-body-rigid'?'body':'prop',parent:r.id==='holding-hand-rigid'?'forearm-left':undefined,polygon:r.polygon,binding:Object.fromEntries(Object.entries(r).filter(([k])=>!['id','polygon'].includes(k)))})),
);
// Source-visible facial cuts. These do not replace the runtime's original texture.
function ellipse(center,radius,angle){return Array.from({length:16},(_,i)=>{const t=i/16*Math.PI*2,x=Math.cos(t)*radius[0],y=Math.sin(t)*radius[1]*aspect;return [center[0]+x*Math.cos(angle)-y*Math.sin(angle),center[1]+(x*Math.sin(angle)+y*Math.cos(angle))/aspect]})}
for(const eye of model.face.eyes){
 regions.push({id:'eye-'+eye.id,role:'eye',parent:'face',polygon:ellipse(eye.center,eye.radius,eye.angle),subtract:['iris-'+eye.id,'eyelid-'+eye.id]});
 regions.push({id:'iris-'+eye.id,role:'iris',parent:'eye-'+eye.id,polygon:ellipse(eye.iris,eye.irisRadius,eye.angle)});
 const points=[[-.9,-.25],[-.55,-.8],[0,-1],[.55,-.8],[.9,-.25],[.7,-.1],[.4,-.52],[0,-.68],[-.4,-.52],[-.7,-.1]];
 regions.push({id:'eyelid-'+eye.id,role:'eyelid',parent:'eye-'+eye.id,polygon:points.map(([x,y])=>{x*=eye.radius[0];y*=eye.radius[1]*aspect;return [eye.center[0]+x*Math.cos(eye.angle)-y*Math.sin(eye.angle),eye.center[1]+(x*Math.sin(eye.angle)+y*Math.cos(eye.angle))/aspect]})});
}

const faceMask='face', frontLeg=['thigh-left','knee-left','shin-left'];
for (const region of regions) {
 if(region.role==='hair'||region.role==='bangs') region.parent='head';
 else if(region.id.startsWith('umbrella-tail-')) region.parent='umbrella-canopy-rigid';
 else if(region.id==='umbrella-canopy-rigid') region.parent='umbrella-shaft-rigid';
 else if(region.id==='umbrella-shaft-rigid') region.parent='holding-hand-rigid';
 else if(region.id==='sleeve-left') region.parent='upper-arm-left';
 else if(region.id==='sleeve-right') region.parent='upper-arm-right';
 else if(!region.parent && region.id!=='body') region.parent='body';
 if(region.role==='hair'||region.role==='bangs') region.subtract=[faceMask,'neck','body','shoulder-left','shoulder-right','upper-arm-left','forearm-left','holding-hand-rigid','upper-arm-right','forearm-right','umbrella-shaft-rigid'];
 if(region.role==='cloth') region.subtract=['upper-arm-left','forearm-left','holding-hand-rigid','upper-arm-right','forearm-right',...frontLeg,'thigh-right','knee-right','shin-right'];
 if(region.role==='prop' && region.id==='umbrella-shaft-rigid') region.subtract=['holding-hand-rigid'];
 if(region.id==='forearm-left') region.subtract=['holding-hand-rigid'];
 if(region.id==='shoulder-left') region.subtract=['holding-hand-rigid'];
 if(region.id==='holding-fingers') region.subtract=['holding-thumb'];
 if(region.id==='upper-arm-left') region.subtract=['holding-hand-rigid','forearm-left'];
 if(['thigh-right','knee-right','shin-right'].includes(region.id)) region.subtract=frontLeg;
 if(region.id==='face') region.subtract=['eye-left','eye-right'];
 if(region.id==='head') region.subtract=['face','neck','headpiece',...definitions.filter(d=>d[0].startsWith('bang-')).map(d=>d[0])];
 if(region.id==='neck-pendant') region.outline=[[.58,.229],[.586,.231],[.592,.232],[.601,.238],[.605,.247],[.598,.254],[.585,.257],[.571,.256],[.563,.249],[.565,.24],[.575,.233]];
}
for(const part of model.parts) {const r=regions.find(r=>r.id===part.id);if(r.subtract) part.exclusions=r.subtract.map(id=>regions.find(r=>r.id===id).polygon);}
// Preparation uses semantic human landmarks. Sandbox retains its manually reviewed prop anchors.
const analysis={version:1,image:info,id:'mirea-prepared',name:model.name,mode:'humanoid',confidence:.9,
 evidence:'Reviewed visible Mirea anatomy, umbrella canopy/shaft and holding hand. Masks contain visible pixels and may need edge refinement; occluded anatomy is not present.',
 headMotion:{head:'head',neck:'neck',base:'neck-base',feather:.06,neckFeather:.025,rotation:.028,translation:[.004,.0025],bodyFollow:.25},
 tracking:model.tracking,
 pointerGroups:model.pointerGroups,
 headBounds:[.444,.06,.685,.215],landmarks:{waist:[.58,.355],'head-root':[.57,.213],'neck-base':[.576,.237],'head-top':[.552,.106],
 'shoulder-left':[.449,.279],'elbow-left':[.414,.36],'wrist-left':[.444,.275],'shoulder-right':[.687,.329],'elbow-right':[.735,.44],'wrist-right':[.75,.525],
 'hip-left':[.48,.505],'knee-left':[.504,.657],'ankle-left':[.489,.84],'hip-right':[.568,.526],'knee-right':[.592,.654],'ankle-right':[.529,.876]},
 face:model.face,
 regions:regions.map(r=>({...r,binding:r.binding?{...r.binding,anchor:r.binding.anchor==='umbrella-grip'?'wrist-left':r.binding.anchor,
 ...(r.id==='lower-body-rigid'?{anchor:'waist'}:{})}:undefined})),
 hair:[],accessories:[],waveSafe:false,unsupportedMotions:['Hidden anatomy and overlapping cloth need completed assets for independent layer playback.','Umbrella-holding pose does not support greeting wave.']};
fs.writeFileSync(new URL('character-analysis.json',here),JSON.stringify(analysis,null,2)+'\n');
fs.writeFileSync(new URL('model.json',here),JSON.stringify(model,null,2)+'\n');
console.log('Authored '+model.parts.length+' visible-source deformation regions.');
