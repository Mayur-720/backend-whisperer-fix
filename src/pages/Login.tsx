
import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    await login(data.email, data.password);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 items-center justify-center p-4">
      <div className="w-full max-w-md text-center mb-8">
        <h1 className="text-5xl font-bold text-white mb-2">UnderCover</h1>
        <p className="text-gray-300 text-lg">Enter the shadows...</p>
      </div>
      
      <Card className="w-full max-w-md border-purple-700/50 bg-black/40 backdrop-blur-md text-gray-100 shadow-xl">
        <CardHeader className="space-y-2 text-center border-b border-purple-800/30 pb-6">
          <CardTitle className="text-2xl font-bold text-purple-400">Access Portal</CardTitle>
          <CardDescription className="text-gray-400">
            Your identity awaits behind this veil
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-purple-300">Identity Code</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={18} />
                        <Input 
                          placeholder="your.email@example.com" 
                          className="bg-gray-900/60 border-purple-800/50 pl-10 py-6" 
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
                          className="bg-gray-900/60 border-purple-800/50 pl-10 py-6" 
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
              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg font-medium mt-4" 
                disabled={isLoading}
              >
                {isLoading ? 'Entering the shadows...' : 'Enter Undercover'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center pt-2 pb-6">
          <p className="text-sm text-gray-400">
            No identity yet?{' '}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium hover:underline">
              Create your mask
            </Link>
          </p>
        </CardFooter>
      </Card>
      
      <div className="text-center mt-8 text-gray-400 text-sm">
        <p>Step into anonymity. Be whoever you want to be.</p>
      </div>
    </div>
  );
};

export default Login;
