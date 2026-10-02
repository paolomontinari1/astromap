'use strict';
var D2R = Math.PI/180, R2D = 180/Math.PI;
var catalogo = [], selezionato = null, visibili = [];
var filtro = 'all';
var mappa = null, segnoOsservatore = null, livelli = [], stratoProiezione = null;
var sagoma = null, disegnando = false, attesaSuggerimenti = null;
var posizione = { lat: 41.902782, lon: 12.496366, luogo: 'Roma' };

function $(id){ return document.getElementById(id); }
function norm(x){ return ((x % 360) + 360) % 360; }
function jd(d){ return d.getTime()/86400000 + 2440587.5; }
function gmst(d){ return norm(280.46061837 + 360.98564736629 * (jd(d) - 2451545)); }
function orario(minuti){
  var m = Math.round(minuti);
  while(m < 0) m += 1440;
  var h = Math.floor(m/60) % 24, mm = m % 60;
  return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
}
function cardinale(a){
  var n = ['Nord','Nord-est','Est','Sud-est','Sud','Sud-ovest','Ovest','Nord-ovest'];
  return n[Math.round(a/45) % 8];
}
function avviso(testo){
  var t = $('toast');
  if(!t) return;
  t.textContent = testo;
  t.className = 'toast show';
  setTimeout(function(){ t.className = 'toast'; }, 2600);
}
function dataScelta(){
  var d = $('date').value, t = $('time').value || '00:00';
  return new Date(d + 'T' + t + ':00');
}

/* astronomia */
function soleRaDec(d){
  var n = jd(d) - 2451545;
  var L = norm(280.46 + 0.9856474*n);
  var g = norm(357.528 + 0.9856003*n) * D2R;
  var lam = (L + 1.915*Math.sin(g) + 0.02*Math.sin(2*g)) * D2R;
  var e = (23.439 - 0.0000004*n) * D2R;
  return { ra: norm(Math.atan2(Math.cos(e)*Math.sin(lam), Math.cos(lam)) * R2D), dec: Math.asin(Math.sin(e)*Math.sin(lam)) * R2D };
}
function lunaRaDec(d){
  var n = jd(d) - 2451545;
  var L = norm(218.316 + 13.176396*n);
  var M = norm(134.963 + 13.064993*n) * D2R;
  var F = norm(93.272 + 13.22935*n) * D2R;
  var lon = (L + 6.289*Math.sin(M)) * D2R;
  var lat = 5.128*Math.sin(F) * D2R;
  var e = 23.439 * D2R;
  return { ra: norm(Math.atan2(Math.sin(lon)*Math.cos(e) - Math.tan(lat)*Math.sin(e), Math.cos(lon)) * R2D), dec: Math.asin(Math.sin(lat)*Math.cos(e) + Math.cos(lat)*Math.sin(e)*Math.sin(lon)) * R2D };
}
var ORBITE = { mercury:[252.3,4.09,7], venus:[181.9,1.602,3.4], mars:[355.4,0.524,1.85], jupiter:[34.4,0.0831,1.3], saturn:[50.1,0.0335,2.5], uranus:[314,0.0117,0.8], neptune:[304,0.006,0.7] };
function pianetaRaDec(nome, d){
  var o = ORBITE[nome], n = jd(d) - 2451545;
  var lon = norm(o[0] + o[1]*n);
  var lat = o[2] * Math.sin((lon*1.7 + o[0]) * D2R);
  var e = 23.439 * D2R, l = lon*D2R, b = lat*D2R;
  return { ra: norm(Math.atan2(Math.sin(l)*Math.cos(e) - Math.tan(b)*Math.sin(e), Math.cos(l)) * R2D), dec: Math.asin(Math.sin(b)*Math.cos(e) + Math.cos(b)*Math.sin(e)*Math.sin(l)) * R2D };
}
function altAz(ra, dec, d){
  var H = norm(gmst(d) + posizione.lon - ra) * D2R;
  var ph = posizione.lat * D2R, de = dec * D2R;
  var alt = Math.asin(Math.sin(ph)*Math.sin(de) + Math.cos(ph)*Math.cos(de)*Math.cos(H));
  var az = Math.atan2(Math.sin(H), Math.cos(H)*Math.sin(ph) - Math.tan(de)*Math.cos(ph));
  return { alt: alt * R2D, az: norm(az * R2D + 180) };
}
function calcola(o, d){
  var eq;
  if(o.corpo === 'sun') eq = soleRaDec(d);
  else if(o.corpo === 'moon') eq = lunaRaDec(d);
  else if(o.corpo) eq = pianetaRaDec(o.corpo, d);
  else eq = { ra: o.ra, dec: o.dec };
  var aa = altAz(eq.ra, eq.dec, d);
  return { nome:o.nome, tipo:o.tipo, genere:o.genere, colore:o.colore, magnitudine:o.magnitudine, corpo:o.corpo, comune:o.comune, fonte:o.fonte, ra:eq.ra, dec:eq.dec, alt:aa.alt, az:aa.az };
}

var COLORI = { 'Galassia':'#ae9cff', 'Ammasso globulare':'#cab7ff', 'Ammasso aperto':'#8db8ff', 'Nebulosa a emissione':'#ff9ad5', 'Nebulosa planetaria':'#82e2d0', 'Nebulosa a riflessione':'#9fd6ff', 'Regione HII':'#ff9ad5', 'Ammasso con nebulosa':'#bcd0ff', 'Nebulosa oscura':'#7d7fa0', 'Resto di supernova':'#ffb36b', 'Stella':'#d8eaff', 'Stella doppia':'#d8eaff', 'Oggetto':'#9f8cff' };
function coloreDi(t){ return COLORI[t] || '#9f8cff'; }

