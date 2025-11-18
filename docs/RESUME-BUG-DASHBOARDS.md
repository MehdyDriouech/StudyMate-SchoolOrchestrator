# 🐛 Bug Report - Dashboards ne s'affichent pas

## Symptôme
Lorsque vous vous connectez avec les identifiants de démo pour **directeur** ou **étudiant**, vous voyez :
> "Vue "dashboard-nomdudashboard" en construction / Cette fonctionnalité sera disponible prochainement."

## Cause racine
**Erreur de nommage des fonctions JavaScript** dans deux fichiers :

| Fichier | Fonction actuelle (❌ incorrecte) | Fonction attendue (✅ correcte) |
|---------|----------------------------------|--------------------------------|
| `view-dashboard-director.js` | `renderDashboarddirectorView` | `renderDashboardDirectorView` |
| `view-dashboard-student.js` | `renderDashboardstudentView` | `renderDashboardStudentView` |

Le problème : les lettres `d` et `s` sont en minuscule après "Dashboard", alors qu'elles devraient être en majuscule (convention PascalCase).

## Solution rapide

### Option 1 : Remplacer les fichiers
1. Téléchargez les fichiers corrigés ci-dessous
2. Remplacez-les dans votre projet à l'emplacement :
   ```
   js/features/features-view/view-dashboard-director.js
   js/features/features-view/view-dashboard-student.js
   ```
3. Rechargez l'application dans votre navigateur

### Option 2 : Correction manuelle
Ouvrez chaque fichier et effectuez un **Rechercher/Remplacer** :

**Dans `view-dashboard-director.js` :**
- Rechercher : `renderDashboarddirectorView`
- Remplacer par : `renderDashboardDirectorView`
- (3 occurrences aux lignes 26, 672, 674)

**Dans `view-dashboard-student.js` :**
- Rechercher : `renderDashboardstudentView`
- Remplacer par : `renderDashboardStudentView`
- (3 occurrences aux lignes 28, 481, 483)

## Test de validation

Après correction, testez avec les identifiants :

```
Directeur  : directeur@ecole.fr  / smso01**
Étudiant   : etudiant@ecole.fr   / smso01**
```

Vous devriez maintenant voir :
- ✅ Dashboard directeur avec graphiques et tableaux comparatifs
- ✅ Dashboard étudiant avec progression et UUID social

## Pourquoi ce bug s'est produit ?

C'est une erreur classique de **typo/casse** qui survient lors de :
- Copier-coller de code
- Complétion automatique mal formatée
- Absence de vérification par linter ESLint

## Prévention future

Ajoutez dans votre `.eslintrc.json` :
```json
{
  "rules": {
    "camelcase": ["error", { "properties": "always" }]
  }
}
```

Ou utilisez un naming checker pour détecter automatiquement ce type d'incohérence.

---

**Fichiers fournis :**
- ✅ `view-dashboard-director.js` (corrigé)
- ✅ `view-dashboard-student.js` (corrigé)
- 📄 `CORRECTIFS-DASHBOARDS.md` (détails techniques)
