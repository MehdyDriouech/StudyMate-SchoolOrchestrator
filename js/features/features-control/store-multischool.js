/**
 * Store Multi-Établissements - Gestion centralisée des établissements
 */

const STORAGE_ACTIVE_SCHOOL = 'SM_SO_ACTIVE_SCHOOL_ID';

// Liste cohérente des élèves récurrents
const DEMO_STUDENTS = [
  { id: 'student_nathan', name: 'Nathan Leroy', email: 'nathan.leroy@ecole.fr' },
  { id: 'student_sarah', name: 'Sarah Benali', email: 'sarah.benali@ecole.fr' },
  { id: 'student_julien', name: 'Julien Morel', email: 'julien.morel@ecole.fr' },
  { id: 'student_amina', name: 'Amina Karim', email: 'amina.karim@ecole.fr' },
  { id: 'student_hugo', name: 'Hugo Lemoine', email: 'hugo.lemoine@ecole.fr' },
  { id: 'student_lina', name: 'Lina Haddad', email: 'lina.haddad@ecole.fr' },
  { id: 'student_sofiane', name: 'Sofiane Madi', email: 'sofiane.madi@ecole.fr' },
  { id: 'student_clara', name: 'Clara Perrot', email: 'clara.perrot@ecole.fr' },
  { id: 'student_leo', name: 'Léo Marques', email: 'leo.marques@ecole.fr' },
  { id: 'student_selma', name: 'Selma Rami', email: 'selma.rami@ecole.fr' }
];

