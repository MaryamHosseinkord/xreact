import React from 'react'
import classnames from 'classnames'
import TodoTextInput from './TodoTextInput'
import MainSection from './MainSection'
import {connect} from 'react-most'
import Intent from '../intent'
const TodoItemView = ({todo, actions, index}) => {
  return <div className="view">
    <input className="toggle"
           type="checkbox"
           defaultChecked={todo.done}
           onChange={()=>actions.done(index)} />
    <label onDoubleClick={()=>actions.editing(todo.id)}>
      {todo.text}
    </label>
    <button className="destroy"
            onClick={() => actions.remove(todo.id)} />
  </div>
}

const TodoItem = props => {
  const { todo, actions, editing, index} = props
  const {edit} = actions
  let element = editing === todo.id ? <TodoTextInput text={todo.text}
                                                     itemid={todo.id}
                                                     editing={editing === todo.id}
                                                     index={index}
                />: <TodoItemView index={index} todo={todo} actions={actions}/>

  return <li className={classnames({
    completed: todo.done,
    editing: editing===todo.id
  })}>{element}</li>
}

const intentWrapper = connect(intent$ => {
  let reduceEditing$ = intent$.map(Intent.case({
    Editing: editing => state => ({editing}),
    _: ()=>_=>_
  }))
  return {
    reduceEditing$,
    editing: Intent.Editing,
    add: Intent.Add,
    edit: Intent.Edit,
    done: Intent.Done,
    remove: Intent.Delete,
  }
})
export default intentWrapper(TodoItem)
