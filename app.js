/* AstroMappa 3.0 — riscrittura completa del file app.js, da zero.
   Il file precedente era la stratificazione di molte versioni: sezioni duplicate,
   funzioni di versioni diverse, letture del catalogo ridondanti. Non era più
   verificabile. Questo file fa tutto quello che serve e niente di più.
   Le strutture dati sono dichiarate PRIMA delle funzioni che le usano. */

const D2R = Math.PI/180, R2D = 180/Math.PI;
let catalog = [];
let attesaSuggerimenti = null;

const COLORI = {
  'Galassia':'#ae9cff', 'Ammasso globulare':'#cab7ff', 'Ammasso aperto':'#8db8ff',
  'Nebulosa a emissione':'#ff9ad5', 'Nebulosa planetaria':'#82e2d0', 'Nebulosa a riflessione':'#9fd6ff',
  'Regione HII':'#ff9ad5', 'Ammasso con nebulosa':'#bcd0ff', 'Nebulosa oscura':'#7d7fa0',
  'Resto di supernova':'#ffb36b', 'Stella':'#d8eaff', 'Oggetto':'#9f8cff'
};

const CORPI = [
{nome:'Sole', tipo:'solar', genere:'Stella', colore:'#ffc85b', magnitudine:-26.74, corpo:'sun'},
{nome:'Luna', tipo:'solar', genere:'Satellite', colore:'#dbe7ff', magnitudine:-12.7, corpo:'moon'},
{nome:'Mercurio', tipo:'solar', genere:'Pianeta', colore:'#c7b7a3', magnitudine:-1, corpo:'mercury'},
{nome:'Venere', tipo:'solar', genere:'Pianeta', colore:'#ffe0a3', magnitudine:-4.2, corpo:'venus'},
{nome:'Marte', tipo:'solar', genere:'Pianeta', colore:'#ff806d', magnitudine:-1.5, corpo:'mars'},
{nome:'Giove', tipo:'solar', genere:'Pianeta', colore:'#ffd0a6', magnitudine:-2.4, corpo:'jupiter'},
{nome:'Saturno', tipo:'solar', genere:'Pianeta', colore:'#f3d38b', magnitudine:0.6, corpo:'saturn'},
{nome:'Urano', tipo:'solar', genere:'Pianeta', colore:'#9fe9e9', magnitudine:5.7, corpo:'uranus'},
{nome:'Nettuno', tipo:'solar', genere:'Pianeta', colore:'#7ca6ff', magnitudine:7.8, corpo:'neptune'},
{nome:'Sirio', tipo:'star', genere:'Stella', colore:'#d8eaff', magnitudine:-1.46, ra:101.2875, dec:-16.7161},
{nome:'Betelgeuse', tipo:'star', genere:'Stella', colore:'#ff9872', magnitudine:0.5, ra:88.7929, dec:7.4071},
{nome:'Vega', tipo:'star', genere:'Stella', colore:'#eaf4ff', magnitudine:0.03, ra:279.2347, dec:38.7837},
{nome:'Polare', tipo:'star', genere:'Stella', colore:'#fff6dc', magnitudine:1.98, ra:37.9546, dec:89.2641},
{nome:'Arturo', tipo:'star', genere:'Stella', colore:'#ffd09b', magnitudine:-0.05, ra:213.9153, dec:19.1824},
{nome:'Capella', tipo:'star', genere:'Stella', colore:'#fff0bd', magnitudine:0.08, ra:79.1723, dec:45.9979},
{nome:'Rigel', tipo:'star', genere:'Stella', colore:'#c9e1ff', magnitudine:0.13, ra:78.6345, dec:-8.2016},
{nome:'Procione', tipo:'star', genere:'Stella', colore:'#fff7e8', magnitudine:0.34, ra:114.8255, dec:5.225},
{nome:'Altair', tipo:'star', genere:'Stella', colore:'#eef6ff', magnitudine:0.77, ra:297.6958, dec:8.8683},
{nome:'Aldebaran', tipo:'star', genere:'Stella', colore:'#ffad78', magnitudine:0.85, ra:68.98, dec:16.5093},
{nome:'Spica', tipo:'star', genere:'Stella', colore:'#dfeaff', magnitudine:0.98, ra:201.2983, dec:-11.1613},
{nome:'Antares', tipo:'star', genere:'Stella', colore:'#ff755f', magnitudine:1.06, ra:247.3519, dec:-26.432},
{nome:'Deneb', tipo:'star', genere:'Stella', colore:'#e8f3ff', magnitudine:1.25, ra:310.358, dec:45.2803}
];

