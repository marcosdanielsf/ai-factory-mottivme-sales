import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMetrics } from '../useMetrics';
import { UILead, UICampaign, UIPipelineCard } from '../useSupabaseData';

describe('useMetrics', () => {
  it('calculates total leads', () => {
    const leads: UILead[] = [
      {
        id: '1',
        name: 'John Doe',
        company: 'Company A',
        status: 'Available',
        channels: ['linkedin'],
        avatar: ''
      },
      {
        id: '2',
        name: 'Jane Smith',
        company: 'Company B',
        status: 'In Cadence',
        channels: ['email'],
        avatar: ''
      }
    ];

    const campaigns: UICampaign[] = [];
    const pipeline: UIPipelineCard[] = [];

    const { result } = renderHook(() => useMetrics(leads, campaigns, pipeline));

    const totalLeadsMetric = result.current.find(m => m.label === 'Total Leads');
    expect(totalLeadsMetric).toBeDefined();
    expect(totalLeadsMetric?.value).toBe('2');
  });

  it('calculates response rate', () => {
    const leads: UILead[] = [];

    const campaigns: UICampaign[] = [
      {
        id: '1',
        name: 'Campaign 1',
        type: 'connection',
        status: 'Active',
        leads: 100,
        responses: 30,
        meetings: 5,
        channels: ['linkedin']
      },
      {
        id: '2',
        name: 'Campaign 2',
        type: 'warm_up',
        status: 'Active',
        leads: 50,
        responses: 20,
        meetings: 3,
        channels: ['email']
      }
    ];

    const pipeline: UIPipelineCard[] = [];

    const { result } = renderHook(() => useMetrics(leads, campaigns, pipeline));

    const responseRateMetric = result.current.find(m => m.label === 'Response Rate');
    expect(responseRateMetric).toBeDefined();
    // (30 + 20) / (100 + 50) = 50 / 150 = 33.33% -> rounds to 33%
    expect(responseRateMetric?.value).toBe('33%');
  });

  it('returns correct format for UIMetric', () => {
    const leads: UILead[] = [
      {
        id: '1',
        name: 'Test Lead',
        company: 'Test Co',
        status: 'In Cadence',
        channels: ['linkedin'],
        avatar: ''
      }
    ];

    const campaigns: UICampaign[] = [];
    const pipeline: UIPipelineCard[] = [];

    const { result } = renderHook(() => useMetrics(leads, campaigns, pipeline));

    expect(result.current).toBeInstanceOf(Array);
    expect(result.current.length).toBeGreaterThan(0);

    result.current.forEach(metric => {
      expect(metric).toHaveProperty('label');
      expect(metric).toHaveProperty('value');
      expect(metric).toHaveProperty('change');
      expect(metric).toHaveProperty('trend');
      expect(metric).toHaveProperty('description');
      expect(['up', 'down']).toContain(metric.trend);
    });
  });

  it('calculates active cadences correctly', () => {
    const leads: UILead[] = [
      {
        id: '1',
        name: 'Lead 1',
        company: 'Company A',
        status: 'In Cadence',
        channels: ['linkedin'],
        avatar: ''
      },
      {
        id: '2',
        name: 'Lead 2',
        company: 'Company B',
        status: 'In Cadence',
        channels: ['email'],
        avatar: ''
      },
      {
        id: '3',
        name: 'Lead 3',
        company: 'Company C',
        status: 'Available',
        channels: ['linkedin'],
        avatar: ''
      }
    ];

    const campaigns: UICampaign[] = [];
    const pipeline: UIPipelineCard[] = [];

    const { result } = renderHook(() => useMetrics(leads, campaigns, pipeline));

    const activeCadencesMetric = result.current.find(m => m.label === 'Active Cadences');
    expect(activeCadencesMetric).toBeDefined();
    expect(activeCadencesMetric?.value).toBe('2');
  });

  it('calculates meetings scheduled correctly', () => {
    const leads: UILead[] = [];
    const campaigns: UICampaign[] = [];

    const pipeline: UIPipelineCard[] = [
      {
        id: '1',
        leadName: 'Lead 1',
        company: 'Company A',
        stage: 'Scheduled',
        value: 5000,
        channels: ['linkedin'],
        avatar: ''
      },
      {
        id: '2',
        leadName: 'Lead 2',
        company: 'Company B',
        stage: 'Scheduled',
        value: 10000,
        channels: ['email'],
        avatar: ''
      },
      {
        id: '3',
        leadName: 'Lead 3',
        company: 'Company C',
        stage: 'Won',
        value: 15000,
        channels: ['linkedin'],
        avatar: ''
      }
    ];

    const { result } = renderHook(() => useMetrics(leads, campaigns, pipeline));

    const meetingsMetric = result.current.find(m => m.label === 'Meetings');
    expect(meetingsMetric).toBeDefined();
    expect(meetingsMetric?.value).toBe('2');
  });

  it('calculates show rate correctly', () => {
    const leads: UILead[] = [];
    const campaigns: UICampaign[] = [];

    const pipeline: UIPipelineCard[] = [
      {
        id: '1',
        leadName: 'Lead 1',
        company: 'Company A',
        stage: 'Scheduled',
        value: 5000,
        channels: ['linkedin'],
        avatar: ''
      },
      {
        id: '2',
        leadName: 'Lead 2',
        company: 'Company B',
        stage: 'Scheduled',
        value: 10000,
        channels: ['email'],
        avatar: ''
      },
      {
        id: '3',
        leadName: 'Lead 3',
        company: 'Company C',
        stage: 'Won',
        value: 15000,
        channels: ['linkedin'],
        avatar: ''
      },
      {
        id: '4',
        leadName: 'Lead 4',
        company: 'Company D',
        stage: 'Won',
        value: 20000,
        channels: ['email'],
        avatar: ''
      }
    ];

    const { result } = renderHook(() => useMetrics(leads, campaigns, pipeline));

    const showRateMetric = result.current.find(m => m.label === 'Show-Rate');
    expect(showRateMetric).toBeDefined();
    // 2 won deals out of 4 total (2 scheduled + 2 won) = 50%
    expect(showRateMetric?.value).toBe('50%');
  });

  it('handles empty data gracefully', () => {
    const leads: UILead[] = [];
    const campaigns: UICampaign[] = [];
    const pipeline: UIPipelineCard[] = [];

    const { result } = renderHook(() => useMetrics(leads, campaigns, pipeline));

    expect(result.current).toBeInstanceOf(Array);
    expect(result.current.length).toBeGreaterThan(0);

    const totalLeadsMetric = result.current.find(m => m.label === 'Total Leads');
    expect(totalLeadsMetric?.value).toBe('0');

    const responseRateMetric = result.current.find(m => m.label === 'Response Rate');
    expect(responseRateMetric?.value).toBe('0%');
  });
});
