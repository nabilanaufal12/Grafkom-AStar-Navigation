
'use strict';

/* =========================================================
   maps.js
   Bagian anggota 1: konfigurasi, state, helper, geometri,
   generator pulau, jalan, dekorasi, kapal, dan ornamen.
========================================================= */

/* =========================================================
   CATATAN KEKURANGAN PROJECT FIX:
   - Marker Start/End sudah berbentuk bendera vector.
   - Verifikasi jalan lurus ditampilkan di panel dan log.
   - GitHub/video adalah kebutuhan non-kode, ditampilkan sebagai reminder.
========================================================= */

/* =========================================================
   LOGIKA PETA BARU DIMASUKKAN KE UI/UX KODE LAMA
   - UI/HTML/CSS tetap dari file pengguna
   - Engine peta memakai bentuk pulau tropis, jalan terhubung,
     A*, dekorasi, pelabuhan, kapal, zoom, pan, dan animasi.
========================================================= */

const canvas = document.getElementById('mc');
const ctx = canvas.getContext('2d');
const cw = document.getElementById('cw');

const WW = 1400, WH = 1200, CX = 700, CY = 600;

const CFG = {
  edgeDensity: 3.5,
  carSpeed: 2.0,
  showNodes: false,
  showLabels: false,
  showDeco: true,
  showGlow: true,
  showTrail: true,
  cameraFollow: true,
  cameraZoom: true,
  heuristic: 'euclidean',
  vehicleType: 'car',
  astarDelay: 40
};

let INITIAL_GOVERNORS_VIEW = true;
let STATE = {};
function resetState(seed){
  STATE = {
    seed,
    cam:{x:0,y:0,scale:.72,minScale:.20,maxScale:12},
    drag:{active:false,sx:0,sy:0,cx0:0,cy0:0},
    mapW:WW,mapH:WH,
    island:[], innerPts:[],
    nodes:[], edges:[], adj:{}, roads:[], roadSamples:[],
    mountains:[], buildings:[], trees:[], bushes:[], rocks:[],
    lagoons:[], umbrellas:[], huts:[], flowers:[], ornaments:[], cloudPuffs:[],
    boats:[], harbors:[],
    startId:null,endId:null,path:[],
    vehicles:[],
    running:false,paused:false,
    aStarOpen:[], aStarClosed:new Set(), aStarCurrent:null, aStarDone:false, aStarRunning:false,
    mode:'none',
    foamAnim:0,
    lastRouteProgress:0
  };
}

/* ---------- DOM helpers ---------- */
const $ = id => document.getElementById(id);
function setText(id,val){ const el=$(id); if(el) el.textContent=val; }
function log(msg,type=''){
  const box=$('logBox'); if(!box) return;
  const e=document.createElement('div');
  e.className='log-e'+(type?' '+type:'');
  const now=new Date();
  e.textContent=`[${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}] ${msg}`;
  box.appendChild(e); box.scrollTop=box.scrollHeight;
}
function showRouteAlert(msg,type='warn'){
  const box=$('routeAlert'); if(!box) return;
  box.textContent=msg;
  box.style.background=type==='ok'?'#ecfdf5':'#fff7ed';
  box.style.borderColor=type==='ok'?'#10b981':'#fb923c';
  box.style.color=type==='ok'?'#047857':'#9a3412';
  box.classList.add('show');
  clearTimeout(showRouteAlert._t);
  showRouteAlert._t=setTimeout(()=>box.classList.remove('show'),2500);
}
function showAlert(msg){
  const box=$('alertBox'); if(!box) return;
  box.innerHTML=msg; box.classList.add('show');
  setTimeout(()=>box.classList.remove('show'),2600);
}

/* ---------- Random + math ---------- */
let _s=1;
function srand(s){ _s=s>>>0; }
function rand(){ _s=(_s*1664525+1013904223)>>>0; return _s/4294967296; }
function rr(a,b){ return a+(b-a)*rand(); }
function ri(a,b){ return Math.floor(rr(a,b+1)); }
function pick(arr){ return arr[Math.floor(rand()*arr.length)]; }
function lerp(a,b,t){ return a+(b-a)*t; }
function clamp(v,a,b){ return v<a?a:v>b?b:v; }
function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }
function c2w(cx,cy){ return {x:cx/STATE.cam.scale-STATE.cam.x, y:cy/STATE.cam.scale-STATE.cam.y}; }

