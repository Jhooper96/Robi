import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Message, MessageFilter, MessageResponse, MessageAssign } from "@shared/schema";
import MainLayout from "@/components/layout/MainLayout";
import { 
  getMessages, 
  respondToMessage, 
  assignMessage, 
  resolveMessage,
  updateMessageStatus,
  MessageStatusUpdate
} from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MessageCard from "@/components/dashboard/MessageCard";
import MessageFilters from "@/components/dashboard/MessageFilters";
import { Loader2 } from "lucide-react";

export default function Messages() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<MessageFilter & { sortOrder?: 'newest' | 'oldest' }>({
    sortOrder: 'newest' // Default to newest first
  });
  const [activeTab, setActiveTab] = useState<"all" | "active" | "resolved">("all");

  // Query to fetch messages with filters
  const { data: messages, isLoading } = useQuery({
    queryKey: ['/api/messages', filters],
    queryFn: () => getMessages(filters),
  });

  // Response mutation
  const responseMutation = useMutation({
    mutationFn: (data: MessageResponse) => respondToMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: "Message sent",
        description: "Your response has been sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Assignment mutation
  const assignMutation = useMutation({
    mutationFn: (data: MessageAssign) => assignMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: "Message assigned",
        description: "The message has been assigned successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error assigning message",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: (messageId: number) => resolveMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: "Message resolved",
        description: "The message has been marked as resolved",
      });
    },
    onError: (error) => {
      toast({
        title: "Error resolving message",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (data: MessageStatusUpdate) => updateMessageStatus(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      const statusLabels = {
        'escalated_vendor': 'escalated to vendor',
        'pending_repair': 'scheduled for repair',
        'in_progress': 'in progress',
        'resolved': 'resolved'
      };
      toast({
        title: "Status updated",
        description: `The message has been ${statusLabels[variables.status as keyof typeof statusLabels] || variables.status}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle filter change
  const handleFilterChange = (newFilters: MessageFilter & { sortOrder?: 'newest' | 'oldest' }) => {
    setFilters(newFilters);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as "all" | "active" | "resolved");
    
    // Update filters based on tab
    const newFilters = { ...filters };
    if (value === "active") {
      newFilters.status = "open";
    } else if (value === "resolved") {
      newFilters.status = "resolved";
    } else {
      // "all" tab - remove status filter
      delete newFilters.status;
    }
    
    setFilters(newFilters);
  };

  // AI response handler
  const handleSendAiReply = (messageId: number) => {
    responseMutation.mutate({
      messageId,
      responseContent: "", // AI will generate the response
      useAiResponse: true
    });
  };

  // Custom response handler
  const handleCustomReply = (messageId: number, content: string) => {
    responseMutation.mutate({
      messageId,
      responseContent: content,
      useAiResponse: false
    });
  };

  // Assignment handler
  const handleAssign = (messageId: number, userId: number) => {
    assignMutation.mutate({
      messageId,
      userId
    });
  };

  // Resolve handler
  const handleResolve = (messageId: number) => {
    resolveMutation.mutate(messageId);
  };
  
  // Update status handler
  const handleUpdateStatus = (messageId: number, status: string) => {
    updateStatusMutation.mutate({
      messageId,
      status
    });
  };

  // Filter messages based on active tab
  const getFilteredMessages = () => {
    if (!messages) return [];
    
    if (activeTab === "active") {
      return messages.filter(m => m.status !== "resolved");
    } else if (activeTab === "resolved") {
      return messages.filter(m => m.status === "resolved");
    }
    
    return messages;
  };

  const filteredMessages = getFilteredMessages();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <MessageFilters onFilterChange={handleFilterChange} />
        </div>

        <Tabs defaultValue="all" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">All Messages</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : filteredMessages.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No messages found. Try adjusting your filters.
                </CardContent>
              </Card>
            ) : (
              filteredMessages.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  onSendAiReply={handleSendAiReply}
                  onCustomReply={handleCustomReply}
                  onAssign={handleAssign}
                  onResolve={handleResolve}
                  onUpdateStatus={handleUpdateStatus}
                  isResponding={responseMutation.isPending}
                  isAssigning={assignMutation.isPending}
                  isUpdatingStatus={updateStatusMutation.isPending}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="active" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : filteredMessages.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No active messages found. Try adjusting your filters.
                </CardContent>
              </Card>
            ) : (
              filteredMessages.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  onSendAiReply={handleSendAiReply}
                  onCustomReply={handleCustomReply}
                  onAssign={handleAssign}
                  onResolve={handleResolve}
                  onUpdateStatus={handleUpdateStatus}
                  isResponding={responseMutation.isPending}
                  isAssigning={assignMutation.isPending}
                  isUpdatingStatus={updateStatusMutation.isPending}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="resolved" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : filteredMessages.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No resolved messages found. Try adjusting your filters.
                </CardContent>
              </Card>
            ) : (
              filteredMessages.map((message) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  onSendAiReply={handleSendAiReply}
                  onCustomReply={handleCustomReply}
                  onAssign={handleAssign}
                  onResolve={handleResolve}
                  onUpdateStatus={handleUpdateStatus}
                  isResponding={responseMutation.isPending}
                  isAssigning={assignMutation.isPending}
                  isUpdatingStatus={updateStatusMutation.isPending}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}