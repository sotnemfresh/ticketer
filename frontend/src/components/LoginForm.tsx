import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'

export type LoginFormInputs = {
  email: string
  password: string
}

interface LoginFormProps {
  onSubmit: (data: LoginFormInputs) => Promise<void>
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormInputs>();

  const onFormSubmit: SubmitHandler<LoginFormInputs> = (data) => {
    try {
      onSubmit(data);
    } catch (error) {
      setError('email', { type: 'manual', message: 'Login failed' });
      setError('password', { type: 'manual', message: 'Login failed' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          {...register('email', { required: 'Email is required' })}
        />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          {...register('password', { required: 'Password is required' })}
        />
        {errors.password && <span>{errors.password.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>Log in</button>
    </form>
  );
}