function componiCatalogo(testo){
  catalogo = [];
  var corpi = [
    ['Sole','solar','Stella','#ffc85b',-26.74,'sun'],
    ['Luna','solar','Satellite','#dbe7ff',-12.7,'moon'],
    ['Mercurio','solar','Pianeta','#c7b7a3',-1,'mercury'],
    ['Venere','solar','Pianeta','#ffe0a3',-4.2,'venus'],
    ['Marte','solar','Pianeta','#ff806d',-1.5,'mars'],
    ['Giove','solar','Pianeta','#ffd0a6',-2.4,'jupiter'],
    ['Saturno','solar','Pianeta','#f3d38b',0.6,'saturn'],
    ['Urano','solar','Pianeta','#9fe9e9',5.7,'uranus'],
    ['Nettuno','solar','Pianeta','#7ca6ff',7.8,'neptune']
  ];
  for(var i = 0; i < corpi.length; i++){
    var c = corpi[i];
    catalogo.push({ nome:c[0], tipo:c[1], genere:c[2], colore:c[3], magnitudine:c[4], corpo:c[5], fonte:'calcolo locale' });
  }
  var stelle = [
    ['Sirio',101.2875,-16.7161,-1.46],['Canopo',95.9879,-52.6957,-0.74],['Arturo',213.9153,19.1824,-0.05],
    ['Vega',279.2347,38.7837,0.03],['Capella',79.1723,45.9979,0.08],['Rigel',78.6345,-8.2016,0.13],
    ['Procione',114.8255,5.225,0.34],['Betelgeuse',88.7929,7.4071,0.5],['Altair',297.6958,8.8683,0.77],
    ['Aldebaran',68.98,16.5093,0.85],['Spica',201.2983,-11.1613,0.98],['Antares',247.3519,-26.432,1.06],
    ['Deneb',310.358,45.2803,1.25],['Polare',37.9546,89.2641,1.98]
  ];
  for(var j = 0; j < stelle.length; j++){
    var s = stelle[j];
    catalogo.push({ nome:s[0], tipo:'star', genere:'Stella', colore:'#d8eaff', magnitudine:s[3], ra:s[1], dec:s[2], fonte:'catalogo locale' });
  }
  var linee = String(testo || '').split('\n');
  for(var k = 0; k < linee.length; k++){
    var p = linee[k].split('|');
    if(p.length < 4) continue;
    var ra = parseFloat(p[2]), dec = parseFloat(p[3]);
    if(!isFinite(ra) || !isFinite(dec)) continue;
    var genere = p[1] || 'Oggetto';
    var mag = parseFloat(p[4]);
    catalogo.push({ nome:p[0], tipo:'deep', genere:genere, colore:coloreDi(genere), magnitudine:isFinite(mag) ? mag : 9, ra:ra, dec:dec, comune:p[6] || '', fonte:'catalogo integrato' });
  }
  var b = $('badge');
  if(b) b.textContent = 'v5.0 - ' + catalogo.length + ' oggetti';
  console.log('catalogo:', catalogo.length, 'oggetti');
}

/* ===== infogramma e fase lunare ===== */
function curvaGiorno(o, giorno){
  var punti = [], inizio = null, fine = null, culmine = null;
  for(var m = 0; m <= 1440; m += 10){
    var d = new Date(giorno.getTime());
    d.setHours(0, 0, 0, 0);
    d.setMinutes(m);
    var p = calcola(o, d);
    punti.push({ minuti:m, alt:p.alt });
    if(!culmine || p.alt > culmine.alt) culmine = { alt:p.alt, minuti:m };
    if(p.alt > 0 && inizio === null) inizio = m;
    if(p.alt > 0) fine = m;
  }
  return { punti:punti, inizio:inizio, fine:fine, culmine:culmine };
}
function faseLunare(d){
  var sole = soleRaDec(d), luna = lunaRaDec(d);
  var a1 = sole.ra*D2R, d1 = sole.dec*D2R, a2 = luna.ra*D2R, d2 = luna.dec*D2R;
  var cosE = Math.sin(d1)*Math.sin(d2) + Math.cos(d1)*Math.cos(d2)*Math.cos(a1 - a2);
  if(cosE > 1) cosE = 1;
  if(cosE < -1) cosE = -1;
  var elong = Math.acos(cosE) * R2D;
  var illum = (1 - Math.cos(elong * D2R)) / 2;
  var eta = (elong / 360) * 29.530588853;
  var nome = 'Luna nuova';
  if(eta < 1.85) nome = 'Luna nuova';
  else if(eta < 5.54) nome = 'Falce crescente';
  else if(eta < 9.23) nome = 'Primo quarto';
  else if(eta < 12.91) nome = 'Gibbosa crescente';
  else if(eta < 16.61) nome = 'Luna piena';
  else if(eta < 20.30) nome = 'Gibbosa calante';
  else if(eta < 23.99) nome = 'Ultimo quarto';
  else if(eta < 27.68) nome = 'Falce calante';
  return { eta:eta, illum:illum, nome:nome };
}
function disegnaCurva(){
  var tela = $('infoCanvas');
  if(!tela || !selezionato) return;
  var x = tela.getContext('2d'), w = tela.width, h = tela.height;
  x.clearRect(0, 0, w, h);
  x.fillStyle = '#080f20';
  x.fillRect(0, 0, w, h);
  var c = curvaGiorno(selezionato, dataScelta());
  var sin = 42, des = 12, alto = 14, basso = 28;
  var larg = w - sin - des, alt = h - alto - basso;
  var minY = -30, maxY = 90;
  function yDa(a){ return alto + alt * (maxY - a) / (maxY - minY); }
  function xDa(m){ return sin + larg * m / 1440; }
  var gradi = [90, 60, 30, 0, -30];
  x.font = '10px system-ui';
  x.textAlign = 'right';
  for(var i = 0; i < gradi.length; i++){
    var g = gradi[i], y = yDa(g);
    x.strokeStyle = (g === 0) ? 'rgba(88,214,193,.6)' : 'rgba(100,130,175,.18)';
    x.lineWidth = (g === 0) ? 1.6 : 1;
    x.beginPath(); x.moveTo(sin, y); x.lineTo(sin + larg, y); x.stroke();
    x.fillStyle = (g === 0) ? '#58d6c1' : '#7c8dae';
    x.fillText(g + '\u00B0', sin - 5, y + 4);
  }
  x.textAlign = 'center';
  x.fillStyle = '#7c8dae';
  for(var ora = 0; ora <= 24; ora += 6){
    var px = xDa(ora*60);
    x.strokeStyle = 'rgba(100,130,175,.15)';
    x.beginPath(); x.moveTo(px, alto); x.lineTo(px, alto + alt); x.stroke();
    x.fillText((ora < 10 ? '0' : '') + ora + ':00', px, h - 10);
  }
  x.beginPath();
  x.moveTo(xDa(0), yDa(0));
  for(var p = 0; p < c.punti.length; p++) x.lineTo(xDa(c.punti[p].minuti), yDa(Math.max(0, c.punti[p].alt)));
  x.lineTo(xDa(1440), yDa(0));
  x.closePath();
  var grad = x.createLinearGradient(0, alto, 0, alto + alt);
  grad.addColorStop(0, 'rgba(88,214,193,.30)');
  grad.addColorStop(1, 'rgba(88,214,193,.02)');
  x.fillStyle = grad;
  x.fill();
  x.beginPath();
  for(var q = 0; q < c.punti.length; q++){
    var pt = c.punti[q], qx = xDa(pt.minuti), qy = yDa(pt.alt);
    if(q === 0) x.moveTo(qx, qy); else x.lineTo(qx, qy);
  }
  x.strokeStyle = '#ffc85b';
  x.lineWidth = 2.2;
  x.stroke();
  var segna = function(px, py, colore, testo){
    x.beginPath(); x.arc(px, py, 4, 0, Math.PI*2);
    x.fillStyle = colore; x.fill();
    x.font = '700 10px system-ui'; x.textAlign = 'center'; x.fillStyle = colore;
    x.fillText(testo, px, py - 9);
  };
  if(c.inizio !== null) segna(xDa(c.inizio), yDa(0), '#8db8ff', 'sorge');
  if(c.culmine) segna(xDa(c.culmine.minuti), yDa(c.culmine.alt), '#58d6c1', 'culmina');
  if(c.fine !== null) segna(xDa(c.fine), yDa(0), '#ff9f6b', 'tramonta');
}
function disegnaFase(){
  var tela = $('faseCanvas');
  var testo = $('faseTesto');
  if(!tela) return;
  var x = tela.getContext('2d'), w = tela.width, h = tela.height;
  x.clearRect(0, 0, w, h);
  var f = faseLunare(dataScelta());
  var cx = w/2, cy = h/2, R = Math.min(w, h) * 0.36;
  x.beginPath(); x.arc(cx, cy, R, 0, Math.PI*2);
  x.fillStyle = '#17203a'; x.fill();
  x.strokeStyle = '#3d5a86'; x.lineWidth = 1.5; x.stroke();
  var cresce = f.eta < 14.77;
  x.save();
  x.beginPath();
  x.arc(cx, cy, R, -Math.PI/2, Math.PI/2, !cresce);
  var k = 1 - 2*f.illum;
  x.ellipse(cx, cy, Math.abs(R*k), R, 0, Math.PI/2, -Math.PI/2, k > 0 ? !cresce : cresce);
  x.closePath();
  x.fillStyle = '#eef4ff'; x.fill();
  x.restore();
  if(testo){
    var luna = null;
    for(var i = 0; i < visibili.length; i++) if(visibili[i].nome === 'Luna') luna = visibili[i];
    var c = luna ? curvaGiorno(luna, dataScelta()) : null;
    var riga = function(a, b){ return '<div class="riga"><span>' + a + '</span><strong>' + b + '</strong></div>'; };
    var html = riga('Fase', f.nome) + riga('Illuminazione', Math.round(f.illum*100) + '%') + riga('Et\u00E0', f.eta.toFixed(1) + ' giorni');
    if(c){
      html += riga('Sorge', c.inizio !== null ? orario(c.inizio) + ' - 0\u00B0' : 'non sorge');
      html += riga('Culmina', c.culmine ? orario(c.culmine.minuti) + ' - ' + c.culmine.alt.toFixed(1) + '\u00B0' : '-');
      html += riga('Tramonta', c.fine !== null ? orario(c.fine) + ' - 0\u00B0' : 'non tramonta');
    }
    testo.innerHTML = html;
  }
}

