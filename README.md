# Estime de soi 360° (12–25 ans)

Pack prêt-à-héberger (GitHub Pages) – **sans dépendance externe** (pas de CDN).

## Fichiers
- `index.html` — formulaire 1 question à la fois + résultats
- `styles.css` — design moderne, logo centré
- `app.js` — logique de test, scoring, radar canvas, impression PDF
- `items.json` — 32 items (4 dimensions × 8)
- `assets/logo.svg` — placeholder (remplacez par votre logo)

## Hébergement (GitHub Pages)
1. Créez un repo (ex: `estime_de_soi_360`), uploadez ces fichiers à la racine.
2. Paramètres → Pages → Source: `main` / `/root`.
3. L’URL sera du type `https://<votre-compte>.github.io/estime_de_soi_360/`.

## Personnalisation
- **Logo** : remplacez `assets/logo.svg` par le vôtre (même nom) → logo centré partout.
- **Couleurs** : modifiez le dégradé (#2E86DE → #00B894) dans `styles.css` si besoin.
- **Questions** : éditez `items.json` (flag `"reverse": true` pour les items inversés).

## PDF
Le bouton **Imprimer / Enregistrer en PDF** ouvre la boîte de dialogue d’impression du navigateur.
Sélectionnez **Enregistrer au format PDF**. Les styles d’impression dédiés sont inclus.

## Barèmes
- Par dimension (max 40) : Fragile < 45% ; En construction < 66% ; Solide < 85% ; Rayonnant ≥ 85%.
- Global (max 160) : même logique.

© 2025-09-22 — Académie de Performances