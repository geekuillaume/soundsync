const performance = typeof window === 'undefined' ? require('perf_hooks').performance : window.performance;

export const now = () => performance.now();
