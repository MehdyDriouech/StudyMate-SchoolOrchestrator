/**
 * Store Student Submissions - Gestion des soumissions de devoirs par les élèves
 */

const StudentSubmissionsStore = {
  submissions: [],

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

