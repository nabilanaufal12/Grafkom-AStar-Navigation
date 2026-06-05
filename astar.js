'use strict';

/* =========================================================
   astar.js
   Bagian anggota 2: algoritma A* Search, heuristic,
   open set, closed set, rekonstruksi path, dan start rute.
========================================================= */

/* ---------- A* ---------- */
function mainComponent(){
  const seen=new Set(), comps=[];
  for(const n of STATE.nodes){
    if(seen.has(n.id)) continue;
    const stack=[n.id], comp=[]; seen.add(n.id);
    while(stack.length){
      const cur=stack.pop(); comp.push(cur);
      for(const e of (STATE.adj[cur]||[])) if(!seen.has(e.to)){ seen.add(e.to); stack.push(e.to); }
    }
    comps.push(comp);
  }
  comps.sort((a,b)=>b.length-a.length);
  return comps[0]||[];
}
function randomStartEnd(){
  const pool=mainComponent();
  if(pool.length<2) return false;
  STATE.startId=pool[Math.floor(rand()*pool.length)];
  let far=STATE.startId,bd=-1;
  for(const id of pool){
    const d=dist(STATE.nodes[STATE.startId],STATE.nodes[id]);
    if(d>bd){bd=d;far=id;}
  }
  STATE.endId=far; STATE.path=[]; STATE.vehicles=[]; STATE.running=false;
  updateStats(); setText('vStatus','READY'); setText('vPath','—');
  log('Start/End diacak pada jaringan jalan yang terhubung.','ok');
  return true;
}
function heuristic(a,b){
  const A=STATE.nodes[a], B=STATE.nodes[b], dx=Math.abs(A.x-B.x), dy=Math.abs(A.y-B.y);
  if(CFG.heuristic==='manhattan') return dx+dy;
  if(CFG.heuristic==='chebyshev') return Math.max(dx,dy);
  return Math.hypot(dx,dy);
}
function computePath(start=STATE.startId,end=STATE.endId){
  if(start==null || end==null) return [];
  const open=new Set([start]), closed=new Set();
  const came={},g={[start]:0},f={[start]:heuristic(start,end)};
  let iter=0;
  while(open.size){
    let cur=[...open].reduce((a,b)=>(f[a]??1e9)<=(f[b]??1e9)?a:b);
    iter++;
    if(cur===end){
      const path=[cur]; while(came[cur]!==undefined){cur=came[cur];path.push(cur);}
      STATE.aStarClosed=closed; setText('iIter',iter); setText('iOpen',open.size); setText('iClosed',closed.size);
      return path.reverse();
    }
    open.delete(cur); closed.add(cur);
    for(const e of (STATE.adj[cur]||[])){
      if(closed.has(e.to)) continue;
      const ng=g[cur]+e.w;
      if(ng<(g[e.to]??1e9)){
        came[e.to]=cur; g[e.to]=ng; f[e.to]=ng+heuristic(e.to,end); open.add(e.to);
      }
    }
  }
  STATE.aStarClosed=closed; setText('iIter',iter); setText('iOpen',open.size); setText('iClosed',closed.size);
  return [];
}
function runAStar(){
  STATE.path=computePath();
  updateStats();
  if(STATE.path.length){
    setText('vStatus','FOUND');
    showRouteAlert('Rute A* ditemukan.', 'ok');
    log('A* menemukan rute pada jaringan peta.', 'ok');
  }else{
    setText('vStatus','FAIL');
    showRouteAlert('Rute tidak ditemukan.', 'warn');
    log('A* gagal menemukan rute.', 'warn');
  }
}
function buildRoutePoints(path){
  if(!path || path.length<2) return [];

  // Ambil titik node hasil A*, lalu bentuk ulang menjadi kurva Catmull-Rom.
  // Ini membuat jalur kendaraan lebih halus saat belok.
  const raw=path.map(id=>STATE.nodes[id]);

  let smooth=[];
  if(raw.length>=3){
    smooth=catmull(raw,18);
  }else{
    smooth=raw;
  }

  // Densify supaya animasi tidak loncat dan rotasi kendaraan stabil.
  const out=[];
  for(let i=0;i<smooth.length-1;i++){
    const a=smooth[i], b=smooth[i+1];
    const d=dist(a,b);
    const steps=Math.max(2,Math.ceil(d/4));
    for(let s=0;s<steps;s++){
      const t=s/steps;
      out.push({x:lerp(a.x,b.x,t), y:lerp(a.y,b.y,t)});
    }
  }
  out.push(smooth[smooth.length-1]);
  return out;
}
function createVehicles(){
  const route=buildRoutePoints(STATE.path);
  if(route.length<2) return;
  const firstAngle=Math.atan2(route[1].y-route[0].y,route[1].x-route[0].x)+Math.PI/2;
  STATE.vehicles=[{route,idx:0,x:route[0].x,y:route[0].y,angle:firstAngle,type:CFG.vehicleType,trail:[],done:false,speed:CFG.carSpeed}];
  STATE.running=true; STATE.paused=false;
  setText('vStatus','RUN');
}
function startTrack(){
  STATE.path=computePath();
  if(!STATE.path.length){ showRouteAlert('Rute tidak ditemukan.', 'warn'); return; }
  createVehicles();
  updateStats();
  log('Kendaraan mulai berjalan mengikuti rute A*.', 'ok');
}
function stepAstar(){
  // Tetap kompatibel dengan tombol STEP: jalankan A* sekali dan tampilkan rute.
  runAStar();
}


function boatHitsIsland(b){
  // Uji beberapa titik pada badan kapal, bukan hanya titik tengah,
  // supaya kapal tidak tampak menabrak pulau.
  const ang = b.ang || 0;
  const sz = b.sz || 1;
  const ca = Math.cos(ang), sa = Math.sin(ang);

  const samples = [
    {x: 48, y: 0}, {x: 34, y: 9}, {x: 34, y: -9},
    {x: 18, y: 12}, {x: 18, y: -12},
    {x: -8, y: 13}, {x: -8, y: -13},
    {x: -28, y: 12}, {x: -28, y: -12},
    {x: -42, y: 8}, {x: -42, y: -8},
    {x: 0, y: 0}
  ];

  for(const s of samples){
    const lx = s.x * sz;
    const ly = s.y * sz;
    const wx = b.x + lx * ca - ly * sa;
    const wy = b.y + lx * sa + ly * ca;
    if(pointInIsland(wx, wy)) return true;
  }
  return false;
}

function nudgeBoatOutOfIsland(b){
  // Dorong kapal menjauhi pulau sampai seluruh hull aman.
  for(let i=0;i<120 && boatHitsIsland(b);i++){
    const vx = b.x - CX;
    const vy = b.y - CY;
    const l = Math.hypot(vx, vy) || 1;
    b.x += (vx / l) * 6;
    b.y += (vy / l) * 6;
  }
}

function keepBoatSafe(b){
  if(boatHitsIsland(b)){
    nudgeBoatOutOfIsland(b);
  }
}
