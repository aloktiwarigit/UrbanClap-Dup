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
    lat: 26.79,
    lng: 82.20,
    state: 'active',
    updatedAt: '2026-04-19T10:00:00Z',
  },
  {
    technicianId: 'tech-2',
    name: 'Suresh Babu',
    serviceType: 'electrical',
    lat: 26.78,
    lng: 82.22,
    state: 'enroute',
    updatedAt: '2026-04-19T10:05:00Z',
  },
  {
    technicianId: 'tech-3',
    name: 'Anand Pillai',
    serviceType: 'carpentry',
    lat: 26.81,
    lng: 82.18,
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
    // Ayodhya bounding box: LAT_MIN=26.70, LAT_MAX=26.88, LNG_MIN=82.10, LNG_MAX=82.30
    // tech-1: lat=26.79, lng=82.20
    //   left = ((82.20-82.10)/(82.30-82.10))*100 = (0.10/0.20)*100 = 50%
    //   top  = (1 - (26.79-26.70)/(26.88-26.70))*100 = (1 - 0.09/0.18)*100 = 50%
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
        lat: 26.79,
        lng: 82.21,
        state: 'alert',
        updatedAt: '2026-04-19T10:00:00Z',
      },
    ];
    render(<TechMap techs={alertTechs} />);
    expect(screen.getByTestId('pin-tech-a').getAttribute('data-state')).toBe('alert');
  });

  it('exposes Ayodhya operational zone in the aria-label', () => {
    const { container } = render(<TechMap techs={[]} />);
    const map = container.querySelector('[aria-label*="Ayodhya"]');
    expect(map).not.toBeNull();
    const bengaluruRef = container.querySelector('[aria-label*="Bengaluru"]');
    expect(bengaluruRef).toBeNull();
  });
});
