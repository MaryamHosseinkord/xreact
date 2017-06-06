# xreact

> formerly know as react-most, renamed so because mostjs is not madatory anymore.

[![Join the chat at https://gitter.im/jcouyang/xreact](https://badges.gitter.im/jcouyang/xreact.svg)](https://gitter.im/jcouyang/xreact?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A Functional Reactive State Wrapper for React Components

[![CircleCI](https://circleci.com/gh/reactive-react/xreact.svg?style=svg)](https://circleci.com/gh/reactive-react/xreact)
[![codecov](https://codecov.io/gh/reactive-react/xreact/branch/master/graph/badge.svg)](https://codecov.io/gh/reactive-react/xreact)
[![npm](https://img.shields.io/npm/dm/xreact.svg)](https://www.npmjs.com/package/xreact)
[![npm](https://img.shields.io/npm/v/xreact.svg)](https://www.npmjs.com/package/xreact)
[![greenkeeper.io](https://badges.greenkeeper.io/reactive-react/xreact.svg)](https://greenkeeper.io)


[中文 :cn:](https://github.com/reactive-react/xreact/wiki/%E6%95%99%E7%A8%8B)

## Install
```
npm install xreact --save
# or
yarn add xreact
```

## What
`xreact` is a lightweight Higher Order State Component for React. 

Data flow in `xreact` is simple and unidirectional, similar to flux.

![](https://www.evernote.com/l/ABcSUEkq5_xPTrWy_YdF5iM1Fxu14WMB7eAB/image.png)

## Terminology
- **Machine**: a machine can emit `Update` to a timeline `update$`, and can be operated by calling function in `actions`
- **Plan**: a Plan is a function that describe how to create a `Machine`
- **Update**: a function of `currentState -> nextState` 
- **Action**: a function that create instance of `Intent`
- **Intent**: describe what you want to do
- **Intent Stream**: a timeline of every `Intent` created by every `Action`

## Quick Start

sorry we don't have a **book** to document how to use `xreact`, and I don't really need to,
there's only 3 things you should notice when using `xreact`, I'll explain by a simple counter app.

Also, you can refer more documents here:

- various [Examples](https://github.com/reactive-react/xreact/wiki/examples)
- simple [API](https://github.com/reactive-react/xreact/wiki/api)
- [Best Practices](https://github.com/reactive-react/xreact/wiki/frp-best-practice)
- [Wiki](https://github.com/reactive-react/xreact/wiki)


### 1. Define a simple stateless View component

![](https://www.evernote.com/l/ABd-YTQc2FVBjqOEkpiFZDltPloti8a2Hq8B/image.png)

```html
const CounterView = ({actions, count}) => (
  <div>
    <button onClick={actions.dec}>-</button>
    <span>{count}</span>
    <button onClick={actions.inc}>+</button>
  </div>
)
```

every View component expected a `actions` fields in `props`

### 2. Define a `Plan`

![](https://www.evernote.com/l/ABeLlbr3vQNM_JKfcd_W4zfW262lxWJhOsMB/image.png)

After we have a pretty view for represention and inteacting interface, we can define how to update the view, or "how to react on actions". In such case:

1. A counter can have actions of `inc` and `dec`, which will send `Intent` of `{type: 'inc'}` or `{type:'dec'}` to `Intent Stream` upon being called.
2. A counter reactively generates `Update` when it receives an `Intent` of either type `inc` or `dec`.

```js
const plan = (intent$) => {
  return {
    update$: intent$.map(intent => {
      switch (intent.type) {
        case 'inc':
          return state => ({ count: state.count + 1 });
        case 'dec':
          return state => ({ count: state.count - 1 });
        default:
          return _ => _;
      }
    }),
    actions: {
      inc: () => ({ type: 'inc' }),
      dec: () => ({ type: 'dec' })
    }
  }
}
```
a `Plan` will take `intent$`(Intent Stream) and return a `Machine`.

a `Machine` defines

- how you can act on the machine 
- how the machine will react on intents.

### 3. Plan X View

![](https://www.evernote.com/l/ABdv2Ks5f7dNQKxyoz7Q1eB9Xm9vy3U11ZMB/image.png)

```js
import {render} from 'react-dom'
import X, {x} from 'xreact/lib/x'
import * as rx from 'xreact/lib/xs/rx'

const Counter = x(plan)(CounterView)

render(
  <X x={rx}>
    <Counter />
  </X>,
  document.getElementById('app')
);
```

## Features
Inspired by Redux and Functional Reactive Programming, `xreact` allows you to model user events, actions, and data as reactive streams.  Now you can map, filter, compose, and subscribe those streams into your application's state.

### Purely Functional, Declarative, and Monadic
In imperatively written code, you describe step-by-step how to process data.  With `xreact`, we simply define data transformations, then compose them to form our data flow. There are no variables, no intermediate state, and no side effects in your data flow's data composition!

### Typesafe and scalable
Rewritten in Typescript, and abstract Stream as Higher Kind type so easier to bring new FRP lib to integrete with xreact.

### Composable and Reusable `Plan`
In Redux, reducers' use of `switch` statements can make them difficult to compose. Unlike reducers, the function `x` return is simply a function which can easily compose.


```js
const countBy1 = connect(plan1)
const countBy2 = connect(plan2)
const Counter = countBy1(countBy2(CounterView))
// or
const counterable = compose(countBy1, countBy2)
const Counter = counterable(CounterView)
```

what really happen behind compose is actually ES6 style mixin, so there won't be any extra layer of HoC and no any performance overhead.
### Easy to test, no need for mocks
Because UI and UI behavior are loosely coupled, you can test a React component by just passing it data. Behaviors can be tested by calling actions and then verifying the state.

```js
import {mount} from 'enzyme'
import * as rx from 'xreact/lib/xs/rx'
import {rx as xtest} from 'xreact/lib/xtests'
const mountx = compose(mount, c => React.createFactory(X)({ x: rx }, c))

let counterX = mountx(
  <Counter />
)
          
let counter = counterX.find(Counter).getNode()
let counterView = counterX.find(CounterView)
let actions = counterView.prop('actions')
it('add intent to intent$ and go through sink$', () => {
  return new xtest
    .do([
      actions.inc,
      actions.inc,
      actions.inc,
    ])
    .collect(counter)
    .then(state => expect(state.count).toBe(3))
})

```

see more details about testing examples at [todomvc example](https://github.com/reactive-react/xreact/blob/master/src/__tests__/xtest.tsx)

### Async actions made easy
Asynchronous functions, such as Promises, can be converted to a stream and then flat-mapped.

```js
intent$.map(promise => most.fromPromise(promise))
	.flatMap(value => /* use the results */)
```

### Transducers support
[Transducer](https://github.com/cognitect-labs/transducers-js) is another high-performance, functional way to compose non-monadic data flows.

Writing actions as transducers can improve reusability and readability.

### Higher level extract and ready for any FRP library
xreact came with 2 FRP libs of choice, rxjs and mostjs, for any new lib you only need to implement the `StaticStream` with your prefered lib as Higher Kind Type.

## [More Documents...](https://github.com/jcouyang/xreact/wiki)

## FAQ

### How it's different from redux?

unlike redux, xreact turn FRP to 11 in react, it model problem different

- "global" intent stream(using redux's word should be intent store) not global state store
- there's not such thing as state store, no state will store anywhere, only state transformations
- FRP lib as your choice, choose any lib your familiar with

### How it's different from cycle.js?

think xreact as a more specify and optimized cycle just for react.

### Why not global state?
global is state is not scalable, think it as a database, and every component query data from it,however, database are hard to scale, design and maintain.

instead of making state global, we think a better choice of doing such reversely, just have what you want to do(intent) globally instead. So, every component can just broadcast what it's trying to do, but only focus on how to reduce intent into a state transformation for it self.

In this case, one component won't need worry about how the global state structure, and just focus on itself. So, components are more modular and decoupled.

Furher more, it's composable, we can build small x component constructors and compose them at will to create a bigger and powerfult component constructors. It's much easier and flexible by compose small behavior and state into a big component, not destruct a big global state into small components.

## Thanks to...
- [rxjs](https://github.com/ReactiveX/rxjs)
- [most](https://github.com/cujojs/most)
- [React](http://facebook.github.io/react/)
- [redux](https://github.com/rackt/redux)
- [Om](https://github.com/omcljs/om)
- [Cycle](http://cycle.js.org/)
- [transdux](https://github.com/jcouyang/transdux)
