/* AstroMappa v1.4 — file unico.
   La scheda "Mappa citta'" mostra la cartografia reale di OpenStreetMap tramite Leaflet.
   Se Leaflet non e' disponibile, la mappa viene disegnata su canvas: la scheda resta utile. */

const $ = function(s){ return document.querySelector(s); };
const $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
const D2R = Math.PI/180, R2D = 180/Math.PI;

/* ---------- Catalogo esteso Messier / NGC / IC (OpenNGC, CC-BY-SA 4.0) ---------- */
/* Ogni voce e' [URL del catalogo principale, URL dell'addendum].
   Provo le sorgenti in ordine: jsDelivr per primo, perche' e' un CDN con CORS
   esplicito e senza limiti di dimensione; poi GitHub raw, che spesso blocca le
   richieste provenienti da un altro dominio. */
const OPENNGC_SOURCES = [
  {
    label: 'jsDelivr',
    main: 'https://cdn.jsdelivr.net/gh/mattiaverga/OpenNGC@master/database_files/NGC.csv',
    add:  'https://cdn.jsdelivr.net/gh/mattiaverga/OpenNGC@master/database_files/addendum.csv'
  },
  {
    label: 'GitHub raw',
    main: 'https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/NGC.csv',
    add:  'https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/addendum.csv'
  },
  {
    label: 'Statisch CDN',
    main: 'https://cdn.statically.io/gh/mattiaverga/OpenNGC/master/database_files/NGC.csv',
    add:  'https://cdn.statically.io/gh/mattiaverga/OpenNGC/master/database_files/addendum.csv'
  }
];
const NGC_TYPES = {
  G:'Galassia', GPair:'Coppia di galassie', GTrpl:'Terzetto di galassie', GGroup:'Gruppo di galassie',
  PN:'Nebulosa planetaria', HII:'Regione HII', DrkN:'Nebulosa oscura', EmN:'Nebulosa a emissione',
  Neb:'Nebulosa', RfN:'Nebulosa a riflessione', SNR:'Resto di supernova', 'Cl+N':'Ammasso con nebulosa',
  GCl:'Ammasso globulare', OCl:'Ammasso aperto', '*':'Stella', '**':'Stella doppia',
  '*Ass':'Associazione stellare', Nova:'Nova', NonEx:'Inesistente', Dup:'Duplicato', Other:'Altro'
};
const COLOR_BY_TYPE = {
  'Galassia':'#ae9cff', 'Coppia di galassie':'#ae9cff', 'Gruppo di galassie':'#ae9cff', 'Terzetto di galassie':'#ae9cff',
  'Nebulosa':'#b194ff', 'Nebulosa planetaria':'#82e2d0', 'Regione HII':'#ff9ad5', 'Nebulosa a emissione':'#ff9ad5',
  'Nebulosa a riflessione':'#9fd6ff', 'Nebulosa oscura':'#7d7fa0', 'Resto di supernova':'#ffb36b',
  'Ammasso con nebulosa':'#bcd0ff', 'Ammasso globulare':'#cab7ff', 'Ammasso aperto':'#8db8ff',
  'Stella':'#d8eaff', 'Stella doppia':'#d8eaff', 'Associazione stellare':'#8db8ff'
};
function colorForType(t){ for(var k in COLOR_BY_TYPE){ if(t && t.indexOf(k) > -1) return COLOR_BY_TYPE[k]; } return '#9f8cff'; }
/* Parser CSV che si adatta al separatore: virgola, punto e virgola o tabulazione. */
function sniffSeparator(text){
  var head = text.slice(0, 4000);
  var counts = { ',':0, ';':0, '\t':0 };
  for(var i=0;i<head.length;i++){ if(counts[head[i]] !== undefined) counts[head[i]]++; }
  var best = ',', bestN = counts[','];
  if(counts[';'] > bestN){ best = ';'; bestN = counts[';']; }
  if(counts['\t'] > bestN){ best = '\t'; bestN = counts['\t']; }
  return best;
}
function parseCsv(text, sep){
  if(!sep) sep = sniffSeparator(text);
  var righe = text.split(/\r?\n/);
  /* trovo la riga di intestazione: quella che contiene almeno due colonne note */
  var attese = ['name','type','ra','dec','const','mag','messier'];
  var start = 0;
  for(var r=0; r<Math.min(righe.length, 30); r++){
    var l = righe[r].toLowerCase();
    var conta = 0;
    for(var a=0; a<attese.length; a++){ if(l.indexOf(attese[a]) > -1) conta++; }
    if(conta >= 2){ start = r; break; }
  }
  var rows = [];
  var field = '', row = [], inQ = false;
  var testo = righe.slice(start).join('\n');
  for(var i=0; i<testo.length; i++){
    var c = testo[i];
    if(inQ){
      if(c === '\"'){ if(testo[i+1] === '\"'){ field += '\"'; i++; } else inQ = false; }
      else field += c;
    }
    else if(c === '\"') inQ = true;
    else if(c === sep){ row.push(field); field = ''; }
    else if(c === '\n'){ row.push(field); rows.push(row); row = []; field = ''; }
    else if(c !== '\r') field += c;
  }
  if(field.length || row.length){ row.push(field); rows.push(row); }
  if(!rows.length) return [];
  var head = rows.shift().map(function(h){ return String(h).trim().toLowerCase().replace(/[^a-z0-9]/g,''); });
  return rows.filter(function(r){ return r.length > 2; }).map(function(r){
    var o = {}; for(var k=0; k<head.length; k++) o[head[k]] = r[k] === undefined ? '' : r[k]; return o;
  });
}
function toRa(v){
  if(v === undefined || v === null || v === '') return null;
  var s = String(v).trim().replace(',', '.');
  if(s.indexOf(':') === -1){ var n = parseFloat(s); return isFinite(n) ? n : null; }
  var p = s.split(':'); if(p.length < 2) return null;
  var h = parseFloat(p[0]), m = parseFloat(p[1]), sec = parseFloat(p[2] || '0');
  if(!isFinite(h) || !isFinite(m)) return null;
  return (h + m/60 + (sec||0)/3600) * 15;
}
function toDec(v){
  if(v === undefined || v === null || v === '') return null;
  var s = String(v).trim().replace(',', '.');
  if(s.indexOf(':') === -1){ var n = parseFloat(s); return isFinite(n) ? n : null; }
  var neg = s.charAt(0) === '-';
  var p = s.replace(/^[+-]/, '').split(':'); if(p.length < 2) return null;
  var d = parseFloat(p[0]), m = parseFloat(p[1]), sec = parseFloat(p[2] || '0');
  if(!isFinite(d) || !isFinite(m)) return null;
  var val = d + m/60 + (sec||0)/3600; return neg ? 0 - val : val;
}
/* Seconda strada: cerca due colonne con coordinate sessagesimali e le usa come RA e Dec.
   Serve per file con intestazioni diverse da OpenNGC. */
