# AstroMappa

Web app astronomica installabile (PWA) in italiano.

## Avvio

La PWA richiede un server HTTP; non aprire direttamente index.html con file://.

Esempi:

- pubblica la cartella su GitHub Pages, Netlify, Vercel o un hosting HTTPS;
- in locale, dalla cartella astro-map, esegui un semplice server statico disponibile nel tuo ambiente.

Apri l'indirizzo HTTPS nel browser e usa il pulsante "Installa app" quando disponibile.

## Funzioni incluse

- coordinate, geolocalizzazione e ricerca indirizzo;
- data, ora e slider giornaliero;
- vista altazimutale interattiva;
- Sole, Luna, pianeti, stelle e una selezione Messier;
- azimut, altezza, ascensione retta, declinazione e magnitudine;
- filtro per catalogo e oggetti sopra l'orizzonte;
- pianificatore degli obiettivi meglio posizionati;
- funzionamento offline dopo il primo caricamento.

## Nota scientifica

Questa è una prima versione dimostrativa. Stelle e oggetti deep-sky usano coordinate di catalogo semplificate; Sole e Luna usano formule compatte; i pianeti usano una stima orbitale utile per il prototipo, non effemeridi di precisione. Per astrofotografia, occultazioni o puntamento professionale, integrare JPL Horizons/DE440 o Swiss Ephemeris e cataloghi completi indicizzati lato server.

La ricerca indirizzi utilizza Nominatim/OpenStreetMap e richiede connessione internet. La geolocalizzazione del browser richiede HTTPS o localhost.

## Proiezione altazimutale sulla mappa (v1.5)

Nella scheda "Mappa citta" la cartografia reale fa da sfondo a una proiezione del cielo:

- il **cerchio dell'orizzonte** segna 0 gradi di altezza;
- il **centro** della mappa e' lo zenit, 90 gradi;
- ogni oggetto e' posto lungo il proprio azimut, alla distanza dal centro
  proporzionale alla sua altezza: vicino al bordo se basso, vicino al centro se alto;
- il raggio di riferimento a 45 gradi e il cerchio dei 67 gradi aiutano a leggere la scala;
- il pulsante "Proiezione cielo" accende e spegne cerchio e oggetti.

La scala usata e' lineare in altezza (raggio = 1 - altezza/90). Con questa scelta
un oggetto a 30 gradi sta a due terzi del raggio, uno a 60 gradi a un terzo.