/* Messier completo + selezione NGC/IC: nome, tipo, RA, Dec, magnitudine, costellazione, nome comune, numero Messier */
const DEEP = [
['M1','Nebulosa planetaria',83.6331,22.0145,8.4,'Tau','Nebulosa Granchio','1'],
['M2','Ammasso globulare',323.3625,-0.8233,6.3,'Aqr','','2'],
['M3','Ammasso globulare',205.5484,28.3773,6.2,'CVn','','3'],
['M4','Ammasso globulare',245.8967,-26.5258,5.6,'Sco','','4'],
['M5','Ammasso globulare',229.6384,2.0810,5.6,'Ser','','5'],
['M6','Ammasso aperto',265.0833,-32.2500,4.2,'Sco','Ammasso Farfalla','6'],
['M7','Ammasso aperto',268.4583,-34.8167,3.3,'Sco','Ammasso Tolomeo','7'],
['M8','Nebulosa a emissione',270.9042,-24.3867,6.0,'Sgr','Nebulosa Laguna','8'],
['M9','Ammasso globulare',259.7992,-18.5161,7.7,'Oph','','9'],
['M10','Ammasso globulare',254.2875,-4.0992,6.6,'Oph','','10'],
['M11','Ammasso aperto',282.7662,-6.2700,5.8,'Sct','Ammasso Anitra','11'],
['M12','Ammasso globulare',251.8092,-1.9481,6.7,'Oph','','12'],
['M13','Ammasso globulare',250.4235,36.4613,5.8,'Her','Ammasso di Ercole','13'],
['M14','Ammasso globulare',264.4004,-3.2458,7.6,'Oph','','14'],
['M15','Ammasso globulare',322.4929,12.1670,6.2,'Peg','','15'],
['M16','Ammasso con nebulosa',274.7000,-13.7833,6.0,'Ser','Nebulosa Aquila','16'],
['M17','Nebulosa a emissione',275.1962,-16.1714,6.0,'Sgr','Nebulosa Omega','17'],
['M18','Ammasso aperto',276.1500,-17.1333,6.9,'Sgr','','18'],
['M19','Ammasso globulare',255.6571,-26.2679,6.8,'Oph','','19'],
['M20','Regione HII',270.6750,-22.9717,6.3,'Sgr','Nebulosa Trifida','20'],
['M21','Ammasso aperto',271.0583,-22.5000,6.5,'Sgr','','21'],
['M22','Ammasso globulare',279.0997,-23.9047,5.1,'Sgr','','22'],
['M23','Ammasso aperto',269.2083,-19.0167,5.5,'Sgr','','23'],
['M24','Ammasso aperto',274.2000,-18.5500,4.6,'Sgr','Nube del Sagittario','24'],
['M25','Ammasso aperto',277.9083,-19.2500,4.6,'Sgr','','25'],
['M26','Ammasso aperto',281.3250,-9.3833,8.0,'Sct','','26'],
['M27','Nebulosa planetaria',299.9017,22.7211,7.4,'Vul','Nebulosa Manubrio','27'],
['M28','Ammasso globulare',276.1371,-24.8698,6.8,'Sgr','','28'],
['M29','Ammasso aperto',305.9833,38.5167,7.1,'Cyg','','29'],
['M30','Ammasso globulare',325.0921,-23.1799,7.2,'Cap','','30'],
['M31','Galassia',10.6847,41.2692,3.4,'And','Galassia di Andromeda','31'],
['M32','Galassia',10.6743,40.8652,8.1,'And','','32'],
['M33','Galassia',23.4621,30.6602,5.7,'Tri','Galassia del Triangolo','33'],
['M34','Ammasso aperto',40.5250,42.7167,5.2,'Per','','34'],
['M35','Ammasso aperto',92.2750,24.3333,5.1,'Gem','','35'],
['M36','Ammasso aperto',84.0833,34.1333,6.0,'Aur','','36'],
['M37','Ammasso aperto',88.0750,32.5500,5.6,'Aur','','37'],
['M38','Ammasso aperto',82.1750,35.8500,6.4,'Aur','','38'],
['M39','Ammasso aperto',322.9250,48.4333,4.6,'Cyg','','39'],
['M41','Ammasso aperto',101.5000,-20.7500,4.5,'CMa','','41'],
['M42','Nebulosa a emissione',83.8221,-5.3911,4.0,'Ori','Grande nebulosa di Orione','42'],
['M43','Regione HII',83.8792,-5.2750,9.0,'Ori','Nebulosa De Mairan','43'],
['M44','Ammasso aperto',130.1000,19.6667,3.1,'Cnc','Ammasso Presepe','44'],
['M45','Ammasso aperto',56.7500,24.1167,1.6,'Tau','Pleiadi','45'],
['M46','Ammasso aperto',112.2250,-14.8167,6.1,'Pup','','46'],
['M47','Ammasso aperto',114.1500,-14.4833,4.4,'Pup','','47'],
['M48','Ammasso aperto',123.4250,-5.7500,5.5,'Hya','','48'],
['M49','Galassia',187.4449,8.0004,8.4,'Vir','','49'],
['M50','Ammasso aperto',105.6750,-8.3833,5.9,'Mon','','50'],
['M51','Galassia',202.4696,47.1952,8.4,'CVn','Galassia Vortice','51'],
['M52','Ammasso aperto',350.1750,61.5833,6.9,'Cas','','52'],
['M53','Ammasso globulare',198.2302,18.1681,7.7,'Com','','53'],
['M54','Ammasso globulare',283.7639,-30.4800,7.7,'Sgr','','54'],
['M55','Ammasso globulare',294.9987,-30.9647,6.3,'Sgr','','55'],
['M56','Ammasso globulare',289.1483,30.1833,8.3,'Lyr','','56'],
['M57','Nebulosa planetaria',283.3962,33.0292,8.8,'Lyr','Nebulosa Anello','57'],
['M58','Galassia',189.4312,11.8181,9.7,'Vir','','58'],
['M59','Galassia',190.5096,11.6469,9.6,'Vir','','59'],
['M60','Galassia',190.9167,11.5528,8.8,'Vir','','60'],
['M61','Galassia',185.4788,4.4736,9.7,'Vir','','61'],
['M62','Ammasso globulare',255.3025,-30.1121,6.5,'Oph','','62'],
['M63','Galassia',198.9555,42.0293,8.6,'CVn','Galassia Girasole','63'],
['M64','Galassia',194.1821,21.6827,8.5,'Com','Occhio Nero','64'],
['M65','Galassia',169.7332,13.0923,9.3,'Leo','','65'],
['M66','Galassia',170.0625,12.9915,8.9,'Leo','','66'],
['M67','Ammasso aperto',132.8500,11.8000,6.1,'Cnc','','67'],
['M68','Ammasso globulare',189.8671,-26.7437,7.8,'Hya','','68'],
['M69','Ammasso globulare',277.8464,-32.3481,7.6,'Sgr','','69'],
['M70','Ammasso globulare',280.8034,-32.2920,7.9,'Sgr','','70'],
['M71','Ammasso globulare',298.4439,18.7792,8.2,'Sge','','71'],
['M72','Ammasso globulare',313.3654,-12.5372,9.3,'Aqr','','72'],
['M73','Ammasso aperto',305.0000,-12.6333,9.0,'Aqr','','73'],
['M74','Galassia',24.1741,15.7837,9.4,'Psc','','74'],
['M75','Ammasso globulare',301.5201,-21.9221,8.5,'Sgr','','75'],
['M76','Nebulosa planetaria',25.5822,51.5753,10.1,'Per','Piccola Manubrio','76'],
['M77','Galassia',40.6697,-0.0133,8.9,'Cet','','77'],
['M78','Nebulosa a riflessione',86.6908,0.0792,8.3,'Ori','','78'],
['M79','Ammasso globulare',81.0441,-24.5242,7.7,'Lep','','79'],
['M80','Ammasso globulare',244.2600,-22.9756,7.3,'Sco','','80'],
['M81','Galassia',148.8882,69.0653,6.9,'UMa','Galassia di Bode','81'],
['M82','Galassia',148.9685,69.6797,8.4,'UMa','Galassia Sigaro','82'],
['M83','Galassia',204.2538,-29.8658,7.5,'Hya','Girandola del Sud','83'],
['M84','Galassia',186.2656,12.8870,9.1,'Vir','','84'],
['M85','Galassia',186.3502,18.1911,9.1,'Com','','85'],
['M86','Galassia',186.5492,12.9462,8.9,'Vir','','86'],
['M87','Galassia',187.7059,12.3911,8.6,'Vir','','87'],
['M88','Galassia',187.9966,14.4204,9.6,'Com','','88'],
['M89','Galassia',188.9158,12.5563,9.8,'Vir','','89'],
['M90','Galassia',189.2076,13.1629,9.5,'Vir','','90'],
['M91','Galassia',188.8601,14.4963,10.2,'Com','','91'],
['M92','Ammasso globulare',259.2809,43.1359,6.4,'Her','','92'],
['M93','Ammasso aperto',114.1500,-23.8667,6.2,'Pup','','93'],
['M94','Galassia',192.7210,41.1204,8.2,'CVn','','94'],
['M95','Galassia',160.9904,11.7037,9.7,'Leo','','95'],
['M96','Galassia',161.6920,11.8199,9.2,'Leo','','96'],
['M97','Nebulosa planetaria',168.6989,55.0190,9.9,'UMa','Nebulosa Gufo','97'],
['M98','Galassia',183.4513,14.9003,10.1,'Com','','98'],
['M99','Galassia',184.7066,14.4165,9.9,'Com','','99'],
['M100','Galassia',185.7286,15.8221,9.3,'Com','','100'],
['M101','Galassia',210.8022,54.3490,7.9,'UMa','Galassia Girandola','101'],
['M102','Galassia',226.6200,55.7633,9.9,'Dra','','102'],
['M103','Ammasso aperto',23.3417,60.6583,7.4,'Cas','','103'],
['M104','Galassia',189.9976,-11.6231,8.0,'Vir','Galassia Sombrero','104'],
['M105','Galassia',161.9566,12.5817,9.3,'Leo','','105'],
['M106','Galassia',184.7395,47.3037,8.4,'CVn','','106'],
['M107','Ammasso globulare',248.1326,-13.0537,7.9,'Oph','','107'],
['M108','Galassia',167.8791,55.6741,10.0,'UMa','','108'],
['M109','Galassia',179.3998,53.3747,9.8,'UMa','','109'],
['M110','Galassia',10.0919,41.6853,8.9,'And','','110'],
['NGC253','Galassia',11.8880,-25.2882,7.1,'Scl','Galassia dello Scultore',''],
['NGC281','Nebulosa a emissione',13.0567,56.6228,7.4,'Cas','Nebulosa Pacman',''],
['NGC869','Ammasso aperto',34.7417,57.1333,3.7,'Per','Ammasso Doppio h',''],
['NGC884','Ammasso aperto',35.5625,57.1417,3.8,'Per','Ammasso Doppio chi',''],
['NGC891','Galassia',35.6392,42.3492,9.9,'And','',''],
['NGC1023','Galassia',40.1000,39.0633,9.5,'Per','',''],
['NGC1499','Nebulosa a emissione',60.8000,36.3667,6.0,'Per','Nebulosa California',''],
['NGC2237','Nebulosa a emissione',97.9167,5.0500,6.0,'Mon','Nebulosa Rosetta',''],
['NGC2264','Ammasso con nebulosa',100.2417,9.8833,3.9,'Mon','Albero di Natale',''],
['NGC2403','Galassia',114.2138,65.6026,8.4,'Cam','',''],
['NGC4565','Galassia',189.0866,25.9876,9.6,'Com','Galassia Ago',''],
['NGC6543','Nebulosa planetaria',269.6392,66.6328,8.1,'Dra','Occhio di Gatto',''],
['NGC6822','Galassia',296.2342,-14.8032,8.8,'Sgr','Galassia di Barnard',''],
['NGC7000','Nebulosa a emissione',314.7500,44.3167,4.0,'Cyg','Nebulosa Nord America',''],
['NGC7293','Nebulosa planetaria',337.4108,-20.8372,7.3,'Aqr','Nebulosa Elica',''],
['NGC7331','Galassia',339.2671,34.4158,9.5,'Peg','',''],
['NGC7635','Regione HII',350.2042,61.2067,10.0,'Cas','Nebulosa Bolla',''],
['NGC7789','Ammasso aperto',359.0542,56.7333,6.7,'Cas','Rosa di Caroline',''],
['IC405','Nebulosa a emissione',79.0708,34.2733,6.0,'Aur','Stella Fiammeggiante',''],
['IC434','Nebulosa a emissione',85.2458,-2.4589,11.0,'Ori','Testa di Cavallo',''],
['IC1396','Nebulosa a emissione',324.5500,57.5000,3.5,'Cep','Proboscide di Elefante',''],
['IC1805','Nebulosa a emissione',38.1833,61.4500,6.5,'Cas','Nebulosa Cuore',''],
['IC1848','Nebulosa a emissione',42.7500,60.4000,6.5,'Cas','Nebulosa Anima',''],
['IC342','Galassia',56.7021,68.0961,9.1,'Cam','',''],
['IC5070','Nebulosa a emissione',312.7500,44.3667,3.5,'Cyg','Nebulosa Pellicano',''],
['IC5146','Nebulosa a emissione',328.4000,47.2667,7.2,'Cyg','Nebulosa Bozzolo','']
];

