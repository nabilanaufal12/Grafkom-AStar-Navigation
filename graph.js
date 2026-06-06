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