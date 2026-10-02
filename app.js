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
["M1","Nebulosa planetaria",83.6331,22.0145,8.4,"Tau","Nebulosa Granchio","1"],
["M2","Ammasso globulare",323.3625,-0.8233,6.3,"Aqr","","2"],
["M3","Ammasso globulare",205.5484,28.3773,6.2,"CVn","","3"],
["M4","Ammasso globulare",245.8967,-26.5258,5.6,"Sco","","4"],
["M5","Ammasso globulare",229.6384,2.0810,5.6,"Ser","","5"],
["M6","Ammasso aperto",265.0833,-32.2500,4.2,"Sco","Ammasso Farfalla","6"],
["M7","Ammasso aperto",268.4583,-34.8167,3.3,"Sco","Ammasso Tolomeo","7"],
["M8","Nebulosa a emissione",270.9042,-24.3867,6.0,"Sgr","Nebulosa Laguna","8"],
["M9","Ammasso globulare",259.7992,-18.5161,7.7,"Oph","","9"],
["M10","Ammasso globulare",254.2875,-4.0992,6.6,"Oph","","10"],
["M11","Ammasso aperto",282.7662,-6.2700,5.8,"Sct","Ammasso Anitra","11"],
["M12","Ammasso globulare",251.8092,-1.9481,6.7,"Oph","","12"],
["M13","Ammasso globulare",250.4235,36.4613,5.8,"Her","Ammasso di Ercole","13"],
["M14","Ammasso globulare",264.4004,-3.2458,7.6,"Oph","","14"],
["M15","Ammasso globulare",322.4929,12.1670,6.2,"Peg","","15"],
["M16","Ammasso con nebulosa",274.7000,-13.7833,6.0,"Ser","Nebulosa Aquila","16"],
["M17","Nebulosa a emissione",275.1962,-16.1714,6.0,"Sgr","Nebulosa Omega","17"],
["M18","Ammasso aperto",276.1500,-17.1333,6.9,"Sgr","","18"],
["M19","Ammasso globulare",255.6571,-26.2679,6.8,"Oph","","19"],
["M20","Regione HII",270.6750,-22.9717,6.3,"Sgr","Nebulosa Trifida","20"],
["M21","Ammasso aperto",271.0583,-22.5000,6.5,"Sgr","","21"],
["M22","Ammasso globulare",279.0997,-23.9047,5.1,"Sgr","","22"],
["M23","Ammasso aperto",269.2083,-19.0167,5.5,"Sgr","","23"],
["M24","Ammasso aperto",274.2000,-18.5500,4.6,"Sgr","Nube del Sagittario","24"],
["M25","Ammasso aperto",277.9083,-19.2500,4.6,"Sgr","","25"],
["M26","Ammasso aperto",281.3250,-9.3833,8.0,"Sct","","26"],
["M27","Nebulosa planetaria",299.9017,22.7211,7.4,"Vul","Nebulosa Manubrio","27"],
["M28","Ammasso globulare",276.1371,-24.8698,6.8,"Sgr","","28"],
["M29","Ammasso aperto",305.9833,38.5167,7.1,"Cyg","","29"],
["M30","Ammasso globulare",325.0921,-23.1799,7.2,"Cap","","30"],
["M31","Galassia",10.6847,41.2692,3.4,"And","Galassia di Andromeda","31"],
["M32","Galassia",10.6743,40.8652,8.1,"And","","32"],
["M33","Galassia",23.4621,30.6602,5.7,"Tri","Galassia del Triangolo","33"],
["M34","Ammasso aperto",40.5250,42.7167,5.2,"Per","","34"],
["M35","Ammasso aperto",92.2750,24.3333,5.1,"Gem","","35"],
["M36","Ammasso aperto",84.0833,34.1333,6.0,"Aur","","36"],
["M37","Ammasso aperto",88.0750,32.5500,5.6,"Aur","","37"],
["M38","Ammasso aperto",82.1750,35.8500,6.4,"Aur","","38"],
["M39","Ammasso aperto",322.9250,48.4333,4.6,"Cyg","","39"],
["M40","Stella doppia",185.5500,58.1833,8.4,"UMa","","40"],
["M41","Ammasso aperto",101.5000,-20.7500,4.5,"CMa","","41"],
["M42","Nebulosa a emissione",83.8221,-5.3911,4.0,"Ori","Grande nebulosa di Orione","42"],
["M43","Regione HII",83.8792,-5.2750,9.0,"Ori","Nebulosa De Mairan","43"],
["M44","Ammasso aperto",130.1000,19.6667,3.1,"Cnc","Ammasso Presepe","44"],
["M45","Ammasso aperto",56.7500,24.1167,1.6,"Tau","Pleiadi","45"],
["M46","Ammasso aperto",112.2250,-14.8167,6.1,"Pup","","46"],
["M47","Ammasso aperto",114.1500,-14.4833,4.4,"Pup","","47"],
["M48","Ammasso aperto",123.4250,-5.7500,5.5,"Hya","","48"],
["M49","Galassia",187.4449,8.0004,8.4,"Vir","","49"],
["M50","Ammasso aperto",105.6750,-8.3833,5.9,"Mon","","50"],
["M51","Galassia",202.4696,47.1952,8.4,"CVn","Galassia Vortice","51"],
["M52","Ammasso aperto",350.1750,61.5833,6.9,"Cas","","52"],
["M53","Ammasso globulare",198.2302,18.1681,7.7,"Com","","53"],
["M54","Ammasso globulare",283.7639,-30.4800,7.7,"Sgr","","54"],
["M55","Ammasso globulare",294.9987,-30.9647,6.3,"Sgr","","55"],
["M56","Ammasso globulare",289.1483,30.1833,8.3,"Lyr","","56"],
["M57","Nebulosa planetaria",283.3962,33.0292,8.8,"Lyr","Nebulosa Anello","57"],
["M58","Galassia",189.4312,11.8181,9.7,"Vir","","58"],
["M59","Galassia",190.5096,11.6469,9.6,"Vir","","59"],
["M60","Galassia",190.9167,11.5528,8.8,"Vir","","60"],
["M61","Galassia",185.4788,4.4736,9.7,"Vir","","61"],
["M62","Ammasso globulare",255.3025,-30.1121,6.5,"Oph","","62"],
["M63","Galassia",198.9555,42.0293,8.6,"CVn","Galassia Girasole","63"],
["M64","Galassia",194.1821,21.6827,8.5,"Com","Occhio Nero","64"],
["M65","Galassia",169.7332,13.0923,9.3,"Leo","","65"],
["M66","Galassia",170.0625,12.9915,8.9,"Leo","","66"],
["M67","Ammasso aperto",132.8500,11.8000,6.1,"Cnc","","67"],
["M68","Ammasso globulare",189.8671,-26.7437,7.8,"Hya","","68"],
["M69","Ammasso globulare",277.8464,-32.3481,7.6,"Sgr","","69"],
["M70","Ammasso globulare",280.8034,-32.2920,7.9,"Sgr","","70"],
["M71","Ammasso globulare",298.4439,18.7792,8.2,"Sge","","71"],
["M72","Ammasso globulare",313.3654,-12.5372,9.3,"Aqr","","72"],
["M73","Ammasso aperto",305.0000,-12.6333,9.0,"Aqr","","73"],
["M74","Galassia",24.1741,15.7837,9.4,"Psc","","74"],
["M75","Ammasso globulare",301.5201,-21.9221,8.5,"Sgr","","75"],
["M76","Nebulosa planetaria",25.5822,51.5753,10.1,"Per","Piccola Manubrio","76"],
["M77","Galassia",40.6697,-0.0133,8.9,"Cet","","77"],
["M78","Nebulosa a riflessione",86.6908,0.0792,8.3,"Ori","","78"],
["M79","Ammasso globulare",81.0441,-24.5242,7.7,"Lep","","79"],
["M80","Ammasso globulare",244.2600,-22.9756,7.3,"Sco","","80"],
["M81","Galassia",148.8882,69.0653,6.9,"UMa","Galassia di Bode","81"],
["M82","Galassia",148.9685,69.6797,8.4,"UMa","Galassia Sigaro","82"],
["M83","Galassia",204.2538,-29.8658,7.5,"Hya","Girandola del Sud","83"],
["M84","Galassia",186.2656,12.8870,9.1,"Vir","","84"],
["M85","Galassia",186.3502,18.1911,9.1,"Com","","85"],
["M86","Galassia",186.5492,12.9462,8.9,"Vir","","86"],
["M87","Galassia",187.7059,12.3911,8.6,"Vir","","87"],
["M88","Galassia",187.9966,14.4204,9.6,"Com","","88"],
["M89","Galassia",188.9158,12.5563,9.8,"Vir","","89"],
["M90","Galassia",189.2076,13.1629,9.5,"Vir","","90"],
["M91","Galassia",188.8601,14.4963,10.2,"Com","","91"],
["M92","Ammasso globulare",259.2809,43.1359,6.4,"Her","","92"],
["M93","Ammasso aperto",114.1500,-23.8667,6.2,"Pup","","93"],
["M94","Galassia",192.7210,41.1204,8.2,"CVn","","94"],
["M95","Galassia",160.9904,11.7037,9.7,"Leo","","95"],
["M96","Galassia",161.6920,11.8199,9.2,"Leo","","96"],
["M97","Nebulosa planetaria",168.6989,55.0190,9.9,"UMa","Nebulosa Gufo","97"],
["M98","Galassia",183.4513,14.9003,10.1,"Com","","98"],
["M99","Galassia",184.7066,14.4165,9.9,"Com","","99"],
["M100","Galassia",185.7286,15.8221,9.3,"Com","","100"],
["M101","Galassia",210.8022,54.3490,7.9,"UMa","Galassia Girandola","101"],
["M102","Galassia",226.6200,55.7633,9.9,"Dra","","102"],
["M103","Ammasso aperto",23.3417,60.6583,7.4,"Cas","","103"],
["M104","Galassia",189.9976,-11.6231,8.0,"Vir","Galassia Sombrero","104"],
["M105","Galassia",161.9566,12.5817,9.3,"Leo","","105"],
["M106","Galassia",184.7395,47.3037,8.4,"CVn","","106"],
["M107","Ammasso globulare",248.1326,-13.0537,7.9,"Oph","","107"],
["M108","Galassia",167.8791,55.6741,10.0,"UMa","","108"],
["M109","Galassia",179.3998,53.3747,9.8,"UMa","","109"],
["M110","Galassia",10.0919,41.6853,8.9,"And","","110"],
["NGC253","Galassia",11.8880,-25.2882,7.1,"Scl","Galassia dello Scultore",""],
["NGC281","Nebulosa a emissione",13.0567,56.6228,7.4,"Cas","Nebulosa Pacman",""],
["NGC869","Ammasso aperto",34.7417,57.1333,3.7,"Per","Ammasso Doppio h",""],
["NGC884","Ammasso aperto",35.5625,57.1417,3.8,"Per","Ammasso Doppio chi",""],
["NGC891","Galassia",35.6392,42.3492,9.9,"And","",""],
["NGC1023","Galassia",40.1000,39.0633,9.5,"Per","",""],
["NGC1499","Nebulosa a emissione",60.8000,36.3667,6.0,"Per","Nebulosa California",""],
["NGC2237","Nebulosa a emissione",97.9167,5.0500,6.0,"Mon","Nebulosa Rosetta",""],
["NGC2264","Ammasso con nebulosa",100.2417,9.8833,3.9,"Mon","Albero di Natale",""],
["NGC2403","Galassia",114.2138,65.6026,8.4,"Cam","",""],
["NGC4565","Galassia",189.0866,25.9876,9.6,"Com","Galassia Ago",""],
["NGC6543","Nebulosa planetaria",269.6392,66.6328,8.1,"Dra","Occhio di Gatto",""],
["NGC6822","Galassia",296.2342,-14.8032,8.8,"Sgr","Galassia di Barnard",""],
["NGC7000","Nebulosa a emissione",314.7500,44.3167,4.0,"Cyg","Nebulosa Nord America",""],
["NGC7293","Nebulosa planetaria",337.4108,-20.8372,7.3,"Aqr","Nebulosa Elica",""],
["NGC7331","Galassia",339.2671,34.4158,9.5,"Peg","",""],
["NGC7635","Regione HII",350.2042,61.2067,10.0,"Cas","Nebulosa Bolla",""],
["NGC7789","Ammasso aperto",359.0542,56.7333,6.7,"Cas","Rosa di Caroline",""],
["IC342","Galassia",56.7021,68.0961,9.1,"Cam","",""],
["IC405","Nebulosa a emissione",79.0708,34.2733,6.0,"Aur","Stella Fiammeggiante",""],
["IC434","Nebulosa a emissione",85.2458,-2.4589,11.0,"Ori","Testa di Cavallo",""],
["IC1396","Nebulosa a emissione",324.5500,57.5000,3.5,"Cep","Proboscide di Elefante",""],
["IC1805","Nebulosa a emissione",38.1833,61.4500,6.5,"Cas","Nebulosa Cuore",""],
["IC1848","Nebulosa a emissione",42.7500,60.4000,6.5,"Cas","Nebulosa Anima",""],
["IC5070","Nebulosa a emissione",312.7500,44.3667,3.5,"Cyg","Nebulosa Pellicano",""],
["IC5146","Nebulosa a emissione",328.4000,47.2667,7.2,"Cyg","Nebulosa Bozzolo",""],
["Sh2-6","Nebulosa a emissione",261.2833,-37.1167,9.0,"Sco","Nebulosa Scarabeo",""],
["Sh2-101","Nebulosa a emissione",299.9833,35.2833,9.0,"Cyg","Nebulosa Tulipano",""],
["Sh2-125","Nebulosa a emissione",324.7167,47.2333,9.0,"Cyg","Nebulosa Bozzolo",""],
["Sh2-140","Nebulosa a emissione",332.5000,63.1667,9.0,"Cep","Cygnus Wall",""],
["Sh2-155","Nebulosa a emissione",344.4167,62.6333,9.0,"Cep","Nebulosa Grotta",""],
["Sh2-162","Nebulosa a emissione",308.5833,60.1833,6.0,"Cep","Nebulosa California",""],
["Sh2-171","Nebulosa a emissione",0.7500,67.9833,9.0,"Cas","Nebulosa Crescente",""],
["Sh2-220","Nebulosa a emissione",37.1000,60.4333,9.0,"Cas","Nebulosa Testa di Strega",""],
["Sh2-229","Nebulosa a emissione",79.0708,34.2733,6.0,"Aur","Nebulosa Stella Fiammeggiante",""],
["Sh2-240","Nebulosa a emissione",87.5000,28.5000,9.0,"Tau","Nebulosa Medusa",""],
["Sh2-244","Nebulosa a emissione",93.4833,-7.1167,9.0,"Ori","Piccola Tromba",""],
["Sh2-248","Nebulosa a emissione",97.9667,1.0000,9.0,"Mon","Nebulosa Testa di Scimmia",""],
["Sh2-276","Nebulosa a emissione",83.0000,-3.5000,9.0,"Ori","Anello di Barnard",""],
["Sh2-281","Nebulosa a emissione",91.2000,6.2500,7.4,"Mon","Nebulosa Pacman",""],
["Sh2-298","Nebulosa a emissione",106.2167,-8.3500,9.0,"Mon","Nebulosa Insetto",""]
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
  const passi = [drawHeader, drawList, drawSky, drawDetails, drawPlanner, drawMap, disegnaInfogramma, drawFaseLunare, disegnaRiepilogoPlan];
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
    linea.on('click', function(){
      /* clic con il mouse sull\u2019oggetto: aggiorno la scheda, l\u2019infogramma e i pannelli */
      scegliOggetto(nome, false);
      try { aggiornaPannelli(nome); } catch(e){ console.warn('aggiornamento dal clic', e); }
    });
    state.mapRays.push(linea);
    const punto = L.circleMarker(fine, { radius: isSel ? 8 : 5, color:'#05201c', weight:2,
      fillColor: isSel ? '#ffc85b' : o.color, fillOpacity:1 }).addTo(state.map);
    punto.on('click', function(){
      scegliOggetto(nome, false);
      try { aggiornaPannelli(nome); } catch(e){ console.warn('clic sul punto', e); }
    });
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