const state = {
  lat:41.902782, lon:12.496366, filter:'all', selected:null, positions:[],
  place:'Roma', nomeLuogo:'', segnoLuogo:null, deferred:null, map:null, mapMarker:null, mapRays:[], projectionLayer:null,
  showProjection:true, zoom:17
};

function $(s){ return document.querySelector(s); }
function $$(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }
function colorePerTipo(t){ return COLORI[t] || '#9f8cff'; }

function costruisciCatalogo(){
  catalog = [];
  CORPI.forEach(function(c){
    catalog.push({ name:c.nome, id:c.nome, messier:'', type:c.tipo, kind:c.genere,
      color:c.colore, mag:c.magnitudine, body:c.corpo, ra:c.ra, dec:c.dec, source:'calcolo locale' });
  });
  DEEP.forEach(function(r){
    const genere = r[1] || 'Oggetto';
    catalog.push({ name:r[0], id:r[0], messier:r[7] || '', type:'deep', kind:genere,
      color:colorePerTipo(genere), mag:r[4], ra:r[2], dec:r[3],
      constellation:r[5] || '', common:r[6] || '', source:'catalogo interno' });
  });
}

function norm(x){ return ((x % 360) + 360) % 360; }
function jd(d){ return d.getTime()/86400000 + 2440587.5; }
function gmst(d){ return norm(280.46061837 + 360.98564736629 * (jd(d) - 2451545)); }
function localDate(){
  const dv = $('#date').value, tv = $('#time').value || '00:00';
  return new Date(dv + 'T' + tv + ':00');
}
function sunRaDec(d){
  const n = jd(d) - 2451545;
  const L = norm(280.46 + 0.9856474*n);
  const g = norm(357.528 + 0.9856003*n) * D2R;
  const lam = (L + 1.915*Math.sin(g) + 0.02*Math.sin(2*g)) * D2R;
  const e = (23.439 - 0.0000004*n) * D2R;
  return { ra: norm(Math.atan2(Math.cos(e)*Math.sin(lam), Math.cos(lam)) * R2D),
           dec: Math.asin(Math.sin(e)*Math.sin(lam)) * R2D };
}
function moonRaDec(d){
  const n = jd(d) - 2451545;
  const L = norm(218.316 + 13.176396*n);
  const M = norm(134.963 + 13.064993*n) * D2R;
  const F = norm(93.272 + 13.22935*n) * D2R;
  const lon = (L + 6.289*Math.sin(M)) * D2R;
  const lat = 5.128*Math.sin(F) * D2R;
  const e = 23.439 * D2R;
  return { ra: norm(Math.atan2(Math.sin(lon)*Math.cos(e) - Math.tan(lat)*Math.sin(e), Math.cos(lon)) * R2D),
           dec: Math.asin(Math.sin(lat)*Math.cos(e) + Math.cos(lat)*Math.sin(e)*Math.sin(lon)) * R2D };
}
const ORBITE = {
  mercury:[252.3,4.09,7], venus:[181.9,1.602,3.4], mars:[355.4,0.524,1.85],
  jupiter:[34.4,0.0831,1.3], saturn:[50.1,0.0335,2.5], uranus:[314,0.0117,0.8], neptune:[304,0.006,0.7]
};
function planetApprox(name, d){
  const o = ORBITE[name], n = jd(d) - 2451545;
  const lon = norm(o[0] + o[1]*n);
  const lat = o[2]*Math.sin((lon*1.7 + o[0]) * D2R);
  const e = 23.439*D2R, l = lon*D2R, b = lat*D2R;
  return { ra: norm(Math.atan2(Math.sin(l)*Math.cos(e) - Math.tan(b)*Math.sin(e), Math.cos(l)) * R2D),
           dec: Math.asin(Math.sin(b)*Math.cos(e) + Math.cos(b)*Math.sin(e)*Math.sin(l)) * R2D };
}
function altAz(ra, dec, d){
  const H = norm(gmst(d) + state.lon - ra) * D2R;
  const ph = state.lat * D2R, de = dec * D2R;
  const alt = Math.asin(Math.sin(ph)*Math.sin(de) + Math.cos(ph)*Math.cos(de)*Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H)*Math.sin(ph) - Math.tan(de)*Math.cos(ph));
  return { alt: alt*R2D, az: norm(az*R2D + 180) };
}
function position(o, d){
  let eq;
  if(o.body === 'sun') eq = sunRaDec(d);
  else if(o.body === 'moon') eq = moonRaDec(d);
  else if(o.body) eq = planetApprox(o.body, d);
  else eq = { ra:o.ra, dec:o.dec };
  const aa = altAz(eq.ra, eq.dec, d);
  return Object.assign({}, o, eq, aa);
}