/* ===== scheda dell'oggetto ===== */
function mostraScheda(){
  var host = $('infoDati');
  var nome = $('infoNome');
  if(!host || !selezionato) return;
  if(nome) nome.textContent = selezionato.nome + '  -  ' + selezionato.genere;
  var q = selezionato.alt > 45 ? 'Ottima' : selezionato.alt > 20 ? 'Buona' : selezionato.alt > 0 ? 'Bassa' : 'Non visibile';
  var riga = function(a, b){ return '<div class="riga"><span>' + a + '</span><strong>' + b + '</strong></div>'; };
  host.innerHTML =
    riga('Altezza', selezionato.alt.toFixed(1) + '\u00B0') +
    riga('Azimut', selezionato.az.toFixed(1) + '\u00B0 - ' + cardinale(selezionato.az)) +
    riga('Ascensione retta', (selezionato.ra/15).toFixed(2) + ' h') +
    riga('Declinazione', selezionato.dec.toFixed(2) + '\u00B0') +
    riga('Magnitudine', String(selezionato.magnitudine)) +
    riga('Qualit\u00E0', q) +
    (selezionato.comune ? riga('Nome comune', selezionato.comune) : '');
}

/* ===== grafico degli orari ===== */
function mostraOrari(){
  var host = $('infoOrari');
  if(!host || !selezionato) return;
  var c = curvaGiorno(selezionato, dataScelta());
  var riga = function(a, b){ return '<div class="riga"><span>' + a + '</span><strong>' + b + '</strong></div>'; };
  var html = '';
  html += riga('Sorge', c.inizio !== null ? orario(c.inizio) + ' - 0\u00B0' : 'non sorge');
  html += riga('Culmina', c.culmine ? orario(c.culmine.minuti) + ' - ' + c.culmine.alt.toFixed(1) + '\u00B0' : '-');
  html += riga('Tramonta', c.fine !== null ? orario(c.fine) + ' - 0\u00B0' : 'non tramonta');
  host.innerHTML = html;
}

