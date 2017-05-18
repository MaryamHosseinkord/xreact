import { Stream, Subscription } from 'most';
import { Subject } from 'most-subject';
import { Update } from '../interfaces';
export default class Engine<T, S> {
    intentStream: Subject<T>;
    historyStream: Subject<S>;
    travelStream: Subject<(n: number) => number>;
    constructor();
    observe(actionsSinks: Stream<Update<S>>, f: any, end: any): Subscription<S>;
}
