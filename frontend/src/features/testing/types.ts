export interface TestCase {
  id: string;
  title: string;
  steps: string;
  expected: string;
  status: 'Passed' | 'Failed' | 'Untested' | 'Blocked';
  assignedTo: string;
}