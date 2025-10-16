"use client";

import { useUser } from "@/hooks/use-user";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCollection } from "@/firebase/firestore/use-collection";
import { collection, query, where, orderBy, Query } from "firebase/firestore";
import { initializeFirebase, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Order } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

const { firestore } = initializeFirebase();

export default function OrdersPage() {
  const { user, userData, isLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router, toast]);

  const ordersQuery = useMemoFirebase(() => {
    if (!user || !userData) return null;

    const baseQuery = collection(firestore, "orders");
    
    if (userData.role === 'admin') {
      return query(baseQuery, orderBy("createdAt", "desc"));
    }
    
    if (userData.role === 'shop_owner') {
        // This is simplified. A real implementation would query based on sellerId in items.
        // For now, we show all orders to a shop owner for demo purposes.
        return query(baseQuery, orderBy("createdAt", "desc"));
    }
    
    // Default to student
    return query(baseQuery, where("userId", "==", user.uid), orderBy("createdAt", "desc"));
  }, [user, userData]);

  const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery as Query<Order> | null);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
      case 'delivered':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'shipped':
        return 'outline';
      case 'cancelled':
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };


  if (isLoading || isLoadingOrders) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
        <Card>
          <CardHeader className="px-7">
            <CardTitle>My Orders</CardTitle>
            <CardDescription>
              View your order history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Order Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders && orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id}</TableCell>
                      <TableCell>
                        {order.createdAt ? format(order.createdAt.toDate(), 'PPP') : 'N/A'}
                      </TableCell>
                      <TableCell>PKR {order.totalAmount}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(order.paymentStatus)} className={order.paymentStatus === 'paid' ? 'bg-green-500' : ''}>
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                         <Badge variant={getStatusVariant(order.orderStatus)} className={order.orderStatus === 'delivered' ? 'bg-green-500' : ''}>
                          {order.orderStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      You haven't placed any orders yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </DashboardLayout>
  );
}
