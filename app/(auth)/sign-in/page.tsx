
import AuthForm from '@/components/AuthForm';

const SignInPage = () => {
    return (
        <main className="flex justify-center items-center min-h-screen">
            <AuthForm type="sign-in" />
        </main>
    );
};

export default SignInPage;