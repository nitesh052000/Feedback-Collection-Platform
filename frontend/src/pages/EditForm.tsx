import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, GripVertical, CheckSquare, Type, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { formsAPI } from '../services/api';
import { Form, Question } from '../types';

interface EditFormData {
  title: string;
  description: string;
  questions: Omit<Question, '_id'>[];
  isActive: boolean;
  settings: {
    allowMultipleResponses: boolean;
    requireEmail: boolean;
    theme: 'light' | 'dark' | 'blue' | 'green';
  };
}

const EditForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditFormData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  });

  useEffect(() => {
    if (id) {
      fetchForm();
    }
  }, [id]);

  const fetchForm = async () => {
    try {
      const response = await formsAPI.getById(id!);
      const formData = response.form;
      setForm(formData);
      
      // Reset form with fetched data
      reset({
        title: formData.title,
        description: formData.description || '',
        questions: formData.questions.map((q:Question) => ({
          text: q.text,
          type: q.type,
          options: q.options || [],
          required: q.required,
          order: q.order,
        })),
        isActive: formData.isActive,
        settings: formData.settings,
      });
    } catch (error: any) {
      toast.error('Failed to load form');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    append({
      text: '',
      type: 'text',
      options: [],
      required: false,
      order: fields.length + 1,
    });
  };

  const removeQuestion = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = async (data: EditFormData) => {
    setSaving(true);
    try {
      // Validate questions
      if (data.questions.length === 0) {
        toast.error('At least one question is required');
        return;
      }

      // Validate multiple-choice questions have options
      for (let i = 0; i < data.questions.length; i++) {
        const question = data.questions[i];
        if (question.type === 'multiple-choice' && (!question.options || question.options.length < 2)) {
          toast.error(`Multiple-choice question "${question.text || `Question ${i + 1}`}" must have at least 2 options`);
          return;
        }
        if (!question.text.trim()) {
          toast.error(`Question ${i + 1} text is required`);
          return;
        }
      }

      await formsAPI.update(id!, data);
      toast.success('Form updated successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update form');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Form not found</h3>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Form</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update your feedback form settings and questions
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Form Details */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Form Details</h2>
            <p className="card-description">Basic information about your form</p>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Form Title *
              </label>
              <input
                id="title"
                type="text"
                className={`input mt-1 ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Enter form title"
                {...register('title', {
                  required: 'Form title is required',
                  minLength: {
                    value: 3,
                    message: 'Title must be at least 3 characters',
                  },
                })}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                className="textarea mt-1"
                placeholder="Enter form description (optional)"
                {...register('description')}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                className="h-4 w-4 text-primary-600"
              />
              <label htmlFor="isActive" className="text-sm">
                Form is active (can receive responses)
              </label>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Questions</h2>
            <p className="card-description">Edit questions in your form</p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-2">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          Question {index + 1}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          disabled={fields.length === 1}
                          className="text-red-400 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div>
                        <input
                          type="text"
                          className="input"
                          placeholder="Enter your question"
                          {...register(`questions.${index}.text` as const, {
                            required: 'Question text is required',
                          })}
                        />
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`text-${index}`}
                            value="text"
                            {...register(`questions.${index}.type` as const)}
                            className="h-4 w-4 text-primary-600"
                          />
                          <label htmlFor={`text-${index}`} className="flex items-center text-sm">
                            <Type className="h-4 w-4 mr-1" />
                            Text
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`multiple-${index}`}
                            value="multiple-choice"
                            {...register(`questions.${index}.type` as const)}
                            className="h-4 w-4 text-primary-600"
                          />
                          <label htmlFor={`multiple-${index}`} className="flex items-center text-sm">
                            <CheckSquare className="h-4 w-4 mr-1" />
                            Multiple Choice
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`required-${index}`}
                            {...register(`questions.${index}.required` as const)}
                            className="h-4 w-4 text-primary-600"
                          />
                          <label htmlFor={`required-${index}`} className="text-sm">
                            Required
                          </label>
                        </div>
                      </div>

                      {watch(`questions.${index}.type`) === 'multiple-choice' && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Options
                          </label>
                          <div className="space-y-2">
                            {[0, 1, 2, 3].map((optionIndex) => (
                              <input
                                key={optionIndex}
                                type="text"
                                className="input"
                                placeholder={`Option ${optionIndex + 1}`}
                                {...register(`questions.${index}.options.${optionIndex}` as const)}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addQuestion}
              className="mt-4 btn btn-outline btn-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Form Settings</h2>
            <p className="card-description">Configure form behavior</p>
          </div>
          <div className="card-content space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowMultiple"
                {...register('settings.allowMultipleResponses')}
                className="h-4 w-4 text-primary-600"
              />
              <label htmlFor="allowMultiple" className="text-sm">
                Allow multiple responses from the same person
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requireEmail"
                {...register('settings.requireEmail')}
                className="h-4 w-4 text-primary-600"
              />
              <label htmlFor="requireEmail" className="text-sm">
                Require email address from respondents
              </label>
            </div>

            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                Form Theme
              </label>
              <select
                id="theme"
                className="input mt-1"
                {...register('settings.theme')}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary btn-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-md"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditForm; 