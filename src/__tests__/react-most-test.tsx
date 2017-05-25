import * as React from 'react';
import ReactDOM from 'react-dom';
import * as TestUtils from 'react-addons-test-utils';
import '@reactivex/rxjs'
import X, { x } from '../../src/x';
import * as RX from '../../src/engine/rx'
import { StaticStream } from '../../src/engine'
const compose = f => g => x => g(f(x));

const CounterView: React.SFC<any> = props => (
  <div>
    <span className="count">{props.count}</span>
    <span className="wrapperProps">{props.wrapperProps}</span>
    <span className="overwritedProps">{props.overwritedProps}</span>
  </div>
)

CounterView.defaultProps = { count: 0, overwritedProps: 'inner' }
interface Intent {
  type: string
  value?: any
}
const counterWrapper = x<RX.URI, any, any>((intent$) => {
  return {
    update$: intent$.map((intent: Intent) => {
      switch (intent.type) {
        case 'inc':
          return state => ({ count: state.count + 1 })
        case 'dec':
          intent$.next({ type: 'abs' })
          return state => ({ count: state.count - 1 })
        case 'abs':
          return state => ({ count: Math.abs(state.count) })
        case 'changeWrapperProps':
          return state => ({
            wrapperProps: intent.value,
            overwritedProps: intent.value
          })
        case 'changeDefaultProps':
          return state => ({ count: intent.value })
        default:
          return state => state
      }
    }),
    actions: {
      inc: () => ({ type: 'inc' }),
      dec: () => ({ type: 'dec' }),
      changeWrapperProps: (value) => ({ type: 'changeWrapperProps', value }),
      changeDefaultProps: (value) => ({ type: 'changeDefaultProps', value }),
    }
  }
})
let XX = x => React.createFactory(X)({ engine: RX }, x)

