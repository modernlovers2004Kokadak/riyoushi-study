const $=s=>document.querySelector(s),app=$('#app');
const PREFIX='riyo_v05_';
const store={get:k=>JSON.parse(localStorage.getItem(PREFIX+k)||'null'),set:(k,v)=>localStorage.setItem(PREFIX+k,JSON.stringify(v))};
const today=()=>new Date().toISOString().slice(0,10);
const addDays=(n)=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const jpNo=['1','2','3','4'];
let state={page:'home',session:[],idx:0,selected:null,answered:false,view:null,filter:'all',themeFilter:null,search:'',mockEnd:null,timer:null};
function baseProg(){return{done:{},history:[],mistakes:{},themeStats:{},catStats:{},daily:{},recentIds:[],recentThemes:[],settings:{todayCount:21,recentBlock:30,masterNeed:2}}}
const prog=()=>({...baseProg(),...(store.get('prog')||{})});
const save=p=>store.set('prog',p);
const pct=(n,d)=>d?Math.round(n/d*100):0;
const cat=id=>CATEGORIES.find(c=>c.id===id)||CATEGORIES[0];
const sub=id=>SUBJECTS.find(s=>s.id===id)||SUBJECTS[0];
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const take=(a,n)=>shuffle(a).slice(0,n);

const GROUP_RULE={microbe:'disinfection',infection_control:'disinfection',environment:'public_health',health_promo:'public_health',hair:'skin',anatomy:'skin',nutrition:'skin',disease:'skin',surfactant:'cosmetics',perm:'cosmetics',cosmetic_safety:'cosmetics',ph:'cosmetics',color:'cosmetics',style:'history',design:'history',aesthetics:'history',customer:'shop',accounting:'shop',labor:'shop',complaint:'shop',store:'shop',commerce:'shop',shampoo:'cut',setting:'cut',tools:'cut'};
const groupId=q=>GROUP_RULE[q.category]||q.category;
const qsCat=id=>QUESTIONS.filter(q=>groupId(q)===id);
const qById=id=>QUESTIONS.find(q=>q.id===Number(id));
const memGroups=new Set(['infection','disinfection','public_health','skin','cosmetics','cut','shaving']);
const memoryTarget=q=>memGroups.has(groupId(q))||['hygiene','health','chem','theory'].includes(q.subject);

const MATERIAL_LAW_BY_GROUP={
  barber_act:3, rules:4, order:5, visit:6, infection:7, community:8, consumer:10,
  disinfection:12, public_health:12, skin:12, cosmetics:12, history:12, shop:12, cut:12, shaving:12
};
function materialUrl(q){
  const gid=groupId(q);
  const law=MATERIAL_LAW_BY_GROUP[gid];
  return Number.isInteger(law)?`../教材/index.html#law=${law}`:'../教材/index.html';
}
function materialCta(q){return `<a class="material-confirm-link" href="${materialUrl(q)}">📖 教材</a>`;}
function initFromHash(){
  const hash=decodeURIComponent(location.hash||'');
  const m=hash.match(/cat=([^&]+)/);
  if(m){
    const id=m[1];
    const arr=qsCat(id);
    if(arr.length){startSession(arr,'question');return;}
  }
  if(hash.includes('mistakes')){route('mistakes');return;}
  if(hash.includes('review')){startDue();return;}
  if(hash.includes('mock')){startSession(mockSession(),'question',true);return;}
  render();
}


