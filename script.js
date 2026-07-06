let currentLaw=0,currentArticle=0;
const KEY="riyoushi_9laws_final_done_v1";
const done=new Set(JSON.parse(localStorage.getItem(KEY)||"[]"));
const flat=[];
DATA.forEach((law,li)=>law.articles.forEach((a,ai)=>flat.push({law:li,article:ai,id:`${li}-${ai}`,item:a})));

function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.getElementById(id).classList.add("active");window.scrollTo({top:0,behavior:"smooth"});}
function save(){localStorage.setItem(KEY,JSON.stringify([...done]));renderHome();renderArticles();updateDoneButton();}
function isDone(li,ai){return done.has(`${li}-${ai}`);}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
function bodyHtml(text){const parts=text.split(/ (?=[一二三四五六七八九十１２３４５６７８９０0-9]+[ 　])/);if(parts.length<=1)return `<p>${escapeHtml(text)}</p>`;const first=parts.shift();return `<p>${escapeHtml(first)}</p><ul class="body-list">`+parts.map(p=>`<li>${escapeHtml(p.replace(/^[一二三四五六七八九十１２３４５６７８９０0-9]+[ 　]/,""))}</li>`).join("")+`</ul>`;}

function renderHome(){
 const list=document.getElementById("lawList");list.innerHTML="";
 DATA.forEach((law,i)=>{
   const total=law.articles.length;
   const learned=law.articles.filter((a,ai)=>isDone(i,ai)).length;
   const important=law.articles.filter(a=>a.stars==="★★★").length;
   const row=document.createElement("div");
   row.className=`law-row group-${law.color}`;
   row.innerHTML=`<div class="num">${i+1}</div><div><div class="law-title">${law.name}</div><div class="law-meta">学習済み ${learned}/${total}</div></div><div class="law-meta">${important} 重要 ›</div>`;
   row.addEventListener("click",()=>{currentLaw=i;renderArticles();show("lawScreen")});
   list.appendChild(row);
 });
 renderProgress();
}
function renderProgress(){
 const total=flat.length;
 const importantTotal=flat.filter(x=>x.item.stars==="★★★").length;
 const importantDone=flat.filter(x=>x.item.stars==="★★★"&&done.has(x.id)).length;
 const doneLaws=DATA.filter((law,li)=>law.articles.length && law.articles.every((a,ai)=>isDone(li,ai))).length;
 const percent=total?Math.round(done.size/total*100):0;
 document.getElementById("doneCount").textContent=done.size+" / "+total;
 document.getElementById("importantDone").textContent=importantDone+" / "+importantTotal;
 document.getElementById("doneLaws").textContent=doneLaws+" / "+DATA.length;
 document.getElementById("percent").textContent=percent+"%";
 document.getElementById("donut").style.background=`conic-gradient(#1266c3 0 ${percent}%,#e7ebf0 ${percent}% 100%)`;
}
function renderArticles(filter=""){
 const law=DATA[currentLaw];
 document.getElementById("lawTitle").textContent=law.name;
 const list=document.getElementById("articleList");list.innerHTML="";
 law.articles.forEach((a,i)=>{
   const hay=law.name+a.title+a.body+a.points.join("");
   if(filter&&!hay.includes(filter))return;
   const row=document.createElement("div");
   row.className="article-row";
   row.innerHTML=`<span class="article-title ${isDone(currentLaw,i)?"done":""}">${a.title}</span><span class="stars">${a.stars} ›</span>`;
   row.addEventListener("click",()=>openDetail(currentLaw,i));
   list.appendChild(row);
 });
}
function openDetail(li,ai){
 currentLaw=li;currentArticle=ai;
 const law=DATA[li],a=law.articles[ai];
 document.getElementById("detailLaw").textContent=law.name;
 document.getElementById("detailTitle").textContent=a.title;
 document.getElementById("detailStars").textContent=a.stars;
 document.getElementById("detailBody").innerHTML=bodyHtml(a.body);
 const ul=document.getElementById("detailPoints");ul.innerHTML="";
 a.points.forEach(p=>{const li=document.createElement("li");li.textContent=p;ul.appendChild(li)});
 updateDoneButton();
 document.getElementById("detail").classList.remove("hidden");
}
function updateDoneButton(){const btn=document.getElementById("markDone");if(!btn)return;const learned=isDone(currentLaw,currentArticle);btn.textContent=learned?"学習済み":"未学習";btn.classList.toggle("done",learned);}
document.getElementById("markDone").addEventListener("click",()=>{const id=`${currentLaw}-${currentArticle}`;done.has(id)?done.delete(id):done.add(id);save();});
document.getElementById("closeDetail").addEventListener("click",()=>document.getElementById("detail").classList.add("hidden"));
document.getElementById("prevBtn").addEventListener("click",()=>{const idx=flat.findIndex(x=>x.law===currentLaw&&x.article===currentArticle);if(idx>0){const n=flat[idx-1];openDetail(n.law,n.article)}});
document.getElementById("nextBtn").addEventListener("click",()=>{const idx=flat.findIndex(x=>x.law===currentLaw&&x.article===currentArticle);if(idx<flat.length-1){const n=flat[idx+1];openDetail(n.law,n.article)}});
document.getElementById("backHome").addEventListener("click",()=>show("home"));
document.getElementById("backSearchHome").addEventListener("click",()=>show("home"));
document.getElementById("searchBtn").addEventListener("click",()=>document.getElementById("searchBar").classList.toggle("open"));
function renderSearch(q){
 const list=document.getElementById("searchResults");list.innerHTML="";
 if(!q){show("home");return}
 flat.filter(x=>(DATA[x.law].name+x.item.title+x.item.body+x.item.points.join("")).includes(q)).forEach(x=>{
   const row=document.createElement("div");
   row.className="article-row";
   row.innerHTML=`<span class="article-title ${isDone(x.law,x.article)?"done":""}">${DATA[x.law].name}　${x.item.title}</span><span class="stars">${x.item.stars} ›</span>`;
   row.addEventListener("click",()=>openDetail(x.law,x.article));
   list.appendChild(row);
 });
 show("searchScreen");
}
document.getElementById("searchInput").addEventListener("input",e=>renderSearch(e.target.value.trim()));
document.getElementById("homeSearchInput").addEventListener("input",e=>renderSearch(e.target.value.trim()));
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
renderHome();