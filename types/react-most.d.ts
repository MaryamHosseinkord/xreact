/// <reference types="react" />
import * as React from 'react';
import { HKTS } from './engine';
import { Plan, ConnectClass, MostProps, ContextEngine, REACT_MOST_ENGINE } from './interfaces';
export { REACT_MOST_ENGINE };
export declare type ConnectOrReactComponent<E extends HKTS, I, S> = ConnectClass<E, I, S> | React.ComponentClass<any> | React.SFC<any>;
export declare function connect<E extends HKTS, I, S>(main: Plan<E, I, S>, opts?: {
    history: boolean;
}): (WrappedComponent: ConnectOrReactComponent<E, I, S>) => ConnectClass<E, I, S>;
export default class Most<E extends HKTS, I, H, S> extends React.PureComponent<MostProps<E>, S> {
    static childContextTypes: {
        [x: string]: any;
    };
    getChildContext(): ContextEngine<E, I, H>;
    render(): React.ReactElement<any>;
}
