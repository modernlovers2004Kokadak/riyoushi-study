require('vm').runInThisContext(require('fs').readFileSync('/mnt/data/work_kakomon/data.js','utf8'));
for (const c of CATEGORIES){console.log(c.id,c.name, QUESTIONS.filter(q=>q.category===c.id).length)}
