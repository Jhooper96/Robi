import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Property, InsertProperty } from "@shared/schema";
import MainLayout from "@/components/layout/MainLayout";
import { getProperties } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
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
  Building, 
  Plus, 
  Loader2, 
  MapPin,
  Users,
  CalendarDays,
  Pencil,
  Home,
  LayoutDashboard 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Properties() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newProperty, setNewProperty] = useState({
    name: "",
    address: ""
  });

  // Fetch properties
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: getProperties
  });

  // Handle adding a new property (not fully implemented yet)
  const handleAddProperty = () => {
    // Validation
    if (!newProperty.name.trim() || !newProperty.address.trim()) {
      toast({
        title: "Please fill all fields",
        description: "Property name and address are required",
        variant: "destructive"
      });
      return;
    }

    // This would be replaced with an actual API call in a complete implementation
    toast({
      title: "Not implemented",
      description: "Adding properties will be available in a future update",
    });
    
    setIsAddDialogOpen(false);
    setNewProperty({ name: "", address: "" });
  };

  // Handle viewing property details (not fully implemented yet)
  const handleViewProperty = (propertyId: number) => {
    toast({
      title: "Feature coming soon",
      description: "Detailed property view will be available in a future update",
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Building className="mr-2 h-6 w-6 text-primary" />
              Properties
            </h1>
            <p className="text-muted-foreground">Manage your rental properties and view tenant information</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center text-muted-foreground mb-4">
                No properties found. Add your first property to get started.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property: Property) => (
              <Card key={property.id} className="overflow-hidden">
                <CardHeader className="bg-primary/5 pb-4">
                  <CardTitle className="flex items-center">
                    <Home className="mr-2 h-5 w-5 text-primary" />
                    {property.name}
                  </CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                    {property.address}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <Users className="mr-1 h-4 w-4 text-slate-500" />
                        <span>4 Tenants</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CalendarDays className="mr-1 h-4 w-4 text-slate-500" />
                        <span>Added {property.createdAt ? new Date(property.createdAt).toLocaleDateString() : 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-md text-center">
                        <span className="block text-2xl font-bold text-green-600">0</span>
                        <span className="text-xs text-green-600">Active Requests</span>
                      </div>
                      <div className="bg-red-50 p-4 rounded-md text-center">
                        <span className="block text-2xl font-bold text-red-600">0</span>
                        <span className="text-xs text-red-600">Emergencies</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2 pb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewProperty(property.id)}
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewProperty(property.id)}
                  >
                    <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
                    Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Add Property Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Property</DialogTitle>
              <DialogDescription>
                Add details about your rental property below
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="propertyName">Property Name</Label>
                <Input 
                  id="propertyName" 
                  placeholder="Sunset Apartments" 
                  value={newProperty.name}
                  onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyAddress">Property Address</Label>
                <Input 
                  id="propertyAddress" 
                  placeholder="123 Main St, City, State 12345" 
                  value={newProperty.address}
                  onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddProperty}>
                Add Property
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}