/**
 * Store Multi-Établissements - Gestion centralisée des établissements
 */

const STORAGE_ACTIVE_SCHOOL = 'SM_SO_ACTIVE_SCHOOL_ID';

// Données mockées pour les établissements
const INITIAL_SCHOOLS = {
  "school_01": {
    id: "school_01",
    name: "Lycée Saint-Charles",
    city: "Montpellier",
    address: "15 avenue de la République, 34000 Montpellier",
    director: "Claire Dupont",
    classes: [
      { id: 'class_term_s1', name: 'Terminale S1', track: 'Scientifique', year: 'Terminale', students: 28 },
      { id: 'class_term_l', name: 'Terminale L', track: 'Littéraire', year: 'Terminale', students: 25 },
      { id: 'class_prem_es2', name: 'Première ES2', track: 'Économique & social', year: 'Première', students: 32 },
      { id: 'class_seconde4', name: 'Seconde 4', track: 'Générale', year: 'Seconde', students: 27 }
    ],
    teachers: [
      { id: 'user_martin', name: 'Prof. Martin', email: 'martin@ecole.fr', role: 'Enseignant', className: 'Terminale S1', status: 'actif' },
      { id: 'user_dubois', name: 'Prof. Dubois', email: 'dubois@ecole.fr', role: 'Enseignant', className: 'Terminale L', status: 'actif' },
      { id: 'user_bernard', name: 'Prof. Bernard', email: 'bernard@ecole.fr', role: 'Enseignant', className: 'Première ES2', status: 'actif' }
    ],
    students: [
      { id: 'student_001', name: 'Élève Sophie', email: 'sophie@ecole.fr', className: 'Terminale S1', status: 'actif' },
      { id: 'student_002', name: 'Élève Lucas', email: 'lucas@ecole.fr', className: 'Terminale S1', status: 'actif' }
    ],
    themesPublished: [
      { id: 'theme_001', title: 'Suites numériques', subject: 'Mathématiques', publishedAt: '2024-11-10' },
      { id: 'theme_002', title: 'La conscience', subject: 'Philosophie', publishedAt: '2024-11-08' }
    ]
  },
  "school_02": {
    id: "school_02",
    name: "Lycée Condorcet",
    city: "Lyon",
    address: "42 rue de la Paix, 69001 Lyon",
    director: "Marie Martin",
    classes: [
      { id: 'class_term_s2', name: 'Terminale S2', track: 'Scientifique', year: 'Terminale', students: 30 },
      { id: 'class_prem_s1', name: 'Première S1', track: 'Scientifique', year: 'Première', students: 28 },
      { id: 'class_seconde1', name: 'Seconde 1', track: 'Générale', year: 'Seconde', students: 26 }
    ],
    teachers: [
      { id: 'user_petit', name: 'Prof. Petit', email: 'petit@condorcet.fr', role: 'Enseignant', className: 'Terminale S2', status: 'actif' },
      { id: 'user_robert', name: 'Prof. Robert', email: 'robert@condorcet.fr', role: 'Enseignant', className: 'Première S1', status: 'actif' }
    ],
    students: [
      { id: 'student_003', name: 'Élève Emma', email: 'etudiant@condorcet.fr', className: 'Terminale S2', status: 'actif' },
      { id: 'student_004', name: 'Élève Thomas', email: 'thomas@condorcet.fr', className: 'Terminale S2', status: 'actif' }
    ],
    themesPublished: [
      { id: 'theme_003', title: 'Probabilités', subject: 'Mathématiques', publishedAt: '2024-11-12' },
      { id: 'theme_004', title: 'Guerre Froide', subject: 'Histoire-Géographie', publishedAt: '2024-11-09' }
    ]
  }
};

// État interne
let schoolsState = JSON.parse(JSON.stringify(INITIAL_SCHOOLS));

/**
 * Retourne l'ID de l'établissement actif
 * @returns {string}
 */
export function getActiveSchoolId() {
  const stored = localStorage.getItem(STORAGE_ACTIVE_SCHOOL);
  if (stored && schoolsState[stored]) {
    return stored;
  }
  // Par défaut, retourner le premier établissement
  const firstSchoolId = Object.keys(schoolsState)[0];
  if (firstSchoolId) {
    localStorage.setItem(STORAGE_ACTIVE_SCHOOL, firstSchoolId);
    return firstSchoolId;
  }
  return null;
}

/**
 * Définit l'établissement actif
 * @param {string} schoolId - ID de l'établissement
 */
export function setActiveSchoolId(schoolId) {
  if (!schoolsState[schoolId]) {
    console.error('[MultiSchool] Établissement introuvable:', schoolId);
    return;
  }
  localStorage.setItem(STORAGE_ACTIVE_SCHOOL, schoolId);
  console.log('[MultiSchool] Établissement actif changé:', schoolId);
  
  // Déclencher un événement pour notifier les vues
  window.dispatchEvent(new CustomEvent('schoolChanged', { detail: { schoolId } }));
}

/**
 * Retourne l'établissement actif
 * @returns {object|null}
 */
export function getActiveSchool() {
  const schoolId = getActiveSchoolId();
  if (!schoolId) return null;
  return { ...schoolsState[schoolId] };
}

/**
 * Retourne tous les établissements
 * @returns {Array}
 */
export function getAllSchools() {
  return Object.values(schoolsState).map(school => ({
    id: school.id,
    name: school.name,
    city: school.city
  }));
}

/**
 * Retourne les classes de l'établissement actif
 * @returns {Array}
 */
export function getClasses() {
  const school = getActiveSchool();
  if (!school) return [];
  return school.classes.map(cls => ({ ...cls }));
}

