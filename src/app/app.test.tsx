import * as React from 'react';
import { render } from '@testing-library/react';
import { expect } from 'chai';
import App from './app';

describe('<App>', () => {
  it('renders the Simplified Chinese calculator', () => {
    const { getByLabelText, getByText } = render(<App />);

    expect(getByText('技能与制作站')).to.exist;
    expect(getByText('原料')).to.exist;
    expect(getByText('产品')).to.exist;
    expect(getByLabelText('选择制作配方')).to.exist;
  });
});
