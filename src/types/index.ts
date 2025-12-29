export type SensorData = {
  id: number;
  temp: number;
  hum: number;
  createdAt: string;
};

export type Operator = {
  id: number;
  fullName: string;
  email: string;
};

export type Acknowledgment = {
  operator: Operator;
  acknowledged: boolean;
  ackTime?: string;
};

export type Comment = {
  id: number;
  operator: Operator;
  message: string;
  createdAt: string;
};

export type Incident = {
  id: number;
  maxTemperature: number;
  startTime: string;
  endTime?: string;
  acknowledgments: Acknowledgment[];
  comments: Comment[];
  alertCount?: number; // Add this - number of alerts sent
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  operatorId?: number;  // Made optional
  fullName?: string;     // Made optional
};

// Add a decoded token type
export type DecodedToken = {
  sub: string;  // email
  exp: number;
  iat: number;
};
