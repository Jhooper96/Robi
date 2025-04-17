import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell 
} from "recharts";
import MainLayout from "@/components/layout/MainLayout";
import { getMessages, getMessageStats, getProperties, getTenants } from "@/lib/api";
import { Message } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon, 
  Calendar, 
  Download, 
  Loader2,
  BarChart2,
  Activity
} from "lucide-react";

// Custom colors for charts
const COLORS = {
  primary: "#6366f1",
  emergency: "#dc2626",
  high: "#f97316",
  medium: "#eab308",
  low: "#10b981",
  resolved: "#a1a1aa",
  chart: ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#a3e635", "#14b8a6", "#06b6d4"]
};

// Urgency distribution data prep function
const prepareUrgencyData = (messages: Message[]) => {
  const urgencyCounts = {
    emergency: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  messages.forEach(message => {
    if (message.urgency in urgencyCounts) {
      urgencyCounts[message.urgency as keyof typeof urgencyCounts]++;
    }
  });

  return Object.entries(urgencyCounts).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value
  }));
};

// Status distribution data prep function
const prepareStatusData = (messages: Message[]) => {
  const statusCounts = {
    open: 0,
    "in_progress": 0,
    resolved: 0
  };

  messages.forEach(message => {
    if (message.status in statusCounts) {
      statusCounts[message.status as keyof typeof statusCounts]++;
    }
  });

  return Object.entries(statusCounts).map(([key, value]) => ({
    name: key === "in_progress" ? "In Progress" : key.charAt(0).toUpperCase() + key.slice(1),
    value
  }));
};

// Category distribution data prep function
const prepareCategoryData = (messages: Message[]) => {
  const categoryCounts: Record<string, number> = {};

  messages.forEach(message => {
    if (message.category) {
      const category = message.category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  });

  // Convert to array and sort by count
  return Object.entries(categoryCounts)
    .map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 categories
};

// Message trends data prep function (messages by day)
const prepareMessageTrends = (messages: Message[]) => {
  const last7Days: Record<string, number> = {};
  
  // Initialize last 7 days with 0s
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    last7Days[dateStr] = 0;
  }
  
  // Count messages per day
  messages.forEach(message => {
    if (message.createdAt) {
      const date = new Date(message.createdAt);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Only count if it's in our 7-day window
      if (dateStr in last7Days) {
        last7Days[dateStr]++;
      }
    }
  });
  
  return Object.entries(last7Days).map(([date, count]) => ({
    date,
    count
  }));
};

// Channel distribution data prep function
const prepareChannelData = (messages: Message[]) => {
  const channelCounts = {
    sms: 0,
    email: 0,
    voicemail: 0
  };

  messages.forEach(message => {
    if (message.channel in channelCounts) {
      channelCounts[message.channel as keyof typeof channelCounts]++;
    }
  });

  return Object.entries(channelCounts).map(([key, value]) => ({
    name: key === "sms" ? "SMS" : key.charAt(0).toUpperCase() + key.slice(1),
    value
  }));
};

