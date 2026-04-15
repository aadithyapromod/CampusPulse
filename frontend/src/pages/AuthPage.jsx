import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_BASE from '../config/api';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleValidation = () => {
    let errs = {};
    if (!formData.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = "Email is invalid";

    if (!formData.password) errs.password = "Password is required";
    else if (formData.password.length < 6) errs.password = "Password must be at least 6 characters";

    if (!isLogin) {
      if (!formData.name) errs.name = "Full Name is required";
      if (formData.password !== formData.confirmPassword) errs.confirmPassword = "Passwords do not match";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (handleValidation()) {
      const endpoint = isLogin ? 'login' : 'signup';
      const body = isLogin 
        ? { email: formData.email, password: formData.password, role }
        : { name: formData.name, email: formData.email, password: formData.password, role };

      fetch(`${API_BASE}/api/users/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) setErrors({ email: data.error });
        else {
          login(data.user);
          navigate(data.user.role === 'organizer' ? '/' : '/dashboard');
        }
      })
      .catch(err => setErrors({ email: 'Server connection failed' }));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 animate-fade-in relative z-10 w-full flex-1">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/10 rounded-full blur-[128px] -z-10 pointer-events-none" />

      <div className="glass-card w-full max-w-md overflow-hidden relative shadow-2xl transition-all duration-300 transform">
        <div className="flex bg-surface/90 border-b border-white/5">
          <button 
            type="button"
            onClick={() => { setRole('student'); setErrors({}); }}
            className={`flex-1 py-4 text-center font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${role === 'student' ? 'text-primary bg-primary/5 border-b-2 border-primary' : 'text-muted hover:text-text hover:bg-white/5'}`}
          >
            <User className="w-4 h-4"/> Student
          </button>
          <button 
            type="button"
            onClick={() => { setRole('organizer'); setErrors({}); }}
            className={`flex-1 py-4 text-center font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${role === 'organizer' ? 'text-secondary bg-secondary/5 border-b-2 border-secondary' : 'text-muted hover:text-text hover:bg-white/5'}`}
          >
            <Briefcase className="w-4 h-4"/> Organizer
          </button>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold mb-2 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-muted text-sm font-medium">
              {isLogin ? `Log in to your ${role} account` : `Sign up as an ${role}`}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5 ml-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-muted/80" />
                  </div>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="John Doe" 
                    className={`w-full bg-surface/50 border ${errors.name ? 'border-red-500/50' : 'border-white/10'} rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 ${role === 'student' ? 'focus:ring-primary/50' : 'focus:ring-secondary/50'} text-text placeholder:text-muted/50 transition-all font-medium`}
                  />
                </div>
                {errors.name && <p className="text-red-400 text-xs mt-1.5 ml-1 font-medium">{errors.name}</p>}
              </div>
            )}

            <div className="animate-fade-in">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-muted/80" />
                </div>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="hello@college.edu" 
                  className={`w-full bg-surface/50 border ${errors.email ? 'border-red-500/50' : 'border-white/10'} rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 ${role === 'student' ? 'focus:ring-primary/50' : 'focus:ring-secondary/50'} text-text placeholder:text-muted/50 transition-all font-medium`}
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1.5 ml-1 font-medium">{errors.email}</p>}
            </div>

            <div className="animate-fade-in">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-muted/80" />
                </div>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••" 
                  className={`w-full bg-surface/50 border ${errors.password ? 'border-red-500/50' : 'border-white/10'} rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 ${role === 'student' ? 'focus:ring-primary/50' : 'focus:ring-secondary/50'} text-text placeholder:text-muted/50 transition-all font-medium`}
                />
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5 ml-1 font-medium">{errors.password}</p>}
            </div>

            {!isLogin && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5 ml-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-muted/80" />
                  </div>
                  <input 
                    type="password" 
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder="••••••••" 
                    className={`w-full bg-surface/50 border ${errors.confirmPassword ? 'border-red-500/50' : 'border-white/10'} rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 ${role === 'student' ? 'focus:ring-primary/50' : 'focus:ring-secondary/50'} text-text placeholder:text-muted/50 transition-all font-medium`}
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1.5 ml-1 font-medium">{errors.confirmPassword}</p>}
              </div>
            )}

            {isLogin && (
              <div className="flex justify-end animate-fade-in">
                <a href="#" className={`text-xs font-bold hover:underline transition-colors ${role === 'student' ? 'text-primary' : 'text-secondary'}`}>
                  Forgot Password?
                </a>
              </div>
            )}

            <button 
              type="submit"
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:scale-[1.02] mt-6 cursor-pointer ${role === 'student' ? 'bg-primary hover:bg-primary/90 shadow-primary/25' : 'bg-secondary hover:bg-secondary/90 shadow-secondary/25'}`}
            >
              {isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-muted bg-surface/30 py-3 rounded-xl border border-white/5">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setIsLogin(!isLogin); setErrors({}); }} 
              className={`font-bold hover:underline cursor-pointer transition-colors ${role === 'student' ? 'text-primary' : 'text-secondary'}`}
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
