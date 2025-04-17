import { useState } from "react";
import { Link } from "wouter";
import { Message } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Define message metadata interface for type safety
interface MessageMetadata {
  tenantName?: string;
  unitNumber?: string;
  propertyName?: string;
  phone?: string;
  [key: string]: any;
}
import { 
  Send,
  PencilLine,
  ClipboardEdit,
  Clock,
  CheckCircle,
  ExternalLink,
  Wrench,
  User
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";

interface MessageCardProps {
  message: Message;
  onSendAiReply: (messageId: number) => void;
  onCustomReply: (messageId: number, content: string) => void;
  onAssign: (messageId: number, userId: number) => void;
  onResolve: (messageId: number) => void;
  onUpdateStatus: (messageId: number, status: string) => void;
  isResponding: boolean;
  isAssigning: boolean;
  isUpdatingStatus?: boolean;
}

const MessageCard = ({ 
  message,
  onSendAiReply,
  onCustomReply,
  onAssign,
  onResolve,
  onUpdateStatus,
  isResponding,
  isAssigning,
  isUpdatingStatus = false
}: MessageCardProps) => {
  const [isCustomReplyOpen, setIsCustomReplyOpen] = useState(false);
  const [customReply, setCustomReply] = useState("");

  // Helper to get the border color based on urgency
  const getUrgencyBorderColor = () => {
    switch (message.urgency) {
      case "emergency":
        return "border-l-4 border-[#dc2626]";
      case "high":
        return "border-l-4 border-[#f97316]";
      case "medium":
        return "border-l-4 border-[#eab308]";
      case "low":
        return "border-l-4 border-[#10b981]";
      default:
        return "border-l-4 border-[#10b981]";
    }
  };

  // Helper to get badge color
  const getUrgencyBadgeColor = () => {
    switch (message.urgency) {
      case "emergency":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getChannelBadge = () => {
    return "bg-slate-100 text-slate-800";
  };

  const getCategoryBadge = () => {
    return "bg-blue-100 text-blue-800";
  };

  // Handle custom reply submission
  const handleSubmitCustomReply = () => {
    if (customReply.trim()) {
      onCustomReply(message.id, customReply);
      setIsCustomReplyOpen(false);
      setCustomReply("");
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp: Date | string | null) => {
    if (!timestamp) return 'unknown date';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  // Get a tenant placeholder image
  const getTenantImage = () => {
    // Return a consistent avatar based on the tenant id
    const seed = message.tenantId || 1;
    return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
  };

  return (
    <Card className={`shadow rounded-lg overflow-hidden ${getUrgencyBorderColor()}`}>
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Avatar className="h-10 w-10">
                <img src={getTenantImage()} alt="Tenant" />
              </Avatar>
            </div>
            <div className="ml-4">
              <Link to={`/tenant/${message.tenantId}`}>
                <h3 className="text-lg font-medium text-slate-900 hover:text-primary flex items-center">
                  {message.metadata?.tenantName || "Tenant"}
                  <User className="ml-1 h-4 w-4 text-primary" />
                </h3>
              </Link>
              <div className="flex items-center">
                <Link to={`/tenant/${message.tenantId}`}>
                  <span className="text-sm text-slate-500 hover:text-primary hover:underline">
                    {message.metadata?.unitNumber || "Unit"}, {message.metadata?.propertyName || "Property"}
                  </span>
                </Link>
                <span className="mx-2 text-slate-300">•</span>
                <span className="text-sm text-slate-500">
                  {formatRelativeTime(message.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getUrgencyBadgeColor()}`}>
              {message.urgency.charAt(0).toUpperCase() + message.urgency.slice(1)}
            </span>
            {message.category && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadge()}`}>
                {message.category.charAt(0).toUpperCase() + message.category.slice(1)}
              </span>
            )}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getChannelBadge()}`}>
              {message.channel.charAt(0).toUpperCase() + message.channel.slice(1)}
            </span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="bg-slate-50 rounded-lg p-4 mb-3">
            {message.channel === "voicemail" && (
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 text-slate-400 mr-2" />
                <span className="text-xs text-slate-500">Voicemail Transcription</span>
              </div>
            )}
            <p className="text-sm text-slate-700">
              {message.content}
            </p>
          </div>
          
          {message.aiSummary && message.aiResponse && (
            <div className="bg-indigo-50 rounded-lg p-4 border-l-2 border-indigo-300">
              <div className="flex items-center mb-2">
                <svg className="h-5 w-5 text-indigo-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h4 className="text-sm font-medium text-indigo-700">AI Triage &amp; Response Draft</h4>
              </div>
              <p className="text-sm text-indigo-900 mb-2">
                <strong>Summary:</strong> {message.aiSummary}
              </p>
              <p className="text-sm text-indigo-900 mb-2">
                <strong>Suggested Reply:</strong> {message.aiResponse}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="flex items-center space-x-3 mb-3 sm:mb-0">
            <Button 
              size="sm"
              onClick={() => onSendAiReply(message.id)}
              disabled={isResponding || !message.aiResponse}
            >
              <Send className="-ml-0.5 mr-2 h-4 w-4" />
              Send AI Reply
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsCustomReplyOpen(true)}
              disabled={isResponding}
            >
              Custom Reply
            </Button>
          </div>

          <div className="flex items-center space-x-3 flex-wrap">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onAssign(message.id, 1)} // Default to first user for now
              disabled={isAssigning}
            >
              <ClipboardEdit className="-ml-0.5 mr-2 h-4 w-4" />
              Assign
            </Button>
            <Button 
              variant={message.status === "resolved" ? "secondary" : "outline"}
              size="sm"
              onClick={() => onResolve(message.id)}
              disabled={message.status === "resolved" || isUpdatingStatus}
            >
              <CheckCircle className="-ml-0.5 mr-2 h-4 w-4" />
              {message.status === "resolved" ? "Resolved" : "Mark as Resolved"}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onUpdateStatus(message.id, "escalated_vendor")}
              disabled={message.status === "escalated_vendor" || isUpdatingStatus}
            >
              <ExternalLink className="-ml-0.5 mr-2 h-4 w-4" />
              {message.status === "escalated_vendor" ? "Escalated" : "Escalate to Vendor"}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onUpdateStatus(message.id, "pending_repair")}
              disabled={message.status === "pending_repair" || isUpdatingStatus}
            >
              <Wrench className="-ml-0.5 mr-2 h-4 w-4" />
              {message.status === "pending_repair" ? "Repair Scheduled" : "Schedule Repair"}
            </Button>
          </div>
        </div>
      </div>

      {/* Custom Reply Dialog */}
      <Dialog open={isCustomReplyOpen} onOpenChange={setIsCustomReplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom Reply</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Enter your custom response..."
            value={customReply}
            onChange={(e) => setCustomReply(e.target.value)}
            className="min-h-[150px] mt-2"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomReplyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitCustomReply} disabled={!customReply.trim()}>
              <PencilLine className="mr-2 h-4 w-4" />
              Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MessageCard;