function Test(initState) {
  this.plans = 0
  this.things = []
  this.initState = initState
}
Test.prototype.plan = function(n) {
  this.plans = n
  return this
}
Test.prototype.do = function(things) {
  this.things = things
  return this
}
Test.prototype.collect = function(component) {
  let latestState = component.machine.update$
    .scan((cs, f) => f.call(null, cs), this.initState)
    .take(this.plans).toPromise()
  this.things.forEach(f => f())
  return latestState
}
const Counter = counterWrapper(CounterView)
describe('X', () => {
  describe('actions', () => {
    let counterWrapper, counter, t
    beforeEach(() => {
      counterWrapper = TestUtils.renderIntoDocument(
        XX(<Counter />)
      )
      counter = TestUtils.findRenderedComponentWithType(counterWrapper, Counter)

    })
    t = new Test({ count: 0 });
    it('add intent to intent$ and go through sink$', () => {
      return t.plan(3)
        .do([
          counter.machine.actions.inc,
          counter.machine.actions.inc,
          counter.machine.actions.inc
        ])
        .collect(counter)
        .then(x => expect(x.count).toBe(3))
    })

    it('async action', () => {
      return t.plan(3)
        .do([
          counter.machine.actions.inc,
          () => counter.machine.actions.fromEvent({ type: 'inc' }),
          () => counter.machine.actions.fromPromise(Promise.resolve({ type: 'inc' }))
        ])
        .collect(counter)
        .then(state => expect(state.count).toBe(3))
    })

    it('update can also generate new intent', () => {
      return new Test({ count: -3 }).plan(3)
        .do([
          counter.machine.actions.dec
        ]).collect(counter)
        .then(state => expect(state.count).toBe(2))
    })

    it('props will overwirte components default props', () => {
      counterWrapper = TestUtils.renderIntoDocument(
        XX(<Counter count={9} />)
      )
      counter = TestUtils.findRenderedComponentWithType(counterWrapper, Counter)
      return new Test(counter.props).plan(1)
        .do([
          counter.machine.actions.inc
        ]).collect(counter)
        .then(state => expect(state.count).toBe(10))
    })

    // it('props that not overlap with views defaultProps can not be changed', () => {
    //   let CounterWrapper = React.createClass({
    //     getInitialState() {
    //       return {
    //         wrapperProps: 'heheda',
    //         overwritedProps: 'hoho',
    //         count: 0,
    //       }
    //     },
    //     render() {
    //       return <Counter
    //         count={this.state.count}
    //         wrapperProps={this.state.wrapperProps}
    //         overwritedProps={this.state.overwritedProps}
    //         history={true} />
    //     }
    //   })
    //   let counterMostWrapper = TestUtils.renderIntoDocument(
    //     <Most engine={Engine}>
    //       <CounterWrapper />
    //     </Most>
    //   )
    //   let counterWrapper = TestUtils.findRenderedComponentWithType(counterMostWrapper, CounterWrapper)
    //   let counter = TestUtils.findRenderedComponentWithType(counterWrapper, Counter)
    //   counter.machine.actions.changeWrapperProps('miao')
    //   counter.machine.actions.changeDefaultProps(19)
    //   let wrapperProps = TestUtils.findRenderedDOMComponentWithClass(counter, 'wrapperProps')
    //   let overwritedProps = TestUtils.findRenderedDOMComponentWithClass(counter, 'overwritedProps')
    //   let count = TestUtils.findRenderedDOMComponentWithClass(counter, 'count')
    //   expect(counter.props.wrapperProps).toBe('heheda')
    //   expect(wrapperProps.textContent).toBe('miao')
    //   expect(overwritedProps.textContent).toBe('miao')
    //   expect(count.textContent).toBe('19')
    //   counterWrapper.setState({ overwritedProps: 'wrapper', count: 1 })
    //   overwritedProps = TestUtils.findRenderedDOMComponentWithClass(counter, 'overwritedProps')
    //   count = TestUtils.findRenderedDOMComponentWithClass(counter, 'count')
    //   expect(overwritedProps.textContent).toBe('wrapper')
    //   expect(count.textContent).toBe('1')
    // })
  });

  // describe('history', () => {
  //   it('can undo', () => {
  //     let counterWrapper = TestUtils.renderIntoDocument(
  //       <Most engine={Engine} >
  //         <Counter history={true} />
  //       </Most>
  //     )
  //     let counter = TestUtils.findRenderedComponentWithType(counterWrapper, Counter)
  //     counter.machine.actions.inc()
  //     counter.machine.actions.inc()
  //     counter.machine.actions.inc()
  //     let backward = TestUtils.findRenderedDOMComponentWithClass(counterWrapper, 'backward')
  //     TestUtils.Simulate.click(backward)
  //     TestUtils.Simulate.click(backward)
  //     TestUtils.Simulate.click(backward)
  //     let count = TestUtils.findRenderedDOMComponentWithClass(counterWrapper, 'count')
  //     expect(count.textContent).toBe('1')
  //     let forward = TestUtils.findRenderedDOMComponentWithClass(counterWrapper, 'forward')
  //     TestUtils.Simulate.click(forward)
  //     count = TestUtils.findRenderedDOMComponentWithClass(counterWrapper, 'count')
  //     expect(count.textContent).toBe('2')
  //     forward = TestUtils.findRenderedDOMComponentWithClass(counterWrapper, 'forward')
  //     TestUtils.Simulate.click(forward)
  //     TestUtils.Simulate.click(forward)
  //     count = TestUtils.findRenderedDOMComponentWithClass(counterWrapper, 'count')
  //     expect(count.textContent).toBe('3')
  //   })
  // })

  // describe('composable', () => {
  //   const counterWrapper2 = connect((intent$: Subject<Intent>) => {
  //     return {
  //       update$: intent$.map(intent => {
  //         switch (intent.type) {
  //           case 'inc2':
  //             return state => ({ count: state.count + 2 })
  //           case 'dec2':
  //             return state => ({ count: state.count - 2 })
  //           default:
  //             return state => state
  //         }
  //       }),
  //       actions: {
  //         inc2: () => ({ type: 'inc2' }),
  //         dec2: () => ({ type: 'dec2' }),
  //       }
  //     }
  //   })
  //   let counterWrapper21 = compose(counterWrapper2)(counterWrapper)
  //   const Counter2 = counterWrapper21(CounterView)
  //   //counterWrapper2(counterWrapper(CounterView))
  //   it('counter add inc2, dec2', () => {
  //     let counterWrapperr = TestUtils.renderIntoDocument(
  //       <Most engine={Engine}>
  //         <Counter2 history={true} />
  //       </Most>
  //     )
  //     let counterView = TestUtils.findRenderedComponentWithType(counterWrapperr, CounterView)
  //     let counter2 = TestUtils.findRenderedComponentWithType(counterWrapperr, Counter2)
  //     counterView.props.actions.inc()
  //     counterView.props.actions.inc2()
  //     counterView.props.actions.dec()
  //     expect(stateHistoryOf(counter2)[2].count).toBe(2)
  //   })
  // })

  // describe('convension default to `action` field in sinks', () => {
  //   const Counter = connect((intent$: Subject<Intent>) => {
  //     return {
  //       update$: intent$.map(intent => {
  //         switch (intent.type) {
  //           case 'inc3':
  //             return state => ({ count: state.count + 3 })
  //           default:
  //             return state => state
  //         }
  //       }),
  //       actions: {
  //         inc3: () => ({ type: 'inc3' })
  //       },
  //     }
  //   })(CounterView)

  //   it('counter inc 3', () => {
  //     let counterWrapper = TestUtils.renderIntoDocument(
  //       <Most engine={Engine}>
  //         <Counter history={true} />
  //       </Most>
  //     )
  //     let counter = TestUtils.findRenderedComponentWithType(counterWrapper, Counter)
  //     counter.machine.actions.inc3()
  //     counter.machine.actions.inc3()
  //     expect(stateHistoryOf(counter)[1].count).toBe(6)
  //   })
  // })

  // describe('ERROR', () => {
  //   const Counter = connect((intent$: Subject<Intent>) => {
  //     return {
  //       update$: intent$.map(intent => {
  //         switch (intent.type) {
  //           case 'exception':
  //             throw 'exception in reducer'
  //           case 'inc':
  //             return state => ({ count: state.count + 1 })
  //           default:
  //             return state => state
  //         }
  //       }),
  //       actions: {
  //         throwExeption: () => ({ type: 'exception' }),
  //       },
  //     }
  //   })(CounterView)

  //   it('should recover to identity stream and log exception', () => {
  //     spyOn(console, 'error')
  //     let counterWrapper = TestUtils.renderIntoDocument(
  //       <Most>
  //         <Counter history={true} />
  //       </Most>
  //     )
  //     let counter = TestUtils.findRenderedComponentWithType(counterWrapper, Counter)
  //     return run(intentStreamOf(counter),
  //       dispatch([{ type: 'exception' }], counter),
  //       [
  //         state => expect(console.error).toBeCalledWith('There is Error in your reducer:', 'exception in reducer', undefined)
  //       ])
  //   })

  //   it('should able to catch error in sync mode', () => {
  //     let counterWrapper = TestUtils.renderIntoDocument(
  //       <Most engine={Engine}>
  //         <Counter history={true} />
  //       </Most>
  //     )
  //     let counter = TestUtils.findRenderedComponentWithType(counterWrapper, Counter)
  //     expect(() => {
  //       counter.machine.actions.throwExeption()
  //     }).toThrow('exception in reducer')
  //   })
  // })

  // describe('unsubscribe when component unmounted', () => {
  //   it('unsubscribe', (done) => {
  //     const Counter = connect((intent$: Subject<Intent>) => {
  //       let incForever$ = most.periodic(100, { type: 'inc' }).map(intent => {
  //         done.fail('should not next intent any more')
  //         return _ => _
  //       })
  //       return {
  //         update$: intent$.map(intent => {
  //           switch (intent.type) {
  //             case 'inc':
  //               return state => ({ count: state.count + 1 })
  //             default:
  //               return state => state
  //           }
  //         }).merge(incForever$)
  //       }
  //     })(CounterView)

  //     const TogglableMount = React.createClass({
  //       getInitialState() {
  //         return {
  //           mount: true
  //         }
  //       },
  //       render() {
  //         return this.state.mount && <Counter history={true} />
  //       }
  //     })
  //     spyOn(console, 'error')
  //     let counterWrapper = TestUtils.renderIntoDocument(
  //       <Most engine={Engine}>
  //         <TogglableMount />
  //       </Most>
  //     )
  //     let toggle = TestUtils.findRenderedComponentWithType(counterWrapper, TogglableMount)
  //     let counter = TestUtils.findRenderedComponentWithType(counterWrapper, Counter)
  //     toggle.setState({ mount: false })
  //     done()
  //   })
  // })
})
