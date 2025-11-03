
import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';
import { Lesson, Question } from '../models/lesson.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateLesson(language: string): Promise<Lesson> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Create a beginner-level language lesson for a native English speaker learning ${language}. The lesson should be about 'Common Foods' and consist of 5 multiple-choice questions. For each question, provide: 1. A 'questionInTargetLanguage': a single word in ${language} for a common food item. 2. A 'correctAnswer': the correct English translation. 3. Three plausible but incorrect English translations. 4. An 'imagePrompt': a simple, clear description for an image generator that visually represents the food item (e.g., "A photograph of a single red apple on a white background").`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionInTargetLanguage: { type: Type.STRING },
                    correctAnswer: { type: Type.STRING },
                    incorrectAnswers: { type: Type.ARRAY, items: { type: Type.STRING } },
                    imagePrompt: { type: Type.STRING },
                  },
                  required: ['questionInTargetLanguage', 'correctAnswer', 'incorrectAnswers', 'imagePrompt']
                }
              }
            },
            required: ['title', 'questions']
          },
        },
      });
      
      const jsonStr = response.text.trim();
      const parsedResponse = JSON.parse(jsonStr);

      const lesson: Lesson = {
          title: parsedResponse.title,
          questions: parsedResponse.questions.map((q: any) => ({
              ...q,
              options: this.shuffleArray([q.correctAnswer, ...q.incorrectAnswers]),
              imageIsLoading: true,
          }))
      };

      return lesson;
    } catch (error) {
      console.error('Error generating lesson:', error);
      throw new Error('Failed to generate lesson content.');
    }
  }

  async generateImage(prompt: string): Promise<string> {
    try {
        const response = await this.ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: `${prompt}, vibrant, simple illustration, cartoon style`,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '1:1',
            },
        });

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error('Error generating image:', error);
        return 'https://picsum.photos/512'; // Fallback image
    }
  }

  private shuffleArray(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
