/**
 * xAPI Tracker — Autoformación UMCE
 * Adaptado de plantilla-modulo-xapi-v2 para cursos de autoformación.
 * Envía directo a Ralph LRS con Basic Auth (sin JWT/n8n).
 * Fallback: acumula statements en localStorage si LRS no responde.
 */

class XAPITracker {
  constructor(config) {
    this.config = config;
    this.sessionStart = new Date();
    this.slideStartTimes = {};
    this.currentSlide = undefined;
    this.initialized = false;
    this.pendingStatements = JSON.parse(localStorage.getItem('xapi_pending_' + config.moduleId) || '[]');
  }

  async init() {
    await this.sendStatement({
      verb: 'http://adlnet.gov/expapi/verbs/initialized',
      verbDisplay: 'initialized',
      objectId: this.config.activityBase + '/' + this.config.moduleId,
      objectName: this.config.moduleName
    });
    this.initialized = true;
    this.flushPending();
    return true;
  }

  async trackSlideProgress(slideIndex, totalSlides) {
    if (!this.initialized) return;

    if (this.currentSlide !== undefined && this.slideStartTimes[this.currentSlide]) {
      var timeSpent = Math.floor((Date.now() - this.slideStartTimes[this.currentSlide]) / 1000);
      if (timeSpent < 3) {
        console.warn('Slide ' + this.currentSlide + ' too fast: ' + timeSpent + 's');
      }
    }

    this.currentSlide = slideIndex;
    this.slideStartTimes[slideIndex] = Date.now();

    await this.sendStatement({
      verb: 'http://adlnet.gov/expapi/verbs/progressed',
      verbDisplay: 'progressed',
      objectId: this.config.activityBase + '/' + this.config.moduleId + '/slide-' + slideIndex,
      objectName: this.config.moduleName + ' - Slide ' + (slideIndex + 1),
      extensions: {
        'http://id.tincanapi.com/extension/progress': (slideIndex + 1) / totalSlides
      }
    });
  }

  async trackQuizAnswer(questionId, questionText, answer, isCorrect) {
    if (!this.initialized) return;

    await this.sendStatement({
      verb: 'http://adlnet.gov/expapi/verbs/answered',
      verbDisplay: 'answered',
      objectId: this.config.activityBase + '/' + this.config.moduleId + '/question-' + questionId,
      objectName: questionText,
      result: {
        success: isCorrect,
        response: answer,
        score: { min: 0, max: 1, raw: isCorrect ? 1 : 0, scaled: isCorrect ? 1.0 : 0.0 }
      }
    });
  }

  async trackCompletion(finalScore) {
    if (!this.initialized) return;

    var totalTime = Math.floor((Date.now() - this.sessionStart.getTime()) / 1000);
    var passed = finalScore >= (this.config.passingScore || 60);

    await this.sendStatement({
      verb: 'http://adlnet.gov/expapi/verbs/completed',
      verbDisplay: 'completed',
      objectId: this.config.activityBase + '/' + this.config.moduleId,
      objectName: this.config.moduleName,
      result: {
        success: passed,
        completion: true,
        duration: this.formatDuration(totalTime),
        score: { min: 0, max: 100, raw: finalScore, scaled: finalScore / 100 }
      }
    });

    return passed;
  }

  async sendStatement(data) {
    var statement = {
      id: this.generateUUID(),
      timestamp: new Date().toISOString(),
      actor: {
        objectType: 'Agent',
        mbox: 'mailto:' + this.config.userEmail,
        name: this.config.userFullname
      },
      verb: {
        id: data.verb,
        display: { 'es-ES': data.verbDisplay || data.verb }
      },
      object: {
        objectType: 'Activity',
        id: data.objectId,
        definition: { name: { 'es-ES': data.objectName } }
      },
      context: {
        contextActivities: {
          parent: [{ objectType: 'Activity', id: 'https://evirtual.umce.cl/course/view.php?id=' + this.config.courseId }]
        },
        extensions: {
          'http://id.tincanapi.com/extension/user-id': this.config.userId || '',
          'http://id.tincanapi.com/extension/course-id': this.config.courseId || '384'
        }
      }
    };
    if (data.extensions) {
      Object.assign(statement.context.extensions, data.extensions);
    }
    if (data.result) {
      statement.result = data.result;
    }

    try {
      var response = await fetch(this.config.lrsEndpoint + 'statements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa(this.config.lrsUser + ':' + this.config.lrsPassword),
          'X-Experience-API-Version': '1.0.3'
        },
        body: JSON.stringify(statement)
      });
      if (!response.ok) throw new Error(response.statusText);
      return true;
    } catch (err) {
      console.warn('xAPI send failed, queuing:', err.message);
      this.pendingStatements.push(statement);
      localStorage.setItem('xapi_pending_' + this.config.moduleId, JSON.stringify(this.pendingStatements));
      return false;
    }
  }

  async flushPending() {
    if (this.pendingStatements.length === 0) return;
    var remaining = [];
    for (var i = 0; i < this.pendingStatements.length; i++) {
      try {
        var response = await fetch(this.config.lrsEndpoint + 'statements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(this.config.lrsUser + ':' + this.config.lrsPassword),
            'X-Experience-API-Version': '1.0.3'
          },
          body: JSON.stringify(this.pendingStatements[i])
        });
        if (!response.ok) remaining.push(this.pendingStatements[i]);
      } catch (e) {
        remaining.push(this.pendingStatements[i]);
      }
    }
    this.pendingStatements = remaining;
    localStorage.setItem('xapi_pending_' + this.config.moduleId, JSON.stringify(remaining));
  }

  formatDuration(seconds) {
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = seconds % 60;
    var d = 'PT';
    if (h > 0) d += h + 'H';
    if (m > 0) d += m + 'M';
    if (s > 0 || d === 'PT') d += s + 'S';
    return d;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
}