/* Aggiorna scheda, infogramma, elenco e pianificatore per l\u2019oggetto indicato.
   Usata dal clic sulla mappa: la mappa non viene toccata. */
function aggiornaPannelli(nome){
  const o = state.positions.find(function(x){ return x.name === nome; });
  if(!o) return;
  state.selected = o;
  try { drawDetails(); } catch(e){ console.warn("scheda", e); }
  try { disegnaInfogramma(); } catch(e){ console.warn("infogramma", e); }
    try { drawFaseLunare(); } catch(e){ console.warn("fase lunare", e); }
  try { drawFaseLunare(); } catch(e){ console.warn("fase lunare", e); }
  try { drawList(); } catch(e){ console.warn("elenco", e); }
  try { drawPlanner(); } catch(e){ console.warn("pianificatore", e); }
}

/* Fase lunare: et\u00e0 in giorni, frazione illuminata e nome della fase.
   Uso l\u2019elongazione Sole-Luna e il periodo sinodico di 29,53 giorni. */
function faseLunare(d){
  const sole = sunRaDec(d);
  const luna = moonRaDec(d);
  /* distanza angolare fra Sole e Luna, in gradi */
  const a1 = sole.ra * D2R, d1 = sole.dec * D2R;
  const a2 = luna.ra * D2R, d2 = luna.dec * D2R;
  let cosE = Math.sin(d1)*Math.sin(d2) + Math.cos(d1)*Math.cos(d2)*Math.cos(a1 - a2);
  if(cosE > 1) cosE = 1; if(cosE < -1) cosE = -1;
  const elongazione = Math.acos(cosE) * R2D;
  /* la frazione illuminata dipende dall\u2019elongazione */
  const illuminata = (1 - Math.cos(elongazione * D2R)) / 2;
  const sinodico = 29.530588853;
  const eta = (elongazione / 360) * sinodico;
  /* il nome della fase */
  let nome = "Luna nuova";
  if(eta < 1.85) nome = "Luna nuova";
  else if(eta < 5.54) nome = "Falce crescente";
  else if(eta < 9.23) nome = "Primo quarto";
  else if(eta < 12.91) nome = "Gibbosa crescente";
  else if(eta < 16.61) nome = "Luna piena";
  else if(eta < 20.30) nome = "Gibbosa calante";
  else if(eta < 23.99) nome = "Ultimo quarto";
  else if(eta < 27.68) nome = "Falce calante";
  else nome = "Luna nuova";
  return { eta: eta, illuminata: illuminata, nome: nome };
}

