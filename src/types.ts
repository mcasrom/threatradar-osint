/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ThreatAlert {
  id: string;
  timestamp: string;
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  country: string;
  countryCode: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  attackType: string;
  payload?: string;
  latitude: number;
  longitude: number;
  intensity: number;
}

export interface SecurityReport {
  id: string;
  organization: string;
  infrastructure: string;
  timestamp: string;
  score: number;
  executiveSummary: string;
  vulnerabilities: string[];
  recommendedQueries: string[];
  remediationSteps: string[];
}

export interface OSINTModule {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'active' | 'inactive';
  commandTemplate: string;
  outputFormat: 'json' | 'text' | 'table';
}

export interface LogReport {
  id: string;
  date: string;
  period: 'daily' | 'weekly' | 'monthly';
  totalAlerts: number;
  criticalCount: number;
  analysisText: string;
  recipientsCount: number;
}