/* ===== elenco ===== */
function chiaveTESTO(s){ return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function filtra(){
  var q = ($('objectSearch').value || '').toLowerCase();
  var sopra = $('aboveOnly').checked;
  var out = [];
  for(var i = 0; i < visibili.length; i++){
    var o = visibili[i];
    if(filtro !== 'all' && o.tipo !== filtro) continue;
    if(sopra && o.alt <= 0) continue;
    if(q && o.nome.toLowerCase().indexOf(q) < 0) continue;
    out.push(o);
  }
  out.sort(function(a, b){ return b.alt - a.alt; });
  return out;
}
function disegnaElenco(){
  var host = $('objectList');
  if(!host) return;
  var lista = filtra();
  if(!lista.length){ host.innerHTML = '<p class=\'nota\'>Nessun oggetto con questi filtri.</p>'; return; }
  var html = '';
  for(var i = 0; i < lista.length && i < 400; i++){
    var o = lista[i];
    var sel = (selezionato && selezionato.nome === o.nome) ? ' scelto' : '';
    html += '<div class="voce' + sel + '" data-nome="' + o.nome + '">' +
      '<i style="background:' + o.colore + '"></i>' +
      '<div><strong>' + o.nome + '</strong><small>' + o.genere + '</small></div>' +
      '<b>' + o.alt.toFixed(1) + '\u00B0</b></div>';
  }
  host.innerHTML = html;
  var voci = host.querySelectorAll('.voce');
  for(var k = 0; k < voci.length; k++){
    voci[k].onclick = function(){
      scegli(this.getAttribute('data-nome'));
    };
  }
}

/* ===== suggerimenti ===== */
function suggerisci(testo, limite){
  limite = limite || 12;
  var q = String(testo || '').trim();
  if(q.length < 2) return [];
  var qc = chiaveTESTO(q);
  var m = q.toLowerCase().match(/^\s*(ngc|ic|m|messier|sh2)\s*(\d{1,4})\s*$/);
  var sigla = null, numero = null;
  if(m){ sigla = m[1] === 'messier' ? 'm' : m[1]; numero = m[2]; }
  var trovati = [];
  for(var i = 0; i < visibili.length; i++){
    var o = visibili[i];
    var nomeN = chiaveTESTO(o.nome);
    var p = 0;
    if(sigla && numero){
      var conSigla = new RegExp('^' + sigla + numero, 'i');
      var soloNum = new RegExp('^' + numero, 'i');
      if(conSigla.test(nomeN)) p = 100;
      else if(sigla === 'm' && soloNum.test(nomeN.replace(/^m/, ''))) p = 95;
      else if(soloNum.test(nomeN.replace(/^[a-z]+/, ''))) p = 70;
    } else {
      if(nomeN.indexOf(qc) === 0) p = 90;
      else if(nomeN.indexOf(qc) > -1) p = 60;
      else if(chiaveTESTO(o.comune).indexOf(qc) === 0) p = 55;
    }
    if(!p) continue;
    p += Math.max(0, 12 - o.magnitudine);
    if(o.alt > 0) p += 6;
    trovati.push({ o:o, p:p });
  }
  trovati.sort(function(a, b){ return b.p - a.p; });
  var out = [];
  for(var k = 0; k < trovati.length && k < limite; k++) out.push(trovati[k].o);
  return out;
}
function mostraSuggerimenti(testo){
  var box = $('suggestBox');
  if(!box) return;
  var q = String(testo || '').trim();
  if(q.length < 2){ box.hidden = true; box.innerHTML = ''; return; }
  var lista = suggerisci(testo, 14);
  if(!lista.length){
    box.innerHTML = '<div class="suggest-vuoto">Nessun oggetto per ' + q + '</div>';
    box.hidden = false;
    return;
  }
  var html = '';
  for(var i = 0; i < lista.length; i++){
    var o = lista[i];
    html += '<div class="suggest-row" data-nome="' + o.nome + '">' +
      '<i style="background:' + o.colore + '"></i>' +
      '<span>' + o.nome + '</span>' +
      '<em>' + o.genere + ' - ' + (o.alt > 0 ? 'sopra' : 'sotto') + ' l\u2019orizzonte - ' + o.alt.toFixed(0) + '\u00B0</em></div>';
  }
  box.innerHTML = html;
  box.hidden = false;
  var righeBox = box.querySelectorAll('.suggest-row');
  for(var k = 0; k < righeBox.length; k++){
    righeBox[k].onmousedown = function(e){
      e.preventDefault();
      scegli(this.getAttribute('data-nome'));
    };
  }
}

/* ===== mappa citta ===== */
function puntoLontano(lat, lon, azimut, km){
  var R = 6371, d = km/R, b = azimut*D2R;
  var p1 = lat*D2R, l1 = lon*D2R;
  var p2 = Math.asin(Math.sin(p1)*Math.cos(d) + Math.cos(p1)*Math.sin(d)*Math.cos(b));
  var l2 = l1 + Math.atan2(Math.sin(b)*Math.sin(d)*Math.cos(p1), Math.cos(d) - Math.sin(p1)*Math.sin(p2));
  return [p2*R2D, l2*R2D];
}
function disegnaMappa(){
  var host = $('cityMap');
  if(!host) return;
  if(typeof L === 'undefined'){
    host.innerHTML = '<p class="nota">La mappa richiede una connessione al primo caricamento.</p>';
    return;
  }
  if(!mappa){
    mappa = L.map(host, { zoomControl:false, scrollWheelZoom:true });
    mappa.setView([posizione.lat, posizione.lon], 17);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mappa);
    mappa.on('click', function(e){
      $('lat').value = e.latlng.lat.toFixed(6);
      $('lon').value = e.latlng.lng.toFixed(6);
      posizione.lat = e.latlng.lat;
      posizione.lon = e.latlng.lng;
      posizione.luogo = 'punto scelto';
      aggiorna();
    });
  }
  var centro = mappa.getCenter(), zoom = mappa.getZoom();
  if(segnoOsservatore) mappa.removeLayer(segnoOsservatore);
  segnoOsservatore = L.circleMarker([posizione.lat, posizione.lon], {
    radius:7, color:'#05201c', weight:3, fillColor:'#58d6c1', fillOpacity:1
  }).addTo(mappa).bindTooltip('Osservatore');
  for(var i = 0; i < livelli.length; i++) mappa.removeLayer(livelli[i]);
  livelli = [];
  if(stratoProiezione) mappa.removeLayer(stratoProiezione);
  stratoProiezione = L.layerGroup();
  var RADIO = 0.15;
  var anelli = [RADIO, RADIO*0.5, RADIO*0.25];
  for(var a = 0; a < anelli.length; a++){
    var punti = [];
    for(var g = 0; g <= 96; g++) punti.push(puntoLontano(posizione.lat, posizione.lon, g*360/96, anelli[a]));
    L.polygon(punti, { color: a === 0 ? '#58d6c1' : '#3d5a86', weight: a === 0 ? 2 : 1.2,
      opacity:0.7, fill:false, dashArray: a === 0 ? null : '4 6', interactive:false }).addTo(stratoProiezione);
  }
  L.marker([posizione.lat, posizione.lon], { interactive:false,
    icon: L.divIcon({ className:'zenith-tag', html:'zenit', iconSize:[46,18], iconAnchor:[23,9] })
  }).addTo(stratoProiezione);
  L.marker(puntoLontano(posizione.lat, posizione.lon, 0, RADIO), { interactive:false,
    icon: L.divIcon({ className:'horizon-tag', html:'orizzonte 150 m', iconSize:[104,18], iconAnchor:[52,9] })
  }).addTo(stratoProiezione);
  stratoProiezione.addTo(mappa);
  var pianeti = ['moon','mercury','venus','mars','jupiter','saturn','uranus','neptune'];
  for(var k = 0; k < visibili.length; k++){
    var o = visibili[k];
    var scelto = selezionato && selezionato.nome === o.nome;
    var mostra = (o.nome === 'Luna') || pianeti.indexOf(o.corpo) > -1 || scelto;
    if(!mostra) continue;
    if(o.alt <= 0 && !scelto) continue;
    var fraz = o.alt <= 0 ? 1 : (1 - o.alt/90);
    var fine = puntoLontano(posizione.lat, posizione.lon, o.az, Math.max(RADIO*fraz, 0.004));
    var linea = L.polyline([[posizione.lat, posizione.lon], fine], {
      color: scelto ? '#ffc85b' : o.colore, weight: scelto ? 3.5 : 2, opacity: scelto ? 0.95 : 0.7
    }).addTo(mappa);
    linea.bindTooltip(o.nome + ' - ' + o.az.toFixed(0) + '\u00B0 - ' + o.alt.toFixed(0) + '\u00B0', { className:'tip' });
    var nomeBloccato = o.nome;
    linea.on('click', function(){ scegli(nomeBloccato); });
    livelli.push(linea);
    var punto = L.circleMarker(fine, { radius: scelto ? 8 : 5, color:'#05201c', weight:2,
      fillColor: scelto ? '#ffc85b' : o.colore, fillOpacity:1 }).addTo(mappa);
    punto.on('click', function(){ scegli(nomeBloccato); });
    livelli.push(punto);
    livelli.push(L.marker(fine, { interactive:false,
      icon: L.divIcon({ className:'etichetta', html:'<span>' + o.nome + '</span>', iconSize:[0,0], iconAnchor:[-10,8] })
    }).addTo(mappa));
  }
  mappa.setView(centro, zoom, { animate:false });
  var t = $('mapTitle');
  if(t) t.textContent = 'Mappa sotto ' + posizione.luogo;
}

