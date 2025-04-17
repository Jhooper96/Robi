import { FormEvent, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

export default function SmsTest() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    sid?: string;
    error?: string;
  } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await apiRequest("POST", "/api/test-sms", {
        phoneNumber,
        message
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        message: "Failed to send SMS message",
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Twilio SMS Test</h1>
        <p className="text-muted-foreground mb-8">
          Use this page to test sending SMS messages through Twilio.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Send Test SMS</CardTitle>
              <CardDescription>
                Enter a phone number and message to test Twilio SMS functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="+15551234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter in E.164 format (e.g., +15551234567)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Your test message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send SMS"}
                </Button>
              </form>

              {result && (
                <div className="mt-6">
                  <Alert variant={result.success ? "default" : "destructive"}>
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertTitle>
                        {result.success ? "Success" : "Error"}
                      </AlertTitle>
                    </div>
                    <AlertDescription className="mt-2">
                      {result.message}
                      {result.sid && (
                        <div className="mt-2 text-xs">
                          <strong>Message SID:</strong> {result.sid}
                        </div>
                      )}
                      {result.error && (
                        <div className="mt-2 text-xs">
                          <strong>Error:</strong> {result.error}
                        </div>
                      )}
                      {result.recommendation && (
                        <div className="mt-2 text-xs p-2 bg-muted rounded-sm">
                          <strong>Recommendation:</strong> {result.recommendation}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About Twilio SMS Testing</CardTitle>
              <CardDescription>Important information about SMS testing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Test with real phone numbers</h3>
                <p className="text-sm text-muted-foreground">
                  This test will send real SMS messages using your Twilio account.
                  Standard Twilio charges may apply.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">Number format</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  Always use E.164 format for phone numbers:
                </p>
                <ul className="list-disc pl-6 text-sm text-muted-foreground">
                  <li>Start with + sign</li>
                  <li>Country code (e.g., 1 for US)</li>
                  <li>Area code and phone number</li>
                  <li>Example: +15551234567</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium">Twilio phone number</h3>
                <p className="text-sm text-muted-foreground">
                  Messages will be sent from: <strong>+14703007379</strong> <span className="text-xs">(E.164 format)</span>
                </p>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded-md">
                <h3 className="font-medium text-amber-800 dark:text-amber-300 text-sm">Twilio Trial Account Limitations:</h3>
                <ul className="mt-2 text-xs space-y-1 text-amber-700 dark:text-amber-400">
                  <li>• Trial accounts can only send SMS to <strong>verified phone numbers</strong> in your Twilio account</li>
                  <li>• You must verify each recipient number in the Twilio console first</li>
                  <li>• Messages will show "Sent from your Twilio trial account" prefix</li>
                  <li>• The API may return success (with SID) even if the message can't be delivered</li>
                  <li>• Check the Twilio console logs to confirm actual delivery status</li>
                </ul>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                  To bypass these limitations, upgrade to a paid Twilio account.
                </p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-md mt-4">
                <h3 className="font-medium text-blue-800 dark:text-blue-300 text-sm">Debugging Tips:</h3>
                <ul className="mt-2 text-xs space-y-1 text-blue-700 dark:text-blue-400">
                  <li>• If SMS fails despite success message, check that the number is verified</li>
                  <li>• Our system will format phone numbers to E.164 automatically</li>
                  <li>• When testing with your own phone, verify it in Twilio first</li>
                  <li>• Look for detailed error messages in server logs</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}