'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const passwordValidation = new RegExp(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,}$/
);

const registerFormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }).regex(passwordValidation, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  }),
  confirmPassword: z.string().min(1, { message: 'Please confirm your password' })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

// Import the token clearing function
import { clearAuthTokens } from '@/lib/apiClient';

export default function RegisterPage() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Clear any existing tokens when the register page loads
    clearAuthTokens();
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
  });

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    setApiError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setApiError(errorData.error || 'Registration failed. Please try again.');
        if (errorData.details) {
          // Optionally, you could try to map these to form errors
          // For now, just log them or show a generic part of them
          console.error('Validation details:', errorData.details);
          let detailedMessages = '';
          if (errorData.details.email) detailedMessages += `Email: ${errorData.details.email.join(', ')}. `;
          if (errorData.details.password) detailedMessages += `Password: ${errorData.details.password.join(', ')}. `;
          if (detailedMessages) setApiError(prev => `${prev} ${detailedMessages.trim()}`);
        }
      } else {
        // Handle success (Task-UM-001.10)
        router.push('/login');
      }
    } catch (error) {
      console.error('Registration request failed:', error);
      setApiError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
          Create Account
        </h1>
        {apiError && (
          <div className="mb-4 rounded-md bg-red-100 p-3 text-center text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {apiError}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4"> {/* Reduced space-y for tighter error messages */}
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>}
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm ${errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>}
          </div>
          <div className="pt-2"> {/* Added padding-top to button div for better spacing */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}