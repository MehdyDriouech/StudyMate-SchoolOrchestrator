/**
 * Store Campus Admin - Gestion des données pour l'administrateur campus
 */

// Données mockées pour les établissements
let MOCK_SCHOOLS = [
  {
    id: 1,
    name: 'Lycée Hoche',
    code: 'IFER-VER',
    address: '73 avenue de Saint-Cloud',
    city: 'Versailles',
    postal_code: '78000',
    country: 'FR',
    is_active: true,
    created_at: '2024-09-01T08:00:00Z',
    updated_at: '2024-12-15T10:30:00Z',
    stats: {
      users_count: 145,
      classes_count: 12,
      students_count: 320
    }
  },
  {
    id: 2,
    name: 'Lycée Condorcet',
    code: 'IFER-CON',
    address: '12 rue de la République',
    city: 'Paris',
    postal_code: '75010',
    country: 'FR',
    is_active: true,
    created_at: '2024-09-05T09:00:00Z',
    updated_at: '2024-12-10T14:20:00Z',
    stats: {
      users_count: 98,
      classes_count: 8,
      students_count: 210
    }
  },
  {
    id: 3,
    name: 'Collège Victor Hugo',
    code: 'IFER-VHU',
    address: '45 boulevard des Invalides',
    city: 'Lyon',
    postal_code: '69007',
    country: 'FR',
    is_active: true,
    created_at: '2024-10-01T10:00:00Z',
    updated_at: '2024-12-08T11:15:00Z',
    stats: {
      users_count: 67,
      classes_count: 6,
      students_count: 180
    }
  },
  {
    id: 4,
    name: 'Lycée Montpellier',
    code: 'IFER-MPL',
    address: '8 avenue du Général de Gaulle',
    city: 'Montpellier',
    postal_code: '34000',
    country: 'FR',
    is_active: false,
    created_at: '2024-08-15T07:00:00Z',
    updated_at: '2024-11-20T16:45:00Z',
    stats: {
      users_count: 0,
      classes_count: 0,
      students_count: 0
    }
  }
];

// Données mockées pour les utilisateurs
let MOCK_USERS = [
  {
    id: 1,
    first_name: 'Claire',
    last_name: 'Dupont',
    email: 'directeur@ecole.fr',
    role: 'director',
    school_id: 1,
    status: 'active',
    created_at: '2024-09-01T08:00:00Z',
    school_name: 'Lycée Hoche'
  },
  {
    id: 2,
    first_name: 'Martin',
    last_name: 'Bernard',
    email: 'enseignant@ecole.fr',
    role: 'teacher',
    school_id: 1,
    status: 'active',
    created_at: '2024-09-02T09:00:00Z',
    school_name: 'Lycée Hoche'
  },
  {
    id: 3,
    first_name: 'Sophie',
    last_name: 'Leroy',
    email: 'etudiant@ecole.fr',
    role: 'student',
    school_id: 1,
    status: 'active',
    created_at: '2024-09-03T10:00:00Z',
    school_name: 'Lycée Hoche'
  },
  {
    id: 4,
    first_name: 'Pierre',
    last_name: 'Dubois',
    email: 'directeur.condorcet@ecole.fr',
    role: 'director',
    school_id: 2,
    status: 'active',
    created_at: '2024-09-05T09:00:00Z',
    school_name: 'Lycée Condorcet'
  },
  {
    id: 5,
    first_name: 'Marie',
    last_name: 'Petit',
    email: 'pedago@ecole.fr',
    role: 'pedago',
    school_id: 1,
    status: 'active',
    created_at: '2024-09-04T11:00:00Z',
    school_name: 'Lycée Hoche'
  },
  {
    id: 6,
    first_name: 'Jean',
    last_name: 'Martin',
    email: 'jean.martin@condorcet.fr',
    role: 'teacher',
    school_id: 2,
    status: 'inactive',
    created_at: '2024-09-06T08:00:00Z',
    school_name: 'Lycée Condorcet'
  }
];

