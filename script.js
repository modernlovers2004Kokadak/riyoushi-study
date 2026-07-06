let currentLaw=0, currentChapter=0, currentArticle=0;
const STORAGE_KEY="riyoushi_9laws_done_v1";
const done=new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"));
const flat=[];
DATA.forEach((law,li)=>law.chapters.forEach((ch,ci)=>ch.articles.forEach((a,ai)=>flat.push({id:`${li}-${ci}-${ai}`,law:li,chapter:ci,article:ai,item:a,chapterTitle:ch.title}))));

function saveDone(){localStorage.setItem(STORAGE_KEY,JSON.stringify([...done]));renderProgress();}
function isDone(li,ci,ai){return done.has(`${li}-${ci}-${ai}`);}
function show(id){
 document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
 document.getElementById(id).classList.add("active");
 document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.nav===id));
 window.scrollTo({top:0,behavior:"smooth"});
 if(id==="home") initHome();
 if(id==="laws") renderAccordion();
 if(id==="important") renderImportant();
}
document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.nav)));

function lawStats(law){
 let total=law.chapters.reduce((n,c)=>n+c.articles.length,0);
 let important=law.chapters.reduce((n,c)=>n+c.articles.filter(a=>a.stars==="★★★").length,0);
 return {total,important};
}
function initHome(){
 const list=document.getElementById("lawList");
 list.innerHTML="";
 DATA.forEach((law,i)=>{
   const s=lawStats(law);
   const learned=flat.filter(x=>x.law===i && done.has(x.id)).length;
   const row=document.createElement("div");
   row.className="law-row group-"+law.color;
   row.innerHTML=`<div class="num">${i+1}</div><div><div class="law-title">${law.name}</div><div class="law-meta">学習済み ${learned}/${s.total}</div></div><div class="law-meta">${s.important} 重要 ›</div>`;
   row.addEventListener("click",()=>{currentLaw=i;show("laws")});
   list.appendChild(row);
 });
 renderProgress();
}
function renderProgress(){
 const total=flat.length;
 const importantTotal=flat.filter(x=>x.item.stars==="★★★").length;
 const importantDone=flat.filter(x=>x.item.stars==="★★★" && done.has(x.id)).length;
 const doneLaws=DATA.filter((law,li)=>{
   const lawItems=flat.filter(x=>x.law===li);
   return lawItems.length>0 && lawItems.every(x=>done.has(x.id));
 }).length;
 const percent=total?Math.round(done.size/total*100):0;
 document.getElementById("articleCount").textContent=total+" 条文";
 document.getElementById("doneArticles").textContent=done.size+" / "+total;
 document.getElementById("importantDone").textContent=importantDone+" / "+importantTotal;
 document.getElementById("doneLaws").textContent=doneLaws+" / 9";
 document.getElementById("percent").textContent=percent+"%";
 document.getElementById("donut").style.background=`conic-gradient(#1266c3 0 ${percent}%,#e7ebf0 ${percent}% 100%)`;
}
function renderAccordion(){
 const law=DATA[currentLaw];
 document.getElementById("lawScreenTitle").textContent=law.name;
 const acc=document.getElementById("accordion");
 acc.innerHTML="";

 law.chapters.forEach((ch,ci)=>{
   // 「本文」という見出しは出さず、条文カードを直接表示
   if(ch.title==="本文"){
     ch.articles.forEach((a,ai)=>{
       const item=document.createElement("div");
       item.className="article-item direct-article";
       item.innerHTML=`<span class="article-name ${isDone(currentLaw,ci,ai)?"done":""}">${a.title}</span><span class="stars">${a.stars} ›</span>`;
       item.addEventListener("click",()=>openArticle(currentLaw,ci,ai));
       acc.appendChild(item);
     });
     return;
   }

   const block=document.createElement("div");
   block.className="chapter-block";
   block.innerHTML=`<button class="chapter-btn"><span>${ch.title}</span><span>⌄</span></button><div class="article-list"></div>`;
   const articleList=block.querySelector(".article-list");
   ch.articles.forEach((a,ai)=>{
     const item=document.createElement("div");
     item.className="article-item";
     item.innerHTML=`<span class="article-name ${isDone(currentLaw,ci,ai)?"done":""}">${a.title}</span><span class="stars">${a.stars} ›</span>`;
     item.addEventListener("click",()=>openArticle(currentLaw,ci,ai));
     articleList.appendChild(item);
   });
   block.querySelector(".chapter-btn").addEventListener("click",()=>{
     document.querySelectorAll(".chapter-block").forEach(b=>{if(b!==block)b.classList.remove("open")});
     block.classList.toggle("open");
   });
   acc.appendChild(block);
 });
}
function bodyToHtml(text){
 const parts=text.split(/ (?=[一二三四五六七八九十]+ )/);
 if(parts.length<=1) return `<p>${escapeHtml(text)}</p>`;
 const first=parts.shift();
 return `<p>${escapeHtml(first)}</p><ul class="body-list">`+parts.map(p=>`<li>${escapeHtml(p.replace(/^[一二三四五六七八九十]+ /,""))}</li>`).join("")+`</ul>`;
}
function openArticle(li,ci,ai){
 currentLaw=li; currentChapter=ci; currentArticle=ai;
 const law=DATA[li], ch=law.chapters[ci], a=ch.articles[ai];
 document.getElementById("detailLawName").textContent=law.name;
 document.getElementById("detailChapter").textContent=ch.title;
 document.getElementById("detailTitle").textContent=a.title;
 document.getElementById("detailStars").textContent=a.stars;
 document.getElementById("detailBody").innerHTML=bodyToHtml(a.body);
 const ul=document.getElementById("detailPoints");
 ul.innerHTML="";
 a.points.forEach(p=>{const item=document.createElement("li");item.textContent=p;ul.appendChild(item)});
 updateMarkButton();
 show("detail");
}
function updateMarkButton(){
 const btn=document.getElementById("markDone");
 const id=`${currentLaw}-${currentChapter}-${currentArticle}`;
 const learned=done.has(id);
 btn.textContent=learned?"学習済み":"未学習";
 btn.classList.toggle("done",learned);
}
document.getElementById("markDone").addEventListener("click",()=>{
 const id=`${currentLaw}-${currentChapter}-${currentArticle}`;
 if(done.has(id)){done.delete(id)}else{done.add(id)}
 saveDone();
 updateMarkButton();
});
function moveArticle(step){
 const idx=flat.findIndex(x=>x.law===currentLaw&&x.chapter===currentChapter&&x.article===currentArticle);
 const next=flat[idx+step];
 if(next) openArticle(next.law,next.chapter,next.article);
}
document.getElementById("prevArticle").addEventListener("click",()=>moveArticle(-1));
document.getElementById("nextArticle").addEventListener("click",()=>moveArticle(1));

