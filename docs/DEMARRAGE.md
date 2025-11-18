# 🚀 Guide de démarrage rapide - StudyMate School Orchestrator

## ⚡ Démarrage immédiat

### Méthode 1 : Python (recommandée)

```bash
cd studymate-school-orchestrator
python3 -m http.server 8080
```

Puis ouvrez : **http://localhost:8080**

### Méthode 2 : Node.js

```bash
cd studymate-school-orchestrator
npx http-server -p 8080
```

### Méthode 3 : Direct (peut avoir des limitations CORS)

Double-cliquez sur `index.html` ou :
```bash
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows
```

## 🎭 Utilisation

1. **Page d'accueil** : Vous arrivez sur l'écran d'authentification
2. **Clic sur "Découvrir la démo"** : Lance le mode démonstration
3. **Navigation** : Utilisez le menu en haut pour explorer
4. **Dashboard** : Vue d'ensemble avec KPIs et devoirs
5. **Quitter** : Cliquez sur "🚪 Quitter" pour revenir à l'authentification

## ✅ Ce qui fonctionne

### Features complètes
- ✅ Écran d'authentification avec bouton démo
- ✅ Mode démo complet (localStorage + FakeRouter)
- ✅ Dashboard enseignant :
  - KPIs (245 élèves, 8 classes, 23 devoirs)
  - Devoirs urgents (échéance < 3 jours)
  - Top 3 des matières
  - Liste de tous les devoirs
  - Calcul des taux de complétion
- ✅ Navigation TopNav responsive
- ✅ Badge "Mode Démo"
- ✅ Design réutilisé d'ErgoMate (thème clair/sombre)

### Stubs (structure en place)
- 🚧 Curriculum Builder
- 🚧 Catalogue de contenus
- 🚧 Workflow qualité
- 🚧 Workflow annotations
- 🚧 Workflow versions
- 🚧 Administration
- 🚧 Onboarding tour

## 🎯 Points d'attention

### Données mockées
Les données sont fictives et cohérentes :
- **Lycée** : Seconde, Première, Terminale
- **Matières** : Mathématiques, Philosophie, Histoire-Géographie
- **8 devoirs** avec statuts variés (active, completed, draft)
- Dates réalistes (novembre-décembre 2024)

### Navigation
- Le routing fonctionne avec `window.location.hash`
- Les boutons de navigation mettent à jour l'URL
- Le rafraîchissement de page conserve la vue active

### Console développeur
Ouvrez la console (F12) pour voir les logs :
- `[Router]` : Navigation
- `[API Service]` : Appels API
- `[FakeRouter]` : Réponses mockées
- `[Dashboard]` : Chargement des données

## 📱 Responsive

L'application est **mobile-friendly** :
- Menu burger sur mobile (< 768px)
- Grille adaptative pour les KPIs
- Cards empilées sur petit écran

## 🔍 Vérification rapide

1. **Console sans erreurs ?** ✅
2. **Badge "Mode Démo" visible ?** ✅
3. **5 KPIs affichés ?** ✅
4. **Liste de 8 devoirs ?** ✅
5. **Navigation fonctionnelle ?** ✅

## 🐛 Dépannage

### "Failed to load module"
→ Utilisez un serveur HTTP (méthodes 1 ou 2)

### Dashboard vide
→ Vérifiez la console, le FakeRouter devrait répondre en ~150-300ms

### Navigation cassée
→ Vérifiez que tous les fichiers JS sont bien chargés (Network tab)

## 📚 Documentation complète

Voir `README.md` pour :
- Architecture détaillée
- Structure des données
- Guide de développement
- Ajout de nouvelles features

## 🎨 Personnalisation

### Changer les couleurs
Éditez `assets/styles.css` → section `:root` (variables CSS)

### Ajouter des données
Éditez `js/demo/FakeRouter.js` → constantes `MOCK_*`

### Nouvelle vue
1. Créer `view-xxx.js` dans `features/features-view/`
2. Créer `feature-xxx.js` dans `features/features-control/`
3. Ajouter la route dans `app.js`

---

**Version** : 0.1.0-mvp  
**Prêt pour démo** : ✅  
**Production-ready** : ❌ (MVP uniquement)
