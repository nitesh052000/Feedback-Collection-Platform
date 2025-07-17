import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle, AlertCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { formsAPI, responsesAPI } from '../services/api';
import { Form, SubmitResponseData } from '../types';

const PublicForm: React.FC = () => {
  const { publicUrl } = useParams<{ publicUrl: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<any>();

  useEffect(() => {
    if (publicUrl) {
      fetchForm();
    }
  }, [publicUrl]);

  const fetchForm = async () => {
    try {
      const response = await formsAPI.getByPublicUrl(publicUrl!);
      setForm(response.form);
    } catch (error: any) {
      toast.error('Form not found or inactive');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SubmitResponseData & { submitterName?: string; submitterEmail?: string }) => {
    if (!form) return;

    setSubmitting(true);
    try {
      // Prepare answers
      const answers = form.questions.map((question) => {
       const answer = (data as unknown as Record<string, string | undefined>)[`question_${question._id}`];

        return {
          questionId: question._id,
          answer: answer || '',
        };
      });

      // Validate required questions
      for (const question of form.questions) {
        if (question.required) {
          const answer = (data as unknown as Record<string, string | undefined>)[`question_${question._id}`];


          if (!answer || answer.trim() === '') {
            toast.error(`Please answer the required question: ${question.text}`);
            setSubmitting(false);
            return;
          }
        }
      }

      const responseData: SubmitResponseData = {
        formId: form._id,
        answers,
        submitterName: data.submitterName,
        submitterEmail: data.submitterEmail,
      };

      await responsesAPI.submit(responseData);
      setSubmitted(true);
      toast.success('Thank you for your feedback!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Form not found</h3>
          <p className="mt-1 text-sm text-gray-500">This form may have been deleted or is inactive.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Thank you!</h3>
          <p className="mt-1 text-sm text-gray-500">Your response has been submitted successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="card-header text-center">
            <h1 className="card-title">{form.title}</h1>
            {form.description && (
              <p className="card-description">{form.description}</p>
            )}
          </div>
          <div className="card-content">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Optional contact information */}
              {(form.settings.requireEmail || form.settings.allowMultipleResponses) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                  
                  {form.settings.requireEmail && (
                    <div>
                      <label htmlFor="submitterEmail" className="block text-sm font-medium text-gray-700">
                        Email Address *
                      </label>
                      <input
                        id="submitterEmail"
                        type="email"
                        className={`input mt-1 ${errors.submitterEmail ? 'border-red-500' : ''}`}
                        placeholder="Enter your email"
                        {...register('submitterEmail', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          },
                        })}
                      />
                                             {errors.submitterEmail && (
                         <p className="mt-1 text-sm text-red-600">{String(errors.submitterEmail.message || 'Email is required')}</p>
                       )}
                    </div>
                  )}

                  <div>
                    <label htmlFor="submitterName" className="block text-sm font-medium text-gray-700">
                      Name (Optional)
                    </label>
                    <input
                      id="submitterName"
                      type="text"
                      className="input mt-1"
                      placeholder="Enter your name"
                      {...register('submitterName')}
                    />
                  </div>
                </div>
              )}

              {/* Questions */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Questions</h3>
                
                {form.questions.map((question, index) => (
                  <div key={question._id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {question.text}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {question.type === 'text' ? (
                      <textarea
                        className={`textarea ${errors[`question_${question._id}`] ? 'border-red-500' : ''}`}
                        placeholder="Enter your answer"
                        rows={3}
                        {...register(`question_${question._id}` as const, {
                          required: question.required ? 'This question is required' : false,
                        })}
                      />
                    ) : (
                      <div className="space-y-2">
                        {question.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center">
                            <input
                              type="radio"
                              id={`${question._id}_${optionIndex}`}
                              value={option}
                              className="h-4 w-4 text-primary-600"
                              {...register(`question_${question._id}` as const, {
                                required: question.required ? 'Please select an option' : false,
                              })}
                            />
                            <label
                              htmlFor={`${question._id}_${optionIndex}`}
                              className="ml-2 text-sm text-gray-700"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}

                                         {errors[`question_${question._id}`] && (
                       <p className="text-sm text-red-600">
                         {String(errors[`question_${question._id}`]?.message || 'This field is required')}
                       </p>
                     )}
                  </div>
                ))}
              </div>

              {/* Submit button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-lg"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Submit Response
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicForm; 