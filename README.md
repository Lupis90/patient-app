# PRP App

Questa applicazione permette di gestire le visite dei pazienti, inclusa la possibilità di caricare foto sia dal dispositivo locale che da Google Photos.

## Configurazione

1. Clona il repository
2. Installa le dipendenze con `npm install`
3. Crea un file `.env.local` nella root del progetto e aggiungi il tuo Google Client ID:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=IL_TUO_GOOGLE_CLIENT_ID
```

Per ottenere un Google Client ID:
1. Vai alla [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona un progetto esistente
3. Abilita l'API di Google Photos
4. Nella sezione "Credenziali", crea un nuovo ID client OAuth 2.0
5. Configura l'ID client per l'uso con applicazioni JavaScript
6. Copia l'ID client e inseriscilo nel file `.env.local`

## Esecuzione dell'applicazione

Per avviare l'applicazione in modalità di sviluppo:

```
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel tuo browser per vedere l'applicazione.

## Funzionalità

- Aggiunta di nuove visite con nome, cognome e data
- Caricamento di foto dal dispositivo locale
- Selezione di foto da Google Photos
- Visualizzazione e modifica delle visite esistenti
- Ordinamento delle visite per cognome, nome o data

## Tecnologie utilizzate

- Next.js
- React
- Dexie.js per il database locale
- Tailwind CSS per lo styling
- Google Photos API per la selezione di foto da Google Photos
