import theme from './theme/theme.json';
import Color from 'color';

export const ACTION = {
  DATASOURCE: {
    ERROR:         'DATASOURCE_ERROR',
    LOADING:       'DATASOURCE_LOADING',
    SET_DASHBOARDS:'DATASOURCE_SET_DASHBOARDS', 
    SET_DASHBOARD: 'DATASOURCE_SET_DASHBOARD',
    SET_NAMES:     'DATASOURCE_SET_NAMES',
    SET_DATA:      'DATASOURCE_SET_DATA',
    SET_RANGE:     'DATASOURCE_SET_RANGE'
  }
};

export const API_URL = '';

const primary = theme.colors['brand-primary'];
const gradient = [primary];
const gradientSteps = 4;
for(var i = 1; i < gradientSteps; i++) {
  gradient.push(new Color(primary).lighten((i/gradientSteps)).toString())
}

export const COLORS = {
  BLUE: primary,
  GRADIENT_BLUE: gradient,
  GRAY: '#ccc'
}

export const NOW = new Date();
export const ONE_DAY = 1000 * 60 * 60 * 24;