function convertiPerSomiglianza(testo){
  var rows = parseCsv(testo);
  if(!rows.length) return [];
  var chiavi = Object.keys(rows[0]);
  var pattern = /^\d{1,2}:\d{1,2}(:\d{1,2}(\.\d+)?)?$/;
  var colonne = [];
  for(var k = 0; k < chiavi.length; k++){
    var buoni = 0, totale = 0;
    for(var r = 0; r < Math.min(rows.length, 20); r++){
      var v = String(rows[r][chiavi[k]] || "").trim();
      if(!v) continue;
      totale++;
      if(pattern.test(v)) buoni++;
    }
    if(totale > 3 && buoni / totale > 0.7) colonne.push(chiavi[k]);
  }
  if(colonne.length < 2) return [];
  var kRa = colonne[0], kDec = colonne[1], kName = chiavi[0];
  var out = [];
  for(var i = 0; i < rows.length; i++){
    var x = rows[i];
    var ra = toRa(x[kRa]), dec = toDec(x[kDec]);
    if(ra === null || dec === null) continue;
    var nm = String(x[kName] || "").trim();
    if(!nm) continue;
    out.push({ name: nm, id: nm, messier: "", type: "deep", kind: "Oggetto",
      color: "#9f8cff", mag: 9, ra: ra, dec: dec, constellation: "", common: "", source: "file locale" });
  }
  return out;
}
function openngcToObjects(csvText){
  var rows = parseCsv(csvText);
  if(!rows.length) throw new Error('il file non contiene righe leggibili');
  var primo = rows[0];
  var chiavi = Object.keys(primo);
  /* individuo le colonne necessarie, accettando nomi alternativi */
  function cerca(candidati){
    for(var i=0;i<candidati.length;i++){
      if(chiavi.indexOf(candidati[i]) > -1) return candidati[i];
    }
    return null;
  }
  var kName = cerca(['name','nome','object','id','ngc']);
  var kRa   = cerca(['ra','raj2000','rightascension','ascensioneretta']);
  var kDec  = cerca(['dec','dej2000','declination','declinazione']);
  var kType = cerca(['type','tipo','objtype']);
  var kMag  = cerca(['vmag','mag','bmag','magnitudine']);
  var kM    = cerca(['m','messier']);
  var kConst= cerca(['const','constellation','costellazione']);
  var kCommon = cerca(['commonname','common','nomecomune']);
  if(!kName || !kRa || !kDec){
    throw new Error('colonne non riconosciute. Trovate: ' + chiavi.slice(0,10).join(', ') +
      '. Servono almeno nome, RA e Dec (formato OpenNGC).');
  }
  var out = [], seen = {}, scartate = 0;
  for(var r=0;r<rows.length;r++){
    var x = rows[r];
    var name = String(x[kName] || '').trim(); if(!name) continue;
    var ra = toRa(x[kRa]), dec = toDec(x[kDec]);
    if(ra === null || dec === null){ scartate++; continue; }
    var key = name.toUpperCase(); if(seen[key]) continue; seen[key] = 1;
    var tipo = kType ? String(x[kType] || '').trim() : '';
    var kind = NGC_TYPES[tipo] || tipo || 'Oggetto';
    var mess = kM ? String(x[kM] || '').trim() : '';
    var magRaw = kMag ? String(x[kMag] || '').trim().replace(',', '.') : '';
    out.push({
      name: (mess ? 'M' + mess + ' \u00B7 ' : '') + name,
      id: name, messier: mess || '', type: 'deep', kind: kind,
      color: colorForType(kind),
      mag: (magRaw && isFinite(parseFloat(magRaw))) ? parseFloat(magRaw) : 9,
      ra: ra, dec: dec,
      constellation: kConst ? String(x[kConst] || '').trim() : '',
      common: kCommon ? String(x[kCommon] || '').trim() : '',
      source: 'OpenNGC (CC-BY-SA 4.0)'
    });
  }
  if(!out.length){
    throw new Error('nessun oggetto con coordinate valide. Righe scartate: ' + scartate +
      '. Colonne lette: ' + [kName,kRa,kDec].join(' / ') + '.');
  }
  out.diagnostica = 'colonne: ' + [kName,kRa,kDec].join('/') + ', scartate ' + scartate;
  return out;
}

const catalog = [
  {name:'Sole', type:'solar', kind:'Stella', color:'#ffc85b', mag:-26.74, body:'sun'},
  {name:'Luna', type:'solar', kind:'Satellite', color:'#dbe7ff', mag:-12.7, body:'moon'},
  {name:'Mercurio', type:'solar', kind:'Pianeta', color:'#c7b7a3', mag:-1, body:'mercury'},
  {name:'Venere', type:'solar', kind:'Pianeta', color:'#ffe0a3', mag:-4.2, body:'venus'},
  {name:'Marte', type:'solar', kind:'Pianeta', color:'#ff806d', mag:-1.5, body:'mars'},
  {name:'Giove', type:'solar', kind:'Pianeta', color:'#ffd0a6', mag:-2.4, body:'jupiter'},
  {name:'Saturno', type:'solar', kind:'Pianeta', color:'#f3d38b', mag:0.6, body:'saturn'},
  {name:'Urano', type:'solar', kind:'Pianeta', color:'#9fe9e9', mag:5.7, body:'uranus'},
  {name:'Nettuno', type:'solar', kind:'Pianeta', color:'#7ca6ff', mag:7.8, body:'neptune'},
  {name:'Sirio', type:'star', kind:'Stella', color:'#d8eaff', mag:-1.46, ra:101.2875, dec:-16.7161},
  {name:'Betelgeuse', type:'star', kind:'Stella', color:'#ff9872', mag:0.5, ra:88.7929, dec:7.4071},
  {name:'Vega', type:'star', kind:'Stella', color:'#eaf4ff', mag:0.03, ra:279.2347, dec:38.7837},
  {name:'Polare', type:'star', kind:'Stella', color:'#fff6dc', mag:1.98, ra:37.9546, dec:89.2641},
  {name:'Arturo', type:'star', kind:'Stella', color:'#ffd09b', mag:-0.05, ra:213.9153, dec:19.1824},
  {name:'M31 Andromeda', type:'deep', kind:'Galassia', color:'#ae9cff', mag:3.44, ra:10.6847, dec:41.2692},
  {name:'M42 Orione', type:'deep', kind:'Nebulosa', color:'#b194ff', mag:4, ra:83.8221, dec:-5.3911},
  {name:'M45 Pleiadi', type:'deep', kind:'Ammasso aperto', color:'#8db8ff', mag:1.6, ra:56.75, dec:24.1167},
  {name:'M13 Ercole', type:'deep', kind:'Ammasso globulare', color:'#cab7ff', mag:5.8, ra:250.4235, dec:36.4613},
  {name:'M57 Anello', type:'deep', kind:'Nebulosa planetaria', color:'#82e2d0', mag:8.8, ra:283.3962, dec:33.0292}
];

const state = {
  lat:41.902782, lon:12.496366, filter:'all', selected:null,
  positions:[], place:'Roma', deferred:null, seed:1,
  map:null, mapMarker:null, mapRays:[], mapRings:[], leafletOk:false, zoom:14, showProjection:true, loadingDeep:false
};

/* ---------- astronomia ---------- */