/* Disegna la luna con la parte illuminata e gli orari di sorgere, culminazione e tramonto. */
function drawFaseLunare(){
  const tela = document.getElementById("faseCanvas");
  const testo = document.getElementById("faseTesto");
  if(!tela && !testo) return;
  const base = localDate();
  const fase = faseLunare(base);

  if(tela){
    const x = tela.getContext("2d"), w = tela.width, h = tela.height;
    x.clearRect(0, 0, w, h);
    const cx = w/2, cy = h/2, R = Math.min(w, h) * 0.34;
    /* disco scuro */
    x.beginPath(); x.arc(cx, cy, R, 0, Math.PI*2);
    x.fillStyle = "#17203a"; x.fill();
    x.strokeStyle = "#3d5a86"; x.lineWidth = 1.5; x.stroke();
    /* parte illuminata: crescendo da destra, calando da sinistra */
    const cresce = fase.eta < 14.77;
    x.save();
    x.beginPath();
    x.arc(cx, cy, R, -Math.PI/2, Math.PI/2, !cresce);
    /* semiellisse con ampiezza secondo la frazione illuminata */
    const k = 1 - 2 * fase.illuminata;
    const dir = cresce ? 1 : -1;
    const rx = Math.abs(R * k);
    x.ellipse(cx, cy, rx, R, 0, Math.PI/2, -Math.PI/2, k > 0 ? !cresce : cresce);
    x.closePath();
    x.fillStyle = "#eef4ff"; x.fill();
    x.restore();
  }

  if(testo){
    const luna = state.positions.find(function(o){ return o.name === "Luna"; });
    const curva = luna ? curvaDelGiorno(luna, base) : null;
    const riga = function(etichetta, valore){
      return "<div class=\"info-riga\"><span>" + etichetta + "</span><strong>" + valore + "</strong></div>";
    };
    const perc = Math.round(fase.illuminata * 100);
    let html = riga("Fase", fase.nome) +
      riga("Illuminazione", perc + "%") +
      riga("Et\u00e0", fase.eta.toFixed(1) + " giorni");
    if(curva){
      html += riga("Sorge", curva.sorgere ? orarioDaMinuti(curva.sorgere.minuti) + " \u00B7 0\u00B0" : "non sorge") +
              riga("Culmina", curva.culminazione ? orarioDaMinuti(curva.culminazione.minuti) + " \u00B7 " + curva.culminazione.alt.toFixed(1) + "\u00B0" : "\u2014") +
              riga("Tramonta", curva.tramonto ? orarioDaMinuti(curva.tramonto.minuti) + " \u00B7 0\u00B0" : "non tramonta");
    }
    testo.innerHTML = html;
  }
}