const POOLS={
 authority:['保健所長','保健所設置市長','都道府県知事','厚生労働大臣','指定試験機関','管理理容師','保健所','開設者'],
 deadline:['あらかじめ','速やかに','直ちに','10日以内','30日以内','7日以内','毎年7月31日まで','検査確認後'],
 role:['理容師','管理理容師','開設者','従業者','利用者','指定試験機関','都道府県知事','保健所長'],
 infection:['一類感染症','二類感染症','三類感染症','四類感染症','五類感染症','指定感染症','新感染症','新型インフルエンザ等感染症'],
 disinfection:['煮沸消毒','蒸気消毒','エタノール消毒','次亜塩素酸ナトリウム消毒','紫外線消毒','逆性石けん','流水洗浄','乾燥保管'],
 health:['表皮','真皮','皮下組織','毛包','皮脂腺','汗腺','角質層','メラニン'],
 chem:['界面活性剤','酸化染毛剤','還元剤','酸化剤','アルカリ剤','酸性染毛料','香料','防腐剤'],
 culture:['バロック','ロココ','ルネサンス','古代エジプト','明治時代','大正時代','昭和時代','現代'],
 manage:['固定費','変動費','損益分岐点','売上高','粗利益','労働時間','顧客満足','情報提供'],
 theory:['ブラントカット','レイヤーカット','グラデーションカット','セニング','シェービング','シャンプーイング','セット','クリッパー']
};
const TEMPLATES={
 barber_act:[['理容所の開設届について、提出先として最も適切なものはどれか。','都道府県知事','authority','開設届は開設者が都道府県知事に届け出る。保健所長や管理理容師と混同しない。','開設者・届出先・時期を分けて覚える'],['理容所の開設者が届出事項を変更した場合の届出時期として最も適切なものはどれか。','速やかに','deadline','変更・廃止の届出は、あらかじめではなく速やかに行う。','開設はあらかじめ、変更・廃止は速やかに'],['理容師が2人以上いる理容所で置かなければならない者はどれか。','管理理容師','role','理容師が2人以上従事する理容所では管理理容師を置く必要がある。','2人以上なら管理理容師']],
 order:[['理容師法施行令で、免許・試験事務の主体として最も適切なものはどれか。','厚生労働大臣','authority','免許・試験に関する主体は店舗の届出先と分けて整理する。','店舗手続と免許手続を混同しない'],['理容師試験の実施事務に関して最も関係が深いものはどれか。','指定試験機関','authority','試験事務では指定試験機関が問われやすい。店舗の開設届とは別に整理する。','試験は指定試験機関']],
 rules:[['開設届に添付する書類として、管理理容師に関係するものを求められる場合があるのはどれか。','管理理容師','role','理容師が2人以上従事する理容所では管理理容師に関する書類が重要になる。','添付書類は従業者数と結びつける'],['開設届の時期として最も適切なものはどれか。','あらかじめ','deadline','開設後ではなく、開設しようとするときにあらかじめ届け出る。','開設前に届出']],
 infection:[['結核の分類として最も適切なものはどれか。','二類感染症','infection','結核は二類感染症。コレラなど三類との混同に注意する。','結核は二類'],['コレラの分類として最も適切なものはどれか。','三類感染症','infection','コレラは三類感染症。結核・ジフテリアなど二類との混同に注意する。','コレラは三類'],['エボラ出血熱の分類として最も適切なものはどれか。','一類感染症','infection','エボラ出血熱は一類感染症。重篤な出血熱としてまとめて覚える。','エボラは一類']],
 community:[['地域保健の中核的施設として最も適切なものはどれか。','保健所','authority','地域保健では保健所と市町村保健センターの役割を分ける。','地域保健は施設の役割を区別'],['地域保健行政で都道府県や保健所設置市と関係が深いものはどれか。','保健所設置市長','authority','保健所設置市という語は理容所手続の提出先とも混同しやすい。','保健所設置市に注意']],
 consumer:[['消費者基本法で中心に置かれる考え方として最も適切なものはどれか。','消費者の権利','manage','消費者基本法は事業者都合ではなく消費者の権利・利益を中心に考える。','消費者の権利が軸'],['事業者が消費者に対して特に重視すべきものはどれか。','情報提供','manage','消費者保護では適切な情報提供と安全確保が重要。','説明不足はトラブルの原因']],
 visit:[['出張理容で最も注意すべき判断として適切なものはどれか。','衛生管理','manage','出張理容では場所が変わっても衛生管理を省略できない。','出張でも衛生管理は同じ'],['出張理容で器具を扱う際、最も重視すべきものはどれか。','消毒済み器具','disinfection','出張時は消毒済み器具と使用済み器具の区別が重要。','清潔・不潔を分ける']],
 disinfection:[['血液が付着したおそれのある器具に対して、特に重視すべき消毒法はどれか。','次亜塩素酸ナトリウム消毒','disinfection','血液付着のおそれがある器具では、通常より強い消毒を選ぶ。','血液付着は強めの消毒'],['消毒前にまず行うべき基本操作として最も適切なものはどれか。','流水洗浄','disinfection','汚れが残ると消毒効果が下がるため、洗浄と消毒を分けて考える。','洗浄してから消毒']],
 public_health:[['公衆衛生で重視される対象として最も適切なものはどれか。','集団の健康','manage','公衆衛生は個人だけでなく集団全体の健康を守る考え方。','個人衛生と公衆衛生を区別'],['感染予防で、病原体が広がる経路を断つ考え方として最も適切なものはどれか。','感染経路対策','disinfection','感染源・感染経路・感受性者の3つを分けて考える。','感染の鎖を切る']],
 skin:[['皮膚の最外層として最も適切なものはどれか。','角質層','health','角質層は外界に接する最外層で、バリア機能と関係する。','最外層は角質層'],['毛を作る部分として最も関係が深いものはどれか。','毛包','health','毛髪は毛包・毛乳頭などの構造と関連して理解する。','毛は毛包で考える']],
 cosmetics:[['洗浄剤で汚れを落とす働きに最も関係が深いものはどれか。','界面活性剤','chem','界面活性剤は水と油をなじませ、洗浄作用に関わる。','洗浄は界面活性剤'],['パーマ第1剤で毛髪の結合を切る働きに関係が深いものはどれか。','還元剤','chem','第1剤は還元、第2剤は酸化。ここを入れ替えた選択肢に注意する。','1剤は還元、2剤は酸化']],
 history:[['理容文化史で時代・様式を問う問題への対応として最も適切なものはどれか。','時代順','culture','文化論は名称だけでなく時代順と特徴の組合せで問われやすい。','文化論は時代順で整理'],['髪型や服飾の変化を理解する際、最も混同しやすい観点はどれか。','様式名','culture','様式名・時代・地域を入れ替えた選択肢に注意する。','様式名と時代をセットで覚える']],
 shop:[['売上から変動費を差し引いて考える利益として最も適切なものはどれか。','粗利益','manage','店舗管理では売上・費用・利益の違いを正確に区別する。','売上と利益を混同しない'],['経営で固定費と変動費を分けて考える指標として最も関係が深いものはどれか。','損益分岐点','manage','損益分岐点は売上と費用の関係を見る重要指標。','固定費・変動費・売上']],
 cut:[['毛先をそろえて重さを残しやすいカットとして最も適切なものはどれか。','ブラントカット','theory','ブラントカットは切り口がそろいやすく、重さを表現しやすい。','重さはブラント'],['段差をつけて軽さや動きを出す技法として最も適切なものはどれか。','レイヤーカット','theory','レイヤーは段差によって軽さや動きを作る。','軽さはレイヤー']],
 shaving:[['シェービングで皮膚を傷つけないために最も重視すべきものはどれか。','皮膚の緊張','theory','刃を当てる角度・皮膚の緊張・毛流れを合わせて考える。','皮膚を張って刃を安定'],['シェービングで毛の生えている方向を確認する目的として最も適切なものはどれか。','毛流れの把握','theory','毛流れを無視すると皮膚刺激や剃り残しにつながる。','毛流れを見て剃る']]
};
function templateIndex(q){const b=TEMPLATES[groupId(q)]||TEMPLATES[q.category]||TEMPLATES.barber_act;return (q.id-1)%b.length}
function themeKey(q){return `${groupId(q)}:${templateIndex(q)}`}
function base(q){const gid=groupId(q),bank=TEMPLATES[gid]||TEMPLATES[q.category]||TEMPLATES.barber_act,t=bank[templateIndex(q)];return{qid:q.id,question:t[0],correct:t[1],pool:POOLS[t[2]]||POOLS.authority,exp:t[3],point:t[4],gid,theme:themeKey(q),tag:t[2],subject:q.subject,importance:q.importance||3}}
function choices(q){const b=base(q),wrong=take(b.pool.filter(x=>x!==b.correct),3);return shuffle([b.correct,...wrong]).map(x=>({text:x,correct:x===b.correct}))}
function currentQ(){const raw=state.session[state.idx]||QUESTIONS[0];if(!state.view||state.view.id!==raw.id||state.view.idx!==state.idx){state.view={id:raw.id,idx:state.idx,choices:choices(raw)}}return raw}
function updateStat(obj,key,ok){obj[key]=obj[key]||{try:0,ok:0};obj[key].try++; if(ok)obj[key].ok++}
function record(q,ok){const p=prog(),b=base(q),day=today();p.done[q.id]=true;p.history.push({id:q.id,ok,day,cat:b.gid,theme:b.theme,tag:b.tag});p.recentIds=[...(p.recentIds||[]),q.id].slice(-100);p.recentThemes=[...(p.recentThemes||[]),b.theme].slice(-100);p.daily[day]=p.daily[day]||{try:0,ok:0};p.daily[day].try++;if(ok)p.daily[day].ok++;updateStat(p.catStats,b.gid,ok);updateStat(p.themeStats,b.theme,ok);
 if(!ok){const m=p.mistakes[q.id]||{id:q.id,wrongCount:0,correctCount:0,streak:0,firstMiss:day,mastered:false,history:[]};m.wrongCount++;m.streak=0;m.mastered=false;m.lastMiss=day;m.nextReview=day;m.lastAnswer=state.view.choices[state.selected]?.text||'';m.correct=state.view.choices.find(c=>c.correct)?.text||b.correct;m.history.push({day,ok:false});p.mistakes[q.id]=m}
 else if(p.mistakes[q.id]){const m=p.mistakes[q.id];m.correctCount++;m.streak=(m.streak||0)+1;m.history.push({day,ok:true});if(m.streak>=2){m.mastered=true;m.nextReview=null}else{const steps=[1,3,7];m.nextReview=addDays(steps[Math.min(m.streak-1,steps.length-1)])}p.mistakes[q.id]=m}
 save(p)}
