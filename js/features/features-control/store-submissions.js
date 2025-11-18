/**
 * Store Student Submissions - Gestion des soumissions de devoirs par les élèves
 */

// IDs des élèves cohérents
const DEMO_STUDENT_IDS = [
  'student_nathan', 'student_sarah', 'student_julien', 'student_amina',
  'student_hugo', 'student_lina', 'student_sofiane', 'student_clara',
  'student_leo', 'student_selma'
];

// IDs des assignations (cohérents avec store-class-theme-assignments.js)
const DEMO_ASSIGNMENT_IDS = [
  'assignment_suites_recent',
  'assignment_fonctions_recent',
  'assignment_probabilites_recent',
  'assignment_logarithmes_old',
  'assignment_geometrie_old'
];

// IDs des thèmes correspondants
const DEMO_THEME_IDS = [
  'theme_suites_numeriques',
  'theme_fonctions_derivees',
  'theme_probabilites',
  'theme_logarithmes',
  'theme_geometrie'
];

const CLASS_ID = 'class_term_spe_maths';

/**
 * Initialise le store avec des soumissions mockées
 */
function initMockSubmissions() {
  const now = Date.now();
  const submissions = [];
  
  // Pour chaque assignation, créer des rendus pour 70-90% des élèves
  DEMO_ASSIGNMENT_IDS.forEach((assignmentId, assignmentIndex) => {
    const themeId = DEMO_THEME_IDS[assignmentIndex];
    const numSubmissions = Math.floor(7 + Math.random() * 3); // 7-9 élèves sur 10 (70-90%)
    const shuffledStudents = [...DEMO_STUDENT_IDS].sort(() => Math.random() - 0.5);
    
    shuffledStudents.slice(0, numSubmissions).forEach((studentId, studentIndex) => {
      // Date de soumission : entre le début de l'assignation et maintenant (ou dans le futur pour les futures)
      const daysAgo = Math.floor(Math.random() * 5); // 0-5 jours
      const submittedAt = now - (daysAgo * 24 * 60 * 60 * 1000);
      
      // Score réaliste : variation par élève
      // Nathan et Sarah : meilleurs scores (85-95%)
      // Julien, Amina, Hugo : bons scores (75-85%)
      // Lina, Sofiane : scores moyens (65-75%)
      // Clara, Léo, Selma : scores variables (60-80%)
      let scoreRange;
      if (studentId === 'student_nathan' || studentId === 'student_sarah') {
        scoreRange = [85, 95];
      } else if (['student_julien', 'student_amina', 'student_hugo'].includes(studentId)) {
        scoreRange = [75, 85];
      } else if (['student_lina', 'student_sofiane'].includes(studentId)) {
        scoreRange = [65, 75];
      } else {
        scoreRange = [60, 80];
      }
      
      const score = Math.floor(scoreRange[0] + Math.random() * (scoreRange[1] - scoreRange[0]));
      
      submissions.push({
        id: `sub_${assignmentId}_${studentId}_${Date.now()}_${studentIndex}`,
        assignmentId,
        studentId,
        classId: CLASS_ID,
        themeId,
        submittedAt,
        answers: [],
        score,
        status: 'graded',
        gradedAt: submittedAt + (Math.random() * 24 * 60 * 60 * 1000) // Corrigé dans les 24h
      });
    });
  });
  
  console.log('[StudentSubmissionsStore] ✅ Store initialisé avec', submissions.length, 'soumissions mockées');
  return submissions;
}

const StudentSubmissionsStore = {
  submissions: initMockSubmissions(),

  /**
   * Soumet un devoir par un élève
   * @param {object} params - Paramètres
   * @param {string} params.assignmentId - ID de l'assignation
   * @param {string} params.studentId - ID de l'étudiant
   * @param {string} params.classId - ID de la classe
   * @param {string} params.themeId - ID du thème
   * @param {Array} params.answers - Réponses de l'élève (fake)
   * @returns {object}
   */
  submitAssignment({ assignmentId, studentId, classId, themeId, answers = [] }) {
    const submission = {
      id: "sub_" + crypto.randomUUID(),
      assignmentId,
      studentId,
      classId,
      themeId,
      submittedAt: Date.now(),
      answers,
      score: null,
      status: "submitted",
      gradedAt: null
    };
    
    this.submissions.push(submission);
    console.log('[StudentSubmissionsStore] ✅ Devoir soumis:', submission.id);
    
    return submission;
  },

  /**
   * Corrige automatiquement une soumission (fake)
   * @param {string} submissionId - ID de la soumission
   * @returns {object|null}
   */
  autoGrade(submissionId) {
    const s = this.submissions.find(x => x.id === submissionId);
    if (!s) {
      console.warn('[StudentSubmissionsStore] Soumission introuvable:', submissionId);
      return null;
    }
    
    // Score fake entre 70% et 95%
    s.score = Math.floor(70 + Math.random() * 25);
    s.status = "graded";
    s.gradedAt = Date.now();
    
    console.log('[StudentSubmissionsStore] ✅ Soumission corrigée:', submissionId, 'Score:', s.score + '%');
    
    return s;
  },

  /**
   * Récupère toutes les soumissions pour une assignation
   * @param {string} assignmentId - ID de l'assignation
   * @returns {Array}
   */
  getSubmissionsForAssignment(assignmentId) {
    return this.submissions
      .filter(s => s.assignmentId === assignmentId)
      .sort((a, b) => b.submittedAt - a.submittedAt);
  },

  /**
   * Récupère toutes les soumissions pour un enseignant
   * @param {string} teacherId - ID de l'enseignant (email)
   * @returns {Array}
   */
  getSubmissionsForTeacher(teacherId) {
    // Pour la démo, on récupère toutes les soumissions
    // Dans une vraie implémentation, on filtrerait par les classes de l'enseignant
    return this.submissions
      .sort((a, b) => b.submittedAt - a.submittedAt);
  },

  /**
   * Récupère une soumission spécifique
   * @param {string} studentId - ID de l'étudiant
   * @param {string} assignmentId - ID de l'assignation
   * @returns {object|null}
   */
  getSubmission(studentId, assignmentId) {
    return this.submissions.find(
      s => s.studentId === studentId && s.assignmentId === assignmentId
    ) || null;
  },

  /**
   * Récupère toutes les soumissions d'un étudiant
   * @param {string} studentId - ID de l'étudiant
   * @returns {Array}
   */
  getSubmissionsForStudent(studentId) {
    return this.submissions
      .filter(s => s.studentId === studentId)
      .sort((a, b) => b.submittedAt - a.submittedAt);
  }
};

export default StudentSubmissionsStore;

