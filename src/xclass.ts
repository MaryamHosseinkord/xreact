import * as React from 'react';
import { createElement as h } from 'react'
import { PropTypes } from 'prop-types';
import initHistory, { Traveler } from './history';
import { Plan, Connect, ConnectClass, ContextEngine, REACT_MOST_ENGINE, Update } from './interfaces'
import { StaticStream, HKTS, HKT } from './engine'

export const CONTEXT_TYPE = {
  [REACT_MOST_ENGINE]: PropTypes.object
};
function isSFC(Component: React.ComponentClass<any> | React.SFC<any>): Component is React.SFC<any> {
  return (typeof Component == 'function')
}

export function genNodeClass<E extends HKTS, I, S>(WrappedComponent: ConnectClass<E, I, S>, main: Plan<E, I, S>): ConnectClass<E, I, S> {
  return class ConnectNode extends WrappedComponent {
    static contextTypes = CONTEXT_TYPE
    static displayName = `Connect(${getDisplayName(WrappedComponent)})`
    constructor(props, context: ContextEngine<E, I, S>) {
      super(props, context);
      let engine = context[REACT_MOST_ENGINE]
      let { actions, update$ } = main(engine.intent$, props)
      this.machine = {
        update$: engine.operators.merge<Update<S>>(this.machine.update$, update$),
        actions: Object.assign({}, bindActions(actions, context[REACT_MOST_ENGINE].intent$, this), this.machine.actions)
      }
    }
  }
}
export function genLeafClass<E extends HKTS, I, S>(WrappedComponent: React.SFC<any> | React.ComponentClass<any>, main: Plan<E, I, S>, opts?): ConnectClass<E, I, S> {
  return class ConnectLeaf extends Connect<E, I, S> {
    static contextTypes: ContextEngine<E, I, S> = CONTEXT_TYPE
    static displayName = `Connect(${getDisplayName(WrappedComponent)})`
    defaultKeys: string[]
    constructor(props, context: ContextEngine<E, I, S>) {
      super(props, context);
      let engine = context[REACT_MOST_ENGINE]
      let { actions, update$ } = main(engine.intent$, props)
      this.machine = {
        actions: bindActions(actions, engine.intent$, this),
        update$: update$
      }
      this.defaultKeys = WrappedComponent.defaultProps ? Object.keys(WrappedComponent.defaultProps) : [];
      this.state = Object.assign(
        {},
        WrappedComponent.defaultProps,
        pick(this.defaultKeys, props)
      );
    }
    componentWillReceiveProps(nextProps) {
      this.setState(state => Object.assign({}, nextProps, pick(this.defaultKeys, state)));
    }
    componentDidMount() {
      this.subscription = this.context[REACT_MOST_ENGINE].operators.subscribe(
        this.machine.update$,
        action => {
          if (action instanceof Function) {
            this.setState((prevState, props) => {
              let newState = action.call(this, prevState, props);
              return newState;
            });
          } else {
            /* istanbul ignore next */
            console.warn(
              'action',
              action,
              'need to be a Function which map from current state to new state'
            );
          }
        },
        () => this.context[REACT_MOST_ENGINE].history$.complete(this.state)
      );
    }
    componentWillUnmount() {
      this.subscription.unsubscribe();
    }
    render() {
      if (isSFC(WrappedComponent)) {
        return h(
          WrappedComponent,
          Object.assign({}, opts, this.props, this.state, {
            actions: this.machine.actions,
            traveler: this.traveler
          })
        );
      } else {
        return h(
          WrappedComponent,
          Object.assign({}, opts, this.props, this.state, {
            actions: this.machine.actions,
            traveler: this.traveler
          })
        );
      }
    }
  }
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'X';
}
function bindActions(actions, intent$, self) {
  let _actions = {
    fromEvent(e, f = x => x) {
      return intent$.next(f(e));
    },
    fromPromise(p) {
      return p.then(x => intent$.next(x));
    },
  };

  for (let a in actions) {
    _actions[a] = (...args) => {
      return intent$.next(actions[a].apply(self, args));
    };
  }
  return _actions;
}
function pick(names, obj) {
  let result = {};
  for (let name of names) {
    if (obj[name]) result[name] = obj[name];
  }
  return result;
}
