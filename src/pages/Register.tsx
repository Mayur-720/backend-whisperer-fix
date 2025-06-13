/* eslint-disable @typescript-eslint/no-explicit-any */
// components/Register.tsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { User, AtSign, KeyRound, Eye, EyeOff, UserPlus, Mail, Lock, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const registerSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  fullName: z.string().min(2, { message: 'Please enter your full name' }),
  email: z.string().email({ message: 'Please enter a valid email' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
  isAdult: z.boolean().refine(val => val === true, {
    message: 'You must be at least 18 years old to use this platform',
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const { register: registerUser, isLoading } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Extract referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code) {
      setReferralCode(code);
    }
  }, [location.search]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      referralCode: '',
      isAdult: false,
    },
  });

  // Update form when referralCode changes
  useEffect(() => {
    if (referralCode) {
      form.setValue('referralCode', referralCode);
    }
  }, [referralCode, form]);

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      // Register the user (referral processing is handled backend-side)
      await registerUser(data.username, data.fullName, data.email, data.password, data.referralCode);
      // Toasts are handled in AuthContext
      navigate('/');
    } catch (error: any) {
      console.error("Registration error:", error);
      // Toast is handled in AuthContext
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 items-center justify-center p-4">
      <div className="w-full max-w-md text-center mb-8">
        <h1 className="text-5xl font-bold text-white mb-2">UnderCover</h1>
        <p className="text-gray-300 text-lg">Create your anonymous identity</p>
        {referralCode && (
          <div className="mt-2 py-1 px-3 bg-purple-700/50 rounded-full inline-block">
            <p className="text-sm text-purple-200">Joining with referral code: {referralCode}</p>
          </div>
        )}
      </div>

      <Card className="w-full max-w-md border-purple-700/50 bg-black/40 backdrop-blur-md text-gray-100 shadow-xl">
        <CardHeader className="space-y-2 text-center border-b border-purple-800/30 pb-6">
          <CardTitle className="text-2xl font-bold text-purple-400">Create Your Mask</CardTitle>
          <CardDescription className="text-gray-400">
            Join the shadow realm where identities remain hidden
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-300">Shadow Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={18} />
                        <Input
                          placeholder="Choose a unique username"
                          className="bg-gray-900/60 border-purple-800/50 pl-10 py-5"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-300">Real Identity (Kept Hidden)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={18} />
                        <Input
                          placeholder="Your real name (will be encrypted)"
                          className="bg-gray-900/60 border-purple-800/50 pl-10 py-5"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs text-gray-400">
                      Your real name is heavily encrypted and only visible to you.
                    </FormDescription>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-300">Contact Cipher</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={18} />
                        <Input
                          placeholder="your.email@example.com"
                          className="bg-gray-900/60 border-purple-800/50 pl-10 py-5"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-300">Secret Key</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={18} />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="bg-gray-900/60 border-purple-800/50 pl-10 py-5"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={18} className="text-purple-400" /> : <Eye size={18} className="text-purple-400" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-300">Confirm Secret Key</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={18} />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="bg-gray-900/60 border-purple-800/50 pl-10 py-5"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff size={18} className="text-purple-400" /> : <Eye size={18} className="text-purple-400" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-300">Referral Code (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={18} />
                        <Input
                          placeholder="Enter referral code"
                          className="bg-gray-900/60 border-purple-800/50 pl-10 py-5"
                          {...field}
                          value={field.value || ''}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs text-gray-400">
                      If someone invited you, enter their referral code here
                    </FormDescription>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAdult"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-purple-800/30 p-4 mt-6">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-purple-600 border-purple-500"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-purple-300">
                        I confirm I am at least 18 years old
                      </FormLabel>
                      <FormDescription className="text-xs text-gray-400">
                        This shadow realm is for adults only.
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg font-medium mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Your Mask...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <UserPlus size={20} className="mr-2" />
                    Create Your Identity
                  </span>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center pt-2 pb-6">
          <p className="text-sm text-gray-400">
            Already part of the shadows?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium hover:underline">
              Return to the veil
            </Link>
          </p>
        </CardFooter>
      </Card>

      <div className="text-center mt-8 text-gray-400 text-sm">
        <p>Your true identity stays hidden. Your shadow self roams free.</p>
      </div>
    </div>
  );
};

export default Register;