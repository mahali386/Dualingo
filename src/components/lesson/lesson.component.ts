
import { Component, input, output, signal, effect, ChangeDetectionStrategy, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';
import { Lesson, Question } from '../../models/lesson.model';

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

@Component({
  selector: 'app-lesson',
  imports: [CommonModule],
  templateUrl: './lesson.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonComponent implements OnInit {
  language = input.required<string>();
  goHome = output<void>();

  private geminiService = inject(GeminiService);

  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  lesson = signal<Lesson | null>(null);
  currentQuestionIndex = signal<number>(0);
  selectedAnswer = signal<string | null>(null);
  answerState = signal<AnswerState>('unanswered');
  score = signal<number>(0);

  currentQuestion = computed<Question | null>(() => {
    const l = this.lesson();
    if (!l) return null;
    return l.questions[this.currentQuestionIndex()];
  });
  
  progress = computed<number>(() => {
    const l = this.lesson();
    if (!l) return 0;
    return ((this.currentQuestionIndex()) / l.questions.length) * 100;
  });

  isLessonFinished = computed(() => {
    const l = this.lesson();
    if (!l) return false;
    return this.currentQuestionIndex() >= l.questions.length;
  });

  constructor() {
    effect(() => {
        const question = this.currentQuestion();
        if (question && !question.imageUrl) {
            this.generateImageForQuestion(question, this.currentQuestionIndex());
        }
    });
  }

  ngOnInit() {
    this.loadLesson();
  }

  async loadLesson() {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const lessonData = await this.geminiService.generateLesson(this.language());
      this.lesson.set(lessonData);
    } catch (e: any) {
      this.error.set(e.message || 'An unknown error occurred.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async generateImageForQuestion(question: Question, index: number) {
      const imageUrl = await this.geminiService.generateImage(question.imagePrompt);
      this.lesson.update(l => {
          if (l) {
              l.questions[index].imageUrl = imageUrl;
              l.questions[index].imageIsLoading = false;
          }
          return l;
      });
  }

  selectAnswer(answer: string) {
    if (this.answerState() === 'unanswered') {
      this.selectedAnswer.set(answer);
    }
  }

  checkAnswer() {
    const question = this.currentQuestion();
    if (!question || this.selectedAnswer() === null) return;

    if (this.selectedAnswer() === question.correctAnswer) {
      this.answerState.set('correct');
      this.score.update(s => s + 1);
    } else {
      this.answerState.set('incorrect');
    }
  }

  nextQuestion() {
    this.answerState.set('unanswered');
    this.selectedAnswer.set(null);
    this.currentQuestionIndex.update(i => i + 1);
  }

  restartLesson() {
    this.currentQuestionIndex.set(0);
    this.score.set(0);
    this.answerState.set('unanswered');
    this.selectedAnswer.set(null);
    this.isLoading.set(true);
    this.error.set(null);
    this.lesson.set(null);
    this.loadLesson();
  }

  getOptionClass(option: string): string {
    const state = this.answerState();
    const selected = this.selectedAnswer();
    const correct = this.currentQuestion()?.correctAnswer;
    
    if (state === 'unanswered') {
      return selected === option ? 'border-blue-500 bg-blue-100 dark:bg-blue-900' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700';
    }
    
    if (option === correct) {
      return 'border-green-500 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    }
    
    if (option === selected && option !== correct) {
      return 'border-red-500 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
    }
    
    return 'border-slate-300 dark:border-slate-600 opacity-50';
  }
}