function initTime(){
  const d = new Date();
  const pad = function(n){ return String(n).padStart(2,'0'); };
  $('#date').value = d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate());
  $('#time').value = pad(d.getHours()) + ':' + pad(d.getMinutes());
  $('#timeSlider').value = d.getHours()*60 + d.getMinutes();
}
function compute(){
  state.lat = parseFloat($('#lat').value);
  state.lon = parseFloat($('#lon').value);
  const d = localDate();
  const prev = state.selected ? state.selected.name : null;
  state.positions = catalog.map(function(o){ return position(o, d); });
  state.selected = state.positions.find(function(x){ return x.name === prev; })
                || state.positions.find(function(x){ return x.name === 'Luna'; })
                || state.positions[0];
  drawAll(d);
}
function drawAll(d){
  const passi = [drawHeader, drawList, drawSky, drawDetails, drawPlanner, drawMap, disegnaInfogramma];
  for(let i=0; i<passi.length; i++){
    try { passi[i](d); }
    catch(e){ console.warn('passo non riuscito:', passi[i].name, e); }
  }
}
function drawHeader(d){
  const dd = d || localDate();
  const c = $('#clock'); if(c) c.textContent = dd.toLocaleString('it-IT',{dateStyle:'medium',timeStyle:'short'});
  const t = $('#skyTitle'); if(t) t.textContent = 'Cielo sopra ' + state.place;
  const m = $('#mapTitle'); if(m) m.textContent = 'Mappa sotto ' + state.place;
  const b = $('#mapState'); if(b) b.textContent = catalog.length + ' oggetti';
}
function filtered(){
  const q = ($('#objectSearch').value || '').toLowerCase();
  return state.positions.filter(function(o){
    if(state.filter !== 'all' && o.type !== state.filter) return false;
    if($('#aboveOnly').checked && o.alt <= 0) return false;
    return o.name.toLowerCase().indexOf(q) > -1 || (o.common || '').toLowerCase().indexOf(q) > -1;
  }).sort(function(a,b){ return b.alt - a.alt; });
}
function drawList(){
  const host = $('#objectList'); if(!host) return;
  const righe = filtered();
  if(!righe.length){ host.innerHTML = '<p class="muted">Nessun oggetto con questi filtri.</p>'; return; }
  host.innerHTML = righe.slice(0,400).map(function(o){
    const sel = (state.selected && state.selected.name === o.name) ? 'selected' : '';
    return '<div class="object-row ' + sel + '" data-name="' + String(o.name).replace(/"/g,'&quot;') + '">' +
      '<i class="dot" style="color:' + o.color + ';background:' + o.color + '"></i>' +
      '<div><strong>' + o.name + '</strong><small>' + o.kind + '</small></div>' +
      '<span class="alt">' + o.alt.toFixed(1) + '&deg;</span></div>';
  }).join('');
  $$('.object-row').forEach(function(el){
    el.onclick = function(){
      const f = state.positions.find(function(o){ return o.name === el.dataset.name; });
      if(f){ scegliOggetto(f.name, true); }
    };
  });
}
function drawSky(){
  /* La vista Cielo e' stata rimossa: questa funzione non disegna nulla. */
  const c = null; if(!c) return;
  const x = c.getContext('2d'), w = c.width, h = c.height;
  const cx = w/2, cy = h/2 + 10, R = Math.min(w,h)*0.42;
  x.clearRect(0,0,w,h);
  const g = x.createRadialGradient(cx,cy,20,cx,cy,R);
  g.addColorStop(0,'#172b51'); g.addColorStop(1,'#060b17');
  x.fillStyle = g; x.beginPath(); x.arc(cx,cy,R,0,Math.PI*2); x.fill();
  x.strokeStyle = '#33466a'; x.lineWidth = 2; x.stroke();
  x.font = 'bold 20px system-ui'; x.textAlign = 'center'; x.fillStyle = '#8fa1c5';
  const punti = [['N',0,-1],['E',1,0],['S',0,1],['O',-1,0]];
  for(let i=0; i<punti.length; i++){
    x.fillText(punti[i][0], cx + punti[i][1]*(R+25), cy + punti[i][2]*(R+7));
  }
  x.strokeStyle = 'rgba(100,130,175,.25)'; x.lineWidth = 1;
  [0.33,0.66].forEach(function(k){ x.beginPath(); x.arc(cx,cy,R*k,0,Math.PI*2); x.stroke(); });
  for(let a=0; a<360; a+=30){
    const q = a*D2R;
    x.beginPath(); x.moveTo(cx,cy); x.lineTo(cx + Math.sin(q)*R, cy - Math.cos(q)*R); x.stroke();
  }
  state.positions.filter(function(o){ return o.alt > 0; }).forEach(function(o){
    const rr = R*(90 - o.alt)/90, ang = o.az*D2R;
    const px = cx + Math.sin(ang)*rr, py = cy - Math.cos(ang)*rr;
    const size = (o.body === 'sun' || o.body === 'moon') ? 14 : Math.max(3, 10 - (o.mag || 9)*0.55);
    x.shadowColor = o.color; x.shadowBlur = (o.type === 'deep') ? 10 : 18;
    x.fillStyle = o.color; x.beginPath(); x.arc(px,py,size,0,Math.PI*2); x.fill();
    x.shadowBlur = 0;
    if(o === state.selected || size > 8){
      x.font = '600 14px system-ui'; x.fillStyle = '#edf4ff'; x.textAlign = 'left';
      x.fillText(o.name, px + size + 5, py + 5);
    }
    o._hit = { x:px, y:py, r: Math.max(12, size) };
  });
}
function cardinal(a){
  const nomi = ['Nord','Nord-est','Est','Sud-est','Sud','Sud-ovest','Ovest','Nord-ovest'];
  return nomi[Math.round(a/45) % 8];
}
function drawDetails(){
  const o = state.selected; if(!o) return;
  const host = $('#detailsContent'); if(!host) return;
  const q = o.alt > 45 ? 'Ottima' : o.alt > 20 ? 'Buona' : o.alt > 0 ? 'Bassa' : 'Non visibile';
  host.innerHTML =
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
      Math.max(0,o.alt).toFixed(0) + '&deg; sopra l&rsquo;orizzonte.' +
      (o.common ? ' Nome comune: ' + o.common + '.' : '') + '</p>' +
    '<button id="favBtn" class="button full">Aggiungi al piano</button>';
  const fb = $('#favBtn');
  if(fb) fb.onclick = function(){ toast(o.name + ' aggiunto al piano osservativo'); };
}
function drawPlanner(){
  const host = $('#plannerCards'); if(!host) return;
  const best = state.positions.filter(function(o){ return o.alt > 5 && o.name !== 'Sole'; })
    .sort(function(a,b){ return b.alt - a.alt; }).slice(0,6);
  if(!best.length){ host.innerHTML = '<p class="muted">Nessun obiettivo favorevole per questo momento.</p>'; return; }
  host.innerHTML = best.map(function(o){
    return '<article class="plan-card"><h3>' + o.name + '</h3>' +
      '<div class="score">' + Math.round(Math.min(99, o.alt + 25)) + '%</div>' +
      '<p class="muted">' + o.kind + ' &middot; ' + cardinal(o.az) + '</p>' +
      '<strong>' + o.alt.toFixed(1) + '&deg; sull&rsquo;orizzonte</strong></article>';
  }).join('');
}
function toast(m){
  const t = $('#toast'); if(!t) return;
  t.textContent = m; t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 2600);
}

