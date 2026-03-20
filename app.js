var GREEN_MAX=349,YELLOW_MAX=3549;
function colorFor(s){return s<=GREEN_MAX?'green':s<=YELLOW_MAX?'yellow':'red'}
function dwellFactor(d,act,vis){
 if(!act&&!vis)return Math.min(d,60)*5;
 if(d===0)return 15;if(d<=3)return d*50;if(d<=5)return 150+(d-3)*100;
 if(d===6)return 350+(d-5)*200;if(d<=9)return 550+(d-6)*1000;
 if(d<=11)return 3550+(d-9)*2000;if(d<=13)return 7550+(d-10)*3000;
 return 13550+(Math.min(d,30)-13)*4000;
}
function predict(dwell,ttsFba,act,vis){
 var d2y=null,d2r=null;
 for(var f=dwell;f<=30;f++){
   var s=dwellFactor(f,act,vis)+ttsFba;
   if(d2y===null&&s>GREEN_MAX)d2y=f-dwell;
   if(s>YELLOW_MAX){d2r=f-dwell;break}
 }
 return{d2y:d2y,d2r:d2r}
}
function riskTier(dwell,ttsFba,color){
 if(color==='red')return dwell>=10?'CRITICAL':'RED_ACTIVE';
 if(dwell>=7)return'IMMINENT';if(dwell>=5&&ttsFba>200)return'HIGH';
 if(dwell>=5)return'ELEVATED';if(ttsFba>500)return'TTS_FBA_WATCH';return'NORMAL';
}
var ALIASES={trailer:'equipment_number',trailer_number:'equipment_number',t_score:'rome_tscore',
tscore:'rome_tscore',score:'rome_tscore',trailer_score:'rome_tscore',dwell_days:'trailer_dwell_days',
dwell:'trailer_dwell_days',dwell_factor:'dwell_only_factor',tts_factor:'tts_dwell_factor',
tts_risk:'tts_dwell_factor',fba_factor:'fba_risk_factor',fba_risk:'fba_risk_factor',
site:'building_code',fc:'building_code',actionable:'isactionable',is_actionable:'isactionable',
sort_type:'final_trailer_sort_type',tts_units:'trailer_tts_quantity','fba_$':'fba_price',
fba_dollars:'fba_price',arrival:'arrival_time',timezone:'time_zone',rma_count:'rma_cnt'};
function norm(h){var k=h.trim().toLowerCase().replace(/[\s-]+/g,'_').replace(/['"]/g,'');return ALIASES[k]||k}
function pn(v,d){if(!v)return d||0;var s=String(v).trim().replace(/[$,'"]/g,'');if(!s||s==='null'||s==='N/A'||s==='-')return d||0;var n=parseFloat(s);return isNaN(n)?d||0:n}
function pt(v,d){return v?String(v).trim().replace(/['"]/g,''):d||''}
function parseCSV(text){
 var lines=text.trim().split('\n');if(lines.length<2)return{trailers:[],site:''};
 var headers=lines[0].split(',').map(norm);
 var trailers=[],site='';
 for(var i=1;i<lines.length;i++){
   var vals=[],cur='',inQ=false;
   for(var j=0;j<lines[i].length;j++){var ch=lines[i][j];if(ch==='"'){inQ=!inQ;continue}if(ch===','&&!inQ){vals.push(cur);cur='';continue}cur+=ch}
   vals.push(cur);
   var row={};headers.forEach(function(h,idx){row[h]=vals[idx]||''});
   if(!site)site=pt(row.building_code);
   var dwell=Math.round(pn(row.trailer_dwell_days)),act=pt(row.isactionable,'Y')==='Y',
       cat=pt(row.trailer_visit_category),qty=Math.round(pn(row.total_quantity)),vis=qty>0;
   if(!act)continue;
   var df=pn(row.dwell_only_factor);if(df===0&&dwell>0)df=dwellFactor(dwell,act&&['Redirect','Tagged'].indexOf(cat)<0,vis);
   var tf=pn(row.tts_dwell_factor),ff=pn(row.fba_risk_factor),sc=pn(row.rome_tscore);
   if(sc===0)sc=df+tf+ff;
   var color=colorFor(sc),p=predict(dwell,tf+ff,act,vis);
   trailers.push({id:pt(row.equipment_number)||pt(row.equipment_visit_id)||'Unknown',
     carrier:pt(row.carrier,'Unknown'),sort_type:pt(row.final_trailer_sort_type),
     dwell_days:dwell,actionable:act,tts_units:Math.round(pn(row.trailer_tts_quantity)),
     fba_dollars:Math.round(pn(row.fba_price)*100)/100,total_quantity:qty,
     dwell_factor:Math.round(df),tts_factor:Math.round(tf),fba_factor:Math.round(ff),
     tscore:Math.round(sc),color:color,days_to_yellow:p.d2y,days_to_red:p.d2r,
     risk_tier:riskTier(dwell,tf+ff,color)});
 }
 trailers.sort(function(a,b){return b.tscore-a.tscore});
 return{trailers:trailers,site:site||'UPLOADED'}
}
var DATA=[],sortCol='tscore',sortDir=-1,activeColor='all',activeCarrier='';
window._lastUpt='16636';
document.addEventListener('DOMContentLoaded',function(){
 document.getElementById('csvFile').addEventListener('change',function(){processFile(this.files[0]);this.value=''});
 document.getElementById('uploadBtn').addEventListener('click',function(){document.getElementById('csvFile').click()});
 var dz=document.getElementById('dropZone');
 dz.addEventListener('click',function(){document.getElementById('csvFile').click()});
 dz.addEventListener('dragover',function(e){e.preventDefault();this.classList.add('drag')});
 dz.addEventListener('dragleave',function(){this.classList.remove('drag')});
 dz.addEventListener('drop',function(e){e.preventDefault();this.classList.remove('drag');var f=e.dataTransfer.files[0];if(f)processFile(f)});
});
function processFile(file){
 if(!file)return;
 var r=new FileReader();
 r.onload=function(e){
   var res=parseCSV(e.target.result);
   if(!res.trailers.length){alert('No actionable trailers found in CSV.');return}
   DATA=res.trailers;sortCol='tscore';sortDir=-1;activeColor='all';activeCarrier='';
   render(DATA,res.site);
 };
 r.readAsText(file);
}
function render(data,site){
 document.getElementById('siteLabel').textContent=site||'';
 var badge=document.getElementById('dataBadge');
 badge.style.display='inline';badge.textContent=data.length+' trailers loaded';
 var db=document.getElementById('dashboard');
 var reds=data.filter(function(d){return d.color==='red'});
 var yellows=data.filter(function(d){return d.color==='yellow'});
 var greens=data.filter(function(d){return d.color==='green'});
 var atRisk=data.filter(function(d){return d.color!=='red'&&d.days_to_red!==null&&d.days_to_red<=3});
 var avgDwell=data.length?(data.reduce(function(s,d){return s+d.dwell_days},0)/data.length).toFixed(1):0;
 var maxDwell=data.length?Math.max.apply(null,data.map(function(d){return d.dwell_days})):0;
 var carrierBreak={};
 data.forEach(function(d){
   if(!carrierBreak[d.carrier])carrierBreak[d.carrier]={g:0,y:0,r:0,total:0};
   carrierBreak[d.carrier][d.color[0]]++;carrierBreak[d.carrier].total++;
 });
 var topCarriers=Object.entries(carrierBreak).sort(function(a,b){return b[1].total-a[1].total}).slice(0,6);
 var bk={};
 data.forEach(function(d){var b=d.dwell_days>=10?'10+':String(d.dwell_days);if(!bk[b])bk[b]={g:0,y:0,r:0};bk[b][d.color[0]]++});
 var dwellKeys=['0','1','2','3','4','5','6','7','8','9','10+'];
 var mx=Math.max.apply(null,dwellKeys.map(function(k){return(bk[k]?bk[k].g:0)+(bk[k]?bk[k].y:0)+(bk[k]?bk[k].r:0)}));
 if(mx<1)mx=1;
 var maxCls=maxDwell>=9?'cr':maxDwell>=5?'cy':'cg';
 db.innerHTML=
   '<div class="cret-banner"><h2>📦 CRET <span>Actionable Backlog</span></h2><div class="cret-stats">'+
   '<div class="cret-stat cw"><div class="cv">'+data.length+'</div><div class="cl">Trailers</div></div>'+
   '<div class="cret-stat cr"><div class="cv">'+reds.length+'</div><div class="cl">🔴 Red</div></div>'+
   '<div class="cret-stat cy"><div class="cv">'+yellows.length+'</div><div class="cl">🟡 Yellow</div></div>'+
   '<div class="cret-stat cg"><div class="cv">'+greens.length+'</div><div class="cl">🟢 Green</div></div>'+
   '<div class="cret-stat cr"><div class="cv">'+atRisk.length+'</div><div class="cl">→Red ≤3d</div></div>'+
   '<div class="cret-stat cb"><div class="cv">'+avgDwell+'</div><div class="cl">Avg Dwell</div></div>'+
   '<div class="cret-stat '+maxCls+'"><div class="cv">'+maxDwell+'d</div><div class="cl">Max Dwell</div></div>'+
   '<div style="width:1px;height:36px;background:#30363d"></div>'+
   '<div class="cret-upt"><input type="text" id="uptInput" value="'+window._lastUpt+'"><div class="cl">Avg UPT</div></div>'+
   '<div class="cret-units"><div class="cv" id="cretUnitsVal">—</div><div class="cl">Est. Backlog Units</div></div>'+
   '</div><div class="cret-bar">'+
   (greens.length?'<div class="cb-g" style="flex:'+greens.length+'"></div>':'')+
   (yellows.length?'<div class="cb-y" style="flex:'+yellows.length+'"></div>':'')+
   (reds.length?'<div class="cb-r" style="flex:'+reds.length+'"></div>':'')+
   '</div></div>'+
   '<div class="panels"><div class="panel"><h3>Color Distribution — '+site+'</h3><div class="timeline-bar">'+
   (greens.length?'<div class="seg g" style="flex:'+greens.length+'">'+greens.length+'</div>':'')+
   (yellows.length?'<div class="seg y" style="flex:'+yellows.length+'">'+yellows.length+'</div>':'')+
   (reds.length?'<div class="seg r" style="flex:'+reds.length+'">'+reds.length+'</div>':'')+
   '</div><h3 style="margin-top:14px">⚠ Approaching Red (≤3 days)</h3><ul class="risk-list">'+
   (atRisk.length?atRisk.slice(0,8).map(function(d){
     var cls=d.days_to_red<=1?'imm':d.days_to_red<=2?'high':'elev';
     return '<li><span class="mono">'+d.id+'</span><span>'+d.carrier+' · '+d.dwell_days+'d · T:'+d.tscore.toLocaleString()+'</span><span class="risk-badge '+cls+'">'+d.days_to_red+'d→red</span></li>'
   }).join(''):'<li class="dim">None — all clear</li>')+
   '</ul></div><div class="panel"><h3>Carrier Breakdown</h3><ul class="risk-list">'+
   topCarriers.map(function(e){var c=e[0],v=e[1];
     return '<li><span>'+c+' ('+v.total+')</span><span>'+(v.r?'<span class="risk-badge imm">'+v.r+' red</span> ':'')+(v.y?'<span class="risk-badge high">'+v.y+' yel</span> ':'')+
     '<span class="risk-badge elev">'+v.g+' grn</span></span></li>'}).join('')+
   '</ul><h3 style="margin-top:14px">Dwell Distribution</h3><div style="display:flex;align-items:flex-end;gap:3px;height:70px;margin-top:6px">'+
   dwellKeys.map(function(k){var b=bk[k]||{g:0,y:0,r:0};
     return '<div style="flex:1;display:flex;flex-direction:column;align-items:center"><div style="width:100%;display:flex;flex-direction:column-reverse;height:52px">'+
     (b.g?'<div style="background:#238636;height:'+b.g/mx*100+'%;border-radius:2px 2px 0 0"></div>':'')+
     (b.y?'<div style="background:#9e6a03;height:'+b.y/mx*100+'%"></div>':'')+
     (b.r?'<div style="background:#da3633;height:'+b.r/mx*100+'%;border-radius:2px 2px 0 0"></div>':'')+
     '</div><div style="font-size:9px;color:#8b949e;margin-top:3px">'+k+'</div></div>'}).join('')+
   '</div><div style="text-align:center;font-size:9px;color:#484f58;margin-top:3px">Dwell Days</div></div></div>'+
   '<div class="filters" id="filtersRow"></div>'+
   '<div class="table-wrap"><table><thead><tr>'+
   '<th data-col="color">Status</th><th data-col="id">Trailer</th><th data-col="carrier">Carrier</th>'+
   '<th data-col="sort_type">Sort Type</th><th data-col="dwell_days">Dwell</th><th data-col="tscore">T-Score</th>'+
   '<th data-col="dwell_factor">Dwell F.</th><th data-col="tts_factor">TTS F.</th><th data-col="fba_factor">FBA F.</th>'+
   '<th data-col="tts_units">TTS Units</th><th data-col="fba_dollars">FBA $</th><th data-col="total_quantity">Qty</th>'+
   '<th data-col="days_to_yellow">→Yellow</th><th data-col="days_to_red">→Red</th><th data-col="risk_tier">Risk</th>'+
   '</tr></thead><tbody id="tbody"></tbody></table></div>';
 var fRow=document.getElementById('filtersRow');
 fRow.innerHTML='<span class="chip all active" data-color="all">All ('+data.length+')</span>'+
   '<span class="chip g" data-color="green">🟢 '+greens.length+'</span>'+
   '<span class="chip y" data-color="yellow">🟡 '+yellows.length+'</span>'+
   '<span class="chip r" data-color="red">🔴 '+reds.length+'</span>'+
   '<select id="carrierSel"><option value="">All Carriers</option>'+
   data.map(function(d){return d.carrier}).filter(function(v,i,a){return a.indexOf(v)===i}).sort().map(function(c){return '<option>'+c+'</option>'}).join('')+'</select>';
 fRow.querySelectorAll('.chip').forEach(function(chip){
   chip.addEventListener('click',function(){
     fRow.querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});
     this.classList.add('active');activeColor=this.getAttribute('data-color');renderTable(DATA);
   });
 });
 document.getElementById('carrierSel').addEventListener('change',function(){activeCarrier=this.value;renderTable(DATA)});
 document.querySelectorAll('th[data-col]').forEach(function(th){
   th.addEventListener('click',function(){
     var col=this.getAttribute('data-col');
     if(sortCol===col)sortDir*=-1;else{sortCol=col;sortDir=col==='id'||col==='carrier'?1:-1}
     renderTable(DATA);
   });
 });
 var cretCount=data.length;
 function calcUnits(){
   var inp=document.getElementById('uptInput');if(!inp)return;
   var upt=parseFloat(inp.value.replace(/,/g,''))||0;
   window._lastUpt=inp.value;
   var el=document.getElementById('cretUnitsVal');
   if(el)el.textContent=Math.round(upt*cretCount).toLocaleString();
 }
 var uptEl=document.getElementById('uptInput');
 if(uptEl){uptEl.addEventListener('input',calcUnits);calcUnits()}
 renderTable(data);
}
var RC={CRITICAL:'imm',RED_ACTIVE:'imm',IMMINENT:'imm',HIGH:'high',ELEVATED:'high',TTS_FBA_WATCH:'elev',NORMAL:''};
function renderTable(data){
 var tbody=document.getElementById('tbody');if(!tbody)return;
 var filtered=data;
 if(activeColor!=='all')filtered=filtered.filter(function(d){return d.color===activeColor});
 if(activeCarrier)filtered=filtered.filter(function(d){return d.carrier===activeCarrier});
 filtered=filtered.slice().sort(function(a,b){
   var av=a[sortCol],bv=b[sortCol];if(av===null)av=999;if(bv===null)bv=999;
   return(av<bv?-1:av>bv?1:0)*sortDir;
 });
 tbody.innerHTML=filtered.map(function(d){
   return '<tr><td><span class="color-dot '+d.color+'"></span></td>'+
   '<td class="mono">'+d.id+'</td><td>'+d.carrier+'</td><td>'+(d.sort_type||'—')+'</td>'+
   '<td>'+d.dwell_days+'d</td><td class="mono">'+d.tscore.toLocaleString()+'</td>'+
   '<td class="mono">'+d.dwell_factor.toLocaleString()+'</td>'+
   '<td class="mono">'+d.tts_factor.toLocaleString()+'</td>'+
   '<td class="mono">'+d.fba_factor.toLocaleString()+'</td>'+
   '<td>'+d.tts_units.toLocaleString()+'</td><td>$'+d.fba_dollars.toLocaleString()+'</td>'+
   '<td>'+d.total_quantity.toLocaleString()+'</td>'+
   '<td>'+(d.color==='green'?(d.days_to_yellow!==null?d.days_to_yellow+'d':'—