/* ================= pianificatore della ripresa ================= */
/* Non tocca nulla della mappa citta': usa nomi propri e non chiama le sue funzioni. */
const PASS0 = 5;
let planSagoma = null;
let planDisegnando = false;

function sagomaLibera(){
  const s = [];
  for(let a = 0; a < 360; a += PASS0) s.push(0);
  return s;
}
function sagomaPredefinita(){
  const s = [];
  for(let a = 0; a < 360; a += PASS0) s.push(30);
  return s;
}

/* Trasforma un punto del cerchio in azimut e altezza.
   Bordo = 0 gradi, centro = 90, dentro il centro = oltre lo zenit. */
function planPuntoInCoordinate(px, py){
  const c = document.getElementById("planCanvas");
  if(!c) return null;
  const w = c.width, h = c.height, cx = w/2, cy = h/2;
  const R = Math.min(w, h) * 0.44;
  const dx = px - cx, dy = cy - py;
  const distanza = Math.hypot(dx, dy);
  const az = norm(Math.atan2(dx, dy) * R2D);
  let alt = 90 * (1 - distanza / R);
  if(alt < 0) alt = Math.min(170, 180 + alt);
  return { az: az, alt: alt };
}

/* Disegna cerchio, assi, sagoma e oggetto selezionato. */
function disegnaPlanCanvas(){
  const c = document.getElementById("planCanvas");
  if(!c) return;
  const x = c.getContext("2d"), w = c.width, h = c.height;
  const cx = w/2, cy = h/2, R = Math.min(w, h) * 0.44;
  x.clearRect(0, 0, w, h);
  const sfondo = x.createRadialGradient(cx, cy, 10, cx, cy, R);
  sfondo.addColorStop(0, "#101a31");
  sfondo.addColorStop(1, "#080f20");
  x.fillStyle = sfondo;
  x.beginPath(); x.arc(cx, cy, R, 0, Math.PI*2); x.fill();

  /* anelli: 0, 30, 60, 90 gradi */
  const anelli = [0, 30, 60, 90];
  for(let i = 0; i < anelli.length; i++){
    const g = anelli[i], r = R * (1 - g/90);
    x.strokeStyle = (g === 0) ? "rgba(88,214,193,.7)" : "rgba(100,130,175,.22)";
    x.lineWidth = (g === 0) ? 2 : 1;
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI*2); x.stroke();
  }
  x.strokeStyle = "rgba(88,214,193,.45)"; x.lineWidth = 1;
  x.beginPath(); x.arc(cx, cy, 4, 0, Math.PI*2); x.stroke();

  /* punti cardinali e azimut ogni 30 gradi */
  x.font = "bold 18px system-ui"; x.textAlign = "center"; x.fillStyle = "#8fa1c5";
  const card = [["N",0],["E",90],["S",180],["O",270]];
  for(let k = 0; k < card.length; k++){
    const az = card[k][1] * D2R;
    x.strokeStyle = "rgba(100,130,175,.25)"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(cx, cy);
    x.lineTo(cx + Math.sin(az)*R, cy - Math.cos(az)*R); x.stroke();
    x.fillText(card[k][0], cx + Math.sin(az)*(R+24), cy - Math.cos(az)*(R+24) + 6);
  }
  x.font = "10px system-ui"; x.fillStyle = "#7c8dae";
  for(let a = 0; a < 360; a += 30){
    const az = a * D2R;
    x.fillText(a + "\u00B0", cx + Math.sin(az)*(R+44), cy - Math.cos(az)*(R+44));
  }
  x.textAlign = "left";
  for(let i = 0; i < anelli.length; i++){
    x.fillText(anelli[i] + "\u00B0", cx + 6, cy - R*(1 - anelli[i]/90) + 4);
  }
  x.fillStyle = "#58d6c1"; x.fillText("oltre lo zenit", cx + 10, cy + 16);

  /* la sagoma dell utente */
  if(planSagoma){
    x.beginPath();
    let primo = true;
    for(let a = 0; a < 360; a += PASS0){
      const alt = planSagoma[a / PASS0] || 0;
      let az = a, quota = alt;
      if(alt > 90){ az = (a + 180) % 360; quota = 180 - alt; }
      const r = R * Math.max(0, (90 - quota) / 90);
      const azr = az * D2R;
      const px = cx + Math.sin(azr)*r, py = cy - Math.cos(azr)*r;
      if(primo){ x.moveTo(px, py); primo = false; } else x.lineTo(px, py);
    }
    x.closePath();
    x.fillStyle = "rgba(88,214,193,.16)"; x.fill();
    x.strokeStyle = "#58d6c1"; x.lineWidth = 2; x.stroke();
  }

  /* l oggetto selezionato */
  const o = state.selected;
  if(o && typeof o.alt === "number"){
    let az = o.az, quota = o.alt;
    if(quota > 90){ az = norm(o.az + 180); quota = 180 - quota; }
    const r = (quota >= 0 && quota <= 90) ? R * (90 - quota) / 90 : R;
    const azr = az * D2R;
    const px = cx + Math.sin(azr)*r, py = cy - Math.cos(azr)*r;
    x.beginPath(); x.arc(px, py, 7, 0, Math.PI*2);
    x.fillStyle = "#ffc85b"; x.fill();
    x.strokeStyle = "#05201c"; x.lineWidth = 2; x.stroke();
    x.font = "700 12px system-ui"; x.textAlign = "left"; x.fillStyle = "#ffc85b";
    x.fillText(o.name, px + 11, py + 4);
  }
}

