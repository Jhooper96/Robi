import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Message, Tenant, Property } from "@shared/schema";
import MainLayout from "@/components/layout/MainLayout";
import { getMessages, getTenants, getProperties } from "@/lib/api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, Home, MessageCircle, AlertTriangle, Clock } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import MessageCard from "@/components/dashboard/MessageCard";

export default function TenantProfile() {
  const [location, setLocation] = useLocation();
  const [tenantId, setTenantId] = useState<number | null>(null);
  
  // Extract tenant ID from URL
  useEffect(() => {
    const id = location.split("/").pop();
    if (id && !isNaN(parseInt(id))) {
      setTenantId(parseInt(id));
    }
  }, [location]);
  
  // Fetch tenant data
  const { data: tenants = [] } = useQuery({
    queryKey: ['/api/tenants'],
    queryFn: getTenants
  });
  
  // Find the current tenant
  const tenant = tenants.find(t => t.id === tenantId);
  
  // Fetch messages for this tenant
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/messages', { tenantId }],
    queryFn: () => getMessages({ tenantId }),
    enabled: !!tenantId
  });
  
  // Fetch properties for the tenant's property
  const { data: properties = [] } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: getProperties
  });
  
  // Find the property for this tenant
  const property = properties.find(p => p.id === tenant?.propertyId);
  
  // Emergency messages for quick access
  const emergencyMessages = messages.filter(m => m.urgency === 'emergency');
  
  // Recent messages
  const recentMessages = [...messages].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  }).slice(0, 5);
  
  // Back to tenants list
  const handleBack = () => {
    setLocation("/tenants");
  };
  
  if (!tenant) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to tenants
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6 text-center">
              Tenant not found or still loading...
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to tenants
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tenant Information Card */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Tenant Information</CardTitle>
              <CardDescription>Contact details and unit information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">{tenant.name}</h3>
                {tenant.email && (
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    <a href={`mailto:${tenant.email}`} className="hover:underline">
                      {tenant.email}
                    </a>
                  </div>
                )}
                {tenant.phone && (
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    <a href={`tel:${tenant.phone}`} className="hover:underline">
                      {tenant.phone}
                    </a>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="font-medium">Property Information</h4>
                <div className="flex items-start gap-2">
                  <Home className="h-4 w-4 mt-1" />
                  <div>
                    <div className="font-medium">{property?.name || 'Unknown Property'}</div>
                    <div className="text-sm text-muted-foreground">Unit #{tenant.unitNumber}</div>
                    {property && (
                      <div className="text-sm text-muted-foreground mt-1">{property.address}</div>
                    )}
                  </div>
                </div>
              </div>
              
              {emergencyMessages.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                      Emergency Issues
                    </h4>
                    <div className="space-y-2">
                      {emergencyMessages.map(message => (
                        <div key={message.id} className="rounded-md bg-red-50 p-3">
                          <div className="text-sm font-medium text-red-800">
                            {message.content.length > 100
                              ? `${message.content.substring(0, 100)}...`
                              : message.content}
                          </div>
                          <div className="mt-1 text-xs text-red-700">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : 'unknown time'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Message History Tab Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Communication History</CardTitle>
              <CardDescription>All messages and interactions with this tenant</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="all">All Messages</TabsTrigger>
                  <TabsTrigger value="open">Unresolved</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>
                
                {/* All Messages Tab */}
                <TabsContent value="all" className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No message history with this tenant yet.
                    </div>
                  ) : (
                    messages.map(message => (
                      <div key={message.id} className="mb-4">
                        <Card className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className={`p-1 text-xs text-white text-center ${
                              message.urgency === 'emergency' ? 'bg-red-500' :
                              message.urgency === 'high' ? 'bg-orange-500' :
                              message.urgency === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}>
                              {message.urgency.charAt(0).toUpperCase() + message.urgency.slice(1)} Priority
                            </div>
                            <div className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <MessageCircle className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-medium">
                                    {message.channel === 'sms' ? 'SMS' : 
                                     message.channel === 'email' ? 'Email' : 'Voicemail'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={
                                    message.status === 'resolved' ? 'default' :
                                    message.status === 'in_progress' ? 'secondary' :
                                    message.status === 'escalated_vendor' ? 'destructive' :
                                    message.status === 'pending_repair' ? 'outline' :
                                    'destructive'
                                  }>
                                    {message.status === 'escalated_vendor' ? 'Vendor' :
                                     message.status === 'pending_repair' ? 'Scheduled' :
                                     message.status.charAt(0).toUpperCase() + message.status.slice(1).replace('_', ' ')}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : 'unknown time'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mt-2">
                                <p className="text-sm">{message.content}</p>
                              </div>
                              
                              {message.aiSummary && (
                                <div className="mt-2 p-2 bg-muted rounded text-xs">
                                  <strong>AI Summary:</strong> {message.aiSummary}
                                </div>
                              )}
                              
                              {message.responseContent && (
                                <div className="mt-3 border-t pt-3">
                                  <div className="flex items-start gap-2">
                                    <div className="bg-primary rounded-full p-1 mt-0.5">
                                      <MessageCircle className="h-3 w-3 text-primary-foreground" />
                                    </div>
                                    <div>
                                      <div className="text-xs font-semibold mb-1">Our Response:</div>
                                      <p className="text-sm">{message.responseContent}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))
                  )}
                </TabsContent>
                
                {/* Unresolved Tab */}
                <TabsContent value="open" className="space-y-4">
                  {messages.filter(m => m.status !== 'resolved').length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No unresolved messages with this tenant.
                    </div>
                  ) : (
                    messages
                      .filter(m => m.status !== 'resolved')
                      .map(message => (
                        <div key={message.id} className="mb-4">
                          <Card className="overflow-hidden">
                            <CardContent className="p-0">
                              <div className={`p-1 text-xs text-white text-center ${
                                message.urgency === 'emergency' ? 'bg-red-500' :
                                message.urgency === 'high' ? 'bg-orange-500' :
                                message.urgency === 'medium' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}>
                                {message.urgency.charAt(0).toUpperCase() + message.urgency.slice(1)} Priority
                              </div>
                              <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium">
                                      {message.channel === 'sms' ? 'SMS' : 
                                      message.channel === 'email' ? 'Email' : 'Voicemail'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={
                                      message.status === 'in_progress' ? 'secondary' :
                                      message.status === 'escalated_vendor' ? 'destructive' :
                                      message.status === 'pending_repair' ? 'outline' :
                                      'destructive'
                                    }>
                                      {message.status === 'escalated_vendor' ? 'Vendor' :
                                      message.status === 'pending_repair' ? 'Scheduled' :
                                      message.status.charAt(0).toUpperCase() + message.status.slice(1).replace('_', ' ')}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : 'unknown time'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="mt-2">
                                  <p className="text-sm">{message.content}</p>
                                </div>
                                
                                {message.aiSummary && (
                                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                                    <strong>AI Summary:</strong> {message.aiSummary}
                                  </div>
                                )}
                                
                                {message.responseContent && (
                                  <div className="mt-3 border-t pt-3">
                                    <div className="flex items-start gap-2">
                                      <div className="bg-primary rounded-full p-1 mt-0.5">
                                        <MessageCircle className="h-3 w-3 text-primary-foreground" />
                                      </div>
                                      <div>
                                        <div className="text-xs font-semibold mb-1">Our Response:</div>
                                        <p className="text-sm">{message.responseContent}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))
                  )}
                </TabsContent>
                
                {/* Resolved Tab */}
                <TabsContent value="resolved" className="space-y-4">
                  {messages.filter(m => m.status === 'resolved').length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No resolved messages with this tenant.
                    </div>
                  ) : (
                    messages
                      .filter(m => m.status === 'resolved')
                      .map(message => (
                        <div key={message.id} className="mb-4">
                          <Card className="overflow-hidden">
                            <CardContent className="p-0">
                              <div className={`p-1 text-xs text-white text-center ${
                                message.urgency === 'emergency' ? 'bg-red-500' :
                                message.urgency === 'high' ? 'bg-orange-500' :
                                message.urgency === 'medium' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}>
                                {message.urgency.charAt(0).toUpperCase() + message.urgency.slice(1)} Priority
                              </div>
                              <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium">
                                      {message.channel === 'sms' ? 'SMS' : 
                                      message.channel === 'email' ? 'Email' : 'Voicemail'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge>Resolved</Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : 'unknown time'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="mt-2">
                                  <p className="text-sm">{message.content}</p>
                                </div>
                                
                                {message.aiSummary && (
                                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                                    <strong>AI Summary:</strong> {message.aiSummary}
                                  </div>
                                )}
                                
                                {message.responseContent && (
                                  <div className="mt-3 border-t pt-3">
                                    <div className="flex items-start gap-2">
                                      <div className="bg-primary rounded-full p-1 mt-0.5">
                                        <MessageCircle className="h-3 w-3 text-primary-foreground" />
                                      </div>
                                      <div>
                                        <div className="text-xs font-semibold mb-1">Our Response:</div>
                                        <p className="text-sm">{message.responseContent}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}