/* ===== pianificatore ===== */
var PASSO = 5;
function sagomaLibera(){
  var s = [];
  for(var a = 0; a < 360; a += PASSO) s.push(0);
  return s;
}
function sagomaPiena(){
  var s = [];
  for(var a = 0; a < 360; a += PASSO) s.push(30);
  return s;
}
function disegnaPianificatore(){
  var tela = $('planCanvas');
  if(!tela) return;
  var x = tela.getContext('2d'), w = tela.width, h = tela.height;
  var cx = w/2, cy = h/2, R = Math.min(w, h) * 0.44;
  x.clearRect(0, 0, w, h);
  var sf = x.createRadialGradient(cx, cy, 10, cx, cy, R);
  sf.addColorStop(0, '#101a31');
  sf.addColorStop(1, '#080f20');
  x.fillStyle = sf;
  x.beginPath(); x.arc(cx, cy, R, 0, Math.PI*2); x.fill();
  var anelli = [0, 30, 60, 90];
  for(var i = 0; i < anelli.length; i++){
    var g = anelli[i], rr = R*(1 - g/90);
    x.strokeStyle = (g === 0) ? 'rgba(88,214,193,.7)' : 'rgba(100,130,175,.22)';
    x.lineWidth = (g === 0) ? 2 : 1;
    x.beginPath(); x.arc(cx, cy, rr, 0, Math.PI*2); x.stroke();
  }
  x.strokeStyle = 'rgba(88,214,193,.45)';
  x.beginPath(); x.arc(cx, cy, 4, 0, Math.PI*2); x.stroke();
  x.font = 'bold 18px system-ui'; x.textAlign = 'center'; x.fillStyle = '#8fa1c5';
  var card = [['N',0],['E',90],['S',180],['O',270]];
  for(var c = 0; c < card.length; c++){
    var azc = card[c][1]*D2R;
    x.strokeStyle = 'rgba(100,130,175,.25)';
    x.beginPath(); x.moveTo(cx, cy);
    x.lineTo(cx + Math.sin(azc)*R, cy - Math.cos(azc)*R); x.stroke();
    x.fillText(card[c][0], cx + Math.sin(azc)*(R+24), cy - Math.cos(azc)*(R+24) + 6);
  }
  x.font = '10px system-ui'; x.fillStyle = '#7c8dae';
  for(var a = 0; a < 360; a += 30){
    var azr = a*D2R;
    x.fillText(a + '\u00B0', cx + Math.sin(azr)*(R+44), cy - Math.cos(azr)*(R+44));
  }
  x.textAlign = 'left';
  for(var k = 0; k < anelli.length; k++) x.fillText(anelli[k] + '\u00B0', cx + 6, cy - R*(1 - anelli[k]/90) + 4);
  x.fillStyle = '#58d6c1';
  x.fillText('oltre lo zenit', cx + 10, cy + 16);
  if(sagoma){
    x.beginPath();
    var primo = true;
    for(var s = 0; s < 360; s += PASSO){
      var alt = sagoma[s/PASSO] || 0;
      var az = s, quota = alt;
      if(alt > 90){ az = (s + 180) % 360; quota = 180 - alt; }
      var raggio = R * Math.max(0, (90 - quota)/90);
      var r2 = az*D2R;
      var px = cx + Math.sin(r2)*raggio, py = cy - Math.cos(r2)*raggio;
      if(primo){ x.moveTo(px, py); primo = false; } else x.lineTo(px, py);
    }
    x.closePath();
    x.fillStyle = 'rgba(88,214,193,.16)'; x.fill();
    x.strokeStyle = '#58d6c1'; x.lineWidth = 2; x.stroke();
  }
  if(selezionato){
    var az2 = selezionato.az, q2 = selezionato.alt;
    if(q2 > 90){ az2 = norm(az2 + 180); q2 = 180 - q2; }
    var r3 = (q2 >= 0 && q2 <= 90) ? R*(90 - q2)/90 : R;
    var a3 = az2*D2R;
    var px2 = cx + Math.sin(a3)*r3, py2 = cy - Math.cos(a3)*r3;
    x.beginPath(); x.arc(px2, py2, 7, 0, Math.PI*2);
    x.fillStyle = '#ffc85b'; x.fill();
    x.strokeStyle = '#05201c'; x.lineWidth = 2; x.stroke();
    x.font = '700 12px system-ui'; x.textAlign = 'left'; x.fillStyle = '#ffc85b';
    x.fillText(selezionato.nome, px2 + 11, py2 + 4);
  }
}
function quotaVisibile(az){
  var s = sagoma || sagomaPiena();
  var i = (Math.round(norm(az)/PASSO)*PASSO % 360)/PASSO;
  return s[i] || 0;
}
function dentroLaVisuale(az, alt){
  var azz = az, q = alt;
  if(q > 90){ azz = norm(az + 180); q = 180 - q; }
  if(q < 0) return false;
  return q <= quotaVisibile(azz);
}
function finestra(o, soglia){
  if(!o) return null;
  var giorno = dataScelta();
  var tratti = [], inizio = null, culmine = null, lunaMax = 0, lunaC2 = false;
  for(var m = 0; m <= 1440; m += 10){
    var d = new Date(giorno.getTime());
    d.setHours(0,0,0,0);
    d.setMinutes(m);
    var p = calcola(o, d);
    if(!culmine || p.alt > culmine.alt) culmine = { alt:p.alt, minuti:m };
    var ok = (p.alt >= soglia) && dentroLaVisuale(p.az, p.alt);
    if(ok){
      var luna = calcola({ nome:'Luna', corpo:'moon' }, d);
      if(luna.alt > 0){
        lunaC2 = true;
        var f = faseLunare(d);
        if(f.illum*100 > lunaMax) lunaMax = f.illum*100;
      }
    }
    if(ok && inizio === null) inizio = m;
    if(!ok && inizio !== null){ tratti.push([inizio, m]); inizio = null; }
  }
  if(inizio !== null) tratti.push([inizio, 1440]);
  if(tratti.length > 1 && tratti[tratti.length-1][1] === 1440 && tratti[0][0] <= 20){
    var ultimo = tratti.pop();
    tratti[0] = [ultimo[0] - 1440, tratti[0][1]];
  }
  return { tratti:tratti, culmine:culmine, lunaMax:lunaMax, lunaC2:lunaC2 };
}
function mostraPiano(){
  var host = $('planRiepilogo');
  if(!host) return;
  var soglia = parseInt($('planSoglia').value, 10);
  var lunaSoglia = parseInt($('planLuna').value, 10);
  if(!selezionato){
    host.innerHTML = '<div class="avviso">Scegli un oggetto nella ricerca o nell\u2019elenco: il pianificatore ti dice quando fotografarlo.</div>';
    return;
  }
  var f = finestra(selezionato, soglia);
  var riga = function(a, b){ return '<div class="riga"><span>' + a + '</span><strong>' + b + '</strong></div>'; };
  var html = '';
  if(f.culmine) html += riga('Massimo', f.culmine.alt.toFixed(1) + '\u00B0 alle ' + orario(f.culmine.minuti));
  if(!f.tratti.length){
    html += '<div class="avviso">' + selezionato.nome + ' non arriva a ' + soglia + '\u00B0 dentro la tua visuale in questa data.</div>';
  }
  for(var i = 0; i < f.tratti.length; i++){
    var t = f.tratti[i], durata = t[1] - t[0];
    var ore = Math.floor(durata/60), min = durata % 60;
    html += riga('Finestra ' + (i+1), 'da ' + orario(t[0]) + ' a ' + orario(t[1]));
    html += riga('Durata', ore + ' h ' + (min < 10 ? '0' : '') + min + ' min');
  }
  if(f.lunaC2 && f.lunaMax > lunaSoglia) html += '<div class="avviso">Luna sopra l\u2019orizzonte, illuminata fino al ' + Math.round(f.lunaMax) + '%: sopra la tua soglia del ' + lunaSoglia + '%.</div>';
  else if(f.lunaC2) html += riga('Luna', 'presente, fino al ' + Math.round(f.lunaMax) + '%');
  html += riga('Adesso', selezionato.alt.toFixed(1) + '\u00B0 ' + cardinale(selezionato.az) + ' - ' + (dentroLaVisuale(selezionato.az, selezionato.alt) ? 'dentro la visuale' : 'fuori'));
  host.innerHTML = html;
}

