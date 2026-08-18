import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, GraduationCap, Building2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import ScholarPathLogo from '../components/ScholarPathLogo';

const WelcomePage = () => {
    const navigate = useNavigate();
    const { user, isAdmin, isInstitute, isInstructor, isStudent } = useAuth();

    useEffect(() => {
        if (!user) return;

        if (isAdmin) {
            navigate('/admin', { replace: true });
            return;
        }

        if (isInstitute) {
            navigate('/institute-dashboard', { replace: true });
            return;
        }

        if (isInstructor) {
            navigate('/instructor', { replace: true });
            return;
        }

        if (isStudent) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, isAdmin, isInstitute, isInstructor, isStudent, navigate]);

    if (user) {
        return null;
    }

    const roles = [
        {
            title: 'Students',
            description: 'Browse courses, manage learning schedules, track progress and access your study dashboard.',
            icon: GraduationCap,
            accent: 'from-primary-500 to-primary-700',
            link: '/signup',
            linkText: 'Start learning'
        },
        {
            title: 'Instructors',
            description: 'Create courses, schedule live classes, upload materials and manage students in one place.',
            icon: BookOpen,
            accent: 'from-amber-500 to-orange-600',
            link: '/signup',
            linkText: 'Teach with us'
        },
        {
            title: 'Institutes',
            description: 'Manage academic programs, instructor memberships and institutional analytics from a central dashboard.',
            icon: Building2,
            accent: 'from-indigo-500 to-indigo-700',
            link: '/institute-signup',
            linkText: 'Register institute'
        },
        {
            title: 'Admin',
            description: 'Monitor platform-wide metrics, verify users and keep the learning ecosystem running smoothly.',
            icon: ShieldCheck,
            accent: 'from-slate-700 to-slate-900',
            link: '/admin-login',
            linkText: 'Admin access'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="absolute top-4 right-4 z-10">
                <ThemeToggle />
            </div>

            <main className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <section className="text-center space-y-6">
                    <div className="flex justify-center items-center gap-3">
                        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl">
                            <ScholarPathLogo className="w-12 h-12" />
                        </div>
                        <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">ScholarPath</span>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-4 py-2 text-sm font-medium text-primary-700 shadow-sm dark:border-primary-800 dark:bg-slate-900/70 dark:text-primary-300">
                        <Sparkles className="w-4 h-4" />
                        A modern learning ecosystem for students, instructors and institutions
                    </div>

                    <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
                        Learn better. Teach smarter. Grow together.
                    </h1>

                    <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
                        ScholarPath connects learners and educators with live classes, curated programs, assignments, academic resources and role-aware dashboards built for modern education.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link to="/signup" className="btn btn-primary px-6 py-3 text-base inline-flex items-center gap-2">
                            Create account
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link to="/login" className="btn btn-secondary px-6 py-3 text-base">
                            Sign in
                        </Link>
                    </div>
                </section>

                <section className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {roles.map(({ title, description, icon: Icon, accent, link, linkText }) => (
                        <div key={title} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
                            <div className={`mb-5 inline-flex rounded-xl bg-gradient-to-r ${accent} p-3 text-white shadow-lg`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
                            <Link to={link} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400">
                                {linkText}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ))}
                </section>

                <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="grid gap-8 md:grid-cols-3">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">For learners</p>
                            <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Track progress, learn faster</h3>
                        </div>
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">For educators</p>
                            <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Deliver live, structured instruction</h3>
                        </div>
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">For institutions</p>
                            <h3 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Run programs at scale</h3>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default WelcomePage;