// Données mockées pour les imports
let MOCK_IMPORTS = [
  {
    id: 1,
    type: 'users_students',
    file_name: 'etudiants_septembre_2024.csv',
    status: 'completed',
    created_by: 1,
    created_at: '2024-09-15T14:30:00Z',
    updated_at: '2024-09-15T14:35:00Z',
    summary: {
      total: 150,
      success: 148,
      errors: 2,
      errors_list: [
        { line: 23, email: 'invalid.email', reason: 'Format email invalide' },
        { line: 67, email: 'duplicate@example.com', reason: 'Email déjà existant' }
      ]
    }
  },
  {
    id: 2,
    type: 'users_teachers',
    file_name: 'enseignants_rentree_2024.csv',
    status: 'completed',
    created_by: 1,
    created_at: '2024-09-10T10:00:00Z',
    updated_at: '2024-09-10T10:05:00Z',
    summary: {
      total: 25,
      success: 25,
      errors: 0
    }
  },
  {
    id: 3,
    type: 'users_students',
    file_name: 'nouveaux_etudiants_octobre.csv',
    status: 'running',
    created_by: 1,
    created_at: '2024-10-05T09:00:00Z',
    updated_at: '2024-10-05T09:00:00Z',
    summary: {
      total: 80,
      processed: 45,
      success: 43,
      errors: 2
    }
  },
  {
    id: 4,
    type: 'users_students',
    file_name: 'import_erreur.csv',
    status: 'failed',
    created_by: 1,
    created_at: '2024-10-01T08:00:00Z',
    updated_at: '2024-10-01T08:02:00Z',
    summary: {
      total: 50,
      success: 0,
      errors: 50,
      errors_list: [
        { line: 1, reason: 'Format de fichier invalide' }
      ]
    }
  }
];

// Données mockées pour les paramètres globaux
let MOCK_SETTINGS = {
  feature_social_enabled: true,
  feature_ai_theme_studio_enabled: true,
  feature_demo_mode_enabled: false,
  data_retention_years: 5
};

// Données mockées pour les logs d'audit
let MOCK_AUDIT_LOGS = [
  {
    id: 1,
    user_id: 1,
    user_name: 'Administrateur Campus',
    action: 'CREATE_SCHOOL',
    entity_type: 'school',
    entity_id: 3,
    metadata: { name: 'Collège Victor Hugo', code: 'IFER-VHU' },
    created_at: '2024-10-01T10:00:00Z'
  },
  {
    id: 2,
    user_id: 1,
    user_name: 'Administrateur Campus',
    action: 'CREATE_USER',
    entity_type: 'user',
    entity_id: 5,
    metadata: { email: 'pedago@ecole.fr', role: 'pedago' },
    created_at: '2024-09-04T11:00:00Z'
  },
  {
    id: 3,
    user_id: 1,
    user_name: 'Administrateur Campus',
    action: 'UPDATE_SETTINGS',
    entity_type: 'settings',
    entity_id: null,
    metadata: { 
      changed: ['feature_social_enabled'],
      old: { feature_social_enabled: false },
      new: { feature_social_enabled: true }
    },
    created_at: '2024-11-15T14:20:00Z'
  },
  {
    id: 4,
    user_id: 1,
    user_name: 'Administrateur Campus',
    action: 'IMPORT_USERS',
    entity_type: 'import',
    entity_id: 1,
    metadata: { type: 'users_students', count: 150 },
    created_at: '2024-09-15T14:35:00Z'
  },
  {
    id: 5,
    user_id: 1,
    user_name: 'Administrateur Campus',
    action: 'UPDATE_SCHOOL',
    entity_type: 'school',
    entity_id: 1,
    metadata: { 
      changed: ['is_active'],
      old: { is_active: false },
      new: { is_active: true }
    },
    created_at: '2024-12-15T10:30:00Z'
  },
  {
    id: 6,
    user_id: 1,
    user_name: 'Administrateur Campus',
    action: 'DELETE_USER',
    entity_type: 'user',
    entity_id: 7,
    metadata: { email: 'ancien.user@ecole.fr', reason: 'Départ' },
    created_at: '2024-11-20T16:00:00Z'
  }
];

/**
 * Récupère toutes les statistiques pour le dashboard
 */
