import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useQuery } from '@tanstack/react-query';
import { getProperties } from '@/lib/api';
import { MessageFilter } from '@shared/schema';
import { ArrowDownUp, AlertTriangle, CheckCircle, ArrowUpDown } from "lucide-react";

interface MessageFiltersProps {
  onFilterChange: (filters: MessageFilter) => void;
}

export interface ExtendedMessageFilter extends MessageFilter {
  sortOrder?: 'newest' | 'oldest';
}

const MessageFilters = ({ onFilterChange }: MessageFiltersProps) => {
  const [propertyId, setPropertyId] = useState<string>('');
  const [urgency, setUrgency] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showEmergenciesOnly, setShowEmergenciesOnly] = useState(false);
  const [showUnresolvedOnly, setShowUnresolvedOnly] = useState(false);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  // Fetch properties
  const { data: properties = [] } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: getProperties
  });

  // Apply filters when they change
  useEffect(() => {
    const filters: ExtendedMessageFilter = {};
    
    // Basic filters
    if (propertyId && propertyId !== 'all') filters.propertyId = parseInt(propertyId);
    
    // Type-safe urgency value
    if (!showEmergenciesOnly && urgency && urgency !== 'all') {
      const validUrgencies = ['emergency', 'high', 'medium', 'low'] as const;
      if (validUrgencies.includes(urgency as any)) {
        filters.urgency = urgency as any;
      }
    }
    
    // Type-safe status value
    if (!showUnresolvedOnly && status && status !== 'all') {
      const validStatuses = ['open', 'in_progress', 'resolved', 'escalated_vendor', 'pending_repair'] as const;
      if (validStatuses.includes(status as any)) {
        filters.status = status as any;
      }
    }
    
    // Toggle filters take precedence over dropdown filters
    if (showEmergenciesOnly) filters.urgency = 'emergency' as const;
    if (showUnresolvedOnly) filters.status = 'open' as const;
    
    // Add sort order
    filters.sortOrder = sortOrder;
    
    onFilterChange(filters);
  }, [
    propertyId, 
    urgency, 
    status, 
    sortOrder, 
    showEmergenciesOnly, 
    showUnresolvedOnly, 
    onFilterChange
  ]);

  const toggleFilters = () => {
    setIsFiltersExpanded(!isFiltersExpanded);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  return (
    <Card className="mb-6">
      <CardContent className="py-4">
        <div className="flex flex-col space-y-4">
          {/* Top row with toggles and sort button */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-medium text-slate-900">Messages</h3>
            
            <div className="flex flex-wrap items-center gap-4">
              {/* Quick filter toggles */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="emergency-toggle" 
                    checked={showEmergenciesOnly}
                    onCheckedChange={setShowEmergenciesOnly}
                  />
                  <label 
                    htmlFor="emergency-toggle" 
                    className="text-sm cursor-pointer flex items-center gap-1"
                  >
                    <AlertTriangle size={16} className="text-red-500" /> 
                    Emergencies only
                  </label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    id="unresolved-toggle" 
                    checked={showUnresolvedOnly}
                    onCheckedChange={setShowUnresolvedOnly}
                  />
                  <label 
                    htmlFor="unresolved-toggle" 
                    className="text-sm cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle size={16} className="text-yellow-500" /> 
                    Unresolved only
                  </label>
                </div>
              </div>
              
              {/* Sort button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleSortOrder} 
                className="flex items-center gap-1"
              >
                <ArrowUpDown size={16} /> 
                Sort: {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
              </Button>
              
              {/* More filters button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleFilters} 
                className="flex items-center gap-1"
              >
                <ArrowDownUp size={16} /> 
                {isFiltersExpanded ? 'Less filters' : 'More filters'}
              </Button>
            </div>
          </div>
          
          {/* Advanced filters (expandable) */}
          {isFiltersExpanded && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <div className="flex items-center min-w-[200px]">
                <span className="text-sm text-slate-600 mr-2 whitespace-nowrap">Property:</span>
                <Select value={propertyId} onValueChange={setPropertyId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Properties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties.map((property: any) => (
                      <SelectItem key={property.id} value={property.id.toString()}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center min-w-[180px]">
                <span className="text-sm text-slate-600 mr-2 whitespace-nowrap">Priority:</span>
                <Select 
                  value={urgency} 
                  onValueChange={setUrgency}
                  disabled={showEmergenciesOnly}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center min-w-[180px]">
                <span className="text-sm text-slate-600 mr-2 whitespace-nowrap">Status:</span>
                <Select 
                  value={status} 
                  onValueChange={setStatus}
                  disabled={showUnresolvedOnly}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="escalated_vendor">Escalated to Vendor</SelectItem>
                    <SelectItem value="pending_repair">Pending Repair</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageFilters;