/* ---------- Geometry ---------- */
function pointInPoly(x,y,poly){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const xi=poly[i].x, yi=poly[i].y, xj=poly[j].x, yj=poly[j].y;
    if(((yi>y)!==(yj>y)) && x < (xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;
  }
  return inside;
}
function pointInIsland(x,y){ return pointInPoly(x,y,STATE.island); }
function circleInsideIsland(x,y,r,steps=10){
  if(!pointInIsland(x,y)) return false;
  for(let i=0;i<steps;i++){
    const a=Math.PI*2*i/steps;
    if(!pointInIsland(x+Math.cos(a)*r,y+Math.sin(a)*r)) return false;
  }
  return true;
}
function segDist(p,a,b){
  const vx=b.x-a.x, vy=b.y-a.y, c=vx*vx+vy*vy;
  const t=c?clamp((vx*(p.x-a.x)+vy*(p.y-a.y))/c,0,1):0;
  return Math.hypot(p.x-a.x-vx*t,p.y-a.y-vy*t);
}
function nearRoad(x,y,r){
  for(const s of STATE.roadSamples){
    for(let i=1;i<s.length;i++){
      if(segDist({x,y},s[i-1],s[i])<r) return true;
    }
  }
  return false;
}
function lineInsideIsland(a,b,steps=16){
  for(let i=0;i<=steps;i++){
    const t=i/steps;
    if(!pointInIsland(lerp(a.x,b.x,t), lerp(a.y,b.y,t))) return false;
  }
  return true;
}

/* ---------- Curves ---------- */
function catmull(pts,steps=18){
  const out=[]; if(!pts || pts.length<2) return out;
  const p=[pts[0],...pts,pts[pts.length-1]];
  for(let i=1;i<p.length-2;i++){
    const p0=p[i-1],p1=p[i],p2=p[i+1],p3=p[i+2];
    for(let j=0;j<steps;j++){
      const t=j/steps,t2=t*t,t3=t2*t;
      out.push({
        x:.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
        y:.5*((2*p1.y)+(-p0.y+p2.y)*t+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t2+(-p0.y+3*p1.y-3*p2.y+p3.y)*t3)
      });
    }
  }
  out.push(pts[pts.length-1]);
  return out;
}
function pathSmooth(pts,closed=false){
  if(!pts || pts.length<2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x,pts[0].y);
  for(let i=1;i<pts.length-2;i++){
    const xc=(pts[i].x+pts[i+1].x)/2, yc=(pts[i].y+pts[i+1].y)/2;
    ctx.quadraticCurveTo(pts[i].x,pts[i].y,xc,yc);
  }
  const n=pts.length;
  ctx.quadraticCurveTo(pts[n-2].x,pts[n-2].y,pts[n-1].x,pts[n-1].y);
  if(closed) ctx.closePath();
}
function roundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

/* =========================================================
   PETA DARI FILE REFERENSI: PULAU ANEH, JALAN LOOP, DEKOR
========================================================= */
function makeIsland(useGovernorInitial=false){
  function smoothClosed(ctrl, steps=20){
    const closed=[...ctrl,ctrl[0],ctrl[1],ctrl[2]];
    const smooth=[];
    for(let i=0;i<ctrl.length;i++){
      const p0=closed[(i-1+ctrl.length)%ctrl.length], p1=closed[i], p2=closed[(i+1)%ctrl.length], p3=closed[(i+2)%ctrl.length];
      for(let j=0;j<steps;j++){
        const t=j/steps,t2=t*t,t3=t2*t;
        smooth.push({
          x:.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
          y:.5*((2*p1.y)+(-p0.y+p2.y)*t+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t2+(-p0.y+3*p1.y-3*p2.y+p3.y)*t3)
        });
      }
    }
    return smooth;
  }

  if(useGovernorInitial){
    // Bentuk awal dibuat menyerupai Governors Island pada gambar referensi:
    // bulat besar di barat-daya, badan memanjang ke timur laut, dan ujung timur mengecil.
    const ctrl=[
      {x:138,y:865},
      {x:92,y:795},
      {x:78,y:706},
      {x:108,y:618},
      {x:175,y:544},
      {x:255,y:468},
      {x:338,y:387},
      {x:422,y:300},
      {x:505,y:220},
      {x:604,y:160},
      {x:734,y:140},
      {x:880,y:146},
      {x:1008,y:170},
      {x:1114,y:198},
      {x:1200,y:252},
      {x:1247,y:334},
      {x:1258,y:435},
      {x:1220,y:545},
      {x:1136,y:642},
      {x:1020,y:724},
      {x:886,y:780},
      {x:748,y:808},
      {x:612,y:820},
      {x:512,y:842},
      {x:430,y:888},
      {x:355,y:954},
      {x:282,y:1015},
      {x:218,y:1038},
      {x:165,y:1010},
      {x:134,y:947}
    ];
    STATE.island=smoothClosed(ctrl, 20);
    STATE.innerPts=STATE.island.map(p=>({x:lerp(p.x,CX,.22), y:lerp(p.y,CY,.22)}));
    return;
  }

  const templates = [
    ()=>Array.from({length:26},(_,i)=>{ const a=Math.PI*2*i/26; const bite=Math.max(0,Math.cos(a-.4)); return {a,r:310-bite*190+rr(-18,18)}; }),
    ()=>Array.from({length:28},(_,i)=>{ const a=Math.PI*2*i/28, deg=a*180/Math.PI; let r=260+rr(-12,12); if(deg>60&&deg<160)r=160+rr(-12,12); if(deg>200&&deg<270)r=360+rr(-12,12); return {a,r}; }),
    ()=>Array.from({length:30},(_,i)=>{ const a=Math.PI*2*i/30; const star=Math.pow(Math.abs(Math.sin(a*2.5)),.35); return {a,r:180+star*160+rr(-20,20)}; }),
    ()=>Array.from({length:28},(_,i)=>{ const a=Math.PI*2*i/28; const tail=Math.max(0,Math.cos(a+Math.PI)); const base=280-tail*60; const tailBulge=tail>.7?(tail-.7)*3*200:0; return {a,r:base+tailBulge+rr(-14,14)}; }),
    ()=>Array.from({length:32},(_,i)=>{ const a=Math.PI*2*i/32; const l1=Math.exp(-Math.pow(a-Math.PI*.35,2)*2.5); const l2=Math.exp(-Math.pow(a-Math.PI*1.65,2)*2.5); return {a,r:160+Math.max(l1,l2)*200+rr(-16,16)}; }),
    ()=>Array.from({length:26},(_,i)=>{ const a=Math.PI*2*i/26; const arrow=1-Math.abs(Math.sin(a*.5))*.55; const notch=a>Math.PI*.8&&a<Math.PI*1.2?.55:1; return {a,r:(200+arrow*130)*notch+rr(-15,15)}; }),
    ()=>Array.from({length:30},(_,i)=>{ const a=Math.PI*2*i/30; const el=1+Math.max(0,Math.cos(a))*.65; const hk=a>Math.PI*1.55&&a<Math.PI*1.95?1+Math.sin((a-Math.PI*1.55)*2.5)*.55:1; return {a,r:200*el*hk+rr(-16,16)}; }),
    ()=>Array.from({length:32},(_,i)=>{ const a=Math.PI*2*i/32; const pen=a>Math.PI*.1&&a<Math.PI*.7?1+Math.sin((a-Math.PI*.1)*2.85)*.9:1; return {a,r:220*pen+rr(-22,22)}; })
  ];
  const raw=pick(templates)();
  const rot=rr(0,Math.PI*2), sx=rr(.85,1.15), sy=rr(.85,1.15);
  const ctrl=raw.map(({a,r})=>({x:CX+Math.cos(a+rot)*r*sx, y:CY+Math.sin(a+rot)*r*sy}));

  STATE.island=smoothClosed(ctrl, 20);
  STATE.innerPts=STATE.island.map(p=>({x:lerp(p.x,CX,.22), y:lerp(p.y,CY,.22)}));
}

function getOrCreateNode(x,y){
  for(const n of STATE.nodes) if(Math.hypot(n.x-x,n.y-y)<15) return n.id;
  const id=STATE.nodes.length;
  STATE.nodes.push({id,x,y,type:'road'});
  STATE.adj[id]=[];
  return id;
}
function addEdge(a,b){
  if(a===b) return;
  if(STATE.adj[a] && STATE.adj[a].some(e=>e.to===b)) return;
  const A=STATE.nodes[a], B=STATE.nodes[b];
  if(!lineInsideIsland(A,B,18)) return;
  const w=dist(A,B);
  STATE.adj[a].push({to:b,w,weight:w});
  STATE.adj[b].push({to:a,w,weight:w});
  STATE.edges.push({a,b});
}
function addRoadFromCurve(curve,type){
  const valid=curve.filter(p=>pointInIsland(p.x,p.y));
  if(valid.length<2) return null;
  const nodeIds=[];
  let prev=null;
  const step=Math.max(4,Math.floor(valid.length/22));
  for(let i=0;i<valid.length;i+=step){
    const id=getOrCreateNode(valid[i].x,valid[i].y);
    if(!nodeIds.includes(id)) nodeIds.push(id);
    if(prev!==null && prev!==id) addEdge(prev,id);
    prev=id;
  }
  const last=valid[valid.length-1], lastId=getOrCreateNode(last.x,last.y);
  if(prev!==null && prev!==lastId) addEdge(prev,lastId);
  if(!nodeIds.includes(lastId)) nodeIds.push(lastId);
  STATE.roads.push({type,curve:valid,nodeIds});
  STATE.roadSamples.push(valid);
  return STATE.roads[STATE.roads.length-1];
}
function coastPt(angle,inset=.72){
  let lo=0,hi=700;
  for(let i=0;i<30;i++){
    const mid=(lo+hi)/2;
    pointInIsland(CX+Math.cos(angle)*mid,CY+Math.sin(angle)*mid)?lo=mid:hi=mid;
  }
  const r=lo*inset;
  return {x:CX+Math.cos(angle)*r, y:CY+Math.sin(angle)*r};
}
function generateRoads(){
  STATE.roads=[]; STATE.roadSamples=[]; STATE.nodes=[]; STATE.edges=[]; STATE.adj={};

  // Jalan dibuat lebih berliku agar memenuhi syarat mayoritas bengkok/diagonal.
  // Semua ruas tetap tersambung ke ring utama, sehingga tidak ada jalan buntu.

  function nudgeInside(p){
    let x=p.x, y=p.y;
    for(let k=0;k<40 && !pointInIsland(x,y);k++){
      x=lerp(x,CX,.08);
      y=lerp(y,CY,.08);
    }
    return {x,y};
  }

  function addCurvyRoad(ctrl,type){
    const curve=catmull(ctrl.map(nudgeInside),20).filter(p=>pointInIsland(p.x,p.y));
    if(curve.length<2) return null;
    return addRoadFromCurve(curve,type);
  }

  const RING_N=48;
  const ringCtrl=[];
  const phase=rr(0,Math.PI*2);
  for(let i=0;i<RING_N;i++){
    const a=Math.PI*2*i/RING_N;
    const inset=.60
      + Math.sin(i*.72+phase)*.055
      + Math.sin(i*1.37+phase*.4)*.035
      + rr(-.018,.018);
    const p=coastPt(a,inset);
    const wob=rr(-20,20);
    ringCtrl.push(nudgeInside({
      x:p.x+Math.cos(a+Math.PI/2)*wob,
      y:p.y+Math.sin(a+Math.PI/2)*wob
    }));
  }

  const ringFull=[...ringCtrl,ringCtrl[0],ringCtrl[1],ringCtrl[2]];
  const ringCurve=[];
  for(let i=0;i<ringCtrl.length;i++){
    const p0=ringFull[(i-1+ringCtrl.length)%ringCtrl.length],
          p1=ringFull[i],
          p2=ringFull[(i+1)%ringCtrl.length],
          p3=ringFull[(i+2)%ringCtrl.length];
    for(let j=0;j<12;j++){
      const t=j/12,t2=t*t,t3=t2*t;
      ringCurve.push(nudgeInside({
        x:.5*((2*p1.x)+(-p0.x+p2.x)*t+(2*p0.x-5*p1.x+4*p2.x-p3.x)*t2+(-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
        y:.5*((2*p1.y)+(-p0.y+p2.y)*t+(2*p0.y-5*p1.y+4*p2.y-p3.y)*t2+(-p0.y+3*p1.y-3*p2.y+p3.y)*t3)
      }));
    }
  }

  const ringRoad={type:'ring',curve:ringCurve,nodeIds:[]};
  STATE.roads.push(ringRoad);
  STATE.roadSamples.push(ringCurve);

  let prev=null;
  const ringStep=Math.max(3,Math.floor(ringCurve.length/38));
  for(let i=0;i<ringCurve.length;i+=ringStep){
    const id=getOrCreateNode(ringCurve[i].x,ringCurve[i].y);
    if(!ringRoad.nodeIds.includes(id)) ringRoad.nodeIds.push(id);
    if(prev!==null && prev!==id) addEdge(prev,id);
    prev=id;
  }
  if(ringRoad.nodeIds.length>1) addEdge(prev,ringRoad.nodeIds[0]);

  function ringNodeAt(t){
    const arr=ringRoad.nodeIds;
    return arr[Math.max(0,Math.min(arr.length-1,Math.round(t*(arr.length-1))))];
  }

  function addCurvyConnector(t1,t2,type='primary',amp=70){
    const aId=ringNodeAt(t1), bId=ringNodeAt(t2);
    const A=STATE.nodes[aId], B=STATE.nodes[bId];
    if(!A||!B) return null;

    const dx=B.x-A.x, dy=B.y-A.y;
    const len=Math.hypot(dx,dy)||1;
    const nx=-dy/len, ny=dx/len;

    const ctrl=[{x:A.x,y:A.y}];
    const side=rand()>.5?1:-1;
    for(let i=1;i<=4;i++){
      const t=i/5;
      const wave=Math.sin(t*Math.PI*2.1+rr(-.22,.22))*amp*side;
      const pull=type==='primary'?.32:.22;
      ctrl.push(nudgeInside({
        x:lerp(A.x,B.x,t)+nx*wave,
        y:lerp(A.y,B.y,t)+ny*wave
      }));
      ctrl[ctrl.length-1].x=lerp(ctrl[ctrl.length-1].x,CX,pull*Math.sin(t*Math.PI));
      ctrl[ctrl.length-1].y=lerp(ctrl[ctrl.length-1].y,CY,pull*Math.sin(t*Math.PI));
    }
    ctrl.push({x:B.x,y:B.y});

    const road=addCurvyRoad(ctrl,type);
    if(road){
      addEdge(aId,road.nodeIds[0]);
      addEdge(road.nodeIds[road.nodeIds.length-1],bId);
    }
    return road;
  }

  addCurvyConnector(.03,.53,'primary',95);
  addCurvyConnector(.15,.68,'primary',82);
  addCurvyConnector(.30,.84,'secondary',72);
  addCurvyConnector(.43,.96,'secondary',76);

  for(const [a,b] of [[.07,.20],[.24,.37],[.41,.55],[.59,.72],[.76,.90]]){
    addCurvyConnector(a,b,'secondary',50);
  }

  for(let pass=0;pass<30;pass++){
    let changed=false;
    for(const n of STATE.nodes){
      if((STATE.adj[n.id]||[]).length>=2) continue;
      let best=null,bestD=Infinity;
      for(const rid of ringRoad.nodeIds){
        if(rid===n.id) continue;
        const rnode=STATE.nodes[rid];
        const d=dist(n,rnode);
        if(d<bestD && lineInsideIsland(n,rnode,12)){
          best=rid; bestD=d;
        }
      }
      if(best!==null){ addEdge(n.id,best); changed=true; }
    }
    if(!changed) break;
  }
}
function generateDecor(){
  STATE.mountains=[]; STATE.buildings=[]; STATE.trees=[]; STATE.bushes=[]; STATE.rocks=[]; STATE.boats=[]; STATE.harbors=[];
  STATE.lagoons=[]; STATE.umbrellas=[]; STATE.huts=[]; STATE.flowers=[]; STATE.ornaments=[]; STATE.cloudPuffs=[];

  // Versi lebih rapi:
  // - ornamen dibagi per zona
  // - bangunan mengikuti jalan
  // - pohon lebih banyak di tepi / cluster
  // - semak hanya sebagai aksen, tidak berserakan

  /* ---------- layout helpers ---------- */
  const lagoonSeeds = [
    {x:CX-255,y:CY-40,r:50,stretch:1.16,rot:.20}
  ];

  function lagoonClear(x,y,r){
    if(!circleInsideIsland(x,y,r+12)) return false;
    if(nearRoad(x,y,r+18)) return false;
    return true;
  }
  for(const g of lagoonSeeds){
    if(lagoonClear(g.x,g.y,g.r)) STATE.lagoons.push(g);
  }

  // satu gunung kecil saja
  for(let tries=0;tries<1200;tries++){
    const x=rr(350,980), y=rr(250,830), r=rr(44,58);
    if(!circleInsideIsland(x,y,r+26) || nearRoad(x,y,r+34)) continue;
    if(STATE.lagoons.some(g=>dist(g,{x,y})<g.r+r+65)) continue;
    STATE.mountains.push({x,y,r,h:r*1.05});
    break;
  }

  const BTYPES=[
    {t:'house',p:.18,w:[24,30],h:[30,40]},
    {t:'villa',p:.16,w:[26,32],h:[32,44]},
    {t:'warung',p:.12,w:[22,28],h:[28,38]},
    {t:'cafe',p:.10,w:[22,28],h:[28,38]},
    {t:'shop',p:.10,w:[22,30],h:[28,40]},
    {t:'clinic',p:.07,w:[28,34],h:[36,48]},
    {t:'school',p:.07,w:[30,36],h:[38,52]},
    {t:'office',p:.07,w:[28,34],h:[36,50]},
    {t:'market',p:.06,w:[30,38],h:[36,48]},
    {t:'hotel',p:.04,w:[30,38],h:[40,56]},
    {t:'warehouse',p:.03,w:[30,40],h:[36,48]}
  ];
  function pickBT(){ let r=rand(),acc=0; for(const b of BTYPES){acc+=b.p;if(r<acc)return b;} return BTYPES[0]; }
  function typeDef(name){ return BTYPES.find(b=>b.t===name) || BTYPES[0]; }

  function normalizedDims(bt){
    let bw=rr(bt.w[0],bt.w[1]);
    let bh=rr(bt.h[0],bt.h[1]);
    if(bw>bh){ const tmp=bw; bw=bh; bh=tmp; }
    if(['house','villa','warung','cafe','shop','clinic','school','office','hotel','market'].includes(bt.t)){
      bh=Math.max(bh,bw*1.44);
      bw=Math.min(bw,bh*.74);
    }else{
      bh=Math.max(bh,bw*1.18);
      bw=Math.min(bw,bh*.92);
    }
    return {bw,bh};
  }

  function bldClear(x,y,r){
    if(!circleInsideIsland(x,y,r+10)) return false;
    if(nearRoad(x,y,r+24)) return false;
    if(STATE.lagoons.some(g=>dist(g,{x,y})<g.r+r+18)) return false;
    if(STATE.huts.some(h=>dist(h,{x,y})<h.r+r+26)) return false;
    if(STATE.mountains.some(m=>dist(m,{x,y})<m.r+r+28)) return false;
    if(STATE.buildings.some(b=>dist(b,{x,y})<b.ww+r+22)) return false;
    return true;
  }
  function tryPlaceBuilding(x,y,bt){
    const {bw,bh}=normalizedDims(bt);
    const r=Math.max(bw,bh)/2;
    if(!bldClear(x,y,r)) return false;
    STATE.buildings.push({x,y,ww:r,w:bw,h:bh,t:bt.t,ang:0});
    return true;
  }

  /* ---------- huts / focal ornaments ---------- */
  const hutSeeds = [
    {x:CX-26, y:CY-92, r:27},
    {x:CX+248, y:CY-44, r:28}
  ];
  for(const h of hutSeeds){
    if(circleInsideIsland(h.x,h.y,h.r+18) && !nearRoad(h.x,h.y,h.r+18)){
      STATE.huts.push({...h, roof:'#f97316', roof2:'#ef5f1d'});
    }
  }

  /* ---------- building placement ---------- */
  // kandidat titik sisi jalan
  const roadCandidates=[];
  for(const road of STATE.roads){
    const curve=road.curve||[];
    if(curve.length<14) continue;
    const step = road.type==='ring' ? 32 : road.type==='primary' ? 26 : 24;
    for(let i=14;i<curve.length-14;i+=step){
      const p0=curve[i-1], p=curve[i], p1=curve[i+1];
      const tx=p1.x-p0.x, ty=p1.y-p0.y;
      const tl=Math.hypot(tx,ty)||1;
      const px=-ty/tl, py=tx/tl;

      for(const side of [-1,1]){
        const offset = road.type==='primary' ? rr(40,52) : rr(34,44);
        const x=p.x + px*offset*side;
        const y=p.y + py*offset*side;
        roadCandidates.push({x,y,roadType:road.type});
      }
    }
  }

  // bangunan landmark lebih dulu supaya tersebar
  const landmarkTypes=['school','clinic','market','office','hotel','warehouse'];
  for(const lt of landmarkTypes){
    for(const c of [...roadCandidates].sort(()=>rand()-.5)){
      if(tryPlaceBuilding(c.x,c.y,typeDef(lt))) break;
    }
  }

  // lalu bangunan biasa, tapi tetap dibatasi supaya rapi
  let normalPlaced=0;
  const normalTypes=['house','villa','warung','cafe','shop'];
  for(const c of roadCandidates){
    const bt = rand()<0.68 ? typeDef(pick(normalTypes)) : typeDef(pick(['office','market','clinic']));
    if(tryPlaceBuilding(c.x,c.y,bt)) normalPlaced++;
    if(normalPlaced>=42) break;
  }

  // isi sedikit area kosong
  for(let i=0,t=0;i<16&&t<9000;t++){
    const x=rr(150,1240),y=rr(110,1080);
    const bt = rand()<0.7 ? typeDef(pick(normalTypes)) : typeDef(pick(['school','office','market']));
    if(tryPlaceBuilding(x,y,bt)) i++;
  }

  /* ---------- filler ornaments in empty spaces ---------- */
  function ornamentClear(x,y,r){
    if(!circleInsideIsland(x,y,r+6)) return false;
    if(nearRoad(x,y,r+12)) return false;
    if(STATE.lagoons.some(g=>dist(g,{x,y})<g.r+r+14)) return false;
    if(STATE.huts.some(h=>dist(h,{x,y})<h.r+r+18)) return false;
    if(STATE.mountains.some(m=>dist(m,{x,y})<m.r+r+18)) return false;
    if(STATE.buildings.some(b=>dist(b,{x,y})<b.ww+r+12)) return false;
    if(STATE.ornaments.some(o=>dist(o,{x,y})<o.r+r+18)) return false;
    return true;
  }

  // ganti ornamen area kosong menjadi hewan-hewan kecil yang rapi, bukan pohon semua
  const ornamentKinds=['cat','dog','chicken','duck','goat'];
  for(let i=0,t=0;i<12&&t<12000;t++){
    const x=rr(160,1220), y=rr(120,1070);
    const kind=pick(ornamentKinds);
    const r=kind==='goat' ? rr(15,19) :
            kind==='dog' ? rr(13,17) :
            kind==='cat' ? rr(12,16) :
            kind==='duck' ? rr(11,15) : rr(10,14);
    if(!ornamentClear(x,y,r)) continue;
    STATE.ornaments.push({
      x,y,r,kind,
      homeX:x, homeY:y,
      targetX:x, targetY:y,
      roam: rr(10, 24),
      wait: rr(20, 120),
      speed: rr(0.25, 0.55),
      legPhase: rr(0, Math.PI*2),
      stepCycle: rr(0.12, 0.22),
      ang:rr(-0.45,0.45),
      flip:rand()>.5 ? 1 : -1,
      body:pick(['#f3f4f6','#f5deb3','#d1d5db','#fed7aa','#fde68a','#ffffff']),
      spot:pick(['#334155','#7c2d12','#92400e','#475569','#ef4444','#111827'])
    });
    i++;
  }

  /* ---------- tree placement ---------- */
  function treeClear(x,y,r){
    if(!circleInsideIsland(x,y,r+4)) return false;
    if(nearRoad(x,y,r+10)) return false;
    if(STATE.lagoons.some(g=>dist(g,{x,y})<g.r+r+7)) return false;
    if(STATE.huts.some(h=>dist(h,{x,y})<h.r+r+8)) return false;
    if(STATE.buildings.some(b=>dist(b,{x,y})<b.ww+r+7)) return false;
    if(STATE.ornaments.some(o=>dist(o,{x,y})<o.r+r+10)) return false;
    if(STATE.mountains.some(m=>dist(m,{x,y})<m.r+r+8)) return false;
    if(STATE.trees.some(tr=>dist(tr,{x,y})<tr.r+r+5)) return false;
    return true;
  }

  // cluster kelapa di sekitar hut, tapi tidak berlebihan
  for(const h of STATE.huts){
    for(let i=0;i<ri(1,3);i++){
      const a=rr(0,Math.PI*2), d=rr(h.r+26,h.r+58);
      const x=h.x+Math.cos(a)*d, y=h.y+Math.sin(a)*d, r=rr(12,17);
      if(treeClear(x,y,r)){
        STATE.trees.push({x,y,r,palm:true,leaves:pick([
          ['#65a30d','#4d7c0f','#84cc16'],
          ['#22c55e','#15803d','#65a30d'],
          ['#84cc16','#65a30d','#3f6212']
        ])});
      }
    }
  }

  // pohon perimeter: lebih banyak di sisi pulau daripada di tengah
  for(let i=0,t=0;i<16&&t<5000;t++){
    const idx=ri(0,STATE.island.length-1);
    const edge=STATE.island[idx];
    const x=lerp(edge.x,CX,rr(.12,.28));
    const y=lerp(edge.y,CY,rr(.12,.28));
    const r=rr(11,17);
    if(!treeClear(x,y,r)) continue;
    STATE.trees.push({x,y,r,palm:rand()>.18,leaves:pick([
      ['#65a30d','#4d7c0f','#84cc16'],
      ['#22c55e','#15803d','#65a30d'],
      ['#84cc16','#65a30d','#3f6212']
    ])});
    i++;
  }

  // beberapa pohon tambahan di area kosong besar
  for(let i=0,t=0;i<6&&t<2200;t++){
    const x=rr(140,1260), y=rr(100,1100), r=rr(10,15);
    if(!treeClear(x,y,r)) continue;
    STATE.trees.push({x,y,r,palm:rand()>.35,leaves:pick([
      ['#65a30d','#4d7c0f','#84cc16'],
      ['#22c55e','#15803d','#65a30d'],
      ['#84cc16','#65a30d','#3f6212']
    ])});
    i++;
  }

  /* ---------- shrub beds ---------- */
  const beds=[];
  for(let i=0,t=0;i<7&&t<3600;t++){
    const x=rr(160,1220), y=rr(110,1080), r=rr(18,28);
    if(!circleInsideIsland(x,y,r+5) || nearRoad(x,y,r+10)) continue;
    if(STATE.buildings.some(b=>dist(b,{x,y})<b.ww+r+10)) continue;
    if(STATE.huts.some(h=>dist(h,{x,y})<h.r+r+12)) continue;
    if(STATE.lagoons.some(g=>dist(g,{x,y})<g.r+r+10)) continue;
    if(STATE.trees.some(tr=>dist(tr,{x,y})<tr.r+r+10)) continue;
    if(STATE.ornaments.some(o=>dist(o,{x,y})<o.r+r+10)) continue;
    if(beds.some(b=>dist(b,{x,y})<b.r+r+24)) continue;
    beds.push({x,y,r}); i++;
  }
  for(const bed of beds){
    for(let i=0;i<ri(8,12);i++){
      const a=rr(0,Math.PI*2), d=rr(0,bed.r);
      const x=bed.x+Math.cos(a)*d, y=bed.y+Math.sin(a)*d, r=rr(4,7);
      if(!circleInsideIsland(x,y,r+2) || nearRoad(x,y,r+6)) continue;
      if(STATE.buildings.some(b=>dist(b,{x,y})<b.ww+r+4)) continue;
      if(STATE.trees.some(tr=>dist(tr,{x,y})<tr.r+r+3)) continue;
      STATE.bushes.push({x,y,r,c:pick(['#65a30d','#84cc16','#22c55e','#4ade80'])});
    }
  }

  /* ---------- flower beds ---------- */
  const flowerAnchors = [];
  for(const b of STATE.buildings){
    if(rand() > 0.32) continue;
    const fx = b.x + rr(-18,18);
    const fy = b.y + b.h*0.42 + rr(8,18);
    if(!circleInsideIsland(fx,fy,16) || nearRoad(fx,fy,16)) continue;
    if(STATE.trees.some(tr=>dist(tr,{x:fx,y:fy})<tr.r+14)) continue;
    if(STATE.ornaments.some(o=>dist(o,{x:fx,y:fy})<o.r+14)) continue;
    if(flowerAnchors.some(f=>dist(f,{x:fx,y:fy})<28)) continue;
    flowerAnchors.push({x:fx,y:fy,r:rr(10,16)});
    if(flowerAnchors.length >= 10) break;
  }
  for(const bed of flowerAnchors){
    for(let i=0;i<ri(7,11);i++){
      const a=rr(0,Math.PI*2), d=rr(0,bed.r);
      const x=bed.x+Math.cos(a)*d;
      const y=bed.y+Math.sin(a)*d;
      const r=rr(2.6,4.2);
      if(!circleInsideIsland(x,y,r+1.5) || nearRoad(x,y,r+4)) continue;
      if(STATE.buildings.some(b=>dist(b,{x,y})<b.ww+r+2)) continue;
      STATE.flowers.push({x,y,r,c:pick(['#f472b6','#fb7185','#facc15','#f97316','#a78bfa'])});
    }
  }

  /* ---------- umbrellas / rocks ---------- */
  for(let i=0,t=0;i<3&&t<2000;t++){
    const x=rr(170,1210), y=rr(130,1060);
    if(!circleInsideIsland(x,y,10) || nearRoad(x,y,14)) continue;
    if(STATE.umbrellas.some(u=>dist(u,{x,y})<28)) continue;
    if(STATE.buildings.some(b=>dist(b,{x,y})<b.ww+14)) continue;
    STATE.umbrellas.push({x,y,r:rr(8,11), c:pick(['#f97316','#fb923c','#f59e0b'])});
    i++;
  }

  for(const g of STATE.lagoons){
    for(let i=0;i<ri(2,4);i++){
      const a=rr(-1.2,1.2), d=g.r*1.28+rr(8,18);
      const x=g.x+Math.cos(a)*d, y=g.y+Math.sin(a)*d;
      if(circleInsideIsland(x,y,7) && !nearRoad(x,y,8)) STATE.rocks.push({x,y,r:rr(5,8),ang:rr(-.5,.5),sand:true});
    }
  }
  for(let i=0,t=0;i<18&&t<4000;t++){
    const idx=ri(0,STATE.island.length-1);
    const p=STATE.island[idx], q=STATE.island[(idx+1)%STATE.island.length];
    const tt=rand();
    const x=lerp(lerp(p.x,q.x,tt),CX,rr(.07,.14));
    const y=lerp(lerp(p.y,q.y,tt),CY,rr(.07,.14));
    const r=rr(5,10);
    if(!circleInsideIsland(x,y,r+2) || nearRoad(x,y,r+10)) continue;
    if(STATE.rocks.some(rk=>dist(rk,{x,y})<rk.r+r+4)) continue;
    STATE.rocks.push({x,y,r,ang:rr(-.5,.5)});
    i++;
  }

  /* ---------- harbors / boats ---------- */
  function makeHarborAt(angle,label){
    const coast=coastPt(angle,1.0);
    const inward={x:CX-coast.x,y:CY-coast.y};
    const il=Math.hypot(inward.x,inward.y)||1;
    inward.x/=il; inward.y/=il;
    const outw={x:-inward.x,y:-inward.y};
    const tang={x:-outw.y,y:outw.x};
    const shore={x:coast.x+inward.x*12,y:coast.y+inward.y*12};
    const len=84, w=42;
    const seaEnd={x:shore.x+outw.x*len,y:shore.y+outw.y*len};
    const lb={x:shore.x+inward.x*26,y:shore.y+inward.y*26};

    const h={
      shore,seaEnd,lb,tang,outw,w,label,
      pierA:{x:shore.x+tang.x*(w*.5),y:shore.y+tang.y*(w*.5)},
      pierB:{x:shore.x-tang.x*(w*.5),y:shore.y-tang.y*(w*.5)},
      endA:{x:seaEnd.x+tang.x*(w*.5),y:seaEnd.y+tang.y*(w*.5)},
      endB:{x:seaEnd.x-tang.x*(w*.5),y:seaEnd.y-tang.y*(w*.5)}
    };
    STATE.harbors.push(h);
    return h;
  }
  STATE.harbors=[];
  makeHarborAt(rr(2.25,2.8),'Dermaga');
  makeHarborAt(rr(4.15,4.55),'Harbor');

  function pushBoatToSea(b){
    for(let k=0;k<90 && pointInIsland(b.x,b.y);k++){
      const vx=b.x-CX, vy=b.y-CY;
      const l=Math.hypot(vx,vy)||1;
      b.x+=vx/l*10; b.y+=vy/l*10;
    }
    keepBoatSafe(b);
    return b;
  }

  STATE.boats=[];
  const seaLanes=[
    {ax:1110,ay:110,bx:1210,by:300,sp:.00070,t0:.28},
    {ax:160,ay:200,bx:205,by:405,sp:.00065,t0:.64}
  ];

  // Kapal bergerak diberi posisi awal yang rapi, tidak acak liar.
  for(const ln of seaLanes){
    const b={
      ax:ln.ax,ay:ln.ay,bx:ln.bx,by:ln.by,t:ln.t0,dir:1,sp:ln.sp,moving:true,
      color:pick(['#d97706','#b45309','#1d4ed8','#065f46']),sz:rr(.72,.92)
    };
    b.x=lerp(b.ax,b.bx,b.t);
    b.y=lerp(b.ay,b.by,b.t);
    b.ang=Math.atan2(b.by-b.ay,b.bx-b.ax);
    pushBoatToSea(b);
    STATE.boats.push(b);
  }

  // Kapal diam di pelabuhan diposisikan lebih jauh dari pantai dan mengikuti arah dermaga.
  for(const h of STATE.harbors){
    const b={
      x:h.seaEnd.x+h.outw.x*42 + h.tang.x*8,
      y:h.seaEnd.y+h.outw.y*42 + h.tang.y*8,
      ang:Math.atan2(h.outw.y,h.outw.x)+Math.PI/2,
      moving:false,
      color:pick(['#b45309','#1d4ed8','#065f46']),
      sz:rr(.62,.78)
    };
    pushBoatToSea(b);
    STATE.boats.push(b);
  }

  // Rapikan jarak antar kapal di tampilan awal.
  separateBoats(18)

  // awan
  STATE.cloudPuffs = [];
}


function separateBoats(iter=12){
  for(let n=0;n<iter;n++){
    for(let i=0;i<STATE.boats.length;i++){
      for(let j=i+1;j<STATE.boats.length;j++){
        const a=STATE.boats[i], b=STATE.boats[j];
        const dx=b.x-a.x, dy=b.y-a.y;
        const d=Math.hypot(dx,dy)||0.0001;
        const minD=((a.sz||1)+(b.sz||1))*42;
        if(d < minD){
          const push=(minD-d)/2;
          const nx=dx/d, ny=dy/d;
          if(a.moving){ a.x-=nx*push; a.y-=ny*push; keepBoatSafe(a); }
          if(b.moving){ b.x+=nx*push; b.y+=ny*push; keepBoatSafe(b); }
          if(!a.moving){ b.x+=nx*push; b.y+=ny*push; keepBoatSafe(b); }
          if(!b.moving){ a.x-=nx*push; a.y-=ny*push; keepBoatSafe(a); }
        }
      }
    }
  }
}