/* ===== scelta di un oggetto ===== */
function scegli(nome){
  var o = null;
  for(var i = 0; i < visibili.length; i++) if(visibili[i].nome === nome) o = visibili[i];
  if(!o) return;
  selezionato = o;
  var campo = $('objectSearch');
  if(campo) campo.value = nome;
  var box = $('suggestBox');
  if(box){ box.hidden = true; box.innerHTML = ''; }
  aggiornaPannelli();
  disegnaMappa();
  disegnaElenco();
  avviso(nome + ' - ' + o.alt.toFixed(1) + '\u00B0 ' + cardinale(o.az));
}
function aggiornaPannelli(){
  try { mostraScheda(); } catch(e){ console.warn('scheda', e); }
  try { mostraOrari(); } catch(e){ console.warn('orari', e); }
  try { disegnaCurva(); } catch(e){ console.warn('curva', e); }
  try { disegnaFase(); } catch(e){ console.warn('fase', e); }
  try { disegnaPianificatore(); } catch(e){ console.warn('pianificatore', e); }
  try { mostraPiano(); } catch(e){ console.warn('piano', e); }
}
function aggiorna(){
  var d = dataScelta();
  visibili = [];
  for(var i = 0; i < catalogo.length; i++) visibili.push(calcola(catalogo[i], d));
  if(!selezionato){
    for(var k = 0; k < visibili.length; k++) if(visibili[k].nome === 'Luna') selezionato = visibili[k];
  } else {
    var trovato = null;
    for(var j = 0; j < visibili.length; j++) if(visibili[j].nome === selezionato.nome) trovato = visibili[j];
    selezionato = trovato || visibili[0];
  }
  aggiornaPannelli();
  disegnaElenco();
  disegnaMappa();
}