/* Registra un punto nella sagoma. */
function planRegistra(px, py){
  if(!planSagoma) planSagoma = sagomaPredefinita();
  const p = planPuntoInCoordinate(px, py);
  if(!p) return;
  const passo = Math.max(0, Math.min(355, Math.round(p.az / PASS0) * PASS0));
  const valore = Math.max(0, Math.min(170, p.alt));
  planSagoma[passo / PASS0] = valore;
  disegnaPlanCanvas();
}

/* L altezza visibile per un certo azimut, secondo la sagoma. */
function planQuotaVisibile(az){
  const s = planSagoma || sagomaPredefinita();
  const i = (Math.round(norm(az) / PASS0) * PASS0 % 360) / PASS0;
  return s[i] || 0;
}
/* L oggetto e visibile, data la sagoma? */
function planOggettoVisibile(o){
  if(!o || typeof o.alt !== "number") return false;
  let az = o.az, alt = o.alt;
  if(alt > 90){ az = norm(az + 180); alt = 180 - alt; }
  if(alt < 0) return false;
  return alt <= planQuotaVisibile(az);
}

/* La finestra di ripresa: quando l oggetto e sopra la soglia e dentro la visuale. */
function planCalcolaFinestra(o, soglia){
  if(!o) return null;
  const giorno = new Date(localDate().getTime());
  giorno.setHours(0, 0, 0, 0);
  const tratti = [];
  let inizio = null;
  let culmine = null;
  let lunaMassima = 0, lunaPresente = false;
  for(let m = 0; m <= 1440; m += 10){
    const d = new Date(giorno.getTime());
    d.setMinutes(m);
    const p = position(o, d);
    if(!culmine || p.alt > culmine.alt) culmine = { alt: p.alt, minuti: m };
    const dentro = p.alt >= soglia && planOggettoVisibile({ az: p.az, alt: p.alt });
    if(dentro){
      const luna = position({ name: "Luna", body: "moon", type: "solar", ra: 0, dec: 0 }, d);
      if(luna.alt > 0){
        lunaPresente = true;
        const f = faseLunare(d);
        if(f.illuminata * 100 > lunaMassima) lunaMassima = f.illuminata * 100;
      }
    }
    if(dentro && inizio === null) inizio = m;
    if(!dentro && inizio !== null){ tratti.push([inizio, m]); inizio = null; }
  }
  if(inizio !== null) tratti.push([inizio, 1440]);
  /* unisco i tratti separati dal cambio di giorno */
  if(tratti.length > 1 && tratti[tratti.length - 1][1] === 1440 && tratti[0][0] <= 20){
    const ultimo = tratti.pop();
    tratti[0] = [ultimo[0] - 1440, tratti[0][1]];
  }
  return { tratti: tratti, culmine: culmine, lunaMassima: lunaMassima, lunaPresente: lunaPresente };
}

/* Il riepilogo nella colonna di destra. */
function disegnaRiepilogoPlan(){
  const host = document.getElementById("planRiepilogo");
  if(!host) return;
  const sogliaEl = document.getElementById("planSoglia");
  const soglia = sogliaEl ? parseInt(sogliaEl.value, 10) : 30;
  const lunaEl = document.getElementById("planLuna");
  const lunaMax = lunaEl ? parseInt(lunaEl.value, 10) : 60;
  const o = state.selected;
  if(!o){
    host.innerHTML = "<div class=\"plan-avviso\">Nessun oggetto selezionato. Scegli l\u2019oggetto nella scheda <strong>Mappa citt\u00e0</strong>: il pianificatore lo eredita e ti dice quando fotografarlo.</div>";
    return;
  }
  const f = planCalcolaFinestra(o, soglia);
  if(!f) return;
  let html = "";
  if(f.culmine){
    html += "<div class=\"plan-finestra\"><h4>Massimo della giornata</h4><p>" +
      f.culmine.alt.toFixed(1) + "&deg; alle " + orarioDaMinuti(f.culmine.minuti) + "</p></div>";
  }
  if(!f.tratti.length){
    html += "<div class=\"plan-avviso\">" + o.name + " non arriva a " + soglia +
      "&deg; dentro la tua visuale, in questa data.</div>";
  }
  for(let i = 0; i < f.tratti.length; i++){
    const t = f.tratti[i], durata = t[1] - t[0];
    const ore = Math.floor(durata / 60), minuti = durata % 60;
    html += "<div class=\"plan-finestra\"><h4>Finestra di ripresa " + (i + 1) + "</h4>" +
      "<p>Da <strong>" + orarioDaMinuti(t[0]) + "</strong> a <strong>" + orarioDaMinuti(t[1]) + "</strong></p>" +
      "<p><small>" + ore + " h " + (minuti < 10 ? "0" : "") + minuti + " min sopra i " + soglia + "&deg;</small></p></div>";
  }
  if(f.lunaPresente && f.lunaMassima > lunaMax){
    html += "<div class=\"plan-avviso\">La Luna &egrave; sopra l\u2019orizzonte durante la finestra, illuminata fino al " +
      Math.round(f.lunaMassima) + "%. Sopra la tua soglia del " + lunaMax + "%: meglio un\u2019altra notte.</div>";
  } else if(f.lunaPresente){
    html += "<div class=\"plan-finestra\"><h4>Luna</h4><p><small>Presente, illuminata fino al " +
      Math.round(f.lunaMassima) + "%: entro la tua soglia.</small></p></div>";
  }
  const dentro = planOggettoVisibile(o);
  html += "<div class=\"plan-finestra\"><h4>Adesso</h4><p>" + o.name + " a " + o.alt.toFixed(1) +
    "&deg;, " + cardinal(o.az) + "</p><p><small>" + (dentro ? "dentro la tua visuale" : "fuori dalla tua visuale") + "</small></p></div>";
  host.innerHTML = html;
}

