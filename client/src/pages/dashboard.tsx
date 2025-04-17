import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMessages, getMessageStats, respondToMessage, assignMessage } from "@/lib/api";
import { MessageFilter, MessageResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import StatCard from "@/components/dashboard/StatCard";
import MessageCard from "@/components/dashboard/MessageCard";
import MessageFilters from "@/components/dashboard/MessageFilters";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<MessageFilter>({});
  
  // Fetch messages
  const { 
    data: messages = [], 
    isLoading: messagesLoading,
    isError: messagesError,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['/api/messages', filters],
    queryFn: () => getMessages(filters),
  });

  // Fetch message stats
  const { 
    data: stats = { active: 0, emergency: 0, pending: 0, resolved: 0 }, 
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ['/api/messages/stats'],
    queryFn: getMessageStats,
  });

  // Response mutation
  const responseMutation = useMutation({
    mutationFn: (data: MessageResponse) => respondToMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/stats'] });
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
    mutationFn: assignMessage,
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

  // Handle filter change
  const handleFilterChange = (newFilters: MessageFilter) => {
    setFilters(newFilters);
  };

  // Handle send AI reply
  const handleSendAiReply = (messageId: number) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.aiResponse) return;
    
    responseMutation.mutate({
      messageId,
      responseContent: message.aiResponse,
      useAiResponse: true
    });
  };

  // Handle custom reply
  const handleCustomReply = (messageId: number, responseContent: string) => {
    responseMutation.mutate({
      messageId,
      responseContent,
      useAiResponse: false
    });
  };

  // Handle assign
  const handleAssign = (messageId: number, userId: number) => {
    assignMutation.mutate({
      messageId,
      userId
    });
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          AI-powered communication assistant for property management
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard 
          title="Active Messages" 
          value={stats.active} 
          icon="messages"
          color="blue"
          isLoading={statsLoading} 
        />
        <StatCard 
          title="Emergency Issues" 
          value={stats.emergency} 
          icon="alert" 
          color="red"
          isLoading={statsLoading} 
        />
        <StatCard 
          title="Pending Responses" 
          value={stats.pending} 
          icon="pending"
          color="yellow" 
          isLoading={statsLoading} 
        />
        <StatCard 
          title="Resolved Today" 
          value={stats.resolved} 
          icon="check"
          color="green" 
          isLoading={statsLoading} 
        />
      </div>

      {/* Filters */}
      <MessageFilters onFilterChange={handleFilterChange} />

      {/* Messages List */}
      <div className="space-y-4">
        {messagesLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : messagesError ? (
          <div className="py-8 text-center">
            <p className="text-red-500">Error loading messages</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => refetchMessages()}
            >
              Try Again
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-slate-500">No messages found</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              onSendAiReply={handleSendAiReply}
              onCustomReply={handleCustomReply}
              onAssign={handleAssign}
              isResponding={responseMutation.isPending}
              isAssigning={assignMutation.isPending}
            />
          ))
        )}
      </div>

      {/* Load more button */}
      {messages.length > 0 && (
        <div className="mt-6 text-center">
          <Button variant="outline">
            Load More Messages
          </Button>
        </div>
      )}
    </MainLayout>
  );
}