function renderImportant(star="all"){
 const list=document.getElementById("importantList");
 list.innerHTML="";
 flat.filter(x=>{
   if(star==="undone") return !done.has(x.id);
   return star==="all" ? x.item.stars!=="★" : x.item.stars===star;
 }).forEach(x=>{
   const card=document.createElement("div");
   card.className="important-card";
   card.innerHTML=`<span>${DATA[x.law].name}　${x.item.title}</span><div class="stars">${x.item.stars}</div><small>${x.item.points[0]||""}</small>`;
   card.addEventListener("click",()=>openArticle(x.law,x.chapter,x.article));
   list.appendChild(card);
 });
}
document.querySelectorAll("[data-star]").forEach(b=>b.addEventListener("click",()=>{
 document.querySelectorAll("[data-star]").forEach(x=>x.classList.remove("active"));
 b.classList.add("active");
 renderImportant(b.dataset.star);
}));
function escapeHtml(s){return String(s).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m];});}
document.getElementById("searchBtn").addEventListener("click",()=>document.getElementById("searchBar").classList.toggle("open"));
document.getElementById("searchInput").addEventListener("input",e=>{
 const q=e.target.value.trim();
 if(!q){show("home");return}
 show("important");
 const list=document.getElementById("importantList");
 list.innerHTML="";
 flat.filter(x=>(DATA[x.law].name+x.item.title+x.item.body+x.item.points.join("")).includes(q)).forEach(x=>{
   const card=document.createElement("div");
   card.className="important-card";
   card.innerHTML=`<span>${DATA[x.law].name}　${x.item.title}</span><div class="stars">${x.item.stars}</div><small>${x.item.body.slice(0,70)}…</small>`;
   card.addEventListener("click",()=>openArticle(x.law,x.chapter,x.article));
   list.appendChild(card);
 });
});

const homeSearch=document.getElementById("homeSearchInput");
if(homeSearch){
 homeSearch.addEventListener("input",e=>{
   const q=e.target.value.trim();
   if(!q){return}
   show("important");
   const list=document.getElementById("importantList");
   list.innerHTML="";
   flat.filter(x=>(DATA[x.law].name+x.item.title+x.item.body+x.item.points.join("")).includes(q)).forEach(x=>{
     const card=document.createElement("div");
     card.className="important-card";
     card.innerHTML=`<span>${DATA[x.law].name}　${x.item.title}</span><div class="stars">${x.item.stars}</div><small>${x.item.body.slice(0,70)}…</small>`;
     card.addEventListener("click",()=>openArticle(x.law,x.chapter,x.article));
     list.appendChild(card);
   });
 });
}

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
initHome();