function destinationPoint(lat, lon, bearing, km){
  const R = 6371, d = km/R, b = bearing*D2R;
  const p1 = lat*D2R, l1 = lon*D2R;
  const p2 = Math.asin(Math.sin(p1)*Math.cos(d) + Math.cos(p1)*Math.sin(d)*Math.cos(b));
  const l2 = l1 + Math.atan2(Math.sin(b)*Math.sin(d)*Math.cos(p1), Math.cos(d) - Math.sin(p1)*Math.sin(p2));
  return [p2*R2D, l2*R2D];
}
/* Disegna cerchio, osservatore, linee e punti. Non crea e non sposta la mappa. */
/* Ricalcola le posizioni e ridisegna solo cio che dipende dall\u2019ora.
   La mappa non viene ricreata e la vista non viene toccata: il cursore resta fluido. */
function aggiornaSoloTempo(){
  try{
    state.lat = parseFloat(document.getElementById('lat').value);
    state.lon = parseFloat(document.getElementById('lon').value);
    const d = localDate();
    const prima = state.selected ? state.selected.name : null;
    state.positions = catalog.map(function(o){ return position(o, d); });
    state.selected = state.positions.find(function(x){ return x.name === prima; })
                  || state.positions.find(function(x){ return x.name === 'Luna'; })
                  || state.positions[0];
    const centro = state.map ? state.map.getCenter() : null;
    const zoom = state.map ? state.map.getZoom() : null;
    try { disegnaLivelli(); } catch(e){ console.warn('livelli', e); }
    if(state.map && centro) state.map.setView(centro, zoom, { animate:false });
    try { disegnaInfogramma(); } catch(e){ console.warn('infogramma', e); }
    try { drawList(); } catch(e){ console.warn('elenco', e); }
    try { drawDetails(); } catch(e){ console.warn('scheda', e); }
    try { drawPlanner(); } catch(e){ console.warn('pianificatore', e); }
    try { drawHeader(d); } catch(e){ console.warn('intestazione', e); }
  }catch(e){ console.warn('aggiornaSoloTempo', e); }
}

