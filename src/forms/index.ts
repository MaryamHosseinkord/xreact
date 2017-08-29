import { pure } from '../fantasy'
import { Partial } from '../fantasy/interfaces'
import { HKTS, streamOps, HKT } from '../xs'
import { Update } from '../interfaces'
import { FantasyX } from '../fantasy/fantasyx'

export function xinput<
  E extends HKTS,
  I extends Event,
  S>(name: keyof S) {
  return pure<E, I, S>(intent$ => {
    return {
      update$:
      streamOps.map<string, Update<S>>(
        value => (state => ({ [name]: value }) as Partial<S>),
        streamOps.map<Event, string>(
          e => (e.target as HTMLFormElement).value,
          streamOps.filter<I>(i => {
            return i.type == 'change' && (i.target as HTMLFormElement).name == name
          }, (intent$ as HKT<I>[E])))
      )
    }
  })
}
