const fs=require('fs');
try {
  const env=fs.readFileSync('.env.local', 'utf8');
  const key=env.match(/GEMINI_API_KEY=(.*)/)[1].trim();
  fetch('https://generativelanguage.googleapis.com/v1beta/models?key='+key)
    .then(r=>r.json())
    .then(d=>{
      if(d.models) {
        console.log(JSON.stringify(d.models.map(m=>m.name).filter(n=>n.includes('gemini')||n.includes('embed')), null, 2));
      } else {
        console.log("No models array:", d);
      }
    }).catch(e => console.error("Fetch error:", e));
} catch(e) {
  console.error("Setup error:", e);
}