/* ===== ricerca ===== */
function inputRicerca(){
  var campo = $('objectSearch');
  var testo = campo ? campo.value : '';
  disegnaElenco();
  if(attesaSuggerimenti) clearTimeout(attesaSuggerimenti);
  var completa = /^\s*(ngc|ic|m|messier|sh2)\s*\d{1,4}\s*$/i.test(testo);
  if(completa) mostraSuggerimenti(testo);
  else attesaSuggerimenti = setTimeout(function(){ mostraSuggerimenti(testo); }, 120);
}

/* ===== catalogo esterno ===== */
function leggiFile(file){
  if(!file) return;
  var stato = $('stato');
  if(stato) stato.textContent = 'Leggo ' + file.name + ' (' + (file.size/1048576).toFixed(2) + ' MB)...';
  var lettore = new FileReader();
  lettore.onload = function(){
    var testo = String(lettore.result);
    var linee = testo.split('\n');
    var sep = (testo.slice(0, 4000).split(';').length > testo.slice(0, 4000).split(',').length) ? ';' : ',';
    var intestazione = null, rigaInt = -1;
    for(var i = 0; i < Math.min(linee.length, 20); i++){
      var prova = linee[i].split(sep).map(function(h){ return h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''); });
      if(prova.indexOf('name') > -1 && prova.indexOf('ra') > -1 && prova.indexOf('dec') > -1){
        intestazione = prova; rigaInt = i; break;
      }
    }
    if(!intestazione){
      if(stato) stato.textContent = 'File non riconosciuto. Separatore provato: -' + sep + '-. Prima riga: ' + (linee[0] || '').slice(0, 90);
      avviso('File non riconosciuto');
      return;
    }
    var pos = function(nomi){
      for(var n = 0; n < nomi.length; n++){ var k = intestazione.indexOf(nomi[n]); if(k > -1) return k; }
      return -1;
    };
    var iNome = pos(['name']), iRa = pos(['ra']), iDec = pos(['dec']);
    var iM = pos(['m']), iTipo = pos(['type']), iCom = pos(['commonnames','commonname']);
    var aggiunti = 0;
    for(var riga = rigaInt + 1; riga < linee.length; riga++){
      var campi = linee[riga].split(sep);
      if(campi.length < 4) continue;
      var nome = (campi[iNome] || '').trim();
      if(!nome) continue;
      var p1 = String(campi[iRa] || '').trim().split(':');
      var p2 = String(campi[iDec] || '').trim().split(':');
      if(p1.length < 2 || p2.length < 2) continue;
      var ra = (+p1[0] + (+p1[1])/60 + (+(p1[2] || 0))/3600) * 15;
      var neg = String(campi[iDec] || '').trim().charAt(0) === '-';
      var d2 = String(campi[iDec] || '').trim().replace(/^[+-]/, '').split(':');
      var dec = +d2[0] + (+d2[1])/60 + (+(d2[2] || 0))/3600;
      if(neg) dec = 0 - dec;
      if(!isFinite(ra) || !isFinite(dec)) continue;
      var messier = iM > -1 ? (campi[iM] || '').trim() : '';
      catalogo.push({ nome:nome, tipo:'deep', genere:'Oggetto', colore:'#9f8cff',
        magnitudine: 11, ra:ra, dec:dec, comune: iCom > -1 ? (campi[iCom] || '').trim() : '',
        fonte:'catalogo esterno' });
      aggiunti++;
    }
    if(stato) stato.textContent = 'Aggiunti ' + aggiunti + ' oggetti da ' + file.name + '. Totale: ' + catalogo.length + '.';
    avviso(aggiunti + ' oggetti aggiunti');
    aggiorna();
  };
  lettore.readAsText(file, 'UTF-8');
}

