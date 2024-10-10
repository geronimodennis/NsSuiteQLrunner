import SuiteQLRunner from './SuiteQLRunner';

export const run = (context) => {
  context.setLayout('application');
  context.setContent(<SuiteQLRunner />);
};

