+      1: // ===== ROME T-Score Engine =====
+      2: var GREEN_MAX=349,YELLOW_MAX=3549;
+      3: function colorFor(s){return s<=GREEN_MAX?'green':s<=YELLOW_MAX?'yellow':'red'}
+      4: function dwellFactor(d,act,vis){
+      5:   if(!act&&!vis)return Math.min(d,60)*5;
+      6:   if(d===0)return 15;if(d<=3)return d*50;if(d<=5)return 150+(d-3)*100;
+      7:   if(d===6)return 350+(d-5)*200;if(d<=9)return 550+(d-6)*1000;
+      8:   if(d<=11)return 3550+(d-9)*2000;if(d<=13)return 7550+(d-10)*3000;
+      9:   return 13550+(Math.min(d,30)-13)*4000;
+     10: }
+     11: function predict(dwell,ttsFba,act,vis){
+     12:   var d2y=null,d2r=null;
+     13:   for(var f=dwell;f<=30;f++){
+     14:     var s=dwellFactor(f,act,vis)+ttsFba;
+     15:     if(d2y===null&&s>GREEN_MAX)d2y=f-dwell;
+     16:     if(s>YELLOW_MAX){d2r=f-dwell;break}
+     17:   }
+     18:   return{d2y:d2y,d2r:d2r}
+     19: }
+     20: function riskTier(dwell,ttsFba,color){
+     21:   if(color==='red')return dwell>=10?'CRITICAL':'RED_ACTIVE';
+     22:   if(dwell>=7)return'IMMINENT';if(dwell>=5&&ttsFba>200)return'HIGH';
+     23:   if(dwell>=5)return'ELEVATED';if(ttsFba>500)return'TTS_FBA_WATCH';return'NORMAL';
+     24: }
+     25: 
+     26: // ===== CSV Parser with header normalization =====
+     27: var ALIASES={trailer:'equipment_number',trailer_number:'equipment_number',t_score:'rome_tscore',
+     28: tscore:'rome_tscore',score:'rome_tscore',trailer_score:'rome_tscore',dwell_days:'trailer_dwell_days',
+     29: dwell:'trailer_dwell_days',dwell_factor:'dwell_only_factor',tts_factor:'tts_dwell_factor',
+     30: tts_risk:'tts_dwell_factor',fba_factor:'fba_risk_factor',fba_risk:'fba_risk_factor',
+     31: site:'building_code',fc:'building_code',actionable:'isactionable',is_actionable:'isactionable',
+     32: sort_type:'final_trailer_sort_type',tts_units:'trailer_tts_quantity','fba_$':'fba_price',
+     33: fba_dollars:'fba_price',arrival:'arrival_time',timezone:'time_zone',rma_count:'rma_cnt'};
+     34: function norm(h){var k=h.trim().toLowerCase().replace(/[\s-]+/g,'_').replace(/['"]/g,'');return ALIASES[k]||k}
+     35: function pn(v,d){if(!v)return d||0;var s=String(v).trim().replace(/[$,'"]/g,'');if(!s||s==='null'||s==='N/A'||s==='-')return d||0;var n=parseFloat(s);return isNaN(n)?d||0:n}
+     36: function pt(v,d){return v?String(v).trim().replace(/['"]/g,''):d||''}
+     37: 
+     38: function parseCSV(text){
+     39:   var lines=text.trim().split('\n');if(lines.length<2)return{trailers:[],site:''};
+     40:   var headers=lines[0].split(',').map(norm);
+     41:   var trailers=[],site='';
+     42:   for(var i=1;i<lines.length;i++){
+     43:     var vals=[],cur='',inQ=false;
+     44:     for(var j=0;j<lines[i].length;j++){var ch=lines[i][j];if(ch==='"'){inQ=!inQ;continue}if(ch===','&&!inQ){vals.push(cur);cur='';continue}cur+=ch}
+     45:     vals.push(cur);
+     46:     var row={};headers.forEach(function(h,idx){row[h]=vals[idx]||''});
+     47:     if(!site)site=pt(row.building_code);
+     48:     var dwell=Math.round(pn(row.trailer_dwell_days)),act=pt(row.isactionable,'Y')==='Y',
+     49:         cat=pt(row.trailer_visit_category),qty=Math.round(pn(row.total_quantity)),vis=qty>0;
+     50:     // Filter: actionable only
+     51:     if(!act)continue;
+     52:     var df=pn(row.dwell_only_factor);if(df===0&&dwell>0)df=dwellFactor(dwell,act&&['Redirect','Tagged'].indexOf(cat)<0,vis);
+     53:     var tf=pn(row.tts_dwell_factor),ff=pn(row.fba_risk_factor),sc=pn(row.rome_tscore);
+     54:     if(sc===0)sc=df+tf+ff;
+     55:     var color=colorFor(sc),p=predict(dwell,tf+ff,act,vis);
+     56:     trailers.push({id:pt(row.equipment_number)||pt(row.equipment_visit_id)||'Unknown',
+     57:       carrier:pt(row.carrier,'Unknown'),sort_type:pt(row.final_trailer_sort_type),
+     58:       dwell_days:dwell,actionable:act,tts_units:Math.round(pn(row.trailer_tts_quantity)),
+     59:       fba_dollars:Math.round(pn(row.fba_price)*100)/100,total_quantity:qty,
+     60:       dwell_factor:Math.round(df),tts_factor:Math.round(tf),fba_factor:Math.round(ff),
+     61:       tscore:Math.round(sc),color:color,days_to_yellow:p.d2y,days_to_red:p.d2r,
+     62:       risk_tier:riskTier(dwell,tf+ff,color)});
+     63:   }
+     64:   trailers.sort(function(a,b){return b.tscore-a.tscore});
+     65:   return{trailers:trailers,site:site||'UPLOADED'}
+     66: }
+     67: 
+     68: // ===== UI =====
+     69: var DATA=[],sortCol='tscore',sortDir=-1,activeColor='all',activeCarrier='';
+     70: window._lastUpt='16636';
+     71: 
+     72: document.addEventListener('DOMContentLoaded',function(){
+     73:   document.getElementById('csvFile').addEventListener('change',function(){processFile(this.files[0]);this.value=''});
+     74:   document.getElementById('uploadBtn').addEventListener('click',function(){document.getElementById('csvFile').click()});
+     75:   var dz=document.getElementById('dropZone');
+     76:   dz.addEventListener('click',function(){document.getElementById('csvFile').click()});
+     77:   dz.addEventListener('dragover',function(e){e.preventDefault();this.classList.add('drag')});
+     78:   dz.addEventListener('dragleave',function(){this.classList.remove('drag')});
+     79:   dz.addEventListener('drop',function(e){e.preventDefault();this.classList.remove('drag');var f=e.dataTransfer.files[0];if(f)processFile(f)});
+     80: });
+     81: 
+     82: function processFile(file){
+     83:   if(!file)return;
+     84:   var r=new FileReader();
+     85:   r.onload=function(e){
+     86:     var res=parseCSV(e.target.result);
+     87:     if(!res.trailers.length){alert('No actionable trailers found in CSV.');return}
+     88:     DATA=res.trailers;sortCol='tscore';sortDir=-1;activeColor='all';activeCarrier='';
+     89:     render(DATA,res.site);
+     90:   };
+     91:   r.readAsText(file);
+     92: }
+     93: 
+     94: function render(data,site){
+     95:   document.getElementById('siteLabel').textContent=site||'';
+     96:   var badge=document.getElementById('dataBadge');
+     97:   badge.style.display='inline';badge.textContent=data.length+' trailers loaded';
+     98: 
+     99:   var db=document.getElementById('dashboard');
+    100:   var reds=data.filter(function(d){return d.color==='red'});
+    101:   var yellows=data.filter(function(d){return d.color==='yellow'});
+    102:   var greens=data.filter(function(d){return d.color==='green'});
+    103:   var atRisk=data.filter(function(d){return d.color!=='red'&&d.days_to_red!==null&&d.days_to_red<=3});
+    104:   var avgDwell=data.length?(data.reduce(function(s,d){return s+d.dwell_days},0)/data.length).toFixed(1):0;
+    105:   var maxDwell=data.length?Math.max.apply(null,data.map(function(d){return d.dwell_days})):0;
+    106:   var totalFba=data.reduce(function(s,d){return s+(d.fba_dollars||0)},0);
+    107: 
+    108:   var carrierBreak={};
+    109:   data.forEach(function(d){
+    110:     if(!carrierBreak[d.carrier])carrierBreak[d.carrier]={g:0,y:0,r:0,total:0};
+    111:     carrierBreak[d.carrier][d.color[0]]++;carrierBreak[d.carrier].total++;
+    112:   });
+    113:   var topCarriers=Object.entries(carrierBreak).sort(function(a,b){return b[1].total-a[1].total}).slice(0,6);
+    114: 
+    115:   var bk={};
+    116:   data.forEach(function(d){var b=d.dwell_days>=10?'10+':String(d.dwell_days);if(!bk[b])bk[b]={g:0,y:0,r:0};bk[b][d.color[0]]++});
+    117:   var dwellKeys=['0','1','2','3','4','5','6','7','8','9','10+'];
+    118:   var mx=Math.max.apply(null,dwellKeys.map(function(k){return(bk[k]?bk[k].g:0)+(bk[k]?bk[k].y:0)+(bk[k]?bk[k].r:0)}));
+    119:   if(mx<1)mx=1;
+    120: 
+    121:   var maxCls=maxDwell>=9?'cr':maxDwell>=5?'cy':'cg';
+    122: 
+    123:   db.innerHTML=
+    124:     '<div class="cret-banner">'+
+    125:       '<h2>📦 CRET <span>Actionable Backlog</span></h2>'+
+    126:       '<div class="cret-stats">'+
+    127:         '<div class="cret-stat cw"><div class="cv">'+data.length+'</div><div class="cl">Trailers</div></div>'+
+    128:         '<div class="cret-stat cr"><div class="cv">'+reds.length+'</div><div class="cl">🔴 Red</div></div>'+
+    129:         '<div class="cret-stat cy"><div class="cv">'+yellows.length+'</div><div class="cl">🟡 Yellow</div></div>'+
+    130:         '<div class="cret-stat cg"><div class="cv">'+greens.length+'</div><div class="cl">🟢 Green</div></div>'+
+    131:         '<div class="cret-stat cr"><div class="cv">'+atRisk.length+'</div><div class="cl">→Red ≤3d</div></div>'+
+    132:         '<div class="cret-stat cb"><div class="cv">'+avgDwell+'</div><div class="cl">Avg Dwell</div></div>'+
+    133:         '<div class="cret-stat '+maxCls+'"><div class="cv">'+maxDwell+'d</div><div class="cl">Max Dwell</div></div>'+
+    134:         '<div style="width:1px;height:36px;background:#30363d"></div>'+
+    135:         '<div class="cret-upt"><input type="text" id="uptInput" value="'+window._lastUpt+'"><div class="cl">Avg UPT</div></div>'+
+    136:         '<div class="cret-units"><div class="cv" id="cretUnitsVal">—</div><div class="cl">Est. Backlog Units</div></div>'+
+    137:       '</div>'+
+    138:       '<div class="cret-bar">'+
+    139:         (greens.length?'<div class="cb-g" style="flex:'+greens.length+'"></div>':'')+
+    140:         (yellows.length?'<div class="cb-y" style="flex:'+yellows.length+'"></div>':'')+
+    141:         (reds.length?'<div class="cb-r" style="flex:'+reds.length+'"></div>':'')+
+    142:       '</div>'+
+    143:     '</div>'+
+    144:     '<div class="panels">'+
+    145:       '<div class="panel">'+
+    146:         '<h3>Color Distribution — '+site+'</h3>'+
+    147:         '<div class="timeline-bar">'+
+    148:           (greens.length?'<div class="seg g" style="flex:'+greens.length+'">'+greens.length+'</div>':'')+
+    149:           (yellows.length?'<div class="seg y" style="flex:'+yellows.length+'">'+yellows.length+'</div>':'')+
+    150:           (reds.length?'<div class="seg r" style="flex:'+reds.length+'">'+reds.length+'</div>':'')+
+    151:         '</div>'+
+    152:         '<h3 style="margin-top:14px">⚠ Approaching Red (≤3 days)</h3>'+
+    153:         '<ul class="risk-list">'+
+    154:         (atRisk.length?atRisk.slice(0,8).map(function(d){
+    155:           var cls=d.days_to_red<=1?'imm':d.days_to_red<=2?'high':'elev';
+    156:           return '<li><span class="mono">'+d.id+'</span><span>'+d.carrier+' · '+d.dwell_days+'d · T:'+d.tscore.toLocaleString()+'</span><span class="risk-badge '+cls+'">'+d.days_to_red+'d→red</span></li>'
+    157:         }).join(''):'<li class="dim">None — all clear</li>')+
+    158:         '</ul></div>'+
+    159:       '<div class="panel">'+
+    160:         '<h3>Carrier Breakdown</h3><ul class="risk-list">'+
+    161:         topCarriers.map(function(e){var c=e[0],v=e[1];
+    162:           return '<li><span>'+c+' ('+v.total+')</span><span>'+
+    163:             (v.r?'<span class="risk-badge imm">'+v.r+' red</span> ':'')+
+    164:             (v.y?'<span class="risk-badge high">'+v.y+' yel</span> ':'')+
+    165:             '<span class="risk-badge elev">'+v.g+' grn</span></span></li>'
+    166:         }).join('')+
+    167:         '</ul>'+
+    168:         '<h3 style="margin-top:14px">Dwell Distribution</h3>'+
+    169:         '<div style="display:flex;align-items:flex-end;gap:3px;height:70px;margin-top:6px">'+
+    170:         dwellKeys.map(function(k){var b=bk[k]||{g:0,y:0,r:0};
+    171:           return '<div style="flex:1;display:flex;flex-direction:column;align-items:center"><div style="width:100%;display:flex;flex-direction:column-reverse;height:52px">'+
+    172:             (b.g?'<div style="background:#238636;height:'+b.g/mx*100+'%;border-radius:2px 2px 0 0"></div>':'')+
+    173:             (b.y?'<div style="background:#9e6a03;height:'+b.y/mx*100+'%"></div>':'')+
+    174:             (b.r?'<div style="background:#da3633;height:'+b.r/mx*100+'%;border-radius:2px 2px 0 0"></div>':'')+
+    175:             '</div><div style="font-size:9px;color:#8b949e;margin-top:3px">'+k+'</div></div>'
+    176:         }).join('')+
+    177:         '</div><div style="text-align:center;font-size:9px;color:#484f58;margin-top:3px">Dwell Days</div>'+
+    178:       '</div>'+
+    179:     '</div>'+
+    180:     '<div class="filters" id="filtersRow"></div>'+
+    181:     '<div class="table-wrap"><table>'+
+    182:       '<thead><tr>'+
+    183:         '<th data-col="color">Status</th><th data-col="id">Trailer</th><th data-col="carrier">Carrier</th>'+
+    184:         '<th data-col="sort_type">Sort Type</th><th data-col="dwell_days">Dwell</th><th data-col="tscore">T-Score</th>'+
+    185:         '<th data-col="dwell_factor">Dwell F.</th><th data-col="tts_factor">TTS F.</th><th data-col="fba_factor">FBA F.</th>'+
+    186:         '<th data-col="tts_units">TTS Units</th><th data-col="fba_dollars">FBA $</th><th data-col="total_quantity">Qty</th>'+
+    187:         '<th data-col="days_to_yellow">→Yellow</th><th data-col="days_to_red">→Red</th><th data-col="risk_tier">Risk</th>'+
+    188:       '</tr></thead><tbody id="tbody"></tbody></table></div>';
+    189: 
+    190:   // Filters
+    191:   var fRow=document.getElementById('filtersRow');
+    192:   fRow.innerHTML=
+    193:     '<span class="chip all active" data-color="all">All ('+data.length+')</span>'+
+    194:     '<span class="chip g" data-color="green">🟢 '+greens.length+'</span>'+
+    195:     '<span class="chip y" data-color="yellow">🟡 '+yellows.length+'</span>'+
+    196:     '<span class="chip r" data-color="red">🔴 '+reds.length+'</span>'+
+    197:     '<select id="carrierSel"><option value="">All Carriers</option>'+
+    198:     data.map(function(d){return d.carrier}).filter(function(v,i,a){return a.indexOf(v)===i}).sort().map(function(c){return '<option>'+c+'</option>'}).join('')+'</select>';
+    199: 
+    200:   fRow.querySelectorAll('.chip').forEach(function(chip){
+    201:     chip.addEventListener('click',function(){
+    202:       fRow.querySelectorAll('.chip').forEach(function(c){c.classList.remove('active')});
+    203:       this.classList.add('active');activeColor=this.getAttribute('data-color');renderTable(DATA);
+    204:     });
+    205:   });
+    206:   document.getElementById('carrierSel').addEventListener('change',function(){activeCarrier=this.value;renderTable(DATA)});
+    207:   document.querySelectorAll('th[data-col]').forEach(function(th){
+    208:     th.addEventListener('click',function(){
+    209:       var col=this.getAttribute('data-col');
+    210:       if(sortCol===col)sortDir*=-1;else{sortCol=col;sortDir=col==='id'||col==='carrier'?1:-1}
+    211:       renderTable(DATA);
+    212:     });
+    213:   });
+    214: 
+    215:   // UPT calc
+    216:   var cretCount=data.length;
+    217:   function calcUnits(){
+    218:     var inp=document.getElementById('uptInput');if(!inp)return;
+    219:     var upt=parseFloat(inp.value.replace(/,/g,''))||0;
+    220:     window._lastUpt=inp.value;
+    221:     var el=document.getElementById('cretUnitsVal');
+    222:     if(el)el.textContent=Math.round(upt*cretCount).toLocaleString();
+    223:   }
+    224:   var uptEl=document.getElementById('uptInput');
+    225:   if(uptEl){uptEl.addEventListener('input',calcUnits);calcUnits()}
+    226: 
+    227:   renderTable(data);
+    228: }
+    229: 
+    230: var RC={CRITICAL:'imm',RED_ACTIVE:'imm',IMMINENT:'imm',HIGH:'high',ELEVATED:'high',TTS_FBA_WATCH:'elev',NORMAL:''};
+    231: 
+    232: function renderTable(data){
+    233:   var tbody=document.getElementById('tbody');if(!tbody)return;
+    234:   var filtered=data;
+    235:   if(activeColor!=='all')filtered=filtered.filter(function(d){return d.color===activeColor});
+    236:   if(activeCarrier)filtered=filtered.filter(function(d){return d.carrier===activeCarrier});
+    237:   filtered=filtered.slice().sort(function(a,b){
+    238:     var av=a[sortCol],bv=b[sortCol];if(av===null)av=999;if(bv===null)bv=999;
+    239:     return(av<bv?-1:av>bv?1:0)*sortDir;
+    240:   });
+    241:   tbody.innerHTML=filtered.map(function(d){
+    242:     return '<tr>'+
+    243:       '<td><span class="color-dot '+d.color+'"></span></td>'+
+    244:       '<td class="mono">'+d.id+'</td><td>'+d.carrier+'</td><td>'+(d.sort_type||'—')+'</td>'+
+    245:       '<td>'+d.dwell_days+'d</td><td class="mono">'+d.tscore.toLocaleString()+'</td>'+
+    246:       '<td class="mono">'+d.dwell_factor.toLocaleString()+'</td>'+
+    247:       '<td class="mono">'+d.tts_factor.toLocaleString()+'</td>'+
+    248:       '<td class="mono">'+d.fba_factor.toLocaleString()+'</td>'+
+    249:       '<td>'+d.tts_units.toLocaleString()+'</td><td>$'+d.fba_dollars.toLocaleString()+'</td>'+
+    250:       '<td>'+d.total_quantity.toLocaleString()+'</td>'+
+    251:       '<td>'+(d.color==='green'?(d.days_to_yellow!==null?d.days_to_yellow+'d':'—'):'<span class="dim">—</span>')+'</td>'+
+    252:       '<td>'+(d.color!=='red'?(d.days_to_red!==null?'<b>'+d.days_to_red+'d</b>':'30+'):'<span style="color:#f85149">NOW</span>')+'</td>'+
+    253:       '<td>'+(d.risk_tier?'<span class="risk-badge '+(RC[d.risk_tier]||'')+'">'+d.risk_tier+'</span>':'')+'</td></tr>'
+    254:   }).join('');
+    255: }
