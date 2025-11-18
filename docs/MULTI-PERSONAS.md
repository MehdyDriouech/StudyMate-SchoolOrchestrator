# 🎭 Guide Multi-Personas - StudyMate School Orchestrator

## ✅ Fonctionnalités implémentées

### Système d'authentification

**3 personas avec login/password fixes :**

1. **Enseignant** (`enseignant@ecole.fr` / `smso01**`)
2. **Directeur** (`directeur@ecole.fr` / `smso01**`)
3. **Étudiant** (`etudiant@ecole.fr` / `smso01**`)

**Mode démo** : Bouton "Découvrir la démo" → Connexion automatique en tant qu'enseignant générique

### Fichiers modifiés

- ✅ `feature-auth.js` - Gestion multi-personas avec base d'utilisateurs
- ✅ `view-auth.js` - Formulaire actif + affichage identifiants test
- ✅ `app.js` - Routing étendu + redirection selon rôle
- ✅ `TopNav.js` - Navigation adaptée au rôle

### Nouveaux fichiers créés

**Dashboard Directeur :**
- ✅ `feature-dashboard-director.js` - Logique + mocks
- ✅ `view-dashboard-director.js` - Interface complète

**Dashboard Étudiant :**
- ✅ `feature-dashboard-student.js` - Logique + générateur UUID
- ✅ `view-dashboard-student.js` - Interface + progression

**Curriculum Builder :**
- ✅ `feature-curriculum-builder.js` - Données mockées périodes/séquences
- ✅ `view-curriculum-builder.js` - Vue Kanban simplifiée

---

## 🎯 Scénarios de test

### 📝 Scénario 1 : Login Enseignant

**Steps :**
1. Ouvrir `http://localhost:8080`
2. Saisir : `enseignant@ecole.fr` / `smso01**`
3. Cliquer sur "Se connecter"

**Résultat attendu :**
- ✅ Redirection vers `/#dashboard-teacher`
- ✅ Badge "Mode Démo" absent (connexion réelle)
- ✅ Navigation : Dashboard, Curriculum, Catalogue, Qualité
- ✅ Affichage des KPIs (245 élèves, 8 classes, etc.)
- ✅ Devoirs urgents visibles
- ✅ Timeline d'activité (factice, 4 événements récents)
- ✅ Notification : "Vous avez 2 devoirs qui arrivent à échéance dans les 3 prochains jours"
- ✅ Accès au Curriculum Builder depuis la navigation

**Navigation disponible :**
- 📊 Dashboard
- 📚 Curriculum → Vue Kanban avec 3 périodes
- 🗂️ Catalogue → Stub
- ✅ Qualité → Stub
- 🚪 Déconnexion

---

### 👔 Scénario 2 : Login Directeur

**Steps :**
1. Ouvrir `http://localhost:8080`
2. Saisir : `directeur@ecole.fr` / `smso01**`
3. Cliquer sur "Se connecter"

**Résultat attendu :**
- ✅ Redirection vers `/#dashboard-director`
- ✅ KPIs : 6 classes, 5 enseignants, 52.8% complétion, 11 validations
- ✅ Tableau comparatif classes avec :
  - Nom classe, taux complétion, séquences en retard, moyenne, enseignant
  - 6 classes affichées
  - Codes couleur selon performance
- ✅ Tableau performance enseignants :
  - Nom, nb classes, complétion moyenne, validations pendantes, temps réponse
  - 5 enseignants
- ✅ Timeline d'activité macro (4 événements)
- ✅ 2 boutons d'actions rapides visibles

**Actions disponibles :**

**Bouton "Ajouter un établissement" :**
1. Clic → Modale s'ouvre
2. Formulaire : Nom, Ville, Type (dropdown)
3. Validation client (champs requis)
4. Soumission → Alert "Établissement ajouté (démo)"
5. Fermeture modale

**Bouton "Ajouter un utilisateur" :**
1. Clic → Modale s'ouvre
2. Formulaire : Nom, Email, Rôle (dropdown : enseignant/directeur/étudiant), Classes
3. Validation client
4. Soumission → Alert "Utilisateur créé (démo)"
5. Fermeture modale

**Navigation disponible :**
- 📊 Dashboard
- ⚙️ Administration → Stub
- ✅ Qualité → Stub
- 🗂️ Catalogue → Stub
- 🚪 Déconnexion