// Données mockées pour les établissements
const INITIAL_SCHOOLS = {
  "school_01": {
    id: "school_01",
    name: "Lycée Hoche – Versailles",
    city: "Versailles",
    address: "73 avenue de Saint-Cloud, 78000 Versailles",
    director: "Claire Dupont",
    classes: [
      { id: 'class_term_spe_maths', name: 'Tle2 – Spé Maths', track: 'Scientifique', year: 'Terminale', students: 10 },
      { id: 'class_term_physique', name: 'Tle3 – Physique-Chimie', track: 'Scientifique', year: 'Terminale', students: 10 },
      { id: 'class_prem_st2s', name: '1ère ST2S', track: 'Technologique', year: 'Première', students: 10 },
      { id: 'class_seconde_gen', name: '2nde Générale A', track: 'Générale', year: 'Seconde', students: 10 }
    ],
    teachers: [
      { id: 'user_martin', name: 'Prof. Martin', email: 'martin@ecole.fr', role: 'Enseignant', className: 'Tle2 – Spé Maths', status: 'actif' },
      { id: 'user_dubois', name: 'Prof. Dubois', email: 'dubois@ecole.fr', role: 'Enseignant', className: 'Tle3 – Physique-Chimie', status: 'actif' },
      { id: 'user_bernard', name: 'Prof. Bernard', email: 'bernard@ecole.fr', role: 'Enseignant', className: '1ère ST2S', status: 'actif' },
      { id: 'user_lefebvre', name: 'Prof. Lefebvre', email: 'lefebvre@ecole.fr', role: 'Enseignant', className: '2nde Générale A', status: 'actif' }
    ],
    students: [
      // Classe Tle2 – Spé Maths (10 élèves)
      { id: DEMO_STUDENTS[0].id, name: DEMO_STUDENTS[0].name, email: DEMO_STUDENTS[0].email, className: 'Tle2 – Spé Maths', status: 'actif' },
      { id: DEMO_STUDENTS[1].id, name: DEMO_STUDENTS[1].name, email: DEMO_STUDENTS[1].email, className: 'Tle2 – Spé Maths', status: 'actif' },
      { id: DEMO_STUDENTS[2].id, name: DEMO_STUDENTS[2].name, email: DEMO_STUDENTS[2].email, className: 'Tle2 – Spé Maths', status: 'actif' },
      { id: DEMO_STUDENTS[3].id, name: DEMO_STUDENTS[3].name, email: DEMO_STUDENTS[3].email, className: 'Tle2 – Spé Maths', status: 'actif' },
      { id: DEMO_STUDENTS[4].id, name: DEMO_STUDENTS[4].name, email: DEMO_STUDENTS[4].email, className: 'Tle2 – Spé Maths', status: 'actif' },
      { id: DEMO_STUDENTS[5].id, name: DEMO_STUDENTS[5].name, email: DEMO_STUDENTS[5].email, className: 'Tle2 – Spé Maths', status: 'actif' },
      { id: DEMO_STUDENTS[6].id, name: DEMO_STUDENTS[6].name, email: DEMO_STUDENTS[6].email, className: 'Tle2 – Spé Maths', status: 'actif' },
      { id: DEMO_STUDENTS[7].id, name: DEMO_STUDENTS[7].name, email: DEMO_STUDENTS[7].email, className: 'Tle2 – Spé Maths', status: 'actif' },
      { id: DEMO_STUDENTS[8].id, name: DEMO_STUDENTS[8].name, email: DEMO_STUDENTS[8].email, className: 'Tle2 – Spé Maths', status: 'actif' },
      { id: DEMO_STUDENTS[9].id, name: DEMO_STUDENTS[9].name, email: DEMO_STUDENTS[9].email, className: 'Tle2 – Spé Maths', status: 'actif' }
    ],
    themesPublished: [
      { id: 'theme_suites_numeriques', title: 'Suites numériques', subject: 'Mathématiques', publishedAt: '2024-11-10' },
      { id: 'theme_fonctions_derivees', title: 'Fonctions dérivées', subject: 'Mathématiques', publishedAt: '2024-11-08' },
      { id: 'theme_probabilites', title: 'Probabilités conditionnelles', subject: 'Mathématiques', publishedAt: '2024-11-05' },
      { id: 'theme_logarithmes', title: 'Logarithmes', subject: 'Mathématiques', publishedAt: '2024-10-28' },
      { id: 'theme_geometrie', title: 'Géométrie analytique', subject: 'Mathématiques', publishedAt: '2024-10-20' },
      { id: 'theme_ondes', title: 'Ondes mécaniques', subject: 'Physique-Chimie', publishedAt: '2024-11-12' },
      { id: 'theme_newton', title: 'Lois de Newton', subject: 'Physique-Chimie', publishedAt: '2024-11-01' },
      { id: 'theme_photoelectrique', title: 'Effet photoélectrique', subject: 'Physique-Chimie', publishedAt: '2024-10-25' }
    ]
  },
  "school_02": {
    id: "school_02",
    name: "Lycée Condorcet",
    city: "Lyon",
    address: "42 rue de la Paix, 69001 Lyon",
    director: "Marie Martin",
    classes: [
      { id: 'class_term_s2', name: 'Terminale S2', track: 'Scientifique', year: 'Terminale', students: 10 },
      { id: 'class_prem_s1', name: 'Première S1', track: 'Scientifique', year: 'Première', students: 10 },
      { id: 'class_seconde1', name: 'Seconde 1', track: 'Générale', year: 'Seconde', students: 10 }
    ],
    teachers: [
      { id: 'user_petit', name: 'Prof. Petit', email: 'petit@condorcet.fr', role: 'Enseignant', className: 'Terminale S2', status: 'actif' },
      { id: 'user_robert', name: 'Prof. Robert', email: 'robert@condorcet.fr', role: 'Enseignant', className: 'Première S1', status: 'actif' }
    ],
    students: [
      // Réutilisation des mêmes élèves pour cohérence (mais dans d'autres classes)
      { id: DEMO_STUDENTS[0].id, name: DEMO_STUDENTS[0].name, email: DEMO_STUDENTS[0].email, className: 'Terminale S2', status: 'actif' },
      { id: DEMO_STUDENTS[1].id, name: DEMO_STUDENTS[1].name, email: DEMO_STUDENTS[1].email, className: 'Terminale S2', status: 'actif' },
      { id: DEMO_STUDENTS[2].id, name: DEMO_STUDENTS[2].name, email: DEMO_STUDENTS[2].email, className: 'Terminale S2', status: 'actif' },
      { id: DEMO_STUDENTS[3].id, name: DEMO_STUDENTS[3].name, email: DEMO_STUDENTS[3].email, className: 'Terminale S2', status: 'actif' },
      { id: DEMO_STUDENTS[4].id, name: DEMO_STUDENTS[4].name, email: DEMO_STUDENTS[4].email, className: 'Terminale S2', status: 'actif' }
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
    city: school.city,
    address: school.address,
    director: school.director,
    classes: school.classes || [],
    teachers: school.teachers || [],
    students: school.students || [],
    classesCount: (school.classes || []).length,
    studentsCount: (school.students || []).reduce((sum, s) => sum + 1, 0),
    usersCount: (school.teachers || []).length
  }));
}