export function getCampusAdminStats() {
  const totalSchools = MOCK_SCHOOLS.length;
  const activeSchools = MOCK_SCHOOLS.filter(s => s.is_active).length;
  const totalUsers = MOCK_USERS.length;
  const activeUsers = MOCK_USERS.filter(u => u.status === 'active').length;
  const totalClasses = MOCK_SCHOOLS.reduce((sum, s) => sum + (s.stats?.classes_count || 0), 0);
  const totalStudents = MOCK_SCHOOLS.reduce((sum, s) => sum + (s.stats?.students_count || 0), 0);
  const recentImports = MOCK_IMPORTS.filter(i => {
    const date = new Date(i.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date > weekAgo;
  }).length;
  const pendingImports = MOCK_IMPORTS.filter(i => i.status === 'pending' || i.status === 'running').length;
  
  return {
    total_schools: totalSchools,
    active_schools: activeSchools,
    total_users: totalUsers,
    active_users: activeUsers,
    total_classes: totalClasses,
    total_students: totalStudents,
    recent_imports: recentImports,
    pending_imports: pendingImports
  };
}

/**
 * Récupère tous les établissements
 */
export function getAllSchools() {
  return [...MOCK_SCHOOLS];
}

/**
 * Récupère un établissement par ID
 */
export function getSchoolById(id) {
  return MOCK_SCHOOLS.find(s => s.id === id);
}

/**
 * Crée un nouvel établissement
 */
export function createSchool(schoolData) {
  const newSchool = {
    id: MOCK_SCHOOLS.length + 1,
    name: schoolData.name,
    code: schoolData.code,
    address: schoolData.address || null,
    city: schoolData.city || null,
    postal_code: schoolData.postal_code || null,
    country: schoolData.country || 'FR',
    is_active: schoolData.is_active !== undefined ? schoolData.is_active : true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stats: {
      users_count: 0,
      classes_count: 0,
      students_count: 0
    }
  };
  
  MOCK_SCHOOLS.push(newSchool);
  
  // Ajouter un log d'audit
  addAuditLog('CREATE_SCHOOL', 'school', newSchool.id, { name: newSchool.name, code: newSchool.code });
  
  return newSchool;
}

/**
 * Met à jour un établissement
 */
export function updateSchool(id, schoolData) {
  const school = MOCK_SCHOOLS.find(s => s.id === id);
  if (!school) return null;
  
  const oldData = { ...school };
  Object.assign(school, schoolData, { updated_at: new Date().toISOString() });
  
  // Ajouter un log d'audit
  const changed = Object.keys(schoolData).filter(key => oldData[key] !== school[key]);
  if (changed.length > 0) {
    addAuditLog('UPDATE_SCHOOL', 'school', id, {
      changed,
      old: Object.fromEntries(changed.map(k => [k, oldData[k]])),
      new: Object.fromEntries(changed.map(k => [k, school[k]]))
    });
  }
  
  return school;
}

/**
 * Supprime (désactive) un établissement
 */
export function deleteSchool(id) {
  const school = MOCK_SCHOOLS.find(s => s.id === id);
  if (!school) return false;
  
  school.is_active = false;
  school.updated_at = new Date().toISOString();
  
  // Ajouter un log d'audit
  addAuditLog('DELETE_SCHOOL', 'school', id, { name: school.name });
  
  return true;
}

/**
 * Récupère tous les utilisateurs avec filtres optionnels
 */
export function getAllUsers(filters = {}) {
  let users = [...MOCK_USERS];
  
  if (filters.role) {
    users = users.filter(u => u.role === filters.role);
  }
  
  if (filters.school_id) {
    users = users.filter(u => u.school_id === filters.school_id);
  }
  
  if (filters.status) {
    users = users.filter(u => u.status === filters.status);
  }
  
  if (filters.search) {
    const search = filters.search.toLowerCase();
    users = users.filter(u => 
      u.email.toLowerCase().includes(search) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(search)
    );
  }
  
  return users;
}

/**
 * Récupère un utilisateur par ID
 */
export function getUserById(id) {
  return MOCK_USERS.find(u => u.id === id);
}

/**
 * Crée un nouvel utilisateur
 */
export function createUser(userData) {
  const school = MOCK_SCHOOLS.find(s => s.id === userData.school_id);
  
  const newUser = {
    id: MOCK_USERS.length + 1,
    first_name: userData.first_name,
    last_name: userData.last_name,
    email: userData.email,
    role: userData.role,
    school_id: userData.school_id,
    status: 'active',
    created_at: new Date().toISOString(),
    school_name: school?.name || 'Inconnu'
  };
  
  MOCK_USERS.push(newUser);
  
  // Mettre à jour les stats de l'école
  if (school) {
    school.stats.users_count = (school.stats.users_count || 0) + 1;
  }
  
  // Ajouter un log d'audit
  addAuditLog('CREATE_USER', 'user', newUser.id, { email: newUser.email, role: newUser.role });
  
  return newUser;
}

/**
 * Met à jour un utilisateur
 */
export function updateUser(id, userData) {
  const user = MOCK_USERS.find(u => u.id === id);
  if (!user) return null;
  
  const oldData = { ...user };
  Object.assign(user, userData);
  
  // Mettre à jour le nom de l'école si school_id a changé
  if (userData.school_id && userData.school_id !== oldData.school_id) {
    const school = MOCK_SCHOOLS.find(s => s.id === userData.school_id);
    user.school_name = school?.name || 'Inconnu';
  }
  
  // Ajouter un log d'audit
  const changed = Object.keys(userData).filter(key => oldData[key] !== user[key]);
  if (changed.length > 0) {
    addAuditLog('UPDATE_USER', 'user', id, {
      changed,
      old: Object.fromEntries(changed.map(k => [k, oldData[k]])),
      new: Object.fromEntries(changed.map(k => [k, user[k]]))
    });
  }
  
  return user;
}

/**
 * Supprime (désactive) un utilisateur
 */
export function deleteUser(id) {
  const user = MOCK_USERS.find(u => u.id === id);
  if (!user) return false;
  
  user.status = 'inactive';
  
  // Ajouter un log d'audit
  addAuditLog('DELETE_USER', 'user', id, { email: user.email });
  
  return true;
}

/**
 * Récupère tous les imports
 */
export function getAllImports() {
  return [...MOCK_IMPORTS].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * Récupère un import par ID
 */
export function getImportById(id) {
  return MOCK_IMPORTS.find(i => i.id === id);
}

/**
 * Crée un nouvel import
 */
export function createImport(importData) {
  const newImport = {
    id: MOCK_IMPORTS.length + 1,
    type: importData.type,
    file_name: importData.file_name || null,
    status: 'pending',
    created_by: 1, // ID de l'admin campus
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    summary: null
  };
  
  MOCK_IMPORTS.push(newImport);
  
  // Simuler le traitement de l'import
  setTimeout(() => {
    processImport(newImport.id, importData.users || []);
  }, 1000);
  
  return newImport;
}

/**
 * Traite un import (simulation)
 */
function processImport(importId, users) {
  const importItem = MOCK_IMPORTS.find(i => i.id === importId);
  if (!importItem) return;
  
  importItem.status = 'running';
  importItem.updated_at = new Date().toISOString();
  
  // Simuler le traitement
  setTimeout(() => {
    const success = users.length - 2; // Simuler 2 erreurs
    const errors = 2;
    
    importItem.status = success > 0 ? 'completed' : 'failed';
    importItem.summary = {
      total: users.length,
      success,
      errors,
      errors_list: errors > 0 ? [
        { line: 5, email: users[4]?.email, reason: 'Format email invalide' },
        { line: 12, email: users[11]?.email, reason: 'Email déjà existant' }
      ] : []
    };
    importItem.updated_at = new Date().toISOString();
    
    // Ajouter un log d'audit
    addAuditLog('IMPORT_USERS', 'import', importId, { type: importItem.type, count: users.length });
  }, 2000);
}

/**
 * Récupère les paramètres globaux
 */
export function getSettings() {
  return { ...MOCK_SETTINGS };
}

/**
 * Met à jour les paramètres globaux
 */
export function updateSettings(settings) {
  const oldSettings = { ...MOCK_SETTINGS };
  Object.assign(MOCK_SETTINGS, settings);
  
  // Ajouter un log d'audit
  const changed = Object.keys(settings);
  addAuditLog('UPDATE_SETTINGS', 'settings', null, {
    changed,
    old: Object.fromEntries(changed.map(k => [k, oldSettings[k]])),
    new: Object.fromEntries(changed.map(k => [k, MOCK_SETTINGS[k]]))
  });
  
  return { ...MOCK_SETTINGS };
}

/**
 * Récupère les logs d'audit avec filtres optionnels
 */
export function getAuditLogs(filters = {}) {
  let logs = [...MOCK_AUDIT_LOGS];
  
  if (filters.action) {
    logs = logs.filter(l => l.action === filters.action);
  }
  
  if (filters.user_id) {
    logs = logs.filter(l => l.user_id === filters.user_id);
  }
  
  if (filters.entity_type) {
    logs = logs.filter(l => l.entity_type === filters.entity_type);
  }
  
  if (filters.date_from) {
    logs = logs.filter(l => new Date(l.created_at) >= new Date(filters.date_from));
  }
  
  if (filters.date_to) {
    logs = logs.filter(l => new Date(l.created_at) <= new Date(filters.date_to));
  }
  
  // Trier par date décroissante
  logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  return logs;
}

/**
 * Ajoute un log d'audit
 */
function addAuditLog(action, entityType, entityId, metadata) {
  const newLog = {
    id: MOCK_AUDIT_LOGS.length + 1,
    user_id: 1, // ID de l'admin campus
    user_name: 'Administrateur Campus',
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
    created_at: new Date().toISOString()
  };
  
  MOCK_AUDIT_LOGS.unshift(newLog); // Ajouter au début
  
  // Limiter à 1000 logs
  if (MOCK_AUDIT_LOGS.length > 1000) {
    MOCK_AUDIT_LOGS = MOCK_AUDIT_LOGS.slice(0, 1000);
  }
}

export default {
  getCampusAdminStats,
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllImports,
  getImportById,
  createImport,
  getSettings,
  updateSettings,
  getAuditLogs
};

