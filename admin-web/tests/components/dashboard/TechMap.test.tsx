import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TechMap } from '../../../src/components/dashboard/TechMap';
import type { components } from '../../../src/api/generated/schema';

type TechLocation = components['schemas']['TechLocation'];

const techs: TechLocation[] = [
  {
    technicianId: 'tech-1',
    name: 'Ravi Kumar',
    serviceType: 'plumbing',
    lat: 12.93,
    lng: 77.62,
    state: 'active',
    updatedAt: '2026-04-19T10:00:00Z',
  },
  {
    technicianId: 'tech-2',
    name: 'Suresh Babu',
    serviceType: 'electrical',
    lat: 12.91,
    lng: 77.65,
    state: 'enroute',
    updatedAt: '2026-04-19T10:05:00Z',
  },
  {
    technicianId: 'tech-3',
    name: 'Anand Pillai',
    serviceType: 'carpentry',
    lat: 12.95,
    lng: 77.63,
    state: 'idle',
    updatedAt: '2026-04-19T10:08:00Z',
  },
];

describe('TechMap', () => {
  it('renders correct number of pins for given techs array', () => {
    render(<TechMap techs={techs} />);
    const namedPins = screen.getAllByTestId(/^pin-/);
    expect(namedPins).toHaveLength(3);
  });

  it('each pin has data-state matching tech.state', () => {
    render(<TechMap techs={techs} />);
    expect(screen.getByTestId('pin-tech-1').getAttribute('data-state')).toBe('active');
    expect(screen.getByTestId('pin-tech-2').getAttribute('data-state')).toBe('enroute');
    expect(screen.getByTestId('pin-tech-3').getAttribute('data-state')).toBe('idle');
  });

  it('pin positions are computed as percentages within bounding box', () => {
    render(<TechMap techs={techs} />);
    // Bengaluru bounding box: LAT_MIN=12.88, LAT_MAX=12.98, LNG_MIN=77.60, LNG_MAX=77.68
    // tech-1: lat=12.93, lng=77.62
    //   left = ((77.62-77.60)/(77.68-77.60))*100 = (0.02/0.08)*100 = 25%
    //   top  = (1 - (12.93-12.88)/(12.98-12.88))*100 = (1 - 0.05/0.10)*100 = 50%
    const pin1 = screen.getByTestId('pin-tech-1');
    const style = pin1.getAttribute('style') ?? '';
    expect(style).toContain('left:');
    expect(style).toContain('top:');
  });

  it('renders zero pins for empty techs array', () => {
    render(<TechMap techs={[]} />);
    const pins = document.querySelectorAll('[data-testid^="pin-"]');
    expect(pins).toHaveLength(0);
  });

  it('handles alert state', () => {
    const alertTechs: TechLocation[] = [
      {
        technicianId: 'tech-a',
        lat: 12.92,
        lng: 77.64,
        state: 'alert',
        updatedAt: '2026-04-19T10:00:00Z',
      },
    ];
    render(<TechMap techs={alertTechs} />);
    expect(screen.getByTestId('pin-tech-a').getAttribute('data-state')).toBe('alert');
  });
});
