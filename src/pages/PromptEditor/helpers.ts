export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'production': return 'text-accent-success';
    case 'active': return 'text-accent-success';
    case 'validated': return 'text-blue-400';
    case 'testing': return 'text-amber-400';
    case 'failed': return 'text-accent-error';
    case 'archived': return 'text-text-muted';
    default: return 'text-text-muted';
  }
};
