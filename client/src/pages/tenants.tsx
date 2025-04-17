import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tenant, Property } from "@shared/schema";
import MainLayout from "@/components/layout/MainLayout";
import { getTenants, getProperties, createTenant } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Users, 
  Plus, 
  Loader2, 
  User,
  Home,
  Mail,
  Phone,
  CalendarDays,
  Search,
  MessageSquare,
  Pencil,
  BadgeInfo,
  Building
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Tenants() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProperty, setFilterProperty] = useState<string>("all");
  const [newTenant, setNewTenant] = useState({
    name: "",
    email: "",
    phone: "",
    propertyId: 0,
    unitNumber: ""
  });

  // Fetch tenants and properties
  const { data: tenants = [], isLoading: isLoadingTenants } = useQuery({
    queryKey: ['/api/tenants'],
    queryFn: getTenants
  });

  const { data: properties = [], isLoading: isLoadingProperties } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: getProperties
  });

  // Filter tenants based on search and property filter
  const filteredTenants = tenants.filter((tenant: Tenant) => {
    const matchesSearch = searchQuery === "" ||
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.phone?.includes(searchQuery) ||
      tenant.unitNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProperty = filterProperty === "all" || 
      tenant.propertyId === parseInt(filterProperty);
    
    return matchesSearch && matchesProperty;
  });

  // Handle adding a new tenant
  const { mutate: addTenant, isPending: isAddingTenant } = useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      toast({
        title: "Tenant added",
        description: "The tenant has been successfully added",
      });
      // Close dialog and reset form
      setIsAddDialogOpen(false);
      setNewTenant({
        name: "",
        email: "",
        phone: "",
        propertyId: 0,
        unitNumber: ""
      });
      // Refresh the tenants list
      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add tenant",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAddTenant = () => {
    // Validation
    if (!newTenant.name.trim() || !newTenant.propertyId || !newTenant.unitNumber.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill out all required fields",
        variant: "destructive"
      });
      return;
    }

    // Call the API to add the tenant
    addTenant(newTenant);
  };

  // Get property name by ID
  const getPropertyName = (propertyId: number | null) => {
    if (!propertyId) return "Unknown";
    const property = properties.find((p: Property) => p.id === propertyId);
    return property ? property.name : "Unknown";
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Users className="mr-2 h-6 w-6 text-primary" />
              Tenants
            </h1>
            <p className="text-muted-foreground">Manage tenant information and communication</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tenants..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Select 
              value={filterProperty} 
              onValueChange={setFilterProperty}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {properties.map((property: Property) => (
                  <SelectItem key={property.id} value={property.id.toString()}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoadingTenants || isLoadingProperties ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTenants.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground mb-4">
                {searchQuery || filterProperty !== "all" 
                  ? "No tenants match your search criteria"
                  : "No tenants found. Add your first tenant to get started."}
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Tenant
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-md shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant: Tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        {tenant.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-muted-foreground mr-1.5" />
                        {getPropertyName(tenant.propertyId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {tenant.unitNumber}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
                          {tenant.email || "Not available"}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
                          {tenant.phone || "Not available"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                          Message
                        </Button>
                        <Button size="sm" variant="outline">
                          <Pencil className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Tenant Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Tenant</DialogTitle>
              <DialogDescription>
                Add tenant details including property assignment and contact information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="tenantName">Tenant Name *</Label>
                <Input 
                  id="tenantName" 
                  placeholder="John Doe" 
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenantEmail">Email</Label>
                  <Input 
                    id="tenantEmail" 
                    placeholder="email@example.com" 
                    type="email"
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenantPhone">Phone</Label>
                  <Input 
                    id="tenantPhone" 
                    placeholder="+1 (555) 123-4567" 
                    value={newTenant.phone}
                    onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenantProperty">Property *</Label>
                  <Select 
                    value={newTenant.propertyId ? newTenant.propertyId.toString() : ""} 
                    onValueChange={(value) => setNewTenant({ ...newTenant, propertyId: parseInt(value) })}
                  >
                    <SelectTrigger id="tenantProperty">
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property: Property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenantUnit">Unit Number *</Label>
                  <Input 
                    id="tenantUnit" 
                    placeholder="101" 
                    value={newTenant.unitNumber}
                    onChange={(e) => setNewTenant({ ...newTenant, unitNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddTenant} 
                disabled={isAddingTenant}
              >
                {isAddingTenant && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Tenant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}