/**
 * Retourne les enseignants de l'établissement actif
 * @returns {Array}
 */
export function getTeachers() {
  const school = getActiveSchool();
  if (!school) return [];
  return school.teachers.map(teacher => ({ ...teacher }));
}

/**
 * Retourne les étudiants de l'établissement actif
 * @returns {Array}
 */
export function getStudents() {
  const school = getActiveSchool();
  if (!school) return [];
  return school.students.map(student => ({ ...student }));
}

/**
 * Retourne les thèmes publiés de l'établissement actif
 * @returns {Array}
 */
export function getThemesPublished() {
  const school = getActiveSchool();
  if (!school) return [];
  return school.themesPublished.map(theme => ({ ...theme }));
}

/**
 * Crée une nouvelle classe dans l'établissement actif
 * @param {object} classData - Données de la classe
 * @returns {object}
 */
export function createClass(classData) {
  const schoolId = getActiveSchoolId();
  if (!schoolId) throw new Error('Aucun établissement actif');
  
  const newClass = {
    id: `class_${Date.now()}`,
    name: classData.name,
    track: classData.track || 'Générale',
    year: classData.year || 'Terminale',
    students: Number(classData.students) || 25
  };
  
  schoolsState[schoolId].classes.push(newClass);
  return { ...newClass };
}

/**
 * Met à jour une classe dans l'établissement actif
 * @param {string} classId - ID de la classe
 * @param {object} updates - Modifications
 * @returns {object|null}
 */
export function updateClass(classId, updates) {
  const schoolId = getActiveSchoolId();
  if (!schoolId) return null;
  
  const school = schoolsState[schoolId];
  const classIndex = school.classes.findIndex(c => c.id === classId);
  if (classIndex === -1) return null;
  
  school.classes[classIndex] = { ...school.classes[classIndex], ...updates };
  return { ...school.classes[classIndex] };
}

/**
 * Crée un nouvel utilisateur dans l'établissement actif
 * @param {object} userData - Données de l'utilisateur
 * @returns {object}
 */
export function createUser(userData) {
  const schoolId = getActiveSchoolId();
  if (!schoolId) throw new Error('Aucun établissement actif');
  
  const newUser = {
    id: `user_${Date.now()}`,
    name: userData.name,
    email: userData.email,
    role: userData.role || 'Enseignant',
    className: userData.className || 'Non assigné',
    status: 'actif'
  };
  
  // Ajouter dans la bonne liste selon le rôle
  if (userData.role === 'Étudiant' || userData.role === 'student') {
    schoolsState[schoolId].students.push(newUser);
  } else {
    schoolsState[schoolId].teachers.push(newUser);
  }
  
  return { ...newUser };
}

/**
 * Crée un nouvel établissement
 * @param {object} schoolData - Données de l'établissement
 * @returns {object}
 */
export function createSchool(schoolData) {
  const newSchoolId = `school_${Date.now()}`;
  const newSchool = {
    id: newSchoolId,
    name: schoolData.name || 'Nouvel établissement',
    city: schoolData.city || '',
    address: schoolData.address || '',
    director: schoolData.director || '',
    classes: [],
    teachers: [],
    students: [],
    themesPublished: []
  };
  
  schoolsState[newSchoolId] = newSchool;
  return { ...newSchool };
}

/**
 * Met à jour les informations de l'établissement actif
 * @param {object} updates - Modifications
 * @returns {object}
 */
export function updateSchoolInfo(updates) {
  const schoolId = getActiveSchoolId();
  if (!schoolId) throw new Error('Aucun établissement actif');
  
  schoolsState[schoolId] = {
    ...schoolsState[schoolId],
    ...updates
  };
  
  return { ...schoolsState[schoolId] };
}

/**
 * Retourne les informations de l'établissement actif (format compatible avec feature-admin)
 * @returns {object}
 */
export function getSchoolInfo() {
  const school = getActiveSchool();
  if (!school) {
    return {
      name: 'Établissement inconnu',
      address: '',
      director: '',
      classesCount: 0,
      studentsCount: 0
    };
  }
  
  return {
    name: school.name,
    address: school.address,
    director: school.director,
    classesCount: school.classes.length,
    studentsCount: school.classes.reduce((sum, c) => sum + (c.students || 0), 0)
  };
}

/**
 * Retourne tous les utilisateurs de l'établissement actif (format compatible avec feature-admin)
 * @returns {Array}
 */
export function getUsers() {
  const school = getActiveSchool();
  if (!school) return [];
  
  return [
    ...school.teachers.map(t => ({ ...t })),
    ...school.students.map(s => ({ ...s, role: 'Étudiant' }))
  ];
}

/**
 * Active/désactive un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {object|null}
 */
export function toggleUserStatus(userId) {
  const schoolId = getActiveSchoolId();
  if (!schoolId) return null;
  
  const school = schoolsState[schoolId];
  
  // Chercher dans les enseignants
  let user = school.teachers.find(u => u.id === userId);
  if (user) {
    user.status = user.status === 'actif' ? 'désactivé' : 'actif';
    return { ...user };
  }
  
  // Chercher dans les étudiants
  user = school.students.find(u => u.id === userId);
  if (user) {
    user.status = user.status === 'actif' ? 'désactivé' : 'actif';
    return { ...user };
  }
  
  return null;
}

export default {
  getActiveSchoolId,
  setActiveSchoolId,
  getActiveSchool,
  getAllSchools,
  getClasses,
  getTeachers,
  getStudents,
  getThemesPublished,
  createClass,
  updateClass,
  createUser,
  createSchool,
  updateSchoolInfo,
  getSchoolInfo,
  getUsers,
  toggleUserStatus
};

