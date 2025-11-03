
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { LanguageSelectorComponent } from './components/language-selector/language-selector.component';
import { LessonComponent } from './components/lesson/lesson.component';
import { CommonModule } from '@angular/common';

type Screen = 'language-select' | 'lesson';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LanguageSelectorComponent, LessonComponent],
})
export class AppComponent {
  screen = signal<Screen>('language-select');
  selectedLanguage = signal<string | null>(null);

  onLanguageSelected(language: string): void {
    this.selectedLanguage.set(language);
    this.screen.set('lesson');
  }

  onGoHome(): void {
    this.selectedLanguage.set(null);
    this.screen.set('language-select');
  }
}
