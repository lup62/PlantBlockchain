# PlantChain – Press Kit (frontend)

## Identità
- **Nome prodotto:** PlantChain (registry varietà/licenze/batch su blockchain).
- **Logo:** Non è presente un logo file nella repo. L’header usa l’icona `Hexagon` di `lucide-react`. Se serve un logo grafico, va creato/aggiunto in `frontend/src/assets/` e collegato nel componente `frontend/src/components/Layout.jsx`.
- **Icone:** Libreria `lucide-react` (es. Hexagon, Home, Search, ShieldCheck, Sprout, Users, Wallet, ecc.).

## Font (Google Fonts)
- **Display/Main:** `Space Grotesk` (weight 400–700).
- **Body:** `Outfit` (weight 200–800).
Font importate in `frontend/src/index.css`.

## Palette colori (da `frontend/src/index.css`)
- **Background profondo (`--bg-deep`):** `#020402`
- **Superficie (`--bg-surface`):** `rgba(255, 255, 255, 0.03)`
- **Bordo vetro (`--border-glass`):** `rgba(255, 255, 255, 0.08)`
- **Accento neon verde (`--neon-green`):** `#00ff9d`
- **Accento neon blu (`--neon-blue`):** `#00f2ff`
- **Suggerimento uso:** testo primario bianco/grigio chiaro; fondi scuri; superfici glassmorphism con opacità 2–8%; highlight con neon verde/blu.

## Stile UI
- Tema “organic tech”: sfondo scuro con aurora animata, gradienti, card glassmorphism.
- Componenti chiave: `glass-panel`, `glass-card`, bottoni neon (`.btn-neon`, `.btn-primary-glow`), scrollbar minimal.
- Animazioni: rotazione aurora, hover lift su card, pulsazione neon.

## Asset presenti
- `frontend/src/assets/404-plant.png` (illustrazione usata per pagina 404).
- Nessun altro asset grafico o logo file incluso.

## Note per presentazioni
- Usa le font sopra e la palette indicata.
- Per un logo dedicato, creare un file (es. `frontend/src/assets/logo.png/svg`) e sostituire il blocco logo in `frontend/src/components/Layout.jsx`.
- Screenshot consigliati: home (hero + statistiche), Verify page (dossier + QR scanner), dashboard Authority/Breeder/Licensee/Inspector.