function norm(x){ return ((x % 360) + 360) % 360; }
function jd(d){ return d.getTime()/86400000 + 2440587.5; }
function gmst(d){ return norm(280.46061837 + 360.98564736629 * (jd(d) - 2451545)); }
function localDate(){
  var dv = $('#date').value, tv = $('#time').value || '00:00';
  return new Date(dv + 'T' + tv + ':00');
}
function sunRaDec(d){
  var n = jd(d) - 2451545;
  var L = norm(280.46 + 0.9856474*n);
  var g = norm(357.528 + 0.9856003*n) * D2R;
  var lam = (L + 1.915*Math.sin(g) + 0.02*Math.sin(2*g)) * D2R;
  var e = (23.439 - 0.0000004*n) * D2R;
  return {
    ra: norm(Math.atan2(Math.cos(e)*Math.sin(lam), Math.cos(lam)) * R2D),
    dec: Math.asin(Math.sin(e)*Math.sin(lam)) * R2D
  };
}
function moonRaDec(d){
  var n = jd(d) - 2451545;
  var L = norm(218.316 + 13.176396*n), M = norm(134.963 + 13.064993*n)*D2R, F = norm(93.272 + 13.22935*n)*D2R;
  var lon = (L + 6.289*Math.sin(M))*D2R, lat = 5.128*Math.sin(F)*D2R, e = 23.439*D2R;
  return {
    ra: norm(Math.atan2(Math.sin(lon)*Math.cos(e) - Math.tan(lat)*Math.sin(e), Math.cos(lon)) * R2D),
    dec: Math.asin(Math.sin(lat)*Math.cos(e) + Math.cos(lat)*Math.sin(e)*Math.sin(lon)) * R2D
  };
}
var orbit = {
  mercury:[252.3,4.09,7], venus:[181.9,1.602,3.4], mars:[355.4,0.524,1.85],
  jupiter:[34.4,0.0831,1.3], saturn:[50.1,0.0335,2.5], uranus:[314,0.0117,0.8], neptune:[304,0.006,0.7]
};
function planetApprox(name, d){
  var o = orbit[name], n = jd(d) - 2451545;
  var lon = norm(o[0] + o[1]*n), lat = o[2]*Math.sin((lon*1.7 + o[0])*D2R);
  var e = 23.439*D2R, l = lon*D2R, b = lat*D2R;
  return {
    ra: norm(Math.atan2(Math.sin(l)*Math.cos(e) - Math.tan(b)*Math.sin(e), Math.cos(l)) * R2D),
    dec: Math.asin(Math.sin(b)*Math.cos(e) + Math.cos(b)*Math.sin(e)*Math.sin(l)) * R2D
  };
}
function altAz(ra, dec, d){
  var H = norm(gmst(d) + state.lon - ra)*D2R, ph = state.lat*D2R, de = dec*D2R;
  var alt = Math.asin(Math.sin(ph)*Math.sin(de) + Math.cos(ph)*Math.cos(de)*Math.cos(H));
  var az = Math.atan2(Math.sin(H), Math.cos(H)*Math.sin(ph) - Math.tan(de)*Math.cos(ph));
  return { alt: alt*R2D, az: norm(az*R2D + 180) };
}
function position(o, d){
  var eq;
  if(o.body === 'sun') eq = sunRaDec(d);
  else if(o.body === 'moon') eq = moonRaDec(d);
  else if(o.body) eq = planetApprox(o.body, d);
  else eq = { ra:o.ra, dec:o.dec };
  var aa = altAz(eq.ra, eq.dec, d);
  return Object.assign({}, o, eq, aa);
}

/* ---------- calcolo e disegno ---------- */

function initTime(){
  var d = new Date(), pad = function(n){ return String(n).padStart(2,'0'); };
  $('#date').value = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
  $('#time').value = pad(d.getHours()) + ':' + pad(d.getMinutes());
  $('#timeSlider').value = d.getHours()*60 + d.getMinutes();
}
function compute(){
  state.lat = parseFloat($('#lat').value);
  state.lon = parseFloat($('#lon').value);
  state.seed = Math.abs(Math.round(state.lat*1000)*31 + Math.round(state.lon*1000));
  var d = localDate();
  var prev = state.selected ? state.selected.name : null;
  state.positions = catalog.map(function(o){ return position(o, d); });
  state.selected = state.positions.find(function(x){ return x.name === prev; })
                || state.positions.find(function(x){ return x.name === 'Luna'; });
  drawAll(d);
}
function drawAll(d){
  var steps = [drawList, drawSky, drawDetails, drawPlanner, drawMap];
  for(var i=0;i<steps.length;i++){
    try { steps[i](d); }
    catch(e){ console.warn('passo non riuscito:', steps[i].name, e); }
  }
}
function filtered(){
  var q = $('#objectSearch').value.toLowerCase();
  return state.positions.filter(function(o){
    if(state.filter !== 'all' && o.type !== state.filter) return false;
    if($('#aboveOnly').checked && o.alt <= 0) return false;
    return o.name.toLowerCase().indexOf(q) > -1;
  }).sort(function(a,b){ return b.alt - a.alt; });
}
function drawList(){
  var rows = filtered(), host = $('#objectList');
  if(!rows.length){ host.innerHTML = '<p class="muted">Nessun oggetto con questi filtri.</p>'; return; }
  host.innerHTML = rows.map(function(o){
    var sel = (state.selected && state.selected.name === o.name) ? 'selected' : '';
    var nm = String(o.name).replace(/"/g, '&quot;');
    return '<div class="object-row ' + sel + '" data-name="' + nm + '">' +
      '<i class="dot" style="color:' + o.color + ';background:' + o.color + '"></i>' +
      '<div><strong>' + o.name + '</strong><small>' + o.kind + '</small></div>' +
      '<span class="alt">' + o.alt.toFixed(1) + '&deg;</span></div>';
  }).join('');
  $$('.object-row').forEach(function(el){
    el.onclick = function(){
      var f = state.positions.find(function(o){ return o.name === el.dataset.name; });
      if(f){ state.selected = f; drawAll(localDate()); }
    };
  });
}
function drawSky(){
  var c = $('#skyCanvas'); if(!c) return;
  var x = c.getContext('2d'), w = c.width, h = c.height;
  var cx = w/2, cy = h/2 + 10, R = Math.min(w,h)*0.42;
  x.clearRect(0,0,w,h);
  var g = x.createRadialGradient(cx,cy,20,cx,cy,R);
  g.addColorStop(0,'#172b51'); g.addColorStop(1,'#060b17');
  x.fillStyle = g;
  x.beginPath(); x.arc(cx,cy,R,0,Math.PI*2); x.fill();
  x.strokeStyle = '#33466a'; x.lineWidth = 2; x.stroke();
  x.font = 'bold 20px system-ui'; x.textAlign = 'center'; x.fillStyle = '#8fa1c5';
  [['N',0,-1],['E',1,0],['S',0,1],['O',-1,0]].forEach(function(a){
    x.fillText(a[0], cx + a[1]*(R+25), cy + a[2]*(R+7));
  });
  x.strokeStyle = 'rgba(100,130,175,.25)'; x.lineWidth = 1;
  [0.33,0.66].forEach(function(k){ x.beginPath(); x.arc(cx,cy,R*k,0,Math.PI*2); x.stroke(); });
  for(var a=0;a<360;a+=30){
    var q = a*D2R;
    x.beginPath(); x.moveTo(cx,cy); x.lineTo(cx + Math.sin(q)*R, cy - Math.cos(q)*R); x.stroke();
  }
  state.positions.filter(function(o){ return o.alt > 0; }).forEach(function(o){
    var rr = R*(90 - o.alt)/90, ang = o.az*D2R;
    var px = cx + Math.sin(ang)*rr, py = cy - Math.cos(ang)*rr;
    var size = (o.body === 'sun' || o.body === 'moon') ? 14 : Math.max(4, 10 - o.mag*0.65);
    x.shadowColor = o.color; x.shadowBlur = (o.type === 'deep') ? 12 : 18;
    x.fillStyle = o.color;
    x.beginPath(); x.arc(px,py,size,0,Math.PI*2); x.fill();
    x.shadowBlur = 0;
    if(o === state.selected || size > 8){
      x.font = '600 15px system-ui'; x.fillStyle = '#edf4ff'; x.textAlign = 'left';
      x.fillText(o.name, px + size + 6, py + 5);
    }
    o._hit = { x:px, y:py, r: Math.max(13, size) };
  });
}
function drawDetails(){
  var o = state.selected; if(!o) return;
  var q = o.alt > 45 ? 'Ottima' : o.alt > 20 ? 'Buona' : o.alt > 0 ? 'Bassa' : 'Non visibile';
  $('#detailsContent').innerHTML =
    '<h2>' + o.name + '</h2><div class="object-type">' + o.kind + '</div>' +
    '<div class="hero-metric"><span>Altezza</span><strong>' + o.alt.toFixed(1) + '&deg;</strong>' +
    '<small>Azimut ' + o.az.toFixed(1) + '&deg;</small></div>' +
    '<div class="metric-grid">' +
      '<div class="metric"><span>Ascensione retta</span><strong>' + (o.ra/15).toFixed(2) + ' h</strong></div>' +
      '<div class="metric"><span>Declinazione</span><strong>' + o.dec.toFixed(2) + '&deg;</strong></div>' +
      '<div class="metric"><span>Magnitudine</span><strong>' + o.mag + '</strong></div>' +
      '<div class="metric"><span>Qualit&agrave;</span><strong>' + q + '</strong></div>' +
    '</div>' +
    '<div class="visibility ' + (o.alt > 0 ? '' : 'below') + '">' +
      (o.alt > 0 ? 'Sopra l&rsquo;orizzonte' : 'Sotto l&rsquo;orizzonte') + '</div>' +
    '<p class="muted">Direzione: ' + cardinal(o.az) + '. Guarda ' +
      Math.max(0,o.alt).toFixed(0) + '&deg; sopra l&rsquo;orizzonte.</p>' +
    '<button id="favBtn" class="button full">Aggiungi al piano</button>';
  var fb = $('#favBtn');
  if(fb) fb.onclick = function(){ toast(o.name + ' aggiunto al piano osservativo'); };
}
function cardinal(a){
  return ['Nord','Nord-est','Est','Sud-est','Sud','Sud-ovest','Ovest','Nord-ovest'][Math.round(a/45)%8];
}
function drawPlanner(){
  var best = state.positions.filter(function(o){ return o.alt > 5 && o.name !== 'Sole'; })
    .sort(function(a,b){ return b.alt - a.alt; }).slice(0,6);
  var host = $('#plannerCards');
  if(!best.length){ host.innerHTML = '<p class="muted">Nessun obiettivo favorevole per questo momento.</p>'; return; }
  host.innerHTML = best.map(function(o){
    return '<article class="plan-card"><h3>' + o.name + '</h3>' +
      '<div class="score">' + Math.round(Math.min(99, o.alt + 25)) + '%</div>' +
      '<p class="muted">' + o.kind + ' &middot; ' + cardinal(o.az) + '</p>' +
      '<strong>' + o.alt.toFixed(1) + '&deg; sull&rsquo;orizzonte</strong></article>';
  }).join('');
}
function toast(m){
  var t = $('#toast');
  t.textContent = m; t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 2600);
}

