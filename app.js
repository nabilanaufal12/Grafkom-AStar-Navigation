'use strict';

/* =========================================================
   app.js
   Bagian anggota 3-5: rendering Canvas, kendaraan, UI event,
   statistik, resize, input, dan loop animasi.
========================================================= */

/* ---------- Drawing ---------- */
function drawBoat(b){
  if(b.x===undefined) return;
  ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(b.ang||0); ctx.scale(b.sz,b.sz);
  if(b.moving){
    const wg=ctx.createLinearGradient(0,0,-100,0);
    wg.addColorStop(0,'rgba(255,255,255,.30)'); wg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=wg; ctx.beginPath(); ctx.moveTo(-5,-9); ctx.lineTo(-95,-22); ctx.lineTo(-95,22); ctx.lineTo(-5,9); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle='rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(2,10,44,13,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(52,0); ctx.bezierCurveTo(40,16,-28,18,-48,13); ctx.lineTo(-48,-13); ctx.bezierCurveTo(-28,-18,40,-16,52,0); ctx.closePath();
  ctx.fillStyle=b.color; ctx.fill(); ctx.strokeStyle='rgba(0,0,0,.28)'; ctx.lineWidth=1.4; ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.90)'; roundRect(-6,-9,26,18,4); ctx.fill();
  ctx.fillStyle='#7dd3fc'; roundRect(-3,-6,7,6,2); ctx.fill(); roundRect(8,-6,7,6,2); ctx.fill();
  if(!b.moving){ ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(-38,0); ctx.lineTo(-52,0); ctx.moveTo(-45,-5); ctx.lineTo(-45,5); ctx.stroke(); }
  ctx.restore();
}
function drawOrnament(o){
  ctx.save();
  ctx.translate(o.x,o.y);
  ctx.rotate(o.ang||0);
  ctx.scale(o.flip||1,1);

  const walk = Math.sin(o.legPhase || 0);
  const walk2 = Math.sin((o.legPhase || 0) + Math.PI);

  ctx.fillStyle='rgba(0,0,0,.10)';
  ctx.beginPath();
  ctx.ellipse(3,4,o.r*0.95,o.r*0.38,0,0,Math.PI*2);
  ctx.fill();

  const body=o.body||'#f5deb3';
  const spot=o.spot||'#475569';

  if(o.kind==='cat'){
    ctx.fillStyle=body;
    ctx.beginPath(); ctx.ellipse(0,0,o.r*0.70,o.r*0.45,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(o.r*0.74,-o.r*0.12,o.r*0.30,0,Math.PI*2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(o.r*0.58,-o.r*0.22); ctx.lineTo(o.r*0.72,-o.r*0.52); ctx.lineTo(o.r*0.86,-o.r*0.20); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(o.r*0.88,-o.r*0.18); ctx.lineTo(o.r*1.05,-o.r*0.46); ctx.lineTo(o.r*1.12,-o.r*0.10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle=body; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(-o.r*0.74,-o.r*0.10); ctx.quadraticCurveTo(-o.r*1.10,-o.r*0.80,-o.r*0.55,-o.r*0.95); ctx.stroke();
    ctx.fillStyle=spot; ctx.beginPath(); ctx.arc(-o.r*0.10,-o.r*0.05,o.r*0.16,0,Math.PI*2); ctx.fill();

  }else if(o.kind==='dog'){
    ctx.fillStyle=body;
    ctx.beginPath(); ctx.ellipse(0,0,o.r*0.76,o.r*0.46,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(o.r*0.82,-o.r*0.06,o.r*0.28,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=spot;
    ctx.beginPath(); ctx.ellipse(o.r*0.92,-o.r*0.02,o.r*0.10,o.r*0.15,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(o.r*0.70,-o.r*0.32,o.r*0.12,o.r*0.20,-0.6,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=body; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(-o.r*0.70,-o.r*0.08); ctx.quadraticCurveTo(-o.r*1.02,-o.r*0.42,-o.r*0.90,-o.r*0.05); ctx.stroke();

  }else if(o.kind==='chicken'){
    ctx.fillStyle='#fff8e7';
    ctx.beginPath(); ctx.ellipse(0,0,o.r*0.62,o.r*0.46,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(o.r*0.62,-o.r*0.10,o.r*0.24,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ef4444';
    ctx.beginPath(); ctx.arc(o.r*0.58,-o.r*0.34,o.r*0.10,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(o.r*0.71,-o.r*0.40,o.r*0.09,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#f59e0b';
    ctx.beginPath(); ctx.moveTo(o.r*0.82,-o.r*0.08); ctx.lineTo(o.r*1.05,0); ctx.lineTo(o.r*0.82,o.r*0.08); ctx.closePath(); ctx.fill();

  }else if(o.kind==='duck'){
    ctx.fillStyle='#fde68a';
    ctx.beginPath(); ctx.ellipse(0,0,o.r*0.66,o.r*0.44,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(o.r*0.62,-o.r*0.18,o.r*0.22,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#f97316';
    ctx.beginPath(); ctx.moveTo(o.r*0.82,-o.r*0.12); ctx.lineTo(o.r*1.08,-o.r*0.02); ctx.lineTo(o.r*0.82,o.r*0.08); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#facc15';
    ctx.beginPath(); ctx.ellipse(-o.r*0.10,-o.r*0.02,o.r*0.18,o.r*0.10,0,0,Math.PI*2); ctx.fill();

  }else if(o.kind==='goat'){
    ctx.fillStyle=body;
    ctx.beginPath(); ctx.ellipse(0,0,o.r*0.78,o.r*0.44,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(o.r*0.82,-o.r*0.08,o.r*0.24,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#92400e'; ctx.lineWidth=2.4;
    ctx.beginPath();
    ctx.moveTo(o.r*0.72,-o.r*0.26); ctx.quadraticCurveTo(o.r*0.92,-o.r*0.58,o.r*1.00,-o.r*0.26);
    ctx.moveTo(o.r*0.94,-o.r*0.22); ctx.quadraticCurveTo(o.r*1.12,-o.r*0.52,o.r*1.18,-o.r*0.20);
    ctx.stroke();
    ctx.strokeStyle=body; ctx.lineWidth=2.2;
    ctx.beginPath(); ctx.moveTo(o.r*0.92,o.r*0.10); ctx.lineTo(o.r*1.00,o.r*0.28); ctx.stroke();
  }

  ctx.restore();
}

function drawFlower(f){
  ctx.save();
  ctx.translate(f.x,f.y);
  const petal = f.r*0.62;
  ctx.fillStyle=f.c;
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;
    ctx.beginPath();
    ctx.arc(Math.cos(a)*petal, Math.sin(a)*petal, f.r*0.62, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.fillStyle='#fff7cc';
  ctx.beginPath();
  ctx.arc(0,0,f.r*0.48,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawCloudPuff(c){}
function drawHut(h){
  ctx.save();
  ctx.translate(h.x,h.y);

  ctx.fillStyle='rgba(0,0,0,.14)';
  ctx.beginPath(); ctx.ellipse(4,12,h.r*.95,h.r*.45,0,0,Math.PI*2); ctx.fill();

  // deck / platform
  ctx.fillStyle='#7c5230';
  roundRect(-h.r*.35,h.r*.35,h.r*.70,h.r*.95,3);
  ctx.fill();
  ctx.strokeStyle='rgba(124,82,48,.85)';
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(-h.r*.16,h.r*.30); ctx.lineTo(-h.r*.16,h.r*1.26);
  ctx.moveTo(h.r*.16,h.r*.30); ctx.lineTo(h.r*.16,h.r*1.26);
  ctx.stroke();

  // hut body
  ctx.fillStyle='#fef6d8';
  roundRect(-h.r*.48,-h.r*.22,h.r*.96,h.r*.76,5);
  ctx.fill();

  // orange umbrella-like roof
  ctx.fillStyle=h.roof||'#f97316';
  ctx.beginPath();
  ctx.moveTo(-h.r*.85,0);
  ctx.quadraticCurveTo(0,-h.r*1.10,h.r*.85,0);
  ctx.lineTo(0,h.r*.56);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle=h.roof2||'#ef5f1d';
  ctx.beginPath();
  ctx.moveTo(0,-h.r*.96);
  ctx.lineTo(0,h.r*.46);
  ctx.lineTo(h.r*.62,0);
  ctx.closePath();
  ctx.fill();

  // pole
  ctx.strokeStyle='#8b5a2b';
  ctx.lineWidth=2.6;
  ctx.beginPath(); ctx.moveTo(0,-h.r*.32); ctx.lineTo(0,h.r*.78); ctx.stroke();

  ctx.restore();
}
function drawLagoon(g){
  ctx.save();
  ctx.translate(g.x,g.y);
  ctx.rotate(g.rot);
  ctx.fillStyle='rgba(0,0,0,.08)';
  ctx.beginPath(); ctx.ellipse(4,5,g.r*g.stretch,g.r*.72,0,0,Math.PI*2); ctx.fill();

  ctx.fillStyle='#7ddff2';
  ctx.beginPath(); ctx.ellipse(0,0,g.r*g.stretch,g.r*.72,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.45)';
  ctx.lineWidth=3;
  ctx.beginPath(); ctx.ellipse(0,0,g.r*g.stretch,g.r*.72,0,0,Math.PI*2); ctx.stroke();
  ctx.restore();
}
function drawUmbrella(u){
  ctx.save();
  ctx.translate(u.x,u.y);
  ctx.fillStyle='rgba(0,0,0,.12)';
  ctx.beginPath(); ctx.ellipse(3,5,u.r*.9,u.r*.45,0,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#7c5230';
  ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,u.r+5); ctx.stroke();
  ctx.fillStyle=u.c;
  ctx.beginPath();
  ctx.moveTo(-u.r,0);
  ctx.quadraticCurveTo(0,-u.r*1.15,u.r,0);
  ctx.lineTo(-u.r,0);
  ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.3)';
  ctx.beginPath(); ctx.moveTo(0,-u.r*.9); ctx.lineTo(0,0); ctx.stroke();
  ctx.restore();
}
function drawMountain(m){
  ctx.save(); ctx.translate(m.x,m.y);
  ctx.fillStyle='rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(0,m.r*.44,m.r*.92,m.r*.26,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#8a8880'; ctx.beginPath(); ctx.moveTo(-m.r*.92,m.r*.20); ctx.lineTo(-m.r*.26,-m.h*.28); ctx.lineTo(0,-m.h); ctx.lineTo(m.r*.15,-m.h*.20); ctx.lineTo(m.r*.90,m.r*.20); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.36)'; ctx.beginPath(); ctx.moveTo(-m.r*.14,-m.h*.75); ctx.lineTo(0,-m.h); ctx.lineTo(m.r*.13,-m.h*.67); ctx.lineTo(m.r*.02,-m.h*.52); ctx.lineTo(-m.r*.08,-m.h*.58); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawBuilding(b){
  ctx.save();
  ctx.translate(b.x,b.y);
  ctx.rotate(0);

  let w=b.w,h=b.h,type=b.t||'house';
  if(w>h){ const tmp=w; w=h; h=tmp; }
  h=Math.max(h,w*1.38);
  w=Math.min(w,h*.78);

  ctx.fillStyle='rgba(0,0,0,.11)';
  roundRect(-w/2+2,-h/2+4,w,h,5); ctx.fill();

  function windowCell(x,y,ww=6,hh=6){
    ctx.fillStyle='#bfe6ff';
    roundRect(x,y,ww,hh,2);
    ctx.fill();
  }
  function door(){
    ctx.fillStyle='#7c5230';
    roundRect(-3,h/2-12,6,12,2);
    ctx.fill();
  }
  function roofTriangle(color='#ef6c33'){
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(-w/2-5,-h*.04);
    ctx.lineTo(0,-h*.31);
    ctx.lineTo(w/2+5,-h*.04);
    ctx.closePath();
    ctx.fill();
  }
  function flatTop(color){
    ctx.fillStyle=color;
    roundRect(-w/2,-h/2,w,h*.16,4);
    ctx.fill();
  }

  if(type==='house' || type==='villa'){
    ctx.fillStyle=type==='villa'?'#fff7d6':'#fff4d8';
    roundRect(-w/2,-h/2,w,h,6); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.10)'; ctx.stroke();
    roofTriangle(type==='villa'?'#fb923c':'#ef6c33');
    door();
    windowCell(-w*.28,-h*.10,8,9);
    windowCell(w*.08,-h*.10,8,9);

  }else if(type==='warung'){
    ctx.fillStyle='#fef9c3';
    roundRect(-w/2,-h/2,w,h,5); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.10)'; ctx.stroke();
    flatTop('#a16207');
    ctx.fillStyle='#facc15';
    roundRect(-w/2,-h*.33,w,h*.10,2); ctx.fill();
    door();
    windowCell(w*.05,-h*.08,8,8);

  }else if(type==='cafe'){
    ctx.fillStyle='#fff7ed';
    roundRect(-w/2,-h/2,w,h,6); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.10)'; ctx.stroke();
    flatTop('#f97316');
    ctx.fillStyle='#fed7aa';
    ctx.beginPath();
    ctx.moveTo(-w/2,-h*.32);
    ctx.lineTo(w/2,-h*.32);
    ctx.lineTo(w*.32,-h*.18);
    ctx.lineTo(-w*.32,-h*.18);
    ctx.closePath();
    ctx.fill();
    door();
    windowCell(-w*.25,-h*.05,8,8);
    windowCell(w*.08,-h*.05,8,8);

  }else if(type==='shop'){
    ctx.fillStyle='#fae8ff';
    roundRect(-w/2,-h/2,w,h,5); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.10)'; ctx.stroke();
    const cols=['#9333ea','#f97316','#22c55e'];
    for(let i=0;i<3;i++){
      ctx.fillStyle=cols[i];
      ctx.fillRect(-w/2+i*w/3,-h/2,w/3,h*.16);
    }
    door();
    windowCell(-w*.25,-h*.04,8,8);
    windowCell(w*.08,-h*.04,8,8);

  }else if(type==='clinic'){
    ctx.fillStyle='#f0fdf4';
    roundRect(-w/2,-h/2,w,h,6); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.10)'; ctx.stroke();
    flatTop('#10b981');
    ctx.fillStyle='#ef4444';
    ctx.fillRect(-3,-h*.10,6,16);
    ctx.fillRect(-9,-h*.04,18,6);
    door();

  }else if(type==='school'){
    ctx.fillStyle='#fef9c3';
    roundRect(-w/2,-h/2,w,h,5); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.10)'; ctx.stroke();
    flatTop('#ca8a04');
    ctx.fillStyle='#bfe6ff';
    for(let yy=-h*.24; yy<h*.22; yy+=11){
      windowCell(-w*.25,yy,6,6);
      windowCell(w*.10,yy,6,6);
    }
    door();

  }else if(type==='office' || type==='hotel'){
    ctx.fillStyle=type==='hotel'?'#dbeafe':'#e0f2fe';
    roundRect(-w/2,-h/2,w,h,4); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.10)'; ctx.stroke();
    flatTop(type==='hotel'?'#2563eb':'#0284c7');
    ctx.fillStyle='#bfe6ff';
    for(let yy=-h*.30; yy<h*.32; yy+=10){
      windowCell(-w*.24,yy,5,5);
      windowCell(0,yy,5,5);
      windowCell(w*.22,yy,5,5);
    }

  }else if(type==='market'){
    ctx.fillStyle='#fff7d6';
    roundRect(-w/2,-h/2,w,h,5); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.10)'; ctx.stroke();
    const cols=['#ef4444','#f59e0b','#22c55e','#3b82f6'];
    for(let i=0;i<4;i++){
      ctx.fillStyle=cols[i];
      ctx.fillRect(-w/2+i*w/4,-h/2,w/4,h*.15);
    }
    ctx.fillStyle='#7c5230';
    roundRect(-w*.20,h/2-13,w*.40,13,2); ctx.fill();
    windowCell(-w*.33,-h*.06,8,8);
    windowCell(w*.22,-h*.06,8,8);

  }else if(type==='warehouse'){
    ctx.fillStyle='#e2e8f0';
    roundRect(-w/2,-h/2,w,h,3); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.10)'; ctx.stroke();
    flatTop('#64748b');
    ctx.fillStyle='#94a3b8';
    roundRect(-w*.25,h/2-15,w*.50,15,2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.45)';
    ctx.fillRect(-w*.38,-h*.20,w*.76,3);

  }else{
    ctx.fillStyle='#fff4d8';
    roundRect(-w/2,-h/2,w,h,6); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.10)'; ctx.stroke();
    roofTriangle('#ef6c33');
    door();
  }

  ctx.restore();
}

function drawTree(t){
  ctx.save(); ctx.translate(t.x,t.y);
  ctx.fillStyle='rgba(0,0,0,.13)'; ctx.beginPath(); ctx.ellipse(3,6,t.r*.65,t.r*.25,0,0,Math.PI*2); ctx.fill();
  if(t.palm){
    ctx.fillStyle='#7c5230'; roundRect(-2,1,4,t.r*.92,2); ctx.fill();
    for(let i=0;i<6;i++){ ctx.save(); ctx.rotate(-Math.PI/2+(i-2.5)*.44); ctx.fillStyle=t.leaves[i%3]; ctx.beginPath(); ctx.moveTo(0,-t.r*.30); ctx.quadraticCurveTo(t.r*.80,-t.r*.70,t.r*1.25,-t.r*.10); ctx.quadraticCurveTo(t.r*.70,0,0,-t.r*.20); ctx.closePath(); ctx.fill(); ctx.restore(); }
  }else{
    ctx.fillStyle='#6b4218'; roundRect(-2,2,4,10,2); ctx.fill(); ctx.fillStyle=t.leaves[1]; ctx.beginPath(); ctx.arc(0,-3,t.r*.72,0,Math.PI*2); ctx.fill(); ctx.fillStyle=t.leaves[0]; ctx.beginPath(); ctx.arc(-t.r*.15,-t.r*.13,t.r*.50,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}
function drawHarbor(h){
  ctx.save();

  // platform darat sebagai penghubung, supaya pelabuhan tidak terlihat terpisah
  const ang=Math.atan2(h.tang.y,h.tang.x);
  ctx.save();
  ctx.translate(h.lb.x,h.lb.y);
  ctx.rotate(ang);
  ctx.fillStyle='rgba(0,0,0,.12)';
  roundRect(-34,-20+5,68,42,7); ctx.fill();
  ctx.fillStyle='#d4b483';
  roundRect(-34,-20,68,42,7); ctx.fill();

  ctx.fillStyle='#fff7ed';
  roundRect(-22,-13,44,28,5); ctx.fill();
  ctx.fillStyle='#b45309';
  ctx.beginPath(); ctx.moveTo(-29,-11); ctx.lineTo(0,-30); ctx.lineTo(29,-11); ctx.closePath(); ctx.fill();

  ctx.fillStyle='rgba(255,255,255,.90)';
  roundRect(-20,-32,40,12,4); ctx.fill();
  ctx.fillStyle='#7c2d12';
  ctx.font='bold 8px sans-serif';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(h.label,0,-26);
  ctx.restore();

  // dermaga kayu dari pantai menuju laut
  ctx.fillStyle='#8b5a2b';
  ctx.beginPath();
  ctx.moveTo(h.pierA.x,h.pierA.y);
  ctx.lineTo(h.endA.x,h.endA.y);
  ctx.lineTo(h.endB.x,h.endB.y);
  ctx.lineTo(h.pierB.x,h.pierB.y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle='rgba(255,235,200,.34)';
  ctx.lineWidth=1.8;
  for(let i=1;i<7;i++){
    const tt=i/7;
    ctx.beginPath();
    ctx.moveTo(lerp(h.pierA.x,h.endA.x,tt),lerp(h.pierA.y,h.endA.y,tt));
    ctx.lineTo(lerp(h.pierB.x,h.endB.x,tt),lerp(h.pierB.y,h.endB.y,tt));
    ctx.stroke();
  }

  ctx.fillStyle='#5b3a1a';
  for(const tt of [.08,.30,.55,.78,.96]){
    for(const side of [0,1]){
      const x=lerp(side?h.pierA.x:h.pierB.x,side?h.endA.x:h.endB.x,tt);
      const y=lerp(side?h.pierA.y:h.pierB.y,side?h.endA.y:h.endB.y,tt);
      ctx.beginPath(); ctx.arc(x,y,3.2,0,Math.PI*2); ctx.fill();
    }
  }

  ctx.restore();
}
function drawRoads(){
  ctx.save();
  pathSmooth(STATE.island,true);
  ctx.clip();

  // Jalan polos satu warna tanpa garis putih, tetap vector agar tidak jagged saat zoom.
  for(const road of STATE.roads){
    const pts=road.curve;
    if(!pts||pts.length<2) continue;

    const isPrimary=road.type==='primary';
    const isRing=road.type==='ring';
    const bw=isPrimary?18:isRing?16:12;

    pathSmooth(pts,false);
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.strokeStyle='#d8bf73';
    ctx.lineWidth=bw;
    ctx.stroke();
  }

  ctx.restore();
}

function evaluateRoadCurvature(){
  let total=0, straight=0;

  for(const road of STATE.roads){
    const pts=road.curve || [];
    if(pts.length<24) continue;

    // Verifikasi dilakukan pada potongan jalan yang cukup panjang.
    // Ini lebih adil untuk kurva Canvas karena sampel kecil pada kurva tetap bisa tampak lurus.
    const window=24;
    for(let i=0;i<pts.length-window;i+=window){
      const a=pts[i], b=pts[i+window];
      let arc=0, turn=0, lastAngle=null;

      for(let j=i+1;j<=i+window;j++){
        arc += dist(pts[j-1],pts[j]);
        const ang=Math.atan2(pts[j].y-pts[j-1].y,pts[j].x-pts[j-1].x);
        if(lastAngle!==null){
          let d=Math.abs(ang-lastAngle);
          while(d>Math.PI) d=Math.abs(d-Math.PI*2);
          turn += d;
        }
        lastAngle=ang;
      }

      const chord=dist(a,b);
      const bendRatio=arc>0 ? (arc-chord)/arc : 0;
      total++;

      // Sangat lurus hanya jika deviasi kurva nyaris nol.
      if(bendRatio<0.004 && turn<0.10) straight++;
    }
  }

  const pct=total ? (straight/total*100) : 0;
  setText('iStraight', pct.toFixed(1)+'%');

  if(pct>10){
    log('Verifikasi jalan: segmen lurus sekitar '+pct.toFixed(1)+'%. Klik Generate Jalan Baru bila masih terlihat terlalu lurus.', 'warn');
  }else{
    log('Verifikasi jalan: segmen lurus sekitar '+pct.toFixed(1)+'%, sesuai target ≤10%.', 'ok');
  }
  return pct;
}

function drawFlagMarker(p,color,label){
  if(!p) return;

  ctx.save();
  ctx.translate(p.x,p.y);

  ctx.fillStyle='rgba(0,0,0,.18)';
  ctx.beginPath();
  ctx.ellipse(5,4,14,6,0,0,Math.PI*2);
  ctx.fill();

  ctx.strokeStyle='#334155';
  ctx.lineWidth=4;
  ctx.lineCap='round';
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.lineTo(0,-42);
  ctx.stroke();

  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.moveTo(2,-42);
  ctx.lineTo(34,-34);
  ctx.lineTo(2,-26);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle='rgba(255,255,255,.75)';
  ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(4,-39);
  ctx.lineTo(25,-34);
  ctx.stroke();

  ctx.fillStyle='#ffffff';
  ctx.beginPath();
  ctx.arc(0,0,8,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.arc(0,0,5,0,Math.PI*2);
  ctx.fill();

  ctx.font='bold 12px Arial';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillStyle='rgba(15,23,42,.86)';
  ctx.fillText(label,0,-55);

  ctx.restore();
}
function drawMarkers(){
  const a=STATE.nodes[STATE.startId];
  const b=STATE.nodes[STATE.endId];

  // Marker khusus sesuai catatan project: bendera hijau untuk start, merah untuk end.
  drawFlagMarker(a,'#22c55e','START');
  drawFlagMarker(b,'#ef4444','END');
}
function drawPath(){
  if(!STATE.path || STATE.path.length<2) return;

  const pts=buildRoutePoints(STATE.path);
  if(!pts.length) return;

  ctx.strokeStyle='rgba(245,158,11,.88)';
  ctx.lineWidth=5;
  ctx.setLineDash([8,8]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x,pts[0].y);
  for(const p of pts.slice(1)) ctx.lineTo(p.x,p.y);
  ctx.stroke();
  ctx.setLineDash([]);
}
function drawVehicles(){
  for(const v of STATE.vehicles){
    if(!v) continue;

    if(CFG.showTrail && v.trail){
      ctx.strokeStyle='rgba(99,102,241,.28)';
      ctx.lineWidth=2.5;
      ctx.beginPath();
      for(let i=0;i<v.trail.length;i++){
        const p=v.trail[i];
        if(i===0) ctx.moveTo(p.x,p.y);
        else ctx.lineTo(p.x,p.y);
      }
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(v.x,v.y);
    ctx.rotate(v.angle);

    if(v.type==='motor'){
      // motor top-down, kepala motor di depan
      ctx.fillStyle='rgba(0,0,0,.16)';
      ctx.beginPath();
      ctx.ellipse(0,5,7.5,12,0,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle='#111827';
      roundRect(-2.8,-12,5.6,4.2,1.8); ctx.fill(); // roda depan
      roundRect(-2.8,8,5.6,4.2,1.8); ctx.fill();   // roda belakang

      ctx.fillStyle='#ef4444';
      roundRect(-4.5,-7,9,14,3); ctx.fill();

      ctx.fillStyle='#fca5a5';
      roundRect(-3.2,-8.8,6.4,3.6,1.8); ctx.fill();

      ctx.fillStyle='#1f2937';
      roundRect(-2.5,0,5,5,1.8); ctx.fill();
    } else {
      // mobil top-down proporsional, arah maju ke atas local space
      ctx.fillStyle='rgba(0,0,0,.16)';
      ctx.beginPath();
      ctx.ellipse(0,6,11,17,0,0,Math.PI*2);
      ctx.fill();

      // roda kiri
      ctx.fillStyle='#111827';
      roundRect(-10,-10,4,7,1.8); ctx.fill();
      roundRect(-10,3,4,7,1.8); ctx.fill();
      // roda kanan
      roundRect(6,-10,4,7,1.8); ctx.fill();
      roundRect(6,3,4,7,1.8); ctx.fill();

      // body utama (tegak)
      ctx.fillStyle='#2563eb';
      roundRect(-8,-14,16,28,5); ctx.fill();

      // hood / depan mobil
      ctx.fillStyle='#1d4ed8';
      roundRect(-6,-14,12,6,4); ctx.fill();

      // kaca depan + belakang
      ctx.fillStyle='#bfdbfe';
      roundRect(-5,-6,10,7,2.8); ctx.fill();
      roundRect(-5,2,10,7,2.8); ctx.fill();

      // pilar / garis pintu
      ctx.strokeStyle='rgba(255,255,255,.32)';
      ctx.lineWidth=1;
      ctx.beginPath();
      ctx.moveTo(-6,1);
      ctx.lineTo(6,1);
      ctx.stroke();

      // bumper belakang
      ctx.fillStyle='#1e3a8a';
      roundRect(-6,10,12,3.5,1.8); ctx.fill();
    }

    ctx.restore();
  }
}
function drawNodes(){
  if(!CFG.showNodes) return;
  for(const n of STATE.nodes){
    if(n.id===STATE.startId || n.id===STATE.endId) continue;
    ctx.fillStyle='rgba(30,41,59,.45)'; ctx.beginPath(); ctx.arc(n.x,n.y,2,0,Math.PI*2); ctx.fill();
    if(CFG.showLabels){ ctx.fillStyle='#1e1b4b'; ctx.font='7px Consolas'; ctx.fillText(n.id,n.x+3,n.y-3); }
  }
}
function drawMap(){
  ctx.setTransform(1,0,0,1,0,0);
  const bg=ctx.createRadialGradient(canvas.width*.5,canvas.height*.42,0,canvas.width*.5,canvas.height*.42,Math.max(canvas.width,canvas.height)*.8);
  bg.addColorStop(0,'#a6e6ee'); bg.addColorStop(.5,'#63c8d9'); bg.addColorStop(1,'#349db4');
  ctx.fillStyle=bg; ctx.fillRect(0,0,canvas.width,canvas.height);

  for(let i=0;i<10;i++){
    ctx.strokeStyle=i%2===0?'rgba(255,255,255,.055)':'rgba(0,60,80,.055)';
    ctx.lineWidth=.7; ctx.beginPath(); ctx.ellipse((i*183)%canvas.width,(i*143)%canvas.height,(90+i%4*25)*1.3,90+i%4*25,i*.38,0,Math.PI*2); ctx.stroke();
  }

  ctx.setTransform(STATE.cam.scale,0,0,STATE.cam.scale,STATE.cam.x*STATE.cam.scale,STATE.cam.y*STATE.cam.scale);

  ctx.save(); ctx.shadowColor='rgba(0,50,70,.28)'; ctx.shadowBlur=24; ctx.shadowOffsetY=14; pathSmooth(STATE.island,true); ctx.fillStyle='#dfc88a'; ctx.fill(); ctx.restore();

  pathSmooth(STATE.island,true); ctx.strokeStyle='#f2e090'; ctx.lineWidth=42; ctx.stroke();
  pathSmooth(STATE.island,true); ctx.strokeStyle='#e8cf78'; ctx.lineWidth=26; ctx.stroke();

  pathSmooth(STATE.island,true);
  const lg=ctx.createLinearGradient(250,120,1050,1050);
  lg.addColorStop(0,'#a8d866'); lg.addColorStop(.55,'#90c850'); lg.addColorStop(1,'#7ab240');
  ctx.fillStyle=lg; ctx.fill();
  pathSmooth(STATE.island,true); ctx.strokeStyle='rgba(28,76,46,.42)'; ctx.lineWidth=3.2; ctx.stroke();

  ctx.save();
  const sc=Math.max(.55,STATE.cam.scale);
  ctx.setLineDash([16/sc,12/sc]); ctx.lineDashOffset=-STATE.foamAnim;
  pathSmooth(STATE.island,true); ctx.strokeStyle='rgba(255,255,255,.38)'; ctx.lineWidth=Math.max(5.5,6.5/sc); ctx.stroke();
  ctx.setLineDash([]); ctx.restore();

  for(const g of STATE.lagoons) drawLagoon(g);

  for(const rk of STATE.rocks){
    ctx.fillStyle='rgba(0,0,0,.13)'; ctx.beginPath(); ctx.ellipse(rk.x+3,rk.y+5,rk.r,rk.r*.46,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#6b6b62'; ctx.beginPath(); ctx.ellipse(rk.x,rk.y,rk.r,rk.r*.68,rk.ang,0,0,Math.PI*2); ctx.fill();
  }

  drawRoads();

  if(CFG.showDeco){
    for(const bu of STATE.bushes){
      ctx.fillStyle=bu.c; ctx.beginPath(); ctx.arc(bu.x,bu.y,bu.r,0,Math.PI*2); ctx.fill();
      if(bu.c==='#facc15'){ ctx.fillStyle='rgba(255,255,255,.45)'; ctx.beginPath(); ctx.arc(bu.x+bu.r*.22,bu.y-bu.r*.18,bu.r*.18,0,Math.PI*2); ctx.fill(); }
    }
    const sorted=[...STATE.mountains.map(v=>({...v,_k:'mt'})),...STATE.flowers.map(v=>({...v,_k:'fl'})),...STATE.ornaments.map(v=>({...v,_k:'or'})),...STATE.buildings.map(v=>({...v,_k:'bd'})),...STATE.huts.map(v=>({...v,_k:'ht'})),...STATE.trees.map(v=>({...v,_k:'tr'})),...STATE.umbrellas.map(v=>({...v,_k:'um'}))].sort((a,b)=>a.y-b.y);
    for(const it of sorted){
      if(it._k==='mt') drawMountain(it);
      else if(it._k==='fl') drawFlower(it);
      else if(it._k==='or') drawOrnament(it);
      else if(it._k==='bd') drawBuilding(it);
      else if(it._k==='ht') drawHut(it);
      else if(it._k==='tr') drawTree(it);
      else drawUmbrella(it);
    }
    for(const h of STATE.harbors) drawHarbor(h);
    for(const bt of STATE.boats) drawBoat(bt);
  }
  drawPath(); drawMarkers(); drawVehicles(); drawNodes();
}

/* ---------- vehicle movement ---------- */
function angleLerp(a,b,t){
  let d=b-a;
  while(d>Math.PI) d-=Math.PI*2;
  while(d<-Math.PI) d+=Math.PI*2;
  return a+d*t;
}
function advVehicle(v,amount){
  if(!v.route || v.route.length<2){
    v.done=true;
    return;
  }

  v.idx += amount;
  if(v.idx >= v.route.length-1){
    v.idx=v.route.length-1;
    v.done=true;
    const last=v.route[v.route.length-1];
    v.x=last.x; v.y=last.y;
    return;
  }

  const i=Math.floor(v.idx);
  const t=v.idx-i;
  const p0=v.route[Math.max(0,i-1)];
  const p1=v.route[i];
  const p2=v.route[Math.min(v.route.length-1,i+1)];
  const p3=v.route[Math.min(v.route.length-1,i+2)];

  // posisi tetap pada route A* yang sudah dihaluskan
  v.x=lerp(p1.x,p2.x,t);
  v.y=lerp(p1.y,p2.y,t);

  // ambil tangent lokal dari titik sekitar agar mobil benar-benar ngikut arah jalan
  const tx=lerp(p2.x-p0.x,p3.x-p1.x,t);
  const ty=lerp(p2.y-p0.y,p3.y-p1.y,t);
  const targetAngle=Math.atan2(ty,tx) + Math.PI/2;

  // smoothing kecil saja supaya stabil tapi tidak drifting
  if(typeof v.angle!=='number') v.angle=targetAngle;
  v.angle=angleLerp(v.angle,targetAngle,0.55);

  v.trail.push({x:v.x,y:v.y});
  if(v.trail.length>60) v.trail.shift();
}

function animalSpotFree(o, nx, ny){
  if(!circleInsideIsland(nx, ny, o.r+2)) return false;
  if(nearRoad(nx, ny, o.r+10)) return false;
  if(STATE.lagoons.some(g=>dist(g,{x:nx,y:ny})<g.r+o.r+8)) return false;
  if(STATE.huts.some(h=>dist(h,{x:nx,y:ny})<h.r+o.r+8)) return false;
  if(STATE.buildings.some(b=>dist(b,{x:nx,y:ny})<b.ww+o.r+6)) return false;
  if(STATE.trees.some(tr=>dist(tr,{x:nx,y:ny})<tr.r+o.r+4)) return false;
  if(STATE.rocks.some(rk=>dist(rk,{x:nx,y:ny})<rk.r+o.r+4)) return false;
  return true;
}
function pickAnimalTarget(o){
  for(let tries=0; tries<32; tries++){
    const a = rr(0, Math.PI*2);
    const d = rr(4, o.roam || 16);
    const nx = o.homeX + Math.cos(a)*d;
    const ny = o.homeY + Math.sin(a)*d;
    if(animalSpotFree(o, nx, ny)){
      o.targetX = nx;
      o.targetY = ny;
      o.flip = (o.targetX >= o.x) ? 1 : -1;
      return;
    }
  }
  o.targetX = o.homeX;
  o.targetY = o.homeY;
}
function updateOrnaments(dt){
  for(const o of STATE.ornaments){
    if(o.wait > 0){
      o.wait -= dt;
      o.legPhase += dt * 0.03; // tiny idle motion
      continue;
    }

    const dx = o.targetX - o.x;
    const dy = o.targetY - o.y;
    const d = Math.hypot(dx,dy);

    if(d < 1.6){
      o.wait = rr(35, 140);
      pickAnimalTarget(o);
      continue;
    }

    const step = Math.min(d, (o.speed || 0.4) * dt * 2.2);
    const nx = o.x + dx / (d || 1) * step;
    const ny = o.y + dy / (d || 1) * step;

    if(animalSpotFree(o, nx, ny)){
      o.x = nx;
      o.y = ny;
      o.ang = Math.atan2(dy, dx) * 0.18;
      o.flip = dx >= 0 ? 1 : -1;
      o.legPhase += dt * (o.stepCycle || 0.16);
    }else{
      o.wait = rr(25, 80);
      pickAnimalTarget(o);
    }
  }
}

function updateBoats(dt){
  for(const b of STATE.boats){
    if(!b.moving){
      keepBoatSafe(b);
      continue;
    }

    b.t += b.sp * b.dir * dt;
    if(b.t >= 1){ b.t = 1; b.dir = -1; }
    if(b.t <= 0){ b.t = 0; b.dir = 1; }

    b.x = lerp(b.ax, b.bx, b.t);
    b.y = lerp(b.ay, b.by, b.t);
    b.ang = Math.atan2((b.by-b.ay)*b.dir, (b.bx-b.ax)*b.dir);

    // Jangan sampai hull kapal menyentuh pulau.
    if(boatHitsIsland(b)){
      b.dir *= -1;
      b.t = clamp(b.t + 0.08 * b.dir, 0, 1);
      b.x = lerp(b.ax, b.bx, b.t);
      b.y = lerp(b.ay, b.by, b.t);
      b.ang = Math.atan2((b.by-b.ay)*b.dir, (b.bx-b.ax)*b.dir);
      keepBoatSafe(b);
    }
  }

  // Jaga jarak antar kapal agar tetap rapi.
  separateBoats(2);
}
let lastTs=0;
function animLoop(ts){
  const dt=Math.min((ts-lastTs)/16.67,3); lastTs=ts;
  updateBoats(dt);
  updateOrnaments(dt);

  if(STATE.running && !STATE.paused){
    let allDone=true;
    for(const v of STATE.vehicles){
      if(!v.done){
        advVehicle(v,(CFG.carSpeed*0.72)*dt);
        if(!v.done) allDone=false;
      }
    }
    if(allDone && STATE.vehicles.length){
      STATE.running=false;
      setText('vStatus','DONE');
      const lbl=$('lblStart'); if(lbl) lbl.textContent='START A*';
      showRouteAlert('Kendaraan tiba di tujuan.', 'ok');
      log('Kendaraan berhasil tiba di tujuan.', 'ok');
    }else if(CFG.cameraFollow && STATE.vehicles.length){
      const v=STATE.vehicles[0];
      const targetScale = CFG.cameraZoom ? 2.25 : STATE.cam.scale;
      STATE.cam.scale = lerp(STATE.cam.scale,targetScale,0.03);
      STATE.cam.x = lerp(STATE.cam.x, canvas.width/(2*STATE.cam.scale)-v.x, 0.07);
      STATE.cam.y = lerp(STATE.cam.y, canvas.height/(2*STATE.cam.scale)-v.y, 0.07);
      setText('vZoom',STATE.cam.scale.toFixed(2)+'×');
      const badge=$('followBadge'); if(badge) badge.classList.add('visible');
    }
  }else{
    const badge=$('followBadge'); if(badge) badge.classList.remove('visible');
  }
  STATE.foamAnim+=.30*dt;
  drawMap();
  requestAnimationFrame(animLoop);
}

/* ---------- generate and UI wiring ---------- */
function updateStats(){
  setText('vNodes',STATE.nodes.length);
  setText('vEdges',STATE.edges.length);
  setText('vPath',STATE.path.length?`${STATE.path.length} nodes`:'—');
  setText('vZoom',STATE.cam.scale.toFixed(2)+'×');
  setText('stNodes',STATE.nodes.length);
  setText('stEdges',STATE.edges.length);
  setText('stBuildings',STATE.buildings.length);
  setText('stTrees',STATE.trees.length);
  setText('stRoute',STATE.path.length);
}
function generateMap(forceGovernorInitial=false){
  resetState((Math.random()*4294967295)>>>0);
  srand(STATE.seed);
  const useGovernor = forceGovernorInitial || INITIAL_GOVERNORS_VIEW;
  makeIsland(useGovernor);
  generateRoads();
  generateDecor();
  randomStartEnd();
  if(useGovernor) INITIAL_GOVERNORS_VIEW = false;
  setText('vStatus','READY'); updateStats();
  evaluateRoadCurvature();
  showRouteAlert(useGovernor ? 'Tampilan awal memakai bentuk Governors Island.' : 'Peta baru siap. START A* bisa dijalankan.', 'ok');
  log(useGovernor ? 'Tampilan awal memakai bentuk pulau mirip Governors Island.' : 'Peta baru dibuat memakai logika peta referensi.', 'ok');
  log('Reminder non-kode: pastikan GitHub public, semua anggota commit, dan video demo final disiapkan.', 'warn');
  makeThumbnail();
  drawMap();
}
function generateRoadsOnly(){
  STATE.roads=[]; STATE.roadSamples=[]; STATE.nodes=[]; STATE.edges=[]; STATE.adj={};
  generateRoads(); generateDecor(); randomStartEnd();
  STATE.path=[]; STATE.vehicles=[]; STATE.running=false;
  setText('vStatus','READY'); updateStats();
  evaluateRoadCurvature();
  showRouteAlert('Jalan baru dibuat mengikuti bentuk pulau.', 'ok');
  log('Jalan baru dibuat mengikuti bentuk pulau aktif.', 'ok');
}
function resetAwal(){
  INITIAL_GOVERNORS_VIEW = true;
  generateMap(true);
  fitView();
}
function fitView(){
  if(!canvas.width || !canvas.height) return;
  const sc=Math.min(canvas.width/WW,canvas.height/WH)*.95;
  STATE.cam.scale=sc;
  STATE.cam.x=(canvas.width/sc-WW)/2;
  STATE.cam.y=(canvas.height/sc-WH)/2;
  setText('vZoom',STATE.cam.scale.toFixed(2)+'×');
  drawMap();
}
function zoomAt(px,py,factor){
  const before=c2w(px,py);
  STATE.cam.scale=clamp(STATE.cam.scale*factor,STATE.cam.minScale,STATE.cam.maxScale);
  STATE.cam.x=px/STATE.cam.scale-before.x;
  STATE.cam.y=py/STATE.cam.scale-before.y;
  setText('vZoom',STATE.cam.scale.toFixed(2)+'×');
  drawMap();
}
function makeThumbnail(){
  const img=$('initialThumb');
  if(!img) return;
  try{
    const oldCam={...STATE.cam};
    const oldW=canvas.width, oldH=canvas.height;
    const off=document.createElement('canvas');
    off.width=260; off.height=220;
    const oldCtx=ctx;
    // Simpler thumbnail: draw current canvas after main render if available.
    setTimeout(()=>{ try{ img.src=canvas.toDataURL('image/png'); }catch(e){} },80);
    STATE.cam=oldCam;
  }catch(e){}
}
function resize(){
  canvas.width=cw.clientWidth; canvas.height=cw.clientHeight;
  fitView();
}
function wireEvents(){
  $('btnMap')?.addEventListener('click',()=>{generateMap();fitView();});
  $('btnRoads')?.addEventListener('click',()=>{generateRoadsOnly();fitView();});
  $('btnPos')?.addEventListener('click',()=>{randomStartEnd();drawMap();showRouteAlert('Start/End berhasil diacak.', 'ok');});
  $('btnStart')?.addEventListener('click',()=>{
    if(STATE.running){ STATE.paused=!STATE.paused; setText('vStatus',STATE.paused?'PAUSE':'RUN'); const lbl=$('lblStart'); if(lbl) lbl.textContent=STATE.paused?'LANJUT':'PAUSE'; return; }
    startTrack();
    const lbl=$('lblStart'); if(lbl) lbl.textContent='PAUSE';
  });
  $('btnStep')?.addEventListener('click',stepAstar);
  $('btnReset')?.addEventListener('click',resetAwal);
  $('btnPreset')?.addEventListener('click',resetAwal);
  $('btnZIn')?.addEventListener('click',()=>zoomAt(canvas.width/2,canvas.height/2,1.3));
  $('btnZOut')?.addEventListener('click',()=>zoomAt(canvas.width/2,canvas.height/2,1/1.3));
  $('btnFit')?.addEventListener('click',fitView);

  $('slD')?.addEventListener('input',e=>{ CFG.edgeDensity=(+e.target.value)/10; setText('lbD',CFG.edgeDensity.toFixed(1)); });
  $('slSpd')?.addEventListener('input',e=>{ CFG.carSpeed=(+e.target.value)/2; setText('lbSpd',CFG.carSpeed.toFixed(1)); });
  $('slDelay')?.addEventListener('input',e=>{ CFG.astarDelay=+e.target.value; setText('lbDelay',e.target.value); });
  $('selVehicle')?.addEventListener('change',e=>{ CFG.vehicleType=e.target.value; setText('lbVeh',e.target.options[e.target.selectedIndex].text); STATE.vehicles.forEach(v=>v.type=CFG.vehicleType); });
  $('selHeuristic')?.addEventListener('change',e=>{ CFG.heuristic=e.target.value; setText('iHeuristic',e.target.options[e.target.selectedIndex].text); setText('lbHeur',e.target.options[e.target.selectedIndex].text); });
  $('chkNodes')?.addEventListener('change',e=>{ CFG.showNodes=e.target.checked; drawMap(); });
  $('chkLabels')?.addEventListener('change',e=>{ CFG.showLabels=e.target.checked; drawMap(); });
  $('chkDeco')?.addEventListener('change',e=>{ CFG.showDeco=e.target.checked; drawMap(); });
  $('chkGlow')?.addEventListener('change',e=>{ CFG.showGlow=e.target.checked; drawMap(); });
  $('chkTrail')?.addEventListener('change',e=>{ CFG.showTrail=e.target.checked; drawMap(); });
  $('chkFollow')?.addEventListener('change',e=>{ CFG.cameraFollow=e.target.checked; });
  $('chkZoomFollow')?.addEventListener('change',e=>{ CFG.cameraZoom=e.target.checked; });

  $('modeNone')?.addEventListener('click',()=>setMode('none'));
  $('modeStart')?.addEventListener('click',()=>setMode('start'));
  $('modeEnd')?.addEventListener('click',()=>setMode('end'));

  canvas.addEventListener('mousedown',e=>{
    STATE.drag.active=true; STATE.drag.sx=e.clientX; STATE.drag.sy=e.clientY; STATE.drag.cx0=STATE.cam.x; STATE.drag.cy0=STATE.cam.y;
  });
  window.addEventListener('mouseup',()=>{ STATE.drag.active=false; });
  window.addEventListener('mousemove',e=>{
    if(STATE.drag.active){
      STATE.cam.x=STATE.drag.cx0+(e.clientX-STATE.drag.sx)/STATE.cam.scale;
      STATE.cam.y=STATE.drag.cy0+(e.clientY-STATE.drag.sy)/STATE.cam.scale;
      drawMap();
    }
    const p=c2w(e.offsetX??0,e.offsetY??0);
    setText('hudXY',`x: ${p.x.toFixed(0)}  y: ${p.y.toFixed(0)}`);
  });
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    zoomAt(e.offsetX,e.offsetY,e.deltaY<0?1.12:.89);
  },{passive:false});
  canvas.addEventListener('click',e=>{
    const moved=Math.hypot(e.clientX-STATE.drag.sx,e.clientY-STATE.drag.sy)>4;
    if(moved) return;
    const p=c2w(e.offsetX,e.offsetY);
    let best=null,bestD=Infinity;
    for(const n of STATE.nodes){
      const d=Math.hypot(n.x-p.x,n.y-p.y);
      if(d<bestD){best=n;bestD=d;}
    }
    if(best && bestD<18/STATE.cam.scale){
      if(e.shiftKey || STATE.mode==='end') STATE.endId=best.id;
      else if(STATE.mode==='start' || STATE.mode==='none') STATE.startId=best.id;
      STATE.path=[]; STATE.vehicles=[]; STATE.running=false;
      updateStats(); drawMap();
      showRouteAlert('Titik Start/End diperbarui.', 'ok');
    }
  });
}
function setMode(mode){
  STATE.mode=mode;
  for(const id of ['modeNone','modeStart','modeEnd']) $(id)?.classList.remove('active');
  if(mode==='start') $('modeStart')?.classList.add('active');
  else if(mode==='end') $('modeEnd')?.classList.add('active');
  else $('modeNone')?.classList.add('active');
}
window.addEventListener('resize',resize);

(function addStraightInfoToPanel(){
  const stats = document.querySelector('.stat-card, .card, #statBox, aside');
  if(!document.getElementById('iStraight')){
    const wrap=document.createElement('div');
    wrap.style.cssText='margin-top:8px;font-size:12px;color:#475569;';
    wrap.innerHTML='Jalan lurus: <b id="iStraight">0%</b>';
    (stats || document.body).appendChild(wrap);
  }
})();
wireEvents();
generateMap(true);
resize();
requestAnimationFrame(animLoop);
