let currentLaw=0,currentArticle=0,mode=localStorage.getItem("study_mode")||"all";
const DONE_KEY="riyoushi_9laws_final_done_v3";
const WEAK_KEY="riyoushi_9laws_final_weak_v2";
const BOOKMARK_KEY="riyoushi_9laws_final_bookmark_v1";
const done=new Set(JSON.parse(localStorage.getItem(DONE_KEY)||"[]"));
const weak=new Set(JSON.parse(localStorage.getItem(WEAK_KEY)||"[]"));
const bookmarks=new Set(JSON.parse(localStorage.getItem(BOOKMARK_KEY)||"[]"));
const flat=[];
DATA.forEach((law,li)=>law.articles.forEach((a,ai)=>flat.push({law:li,article:ai,id:`${li}-${ai}`,item:a})));

function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));document.getElementById(id).classList.add("active");window.scrollTo({top:0,behavior:"smooth"});}
function save(){localStorage.setItem(DONE_KEY,JSON.stringify([...done]));localStorage.setItem(WEAK_KEY,JSON.stringify([...weak]));localStorage.setItem(BOOKMARK_KEY,JSON.stringify([...bookmarks]));renderHome();renderArticles();updateButtons();}
function isDone(li,ai){return done.has(`${li}-${ai}`);} function isWeak(li,ai){return weak.has(`${li}-${ai}`);} function isBookmarked(li,ai){return bookmarks.has(`${li}-${ai}`);}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));}
function highlight(s,terms=[]){let out=escapeHtml(s);terms.forEach(t=>{if(!t)return;out=out.replaceAll(escapeHtml(t),`<span class="term">${escapeHtml(t)}</span>`)});return out;}
function bodyHtml(text,terms){const parts=text.split(/ (?=[一二三四五六七八九十１２３４５６７８９０0-9]+[ 　])/);if(parts.length<=1)return `<p>${highlight(text,terms)}</p>`;const first=parts.shift();return `<p>${highlight(first,terms)}</p><ul class="body-list">`+parts.map(p=>`<li>${highlight(p.replace(/^[一二三四五六七八九十１２３４５６７８９０0-9]+[ 　]/,""),terms)}</li>`).join("")+`</ul>`;}
function applyMode(){document.body.classList.remove("mode-text","mode-point");if(mode==="text")document.body.classList.add("mode-text");if(mode==="point")document.body.classList.add("mode-point");localStorage.setItem("study_mode",mode);}
function toggleDone(li,ai){const id=`${li}-${ai}`;done.has(id)?done.delete(id):done.add(id);save();}
function toggleBookmark(li,ai){const id=`${li}-${ai}`;bookmarks.has(id)?bookmarks.delete(id):bookmarks.add(id);save();}
function actionButtons(li,ai){return `<div class="article-actions"><button class="mini-btn done-toggle ${isDone(li,ai)?"on":""}" data-law="${li}" data-article="${ai}" aria-label="学習済み">👍</button><button class="mini-btn bookmark-toggle ${isBookmarked(li,ai)?"on":""}" data-law="${li}" data-article="${ai}" aria-label="ブックマーク">🔖</button></div>`;}
function bindActionButtons(root=document){root.querySelectorAll(".done-toggle").forEach(btn=>btn.addEventListener("click",e=>{e.stopPropagation();toggleDone(Number(btn.dataset.law),Number(btn.dataset.article));}));root.querySelectorAll(".bookmark-toggle").forEach(btn=>btn.addEventListener("click",e=>{e.stopPropagation();toggleBookmark(Number(btn.dataset.law),Number(btn.dataset.article));}));}
function renderHome(){
 const list=document.getElementById("lawList");list.innerHTML="";
 DATA.forEach((law,i)=>{
   const total=law.articles.length, learned=law.articles.filter((a,ai)=>isDone(i,ai)).length, important=law.articles.filter(a=>["★★★★★","★★★★","★★★"].includes(a.importance)).length;
   const row=document.createElement("div");row.className=`law-row group-${law.color}`;
   row.innerHTML=`<div class="num">${i+1}</div><div><div class="law-title">${law.name}</div><div class="law-meta">学習済み ${learned}/${total}</div></div><div class="law-meta">${important} 重要 ›</div>`;
   row.addEventListener("click",()=>{currentLaw=i;renderArticles();show("lawScreen")});list.appendChild(row);
 });
 renderProgress();renderHomeActions();applyMode();
}
function renderHomeActions(){
 let box=document.getElementById("homeActions");
 if(!box){box=document.createElement("div");box.id="homeActions";box.className="home-actions";document.getElementById("home").appendChild(box);}
 box.innerHTML=`<button id="homeDoneBtn" class="home-action-btn">👍 学習済み ${done.size}</button><button id="homeBookmarkBtn" class="home-action-btn">🔖 ブックマーク ${bookmarks.size}</button>`;
 document.getElementById("homeDoneBtn").addEventListener("click",()=>renderFilteredList("👍 学習済み",x=>done.has(x.id)));
 document.getElementById("homeBookmarkBtn").addEventListener("click",()=>renderFilteredList("🔖 ブックマーク",x=>bookmarks.has(x.id)));
}
function renderProgress(){
 const total=flat.length, importantTotal=flat.filter(x=>["★★★★★","★★★★","★★★"].includes(x.item.importance)).length, importantDone=flat.filter(x=>(["★★★★★","★★★★","★★★"].includes(x.item.importance))&&done.has(x.id)).length, doneLaws=DATA.filter((law,li)=>law.articles.length&&law.articles.every((a,ai)=>isDone(li,ai))).length, percent=total?Math.round(done.size/total*100):0;
 document.getElementById("doneCount").textContent=done.size+" / "+total;document.getElementById("importantDone").textContent=importantDone+" / "+importantTotal;document.getElementById("weakCount").textContent=weak.size;document.getElementById("doneLaws").textContent=doneLaws+" / "+DATA.length;document.getElementById("percent").textContent=percent+"%";document.getElementById("donut").style.background=`conic-gradient(#1266c3 0 ${percent}%,#e7ebf0 ${percent}% 100%)`;
}
function renderArticles(filter=""){
 const law=DATA[currentLaw];document.getElementById("lawTitle").textContent=law.name;const list=document.getElementById("articleList");list.innerHTML="";
 law.articles.forEach((a,i)=>{const hay=law.name+a.title+a.body+a.points.join("")+(a.traps||[]).join("")+(a.terms||[]).join("");if(filter&&!hay.includes(filter))return;const row=document.createElement("div");row.className="article-row";row.innerHTML=`<span class="article-title ${isDone(currentLaw,i)?"done":""} ${isWeak(currentLaw,i)?"weak":""} ${isBookmarked(currentLaw,i)?"bookmarked":""}">${a.title}</span><span class="stars">${a.importance||a.stars} ›</span>${actionButtons(currentLaw,i)}`;row.addEventListener("click",()=>openDetail(currentLaw,i));list.appendChild(row);});
 bindActionButtons(list);
}
function renderFilteredList(title,predicate){const box=document.getElementById("searchResults");box.innerHTML="";const h=document.querySelector("#searchScreen h2");if(h)h.textContent=title;const results=flat.filter(predicate);if(!results.length){box.innerHTML='<div class="empty">該当する項目はありません。</div>';}else{const list=document.createElement("div");list.className="cat-list";results.forEach(x=>{const row=document.createElement("div");row.className="article-row";row.innerHTML=`<span class="article-title ${isDone(x.law,x.article)?"done":""} ${isWeak(x.law,x.article)?"weak":""} ${isBookmarked(x.law,x.article)?"bookmarked":""}">${DATA[x.law].name}　${x.item.title}</span><span class="stars">${x.item.importance||x.item.stars} ›</span>${actionButtons(x.law,x.article)}`;row.addEventListener("click",()=>openDetail(x.law,x.article));list.appendChild(row)});box.appendChild(list);bindActionButtons(box);}show("searchScreen");}
function openDetail(li,ai){
 currentLaw=li;currentArticle=ai;const law=DATA[li],a=law.articles[ai];document.getElementById("detailLaw").textContent=law.name+"　"+(a.category||"");document.getElementById("detailTitle").textContent=a.title;document.getElementById("detailStars").textContent=a.importance||a.stars;document.getElementById("detailBody").innerHTML=bodyHtml(a.body,a.terms||[]);
 let ul=document.getElementById("detailPoints");ul.innerHTML="";(a.points||[]).forEach(p=>{const item=document.createElement("li");item.innerHTML=highlight(p,a.terms||[]);ul.appendChild(item)});
 ul=document.getElementById("detailTraps");ul.innerHTML="";(a.traps||[]).forEach(p=>{const item=document.createElement("li");item.innerHTML=highlight(p,a.terms||[]);ul.appendChild(item)});
 const rel=document.getElementById("relatedLinks");rel.innerHTML="";(a.related||[]).forEach(r=>{const b=document.createElement("button");b.textContent=DATA[r.law].name;b.addEventListener("click",()=>{currentLaw=r.law;document.getElementById("detail").classList.add("hidden");renderArticles();show("lawScreen")});rel.appendChild(b)}); if(!(a.related||[]).length)rel.textContent="関連法令なし";
 updateButtons();applyMode();document.getElementById("detail").classList.remove("hidden");
}
function updateButtons(){const id=`${currentLaw}-${currentArticle}`;const btn=document.getElementById("markDone"), w=document.getElementById("weakBtn"), b=document.getElementById("bookmarkBtn");if(btn){btn.textContent=done.has(id)?"👍 学習済み":"👍 OK";btn.classList.toggle("done",done.has(id));}if(w){w.classList.toggle("on",weak.has(id));}if(b){b.textContent=bookmarks.has(id)?"🔖 保存中":"🔖 保存";b.classList.toggle("on",bookmarks.has(id));}}
document.getElementById("markDone").addEventListener("click",()=>toggleDone(currentLaw,currentArticle));
document.getElementById("weakBtn").addEventListener("click",()=>{const id=`${currentLaw}-${currentArticle}`;weak.has(id)?weak.delete(id):weak.add(id);save();});
document.getElementById("bookmarkBtn").addEventListener("click",()=>toggleBookmark(currentLaw,currentArticle));
document.getElementById("closeDetail").addEventListener("click",()=>document.getElementById("detail").classList.add("hidden"));
document.getElementById("prevBtn").addEventListener("click",()=>{const idx=flat.findIndex(x=>x.law===currentLaw&&x.article===currentArticle);if(idx>0){const n=flat[idx-1];openDetail(n.law,n.article)}});
document.getElementById("nextBtn").addEventListener("click",()=>{const idx=flat.findIndex(x=>x.law===currentLaw&&x.article===currentArticle);if(idx<flat.length-1){const n=flat[idx+1];openDetail(n.law,n.article)}});
document.getElementById("backHome").addEventListener("click",()=>show("home"));document.getElementById("backSearchHome").addEventListener("click",()=>{const h=document.querySelector("#searchScreen h2");if(h)h.textContent="検索結果";show("home")});
document.getElementById("searchBtn").addEventListener("click",()=>document.getElementById("searchBar").classList.toggle("open"));
function renderSearch(q){const box=document.getElementById("searchResults");box.innerHTML="";const h=document.querySelector("#searchScreen h2");if(h)h.textContent="検索結果";if(!q){show("home");return}const groups={};flat.filter(x=>(DATA[x.law].name+x.item.title+x.item.body+x.item.points.join("")+(x.item.traps||[]).join("")+(x.item.terms||[]).join("")).includes(q)).forEach(x=>{const cat=x.item.category||"その他";(groups[cat]||(groups[cat]=[])).push(x)});Object.keys(groups).forEach(cat=>{const h=document.createElement("h3");h.className="cat-title";h.textContent=cat+"（"+groups[cat].length+"）";box.appendChild(h);const list=document.createElement("div");list.className="cat-list";groups[cat].forEach(x=>{const row=document.createElement("div");row.className="article-row";row.innerHTML=`<span class="article-title ${isDone(x.law,x.article)?"done":""} ${isWeak(x.law,x.article)?"weak":""} ${isBookmarked(x.law,x.article)?"bookmarked":""}">${DATA[x.law].name}　${x.item.title}</span><span class="stars">${x.item.importance||x.item.stars} ›</span>${actionButtons(x.law,x.article)}`;row.addEventListener("click",()=>openDetail(x.law,x.article));list.appendChild(row)});box.appendChild(list);bindActionButtons(list)});show("searchScreen");}
document.getElementById("searchInput").addEventListener("input",e=>renderSearch(e.target.value.trim()));

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
renderHome();