function disegnaLivelli(){
  if(!state.map) return;
  if(state.mapMarker){ state.map.removeLayer(state.mapMarker); }
  state.mapMarker = L.circleMarker([state.lat, state.lon], {
    radius:7, color:'#05201c', weight:3, fillColor:'#58d6c1', fillOpacity:1
  }).addTo(state.map).bindTooltip('Osservatore');
  for(let i=0; i<state.mapRays.length; i++){ state.map.removeLayer(state.mapRays[i]); }
  state.mapRays = [];
  if(state.projectionLayer){ state.map.removeLayer(state.projectionLayer); }
  state.projectionLayer = L.layerGroup();
  const RADIO = 0.15;
  function anello(raggioKm, colore, tratteggio, spessore){
    const punti = [];
    for(let i=0; i<=96; i++){ punti.push(destinationPoint(state.lat, state.lon, i*360/96, raggioKm)); }
    return L.polygon(punti, { color:colore, weight:spessore || 1.4, opacity:0.75,
      fill:false, dashArray:tratteggio || null, interactive:false }).addTo(state.projectionLayer);
  }
  anello(RADIO, '#58d6c1', null, 2);
  anello(RADIO * 0.5, '#3d5a86', '4 6');
  anello(RADIO * 0.25, '#35507a', '3 7');
  L.marker([state.lat, state.lon], { interactive:false,
    icon: L.divIcon({ className:'zenith-tag', html:'zenit', iconSize:[46,18], iconAnchor:[23,9] })
  }).addTo(state.projectionLayer);
  L.marker(destinationPoint(state.lat, state.lon, 0, RADIO), { interactive:false,
    icon: L.divIcon({ className:'horizon-tag', html:'orizzonte 150 m', iconSize:[104,18], iconAnchor:[52,9] })
  }).addTo(state.projectionLayer);
  const pianeti = ['moon','mercury','venus','mars','jupiter','saturn','uranus','neptune'];
  const selezionato = state.selected;
  const mostrati = state.positions.filter(function(o){
    if(selezionato && o.name === selezionato.name) return true;
    if(o.alt <= 0) return false;
    if(o.name === 'Luna') return true;
    if(pianeti.indexOf(o.body) > -1) return true;
    return false;
  });
  for(let k=0; k<mostrati.length; k++){
    const o = mostrati[k];
    const isSel = state.selected && state.selected.name === o.name;
    const frazione = (o.alt <= 0) ? 1 : (1 - o.alt/90);
    const fine = destinationPoint(state.lat, state.lon, o.az, Math.max(RADIO * frazione, 0.004));
    const linea = L.polyline([[state.lat, state.lon], fine], {
      color: isSel ? '#ffc85b' : o.color, weight: isSel ? 3.5 : 2, opacity: isSel ? 0.95 : 0.75
    }).addTo(state.map);
    linea.bindTooltip(o.name + ' \u00B7 azimut ' + o.az.toFixed(0) + '\u00B0 \u00B7 ' +
      o.alt.toFixed(0) + '\u00B0 di altezza', { className:'astro-tip' });
    const nome = o.name;
    linea.on('click', function(){ scegliOggetto(nome, false); });
    state.mapRays.push(linea);
    const punto = L.circleMarker(fine, { radius: isSel ? 8 : 5, color:'#05201c', weight:2,
      fillColor: isSel ? '#ffc85b' : o.color, fillOpacity:1 }).addTo(state.map);
    state.mapRays.push(punto);
    const versoNord = (o.az > 270 || o.az < 90);
    const etichetta = L.marker(fine, { interactive:false,
      icon: L.divIcon({ className:'object-label' + (isSel ? ' is-selected' : ''),
        html:'<span style="color:' + (isSel ? '#ffc85b' : o.color) + '">' + o.name + '</span>',
        iconSize:[0,0], iconAnchor:[versoNord ? -12 : 12, 8] }) }).addTo(state.map);
    state.mapRays.push(etichetta);
  }
  if(state.showProjection) state.projectionLayer.addTo(state.map);
}

function drawMap(){
  const host = document.getElementById('cityMap');
  if(!host) return;
  if(typeof L === 'undefined'){
    host.innerHTML = '<p class="muted" style="padding:20px">La mappa richiede una connessione al primo caricamento.</p>';
    return;
  }
  /* La mappa viene creata una sola volta. Non la ricreo mai: e\u2019 questa
     la ragione per cui lo scorrimento delle ore resta fluido. */
  if(!state.map){
    state.map = L.map(host, { zoomControl:false, scrollWheelZoom:true, inertia:true })
      .setView([state.lat, state.lon], state.zoom || 17);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(state.map);
    /* Un clic sulla mappa sposta l\u2019osservatore, senza toccare la vista. */
    state.map.on('click', function(e){
      document.getElementById('lat').value = e.latlng.lat.toFixed(6);
      document.getElementById('lon').value = e.latlng.lng.toFixed(6);
      state.place = 'punto selezionato';
      state.nomeLuogo = 'punto selezionato';
      aggiornaSoloTempo();
    });
  }
  disegnaLivelli();
}

