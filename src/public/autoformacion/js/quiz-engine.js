/**
 * Quiz Engine - UMCE
 * Maneja lógica de quiz con validación y feedback
 */

class QuizEngine {
  constructor(tracker) {
    this.tracker = tracker;
    this.questions = [];
    this.answers = {}; // { questionId: { answer, isCorrect } }
    this.currentQuestionIndex = 0;
  }

  /**
   * Registra una pregunta
   */
  registerQuestion(questionId, questionText, correctAnswer) {
    this.questions.push({
      id: questionId,
      text: questionText,
      correctAnswer: correctAnswer
    });
  }

  /**
   * Procesa respuesta de usuario
   */
  async answerQuestion(questionId, answer) {
    const question = this.questions.find(q => q.id === questionId);
    if (!question) {
      console.error('Question not found:', questionId);
      return false;
    }

    const isCorrect = answer === question.correctAnswer;
    this.answers[questionId] = {
      answer: answer,
      isCorrect: isCorrect
    };

    // Enviar statement xAPI
    await this.tracker.trackQuizAnswer(
      questionId,
      question.text,
      answer,
      isCorrect
    );

    return isCorrect;
  }

  /**
   * Calcula score final
   */
  calculateScore() {
    if (this.questions.length === 0) return 100;

    const correctCount = Object.values(this.answers)
      .filter(a => a.isCorrect).length;

    return Math.round((correctCount / this.questions.length) * 100);
  }

  /**
   * Valida que todas las preguntas estén respondidas
   */
  isComplete() {
    return Object.keys(this.answers).length === this.questions.length;
  }

  /**
   * Obtiene estadísticas
   */
  getStats() {
    const total = this.questions.length;
    const answered = Object.keys(this.answers).length;
    const correct = Object.values(this.answers).filter(a => a.isCorrect).length;
    const score = this.calculateScore();

    return {
      total,
      answered,
      correct,
      incorrect: answered - correct,
      score,
      passed: score >= (this.tracker?.config?.passingScore || 70)
    };
  }

  /**
   * Renderiza feedback visual
   */
  renderFeedback(questionElement, isCorrect) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedbackDiv.textContent = isCorrect
      ? '✓ ¡Correcto! Excelente respuesta.'
      : '✗ Incorrecto. Revisa el contenido e intenta nuevamente.';

    // Remover feedback anterior si existe
    const oldFeedback = questionElement.querySelector('.quiz-feedback');
    if (oldFeedback) {
      oldFeedback.remove();
    }

    questionElement.appendChild(feedbackDiv);

    // Marcar opciones visualmente
    const options = questionElement.querySelectorAll('.quiz-option');
    options.forEach(option => {
      const optionValue = option.dataset.value;
      const question = this.questions.find(q =>
        q.id === questionElement.dataset.questionId
      );

      if (optionValue === question.correctAnswer) {
        option.classList.add('correct');
      } else if (optionValue === this.answers[question.id]?.answer && !isCorrect) {
        option.classList.add('incorrect');
      }

      // Deshabilitar opciones después de responder
      option.style.pointerEvents = 'none';
    });
  }

  /**
   * Resetea el quiz
   */
  reset() {
    this.answers = {};
    this.currentQuestionIndex = 0;

    // Limpiar feedback visual
    document.querySelectorAll('.quiz-feedback').forEach(el => el.remove());
    document.querySelectorAll('.quiz-option').forEach(el => {
      el.classList.remove('selected', 'correct', 'incorrect');
      el.style.pointerEvents = 'auto';
    });
  }
}

/**
 * Helper: Inicializa quiz desde HTML
 */
function initializeQuizFromHTML(tracker) {
  const quizEngine = new QuizEngine(tracker);

  // Buscar todos los quiz containers
  document.querySelectorAll('.quiz-container').forEach((container, index) => {
    const questionText = container.querySelector('.quiz-question').textContent;
    const questionId = container.dataset.questionId || `q${index + 1}`;
    container.dataset.questionId = questionId;

    // Encontrar respuesta correcta
    let correctAnswer = null;
    const options = container.querySelectorAll('.quiz-option');
    options.forEach(option => {
      if (option.dataset.correct === 'true') {
        correctAnswer = option.dataset.value;
      }

      // Agregar event listener
      option.addEventListener('click', async function() {
        if (option.parentElement.style.pointerEvents === 'none') return;

        // Marcar como seleccionada
        options.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        // Procesar respuesta
        const answer = option.dataset.value;
        const isCorrect = await quizEngine.answerQuestion(questionId, answer);

        // Mostrar feedback
        quizEngine.renderFeedback(container, isCorrect);
      });
    });

    // Registrar pregunta
    if (correctAnswer) {
      quizEngine.registerQuestion(questionId, questionText, correctAnswer);
    } else {
      console.warn(`No correct answer defined for question: ${questionId}`);
    }
  });

  return quizEngine;
}
