import apiClient from './api';
import type { IApiResponse } from '../types/auth';

export interface IGraphNode {
  id: string;
  label: string;
  type: 'lead' | 'company' | 'source' | 'referrer' | 'source-factor' | 'recency-factor' | 'engagement-factor';
  group: string;
  size: number;
  score?: number;
  email?: string;
  phone?: string;
  // Canvas physics coordinates populated by layout simulation
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number; // Fixed/locked coordinates on drag
  fy?: number;
}

export interface IGraphEdge {
  id?: string;
  from: string;
  to: string;
  label?: string;
  weight: number;
  type?: 'positive' | 'negative' | 'neutral';
  // Populated objects by the canvas layout engine
  source?: IGraphNode;
  target?: IGraphNode;
}

export interface INetworkGraphData {
  nodes: IGraphNode[];
  edges: IGraphEdge[];
}

export interface IScoreInfluencerData {
  scoreBreakdown: {
    sourceScore: number;
    engagementScore: number;
    recencyScore: number;
    calculatedScore: number;
  };
  nodes: IGraphNode[];
  edges: IGraphEdge[];
}

export const graphService = {
  async getNetworkGraph(): Promise<INetworkGraphData> {
    const response = await apiClient.get<IApiResponse<INetworkGraphData>>('/analytics/network-graph');
    return response.data.data!;
  },

  async getScoreInfluencer(leadId: string): Promise<IScoreInfluencerData> {
    const response = await apiClient.get<IApiResponse<IScoreInfluencerData>>(`/analytics/score-influencer/${leadId}`);
    return response.data.data!;
  },
};