/* ---------- mappa della citta' ---------- */

/* ---------- memoria del catalogo esteso ---------- */
const IDB_NAME='astromappa-deep', IDB_STORE='catalogs';
let deepReady = false;
function idbOpen(){ return new Promise(function(res,rej){
  if(!('indexedDB' in window)) return rej(new Error('IndexedDB non disponibile'));
  var r=indexedDB.open(IDB_NAME,1);
  r.onupgradeneeded=function(){ var d=r.result; if(!d.objectStoreNames.contains(IDB_STORE)) d.createObjectStore(IDB_STORE); };
  r.onsuccess=function(){ res(r.result); };
  r.onerror=function(){ rej(r.error); };
});}
function idbGet(k){ return idbOpen().then(function(d){
  return new Promise(function(res,rej){
    var t=d.transaction(IDB_STORE,'readonly').objectStore(IDB_STORE).get(k);
    t.onsuccess=function(){ res(t.result||null); }; t.onerror=function(){ rej(t.error); };
  });
}).catch(function(){ try{ return localStorage.getItem('deep-'+k); }catch(e){ return null; } });}
function idbSet(k,v){ return idbOpen().then(function(d){
  return new Promise(function(res,rej){
    var t=d.transaction(IDB_STORE,'readwrite').objectStore(IDB_STORE).put(v,k);
    t.onsuccess=function(){ res(true); }; t.onerror=function(){ rej(t.error); };
  });
}).catch(function(){ try{ localStorage.setItem('deep-'+k, v); return true; }catch(e){ return false; } });}

function setMapState(txt){
  var b = document.getElementById('mapState');
  if(b) b.textContent = txt;
}

/* Distanza e punto finale lungo un azimut, per disegnare le direzioni. */
function destinationPoint(lat, lon, bearing, km){
  var R = 6371, d = km/R, b = bearing*D2R;
  var p1 = lat*D2R, l1 = lon*D2R;
  var p2 = Math.asin(Math.sin(p1)*Math.cos(d) + Math.cos(p1)*Math.sin(d)*Math.cos(b));
  var l2 = l1 + Math.atan2(Math.sin(b)*Math.sin(d)*Math.cos(p1), Math.cos(d) - Math.sin(p1)*Math.sin(p2));
  return [p2*R2D, l2*R2D];
}

function drawMap(){
  var host = document.getElementById('cityMap');
  if(!host) return;

  /* Se Leaflet e' disponibile uso la cartografia reale. */
  if(typeof L !== 'undefined'){
    initLeaflet(host);
    return;
  }
  /* Altrimenti disegno una mappa urbana su canvas, per non lasciare la scheda vuota. */
  setMapState('mappa non disponibile');
  fallbackCanvas(host);
}

