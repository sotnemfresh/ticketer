import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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

  const onFormSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      setError('root.serverError', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Unable to log in. Please try again.',
      });
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <form
        noValidate
        onSubmit={handleSubmit(onFormSubmit)}
        className="flex flex-col gap-(--card-spacing)"
      >
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
          <CardAction>
            <Button type="button" variant="link">Sign Up</Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              {errors.email && <p id="email-error" role="alert" className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && <p id="password-error" role="alert" className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
          </div>
          {errors.root?.serverError && (
            <p role="alert" className="mt-4 text-sm text-red-500">
              {errors.root.serverError.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Logging in...' : 'Login'}
          </Button>
          <Button type="button" variant="outline" className="w-full">
            Login with Google
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}