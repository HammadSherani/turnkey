import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import AuthContent from "./AuthContent";

const Auth = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
};

export default Auth;