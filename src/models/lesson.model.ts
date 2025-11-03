
export interface Question {
  questionInTargetLanguage: string;
  options: string[];
  correctAnswer: string;
  imagePrompt: string;
  imageUrl?: string; 
  imageIsLoading: boolean;
}

export interface Lesson {
  title: string;
  questions: Question[];
}