function smartSession(count=21){const p=prog(),used=new Set(),usedThemes=new Set(),recent=new Set((p.recentIds||[]).slice(-(p.settings?.recentBlock||30))),recentThemes=new Set((p.recentThemes||[]).slice(-30)),out=[];let lastTheme=null;
 const due=Object.values(p.mistakes||{}).filter(m=>!m.mastered&&m.nextReview&&m.nextReview<=today()).map(m=>qById(m.id)).filter(Boolean);
 const wrong=Object.values(p.mistakes||{}).filter(m=>!m.mastered).sort((a,b)=>(b.wrongCount-a.wrongCount)).map(m=>qById(m.id)).filter(Boolean);
 const fresh=QUESTIONS.filter(q=>!p.done[q.id]);
 const buckets=[due,wrong,fresh,QUESTIONS]; const quota=[Math.ceil(count*.3),Math.ceil(count*.2),Math.ceil(count*.4),count];
 function pickFrom(arr){let best=null,bs=-9999;for(const q of shuffle(arr)){if(!q||used.has(q.id))continue;const th=themeKey(q);let sc=0;if(recent.has(q.id))sc-=120;if(th===lastTheme)sc-=100;if(usedThemes.has(th))sc-=40;if(recentThemes.has(th))sc-=20;sc+=(q.importance||3)*3;sc+=Math.random()*5;const catCount=out.filter(x=>groupId(x)===groupId(q)).length;sc-=catCount*12;if(sc>bs){bs=sc;best=q}}return best}
 for(let bi=0;bi<buckets.length&&out.length<count;bi++){let limit=bi===3?count:quota[bi];while(out.filter(x=>buckets[bi].includes(x)).length<limit&&out.length<count){let q=pickFrom(buckets[bi]);if(!q)break;out.push(q);used.add(q.id);lastTheme=themeKey(q);usedThemes.add(lastTheme)}}
 while(out.length<count){let q=pickFrom(QUESTIONS);if(!q)break;out.push(q);used.add(q.id);lastTheme=themeKey(q);usedThemes.add(lastTheme)}
 return out}
