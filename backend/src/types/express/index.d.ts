// In backend/src/types/express/index.d.ts

// Define the type of the user property we want to add to the Request object
interface UserPayload {
    id: string;
    username: string;
    role: string;
  }
  
  // Use 'declare namespace' to tell TypeScript we want to merge into the existing Express namespace
  declare namespace Express {
    export interface Request {
      user?: UserPayload;
    }
  }