/* Eventi del pianificatore: disegno col mouse, cursori, salvataggio. */
function collegaPianificatore(){
  const c = document.getElementById("planCanvas");
  if(!c) return;
  const punto = function(e){
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * c.width / r.width, y: (e.clientY - r.top) * c.height / r.height };
  };
  c.addEventListener("pointerdown", function(e){
    planDisegnando = true;
    if(c.setPointerCapture) c.setPointerCapture(e.pointerId);
    const p = punto(e); planRegistra(p.x, p.y);
  });
  c.addEventListener("pointermove", function(e){
    if(!planDisegnando) return;
    const p = punto(e); planRegistra(p.x, p.y);
  });
  c.addEventListener("pointerup", function(){
    planDisegnando = false; disegnaRiepilogoPlan();
  });
  c.addEventListener("pointerleave", function(){ planDisegnando = false; });

  const cancella = document.getElementById("planClearBtn");
  if(cancella) cancella.onclick = function(){
    planSagoma = sagomaLibera(); disegnaPlanCanvas(); disegnaRiepilogoPlan();
    toast("Disegno cancellato");
  };
  const libero = document.getElementById("planFreeBtn");
  if(libero) libero.onclick = function(){
    planSagoma = sagomaPredefinita(); disegnaPlanCanvas(); disegnaRiepilogoPlan();
    toast("Orizzonte libero fino a 30 gradi");
  };
  const salva = document.getElementById("planSaveBtn");
  if(salva) salva.onclick = function(){
    try {
      localStorage.setItem("astromappa-sagoma", JSON.stringify(planSagoma));
      toast("Visuale salvata sul dispositivo");
    } catch(e){ toast("Non riesco a salvare la visuale"); }
  };

  const soglia = document.getElementById("planSoglia");
  if(soglia) soglia.oninput = function(e){
    const v = document.getElementById("planSogliaVal");
    if(v) v.textContent = e.target.value + "\u00B0";
    disegnaRiepilogoPlan();
  };
  const luna = document.getElementById("planLuna");
  if(luna) luna.oninput = function(e){
    const v = document.getElementById("planLunaVal");
    if(v) v.textContent = e.target.value + "%";
    disegnaRiepilogoPlan();
  };

  /* recupero la sagoma salvata in precedenza */
  try {
    const salvata = localStorage.getItem("astromappa-sagoma");
    if(salvata) planSagoma = JSON.parse(salvata);
  } catch(e){ console.warn("sagoma salvata non letta", e); }
  if(!planSagoma || !planSagoma.length) planSagoma = sagomaPredefinita();
  disegnaPlanCanvas();
  disegnaRiepilogoPlan();
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
  const box = document.getElementById("suggestBox");
  if(!box) return;
  const q = String(testo || "").trim();
  if(q.length < 2){
    box.hidden = true; box.innerHTML = ""; return;
  }
  const lista = suggerisci(testo, 14);
  if(!lista.length){
    box.innerHTML = '<div class="suggest-vuoto">Nessun oggetto per «' + q + '»</div>';
    box.hidden = false;
    return;
  }
  const righe = [];
  for(let i=0; i<lista.length; i++){
    const o = lista[i];
    const stato = o.alt > 0 ? "sopra l\u2019orizzonte" : "sotto l\u2019orizzonte";
    righe.push('<div class="suggest-row" data-name="' + String(o.name).replace(/"/g, "&quot;") + '">' +
      '<i style="background:' + o.color + '"></i>' +
      '<span>' + o.name + '</span>' +
      '<em>' + o.kind + " \u00B7 " + stato + " \u00B7 " + o.alt.toFixed(0) + "\u00B0</em></div>");
  }
  box.innerHTML = righe.join("");
  box.hidden = false;
  const elementi = $(".suggest-row");
  for(let k=0; k<elementi.length; k++){
    elementi[k].onmousedown = function(e){
      e.preventDefault();
      scegliOggetto(this.getAttribute("data-name"), true);
    };
  }
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
  const campo = document.getElementById("objectSearch");
  const testo = campo ? campo.value : "";
  drawList();
  if(attesaSuggerimenti) clearTimeout(attesaSuggerimenti);
  /* le sigle complete (NGC 7, M 42) mostrano i suggerimenti senza attesa */
  const completa = /^\s*(ngc|ic|m|messier)\s*\d{1,4}\s*$/i.test(testo);
  if(completa){
    mostraSuggerimenti(testo);
  } else {
    attesaSuggerimenti = setTimeout(function(){ mostraSuggerimenti(testo); }, 120);
  }
}

/* Carica un catalogo esterno. Riconosce due formati:
   - OpenNGC (NGC.csv): intestazione con Name, Type, RA, Dec, Const, CommonName, M
   - formato dell app: nome|tipo|ra|dec|magnitudine|costellazione|nome comune|messier
   Il file viene letto dal computer dell utente: nessuna richiesta di rete. */
function leggiFileCatalogo(file){
  if(!file) return;
  const info = document.getElementById("catalogStatus");
  if(info) info.textContent = "Leggo " + file.name + " (" + (file.size/1048576).toFixed(2) + " MB)...";
  if(file.size < 2000){
    if(info) info.textContent = "Il file " + file.name + " e\u2019 troppo piccolo (" + file.size + " byte): non e\u2019 un catalogo.";
    toast("File troppo piccolo");
    return;
  }
  const reader = new FileReader();
  reader.onload = function(){
    try{
      const testo = String(reader.result);
      let aggiunti = 0;
      const primaRiga = testo.slice(0, 300).split(/\r?\n/)[0] || "";
      /* riconosco il formato dall intestazione */
      /* cerco le colonne di OpenNGC fra le prime righe, con qualunque separatore */
      const sepRilevato = separatoreDi(testo);
      const testaRighe = testo.split(/\r?\n/).slice(0, 20);
      let sembraOpenngc = false;
      for(let t = 0; t < testaRighe.length; t++){
        const colonne = dividiRiga(testaRighe[t], sepRilevato).map(chiaveColonna);
        if(colonne.indexOf("name") > -1 && colonne.indexOf("ra") > -1 && colonne.indexOf("dec") > -1){
          sembraOpenngc = true; break;
        }
      }
      if(sembraOpenngc){
        aggiunti = importaOpenngc(testo);
      } else {
        aggiunti = importaFormatoApp(testo);
      }
      if(!aggiunti){
        throw new Error("nessun oggetto riconosciuto. Separatore rilevato: \u00AB" +
          (separatoreDi(testo) === "\t" ? "tabulazione" : separatoreDi(testo)) +
          "\u00BB. Prima riga: \u00AB" + primaRiga.slice(0, 100) + "\u00BB");
      }
      if(info) info.textContent = "Aggiunti " + aggiunti + " oggetti da " + file.name +
        ". Totale in catalogo: " + catalog.length + ".";
      toast(aggiunti + " oggetti aggiunti");
      compute();
    }catch(e){
      if(info) info.textContent = "File non riconosciuto: " + e.message;
      toast("File non riconosciuto");
    }
  };
  reader.onerror = function(){
    if(info) info.textContent = "Non riesco a leggere il file. Se e\u2019 in cloud o su una cartella di rete, copialo prima in locale.";
  };
  reader.readAsText(file, "UTF-8");
}

