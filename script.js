let currentLaw=0,currentArticle=0,mode=localStorage.getItem("study_mode")||"all";
const DONE_KEY="riyoushi_9laws_final_done_v2";
const WEAK_KEY="riyoushi_9laws_final_weak_v2";
const done=new Set(JSON.parse(localStorage.getItem(DONE_KEY)||"[]"));
const weak=new Set(JSON.parse(localStorage.getItem(WEAK_KEY)||"[]"));
const flat=[];
DATA.forEach((law,li)=>law.articles.forEach((a,ai)=>flat.push({law:li,article:ai,id:`${li}-${ai}`,item:a})));

function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.getElementById(id).classList.add("active");window.scrollTo({top:0,behavior:"smooth"});}
function save(){localStorage.setItem(DONE_KEY,JSON.stringify([...done]));localStorage.setItem(WEAK_KEY,JSON.stringify([...weak]));renderHome();renderArticles();updateButtons();}
function isDone(li,ai){return done.has(`${li}-${ai}`);} function isWeak(li,ai){return weak.has(`${li}-${ai}`);}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
function highlight(s,terms=[]){let out=escapeHtml(s);terms.forEach(t=>{if(!t)return;out=out.replaceAll(escapeHtml(t),`<span class="term">${escapeHtml(t)}</span>`)});return out;}
function bodyHtml(text,terms){const parts=text.split(/ (?=[一二三四五六七八九十１２３４５６７８９０0-9]+[ 　])/);if(parts.length<=1)return `<p>${highlight(text,terms)}</p>`;const first=parts.shift();return `<p>${highlight(first,terms)}</p><ul class="body-list">`+parts.map(p=>`<li>${highlight(p.replace(/^[一二三四五六七八九十１２３４５６７８９０0-9]+[ 　]/,""),terms)}</li>`).join("")+`</ul>`;}
function applyMode(){document.body.classList.remove("mode-text","mode-point");if(mode==="text")document.body.classList.add("mode-text");if(mode==="point")document.body.classList.add("mode-point");document.querySelectorAll(".tool").forEach(b=>b.classList.remove("active"));document.getElementById(mode==="text"?"modeText":mode==="point"?"modePoint":"modeAll").classList.add("active");localStorage.setItem("study_mode",mode);}
function renderHome(){
 const list=document.getElementById("lawList");list.innerHTML="";
 DATA.forEach((law,i)=>{
   const total=law.articles.length, learned=law.articles.filter((a,ai)=>isDone(i,ai)).length, important=law.articles.filter(a=>a.importance==="★★★★★"||a.importance==="★★★★").length;
   const row=document.createElement("div");row.className=`law-row group-${law.color}`;
   row.innerHTML=`<div class="num">${i+1}</div><div><div class="law-title">${law.name}</div><div class="law-meta">学習済み ${learned}/${total}</div></div><div class="law-meta">${important} 重要 ›</div>`;
   row.addEventListener("click",()=>{currentLaw=i;renderArticles();show("lawScreen")});list.appendChild(row);
 });
 const jump=document.getElementById("jumpLaw");jump.innerHTML="";DATA.forEach((law,i)=>{const o=document.createElement("option");o.value=i;o.textContent=law.name;jump.appendChild(o)});
 renderProgress();applyMode();
}
function renderProgress(){
 const total=flat.length, importantTotal=flat.filter(x=>x.item.importance==="★★★★★"||x.item.importance==="★★★★").length, importantDone=flat.filter(x=>(x.item.importance==="★★★★★"||x.item.importance==="★★★★")&&done.has(x.id)).length, doneLaws=DATA.filter((law,li)=>law.articles.length&&law.articles.every((a,ai)=>isDone(li,ai))).length, percent=total?Math.round(done.size/total*100):0;
 document.getElementById("doneCount").textContent=done.size+" / "+total;document.getElementById("importantDone").textContent=importantDone+" / "+importantTotal;document.getElementById("weakCount").textContent=weak.size;document.getElementById("doneLaws").textContent=doneLaws+" / "+DATA.length;document.getElementById("percent").textContent=percent+"%";document.getElementById("donut").style.background=`conic-gradient(#1266c3 0 ${percent}%,#e7ebf0 ${percent}% 100%)`;
}
function renderArticles(filter=""){
 const law=DATA[currentLaw];document.getElementById("lawTitle").textContent=law.name;const list=document.getElementById("articleList");list.innerHTML="";
 law.articles.forEach((a,i)=>{const hay=law.name+a.title+a.body+a.points.join("")+(a.traps||[]).join("")+(a.terms||[]).join("");if(filter&&!hay.includes(filter))return;const row=document.createElement("div");row.className="article-row";row.innerHTML=`<span class="article-title ${isDone(currentLaw,i)?"done":""} ${isWeak(currentLaw,i)?"weak":""}">${a.title}</span><span class="stars">${a.importance||a.stars} ›</span>`;row.addEventListener("click",()=>openDetail(currentLaw,i));list.appendChild(row);});
}
function openDetail(li,ai){
 currentLaw=li;currentArticle=ai;const law=DATA[li],a=law.articles[ai];document.getElementById("detailLaw").textContent=law.name+"　"+(a.category||"");document.getElementById("detailTitle").textContent=a.title;document.getElementById("detailStars").textContent=a.importance||a.stars;document.getElementById("detailBody").innerHTML=bodyHtml(a.body,a.terms||[]);
 let ul=document.getElementById("detailPoints");ul.innerHTML="";(a.points||[]).forEach(p=>{const item=document.createElement("li");item.innerHTML=highlight(p,a.terms||[]);ul.appendChild(item)});
 ul=document.getElementById("detailTraps");ul.innerHTML="";(a.traps||[]).forEach(p=>{const item=document.createElement("li");item.innerHTML=highlight(p,a.terms||[]);ul.appendChild(item)});
 const rel=document.getElementById("relatedLinks");rel.innerHTML="";(a.related||[]).forEach(r=>{const b=document.createElement("button");b.textContent=DATA[r.law].name;b.addEventListener("click",()=>{currentLaw=r.law;document.getElementById("detail").classList.add("hidden");renderArticles();show("lawScreen")});rel.appendChild(b)}); if(!(a.related||[]).length)rel.textContent="関連法令なし";
 updateButtons();applyMode();document.getElementById("detail").classList.remove("hidden");
}
function updateButtons(){const id=`${currentLaw}-${currentArticle}`;const btn=document.getElementById("markDone"), w=document.getElementById("weakBtn");if(btn){btn.textContent=done.has(id)?"学習済み":"未学習";btn.classList.toggle("done",done.has(id));}if(w){w.classList.toggle("on",weak.has(id));}}
document.getElementById("markDone").addEventListener("click",()=>{const id=`${currentLaw}-${currentArticle}`;done.has(id)?done.delete(id):done.add(id);save();});
document.getElementById("weakBtn").addEventListener("click",()=>{const id=`${currentLaw}-${currentArticle}`;weak.has(id)?weak.delete(id):weak.add(id);save();});
document.getElementById("closeDetail").addEventListener("click",()=>document.getElementById("detail").classList.add("hidden"));
document.getElementById("prevBtn").addEventListener("click",()=>{const idx=flat.findIndex(x=>x.law===currentLaw&&x.article===currentArticle);if(idx>0){const n=flat[idx-1];openDetail(n.law,n.article)}});
document.getElementById("nextBtn").addEventListener("click",()=>{const idx=flat.findIndex(x=>x.law===currentLaw&&x.article===currentArticle);if(idx<flat.length-1){const n=flat[idx+1];openDetail(n.law,n.article)}});
document.getElementById("backHome").addEventListener("click",()=>show("home"));document.getElementById("backSearchHome").addEventListener("click",()=>show("home"));
document.getElementById("searchBtn").addEventListener("click",()=>document.getElementById("searchBar").classList.toggle("open"));
function renderSearch(q){const box=document.getElementById("searchResults");box.innerHTML="";if(!q){show("home");return}const groups={};flat.filter(x=>(DATA[x.law].name+x.item.title+x.item.body+x.item.points.join("")+(x.item.traps||[]).join("")+(x.item.terms||[]).join("")).includes(q)).forEach(x=>{const cat=x.item.category||"その他";(groups[cat]||(groups[cat]=[])).push(x)});Object.keys(groups).forEach(cat=>{const h=document.createElement("h3");h.className="cat-title";h.textContent=cat+"（"+groups[cat].length+"）";box.appendChild(h);const list=document.createElement("div");list.className="cat-list";groups[cat].forEach(x=>{const row=document.createElement("div");row.className="article-row";row.innerHTML=`<span class="article-title ${isDone(x.law,x.article)?"done":""} ${isWeak(x.law,x.article)?"weak":""}">${DATA[x.law].name}　${x.item.title}</span><span class="stars">${x.item.importance||x.item.stars} ›</span>`;row.addEventListener("click",()=>openDetail(x.law,x.article));list.appendChild(row)});box.appendChild(list)});show("searchScreen");}
document.getElementById("searchInput").addEventListener("input",e=>renderSearch(e.target.value.trim()));document.getElementById("homeSearchInput").addEventListener("input",e=>renderSearch(e.target.value.trim()));
document.getElementById("modeAll").addEventListener("click",()=>{mode="all";applyMode()});document.getElementById("modeText").addEventListener("click",()=>{mode="text";applyMode()});document.getElementById("modePoint").addEventListener("click",()=>{mode="point";applyMode()});
document.getElementById("jumpBtn").addEventListener("click",()=>{const li=Number(document.getElementById("jumpLaw").value), q=document.getElementById("jumpArticle").value.trim();const idx=DATA[li].articles.findIndex(a=>a.title.includes(q));if(idx>=0)openDetail(li,idx);});
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
renderHome();