function initLeaflet(host){
  if(!state.map){
    host.innerHTML = '';
    state.map = L.map(host, {
      zoomControl:false,
      scrollWheelZoom:true,
      attributionControl:true
    }).setView([state.lat, state.lon], state.zoom);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(state.map);

    state.map.on('click', function(e){
      $('#lat').value = e.latlng.lat.toFixed(6);
      $('#lon').value = e.latlng.lng.toFixed(6);
      state.place = 'punto selezionato';
      compute();
    });
    state.leafletOk = true;
    setMapState('mappa OpenStreetMap');
  }

  /* marcatore dell'osservatore */
  if(state.mapMarker) state.map.removeLayer(state.mapMarker);
  state.mapMarker = L.circleMarker([state.lat, state.lon], {
    radius: 7, color: '#05201c', weight: 3, fillColor: '#58d6c1', fillOpacity: 1
  }).addTo(state.map).bindTooltip('Osservatore');

  /* Proiezione altazimutale: ogni oggetto e' posto al raggio che corrisponde
     alla sua altezza sull'orizzonte. Cerchio esterno = 0 gradi, centro = zenit. */
  state.mapRays.forEach(function(layer){ state.map.removeLayer(layer); });
  state.mapRays = [];

  var R = 0.15;                                    /* raggio della scena: 150 m fino all'orizzonte */

  function ringPoints(radiusKm, steps){
    var pts = [];
    for(var i=0;i<=steps;i++){
      var brg = i * 360 / steps;
      pts.push(destinationPoint(state.lat, state.lon, brg, radiusKm));
    }
    return pts;
  }

  /* Cerchio dell'orizzonte e anelli di riferimento: dipinti sopra la mappa. */
  if(state.projectionLayer){ state.map.removeLayer(state.projectionLayer); state.projectionLayer = null; }
  state.projectionLayer = L.layerGroup().addTo(state.map);

  function addRing(radiusKm, color, dash, weight){
    var line = L.polygon(ringPoints(radiusKm, 96), {
      color: color, weight: weight || 1.4, opacity: 0.75,
      fill: false, dashArray: dash || null, interactive: false
    });
    line.addTo(state.projectionLayer);
    return line;
  }
  addRing(R, '#58d6c1', null, 2);            /* orizzonte: 0 gradi */
  addRing(R * (1 - 45/90), '#3d5a86', '4 6'); /* 45 gradi */
  addRing(R * 0.25, '#35507a', '3 7');        /* 67 gradi sopra l'orizzonte */


  /* Ogni oggetto: linea proporzionale all'altezza + punto alla distanza corretta. */
  /* Sulla mappa compaiono solo Luna e pianeti, come richiesto. */
  var shown = state.positions.filter(function(o){
    return o.alt > 0 && (o.name === 'Luna' || o.body === 'moon' ||
      ['mercury','venus','mars','jupiter','saturn','uranus','neptune'].indexOf(o.body) > -1);
  });
  shown.forEach(function(o){
    var isSel = state.selected && state.selected.name === o.name;
    /* frazione di raggio: 0 = zenit, 1 = orizzonte */
    var frac = 1 - Math.max(0, o.alt) / 90;
    var distKm = R * frac;
    var end = destinationPoint(state.lat, state.lon, o.az, Math.max(distKm, 0.02));

    var line = L.polyline([[state.lat, state.lon], end], {
      color: isSel ? '#ffc85b' : o.color,
      weight: isSel ? 3.5 : 2,
      opacity: isSel ? 0.95 : 0.7,
      dashArray: isSel ? null : '5 7'
    }).addTo(state.map);
    line.bindTooltip(o.name + ' &middot; azimut ' + o.az.toFixed(0) + '&deg; &middot; ' +
                     o.alt.toFixed(0) + '&deg; sopra l&rsquo;orizzonte', { className:'astro-tip' });
    line.on('click', function(){
      var s = state.positions.find(function(x){ return x.name === o.name; });
      if(s){ state.selected = s; drawAll(localDate()); }
    });
    state.mapRays.push(line);

    /* il punto dell'oggetto, alla sua altezza corretta */
    var dot = L.circleMarker(end, {
      radius: isSel ? 8 : 5,
      color: '#05201c', weight: 2,
      fillColor: isSel ? '#ffc85b' : o.color, fillOpacity: 1
    }).addTo(state.map);
    dot.bindTooltip(o.name, { className:'astro-tip' });
    state.mapRays.push(dot);

    /* Nome dell'oggetto accanto al punto, spostato dal lato verso cui guarda. */
    var versoNord = (o.az > 270 || o.az < 90);
    var nomeHtml = '<span style="color:' + (isSel ? '#ffc85b' : o.color) + '">' + o.name + '</span>';
    var nome = L.marker(end, {
      interactive: false,
      icon: L.divIcon({
        className: 'object-label' + (isSel ? ' is-selected' : ''),
        html: nomeHtml,
        iconSize: [0,0],
        iconAnchor: [versoNord ? -12 : 12, 8]
      })
    }).addTo(state.map);
    state.mapRays.push(nome);
  });

  /* etichette del centro e del bordo */
  var centre = L.marker([state.lat, state.lon], {
    icon: L.divIcon({ className:'zenith-tag', html:'zenit', iconSize:[46,18], iconAnchor:[23,9] }),
    interactive: false
  }).addTo(state.projectionLayer);

  var northEdge = destinationPoint(state.lat, state.lon, 0, R);
  L.marker(northEdge, {
    icon: L.divIcon({ className:'horizon-tag', html:'orizzonte', iconSize:[64,18], iconAnchor:[32,9] }),
    interactive: false
  }).addTo(state.projectionLayer);

  if(state.showProjection && state.projectionLayer && !state.map.hasLayer(state.projectionLayer)) state.projectionLayer.addTo(state.map);
  var fitZoom = 17;
  if(state.map.getZoom() < 16) state.map.setView([state.lat, state.lon], fitZoom);
  var mt = document.getElementById('mapTitle');
  if(mt) mt.textContent = 'Mappa sotto ' + state.place;
}

