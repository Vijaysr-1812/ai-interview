// app/(auth)/sign-up/page.tsx
import AuthForm from '@/components/AuthForm';

const SignUpPage = () => {
    return (
        <main className="flex justify-center items-center min-h-screen">
            <AuthForm type="sign-up" />
        </main>
    );
};

export default SignUpPage;