/**
 * Crée un nouvel élève dans l'établissement actif
 * @param {object} studentData - Données de l'élève
 * @returns {object}
 */
export function createStudent(studentData) {
  const schoolId = getActiveSchoolId();
  if (!schoolId) throw new Error('Aucun établissement actif');
  
  const newStudent = {
    id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: studentData.name || '',
    email: studentData.email || '',
    className: studentData.className || '',
    status: studentData.status || 'actif'
  };
  
  schoolsState[schoolId].students.push(newStudent);
  
  // Mettre à jour le nombre d'élèves dans la classe
  if (studentData.className) {
    const classIndex = schoolsState[schoolId].classes.findIndex(c => c.name === studentData.className);
    if (classIndex !== -1) {
      schoolsState[schoolId].classes[classIndex].students = 
        (schoolsState[schoolId].classes[classIndex].students || 0) + 1;
    }
  }
  
  return { ...newStudent };
}

/**
 * Crée plusieurs élèves à partir d'un tableau
 * @param {Array<object>} studentsData - Tableau de données d'élèves
 * @returns {Array<object>}
 */
export function createStudents(studentsData) {
  const schoolId = getActiveSchoolId();
  if (!schoolId) throw new Error('Aucun établissement actif');
  
  const createdStudents = [];
  
  studentsData.forEach(studentData => {
    const newStudent = {
      id: `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: studentData.name || '',
      email: studentData.email || '',
      className: studentData.className || '',
      status: studentData.status || 'actif'
    };
    
    schoolsState[schoolId].students.push(newStudent);
    createdStudents.push(newStudent);
    
    // Mettre à jour le nombre d'élèves dans la classe
    if (studentData.className) {
      const classIndex = schoolsState[schoolId].classes.findIndex(c => c.name === studentData.className);
      if (classIndex !== -1) {
        schoolsState[schoolId].classes[classIndex].students = 
          (schoolsState[schoolId].classes[classIndex].students || 0) + 1;
      }
    }
  });
  
  return createdStudents;
}

/**
 * Assigne un élève à une classe
 * @param {string} studentId - ID de l'élève
 * @param {string} className - Nom de la classe
 * @returns {object|null}
 */
export function assignStudentToClass(studentId, className) {
  const schoolId = getActiveSchoolId();
  if (!schoolId) throw new Error('Aucun établissement actif');
  
  const student = schoolsState[schoolId].students.find(s => s.id === studentId);
  if (!student) return null;
  
  const oldClassName = student.className;
  student.className = className;
  
  // Mettre à jour le nombre d'élèves dans l'ancienne classe
  if (oldClassName) {
    const oldClassIndex = schoolsState[schoolId].classes.findIndex(c => c.name === oldClassName);
    if (oldClassIndex !== -1 && schoolsState[schoolId].classes[oldClassIndex].students > 0) {
      schoolsState[schoolId].classes[oldClassIndex].students--;
    }
  }
  
  // Mettre à jour le nombre d'élèves dans la nouvelle classe
  const newClassIndex = schoolsState[schoolId].classes.findIndex(c => c.name === className);
  if (newClassIndex !== -1) {
    schoolsState[schoolId].classes[newClassIndex].students = 
      (schoolsState[schoolId].classes[newClassIndex].students || 0) + 1;
  }
  
  return { ...student };
}

/**
 * Retourne les élèves d'une classe spécifique
 * @param {string} className - Nom de la classe
 * @returns {Array}
 */
export function getStudentsByClass(className) {
  const school = getActiveSchool();
  if (!school) return [];
  return school.students.filter(s => s.className === className);
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
    ...school.teachers.map(t => ({ ...t, active: t.status === 'actif' })),
    ...school.students.map(s => ({ ...s, role: 'Étudiant', active: s.status === 'actif' }))
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
  getStudentsByClass,
  getThemesPublished,
  createClass,
  updateClass,
  createUser,
  createStudent,
  createStudents,
  assignStudentToClass,
  createSchool,
  updateSchoolInfo,
  getSchoolInfo,
  getUsers,
  toggleUserStatus
};

