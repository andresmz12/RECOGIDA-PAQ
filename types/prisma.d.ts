declare module "@prisma/client" {
  export enum Role {
    CUSTOMER = "CUSTOMER",
    ADMIN = "ADMIN",
    DISPATCHER = "DISPATCHER",
    COURIER = "COURIER",
  }

  export enum PickupStatus {
    PENDING = "PENDING",
    ASSIGNED = "ASSIGNED",
    SCHEDULED = "SCHEDULED",
    PICKED_UP = "PICKED_UP",
    CANCELLED = "CANCELLED",
  }

  export interface User {
    id: string;
    email: string;
    password: string | null;
    name: string;
    phone: string | null;
    role: Role;
    createdAt: Date;
  }

  export interface PickupRequest {
    id: string;
    trackingCode: string;
    userId: string | null;
    contactName: string;
    contactPhone: string;
    contactEmail: string | null;
    pickupAddress: string;
    pickupCity: string;
    pickupCountry: string;
    destinationCountry: string;
    packageType: string;
    estimatedWeight: number | null;
    dimensions: string | null;
    preferredDate: Date;
    preferredTimeWindow: string;
    specialInstructions: string | null;
    status: PickupStatus;
    assignedCourierId: string | null;
    createdAt: Date;
    updatedAt: Date;
    user?: User | null;
    assignedCourier?: User | null;
    statusHistory?: StatusHistory[];
  }

  export interface StatusHistory {
    id: string;
    pickupRequestId: string;
    fromStatus: PickupStatus | null;
    toStatus: PickupStatus;
    changedById: string | null;
    notes: string | null;
    createdAt: Date;
  }

  export class PrismaClient {
    constructor(options?: any);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    user: {
      create(data: any): Promise<User>;
      findUnique(query: any): Promise<User | null>;
      findMany(query?: any): Promise<User[]>;
      update(query: any): Promise<User>;
      delete(query: any): Promise<User>;
    };
    pickupRequest: {
      create(data: any): Promise<PickupRequest>;
      findUnique(query: any): Promise<PickupRequest | null>;
      findMany(query?: any): Promise<PickupRequest[]>;
      count(query?: any): Promise<number>;
      update(query: any): Promise<PickupRequest>;
      delete(query: any): Promise<PickupRequest>;
    };
    statusHistory: {
      create(data: any): Promise<StatusHistory>;
      findMany(query?: any): Promise<StatusHistory[]>;
    };
  }
}