function mockSession(){let out=[];const cats=shuffle(CATEGORIES);while(out.length<55){for(const c of cats){const pool=qsCat(c.id).filter(q=>!out.includes(q));if(pool.length&&out.length<55)out.push(shuffle(pool)[0])}}return out}
function startSession(arr,page='question',mock=false){state={...state,page,session:arr,idx:0,selected:null,answered:false,view:null,mockEnd:mock?Date.now()+60*60*1000:null};render();}
function route(page,extra={}){state={...state,page,...extra,selected:null,answered:false,view:null};render()}
const circled=['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮'];
function rankName(q){return (q.importance||3)>=5?'SS':(q.importance||3)>=4?'S':'A'}
function rankCounts(qs){const c={SS:0,S:0,A:0};qs.forEach(q=>c[rankName(q)]++);return c}
function rankText(qs){const r=rankCounts(qs);return `<span class="rank-lines"><span><i class="rank-dot dot-red"></i>最重要　${r.SS}問</span><span><i class="rank-dot dot-orange"></i>重要　${r.S}問</span><span><i class="rank-dot dot-green"></i>頻出　${r.A}問</span></span>`}

function importanceInfo(q){
  const v=typeof q==='number'?q:(q&&q.importance)||0;
  if(v>=5)return {cls:'red',label:'最重要',card:'imp-red'};
  if(v===4)return {cls:'orange',label:'重要',card:'imp-orange'};
  return {cls:'green',label:'頻出',card:'imp-green'};
}
function importanceBadge(q){
  const r=importanceInfo(q);
  return `<span class="importance-badge"><i class="rank-dot dot-${r.cls}"></i>${r.label}</span>`;
}
function importanceClass(q){return importanceInfo(q).card;}
function header(title='理容師国家試験対策',back=false){return `<header class="top">${back?`<button onclick="route('home')">‹</button>`:`<span class="top-spacer"></span>`}<h1>${title}</h1><button onclick="route('search')">⌕</button></header>`}
function bottom(active){return ``}
function home(){const p=prog(),due=dueMistakes(p).length,unmaster=Object.values(p.mistakes||{}).filter(m=>!m.mastered).length;return `<main>${header()}<section class="content today-page"><div class="study-hero"><div class="study-title"><span class="study-icon"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 16c8-4 15-3 20 2v32c-5-5-12-6-20-2V16z"/><path d="M52 16c-8-4-15-3-20 2v32c5-5 12-6 20-2V16z"/></svg></span><div><h2>今日の学習</h2><i></i></div></div><p class="study-sub">最重要レベル4択・21問・分野とテーマを自動調整</p><button class="start-circle" onclick="startSession(smartSession(21),'question')"><span>▶</span><small>開始する</small></button></div><div class="summary-panel"><button class="summary-item sm-green" onclick="startDue()"><span class="summary-icon"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 16c8-4 15-3 20 2v32c-5-5-12-6-20-2V16z"/><path d="M52 16c-8-4-15-3-20 2v32c5-5 12-6 20-2V16z"/></svg></span><span>今日の復習</span><em>${due}問</em></button><button class="summary-item sm-orange" onclick="route('mistakes')"><span class="summary-icon"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M48 24a18 18 0 0 0-30-8l-5 5" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M13 11v10h10" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 40a18 18 0 0 0 30 8l5-5" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M51 53V43H41" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>間違い復習</span><em>${unmaster}問</em></button><button class="summary-item sm-blue" onclick="startSession(mockSession(),'question',true)"><span class="summary-icon"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M22 12h20v10a10 10 0 0 1-20 0V12z" fill="none" stroke="currentColor" stroke-width="6"/><path d="M22 18H12v5a12 12 0 0 0 12 12M42 18h10v5a12 12 0 0 1-12 12" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M32 32v12M24 52h16M20 56h24" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M32 17l2 4 4 .6-3 3 .7 4.4-3.7-2-3.7 2 .7-4.4-3-3 4-.6 2-4z"/></svg></span><span>模試</span><em>55問</em></button><button class="summary-item sm-violet" onclick="route('score')"><span class="summary-icon"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8a24 24 0 1 0 24 24h-8a16 16 0 1 1-16-16V8z"/><path d="M32 22a10 10 0 1 0 10 10H32V22z" opacity=".45"/><path d="M43 9l3 9 9 3-10 5-5 10-3-9-9-3 10-5 5-10z"/></svg></span><span>完全克服率</span><em>${masterRate(p)}%</em></button></div><section class="problem-category-list">${CATEGORIES.map((c,i)=>catRow(c,i,p)).join('')}</section></section>${bottom('home')}</main>`}
function catRow(c,i,p){let qs=qsCat(c.id),clr=sub(c.subject).color;return `<button class="law" onclick="startSession(qsCat('${c.id}'),'question')"><span class="num" style="background:${clr}">${i+1}</span><span class="grow"><span>${c.name}</span><small>${rankText(qs)}</small></span><span class="imp">${qs.length}問 ›</span></button>`}
function progressCard(p){let done=Object.keys(p.done||{}).length,h=p.history||[],ok=h.filter(x=>x.ok).length,week=lastNDays(7).reduce((a,d)=>a+(p.daily?.[d]?.try||0),0),wrong=Object.values(p.mistakes||{}).filter(m=>!m.mastered).length,due=dueMistakes(p).length;return `<section class="progress"><h2>学習の進捗</h2><div class="progress-body"><div class="ring" style="--p:${pct(done,QUESTIONS.length)}"><span>${pct(done,QUESTIONS.length)}%</span><em>${done}/${QUESTIONS.length}</em><small>全体の進捗</small></div><div class="progress-list"><button><span>正答率</span><span>${pct(ok,h.length)}%</span></button><button><span>未学習</span><span>${QUESTIONS.length-done}問</span></button><button onclick="route('mistakes')"><span>苦手数</span><span>${wrong}問 ›</span></button><button onclick="startDue()"><span>復習待ち</span><span>${due}問 ›</span></button><button><span>今日・今週</span><span>${p.daily?.[today()]?.try||0} / ${week}問</span></button></div></div></section>`}
function lastNDays(n){return Array.from({length:n},(_,i)=>{const d=new Date();d.setDate(d.getDate()-i);return d.toISOString().slice(0,10)})}
function masterRate(p){const m=Object.values(p.mistakes||{});return m.length?pct(m.filter(x=>x.mastered).length,m.length):0}
function dueMistakes(p){return Object.values(p.mistakes||{}).filter(m=>!m.mastered&&m.nextReview&&m.nextReview<=today())}
function startDue(){const p=prog(),ids=dueMistakes(p).map(m=>m.id),arr=ids.map(qById).filter(Boolean);startSession(arr.length?arr:smartSession(10),'question')}
function question(){let q=currentQ(),b=base(q),c=cat(b.gid),s=sub(q.subject),ci=state.view.choices.findIndex(x=>x.correct),ok=state.answered&&state.view.choices[state.selected]?.correct;return `<main>${header(`${state.mockEnd?'模試':'第'+(state.idx+1)+'問'} / ${state.session.length}問`,true)}${state.answered?`<div class="resultTop ${ok?'ok':'ng'}">${ok?'⭕':'❌'}<span>${ok?'正解':'不正解'}</span>${!ok?`<span>正解 ${jpNo[ci]} ${state.view.choices[ci].text}</span>`:''}</div>`:''}<section class="content questionContent"><div class="qcard question-card ${importanceClass(q)}"><div class="qmeta"><span>${s.name} ＞ ${c.name}</span><span>${importanceBadge(q)}・4択</span></div><p class="qtext">${b.question}</p>${state.view.choices.map((ch,i)=>choiceBtn(ch,i)).join('')}${!state.answered?`<button class="primary" onclick="answer()">解答する</button>`:''}</div>${state.answered?answerBox(q,ci,b):''}</section>${state.answered?`<div class="fixedNext"><button onclick="nextQ()">次へ</button></div>`:''}${bottom('today')}</main>`}
function choiceBtn(ch,i){let cls='';if(state.selected===i)cls+=' sel';if(state.answered&&ch.correct)cls+=' ok';if(state.answered&&state.selected===i&&!ch.correct)cls+=' ng';return `<button class="choice ${cls}" onclick="select(${i})"><span>${jpNo[i]}</span>${ch.text}</button>`}
function answerBox(q,ci,b){let mem=memoryTarget(q);return `<div class="qcard answer"><h2>${mem?'ここだけ覚える':'解説'}</h2><div class="point">${b.point}</div>${mem?memoryExplain(q,b):''}<details ${mem?'':'open'}><summary>詳しい解説</summary><p>${b.exp}</p><p class="hint">国家試験では、似た用語・数字・届出先を入れ替えた選択肢に注意します。</p></details>${materialCta(q)}</div>`}
function memoryExplain(q,b){const gid=groupId(q);let table='';if(gid==='infection')table='<div class="compare"><span>比較</span><span>一類：エボラ出血熱など</span><span>二類：結核など</span><span>三類：コレラなど</span></div>';if(gid==='cosmetics')table='<div class="compare"><span>比較</span><span>界面活性剤：洗浄・乳化</span><span>還元剤：パーマ第1剤</span><span>酸化剤：パーマ第2剤・染毛</span></div>';if(gid==='disinfection')table='<div class="compare"><span>比較</span><span>洗浄：汚れを落とす</span><span>消毒：微生物を減らす</span><span>血液付着：強めの消毒</span></div>';return `<div class="memo"><p><span>覚え方</span><br>${b.point}</p><p><span>ひっかけ</span><br>正解語と似た語を並べて迷わせる問題です。語尾まで確認します。</p><p><span>頻出度</span><br>★★★★★</p>${table}</div>`}
function select(i){if(!state.answered){state.selected=i;render()}}
function answer(){if(state.selected===null)return;record(currentQ(),!!state.view.choices[state.selected]?.correct);state.answered=true;render()}
function nextQ(){state.idx<state.session.length-1?route('question',{idx:state.idx+1}):route('score')}
function mistakes(){const p=prog(),list=Object.values(p.mistakes||{}).filter(m=>state.filter==='all'||(state.filter==='due'&&!m.mastered&&m.nextReview&&m.nextReview<=today())||(state.filter==='unmastered'&&!m.mastered)||(state.filter==='mastered'&&m.mastered)||groupId(qById(m.id)||{})===state.filter).sort((a,b)=>(a.mastered-b.mastered)||(b.wrongCount-a.wrongCount));return `<main>${header('間違いノート',true)}<section class="content"><div class="tabs"><button onclick="state.filter='all';render()">すべて</button><button onclick="state.filter='due';render()">今日の復習</button><button onclick="state.filter='unmastered';render()">未克服</button><button onclick="state.filter='mastered';render()">克服済</button></div><div class="chips">${CATEGORIES.map(c=>`<button onclick="state.filter='${c.id}';render()">${c.name}</button>`).join('')}</div><div class="qcard"><h2>苦手ランキング</h2>${rankingList(p)}</div>${list.length?list.map(m=>mistakeRow(m)).join(''):'<div class="empty">該当する問題はありません。</div>'}</section>${bottom('mistake')}</main>`}
function mistakeRow(m){const q=qById(m.id),b=base(q);return `<button class="law" onclick="startSession([qById(${m.id})],'question')"><span class="num">${m.mastered?'✓':'△'}</span><span class="grow"><span>${cat(b.gid).name}／${b.point}</span><small>ミス ${m.wrongCount}回　連続正解 ${m.streak||0}回　次回 ${m.nextReview||'通常'}</small></span><span>解く ›</span></button>`}
function rankingCard(p){return `<div class="qcard"><h2>苦手ランキング</h2>${rankingList(p)}<button class="primary light" onclick="route('mistakes')">間違いノートへ</button></div>`}
function rankingList(p){const map={};Object.values(p.mistakes||{}).forEach(m=>{if(m.mastered)return;const q=qById(m.id);if(!q)return;const b=base(q),k=b.point;map[k]=(map[k]||0)+m.wrongCount});const arr=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);return arr.length?arr.map((x,i)=>`<div class="rank"><span>${i+1}　${x[0]}</span><span>${x[1]}回</span></div>`).join(''):'<p class="muted">まだ苦手データがありません</p>'}
function score(){const p=prog(),h=p.history||[],ok=h.filter(x=>x.ok).length;return `<main>${header('進捗',true)}<section class="content">${progressCard(p)}<div class="qcard"><h2>正答率</h2><p class="score">${pct(ok,h.length)}%</p><p>${ok} / ${h.length}</p></div><h2>テーマ別正答率</h2>${Object.entries(p.themeStats||{}).slice(0,20).map(([k,v])=>`<div class="subject-row"><span>${themeName(k)}</span><span>${pct(v.ok,v.try)}%</span></div>`).join('')}</section>${bottom('score')}</main>`}
function catScoreRow(c,i,p){let qs=qsCat(c.id),st=p.catStats?.[c.id]||{try:0,ok:0};return `<button class="subject-row" onclick="startSession(qsCat('${c.id}'),'question')"><span>${c.name}<small>${rankText(qs)}</small></span><span>正答率 ${pct(st.ok,st.try)}%</span></button>`}
function themeName(k){const [gid,idx]=k.split(':'),q=QUESTIONS.find(x=>groupId(x)===gid&&String(templateIndex(x))===idx);return `${cat(gid).name}／${base(q||QUESTIONS[0]).point}`}
function searchPage(){let t=state.search,qs=t?QUESTIONS.filter(q=>{let b=base(q);return (b.question+b.exp+b.point+cat(b.gid).name).includes(t)}):[];return `<main>${header('検索',true)}<section class="content"><input class="search" placeholder="キーワードで検索" value="${t}" oninput="state.search=this.value;render()">${qs.map(q=>{let b=base(q);return `<button class="law" onclick="startSession([qById(${q.id})],'question')"><span class="num">⌕</span><span class="grow"><span>${cat(b.gid).name}</span><small>${b.question}</small></span><span>›</span></button>`}).join('')}</section>${bottom('home')}</main>`}
function settings(){return `<main>${header('設定',true)}<section class="content"><div class="qcard"><p>学習データはこの端末のブラウザに保存されます。</p><button class="danger" onclick="if(confirm('学習データを削除しますか？')){localStorage.removeItem(PREFIX+'prog');route('home')}">学習データをリセット</button></div></section>${bottom('settings')}</main>`}
function render(){app.innerHTML=({home,question,mistakes,search:searchPage,score,settings}[state.page]||home)()}
initFromHash();
