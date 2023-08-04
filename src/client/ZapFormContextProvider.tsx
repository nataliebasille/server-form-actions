'use client';

import { createContext, type PropsWithChildren } from 'react';

type ZapFormContextProps = {
  errors?: any;
  data?: any;
};

const ZapFormContext = createContext<ZapFormContextProps | null>(null);

export const ZapFormContextProvider = ({
  errors,
  data,
  children,
}: PropsWithChildren<ZapFormContextProps>) => {
  return (
    <ZapFormContext.Provider value={{ errors, data }}>
      {children}
    </ZapFormContext.Provider>
  );
};

export const useZapFormContext = () => {
  if (!ZapFormContext) {
    throw new Error(
      'ZapFormContextProvider not found. Please add it to the component tree, usually by wrapping your form with <ZapForm />'
    );
  }
  return ZapFormContext;
};
