/// <reference types="react" />
import { Stream, Subscription } from 'most';
import * as React from 'react';
import { Subject } from 'most-subject';
import { Observable, Subject as RxSubject } from '@reactivex/rxjs';
import { Traveler } from './history';
export interface Actions<T> {
    [propName: string]: (...v: any[]) => T;
}
export interface Plan<I, S> {
    (intent: Subject<I> | RxSubject<I>, props?: {}): Machine<I, S>;
}
export interface Update<S> {
    (current: S): S;
}
export interface Machine<I, S> {
    actions?: Actions<I>;
    update$: Stream<Update<S>> | Observable<Update<S>>;
}
export interface ConnectProps<I> {
    actions?: Actions<I>;
    history?: boolean;
    [propName: string]: any;
}
export declare class Connect<I, S> extends React.PureComponent<ConnectProps<I>, S> {
    machine: Machine<I, S>;
    traveler: Traveler<S>;
    subscription: Subscription<S>;
}
export interface ConnectClass<I, S> {
    contextTypes?: any;
    defaultProps?: any;
    new (props?: ConnectProps<I>, context?: any): Connect<I, S>;
}
export interface History<S> {
    path: Subject<(n: number) => number>;
    history: Stream<S>;
}
export interface Stamp<S> {
    value: S;
    time: number;
}