---

### 🎓 Scénario 3 : Login Étudiant

**Steps :**
1. Ouvrir `http://localhost:8080`
2. Saisir : `etudiant@ecole.fr` / `smso01**`
3. Cliquer sur "Se connecter"

**Résultat attendu :**
- ✅ Redirection vers `/#dashboard-student`
- ✅ 4 statistiques : Devoirs (12/17), Moyenne (14.2), Classement (Top 20%), Série (5 jours)
- ✅ Barre de progression globale : 70%
- ✅ Message encouragement : "Continue comme ça ! Tu es dans le Top 20% de ta classe."

**Section UUID Social :**
- ✅ Carte dédiée avec explication
- ✅ Texte : "Cet identifiant unique te permet de partager tes scores..."
- ✅ Bouton "Générer mon UUID social"

**Test génération UUID :**
1. Clic sur "Générer mon UUID social"
2. UUID affiché : format `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
3. UUID stocké dans `localStorage` (`SM_SO_SOCIAL_UUID`)
4. 2 nouveaux boutons apparaissent :
   - 📋 Copier → Copie UUID dans presse-papier + Alert
   - 🔄 Générer nouveau → Remplace l'UUID

**Devoirs à rendre :**
- ✅ 4 devoirs affichés (todo + in_progress)
- ✅ Informations : Titre, matière, statut, échéance
- ✅ Codes couleur selon priorité (rouge/orange/vert)
- ✅ Format échéance : "Aujourd'hui", "Demain", "Dans X jours"

**Devoirs terminés :**
- ✅ 1 devoir terminé affiché
- ✅ Note visible : 15/20
- ✅ Opacité réduite

**Navigation disponible :**
- 📊 Mon espace
- 🗂️ Contenus → Stub
- 🚪 Déconnexion

---

### 🎭 Scénario 4 : Mode "Découvrir la démo"

**Steps :**
1. Ouvrir `http://localhost:8080`
2. Cliquer sur "Découvrir la démo" (sans saisir d'identifiants)

**Résultat attendu :**
- ✅ `localStorage` : `DEMO_SESSION = "true"`
- ✅ `localStorage` : `SM_SO_USER_ROLE = "teacher"`
- ✅ `localStorage` : `SM_SO_USER_EMAIL = "demo@ecole.fr"`
- ✅ Rechargement automatique de la page
- ✅ Redirection vers dashboard enseignant
- ✅ Badge "🎭 Mode Démo" visible en haut
- ✅ Navigation fonctionnelle comme l'enseignant

---

### 📚 Scénario 5 : Curriculum Builder

**Accès :**
- Login enseignant OU mode démo
- Clic sur "📚 Curriculum" dans la navigation

**Résultat attendu :**
- ✅ Titre : "Curriculum Builder"
- ✅ 3 boutons matières : Mathématiques (actif), Philosophie, Histoire-Géographie
- ✅ Vue Kanban 3 colonnes :
  - **Période 1** (Sept - Oct) : 2 séquences terminées
  - **Période 2** (Nov - Déc) : 1 en cours, 1 planifiée
  - **Période 3** (Jan - Fév) : 2 planifiées
- ✅ Cartes séquences avec :
  - Titre, durée, statut (badge coloré), compétences
  - Effet hover (translateY + shadow)
  - Bordure gauche colorée selon statut
- ✅ Clic sur bouton matière → Change l'état actif (visuel uniquement)
- ✅ Bandeau informatif en bas : "Version simplifiée"

**Données affichées (Mathématiques) :**
1. **Période 1** :
   - Suites numériques (4 sem, terminée)
   - Fonctions de référence (3 sem, terminée)
2. **Période 2** :
   - Dérivation (4 sem, en cours)
   - Fonctions exponentielles (3 sem, planifiée)
3. **Période 3** :
   - Probabilités conditionnelles (4 sem, planifiée)
   - Primitives et intégration (5 sem, planifiée)

---

## 🔍 Points de vérification

### Console développeur (F12)

**Au chargement :**
```
[App] Initialisation de StudyMate School Orchestrator v0.1.0-mvp
[TopNav] ✅ Navigation initialisée pour le rôle: teacher
[App] ✅ Initialisation terminée
```

**Lors d'un login :**
```
[View Auth] Clic sur formulaire
[Auth] Tentative de connexion: enseignant@ecole.fr
[Auth] ✅ Connexion réussie - teacher
[Router] Navigation vers: dashboard-teacher
```

**Génération UUID :**
```
[Dashboard Student] UUID social sauvegardé: 7a3f2c89-...
```

### localStorage (onglet Application)

**Après login enseignant :**
- `SM_SO_USER_ROLE = "teacher"`
- `SM_SO_USER_EMAIL = "enseignant@ecole.fr"`

**Après login directeur :**
- `SM_SO_USER_ROLE = "director"`
- `SM_SO_USER_EMAIL = "directeur@ecole.fr"`

**Après login étudiant :**
- `SM_SO_USER_ROLE = "student"`
- `SM_SO_USER_EMAIL = "etudiant@ecole.fr"`
- `SM_SO_SOCIAL_UUID = "uuid-généré"` (après génération)

**Mode démo :**
- `STUDYMATE_DEMO_SESSION = "true"`
- `SM_SO_USER_ROLE = "teacher"`
- `SM_SO_USER_EMAIL = "demo@ecole.fr"`

---

## 🚪 Déconnexion

**Depuis n'importe quel dashboard :**
1. Clic sur "🚪 Déconnexion"
2. Confirmation : "Voulez-vous vraiment vous déconnecter ?"
3. Clic sur "OK"

**Résultat :**
- ✅ Nettoyage complet de `localStorage`
- ✅ Rechargement de la page
- ✅ Retour à l'écran d'authentification

---

## 🔄 Navigation entre vues

**Depuis dashboard enseignant :**
- Curriculum → Vue Kanban fonctionnelle
- Catalogue → Stub "en construction"
- Qualité → Stub "en construction"

**Depuis dashboard directeur :**
- Administration → Stub "en construction"
- Qualité → Stub "en construction"
- Catalogue → Stub "en construction"

**Depuis dashboard étudiant :**
- Contenus → Stub "en construction"

---

## 💡 Tips de démonstration

### Enchaînement idéal

1. **Démo mode démo** (rapide)
   - Montrer le bouton "Découvrir la démo"
   - Expliquer : connexion sans identifiants
   - Dashboard enseignant s'affiche

2. **Démo login enseignant** (détaillée)
   - Se déconnecter
   - Login `enseignant@ecole.fr`
   - Dashboard complet
   - Navigation vers Curriculum Builder

3. **Démo login directeur** (gestion)
   - Se déconnecter
   - Login `directeur@ecole.fr`
   - Comparatif classes
   - Ajouter un établissement
   - Ajouter un utilisateur

4. **Démo login étudiant** (engagement)
   - Se déconnecter
   - Login `etudiant@ecole.fr`
   - Progression
   - Génération UUID social

### Messages clés

- **Multi-tenant** : Chaque persona a sa propre vue adaptée
- **Front-only** : Tout fonctionne sans backend (démo)
- **Extensible** : Architecture modulaire prête pour prod
- **Responsive** : Fonctionne sur mobile (burger menu)

---

## 🐛 Troubleshooting

**Erreur "Vue inconnue" :**
→ Vérifier que tous les fichiers JS sont chargés (F12 > Network)

**Navigation ne fonctionne pas :**
→ Vérifier `localStorage` (supprimer tout et recharger)

**UUID ne se génère pas :**
→ Vérifier console, fallback utilisé si `crypto` indisponible

**Formulaires ne s'ouvrent pas :**
→ Vérifier console, erreur JS possible

---

## 📊 Statistiques finales

**Fichiers créés/modifiés :**
- 4 fichiers modifiés (auth, app, topnav)
- 6 fichiers créés (dashboards + curriculum)
- Total : 10 fichiers touchés

**Lignes de code ajoutées :**
- ~2000 lignes de code JavaScript
- ~500 lignes de HTML inline
- 100% Vanilla JS, 0 dépendance

**Features complètes :**
- 3 personas fonctionnels
- 3 dashboards dédiés
- 1 curriculum builder visuel
- 1 système UUID social
- Navigation adaptative

---

**Version** : 0.2.0-multi-personas  
**Date** : Novembre 2024  
**Statut** : ✅ Prêt pour démo multi-personas
