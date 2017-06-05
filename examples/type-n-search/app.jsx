import X, {x} from 'xreact'
import {render} from 'react-dom'
import * as React from 'react'
import * as most from 'most'
import * as rest from 'rest'
import * as MOST from 'xreact/lib/xs/most'

const GITHUB_SEARCH_API = 'https://api.github.com/search/repositories?q=';
const TypeNsearch = (props)=>{
  let {search} = props.actions
  let error = props.error||{}
  return <div>
    <input onChange={e=>search(e.target.value)}></input>
    <span className={"red " + error.className}>{error.message}</span>
    <ul>
      {props.results.map(item=>{
        return <li key={item.id}><a href={item.html_url}>{item.full_name} ({item.stargazers_count})</a></li>
  })}
    </ul>
  </div>
}
TypeNsearch.defaultProps = {
  results: []
}
const log = x=>console.log(x)
const MostTypeNSearch = x(function(intent$){
  let updateSink$ = intent$.filter(i=>i.type=='search')
                           .debounce(500)
                           .map(intent=>intent.value)
                           .filter(query=>query.length > 0)
                           .map(query=>GITHUB_SEARCH_API + query)
                           .map(url=>rest(url).then(resp=>({
                               type: 'dataUpdate',
                               value: resp.entity
                           })).catch(error=>{
                             console.error('API REQUEST ERROR:', error)
                             return {
                               type: 'dataError',
                               value: error.message
                             }
                           }))
                           .flatMap(most.fromPromise)
                           .filter(i=>i.type=='dataUpdate')
                           .map(data=>JSON.parse(data.value).items)
                           .map(items=>items.slice(0,10))
                           .map(items=>state=>({results: items}))
                           .flatMapError(error=>{
                             console.log('[CRITICAL ERROR]:', error);
                             return most.of({message:error.error,className:'display'})
                                        .merge(most.of({className:'hidden'}).delay(3000))
                                        .map(error=>state=>({error}))
                           })

  return {
    actions: {
      search: value=>({type:'search',value}),
    },
    update$: updateSink$
  }
})(TypeNsearch);

render(<X x={MOST}>
    <MostTypeNSearch/>
</X>, document.getElementById('app'));