/* converte le coordinate sessagesimali in gradi decimali */
function raDaSessagesimale(v){
  if(v === undefined || v === null || v === "") return null;
  const s = String(v).trim().replace(",", ".");
  if(s.indexOf(":") < 0){ const n = parseFloat(s); return isFinite(n) ? n : null; }
  const p = s.split(":");
  if(p.length < 2) return null;
  const h = parseFloat(p[0]), m = parseFloat(p[1]), sec = parseFloat(p[2] || "0");
  if(!isFinite(h) || !isFinite(m)) return null;
  return (h + m/60 + (sec||0)/3600) * 15;
}
function decDaSessagesimale(v){
  if(v === undefined || v === null || v === "") return null;
  const s = String(v).trim().replace(",", ".");
  if(s.indexOf(":") < 0){ const n = parseFloat(s); return isFinite(n) ? n : null; }
  const negativo = s.charAt(0) === "-";
  const p = s.replace(/^[+-]/, "").split(":");
  if(p.length < 2) return null;
  const d = parseFloat(p[0]), m = parseFloat(p[1]), sec = parseFloat(p[2] || "0");
  if(!isFinite(d) || !isFinite(m)) return null;
  const val = d + m/60 + (sec||0)/3600;
  return negativo ? 0 - val : val;
}

/* Riconosce il separatore del file: virgola, punto e virgola o tabulazione. */
function separatoreDi(testo){
  const testa = testo.slice(0, 4000);
  const virgola = (testa.match(/,/g) || []).length;
  const puntoVirgola = (testa.match(/;/g) || []).length;
  const tab = (testa.match(/\t/g) || []).length;
  if(puntoVirgola > virgola && puntoVirgola >= tab) return ";";
  if(tab > virgola && tab > puntoVirgola) return "\t";
  return ",";
}

/* Divide una riga rispettando le virgolette, con il separatore indicato. */
function dividiRiga(riga, sep){
  const campi = [];
  let campo = "", dentro = false;
  for(let c = 0; c < riga.length; c++){
    const ch = riga[c];
    if(dentro){
      if(ch === '"'){
        if(riga[c+1] === '"'){ campo += '"'; c++; }
        else dentro = false;
      } else campo += ch;
    }
    else if(ch === '"') dentro = true;
    else if(ch === sep){ campi.push(campo); campo = ""; }
    else campo += ch;
  }
  campi.push(campo);
  return campi;
}

