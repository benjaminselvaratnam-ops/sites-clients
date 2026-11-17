# Sites clients — démos

Trois sites vitrines de démonstration pour des commerces du Grand Lausanne. Chaque site s'ouvre sur un film généré avec Higgsfield, que le visiteur fait avancer en faisant défiler la page, à partir des vraies photos du commerce. La suite de la page est pensée pour attirer des clients : appeler, venir, commander.

| Dossier | Commerce | Film d'ouverture |
|---|---|---|
| `best-barber/` | Best Barber, Chemin du Closelet 6 | Un rasoir chromé se divise en 4 outils, puis vient un dégradé en gros plan et enfin le salon et son plafond en hexagones |
| `bold-coffee/` | BOLD COFFEE CLUB, Avenue d'Ouchy 16 | Des grains de café sont moulus, l'espresso coule, le latte art se dessine, puis on découvre le café terracotta |
| `maison-lecointre/` | Maison Lecointre, Rue du Maupas 10 | Un croissant se décompose en couches de feuilletage, devient un dessert à la fraise, puis on découvre la vitrine |

## Contenu de chaque site

- `index.html` : toute la page, avec les textes, les horaires, les avis et les liens.
- `css/base.css` : la mise en page commune aux trois sites.
- `css/theme.css` : les couleurs et les polices propres au commerce.
- `js/engine.js` : le film piloté par le défilement (une vidéo sur ordinateur, une suite d'images sur téléphone pour rester fluide), les animations, la galerie, le badge « Ouvert / Fermé » et les horaires (dans `window.SITE`, en bas de `index.html`).
- `assets/world/` : le film découpé en 4 chapitres. `assets/frames/` : les 181 images utilisées sur mobile. `assets/photos/` : les photos du commerce.

## Voir un site en local

```bash
cd sites-clients
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/best-barber/ (ou bold-coffee/, maison-lecointre/)
```

Ouvrir le fichier en double-cliquant ne suffit pas : le film a besoin d'un petit serveur local.

## À confirmer avec chaque commerce avant une mise en ligne réelle

- **Les photos** viennent de leur fiche Google Maps. Il faut leur accord, ou mieux, leurs fichiers d'origine.
- **Best Barber** : les tarifs (le site indique pour l'instant « tarifs affichés au salon »).
- **Bold** : les prix de la carte, et leur accord pour mentionner le vote et l'anniversaire.
- **Lecointre** : savoir si le numéro reçoit bien les SMS. Le formulaire de commande de gâteaux ouvre un SMS déjà rédigé.
- Les horaires, relevés sur Google et Instagram en novembre 2026.
