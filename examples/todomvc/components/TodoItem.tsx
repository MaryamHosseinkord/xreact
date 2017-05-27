import * as React from 'react'
import * as classnames from 'classnames'
import TodoTextInput from './TodoTextInput'
import MainSection from './MainSection'
import { x } from 'xreact/lib/x'
import * as Most from 'xreact/lib/xs/most'
import * as Intent from '../intent'
import { Todo } from './interfaces'
import { just } from 'most'
import { identity as id } from 'ramda'
const TodoItemView = ({ todo, actions, index }) => {
  return <div className="view">
    <input className="toggle"
      type="checkbox"
      defaultChecked={todo.done}
      onChange={() => actions.done(index)} />
    <label onDoubleClick={() => actions.editing(todo.id)}>
      {todo.text}
    </label>
    <button className="destroy"
      onClick={() => actions.remove(todo.id)} />
  </div>
}

const TodoItem = props => {
  const { todo, actions, editing, index } = props
  const { edit } = actions
  let element = editing === todo.id ? <TodoTextInput text={todo.text}
    itemid={todo.id}
    editing={editing === todo.id}
    index={index}
  /> : <TodoItemView index={index} todo={todo} actions={actions} />

  return <li className={classnames({
    completed: todo.done,
    editing: editing === todo.id
  })}>{element}</li>
}

const intentWrapper = x<Most.URI, Intent.Intent<Todo>, {}>((intent$) => {
  return {
    update$: just(id),
    actions: {
      add: () => ({ kind: 'add' } as Intent.Add<Todo>),
      edit: (todo) => ({ kind: 'edit', todo } as Intent.Edit<Todo>),
      done: (index) => ({ kind: 'done', index } as Intent.Done),
      remove: (id) => ({ kind: 'delete', id } as Intent.Delete),
    }
  }
})
export default intentWrapper(TodoItem)
