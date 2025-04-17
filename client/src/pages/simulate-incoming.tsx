import { useState, FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send, Loader2, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getTenants } from "@/lib/api";

// Function to simulate an incoming SMS
const simulateIncomingSMS = async (data: { 
  From: string, 
  Body: string 
}) => {
  const response = await apiRequest("POST", "/api/simulate/sms", data);
  return response.json();
};

export default function SimulateIncoming() {
  const { toast } = useToast();
  const [messageBody, setMessageBody] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  
  // Fetch tenants
  const { data: tenants = [], isLoading: isLoadingTenants } = useQuery({
    queryKey: ['/api/tenants'],
    queryFn: getTenants
  });

  // Set up mutation
  const { mutate: sendSimulatedSMS, isPending: isSending } = useMutation({
    mutationFn: simulateIncomingSMS,
    onSuccess: (data) => {
      toast({
        title: "Simulated SMS processed",
        description: "Check the Messages page to see your message",
      });
      setMessageBody("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to simulate SMS",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedTenantId) {
      toast({
        title: "No tenant selected",
        description: "Please select a tenant from the dropdown",
        variant: "destructive"
      });
      return;
    }
    
    if (!messageBody.trim()) {
      toast({
        title: "No message content",
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }
    
    // Find the selected tenant's phone number
    const selectedTenant = tenants.find(tenant => tenant.id.toString() === selectedTenantId);
    
    if (!selectedTenant?.phone) {
      toast({
        title: "Missing phone number",
        description: "Selected tenant doesn't have a phone number",
        variant: "destructive"
      });
      return;
    }
    
    // Send the simulated SMS
    sendSimulatedSMS({
      From: selectedTenant.phone,
      Body: messageBody
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <MessageSquare className="mr-2 h-6 w-6 text-primary" />
            Simulate Incoming SMS
          </h1>
          <p className="text-muted-foreground">
            Test the system by simulating an incoming SMS from a tenant
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Simulate Tenant SMS</CardTitle>
            <CardDescription>
              This will process a message as if it was received from the tenant's phone number
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenant">Select Tenant</Label>
                <Select 
                  value={selectedTenantId}
                  onValueChange={setSelectedTenantId}
                >
                  <SelectTrigger id="tenant">
                    <SelectValue placeholder="Select a tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants
                      .filter(tenant => tenant.phone) // Only show tenants with phone numbers
                      .map(tenant => (
                        <SelectItem key={tenant.id} value={tenant.id.toString()}>
                          {tenant.name} - {tenant.phone}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type a maintenance request like 'My sink is leaking' or 'The heating is broken'"
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Simulate SMS
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <RefreshCw className="h-5 w-5 text-amber-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Why use this simulator?</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  The Twilio webhook needs to be accessible from the internet to receive real SMS messages.
                  This simulator allows you to test the SMS processing functionality within the Replit environment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}