/* ===== eventi ===== */
function collegaEventi(){
  var ricerca = $('objectSearch');
  if(ricerca) ricerca.oninput = inputRicerca;
  if(ricerca) ricerca.onkeydown = function(e){
    var box = $('suggestBox');
    if(!box || box.hidden) return;
    var righeBox = box.querySelectorAll('.suggest-row');
    if(!righeBox.length) return;
    if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      e.preventDefault();
      var idx = -1;
      for(var i = 0; i < righeBox.length; i++) if(righeBox[i].classList.contains('attivo')) idx = i;
      var pros = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
      if(pros < 0) pros = righeBox.length - 1;
      if(pros >= righeBox.length) pros = 0;
      for(var k = 0; k < righeBox.length; k++) righeBox[k].classList.remove('attivo');
      righeBox[pros].classList.add('attivo');
      return;
    }
    if(e.key === 'Escape'){ box.hidden = true; return; }
    if(e.key === 'Enter'){
      e.preventDefault();
      var attiva = box.querySelector('.suggest-row.attivo') || righeBox[0];
      if(attiva) scegli(attiva.getAttribute('data-nome'));
    }
  };
  var campoFile = $('catalogFile');
  if(campoFile) campoFile.onchange = function(e){
    var f = e.target.files && e.target.files[0];
    if(f) leggiFile(f);
    e.target.value = '';
  };
  var sopra = $('aboveOnly');
  if(sopra) sopra.onchange = disegnaElenco;
  var chips = document.querySelectorAll('.chip');
  for(var c = 0; c < chips.length; c++){
    chips[c].onclick = function(){
      for(var x = 0; x < chips.length; x++) chips[x].classList.remove('active');
      this.classList.add('active');
      filtro = this.getAttribute('data-filtro');
      disegnaElenco();
    };
  }
  var slider = $('timeSlider');
  if(slider) slider.oninput = function(){
    var m = parseInt(slider.value, 10);
    var h = Math.floor(m/60), mm = m % 60;
    $('time').value = (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
    aggiorna();
  };
  ['lat','lon','date','time'].forEach(function(id){
    var el = $(id);
    if(el) el.onchange = function(){
      posizione.lat = parseFloat($('lat').value);
      posizione.lon = parseFloat($('lon').value);
      aggiorna();
    };
  });
  var geo = $('geoBtn');
  if(geo) geo.onclick = function(){
    if(!navigator.geolocation){ avviso('Geolocalizzazione non supportata'); return; }
    navigator.geolocation.getCurrentPosition(function(p){
      posizione.lat = p.coords.latitude;
      posizione.lon = p.coords.longitude;
      posizione.luogo = 'la tua posizione';
      $('lat').value = p.coords.latitude.toFixed(6);
      $('lon').value = p.coords.longitude.toFixed(6);
      aggiorna();
      if(mappa) mappa.setView([posizione.lat, posizione.lon], 17);
    }, function(){ avviso('Posizione non disponibile'); });
  };
  var cerca = $('searchPlace');
  if(cerca) cerca.onclick = function(){
    var q = $('address').value.trim();
    if(!q) return;
    fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q),
      { headers:{ 'Accept-Language':'it' } })
      .then(function(rr){ return rr.json(); })
      .then(function(a){
        if(!a.length) throw new Error('nessun risultato');
        posizione.lat = parseFloat(a[0].lat);
        posizione.lon = parseFloat(a[0].lon);
        posizione.luogo = String(a[0].display_name || '').split(',')[0];
        $('lat').value = posizione.lat.toFixed(6);
        $('lon').value = posizione.lon.toFixed(6);
        aggiorna();
        if(mappa) mappa.setView([posizione.lat, posizione.lon], 16);
      })
      .catch(function(){ avviso('Localit\u00E0 non trovata'); });
  };
  var live = $('liveBtn');
  if(live) live.onclick = function(){ adesso(); aggiorna(); };
  var zin = $('zoomInBtn');
  if(zin) zin.onclick = function(){ if(mappa) mappa.zoomIn(); };
  var zout = $('zoomOutBtn');
  if(zout) zout.onclick = function(){ if(mappa) mappa.zoomOut(); };
  var cen = $('centraBtn');
  if(cen) cen.onclick = function(){ if(mappa) mappa.setView([posizione.lat, posizione.lon], 17); };
  /* pianificatore: disegno col mouse */
  var tela = $('planCanvas');
  if(tela){
    var punto = function(e){
      var b = tela.getBoundingClientRect();
      return { x:(e.clientX - b.left)*tela.width/b.width, y:(e.clientY - b.top)*tela.height/b.height };
    };
    var registra = function(e){
      var p = punto(e);
      var cx = tela.width/2, cy = tela.height/2, R = Math.min(tela.width, tela.height)*0.44;
      var dx = p.x - cx, dy = cy - p.y;
      var dist = Math.sqrt(dx*dx + dy*dy);
      var az = norm(Math.atan2(dx, dy) * R2D);
      var alt = 90 * (1 - dist/R);
      if(alt < 0) alt = Math.min(170, 180 + alt);
      if(!sagoma) sagoma = sagomaPiena();
      var passo = Math.max(0, Math.min(355, Math.round(az/PASSO)*PASSO));
      sagoma[passo/PASSO] = Math.max(0, Math.min(170, alt));
      disegnaPianificatore();
    };
    tela.addEventListener('pointerdown', function(e){ disegnando = true; if(tela.setPointerCapture) tela.setPointerCapture(e.pointerId); registra(e); });
    tela.addEventListener('pointermove', function(e){ if(disegnando) registra(e); });
    tela.addEventListener('pointerup', function(){ disegnando = false; mostraPiano(); });
    tela.addEventListener('pointerleave', function(){ disegnando = false; });
  }
  var pClear = $('planClearBtn');
  if(pClear) pClear.onclick = function(){ sagoma = sagomaLibera(); disegnaPianificatore(); mostraPiano(); avviso('Disegno cancellato'); };
  var pFree = $('planFreeBtn');
  if(pFree) pFree.onclick = function(){ sagoma = sagomaPiena(); disegnaPianificatore(); mostraPiano(); avviso('Orizzonte libero fino a 30 gradi'); };
  var pSave = $('planSaveBtn');
  if(pSave) pSave.onclick = function(){
    try { localStorage.setItem('astromappa-sagoma', JSON.stringify(sagoma)); avviso('Visuale salvata'); }
    catch(e){ avviso('Non riesco a salvare la visuale'); }
  };
  var pSog = $('planSoglia');
  if(pSog) pSog.oninput = function(){
    $('planSogliaVal').textContent = pSog.value + '\u00B0';
    mostraPiano();
  };
  var pLun = $('planLuna');
  if(pLun) pLun.oninput = function(){
    $('planLunaVal').textContent = pLun.value + '%';
    mostraPiano();
  };
  document.addEventListener('click', function(e){
    var box = $('suggestBox');
    var campo = $('objectSearch');
    if(!box || box.hidden) return;
    if(box.contains(e.target)) return;
    if(campo && (campo === e.target || campo.contains(e.target))) return;
    box.hidden = true;
  });
}
function adesso(){
  var d = new Date();
  var p = function(n){ return (n < 10 ? '0' : '') + n; };
  $('date').value = d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate());
  $('time').value = p(d.getHours()) + ':' + p(d.getMinutes());
  $('timeSlider').value = d.getHours()*60 + d.getMinutes();
}

/* ===== avvio ===== */
function avvia(){
  console.log('AstroMappa 5.0 avvio');
  try { adesso(); } catch(e){ console.warn('ora', e); }
  try {
    var salvata = localStorage.getItem('astromappa-sagoma');
    sagoma = salvata ? JSON.parse(salvata) : sagomaPiena();
  } catch(e){ sagoma = sagomaPiena(); }
  try {
    fetch('catalogo-messier.txt', { cache:'no-store' })
      .then(function(rr){ return rr.ok ? rr.text() : ''; })
      .then(function(t){ componiCatalogo(t); aggiorna(); })
      .catch(function(){ componiCatalogo(''); aggiorna(); });
  } catch(e){ componiCatalogo(''); }
  try { collegaEventi(); } catch(e){ console.warn('eventi', e); }
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js').catch(function(e){ console.warn('service worker', e); });
  }
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia);
else avvia();