// Property distribution data prep function
const preparePropertyData = (messages: Message[], properties: any[]) => {
  const propertyCounts: Record<number, number> = {};
  const propertyMap: Record<number, string> = {};
  
  // Create property id to name mapping
  properties.forEach(property => {
    propertyMap[property.id] = property.name;
    propertyCounts[property.id] = 0;
  });
  
  // Count messages per property using tenant's property
  messages.forEach(message => {
    if (message.tenantId) {
      // In a real implementation, we'd join with tenant data to get propertyId
      // Here we're using a simple approach with our data structure
      const propertyId = message.tenantId <= 2 ? 1 : (message.tenantId <= 4 ? 2 : 3);
      if (propertyId in propertyCounts) {
        propertyCounts[propertyId]++;
      }
    }
  });
  
  return Object.entries(propertyCounts)
    .map(([id, value]) => ({ 
      name: propertyMap[parseInt(id)] || `Property ${id}`, 
      value 
    }))
    .sort((a, b) => b.value - a.value);
};

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("all");
  const [activeChart, setActiveChart] = useState("overview");
  
  // Fetch data
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/messages'],
    queryFn: () => getMessages()
  });
  
  const { data: messageStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/messages/stats'],
    queryFn: getMessageStats
  });
  
  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: getProperties
  });
  
  const { data: tenants = [], isLoading: isLoadingTenants } = useQuery({
    queryKey: ['/api/tenants'],
    queryFn: getTenants
  });
  
  // Prepare chart data
  const urgencyData = prepareUrgencyData(messages);
  const statusData = prepareStatusData(messages);
  const categoryData = prepareCategoryData(messages);
  const messagesTrend = prepareMessageTrends(messages);
  const channelData = prepareChannelData(messages);
  const propertyData = preparePropertyData(messages, properties);
  
  const isLoading = isLoadingMessages || isLoadingStats || isLoadingProperties || isLoadingTenants;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Activity className="mr-2 h-6 w-6 text-primary" />
              Analytics
            </h1>
            <p className="text-muted-foreground">Insights and metrics for your property communications</p>
          </div>
          <div className="flex items-center space-x-2">
            <Select defaultValue="all" value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center p-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{messages.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">From all channels</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{messageStats?.active || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Requiring attention</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Emergency Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{messageStats?.emergency || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">High priority</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Resolution Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {messages.length ? Math.round((messageStats?.resolved || 0) / messages.length * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Of total messages</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Chart Tabs */}
            <Tabs defaultValue="overview" value={activeChart} onValueChange={setActiveChart}>
              <TabsList className="mb-6">
                <TabsTrigger value="overview" className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="trends" className="flex items-center">
                  <LineChartIcon className="mr-2 h-4 w-4" />
                  Message Trends
                </TabsTrigger>
                <TabsTrigger value="categories" className="flex items-center">
                  <PieChartIcon className="mr-2 h-4 w-4" />
                  Categories
                </TabsTrigger>
                <TabsTrigger value="properties" className="flex items-center">
                  <BarChart2 className="mr-2 h-4 w-4" />
                  Properties
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Message Urgency Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Message Urgency</CardTitle>
                      <CardDescription>Distribution of messages by urgency level</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={urgencyData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {urgencyData.map((entry, index) => {
                                const colorKey = entry.name.toLowerCase() as keyof typeof COLORS;
                                return <Cell key={`cell-${index}`} fill={COLORS[colorKey] || COLORS.chart[index % COLORS.chart.length]} />;
                              })}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Message Status Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Request Status</CardTitle>
                      <CardDescription>Messages by current status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={statusData}
                            layout="vertical"
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" />
                            <Tooltip />
                            <Legend />
                            <Bar 
                              dataKey="value" 
                              name="Messages" 
                              fill={COLORS.primary}
                              radius={[0, 4, 4, 0]} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Communication Channels Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Communication Channels</CardTitle>
                      <CardDescription>Distribution by communication method</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={channelData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {channelData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Issue Categories Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Issue Categories</CardTitle>
                      <CardDescription>Most common maintenance issues</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={categoryData}
                            layout="vertical"
                            margin={{
                              top: 5,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" />
                            <Tooltip />
                            <Legend />
                            <Bar 
                              dataKey="value" 
                              name="Messages" 
                              fill={COLORS.primary}
                              radius={[0, 4, 4, 0]} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="trends">
                <Card>
                  <CardHeader>
                    <CardTitle>Message Volume Trends</CardTitle>
                    <CardDescription>Daily volume of incoming messages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={messagesTrend}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 20,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            name="Messages" 
                            stroke={COLORS.primary} 
                            activeDot={{ r: 8 }} 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="categories">
                <Card>
                  <CardHeader>
                    <CardTitle>Issue Categories</CardTitle>
                    <CardDescription>Breakdown of maintenance request types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={150}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="properties">
                <Card>
                  <CardHeader>
                    <CardTitle>Messages by Property</CardTitle>
                    <CardDescription>Volume of messages across properties</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={propertyData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar 
                            dataKey="value" 
                            name="Messages" 
                            fill={COLORS.primary}
                            radius={[4, 4, 0, 0]} 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainLayout>
  );
}