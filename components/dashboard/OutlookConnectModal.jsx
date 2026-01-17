import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Shield, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";



export default function OutlookConnectModal({
  open,
  onOpenChange,
  onConnect,
  isConnecting = false,
}) {
  const [showTerms, setShowTerms] = useState(false);

  return (
    <>
      {/* Main Modal - Outlook Connection */}
      <Dialog open={open && !showTerms} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">
              Outlook Connection Required
            </DialogTitle>
            <DialogDescription className="text-center">
              To run the extraction, please connect your Outlook account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Benefits */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                <Shield className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Secure Connection</p>
                  <p className="text-xs text-muted-foreground">
                    Your credentials stay with Microsoft
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                <Mail className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Read-only Access</p>
                  <p className="text-xs text-muted-foreground">
                    We never modify your emails
                  </p>
                </div>
              </div>
            </div>

            {/* Connect button */}
            <Button
              className="w-full"
              size="lg"
              onClick={onConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  Connect with Outlook
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              By connecting, you agree to our{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-accent hover:underline"
              >
                terms of service
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Secondary Modal - Terms of Service */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="sm:max-w-lg h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Fixed Header */}
          <DialogHeader className="flex-shrink-0 p-6 pb-4 border-b">
            <DialogTitle className="text-xl">Terms of Service</DialogTitle>
          </DialogHeader>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-5 text-sm">
              <p className="font-semibold text-foreground">
                Terms of Service – Inbox2Excel
              </p>

              <div>
                <p className="font-medium text-foreground mb-1">1. Service Purpose</p>
                <p className="text-muted-foreground leading-relaxed">
                  Inbox2Excel allows you to extract data from Outlook emails and export them to Excel files.
                </p>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">2. Email Access</p>
                <p className="text-muted-foreground leading-relaxed">
                  The service works only with the explicit authorization of the user via Microsoft Outlook.
                  Access is strictly limited to reading the emails necessary for extraction.
                </p>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">3. Data Processing</p>
                <p className="text-muted-foreground leading-relaxed">
                  The extracted data is defined by the user.
                  Inbox2Excel never modifies emails and does not permanently store any email content.
                </p>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">4. User Responsibility</p>
                <p className="text-muted-foreground leading-relaxed">
                  The user guarantees that they have the necessary rights to access and process the analyzed emails.
                </p>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">5. Subscription</p>
                <p className="text-muted-foreground leading-relaxed">
                  Access to the service is subject to a monthly subscription.
                  The subscription can be modified or canceled at any time from the customer area.
                </p>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">6. Misuse</p>
                <p className="text-muted-foreground leading-relaxed">
                  Any abusive, fraudulent or illegal use may result in suspension or termination of the account.
                </p>
              </div>

              <div>
                <p className="font-medium text-foreground mb-1">7. Security</p>
                <p className="text-muted-foreground leading-relaxed">
                  Connections are secure and Outlook credentials are never stored by Inbox2Excel.
                </p>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 p-6 pt-4 border-t bg-background">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowTerms(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