/* Normalizza il nome di una colonna: minuscole, senza spazi, trattini o punti. */
function chiaveColonna(h){
  return String(h || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

/* importa un file nel formato di OpenNGC, qualunque sia il separatore. */
function importaOpenngc(testo){
  const righe = testo.split(/\r?\n/);
  if(righe.length < 2) return 0;
  const sep = separatoreDi(testo);

  /* cerco la riga di intestazione fra le prime venti: quella con piu colonne note */
  const note = ["name","ra","dec","type","const","vmag","bmag","mag","m","commonname","commonnames"];
  let rigaIntestazione = -1, migliore = 0, intestazione = null;
  for(let r = 0; r < Math.min(righe.length, 20); r++){
    const prova = dividiRiga(righe[r], sep).map(chiaveColonna);
    let contati = 0;
    for(let i = 0; i < note.length; i++){ if(prova.indexOf(note[i]) > -1) contati++; }
    if(contati > migliore){ migliore = contati; rigaIntestazione = r; intestazione = prova; }
  }
  if(migliore < 2 || rigaIntestazione < 0){
    throw new Error("intestazione non trovata. Separatore usato: \u00AB" +
      (sep === "\t" ? "tabulazione" : sep) + "\u00BB. Prime parole: \u00AB" +
      String(righe[0] || "").slice(0, 80) + "\u00BB");
  }

  const pos = function(nomi){
    for(let i = 0; i < nomi.length; i++){
      const k = intestazione.indexOf(nomi[i]);
      if(k > -1) return k;
    }
    return -1;
  };
  const iNome = pos(["name"]);
  const iRa = pos(["ra","raj2000"]);
  const iDec = pos(["dec","dej2000"]);
  const iTipo = pos(["type","objtype"]);
  const iMag = pos(["vmag","bmag","mag","magnitude"]);
  const iM = pos(["m","messier"]);
  const iComune = pos(["commonnames","commonname","common"]);
  const iCostellazione = pos(["const","constellation"]);

  if(iNome < 0 || iRa < 0 || iDec < 0){
    throw new Error("colonne necessarie non trovate (nome, RA, Dec). Colonne lette: " +
      intestazione.slice(0, 12).join(", "));
  }

  let aggiunti = 0, scartate = 0;
  for(let r = rigaIntestazione + 1; r < righe.length; r++){
    const riga = righe[r];
    if(!riga.trim()) continue;
    const campi = dividiRiga(riga, sep);
    const nome = (campi[iNome] || "").trim();
    if(!nome) continue;
    const ra = raDaSessagesimale(campi[iRa]);
    const dec = decDaSessagesimale(campi[iDec]);
    if(ra === null || dec === null){ scartate++; continue; }
    const tipoGrezzo = iTipo > -1 ? (campi[iTipo] || "").trim() : "";
    const genere = tipoDaOpenngc(tipoGrezzo);
    const messier = iM > -1 ? (campi[iM] || "").trim() : "";
    const magGrezza = iMag > -1 ? String(campi[iMag] || "").replace(",", ".") : "";
    const mag = parseFloat(magGrezza);
    catalog.push({
      name: nome, id: nome, messier: messier, type: "deep", kind: genere,
      color: colorePerTipo(genere),
      mag: isFinite(mag) ? mag : 11,
      ra: ra, dec: dec,
      constellation: iCostellazione > -1 ? (campi[iCostellazione] || "").trim() : "",
      common: iComune > -1 ? (campi[iComune] || "").trim() : "",
      source: "OpenNGC (CC-BY-SA 4.0)"
    });
    aggiunti++;
  }
  console.log("catalogo: separatore", sep, "oggetti", aggiunti, "scartate", scartate);
  return aggiunti;
}


/* traduce i tipi di OpenNGC in etichette leggibili */
function tipoDaOpenngc(t){
  const mappa = {
    G:"Galassia", GPair:"Coppia di galassie", GTrpl:"Terzetto di galassie", GGroup:"Gruppo di galassie",
    PN:"Nebulosa planetaria", HII:"Regione HII", DrkN:"Nebulosa oscura", EmN:"Nebulosa a emissione",
    Neb:"Nebulosa", RfN:"Nebulosa a riflessione", SNR:"Resto di supernova", "Cl+N":"Ammasso con nebulosa",
    GCl:"Ammasso globulare", OCl:"Ammasso aperto", "**":"Stella doppia", "\u002A":"Stella",
    "\u002A\u002A":"Stella doppia", "\u002AAss":"Associazione stellare", Nova:"Nova", NonEx:"Inesistente",
    Dup:"Duplicato", Other:"Altro"
  };
  return mappa[t] || "Oggetto";
}

/* importa un file nel formato dell app */
function importaFormatoApp(testo){
  const righe = testo.split(/\r?\n/);
  let aggiunti = 0;
  for(let i = 0; i < righe.length; i++){
    const p = righe[i].trim().split("|");
    if(p.length < 4) continue;
    const ra = parseFloat(p[2]), dec = parseFloat(p[3]);
    if(!isFinite(ra) || !isFinite(dec)) continue;
    const genere = p[1] || "Oggetto";
    const mag = parseFloat(p[4]);
    catalog.push({ name:p[0], id:p[0], messier:p[7] || "", type:"deep", kind:genere,
      color:colorePerTipo(genere), mag:isFinite(mag) ? mag : 9, ra:ra, dec:dec,
      constellation:p[5] || "", common:p[6] || "", source:"file locale" });
    aggiunti++;
  }
  return aggiunti;
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
  /* ---- caricamento di un catalogo esterno ---- */
  const campoFile = document.getElementById('catalogFile');
  if(campoFile) campoFile.onchange = function(e){
    const f = e.target.files && e.target.files[0];
    if(f) leggiFileCatalogo(f);
    e.target.value = '';
  };

  const geo = document.getElementById('geoBtn');
  if(geo) geo.onclick = useMyPosition;





  ['lat','lon','date','time'].forEach(function(id){
    const el = document.getElementById(id);
    if(el) el.onchange = compute;
  });
  /* ---- indirizzo: il campo e il pulsante di ricerca ---- */
  const indirizzo = document.getElementById('address');
  const cercaIndirizzo = document.getElementById('searchPlace');
  if(cercaIndirizzo) cercaIndirizzo.onclick = function(){ geocode(); };
  if(indirizzo){
    indirizzo.onkeydown = function(e){
      if(e.key === 'Enter'){ e.preventDefault(); geocode(); }
    };
  }

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

    /* ---- casella di ricerca: suggerimenti mentre si digita ---- */
  const ricerca = document.getElementById("objectSearch");
  if(ricerca){
    /* a ogni carattere: elenco filtrato e suggerimenti */
    ricerca.oninput = function(){
      inputRicerca();
    };

    /* tasti: frecce per scorrere, Invio per scegliere, Esc per chiudere */
    ricerca.onkeydown = function(e){
      const box = document.getElementById("suggestBox");
      const visibile = box && box.hidden === false;
      if(e.key === "ArrowDown" || e.key === "ArrowUp"){
        if(!visibile) return;
        e.preventDefault();
        const righe = $$(".suggest-row");
        if(!righe.length) return;
        let idx = -1;
        for(let i=0; i<righe.length; i++){ if(righe[i].classList.contains("attivo")) idx = i; }
        let prossimo = (e.key === "ArrowDown") ? idx + 1 : idx - 1;
        if(prossimo < 0) prossimo = righe.length - 1;
        if(prossimo >= righe.length) prossimo = 0;
        for(let j=0; j<righe.length; j++){ righe[j].classList.remove("attivo"); }
        righe[prossimo].classList.add("attivo");
        return;
      }
      if(e.key === "Escape"){
        if(box) box.hidden = true;
        return;
      }
      if(e.key === "Enter"){
        e.preventDefault();
        let nome = null;
        /* prima scelta: la riga evidenziata */
        if(visibile){
          const attiva = box.querySelector(".suggest-row.attivo") || box.querySelector(".suggest-row");
          if(attiva) nome = attiva.getAttribute("data-name");
        }
        /* seconda scelta: il primo risultato della ricerca, sempre */
        if(!nome){
          const lista = suggerisci(ricerca.value, 1);
          if(lista.length) nome = lista[0].name;
        }
        if(nome){
          scegliOggetto(nome, true);
        } else {
          toast("Nessun oggetto trovato per \u00AB" + ricerca.value + "\u00BB");
        }
      }
    };

    /* clic fuori dal riquadro: chiude l elenco */
    document.addEventListener("click", function(e){
      const box = document.getElementById("suggestBox");
      if(!box || box.hidden) return;
      if(box.contains(e.target)) return;
      if(ricerca === e.target || ricerca.contains(e.target)) return;
      box.hidden = true;
    });
  }
}

/* Aggiunge un gestore al pulsante Pianificatore, SENZA togliere quello esistente:
   cosi\u00ec la scheda continua ad aprirsi come prima e in piu\u00ec si disegna il cerchio. */
function collegaSchedaPianificatore(){
  const pulsante = document.querySelector(".tab[data-view='planner']");
  if(!pulsante) return;
  pulsante.addEventListener("click", function(){
    try {
      disegnaPlanCanvas();
      disegnaRiepilogoPlan();
    } catch(e){ console.warn("disegno pianificatore", e); }
  });
}

/* Accende i pulsanti delle schede. Prima non esisteva nessun gestore:
   e\u2019 questa la ragione per cui il pulsante Pianificatore non rispondeva. */
function accendiSchede(){
  const pulsanti = document.querySelectorAll(".tab");
  if(!pulsanti.length){
    console.warn("schede: nessun pulsante trovato");
    return;
  }
  for(let i = 0; i < pulsanti.length; i++){
    const b = pulsanti[i];
    b.onclick = function(){
      /* aspetto la vista indicata dal pulsante */
      const vista = b.dataset.view;
      for(let k = 0; k < pulsanti.length; k++) pulsanti[k].classList.remove("active");
      const viste = document.querySelectorAll(".view");
      for(let k = 0; k < viste.length; k++) viste[k].classList.remove("active");
      b.classList.add("active");
      const pannello = document.getElementById(vista + "View");
      if(pannello) pannello.classList.add("active");

      if(vista === "planner"){
        /* il pianificatore legge l\u2019oggetto scelto nella scheda mappa */
        try { disegnaPlanCanvas(); } catch(e){ console.warn("tela pianificatore", e); }
        try { disegnaRiepilogoPlan(); } catch(e){ console.warn("riepilogo pianificatore", e); }
      }
      if(vista === "map"){
        try {
          if(state.map){ setTimeout(function(){ state.map.invalidateSize(); }, 80); }
        } catch(e){ console.warn("ridimensionamento mappa", e); }
      }
    };
  }
  console.log("schede accese:", pulsanti.length);
}

function avvia(){
  try { costruisciCatalogo(); } catch(e){ console.warn('catalogo', e); }
  console.log('catalogo pronto:', catalog.length, 'oggetti');
  try { initTime(); } catch(e){ console.warn('initTime', e); }
  try { collegaEventi(); } catch(e){ console.warn('eventi', e); }
  try { accendiSchede(); } catch(e){ console.warn('schede', e); }
  try { collegaPianificatore(); } catch(e){ console.warn('pianificatore', e); }
  try { compute(); } catch(e){ console.warn('calcolo', e); }
}
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', avvia);
} else {
  avvia();
}