/* Riserva senza rete: griglia urbana disegnata su canvas. */
function seededRandom(seed){
  var s = seed % 2147483647;
  if(s <= 0) s += 2147483646;
  return function(){ s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
}
function fallbackCanvas(host){
  host.innerHTML = '<canvas id="mapCanvas" width="1100" height="640" ' +
                   'style="display:block;width:100%;height:auto"></canvas>' +
                   '<p class="muted" style="padding:10px 14px;font-size:12px">' +
                   'Cartografia non raggiungibile: viene mostrata una griglia urbana indicativa.</p>';
  var c = document.getElementById('mapCanvas');
  if(!c) return;
  var x = c.getContext('2d'), w = c.width, h = c.height, cx = w/2, cy = h/2;
  var scale = w / 1600, rand = seededRandom(state.seed || 1);
  x.fillStyle = '#0a0f1c'; x.fillRect(0,0,w,h);
  var bw = 110*scale, bh = 84*scale;
  for(var gy=0; gy*bh < h+bh; gy++){
    for(var gx=0; gx*bw < w+bw; gx++){
      var jx = (rand()-0.5)*14*scale, jy = (rand()-0.5)*10*scale;
      var kind = rand();
      x.fillStyle = kind < 0.10 ? '#122a22' : (kind < 0.20 ? '#1a2136' : '#141b2e');
      x.fillRect(gx*bw+jx+4*scale, gy*bh+jy+4*scale, bw*0.74, bh*0.72);
    }
  }
  x.strokeStyle = '#243352'; x.lineWidth = Math.max(2, 7*scale);
  for(var i=0; i*bw < w+bw; i++){ x.beginPath(); x.moveTo(i*bw,0); x.lineTo(i*bw,h); x.stroke(); }
  for(var j=0; j*bh < h+bh; j++){ x.beginPath(); x.moveTo(0,j*bh); x.lineTo(w,j*bh); x.stroke(); }
  x.fillStyle = '#58d6c1'; x.beginPath(); x.arc(cx,cy,7,0,Math.PI*2); x.fill();
}

/* ---------- caricamento del catalogo Messier + NGC + IC ---------- */
function progress(pct, msg){
  var box=document.getElementById('catalogProgress');
  if(!box) return;
  box.hidden=false;
  var fill=document.getElementById('progressFill');
  if(fill) fill.style.width=Math.max(0,Math.min(100,pct))+'%';
  var txt=document.getElementById('progressText');
  if(txt) txt.textContent=msg;
}
function progressDone(msg){
  setTimeout(function(){ var b=document.getElementById('catalogProgress'); if(b) b.hidden=true; }, 1500);
  var s=document.getElementById('catalogStatus');
  if(s && msg) s.textContent=msg;
}
function fetchText(url){
  return fetch(url, { cache:'force-cache', mode:'cors' }).then(function(r){
    if(!r.ok) throw new Error('HTTP ' + r.status);
    return r.text();
  });
}
/* Scarica il catalogo provando ogni sorgente finche' una risponde. */
function downloadOpenngc(){
  var i = 0;
  function attempt(){
    if(i >= OPENNGC_SOURCES.length){
      return Promise.reject(new Error('nessuna sorgente raggiungibile'));
    }
    var src = OPENNGC_SOURCES[i++];
    progress(12 + i*8, 'Provo la sorgente ' + src.label + '...');
    return Promise.all([fetchText(src.main), fetchText(src.add).catch(function(){ return ''; })])
      .then(function(parts){
        var testo = parts[0] + '\n' + parts[1];
        if(testo.length < 100000) throw new Error('file troppo piccolo, forse una pagina di errore');
        return { testo: testo, sorgente: src.label };
      })
      .catch(function(e){
        console.warn('sorgente ' + src.label + ' non disponibile:', e.message);
        return attempt();
      });
  }
  return attempt();
}
function loadDeepCatalog(which){
  if(state.loadingDeep){ toast('Caricamento gi&agrave; in corso'); return; }
  state.loadingDeep = true;
  var btns = document.querySelectorAll('#catalogButtons .button');
  for(var i=0;i<btns.length;i++) btns[i].disabled = true;
  progress(6, 'Controllo se il catalogo &egrave; gi&agrave; salvato sul dispositivo...');
  idbGet('openngc').then(function(saved){
    if(saved) return { testo: saved, sorgente: 'memoria locale' };
    return downloadOpenngc().then(function(res){
      return idbSet('openngc', res.testo).then(function(){ return res; });
    });
  }).then(function(res){
    progress(88, 'Converto le coordinate di ' + res.sorgente + '...');
    var list = openngcToObjects(res.testo);
    if(!list.length) throw new Error('catalogo vuoto dopo la conversione');
    if(which === 'messier') list = list.filter(function(o){ return o.messier; });
    if(which === 'ngc') list = list.filter(function(o){ return /^NGC/i.test(o.id); });
    if(which === 'ic') list = list.filter(function(o){ return /^IC/i.test(o.id); });
    var esistenti = {};
    for(var j=0;j<catalog.length;j++) esistenti[catalog[j].name] = 1;
    var aggiunti = list.filter(function(o){ return !esistenti[o.name]; });
    catalog = catalog.concat(aggiunti);
    deepReady = true;
    progress(100, 'Aggiunti ' + aggiunti.length + ' oggetti da ' + res.sorgente);
    progressDone(aggiunti.length + ' oggetti aggiunti. Totale: ' + catalog.length + ' (sorgente: ' + res.sorgente + ').');
    var badge = document.getElementById('mapState');
    if(badge) badge.textContent = catalog.length + ' oggetti';
    compute();
    toast(aggiunti.length + ' oggetti aggiunti');
  }).catch(function(e){
    console.warn('catalogo', e);
    progress(100, 'Download non riuscito');
    progressDone('Nessuna delle sorgenti ha risposto. Motivi possibili: connessione assente, ' +
      'oppure il browser o la rete aziendale bloccano i download tra siti diversi. ' +
      'L\'app resta utilizzabile con il catalogo locale.');
    toast('Download bloccato: usa il pulsante \u201cApri file catalogo\u201d');
  }).then(function(){
    state.loadingDeep = false;
    for(var k=0;k<btns.length;k++) btns[k].disabled = false;
  });
}
/* All'avvio ripristino il catalogo salvato, se c'\u00e8. */
function restoreDeep(){
  return idbGet('openngc').then(function(raw){
    if(!raw) return;
    var list = openngcToObjects(raw);
    var esistenti = {};
    for(var j=0;j<catalog.length;j++) esistenti[catalog[j].name] = 1;
    var aggiunti = list.filter(function(o){ return !esistenti[o.name]; });
    if(aggiunti.length){
      catalog = catalog.concat(aggiunti);
      deepReady = true;
      var s = document.getElementById('catalogStatus');
      if(s) s.textContent = 'Cataloghi NGC/IC disponibili offline (' + aggiunti.length + ' oggetti).';
      var badge = document.getElementById('mapState');
      if(badge) badge.textContent = catalog.length + ' oggetti';
    }
  }).catch(function(){ });
}

/* ---------- caricamento del catalogo da un file locale ---------- */
/* Nessuna rete: l'utente sceglie il CSV scaricato in precedenza e l'app lo legge. */
var ultimoFileLetto = null;
/* ---------- catalogo incorporato ---------- */
/* Il file catalogo-messier.txt sta nella cartella dell app: viene letto all avvio.
   Nessuna richiesta di rete, nessun CDN. */
function parseCatalogoIntegrato(testo){
  var righe = testo.split(/\r?\n/);
  var out = [];
  for(var i = 0; i < righe.length; i++){
    var r = righe[i].trim();
    if(!r || r.charAt(0) === "#") continue;
    var p = r.split("|");
    if(p.length < 4) continue;
    var ra = parseFloat(p[2]), dec = parseFloat(p[3]);
    if(!isFinite(ra) || !isFinite(dec)) continue;
    var kind = p[1] || "Oggetto";
    var mag = parseFloat(p[4]);
    out.push({
      name: p[0], id: p[0], messier: p[7] || "", type: "deep", kind: kind,
      color: colorForType(kind),
      mag: isFinite(mag) ? mag : 9,
      ra: ra, dec: dec,
      constellation: p[5] || "", common: p[6] || "",
      source: "catalogo incorporato (OpenNGC, CC-BY-SA 4.0)"
    });
  }
  return out;
}
function caricaCatalogoIntegrato(){
  return fetch("catalogo-messier.txt", { cache: "force-cache" })
    .then(function(r){ if(!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
    .then(function(testo){
      var list = parseCatalogoIntegrato(testo);
      if(!list.length) throw new Error("catalogo vuoto");
      var esistenti = {};
      for(var j = 0; j < catalog.length; j++) esistenti[catalog[j].name] = 1;
      var aggiunti = list.filter(function(o){ return !esistenti[o.name]; });
      catalog = catalog.concat(aggiunti);
      deepReady = true;
      var s = document.getElementById("catalogStatus");
      if(s) s.textContent = "Catalogo incorporato: " + list.length +
        " oggetti (Messier completo e selezione NGC/IC). Totale: " + catalog.length + ".";
      var b = document.getElementById("mapState");
      if(b) b.textContent = catalog.length + " oggetti";
      console.log("catalogo incorporato:", list.length, "oggetti");
      return list.length;
    })
    .catch(function(e){
      console.warn("catalogo incorporato non letto:", e.message);
      var s = document.getElementById("catalogStatus");
      if(s) s.textContent = "Catalogo incorporato non disponibile (" + e.message +
        "). L app funziona con il catalogo locale di 19 oggetti.";
      return 0;
    });
}

/* ---------- lettura diagnostica del catalogo ---------- */
/* Mostra la prima riga del file scelto e prova ogni interpretazione possibile. */
function mostraRigaDiTesta(testo, file){
  var prima = testo.slice(0, 300).split(/\r?\n/)[0] || "";
  var s = document.getElementById("catalogStatus");
  if(s){
    s.innerHTML = "<strong>" + file.name + "</strong> (" + (file.size/1048576).toFixed(2) + " MB)<br>" +
      "prima riga: <code>" + prima.replace(/</g, "&lt;").slice(0, 200) + "</code>";
  }
  console.log("catalogo: prima riga =", prima);
  return prima;
}
function leggiCatalogo(file){
  if(!file) return;
  progress(10, "Apro " + file.name + "...");
  var reader = new FileReader();
  reader.onload = function(){
    var testo = String(reader.result);
    mostraRigaDiTesta(testo, file);
    progress(40, "Analizzo le colonne...");

    var list = null, errore = null;
    try{ list = openngcToObjects(testo); }
    catch(e){ errore = e.message; }

    if(!list || !list.length){
      var perSomiglianza = convertiPerSomiglianza(testo);
      if(perSomiglianza.length) list = perSomiglianza;
    }

    if(!list || !list.length){
      progress(100, "Non riconosciuto");
      var prima = testo.slice(0, 150).split(/\r?\n/)[0] || "vuota";
      progressDone("File non riconosciuto: " + (errore || "nessun oggetto con coordinate valide") +
        " - prima riga letta: " + prima);
      toast("File non riconosciuto: vedi il messaggio sotto");
      return;
    }

    progress(80, "Aggiungo " + list.length + " oggetti...");
    var esistenti = {};
    for(var j = 0; j < catalog.length; j++){ esistenti[catalog[j].name] = 1; }
    var aggiunti = list.filter(function(o){ return !esistenti[o.name]; });
    catalog = catalog.concat(aggiunti);
    deepReady = true;
    idbSet("openngc", testo);
    progress(100, "Fatto");
    progressDone("Letti " + list.length + " oggetti; aggiunti " + aggiunti.length + ". Totale: " + catalog.length + ".");
    var badge = document.getElementById("mapState");
    if(badge) badge.textContent = catalog.length + " oggetti";
    compute();
    toast(aggiunti.length + " oggetti aggiunti");
  };
  reader.onerror = function(){
    progressDone("Il browser non riesce a leggere il file. Se e su un disco di rete o in cloud, copialo prima in locale.");
  };
  reader.readAsText(file, "UTF-8");
}
/* Mostra le prime righe del file scelto: serve a capire cosa si sta aprendo. */
function wireFileInput(){
  var input = document.getElementById('catalogFile');
  if(!input) return;
  input.onchange = function(e){
    var f = e.target.files && e.target.files[0];
    if(f) leggiCatalogo(f);
  };
}

/* ---------- suggerimenti nella casella di ricerca ---------- */
var SUGGERIMENTI_VISIBILI = false;
var SUGGERIMENTI_ULTIMA_QUERY = "";

/* Normalizza per il confronto: minuscole, senza spazi, senza punteggiatura. */
function chiaveRicerca(s){ return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }

/* Costruisce la lista dei suggerimenti per il testo digitato.
   Regole:
   - se il testo contiene una sigla con numero (NGC 7, M 4, IC 1), propongo tutti
     gli oggetti di quella sigla che iniziano con quel numero;
   - altrimenti propongo i nomi che contengono il testo;
   - l\u2019ordine segue la vicinanza del numero e la luminosit\u00e0. */
function suggerisci(testo, limite){
  limite = limite || 12;
  var q = String(testo || "").trim();
  if(q.length < 2) return [];
  var ql = q.toLowerCase();
  var qc = chiaveRicerca(q);

  /* sigla + numero: NGC 7, M 4, IC 1, NGC7 */
  var m = ql.match(/^\s*(ngc|ic|m|messier)\s*(\d{1,4})\s*$/);
  var sigla = null, numero = null;
  if(m){
    sigla = m[1] === "messier" ? "m" : m[1];
    numero = m[2];
  }

  var punteggi = [];
  for(var i = 0; i < state.positions.length; i++){
    var o = state.positions[i];
    var nome = String(o.name);
    var nomeN = chiaveRicerca(nome);
    var idN = chiaveRicerca(o.id || "");
    var punteggio = 0;

    if(sigla && numero){
      /* l oggetto deve appartenere alla sigla e il suo numero iniziare con quello digitato */
      var pattern = new RegExp("^" + sigla + numero, "i");
      var patternPuro = new RegExp("^" + numero, "i");
      if(pattern.test(nomeN) || pattern.test(idN)) punteggio = 100;
      else if(sigla === "m" && o.messier && patternPuro.test(String(o.messier))) punteggio = 100;
      else if(patternPuro.test(nomeN.replace(/^[a-z]+/, ""))) punteggio = 70;
    } else {
      if(nomeN.indexOf(qc) === 0) punteggio = 90;
      else if(nomeN.indexOf(qc) > -1) punteggio = 60;
      else if(idN.indexOf(qc) === 0) punteggio = 85;
      else if(chiaveRicerca(o.common || "").indexOf(qc) === 0) punteggio = 55;
    }
    if(!punteggio) continue;
    /* preferisco gli oggetti piu luminosi e quelli sopra l orizzonte */
    var mag = (typeof o.mag === "number" && isFinite(o.mag)) ? o.mag : 9;
    punteggio += Math.max(0, 12 - mag);
    if(o.alt > 0) punteggio += 6;
    punteggi.push({ o: o, p: punteggio });
  }
  punteggi.sort(function(a, b){ return b.p - a.p; });
  return punteggi.slice(0, limite).map(function(x){ return x.o; });
}

/* Disegna il riquadro dei suggerimenti sotto la casella. */
function mostraSuggerimenti(testo){
  var box = document.getElementById("suggestBox");
  var campo = document.getElementById("objectSearch");
  if(!box || !campo) return;
  var lista = suggerisci(testo, 12);
  if(!lista.length){
    box.hidden = true;
    box.innerHTML = "";
    SUGGERIMENTI_VISIBILI = false;
    return;
  }
  box.innerHTML = lista.map(function(o, idx){
    var alt = (typeof o.alt === "number") ? o.alt.toFixed(0) + "\u00B0" : "";
    var stato = o.alt > 0 ? "sopra l\u2019orizzonte" : "sotto l\u2019orizzonte";
    return "<div class=\"suggest-row" + (idx === 0 ? " primo" : "") + "\" data-name=\"" +
      String(o.name).replace(/"/g, "&quot;") + "\">" +
      "<i style=\"background:" + o.color + "\"></i>" +
      "<span>" + o.name + "</span>" +
      "<em>" + o.kind + " \u00B7 " + stato + " \u00B7 " + alt + "</em>" +
      "</div>";
  }).join("");
  box.hidden = false;
  SUGGERIMENTI_VISIBILI = true;
  /* il clic sceglie l oggetto */
  var righe = box.querySelectorAll(".suggest-row");
  for(var k = 0; k < righe.length; k++){
    righe[k].onmousedown = function(e){
      e.preventDefault();
      var nome = this.getAttribute("data-name");
      scegliSuggerimento(nome);
    };
  }
}

/* Seleziona l oggetto suggerito, aggiorna tutto e chiude l elenco. */
function scegliSuggerimento(nome){
  var o = state.positions.find(function(x){ return x.name === nome; });
  if(!o) return;
  state.selected = o;
  var campo = document.getElementById("objectSearch");
  if(campo) campo.value = nome;
  var box = document.getElementById("suggestBox");
  if(box){ box.hidden = true; box.innerHTML = ""; }
  SUGGERIMENTI_VISIBILI = false;
  drawAll(localDate());
  toast(nome + " \u00B7 " + (o.alt > 0 ? o.alt.toFixed(1) + "\u00B0 sull\u2019orizzonte" : "sotto l\u2019orizzonte"));
}

/* Da chiamare mentre si digita, con un piccolo ritardo per non affaticare il browser. */
var attesaSuggerimenti = null;
function inputRicerca(){
  var campo = document.getElementById("objectSearch");
  var testo = campo ? campo.value : "";
  drawList();
  if(attesaSuggerimenti) clearTimeout(attesaSuggerimenti);
  attesaSuggerimenti = setTimeout(function(){ mostraSuggerimenti(testo); }, 120);
}

/* ---------- eventi ---------- */

function geocode(){
  var q = $('#address').value.trim();
  if(!q) return;
  fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q),
        { headers: { 'Accept-Language':'it' } })
    .then(function(r){ return r.json(); })
    .then(function(a){
      if(!a.length) throw new Error('nessun risultato');
      $('#lat').value = parseFloat(a[0].lat).toFixed(6);
      $('#lon').value = parseFloat(a[0].lon).toFixed(6);
      state.place = a[0].display_name.split(',')[0];
      compute();
    })
    .catch(function(){ toast('Localit&agrave; non trovata'); });
}
function useMyPosition(){
  if(!navigator.geolocation){ toast('Geolocalizzazione non supportata'); return; }
  navigator.geolocation.getCurrentPosition(function(p){
    $('#lat').value = p.coords.latitude.toFixed(6);
    $('#lon').value = p.coords.longitude.toFixed(6);
    state.place = 'la tua posizione';
    compute();
  }, function(){ toast('Posizione non disponibile'); });
}

if($('#geoBtn')) $('#geoBtn').onclick = useMyPosition;
if($('#searchPlace')) $('#searchPlace').onclick = geocode;
if($('#address')) $('#address').onkeydown = function(e){ if(e.key === 'Enter') geocode(); };
if($('#objectSearch')) $('#objectSearch').onkeydown = function(e){
  var box = document.getElementById('suggestBox');
  if(!box || box.hidden) return;
  var righe = box.querySelectorAll('.suggest-row');
  if(!righe.length) return;
  if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
    e.preventDefault();
    var idx = -1;
    for(var i=0;i<righe.length;i++){ if(righe[i].classList.contains('attivo')) idx = i; }
    var prossimo = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
    if(prossimo < 0) prossimo = righe.length - 1;
    if(prossimo >= righe.length) prossimo = 0;
    for(var j=0;j<righe.length;j++) righe[j].classList.remove('attivo');
    righe[prossimo].classList.add('attivo');
  } else if(e.key === 'Enter'){
    e.preventDefault();
    var attiva = box.querySelector('.suggest-row.attivo') || righe[0];
    scegliSuggerimento(attiva.getAttribute('data-name'));
  } else if(e.key === 'Escape'){
    box.hidden = true;
  }
};
['lat','lon','date','time'].forEach(function(id){
  var el = document.getElementById(id);
  if(el) el.onchange = compute;
});
if($('#timeSlider')) $('#timeSlider').oninput = function(e){
  var m = parseInt(e.target.value,10);
  $('#time').value = String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0');
  compute();
};
if($('#time')) $('#time').oninput = function(e){
  var p = e.target.value.split(':');
  if(p.length >= 2) $('#timeSlider').value = parseInt(p[0],10)*60 + parseInt(p[1],10);
};
if($('#objectSearch')) $('#objectSearch').oninput = inputRicerca;
if($('#aboveOnly')) $('#aboveOnly').onchange = drawList;

$$('.chip').forEach(function(b){
  b.onclick = function(){
    $$('.chip').forEach(function(x){ x.classList.remove('active'); });
    b.classList.add('active');
    state.filter = b.dataset.filter;
    drawList();
  };
});
$$('.tab').forEach(function(b){
  b.onclick = function(){
    $$('.tab').forEach(function(x){ x.classList.remove('active'); });
    $$('.view').forEach(function(x){ x.classList.remove('active'); });
    b.classList.add('active');
    var v = document.getElementById(b.dataset.view + 'View');
    if(v) v.classList.add('active');
    if(b.dataset.view === 'map'){
      try {
        if(state.map){ setTimeout(function(){ state.map.invalidateSize(); drawMap(); }, 60); }
        else drawMap();
      } catch(e){ console.warn('mappa', e); }
    }
  };
});
['allDsoBtn','messierBtn','ngcBtn','icBtn'].forEach(function(id){
  var b=document.getElementById(id);
  if(b) b.onclick=function(){ loadDeepCatalog(id.replace('Btn','').replace('allDso','all')); };
});
if($('#liveBtn')) $('#liveBtn').onclick = function(){ initTime(); compute(); };
if($('#overlayBtn')) $('#overlayBtn').onclick = function(){
  state.showProjection = !state.showProjection;
  var b = document.getElementById('overlayBtn');
  if(b) b.textContent = state.showProjection ? 'Proiezione cielo' : 'Proiezione spenta';
  if(state.projectionLayer){
    if(state.showProjection) state.projectionLayer.addTo(state.map);
    else state.map.removeLayer(state.projectionLayer);
  }
  drawMap();
};
if($('#recenterBtn')) $('#recenterBtn').onclick = function(){
  if(state.map) state.map.setView([state.lat, state.lon], 15);
  toast('Mappa centrata sull&rsquo;osservatore');
};
if($('#zoomInBtn')) $('#zoomInBtn').onclick = function(){
  if(state.map){ state.map.zoomIn(); return; }
  state.zoom = Math.min(19, state.zoom + 1);
};
if($('#zoomOutBtn')) $('#zoomOutBtn').onclick = function(){
  if(state.map){ state.map.zoomOut(); return; }
  state.zoom = Math.max(4, state.zoom - 1);
};
if($('#skyCanvas')) $('#skyCanvas').onclick = function(e){
  var r = e.target.getBoundingClientRect();
  var x = (e.clientX - r.left) * e.target.width / r.width;
  var y = (e.clientY - r.top) * e.target.height / r.height;
  var o = state.positions.find(function(o){
    return o._hit && Math.hypot(x - o._hit.x, y - o._hit.y) < o._hit.r;
  });
  if(o){ state.selected = o; drawAll(localDate()); }
};

document.addEventListener('click', function(e){
  var box = document.getElementById('suggestBox');
  var campo = document.getElementById('objectSearch');
  if(!box || box.hidden) return;
  if(box.contains(e.target) || (campo && campo === e.target)) return;
  box.hidden = true;
});
window.addEventListener('beforeinstallprompt', function(e){
  e.preventDefault(); state.deferred = e;
  var b = document.getElementById('installBtn');
  if(b) b.hidden = false;
});
if($('#installBtn')) $('#installBtn').onclick = function(){
  if(state.deferred){
    state.deferred.prompt();
    state.deferred.userChoice.then(function(){ state.deferred = null; $('#installBtn').hidden = true; });
  }
};
if('serviceWorker' in navigator){
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('./sw.js').catch(function(e){ console.warn('service worker', e); });
  });
}

/* ---------- avvio ---------- */
try { initTime(); } catch(e){ console.warn(e); }
wireFileInput();
caricaCatalogoIntegrato().then(function(n){
  if(n) compute();
  return restoreDeep();
}).then(function(){ compute(); }).catch(function(){});
try { compute(); } catch(e){ console.warn('calcolo non riuscito', e); }
