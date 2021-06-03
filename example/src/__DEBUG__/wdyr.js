/// <reference types="@welldone-software/why-did-you-render" />

import React from 'react';
import * as bluevery from 'bluevery';

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackExtraHooks: [[bluevery, 'useBlueveryState']],
  });
}