/* ---------- infogramma: altezza dell oggetto durante la giornata ---------- */
function curvaDelGiorno(o, giorno){
  var punti = [];
  for(var m = 0; m <= 1440; m += 10){
    var d = new Date(giorno.getTime());
    d.setHours(0, 0, 0, 0);
    d.setMinutes(m);
    var p = position(o, d);
    punti.push({ minuti: m, alt: p.alt });
  }
  var sorgere = null, tramonto = null, culminazione = null;
  for(var i = 1; i < punti.length; i++){
    if(!sorgere && punti[i-1].alt <= 0 && punti[i].alt > 0) sorgere = punti[i];
    if(!tramonto && sorgere && punti[i-1].alt > 0 && punti[i].alt <= 0) tramonto = punti[i];
  }
  for(var j = 0; j < punti.length; j++){
    if(!culminazione || punti[j].alt > culminazione.alt) culminazione = punti[j];
  }
  return { punti: punti, sorgere: sorgere, culminazione: culminazione, tramonto: tramonto };
}
function orarioDaMinuti(minuti){
  var h = Math.floor(minuti / 60), m = Math.round(minuti % 60);
  return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
}
function disegnaInfogramma(){
  var tela = document.getElementById("infoCanvas");
  if(!tela) return;
  var x = tela.getContext("2d"), w = tela.width, h = tela.height;
  x.clearRect(0, 0, w, h);
  x.fillStyle = "#080f20";
  x.fillRect(0, 0, w, h);
  var o = state.selected;
  if(!o) return;
  var curva = curvaDelGiorno(o, localDate());
  var sin = 46, des = 16, alto = 16, basso = 34;
  var larghezza = w - sin - des, altezza = h - alto - basso;
  var minY = -30, maxY = 90;
  function yDaAlt(a){ return alto + altezza * (maxY - a) / (maxY - minY); }
  function xDaMinuti(m){ return sin + larghezza * m / 1440; }
  var gradini = [90, 60, 30, 0, -30];
  x.font = "11px system-ui";
  x.textAlign = "right";
  for(var g = 0; g < gradini.length; g++){
    var grado = gradini[g], y = yDaAlt(grado);
    x.strokeStyle = (grado === 0) ? "rgba(88,214,193,.55)" : "rgba(100,130,175,.18)";
    x.lineWidth = (grado === 0) ? 1.6 : 1;
    x.beginPath(); x.moveTo(sin, y); x.lineTo(sin + larghezza, y); x.stroke();
    x.fillStyle = (grado === 0) ? "#58d6c1" : "#7c8dae";
    x.fillText(grado + "\u00B0", sin - 6, y + 4);
  }
  x.textAlign = "center";
  x.fillStyle = "#7c8dae";
  for(var ora = 0; ora <= 24; ora += 6){
    var px = xDaMinuti(ora * 60);
    x.strokeStyle = "rgba(100,130,175,.16)";
    x.beginPath(); x.moveTo(px, alto); x.lineTo(px, alto + altezza); x.stroke();
    x.fillText((ora < 10 ? "0" : "") + ora + ":00", px, h - 12);
  }
  x.beginPath();
  x.moveTo(xDaMinuti(0), yDaAlt(0));
  for(var a = 0; a < curva.punti.length; a++){
    x.lineTo(xDaMinuti(curva.punti[a].minuti), yDaAlt(Math.max(0, curva.punti[a].alt)));
  }
  x.lineTo(xDaMinuti(1440), yDaAlt(0));
  x.closePath();
  var sfumatura = x.createLinearGradient(0, alto, 0, alto + altezza);
  sfumatura.addColorStop(0, "rgba(88,214,193,.30)");
  sfumatura.addColorStop(1, "rgba(88,214,193,.02)");
  x.fillStyle = sfumatura;
  x.fill();
  x.beginPath();
  for(var b = 0; b < curva.punti.length; b++){
    var q = curva.punti[b];
    var qx = xDaMinuti(q.minuti), qy = yDaAlt(q.alt);
    if(b === 0) x.moveTo(qx, qy); else x.lineTo(qx, qy);
  }
  x.strokeStyle = "#ffc85b";
  x.lineWidth = 2.4;
  x.stroke();
  function segno(p, colore, testo){
    if(!p) return;
    var sx = xDaMinuti(p.minuti), sy = yDaAlt(p.alt);
    x.beginPath(); x.arc(sx, sy, 4.5, 0, Math.PI * 2);
    x.fillStyle = colore; x.fill();
    x.strokeStyle = "#05201c"; x.lineWidth = 1.6; x.stroke();
    x.font = "700 10px system-ui"; x.textAlign = "center"; x.fillStyle = colore;
    x.fillText(testo, sx, sy - 10);
  }
  segno(curva.sorgere, "#8db8ff", "sorge");
  segno(curva.culminazione, "#58d6c1", "culmina");
  segno(curva.tramonto, "#ff9f6b", "tramonta");
  var adesso = localDate();
  var minutiOra = adesso.getHours() * 60 + adesso.getMinutes();
  var pxOra = xDaMinuti(minutiOra);
  x.strokeStyle = "rgba(255,255,255,.5)";
  x.setLineDash([4, 4]);
  x.beginPath(); x.moveTo(pxOra, alto); x.lineTo(pxOra, alto + altezza); x.stroke();
  x.setLineDash([]);
  var nome = document.getElementById("infoNome");
  if(nome) nome.textContent = o.name;
  var riepilogo = document.getElementById("infoOrari");
  if(riepilogo){
    function riga(etichetta, valore){
      return "<div class=\"info-riga\"><span>" + etichetta + "</span><strong>" + valore + "</strong></div>";
    }
    var sorge = curva.sorgere ? (orarioDaMinuti(curva.sorgere.minuti) + " \u00B7 0\u00B0") : "non sorge";
    var culm = curva.culminazione ? (orarioDaMinuti(curva.culminazione.minuti) + " \u00B7 " + curva.culminazione.alt.toFixed(1) + "\u00B0") : "\u2014";
    var tram = curva.tramonto ? (orarioDaMinuti(curva.tramonto.minuti) + " \u00B7 0\u00B0") : "non tramonta";
    var oraAdesso = orarioDaMinuti(minutiOra) + " \u00B7 " + o.alt.toFixed(1) + "\u00B0";
    riepilogo.innerHTML = riga("Sorge", sorge) + riga("Culmina", culm) + riga("Tramonta", tram) + riga("Adesso", oraAdesso);
  }
}

