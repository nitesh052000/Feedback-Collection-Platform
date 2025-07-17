export interface User {
  _id: string;
  email: string;
  businessName: string;
  role: 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  _id: string;
  text: string;
  type: 'text' | 'multiple-choice';
  options?: string[];
  required: boolean;
  order: number;
}

export interface Form {
  _id: string;
  title: string;
  description?: string;
  creator: string;
  questions: Question[];
  isActive: boolean;
  publicUrl: string;
  settings: {
    allowMultipleResponses: boolean;
    requireEmail: boolean;
    theme: 'light' | 'dark' | 'blue' | 'green';
  };
  responseCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  questionId: string;
  questionText: string;
  questionType: 'text' | 'multiple-choice';
  answer: string;
}

export interface Response {
  _id: string;
  form: string;
  answers: Answer[];
  submitterEmail?: string;
  submitterName?: string;
  ipAddress?: string;
  userAgent?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormSummary {
  totalResponses: number;
  questions: {
    questionId: string;
    questionText: string;
    questionType: 'text' | 'multiple-choice';
    totalAnswers: number;
    answers: Record<string, number>;
  }[];
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  businessName: string;
}

export interface CreateFormData {
  title: string;
  description?: string;
  questions: Omit<Question, '_id'>[];
  settings?: Partial<Form['settings']>;
}

export interface SubmitResponseData {
  formId: string;
  answers: {
    questionId: string;
    answer: string;
  }[];
  submitterEmail?: string;
  submitterName?: string;
} 