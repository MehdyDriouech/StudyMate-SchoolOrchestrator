# 🏫 StudyMate School Orchestrator  
**Plateforme institutionnelle qui synchronise ErgoMate avec les équipes pédagogiques pour créer, valider, diffuser et suivre des contenus d’apprentissage.**

Version : **MVP DEMO 1.0.0**  
Dernière mise à jour : **Novembre 2025**  
Auteur : **Mehdy Driouech**

---

# 🌟 Vue d’ensemble

**StudyMate School Orchestrator (SMSO)** est le cœur administratif et pédagogique connecté à **ErgoMate**.  
Il permet aux enseignants, directeurs et équipes qualité de :

- créer et gérer leurs contenus pédagogiques (cours, quiz, flashcards, fiches),
- valider les thèmes via un workflow qualité complet,
- construire un curriculum structuré par classe et période,
- assigner des thèmes aux apprenants,
- suivre les rendus, analyses de performance et dynamiques sociales,
- gérer plusieurs établissements, classes et utilisateurs,
- collaborer avec une logique multi-personas et multi-établissements.

**SMSO est 100% front pour l’instant** (mode démo), avec une architecture légère, modulaire, évolutive et prête à être branchée à un backend futur.

---

# ✨ Fonctionnalités principales (mode démo)

## 👩‍🏫 Enseignants : Création & Diffusion

### 🎨 AI Theme Studio
- Génération mock de quiz, flashcards et fiches.
- Éditeur visuel clair et ergonomique.
- Choix de la matière, du niveau, des formats.
- Enregistrement de brouillons.
- Soumission du thème à la qualité.

### 📚 Bibliothèque pédagogique
- Recherche avancée par matière, niveau, tags.
- Filtres (formats, popularité, notes).
- Import vers Curriculum Builder ou AI Theme Studio.
- Notation et commentaires des contenus (mock).

### 🗂 Curriculum Builder
- Organisation par classes et périodes (P1, P2…).
- Assignation des thèmes publiés.
- Vue globale et par matière.

### 📝 Assignations de thèmes & Devoirs
- Définition de dates (startAt, endAt, dueAt).
- Publication instantanée aux élèves.

---

## 🎓 Élèves : Réception & Apprentissage

### 🎯 Mes Thèmes (vue unifiée)
- À faire / En cours.
- Annales (mode post-dueAt).
- Consultation détaillée des cours.

### 🧪 Entraînement
- Mode entraînement en amont du devoir.
- Feedback immédiat.
- Pas d’impact sur les notes.

### 📝 Rendu de devoirs
- Bouton *“Marquer comme fait (démo)”*.
- Note générée automatiquement (mock).
- Passage automatique en mode Annales.

### 🫂 Social
- Classement entre amis (UUID).
- Statistiques : “Tu as répondu plus vite que…”
- Visualisation via Chart.js (progression, comparaisons).

---

## 👨‍💼 Direction & Administratif

### 🧭 Multi-Établissements
- Sélecteur d’établissement (SchoolSwitcher).
- Filtrage automatique des écrans selon l’établissement actif.
- Support multi-tenant simulé.

### 🗃 Administration
- Gestion des établissements (mock).
- Création / modification des classes.
- Gestion des utilisateurs.

### 📊 Analytics établissement
- Performances globales.
- Comparaison entre établissements.
- Distribution des scores via Chart.js.

---

## 🎛 Référent Pédagogique (Qualité & Cohérence)

### 🧹 Workflow Qualité complet
- Thèmes soumis par enseignants.
- Lecture du contenu (quiz, flashcards, fiches).
- Validation / rejet / demande de révision.
- Log automatique des actions.

### 🌐 Curriculum global
- Vue consolidée par matières et classes.
- Couverture du curriculum.
- Suivi des périodes et équilibres pédagogiques.

---

# 🕒 Timeline – Historique global

Chaque persona possède sa Timeline :

- actions enseignant (créations, publications),
- actions élève (rendus, entraînements),
- actions qualité (validation/rejet),
- actions direction (administration, analytics),
- événements système.

Tout est mocké mais crédible pour une démo complète.

---

# 🧱 Architecture du projet

Architecture **Vanilla JS ES Modules**, inspirée d’ErgoMate :

```
studymate-orchestrator/
├── index.html
├── style.css
├── backend/
├── js/
│   ├── app.js
│   ├── router.js
│   ├── components/
│   │     ├── TopNav.js
│   │     ├── Sidebar.js
│   │     ├── SchoolSwitcher.js
│   │     └── ChartFactory.js
│   ├── features-view/
│   ├── features-control/
│   │     ├── stores/
│   │     │   ├── store-auth.js
│   │     │   ├── store-themes.js
│   │     │   ├── store-library.js
│   │     │   ├── store-multischool.js
│   │     │   ├── store-class-theme-assignments.js
│   │     │   ├── store-submissions.js
│   │     │   ├── store-curriculum.js
│   │     │   ├── store-social.js
│   │     │   └── store-timeline.js
│   │     └── controllers
│   └── FakeRouter
└── assets/
```

---

# 📡 API factice (FakeAPI)

Tous les endpoints sont mockés et documentés ici :

👉 `API_FAKE_SPEC.md`

Principe :
- Pas d’appels réseau.
- Chaque “endpoint” correspond à une opération dans un Store JS.
- Le design imite une API REST moderne pour préparer un backend réel.

---

# 🧭 Navigation & Personas

👉 Voir `navigation_redesign.md`.

### Élève
- Dashboard  
- Mes thèmes (tabs)  
- Social  
- Timeline  

### Enseignant
- Dashboard  
- Contenus & Curriculum (sidebar)  
- Suivi des élèves (sidebar)  
- Timeline  

### Direction
- Dashboard  
- Administration (sidebar)  
- Analytics (sidebar)  
- Timeline  

### Directeur pédagogique
- Dashboard  
- Qualité  
- Curriculum  
- Timeline  

---

# 🧩 User Journeys

👉 Voir `USER_JOURNEYS.md`.

---

# 🧪 Développement local

```bash
npx serve
# ou
python -m http.server 8000
```

---

# 🎯 Roadmap

### Phase 1 – Démo complète - Donnée mockées 
- IA  
- Qualité  
- Curriculum  
- Assignations  
- Social  
- Timeline  
- Multi-Établissements  

### Phase 2 – Backend réel  
- Auth JWT  
- API REST  
- Multi-tenant DB  

### Phase 3 – Intégration ErgoMate  
- Sync thèmes  
- Analytics combinées  

---

# 👨‍💼 Auteur

**Mehdy Driouech**  
Engineering Manager, Consultant technique & Formateur  
🌐 www.mehdydriouech.fr 
🌐 dawpengineering.com