function chiave(s){ return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function suggerisci(testo, limite){
  limite = limite || 12;
  const q = String(testo || '').trim();
  if(q.length < 2) return [];
  const qc = chiave(q);
  const trovato = q.toLowerCase().match(/^\s*(ngc|ic|m|messier)\s*(\d{1,4})\s*$/);
  let sigla = null, numero = null;
  if(trovato){
    sigla = (trovato[1] === 'messier') ? 'm' : trovato[1];
    numero = trovato[2];
  }
  const risultati = [];
  state.positions.forEach(function(o){
    const nomeN = chiave(o.name), idN = chiave(o.id || '');
    let p = 0;
    if(sigla && numero){
      const conSigla = new RegExp('^' + sigla + numero, 'i');
      const soloNum = new RegExp('^' + numero, 'i');
      if(conSigla.test(nomeN) || conSigla.test(idN)) p = 100;
      else if(sigla === 'm' && o.messier && soloNum.test(String(o.messier))) p = 100;
      else if(soloNum.test(nomeN.replace(/^[a-z]+/, ''))) p = 70;
    } else {
      if(nomeN.indexOf(qc) === 0) p = 90;
      else if(idN.indexOf(qc) === 0) p = 85;
      else if(nomeN.indexOf(qc) > -1) p = 60;
      else if(chiave(o.common).indexOf(qc) === 0) p = 55;
    }
    if(!p) return;
    const mag = (typeof o.mag === 'number' && isFinite(o.mag)) ? o.mag : 9;
    p += Math.max(0, 12 - mag);
    if(o.alt > 0) p += 6;
    risultati.push({ o:o, p:p });
  });
  risultati.sort(function(a,b){ return b.p - a.p; });
  return risultati.slice(0, limite).map(function(x){ return x.o; });
}
function mostraSuggerimenti(testo){
  const box = document.getElementById('suggestBox');
  if(!box) return;
  const lista = suggerisci(testo, 12);
  if(!lista.length){ box.hidden = true; box.innerHTML = ''; return; }
  box.innerHTML = lista.map(function(o){
    const stato = o.alt > 0 ? 'sopra l\u2019orizzonte' : 'sotto l\u2019orizzonte';
    return '<div class="suggest-row" data-name="' + String(o.name).replace(/"/g,'&quot;') + '">' +
      '<i style="background:' + o.color + '"></i>' +
      '<span>' + o.name + '</span>' +
      '<em>' + o.kind + ' \u00B7 ' + stato + ' \u00B7 ' + o.alt.toFixed(0) + '\u00B0</em></div>';
  }).join('');
  box.hidden = false;
  $$('.suggest-row').forEach(function(riga){
    riga.onmousedown = function(e){
      e.preventDefault();
      scegliSuggerimento(this.getAttribute('data-name'));
    };
  });
}
/* Sceglie un oggetto ovunque venga selezionato: elenco, suggerimenti, cielo o mappa.
   Ridisegna tutto e porta la mappa sull'oggetto, aprendo la scheda Mappa. */
function scegliOggetto(nome, apriMappa){
  const o = state.positions.find(function(x){ return x.name === nome; });
  if(!o) return null;
  state.selected = o;
  const campo = document.getElementById('objectSearch');
  if(campo) campo.value = nome;
  const box = document.getElementById('suggestBox');
  if(box){ box.hidden = true; box.innerHTML = ''; }
  drawAll(localDate());
  if(apriMappa !== false){
    const tab = document.querySelector('.tab[data-view=\'map\']');
    if(tab) tab.click();
  }
  const posizione = o.alt > 0
    ? (o.alt.toFixed(1) + '\u00B0 sull\u2019orizzonte')
    : ('sotto l\u2019orizzonte, ' + o.alt.toFixed(1) + '\u00B0');
  toast(nome + ' \u00B7 ' + posizione);
  return o;
}
function scegliSuggerimento(nome){ scegliOggetto(nome, true); }
function inputRicerca(){
  const campo = document.getElementById('objectSearch');
  const testo = campo ? campo.value : '';
  drawList();
  if(attesaSuggerimenti) clearTimeout(attesaSuggerimenti);
  attesaSuggerimenti = setTimeout(function(){ mostraSuggerimenti(testo); }, 120);
}

function leggiFileCatalogo(file){
  if(!file) return;
  const info = document.getElementById('catalogStatus');
  if(info) info.textContent = 'Leggo ' + file.name + '...';
  const reader = new FileReader();
  reader.onload = function(){
    try{
      const testo = String(reader.result);
      const righe = testo.split(/\r?\n/);
      let aggiunti = 0;
      righe.forEach(function(r){
        const p = r.trim().split('|');
        if(p.length < 4) return;
        const ra = parseFloat(p[2]), dec = parseFloat(p[3]);
        if(!isFinite(ra) || !isFinite(dec)) return;
        const genere = p[1] || 'Oggetto';
        const mag = parseFloat(p[4]);
        catalog.push({ name:p[0], id:p[0], messier:p[7] || '', type:'deep', kind:genere,
          color:colorePerTipo(genere), mag:isFinite(mag) ? mag : 9, ra:ra, dec:dec,
          constellation:p[5] || '', common:p[6] || '', source:'file locale' });
        aggiunti++;
      });
      if(info) info.textContent = 'Aggiunti ' + aggiunti + ' oggetti da ' + file.name +
        '. Totale: ' + catalog.length + '.';
      toast(aggiunti + ' oggetti aggiunti');
      compute();
    }catch(e){
      if(info) info.textContent = 'File non riconosciuto: ' + e.message;
      toast('File non riconosciuto');
    }
  };
  reader.readAsText(file, 'UTF-8');
}

/* Porta la mappa su un punto e, se necessario, la disegna per la prima volta. */
function centraMappa(lat, lon, zoom){
  try{
    if(!state.map){
      /* la mappa non esiste ancora: la disegno, poi la centro */
      drawMap();
    }
    if(state.map){
      state.map.invalidateSize();
      state.map.setView([lat, lon], zoom || 16);
      /* contrassegno del luogo cercato */
      if(state.segnoLuogo){ state.map.removeLayer(state.segnoLuogo); }
      const nome = state.nomeLuogo || state.place || 'luogo';
      state.segnoLuogo = L.marker([lat, lon], {
        icon: L.divIcon({ className:'luogo-tag', html:nome, iconSize:[0,0], iconAnchor:[0,26] })
      }).addTo(state.map);
    }
  }catch(e){ console.warn('centratura mappa', e); }
}
/* Apre la scheda della mappa, cosi\u2019 il risultato \u00e8 visibile subito. */
function mostraSchedaMappa(){
  try{
    const tab = document.querySelector('.tab[data-view=\'map\']');
    if(tab) tab.click();
  }catch(e){ console.warn('scheda mappa', e); }
}
function geocode(){
  const q = $('#address').value.trim();
  if(!q) return;
  toast('Cerco l\u2019indirizzo...');
  fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(q),
        { headers:{ 'Accept-Language':'it' } })
    .then(function(r){ return r.json(); })
    .then(function(a){
      if(!a.length) throw new Error('nessun risultato');
      const lat = parseFloat(a[0].lat), lon = parseFloat(a[0].lon);
      $('#lat').value = lat.toFixed(6);
      $('#lon').value = lon.toFixed(6);
      state.place = String(a[0].display_name || '').split(',')[0] || q;
      state.nomeLuogo = String(a[0].display_name || q);
      compute();
      centraMappa(lat, lon, 16);
      mostraSchedaMappa();
      toast(state.place + ' \u00B7 mappa aggiornata');
    })
    .catch(function(){ toast('Localit\u00E0 non trovata: prova con pi\u00F9 dettagli'); });
}
function useMyPosition(){
  if(!navigator.geolocation){ toast('Geolocalizzazione non supportata'); return; }
  navigator.geolocation.getCurrentPosition(function(p){
    const lat = p.coords.latitude, lon = p.coords.longitude;
    $('#lat').value = lat.toFixed(6);
    $('#lon').value = lon.toFixed(6);
    state.place = 'la tua posizione';
    state.nomeLuogo = 'la tua posizione';
    compute();
    centraMappa(lat, lon, 16);
    mostraSchedaMappa();
  }, function(){ toast('Posizione non disponibile'); });
}

function collegaEventi(){
  const geo = document.getElementById('geoBtn');
  if(geo) geo.onclick = useMyPosition;
  const cerca = document.getElementById('searchPlace');
  if(cerca) cerca.onclick = geocode;
  const indirizzo = document.getElementById('address');
  if(indirizzo) indirizzo.onkeydown = function(e){ if(e.key === 'Enter') geocode(); };

  ['lat','lon','date','time'].forEach(function(id){
    const el = document.getElementById(id);
    if(el) el.onchange = compute;
  });
  const slider = document.getElementById('timeSlider');
  if(slider){
    let sospeso = null;
    const muovi = function(valore){
      const m = parseInt(valore, 10);
      const t = document.getElementById('time');
      if(t) t.value = String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0');
      /* nessuna attesa: il calcolo e il disegno sono brevi, il cursore non si blocca */
      aggiornaSoloTempo();
    };
    slider.oninput = function(e){ muovi(e.target.value); };
    slider.onchange = function(e){ muovi(e.target.value); };
  }
}

function avvia(){
  try { costruisciCatalogo(); } catch(e){ console.warn('catalogo', e); }
  console.log('catalogo pronto:', catalog.length, 'oggetti');
  try { initTime(); } catch(e){ console.warn('initTime', e); }
  try { collegaEventi(); } catch(e){ console.warn('eventi', e); }
  try { compute(); } catch(e){ console.warn('calcolo', e); }
}
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', avvia);
} else {
  avvia();
}
