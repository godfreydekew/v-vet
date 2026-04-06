import { useState } from "react";
import { Mail, Send, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendBroadcastEmail } from "@/lib/services/users.service";
import { getApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminEmail() {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast({ title: "Subject is required", variant: "destructive" });
      return;
    }

    if (!message.trim()) {
      toast({ title: "Message is required", variant: "destructive" });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await sendBroadcastEmail({
        subject: subject.trim(),
        message: message.trim(),
      });

      setResult({
        success: true,
        message: response.message,
      });

      // Clear form on success
      setSubject("");
      setMessage("");

      toast({
        title: "Success",
        description: response.message,
      });
    } catch (err) {
      const errorMsg = getApiError(err);
      setResult({
        success: false,
        message: errorMsg,
      });

      toast({
        title: "Failed to send broadcast email",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:px-8 md:py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Mail size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Send Update Email
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Send a broadcast email to all active users in the system
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-card rounded-xl border border-border p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Subject Input */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-base font-semibold">
              Email Subject
            </Label>
            <Input
              id="subject"
              type="text"
              placeholder="e.g., Important System Update"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={255}
              disabled={sending}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              {subject.length}/255 characters
            </p>
          </div>

          {/* Message Textarea */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-base font-semibold">
              Email Message
            </Label>
            <Textarea
              id="message"
              placeholder="Enter your message here. You can use multiple paragraphs for better readability."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
              className="text-base min-h-48 resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {message.length} characters
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>ℹ️ Note:</strong> This email will be sent to all active
              users in your V-Vet system. Users will receive the email in their
              inbox with the V-Vet branding and footer.
            </p>
          </div>

          {/* Result Message */}
          {result && (
            <div
              className={`rounded-lg p-4 flex items-start gap-3 ${
                result.success
                  ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
              }`}
            >
              {result.success ? (
                <CheckCircle
                  className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                  size={20}
                />
              ) : (
                <AlertCircle
                  className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                  size={20}
                />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${
                    result.success
                      ? "text-green-900 dark:text-green-100"
                      : "text-red-900 dark:text-red-100"
                  }`}
                >
                  {result.success
                    ? "Email sent successfully"
                    : "Failed to send email"}
                </p>
                <p
                  className={`text-sm mt-1 ${
                    result.success
                      ? "text-green-800 dark:text-green-200"
                      : "text-red-800 dark:text-red-200"
                  }`}
                >
                  {result.message}
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={sending || !subject.trim() || !message.trim()}
            className="w-full h-11 text-base font-semibold"
          >
            {sending ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Sending Email...
              </>
            ) : (
              <>
                <Send size={18} className="mr-2" />
                Send Broadcast Email
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Preview Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Email Preview
        </h2>
        <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6 border border-border">
          {subject || message ? (
            <div className="space-y-3 text-sm font-mono bg-white dark:bg-gray-800 rounded p-4 border border-border">
              <div>
                <span className="text-muted-foreground">Subject: </span>
                <span className="text-foreground">
                  {subject || "(subject will appear here)"}
                </span>
              </div>
              <div className="border-t border-border pt-3">
                <span className="text-muted-foreground">
                  Message Preview:\n
                </span>
                <p className="text-foreground whitespace-pre-wrap mt-2">
                  {message || "(message will appear here)"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Enter subject and message above to see a preview here
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
